package query

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Result struct {
	Columns []string         `json:"columns"`
	Rows    [][]any          `json:"rows"`
	RowCount int             `json:"row_count"`
	ScopedSQL string         `json:"scoped_sql"`
}

// ExecuteCustomerReadOnly runs scoped SQL in a read-only transaction with RLS GUC set.
// masked selects the mask schema (support); otherwise public (customer self-service).
func ExecuteCustomerReadOnly(
	ctx context.Context,
	pool *pgxpool.Pool,
	customerID int,
	rawSQL string,
	maxLen int,
	maxRows int,
	masked bool,
	info ExecInfo,
) (Result, error) {
	entry := LogEntry{
		CustomerID: customerID,
		Source:     info.Source,
		ViewMode:   info.ViewMode,
		Masked:     masked,
		RawSQL:     rawSQL,
	}
	defer func() {
		logQuery(entry)
	}()

	if err := Validate(rawSQL, maxLen); err != nil {
		entry.RejectReason = classifyRejectReason(err)
		entry.Err = err.Error()
		return Result{}, err
	}
	scoped, err := Scope(customerID, rawSQL, masked)
	if err != nil {
		entry.ScopedSQL = scoped
		entry.RejectReason = classifyRejectReason(err)
		entry.Err = err.Error()
		return Result{}, err
	}
	entry.ScopedSQL = scoped

	useRLS := masked
	searchPath := "public"
	if masked {
		searchPath = "mask, public"
	}
	for {
		tx, err := pool.BeginTx(ctx, pgx.TxOptions{AccessMode: pgx.ReadOnly, IsoLevel: pgx.ReadCommitted})
		if err != nil {
			return Result{}, err
		}

		if _, err := tx.Exec(ctx, "SELECT set_config('app.customer_id', $1, true)", fmt.Sprint(customerID)); err != nil {
			_ = tx.Rollback(ctx)
			entry.RejectReason = "session_scope_failed"
			return Result{}, fmt.Errorf("set customer scope: %w", err)
		}
		if useRLS {
			if _, err := tx.Exec(ctx, "SET LOCAL ROLE support_reader"); err != nil {
				_ = tx.Rollback(ctx)
				// Role missing on DB volumes created before 05-support-rls.sql; retry without RLS role.
				useRLS = false
				continue
			}
		}
		if _, err := tx.Exec(ctx, "SET search_path TO "+searchPath); err != nil {
			_ = tx.Rollback(ctx)
			return Result{}, err
		}

		limited := fmt.Sprintf("SELECT * FROM (%s) AS scoped_query LIMIT %d", scoped, maxRows)
		entry.ExecutedSQL = limited
		rows, err := tx.Query(ctx, limited)
		if err != nil {
			_ = tx.Rollback(ctx)
			entry.RejectReason = classifyRejectReason(err)
			entry.Err = err.Error()
			return Result{ScopedSQL: scoped}, fmt.Errorf("execute: %w", err)
		}

		fds := rows.FieldDescriptions()
		cols := make([]string, len(fds))
		for i, fd := range fds {
			cols[i] = string(fd.Name)
		}
		var out [][]any
		for rows.Next() {
			vals, err := rows.Values()
			if err != nil {
				rows.Close()
				_ = tx.Rollback(ctx)
				return Result{}, err
			}
			for i, v := range vals {
				if n, ok := NormalizeValue(v); ok {
					vals[i] = n
				}
			}
			out = append(out, vals)
		}
		if err := rows.Err(); err != nil {
			rows.Close()
			_ = tx.Rollback(ctx)
			return Result{}, err
		}
		rows.Close()
		if err := tx.Commit(ctx); err != nil {
			entry.RejectReason = "tx_commit_failed"
			entry.Err = err.Error()
			return Result{}, err
		}
		entry.RowCount = len(out)
		return Result{
			Columns:   cols,
			Rows:      out,
			RowCount:  len(out),
			ScopedSQL: scoped,
		}, nil
	}
}

func classifyRejectReason(err error) string {
	msg := strings.ToLower(err.Error())
	switch {
	case strings.Contains(msg, "only select queries are allowed"):
		return "non_select_query"
	case strings.Contains(msg, "single statement"):
		return "multi_statement_query"
	case strings.Contains(msg, "forbidden keywords"):
		return "forbidden_keyword"
	case strings.Contains(msg, "system catalogs are not allowed"):
		return "system_catalog_access"
	case strings.Contains(msg, "maximum length"):
		return "query_too_long"
	case strings.Contains(msg, "empty query"):
		return "empty_query"
	case strings.Contains(msg, "table") && strings.Contains(msg, "not allowed"):
		return "disallowed_table"
	case strings.Contains(msg, "schema tables are allowed"):
		return "schema_violation"
	case strings.Contains(msg, "query must reference customer, invoice, or invoice_line"):
		return "missing_customer_scope_anchor"
	case strings.Contains(msg, "could not find tables in query"):
		return "no_table_detected"
	case strings.Contains(msg, "execute:"):
		return "execution_error"
	default:
		return "rejected"
	}
}
