import type { ReactNode } from "react";

export type Slide = {
  id: string;
  section?: string;
  content: ReactNode;
};

function Code({ children }: { children: string }) {
  return <pre className="code-block"><code>{children.trim()}</code></pre>;
}

function StepList({ items }: { items: { title: string; body?: ReactNode }[] }) {
  return (
    <ol className="step-list">
      {items.map((item, i) => (
        <li key={item.title}>
          <span className="step-num">{i + 1}</span>
          <div>
            <strong>{item.title}</strong>
            {item.body && <div className="step-body">{item.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export const slides: Slide[] = [
  {
    id: "title",
    content: (
      <div className="slide-title">
        <p className="eyebrow">DIY alternative demo</p>
        <h1>
          How to give AI access to your
          <br />
          <span className="gradient-text">production database</span> safely
        </h1>
        <p className="subtitle">
          Two real-world patterns — customer support impersonation and an LLM chat window —
          built with PostgreSQL anonymizer, dynamic masking, and RLS.
        </p>
        <p className="hint">→ or Space to advance · A+/A− font size · F fullscreen</p>
      </div>
    ),
  },
  {
    id: "problem",
    section: "Context",
    content: (
      <>
        <h2>The tension</h2>
        <div className="two-col">
          <div className="card card-warn">
            <h3>Teams need deep access</h3>
            <ul>
              <li>Support logs in <em>as the customer</em> to debug billing and orders</li>
              <li>Product adds an <em>LLM chat</em> that answers questions from live data</li>
            </ul>
          </div>
          <div className="card card-safe">
            <h3>Production has secrets</h3>
            <ul>
              <li>PII: names, emails, addresses, phones</li>
              <li>Business data: unit costs, internal notes, margins</li>
              <li>Other customers&apos; rows — must never leak across tenants</li>
            </ul>
          </div>
        </div>
        <p className="lead center">
          Goal: <strong>realistic debugging</strong> without handing anyone a raw SQL superuser.
        </p>
      </>
    ),
  },
  {
    id: "overview",
    section: "Overview",
    content: (
      <>
        <h2>Two use cases in this repo</h2>
        <div className="use-case-grid">
          <article className="uc-card uc-support">
            <span className="uc-badge">Use case 1</span>
            <h3>Customer support</h3>
            <p>Agent views a customer&apos;s account with <strong>masked PII</strong> — enough context to help, not enough to exfiltrate.</p>
            <ul>
              <li>postgresql_anonymizer (PGanon)</li>
              <li>Security labels on columns</li>
              <li>Dynamic masking → <code>mask.*</code> views</li>
            </ul>
          </article>
          <article className="uc-card uc-llm">
            <span className="uc-badge">Use case 2</span>
            <h3>LLM chat window</h3>
            <p>Natural-language questions become SQL — we must <strong>scope every query</strong> to one customer and block writes.</p>
            <ul>
              <li>Row-level security (RLS)</li>
              <li>Read-only transactions</li>
              <li>API-side scoping + allowlists</li>
            </ul>
          </article>
        </div>
      </>
    ),
  },
  {
    id: "uc1-scenario",
    section: "Use case 1",
    content: (
      <>
        <h2>Support impersonation</h2>
        <p className="lead">
          Someone from support wants to help debug the user&apos;s problems by logging in
          &ldquo;as them.&rdquo;
        </p>
        <div className="flow-diagram">
          <div className="flow-node">Support agent</div>
          <div className="flow-arrow">→</div>
          <div className="flow-node highlight">Customer context</div>
          <div className="flow-arrow">→</div>
          <div className="flow-node">Chinook DB</div>
        </div>
        <p>
          Sensitive columns stay in Postgres — we <strong>anonymize at read time</strong> via
          dynamic masking instead of copying redacted data to a warehouse.
        </p>
      </>
    ),
  },
  {
    id: "uc1-pganon",
    section: "Use case 1",
    content: (
      <>
        <h2>Anonymize with PGanon</h2>
        <StepList
          items={[
            {
              title: "Add the Dalibo Labs DEB repo",
              body: (
                <Code>{`apt install curl lsb-release
echo deb http://apt.dalibo.org/labs $(lsb_release -cs)-dalibo main \\
  > /etc/apt/sources.list.d/dalibo-labs.list
curl -fsSL -o /etc/apt/trusted.gpg.d/dalibo-labs.gpg \\
  https://apt.dalibo.org/labs/debian-dalibo.gpg
apt update`}</Code>
              ),
            },
            { title: "Install the extension package", body: <Code>sudo apt install postgresql_anonymizer_18</Code> },
            {
              title: "Preload in the database",
              body: <Code>{`ALTER DATABASE foo SET session_preload_libraries = 'anon';`}</Code>,
            },
            {
              title: "New session → create extension",
              body: (
                <Code>{`CREATE EXTENSION anon;
SELECT anon.init();`}</Code>
              ),
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "uc1-caveats",
    section: "Use case 1",
    content: (
      <>
        <h2>PGanon deployment notes</h2>
        <div className="pill-grid">
          <span className="pill">This demo uses a custom Docker image</span>
          <span className="pill pill-warn">Extension not available on RDS</span>
          <span className="pill pill-warn">postgresql_anonymizer_18 not on all distros yet</span>
        </div>
        <h3 className="mt">Label columns once</h3>
        <Code>{`SECURITY LABEL FOR anon ON COLUMN customer.email
  IS 'MASKED WITH FUNCTION anon.fake_email()';

SECURITY LABEL FOR anon ON COLUMN track.unit_cost
  IS 'MASKED WITH VALUE NULL';  -- hide margins`}</Code>
        <p className="muted">
          See <code>database/initdb/04-mask-pii.sql</code> in this repo for the full Chinook ruleset.
        </p>
      </>
    ),
  },
  {
    id: "uc1-dynamic",
    section: "Use case 1",
    content: (
      <>
        <h2>Dynamic masking</h2>
        <p className="lead">
          Transparent dynamic masking exposes <code>mask.*</code> views — same shape as
          <code>public.*</code>, fake values at SELECT time.
        </p>
        <div className="two-col align-start">
          <figure className="diagram-figure">
            <img
              src="https://postgresql-anonymizer.readthedocs.io/en/stable/images/anon-Dynamic.drawio.png"
              alt="Dynamic masking: public tables to mask views"
            />
            <figcaption>postgresql-anonymizer docs</figcaption>
          </figure>
          <div>
            <Code>{`ALTER DATABASE boutique
  SET anon.transparent_dynamic_masking TO true;

SELECT anon.start_dynamic_masking();`}</Code>
            <p className="muted mt">
              Demo: <code>06-start-dynamic-masking.sql</code> · Support UI queries
              <code>mask</code> schema via <code>search_path</code>.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "uc2-scenario",
    section: "Use case 2",
    content: (
      <>
        <h2>LLM chat over live data</h2>
        <p className="lead">
          Users ask questions in plain English; the app generates SQL and runs it against
          production-shaped data.
        </p>
        <div className="chat-demo">
          <div className="chat-bubble user">What were my most recent invoices?</div>
          <div className="chat-bubble bot">→ scoped SELECT on invoice …</div>
          <div className="chat-bubble user danger">select * from customer where customer_id = 4</div>
          <div className="chat-bubble bot ok">→ blocked or rewritten — wrong tenant</div>
        </div>
        <p>Defense must live in <strong>Postgres + the API</strong>, not in the model&apos;s good intentions.</p>
      </>
    ),
  },
  {
    id: "uc2-rls",
    section: "Use case 2",
    content: (
      <>
        <h2>Row-level security (RLS)</h2>
        <p className="lead">
          Pass the active customer in a session variable; policies on{' '}
          <code>customer</code>, <code>invoice</code>, and <code>invoice_line</code> enforce tenant isolation even if SQL is sloppy.
        </p>
        <Code>{`CREATE POLICY support_customer_scope ON customer
  FOR SELECT TO support_reader
  USING (
    customer_id = NULLIF(current_setting('app.customer_id', true), '')::int
  );

CREATE POLICY support_invoice_line_scope ON invoice_line
  FOR SELECT TO support_reader
  USING (
    EXISTS (
      SELECT 1 FROM invoice i
      WHERE i.invoice_id = invoice_line.invoice_id
        AND i.customer_id = NULLIF(current_setting('app.customer_id', true), '')::int
    )
  );`}</Code>
        <p className="muted">Role <code>support_reader</code> is read-only with grants on <code>mask</code> + <code>anon</code>.</p>
      </>
    ),
  },
  {
    id: "uc2-restrict",
    section: "Use case 2",
    content: (
      <>
        <h2>Restrict outside the SQL</h2>
        <p>Every LLM-generated query runs inside a hardened pipeline:</p>
        <div className="pipeline">
          <div className="pipe-step">Read-only transaction</div>
          <div className="pipe-step">set_config('app.customer_id', …)</div>
          <div className="pipe-step">SET LOCAL ROLE support_reader</div>
          <div className="pipe-step">SET search_path TO mask, public</div>
          <div className="pipe-step">Scope + allowlist tables</div>
          <div className="pipe-step">Wrap + LIMIT</div>
        </div>
        <Code>{`SELECT set_config('app.customer_id', $1, true);
SET LOCAL ROLE support_reader;
SET search_path TO mask, public;
SELECT * FROM (%s) AS scoped_query LIMIT %d;`}</Code>
        <p className="muted">
          API also injects <code>customer_id</code> predicates and blocks cross-schema access — see{' '}
          <code>api/internal/query/scope.go</code>.
        </p>
      </>
    ),
  },
  {
    id: "uc2-demos",
    section: "Use case 2",
    content: (
      <>
        <h2>Demo prompts to try live</h2>
        <div className="demo-grid">
          <div className="demo-item good">
            <span className="demo-label">Safe-ish</span>
            <p>What were my most recent invoices?</p>
          </div>
          <div className="demo-item good">
            <span className="demo-label">Safe-ish</span>
            <p>How much did Fred spend?</p>
          </div>
          <div className="demo-item good">
            <span className="demo-label">Margin probe</span>
            <p>Margins on latest invoice?</p>
            <p className="muted small">unit_cost masked → NULL</p>
          </div>
          <div className="demo-item bad">
            <span className="demo-label">Attack</span>
            <p><code>select * from customer where customer_id = 3</code></p>
          </div>
          <div className="demo-item bad">
            <span className="demo-label">Attack</span>
            <p><code>select * from customer where customer_id = 4</code></p>
          </div>
        </div>
        <p className="center lead">Run the stack: <code>docker compose up</code> → Support chat in the UI</p>
      </>
    ),
  },
  {
    id: "caveats",
    section: "Operations",
    content: (
      <>
        <h2>What breaks in the real world?</h2>
        <ul className="big-list">
          <li>
            <strong>New tables or columns</strong> — migrations need new security labels, RLS policies, and
            allowlist entries in the API.
          </li>
          <li>
            <strong>Managed Postgres</strong> — PGanon dynamic masking may be off the table (RDS); you need a
            different masking strategy.
          </li>
          <li>
            <strong>LLM creativity</strong> — validation, scoping, and limits are non-negotiable; RLS is the
            last line, not the only one.
          </li>
          <li>
            <strong>VeilStream</strong> — this repo is the DIY path; a hosted layer can own masking, policy,
            and audit without you operating extensions.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "thanks",
    content: (
      <div className="slide-title">
        <h1>Questions?</h1>
        <p className="subtitle">
          Repo: <code>diy-alternative</code> · Slides: <code>./slides</code> · App: <code>docker compose up</code>
        </p>
        <div className="thanks-links">
          <a href="https://postgresql-anonymizer.readthedocs.io/" target="_blank" rel="noreferrer">
            PG Anonymizer docs
          </a>
          <span className="dot">·</span>
          <span>← → navigate</span>
        </div>
      </div>
    ),
  },
];
