package support

// schemaContext describes tables the support SQL pipeline allows (mask schema at runtime).
// Keep in sync with api/internal/query/scope.go allowedTables and Chinook DDL.
const schemaContext = `
## Database schema (PostgreSQL, Chinook Music Store)

Query only these tables. Do not use schema prefixes (e.g. mask.) — the server rewrites names.

### customer
- customer_id (PK)
- first_name, last_name, company
- address, city, state, country, postal_code
- phone, fax, email
- support_rep_id → employee (not queryable by support; omit)

### invoice
- invoice_id (PK)
- customer_id (FK → customer) — do not filter; server scopes by session
- invoice_date, total
- billing_address, billing_city, billing_state, billing_country, billing_postal_code

### invoice_line
- invoice_line_id (PK)
- invoice_id (FK → invoice)
- track_id (FK → track)
- unit_price, quantity

### track
- track_id (PK)
- name (track title; there is no track_name column)
- album_id (FK → album), genre_id (FK → genre), media_type_id
- composer, milliseconds, bytes, unit_price

### album
- album_id (PK)
- title, artist_id (FK → artist)

### artist
- artist_id (PK)
- name

### genre
- genre_id (PK)
- name

## Relationships
- customer 1 — * invoice
- invoice 1 — * invoice_line
- invoice_line * — 1 track
- track * — 1 album (optional album_id)
- album * — 1 artist
- track * — 1 genre (optional genre_id)

## Join rules
- To include track, album, artist, or genre, always join through invoice_line (and usually invoice).
- Example: purchases with track and album titles:
  FROM invoice_line il
  JOIN track t ON t.track_id = il.track_id
  JOIN album al ON al.album_id = t.album_id
  JOIN artist ar ON ar.artist_id = al.artist_id
- Aggregates (SUM, COUNT) on invoice.total or invoice_line columns are fine.

## Columns you cannot use
- employee, playlist, media_type, playlist_track tables
- internal_notes (invoice), unit_cost (track, invoice_line)
`

func buildSystemPrompt() string {
	return "You are Chinook Music Store customer support. The customer asks questions about THEIR data only.\n" +
		"Respond with a single PostgreSQL SELECT query inside a ```sql fenced block.\n" +
		"Rules:\n" +
		"- SELECT only. One statement. No comments.\n" +
		"- Use only tables and columns from the schema below.\n" +
		"- Do not filter by customer_id — the server adds that automatically.\n" +
		"- Use table aliases on joins; every alias in SELECT/WHERE/ORDER BY must match the FROM clause exactly (e.g. FROM invoice inv → use inv.column only, never i or i2).\n" +
		"- CTEs and subqueries are allowed when useful for correctness or clarity.\n" +
		"- Prefer concise, valid SQL over over-optimization.\n" +
		"- After the SQL block, add a brief friendly sentence explaining what the query returns.\n" +
		schemaContext
}
