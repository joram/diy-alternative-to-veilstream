package query

import "log"

// ExecInfo identifies who ran a scoped query (for audit logs).
type ExecInfo struct {
	Source   string // e.g. support/chat, support/query
	ViewMode string // customer or support
}

// LogEntry is one executed (or rejected) scoped query.
type LogEntry struct {
	CustomerID  int
	Source      string
	ViewMode    string
	Masked      bool
	RawSQL      string
	ScopedSQL   string
	ExecutedSQL string
	RowCount    int
	Err         string
}

func logQuery(e LogEntry) {
	if e.Err != "" {
		log.Printf(
			"[query] customer_id=%d source=%s view_mode=%s masked=%v rows=%d error=%s raw=%q scoped=%q executed=%q",
			e.CustomerID, e.Source, e.ViewMode, e.Masked, e.RowCount, e.Err,
			e.RawSQL, e.ScopedSQL, e.ExecutedSQL,
		)
		return
	}
	log.Printf(
		"[query] customer_id=%d source=%s view_mode=%s masked=%v rows=%d raw=%q scoped=%q executed=%q",
		e.CustomerID, e.Source, e.ViewMode, e.Masked, e.RowCount,
		e.RawSQL, e.ScopedSQL, e.ExecutedSQL,
	)
}
