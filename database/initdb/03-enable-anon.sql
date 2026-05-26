-- Enable PostgreSQL Anonymizer in the Chinook database and load its dictionaries.
\connect postgres

ALTER DATABASE chinook SET session_preload_libraries = 'anon';

\connect chinook

CREATE EXTENSION IF NOT EXISTS anon CASCADE;
SELECT anon.init();
