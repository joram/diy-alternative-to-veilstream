package handlers

import (
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5"

	"github.com/veilstream/chinook-api/internal/auth"
)

func scanOne(rows pgx.Rows) (map[string]any, error) {
	if !rows.Next() {
		return nil, fmt.Errorf("no rows")
	}
	return scanRow(rows)
}

func scanAll(rows pgx.Rows) ([]map[string]any, error) {
	var list []map[string]any
	for rows.Next() {
		m, err := scanRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, rows.Err()
}

func scanRow(rows pgx.Rows) (map[string]any, error) {
	fds := rows.FieldDescriptions()
	vals, err := rows.Values()
	if err != nil {
		return nil, err
	}
	m := make(map[string]any, len(fds))
	for i, fd := range fds {
		m[string(fd.Name)] = vals[i]
	}
	return m, nil
}

func customerDataSchema(sess *auth.Session) string {
	if sess.ViewMode == auth.ViewAsCustomer {
		return "public"
	}
	return "mask"
}

func (a *API) invoiceOwned(r *http.Request, customerID, invoiceID int) bool {
	var id int
	const ownedSQL = `SELECT invoice_id FROM public.invoice WHERE invoice_id = $1 AND customer_id = $2`
	logSQL("invoice/owned", ownedSQL, invoiceID, customerID)
	err := a.Pool.QueryRow(r.Context(), ownedSQL, invoiceID, customerID).Scan(&id)
	return err == nil
}

func (a *API) fetchInvoiceLines(r *http.Request, invoiceID int, masked bool) []map[string]any {
	schema := "public"
	if masked {
		schema = "mask"
	}
	q := fmt.Sprintf(`
		SELECT il.invoice_line_id, il.invoice_id, il.track_id, il.quantity, il.unit_price, il.unit_cost,
		       t.name AS track_name, al.title AS album_title, ar.name AS artist_name
		FROM %s.invoice_line il
		JOIN %s.track t ON t.track_id = il.track_id
		LEFT JOIN %s.album al ON al.album_id = t.album_id
		LEFT JOIN %s.artist ar ON ar.artist_id = al.artist_id
		WHERE il.invoice_id = $1
		ORDER BY il.invoice_line_id`, schema, schema, schema, schema)
	if !masked {
		q = `
		SELECT il.invoice_line_id, il.invoice_id, il.track_id, il.quantity, il.unit_price, il.unit_cost,
		       t.name AS track_name, al.title AS album_title, ar.name AS artist_name
		FROM public.invoice_line il
		JOIN public.track t ON t.track_id = il.track_id
		LEFT JOIN public.album al ON al.album_id = t.album_id
		LEFT JOIN public.artist ar ON ar.artist_id = al.artist_id
		WHERE il.invoice_id = $1 ORDER BY il.invoice_line_id`
	}
	logSQL("dashboard/invoice-lines", q, invoiceID)
	rows, err := a.Pool.Query(r.Context(), q, invoiceID)
	if err != nil {
		return nil
	}
	defer rows.Close()
	list, _ := scanAll(rows)
	return list
}
