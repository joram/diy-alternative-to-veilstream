package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/veilstream/chinook-api/internal/auth"
	"github.com/veilstream/chinook-api/internal/config"
	"github.com/veilstream/chinook-api/internal/httpx"
	"github.com/veilstream/chinook-api/internal/query"
	"github.com/veilstream/chinook-api/internal/support"
)

type API struct {
	Pool    *pgxpool.Pool
	Sessions *auth.Store
	Cfg     config.Config
}

func (a *API) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/api/health", a.health)
	r.Get("/api/customers", a.listCustomers)
	r.Post("/api/auth/become/{id}", a.become)
	r.Post("/api/auth/admin", a.adminLogin)
	r.Post("/api/auth/logout", a.logout)
	r.Get("/api/auth/me", a.me)
	r.Get("/api/dashboard/profile", a.customerProfile)
	r.Get("/api/dashboard/invoices", a.customerInvoices)
	r.Get("/api/dashboard/invoices/{id}/lines", a.customerInvoiceLines)
	r.Post("/api/support/query", a.supportQuery)
	r.Post("/api/support/chat", a.supportChat)
	r.Get("/api/support/status", a.supportStatus)
	r.Get("/api/admin/customers", a.adminCustomers)
	r.Get("/api/admin/invoices", a.adminInvoices)
	r.Get("/api/admin/invoices/{id}/lines", a.adminInvoiceLines)
	r.Get("/api/admin/stats", a.adminStats)
	return r
}

func (a *API) health(w http.ResponseWriter, _ *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) listCustomers(w http.ResponseWriter, r *http.Request) {
	const listCustomersSQL = `
		SELECT customer_id, first_name, last_name, country, email
		FROM public.customer ORDER BY customer_id`
	logSQL("listCustomers", listCustomersSQL)
	rows, err := a.Pool.Query(r.Context(), listCustomersSQL)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	type row struct {
		CustomerID int    `json:"customer_id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		Country    string `json:"country"`
		Email      string `json:"email"`
	}
	var out []row
	for rows.Next() {
		var x row
		if err := rows.Scan(&x.CustomerID, &x.FirstName, &x.LastName, &x.Country, &x.Email); err != nil {
			httpx.Error(w, http.StatusInternalServerError, err.Error())
			return
		}
		out = append(out, x)
	}
	httpx.JSON(w, http.StatusOK, out)
}

func (a *API) become(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if id < 1 {
		httpx.Error(w, http.StatusBadRequest, "invalid customer id")
		return
	}
	viewMode := auth.ViewAsCustomer
	var body struct {
		Mode string `json:"mode"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.Mode == "" {
		body.Mode = r.URL.Query().Get("mode")
	}
	switch strings.ToLower(strings.TrimSpace(body.Mode)) {
	case "support":
		viewMode = auth.ViewAsSupport
	case "customer", "":
		viewMode = auth.ViewAsCustomer
	default:
		httpx.Error(w, http.StatusBadRequest, "mode must be customer or support")
		return
	}
	var exists int
	const becomeCheckSQL = `SELECT customer_id FROM public.customer WHERE customer_id = $1`
	logSQL("auth/become", becomeCheckSQL, id)
	if err := a.Pool.QueryRow(r.Context(), becomeCheckSQL, id).Scan(&exists); err != nil {
		httpx.Error(w, http.StatusNotFound, "customer not found")
		return
	}
	token := a.Sessions.CreateCustomer(id, viewMode)
	httpx.JSON(w, http.StatusOK, map[string]any{
		"token": token, "role": "customer", "customerId": id, "viewMode": viewMode,
	})
}

func (a *API) adminLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid json")
		return
	}
	if body.Password != a.Cfg.AdminPassword {
		httpx.Error(w, http.StatusUnauthorized, "invalid admin password")
		return
	}
	token := a.Sessions.CreateAdmin()
	httpx.JSON(w, http.StatusOK, map[string]any{"token": token, "role": "admin"})
}

