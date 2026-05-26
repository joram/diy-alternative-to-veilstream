-- Internal-only fields: wholesale costs and ops notes. Not for customer-facing roles.
\connect chinook

-- Catalog wholesale cost (distinct from retail unit_price on track)
ALTER TABLE track ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2);

-- Cost frozen at time of sale for margin reporting on historical invoices
ALTER TABLE invoice_line ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2);

-- Support / finance notes — never shown on customer invoices
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS internal_notes TEXT;

COMMENT ON COLUMN track.unit_cost IS 'Internal wholesale cost; masked for customer-facing access';
COMMENT ON COLUMN invoice_line.unit_cost IS 'Internal unit cost at sale; masked for customer-facing access';
COMMENT ON COLUMN invoice.internal_notes IS 'Internal company notes; masked for customer-facing access';

-- Backfill: wholesale is ~50–60% of retail, with stable per-track jitter
UPDATE track
SET unit_cost = ROUND(
  (unit_price * (0.50 + ((track_id % 11) * 0.01)))::numeric,
  2
)
WHERE unit_cost IS NULL;

UPDATE invoice_line il
SET unit_cost = t.unit_cost
FROM track t
WHERE t.track_id = il.track_id
  AND il.unit_cost IS NULL;

-- Sample internal notes on a subset of invoices
UPDATE invoice SET internal_notes = 'VIP account — waive restocking fee on returns'
WHERE invoice_id IN (1, 12, 45);

UPDATE invoice SET internal_notes = 'Finance: margin below 40% — manager approval on future orders'
WHERE invoice_id IN (8, 23, 67, 102);

UPDATE invoice SET internal_notes = 'Fraud review cleared 2024-03-12. Monitor next 3 purchases.'
WHERE invoice_id IN (15, 88);

UPDATE invoice SET internal_notes = 'Bulk edu license — do not apply standard retail pricing'
WHERE invoice_id IN (200, 201, 202);
