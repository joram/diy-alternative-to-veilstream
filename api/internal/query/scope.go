package query

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var allowedTables = map[string]bool{
	"customer": true, "invoice": true, "invoice_line": true,
	"track": true, "album": true, "artist": true, "genre": true,
}

var directCustomerID = map[string]bool{
	"customer": true,
	"invoice":  true,
}

// Optional alias must not use lookahead for clause keywords — ORDER BY was parsed as alias "order".
var fromJoinTable = regexp.MustCompile(
	`(?i)\b(?:from|join)\s+([a-z][a-z0-9_]*)(?:\s+(?:as\s+)?([a-z][a-z0-9_]*))?`,
)

var sqlClauseWords = map[string]bool{
	"order": true, "by": true, "where": true, "group": true, "having": true,
	"limit": true, "offset": true, "fetch": true, "on": true, "and": true, "or": true,
	"not": true, "in": true, "join": true, "inner": true, "left": true, "right": true,
	"full": true, "outer": true, "cross": true, "natural": true, "as": true, "using": true,
	"union": true, "except": true, "intersect": true, "select": true, "from": true,
}

// Scope rewrites SQL to mask.* or public.* and injects customer_id predicates.
// When masked is true, queries use the anonymized mask schema (support tooling).
func Scope(customerID int, input string, masked bool) (string, error) {
	schema := "public"
	if masked {
		schema = "mask"
	}
	q := strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(input), ";"))
	refs, err := extractTables(q, schema)
	if err != nil {
		return "", err
	}
	for _, ref := range refs {
		if !allowedTables[ref.table] {
			return "", fmt.Errorf("table %q is not allowed", ref.table)
		}
	}
	q = toQualifiedSchema(q, schema)
	cid := strconv.Itoa(customerID)
	var preds []string
	seen := map[string]bool{}
	for _, ref := range refs {
		alias := ref.alias
		if alias == "" {
			alias = ref.table
		}
		if seen[alias] {
			continue
		}
		seen[alias] = true
		switch {
		case directCustomerID[ref.table]:
			preds = append(preds, fmt.Sprintf("%s.customer_id = %s", alias, cid))
		case ref.table == "invoice_line":
			preds = append(preds, fmt.Sprintf(
				"%s.invoice_id IN (SELECT invoice_id FROM %s.invoice WHERE customer_id = %s)",
				alias, schema, cid,
			))
		}
	}
	if len(preds) == 0 {
		// Catalog-only queries (track/album/artist/genre) are allowed without customer predicates.
		return q, nil
	}
	predSQL := strings.Join(preds, " AND ")
	if loc := clauseIndex(q); loc > 0 {
		if matchWhere(q) {
			q = q[:loc] + " AND " + predSQL + " " + q[loc:]
		} else {
			q = q[:loc] + " WHERE " + predSQL + " " + q[loc:]
		}
	} else if matchWhere(q) {
		q += " AND " + predSQL
	} else {
		q += " WHERE " + predSQL
	}
	return q, nil
}

type tableRef struct {
	table string
	alias string
}

type tableRefs []tableRef

func extractTables(q string, schema string) (tableRefs, error) {
	lower := strings.ToLower(q)
	other := "mask"
	if schema == "mask" {
		other = "public"
	}
	if strings.Contains(lower, other+".") || strings.Contains(lower, "pg_catalog") || strings.Contains(lower, "information_schema") {
		return nil, fmt.Errorf("only %s schema tables are allowed", schema)
	}
	matches := fromJoinTable.FindAllStringSubmatch(q, -1)
	if len(matches) == 0 {
		return nil, fmt.Errorf("could not find tables in query")
	}
	var refs tableRefs
	for _, m := range matches {
		table := strings.ToLower(m[1])
		if table == "" || !allowedTables[table] {
			continue
		}
		alias := table
		if len(m) > 2 && m[2] != "" {
			candidate := strings.ToLower(m[2])
			if !sqlClauseWords[candidate] {
				alias = candidate
			}
		}
		refs = append(refs, tableRef{table: table, alias: alias})
	}
	return refs, nil
}

func toQualifiedSchema(q, schema string) string {
	prefix := schema + "."
	for table := range allowedTables {
		re := regexp.MustCompile(`(?i)\b` + table + `\b`)
		q = re.ReplaceAllStringFunc(q, func(s string) string {
			lower := strings.ToLower(s)
			if strings.Contains(lower, "mask.") || strings.Contains(lower, "public.") {
				return s
			}
			return prefix + strings.ToLower(s)
		})
	}
	return q
}

func matchWhere(q string) bool {
	return regexp.MustCompile(`(?i)\bwhere\b`).MatchString(q)
}

func clauseIndex(q string) int {
	re := regexp.MustCompile(`(?i)\b(group\s+by|order\s+by|limit|offset|fetch)\b`)
	loc := re.FindStringIndex(q)
	if loc == nil {
		return -1
	}
	return loc[0]
}