func (a *API) logout(w http.ResponseWriter, r *http.Request) {
	a.Sessions.Delete(httpx.BearerToken(r))
	httpx.JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) me(w http.ResponseWriter, r *http.Request) {
	token := httpx.BearerToken(r)
	sess, ok := a.Sessions.Get(token)
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	out := map[string]any{"role": sess.Role, "customerId": nil, "viewMode": nil}
	if sess.Role == auth.RoleCustomer {
		out["customerId"] = sess.CustomerID
		out["viewMode"] = sess.ViewMode
	}
	httpx.JSON(w, http.StatusOK, out)
}

func (a *API) customerProfile(w http.ResponseWriter, r *http.Request) {
	sess, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleCustomer)
	if !ok {
		return
	}
	schema := customerDataSchema(sess)
	profileSQL := fmt.Sprintf(`SELECT * FROM %s.customer WHERE customer_id = $1`, schema)
	logSQL("dashboard/profile", profileSQL, sess.CustomerID)
	rows, err := a.Pool.Query(r.Context(), profileSQL, sess.CustomerID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	m, err := scanOne(rows)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "customer not found")
		return
	}
	httpx.JSON(w, http.StatusOK, m)
}

func (a *API) customerInvoices(w http.ResponseWriter, r *http.Request) {
	sess, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleCustomer)
	if !ok {
		return
	}
	schema := customerDataSchema(sess)
	invoicesSQL := fmt.Sprintf(`
		SELECT invoice_id, customer_id, invoice_date, billing_address, billing_city,
		       billing_state, billing_country, billing_postal_code, total
		FROM %s.invoice WHERE customer_id = $1 ORDER BY invoice_date DESC`, schema)
	logSQL("dashboard/invoices", invoicesSQL, sess.CustomerID)
	rows, err := a.Pool.Query(r.Context(), invoicesSQL, sess.CustomerID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	list, err := scanAll(rows)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

func (a *API) customerInvoiceLines(w http.ResponseWriter, r *http.Request) {
	sess, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleCustomer)
	if !ok {
		return
	}
	invoiceID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	if !a.invoiceOwned(r, sess.CustomerID, invoiceID) {
		httpx.Error(w, http.StatusNotFound, "invoice not found")
		return
	}
	masked := sess.ViewMode == auth.ViewAsSupport
	httpx.JSON(w, http.StatusOK, a.fetchInvoiceLines(r, invoiceID, masked))
}

func (a *API) supportStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleCustomer); !ok {
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"llmEnabled": a.Cfg.LLMEnabled(),
		"provider":   a.Cfg.LLMProvider,
		"model":      a.Cfg.LLMModel(),
		"baseUrl":    strings.TrimSuffix(a.Cfg.OpenAIBaseURL, "/v1"),
		"scopedSQL":  true,
	})
}

