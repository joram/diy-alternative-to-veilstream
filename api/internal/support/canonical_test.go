package support

import "testing"

func TestCanonicalRecentInvoices(t *testing.T) {
	sql, ok := CanonicalSQL("What were my most recent invoices?")
	if !ok || sql == "" {
		t.Fatal("expected canonical SQL")
	}
}

func TestCanonicalSpent(t *testing.T) {
	_, ok := CanonicalSQL("How much have I spent in total?")
	if !ok {
		t.Fatal("expected match")
	}
}
