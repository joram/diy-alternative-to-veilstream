-- Declare anonymization rules on the PII columns of the Chinook schema.
-- Chinook v1.4.5 uses lowercase snake_case identifiers, so no quoting required.
\connect chinook

-- ---------- customer ----------
SECURITY LABEL FOR anon ON COLUMN customer.first_name
  IS 'MASKED WITH FUNCTION anon.fake_first_name()';
SECURITY LABEL FOR anon ON COLUMN customer.last_name
  IS 'MASKED WITH FUNCTION anon.fake_last_name()';
SECURITY LABEL FOR anon ON COLUMN customer.company
  IS 'MASKED WITH FUNCTION anon.fake_company()';
SECURITY LABEL FOR anon ON COLUMN customer.address
  IS 'MASKED WITH FUNCTION anon.fake_address()';
SECURITY LABEL FOR anon ON COLUMN customer.city
  IS 'MASKED WITH FUNCTION anon.fake_city()';
SECURITY LABEL FOR anon ON COLUMN customer.state
  IS 'MASKED WITH VALUE NULL';
SECURITY LABEL FOR anon ON COLUMN customer.postal_code
  IS 'MASKED WITH FUNCTION anon.fake_postcode()';
SECURITY LABEL FOR anon ON COLUMN customer.phone
  IS 'MASKED WITH FUNCTION anon.random_phone()';
SECURITY LABEL FOR anon ON COLUMN customer.fax
  IS 'MASKED WITH VALUE NULL';
SECURITY LABEL FOR anon ON COLUMN customer.email
  IS 'MASKED WITH FUNCTION anon.fake_email()';

-- ---------- employee ----------
SECURITY LABEL FOR anon ON COLUMN employee.first_name
  IS 'MASKED WITH FUNCTION anon.fake_first_name()';
SECURITY LABEL FOR anon ON COLUMN employee.last_name
  IS 'MASKED WITH FUNCTION anon.fake_last_name()';
SECURITY LABEL FOR anon ON COLUMN employee.birth_date
  IS 'MASKED WITH FUNCTION anon.dnoise(birth_date, interval ''3 years'')';
SECURITY LABEL FOR anon ON COLUMN employee.hire_date
  IS 'MASKED WITH FUNCTION anon.dnoise(hire_date, interval ''90 days'')';
SECURITY LABEL FOR anon ON COLUMN employee.address
  IS 'MASKED WITH FUNCTION anon.fake_address()';
SECURITY LABEL FOR anon ON COLUMN employee.city
  IS 'MASKED WITH FUNCTION anon.fake_city()';
SECURITY LABEL FOR anon ON COLUMN employee.state
  IS 'MASKED WITH VALUE NULL';
SECURITY LABEL FOR anon ON COLUMN employee.postal_code
  IS 'MASKED WITH FUNCTION anon.fake_postcode()';
SECURITY LABEL FOR anon ON COLUMN employee.phone
  IS 'MASKED WITH FUNCTION anon.random_phone()';
SECURITY LABEL FOR anon ON COLUMN employee.fax
  IS 'MASKED WITH VALUE NULL';
SECURITY LABEL FOR anon ON COLUMN employee.email
  IS 'MASKED WITH FUNCTION anon.fake_email()';

-- ---------- invoice (billing addresses) ----------
SECURITY LABEL FOR anon ON COLUMN invoice.billing_address
  IS 'MASKED WITH FUNCTION anon.fake_address()';
SECURITY LABEL FOR anon ON COLUMN invoice.billing_city
  IS 'MASKED WITH FUNCTION anon.fake_city()';
SECURITY LABEL FOR anon ON COLUMN invoice.billing_state
  IS 'MASKED WITH VALUE NULL';
SECURITY LABEL FOR anon ON COLUMN invoice.billing_postal_code
  IS 'MASKED WITH FUNCTION anon.fake_postcode()';

-- Note: country and billing_country are intentionally left unmasked so geographic
-- aggregates still work in the demo. Change to anon.fake_country() if you need it.

-- ---------- internal company data (see 02-internal-company-data.sql) ----------
SECURITY LABEL FOR anon ON COLUMN track.unit_cost
  IS 'MASKED WITH VALUE NULL';

SECURITY LABEL FOR anon ON COLUMN invoice_line.unit_cost
  IS 'MASKED WITH VALUE NULL';

SECURITY LABEL FOR anon ON COLUMN invoice.internal_notes
  IS 'MASKED WITH VALUE NULL';
