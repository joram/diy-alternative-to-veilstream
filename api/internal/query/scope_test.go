package query

import "testing"

func TestScopeInvoice(t *testing.T) {
	scoped, err := Scope(5, "SELECT invoice_id, total FROM invoice ORDER BY invoice_date DESC", true)
	if err != nil {
		t.Fatal(err)
	}
	if !containsAll(scoped, "mask.invoice", "invoice.customer_id = 5") {
		t.Fatalf("unexpected scope: %s", scoped)
	}
	if contains(scoped, "order.customer_id") {
		t.Fatalf("ORDER BY must not become alias: %s", scoped)
	}
}

func TestScopeCanonicalRecentInvoices(t *testing.T) {
	sql := `SELECT invoice_id, total, invoice_date
FROM invoice
ORDER BY invoice_date DESC
LIMIT 10`
	scoped, err := Scope(3, sql, false)
	if err != nil {
		t.Fatal(err)
	}
	if !containsAll(scoped, "public.invoice", "invoice.customer_id = 3") {
		t.Fatalf("unexpected scope: %s", scoped)
	}
	if contains(scoped, "order.customer_id") {
		t.Fatalf("ORDER BY must not become alias: %s", scoped)
	}
}

func TestScopeForcesSessionCustomer(t *testing.T) {
	scoped, err := Scope(5, "SELECT * FROM customer WHERE customer_id = 99", true)
	if err != nil {
		t.Fatal(err)
	}
	if !containsAll(scoped, "customer_id = 5") {
		t.Fatalf("session customer must be enforced: %s", scoped)
	}
}

func TestScopeAppendsToExistingWhere(t *testing.T) {
	scoped, err := Scope(5, "SELECT inv.invoice_id FROM invoice inv WHERE inv.total > 0 ORDER BY inv.invoice_date", true)
	if err != nil {
		t.Fatal(err)
	}
	if !containsAll(scoped, "customer_id = 5", "inv.total > 0", " AND ") {
		t.Fatalf("unexpected: %s", scoped)
	}
}

func TestValidateRejectsDrop(t *testing.T) {
	if err := Validate("DROP TABLE customer", 8000); err == nil {
		t.Fatal("expected error")
	}
}

func containsAll(s string, parts ...string) bool {
	for _, p := range parts {
		if !contains(s, p) {
			return false
		}
	}
	return true
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || indexOf(s, sub) >= 0)
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