func (a *API) supportQuery(w http.ResponseWriter, r *http.Request) {
	sess, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleCustomer)
	if !ok {
		return
	}
	var body struct {
		SQL string `json:"sql"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid json")
		return
	}
	res, err := query.ExecuteCustomerReadOnly(
		r.Context(), a.Pool, sess.CustomerID, body.SQL,
		a.Cfg.MaxSQLLength, a.Cfg.MaxQueryRows, sess.ViewMode == auth.ViewAsSupport,
		query.ExecInfo{Source: "support/query", ViewMode: string(sess.ViewMode)},
	)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, res)
}

func (a *API) supportChat(w http.ResponseWriter, r *http.Request) {
	sess, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleCustomer)
	if !ok {
		return
	}
	var body struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid json")
		return
	}
	msg := strings.TrimSpace(body.Message)
	if msg == "" {
		httpx.Error(w, http.StatusBadRequest, "message is required")
		return
	}

	sqlText := msg
	var llmNote string
	querySource := "direct"
	if !support.IsDirectSQL(msg) {
		if canon, ok := support.CanonicalSQL(msg); ok {
			sqlText = canon
			querySource = "canonical"
		} else {
			querySource = "llm"
			raw, err := support.Chat(r.Context(), a.Cfg.LLMConfig(), nil, msg)
			if err != nil {
				httpx.Error(w, http.StatusBadGateway, "llm: "+err.Error())
				return
			}
			sqlText = support.ExtractSQL(raw)
			llmNote = raw
			if sqlText == "" {
				httpx.JSON(w, http.StatusOK, map[string]any{
					"reply":     raw,
					"toolsUsed": []string{},
				})
				return
			}
		}
	}

	chatPayload := func(extra map[string]any) map[string]any {
		out := map[string]any{
			"attemptedSql": sqlText,
			"querySource":  querySource,
		}
		for k, v := range extra {
			out[k] = v
		}
		return out
	}

	res, err := query.ExecuteCustomerReadOnly(
		r.Context(), a.Pool, sess.CustomerID, sqlText,
		a.Cfg.MaxSQLLength, a.Cfg.MaxQueryRows, sess.ViewMode == auth.ViewAsSupport,
		query.ExecInfo{Source: "support/chat", ViewMode: string(sess.ViewMode)},
	)
	if err != nil {
		errPayload := map[string]any{
			"reply":     friendlyQueryError(err),
			"error":     err.Error(),
			"toolsUsed": []string{"scoped_query"},
		}
		if res.ScopedSQL != "" {
			errPayload["scopedSql"] = res.ScopedSQL
		}
		httpx.JSON(w, http.StatusOK, chatPayload(errPayload))
		return
	}

	reply := formatQueryReply(res, llmNote)
	httpx.JSON(w, http.StatusOK, chatPayload(map[string]any{
		"reply":       reply,
		"toolsUsed":   []string{"scoped_query"},
		"queryResult": res,
	}))
}

func friendlyQueryError(err error) string {
	msg := err.Error()
	if strings.Contains(msg, "42P01") || strings.Contains(msg, "missing FROM-clause") {
		return "I couldn't run that question as written. Try rephrasing, or pick one of the suggested prompts below."
	}
	if strings.Contains(msg, "not allowed") || strings.Contains(msg, "must be joined") {
		return "That question needs a simpler query. Try asking about your invoices, total spending, or purchases."
	}
	return "That query could not be run safely. Try rephrasing your question."
}

func formatQueryReply(res query.Result, llmNote string) string {
	if res.RowCount == 0 {
		var b strings.Builder
		if llmNote != "" && !strings.Contains(strings.ToLower(llmNote), "select") {
			b.WriteString(strings.TrimSpace(llmNote))
			b.WriteString("\n\n")
		}
		b.WriteString("No rows matched your question.")
		return b.String()
	}

	if res.RowCount == 1 && len(res.Columns) == 1 {
		col := strings.ToLower(res.Columns[0])
		val := query.FormatCell(res.Rows[0][0])
		switch {
		case strings.Contains(col, "spent") || col == "total_spent":
			return fmt.Sprintf("You've spent $%s in total.", val)
		case col == "total" || strings.HasSuffix(col, "_total"):
			return fmt.Sprintf("Total: $%s", val)
		case strings.Contains(col, "count"):
			return fmt.Sprintf("Count: %s", val)
		}
	}

	var b strings.Builder
	if llmNote != "" && !strings.Contains(strings.ToLower(llmNote), "select") {
		b.WriteString(strings.TrimSpace(llmNote))
		b.WriteString("\n\n")
	}
	b.WriteString(fmt.Sprintf("Here are your results (%d row(s)):\n\n", res.RowCount))
	b.WriteString(strings.Join(res.Columns, " | "))
	b.WriteString("\n")
	for _, row := range res.Rows {
		parts := make([]string, len(row))
		for i, v := range row {
			parts[i] = query.FormatCell(v)
		}
		b.WriteString(strings.Join(parts, " | "))
		b.WriteString("\n")
	}
	if res.RowCount >= 200 {
		b.WriteString("\n(Results capped at 200 rows.)")
	}
	return b.String()
}