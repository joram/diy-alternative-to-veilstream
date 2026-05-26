package query

import (
	"fmt"
	"regexp"
	"strings"
)

var forbidden = regexp.MustCompile(`(?i)\b(insert|update|delete|drop|alter|create|grant|revoke|truncate|copy|execute|call|do|merge|replace|into|pg_sleep|lo_import|lo_export|set\s+role|set\s+session|reset\s+role)\b`)

// Validate ensures the input is a single read-only SELECT suitable for scoping.
func Validate(sql string, maxLen int) error {
	q := strings.TrimSpace(sql)
	if q == "" {
		return fmt.Errorf("empty query")
	}
	if len(q) > maxLen {
		return fmt.Errorf("query exceeds maximum length (%d)", maxLen)
	}
	q = strings.TrimSuffix(q, ";")
	if strings.Contains(q, ";") {
		return fmt.Errorf("only a single statement is allowed")
	}
	lower := strings.ToLower(q)
	if !strings.HasPrefix(lower, "select") && !strings.HasPrefix(lower, "with") {
		return fmt.Errorf("only SELECT queries are allowed")
	}
	if forbidden.MatchString(q) {
		return fmt.Errorf("query contains forbidden keywords")
	}
	if strings.Contains(lower, "information_schema") || strings.Contains(lower, "pg_catalog") {
		return fmt.Errorf("system catalogs are not allowed")
	}
	return nil
}
