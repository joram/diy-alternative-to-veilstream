package support

import "strings"

// CanonicalSQL returns a vetted SELECT for common customer questions (no LLM).
func CanonicalSQL(message string) (sql string, ok bool) {
	m := strings.ToLower(strings.TrimSpace(message))
	m = strings.TrimSuffix(m, "?")

	switch {
	case containsAll(m, "recent", "invoice"):
		return `SELECT invoice_id, total, invoice_date
FROM invoice
ORDER BY invoice_date DESC
LIMIT 10`, true
	case containsAny(m, "track", "tracks", "song", "songs") && containsAny(m, "purchas", "bought", "buy"):
		return `SELECT COALESCE(SUM(il.quantity), 0) AS tracks_purchased
FROM invoice_line il`, true
	case containsAny(m, "spent", "spend", "spending") && containsAny(m, "total", "much"):
		return `SELECT COALESCE(SUM(total), 0) AS total_spent FROM invoice`, true
	case containsAny(m, "album", "albums") && containsAny(m, "purchas", "bought", "buy"):
		return `SELECT DISTINCT al.title AS album_title, ar.name AS artist_name
FROM invoice_line il
JOIN track t ON t.track_id = il.track_id
JOIN album al ON al.album_id = t.album_id
JOIN artist ar ON ar.artist_id = al.artist_id
ORDER BY al.title`, true
	default:
		return "", false
	}
}

func containsAll(s string, parts ...string) bool {
	for _, p := range parts {
		if !strings.Contains(s, p) {
			return false
		}
	}
	return true
}

func containsAny(s string, parts ...string) bool {
	for _, p := range parts {
		if strings.Contains(s, p) {
			return true
		}
	}
	return false
}
