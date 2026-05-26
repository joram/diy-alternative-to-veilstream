package handlers

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/veilstream/chinook-api/internal/auth"
	"github.com/veilstream/chinook-api/internal/httpx"
)

func (a *API) adminCustomers(w http.ResponseWriter, r *http.Request) {
	if _, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleAdmin); !ok {
		return
	}
	const adminCustomersSQL = `
		SELECT c.*,
			COALESCE(stats.revenue, 0)::float AS total_revenue,
			COALESCE(stats.margin, 0)::float AS total_margin
		FROM public.customer c
		LEFT JOIN (
			SELECT inv.customer_id,
				SUM(inv.total)::float AS revenue,
				SUM((il.unit_price - il.unit_cost) * il.quantity)::float AS margin
			FROM public.invoice inv
			JOIN public.invoice_line il ON il.invoice_id = inv.invoice_id
			WHERE il.unit_cost IS NOT NULL
			GROUP BY inv.customer_id
		) stats ON stats.customer_id = c.customer_id
		ORDER BY c.customer_id`
	logSQL("admin/customers", adminCustomersSQL)
	rows, err := a.Pool.Query(r.Context(), adminCustomersSQL)
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

func (a *API) adminInvoices(w http.ResponseWriter, r *http.Request) {
	if _, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleAdmin); !ok {
		return
	}
	const adminInvoicesSQL = `
		SELECT i.*, c.first_name, c.last_name, c.email,
			COALESCE(line_agg.margin, 0)::float AS margin
		FROM public.invoice i
		JOIN public.customer c ON c.customer_id = i.customer_id
		LEFT JOIN (
			SELECT invoice_id,
				SUM((unit_price - unit_cost) * quantity)::float AS margin
			FROM public.invoice_line
			WHERE unit_cost IS NOT NULL
			GROUP BY invoice_id
		) line_agg ON line_agg.invoice_id = i.invoice_id
		ORDER BY i.invoice_date DESC
		LIMIT 500`
	logSQL("admin/invoices", adminInvoicesSQL)
	rows, err := a.Pool.Query(r.Context(), adminInvoicesSQL)
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

func (a *API) adminInvoiceLines(w http.ResponseWriter, r *http.Request) {
	if _, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleAdmin); !ok {
		return
	}
	invoiceID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	httpx.JSON(w, http.StatusOK, a.fetchInvoiceLines(r, invoiceID, false))
}

func (a *API) adminStats(w http.ResponseWriter, r *http.Request) {
	if _, ok := httpx.RequireSession(w, r, a.Sessions, auth.RoleAdmin); !ok {
		return
	}
	var stats struct {
		Customers int     `json:"customers"`
		Invoices  int     `json:"invoices"`
		Revenue   float64 `json:"revenue"`
		Margin    float64 `json:"margin"`
	}
	const adminStatsSQL = `
		SELECT
			(SELECT COUNT(*)::int FROM public.customer),
			(SELECT COUNT(*)::int FROM public.invoice),
			(SELECT COALESCE(SUM(total), 0)::float FROM public.invoice),
			(SELECT COALESCE(SUM((unit_price - unit_cost) * quantity), 0)::float
			 FROM public.invoice_line WHERE unit_cost IS NOT NULL)`
	logSQL("admin/stats", adminStatsSQL)
	err := a.Pool.QueryRow(r.Context(), adminStatsSQL).Scan(
		&stats.Customers, &stats.Invoices, &stats.Revenue, &stats.Margin,
	)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, stats)
}
