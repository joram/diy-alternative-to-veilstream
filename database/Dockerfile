FROM registry.gitlab.com/dalibo/postgresql_anonymizer:stable

RUN apt-get update && apt-get install -y postgresql_anonymizer_17 && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY initdb/01-load-chinook.sql initdb/02-internal-company-data.sql initdb/03-enable-anon.sql initdb/04-mask-pii.sql initdb/05-support-rls.sql initdb/06-start-dynamic-masking.sql /docker-entrypoint-initdb.d/

CMD ["postgres"]
