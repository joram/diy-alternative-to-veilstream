-- Read-only support access: row scope via session GUC app.customer_id
\connect chinook

CREATE ROLE support_reader NOLOGIN;
GRANT USAGE ON SCHEMA mask TO support_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA mask TO support_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA mask GRANT SELECT ON TABLES TO support_reader;
-- mask.* views call anon masking functions at read time
GRANT USAGE ON SCHEMA anon TO support_reader;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA anon TO support_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA anon GRANT EXECUTE ON FUNCTIONS TO support_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA anon TO support_reader;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA anon TO support_reader;

ALTER TABLE customer FORCE ROW LEVEL SECURITY;
ALTER TABLE invoice FORCE ROW LEVEL SECURITY;
ALTER TABLE invoice_line FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_customer_scope ON customer;
CREATE POLICY support_customer_scope ON customer
  FOR SELECT TO support_reader
  USING (customer_id = NULLIF(current_setting('app.customer_id', true), '')::int);

DROP POLICY IF EXISTS support_invoice_scope ON invoice;
CREATE POLICY support_invoice_scope ON invoice
  FOR SELECT TO support_reader
  USING (customer_id = NULLIF(current_setting('app.customer_id', true), '')::int);

DROP POLICY IF EXISTS support_invoice_line_scope ON invoice_line;
CREATE POLICY support_invoice_line_scope ON invoice_line
  FOR SELECT TO support_reader
  USING (
    EXISTS (
      SELECT 1 FROM invoice i
      WHERE i.invoice_id = invoice_line.invoice_id
        AND i.customer_id = NULLIF(current_setting('app.customer_id', true), '')::int
    )
  );

GRANT support_reader TO postgres;
