import type { ReactNode } from "react";

const REPO_URL = "https://github.com/joram/diy-alternative-to-veilstream";
const SITE_URL = "https://john.oram.ca";
const PROFILE_IMAGE = "/1730243156513.jpeg";

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

function RepoLink({ className }: { className?: string }) {
  return (
    <p className={className ?? "repo-link"}>
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        github.com/joram/diy-alternative-to-veilstream
      </a>
    </p>
  );
}

function ControlTable({
  rows,
}: {
  rows: { layer: string; responsibility: string }[];
}) {
  return (
    <table className="control-table">
      <thead>
        <tr>
          <th>Layer</th>
          <th>Responsibility</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.layer}>
            <td>{row.layer}</td>
            <td>{row.responsibility}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
        <p className="intro-line muted center">
          John Oram · Co-founder &amp; CTO, VeilStream — Victoria, BC
        </p>
        <p className="hint">→ or Space to advance · A+/A− font size · F fullscreen</p>
        <RepoLink />
      </div>
    ),
  },
  {
    id: "why",
    section: "Why",
    content: (
      <>
        <h2>Why this talk?</h2>
        <p className="lead">
          Instead of hand-waving about safe DB access, I <strong>built the DIY version</strong> —
          a realistic, production-shaped stack you can run, break, and compare.
        </p>
        <div className="two-col">
          <div className="card card-safe">
            <h3>What this repo is</h3>
            <ul>
              <li>Working code: masking, RLS, restricted roles, scoped queries</li>
              <li>Same use cases teams actually ship — support view and in-app LLM chat</li>
              <li>Honest operational cost — not a slide-deck architecture diagram</li>
            </ul>
          </div>
          <div className="card card-warn">
            <h3>What you will take away</h3>
            <ul>
              <li>Which controls matter and where they live in the stack</li>
              <li>How they drift as schema, teams, and products change</li>
              <li>When DIY is reasonable — and when the burden outgrows the team</li>
            </ul>
          </div>
        </div>
        <p className="muted center">
          DIY can be educational and appropriate. The goal is an informed build-vs-buy decision —
          not a verdict on either path.
        </p>
      </>
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
            <h3>Teams have use cases for access</h3>
            <p>Support needs to see the account as the customer sees it. Product wants LLM answers from live-shaped data.</p>
          </div>
          <div className="card card-safe">
            <h3>Production has secrets that must be protected</h3>
            <p>Tenant boundaries, PII, margins, and write access cannot depend on prompts or trust alone.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "repo-tour",
    section: "Demo",
    content: (
      <>
        <h2>Where the controls live in this repo</h2>
        <p className="lead">
          A small map of the files that implement the safety stack — clone it and follow along.
        </p>
        <div className="two-col align-start">
          <Code>{`database/initdb/
  04-mask-pii.sql
  05-support-rls.sql
  06-start-dynamic-masking.sql

api/internal/query/
  scope.go`}</Code>
          <div>
            <p>
              <strong>initdb</strong> — security labels, RLS policies, dynamic masking bootstrap.
            </p>
            <p>
              <strong>scope.go</strong> — read-only execution, table allowlist, tenant predicates, query limits.
            </p>
            <p className="repo-callout">
              Full demo: <code>docker compose up</code>
            </p>
            <RepoLink className="repo-callout" />
          </div>
        </div>
      </>
    ),
  },
  {
    id: "use-cases",
    section: "Requirements",
    content: (
      <>
        <h2>Use cases and requirements</h2>
        <div className="use-case-grid">
          <article className="uc-card uc-support">
            <span className="uc-badge">Use case 1</span>
            <h3>Talk with a human</h3>
            <p>
              As a customer, I contact support about billing, orders, or access. The support human needs
              to see the account <em>as the customer sees it</em> to reproduce and fix the issue.
            </p>
            <h4 className="uc-req-heading">Requirements</h4>
            <ul className="uc-req-list">
              <li>Support impersonation (scoped session)</li>
              <li>Only that customer&apos;s data</li>
              <li>Read-only — no accidental writes</li>
              <li>Sensitive columns masked at read time</li>
            </ul>
          </article>
          <article className="uc-card uc-llm">
            <span className="uc-badge">Use case 2</span>
            <h3>Chat with an LLM</h3>
            <p>
              As a user, I ask account questions in plain English. The app generates SQL against
              production-shaped data to answer.
            </p>
            <h4 className="uc-req-heading">Requirements</h4>
            <ul className="uc-req-list">
              <li>LLM-generated SQL, never trusted on its own</li>
              <li>Tenant isolation even when SQL is sloppy</li>
              <li>Sensitive columns hidden from result sets</li>
              <li>Read-only with hard query limits</li>
            </ul>
          </article>
        </div>
        <p className="muted center shared-req">
          Shared: tenant isolation · no superuser · auditable access · schema changes must not silently widen exposure
        </p>
      </>
    ),
  },
  {
    id: "what-safe-means",
    section: "Safety model",
    content: (
      <>
        <h2>What &ldquo;safe&rdquo; means</h2>
        <p className="lead">Not one checkbox — a set of properties that hold together under misuse and drift.</p>
        <ul className="check-grid">
          <li>Tenant isolation</li>
          <li>Sensitive column masking</li>
          <li>Read-only execution</li>
          <li>No superuser</li>
          <li>Query allowlisting / scoping</li>
          <li>Auditability</li>
          <li>Maintainable schema evolution</li>
        </ul>
      </>
    ),
  },
  {
    id: "minimum-stack",
    section: "Safety model",
    content: (
      <>
        <h2>The minimum viable safety stack</h2>
        <p className="lead">The smallest credible bundle for production-shaped access — every layer has a job.</p>
        <ul className="check-grid">
          <li>Masking</li>
          <li>RLS</li>
          <li>Restricted DB role</li>
          <li>API query validation</li>
          <li>Read-only transactions</li>
          <li>Query limits</li>
          <li>Audit logs</li>
        </ul>
        <p className="muted center">
          Skip any one of these and the rest work harder — until something slips through.
        </p>
      </>
    ),
  },
  {
    id: "controls-table",
    section: "Safety model",
    content: (
      <>
        <h2>Where the controls live</h2>
        <ControlTable
          rows={[
            { layer: "LLM prompt", responsibility: "UX guidance, not security" },
            { layer: "API", responsibility: "validation, scoping, limits" },
            { layer: "Postgres roles", responsibility: "privilege boundaries" },
            { layer: "RLS", responsibility: "tenant isolation" },
            { layer: "Masking", responsibility: "sensitive column protection" },
            { layer: "Audit", responsibility: "accountability" },
          ]}
        />
        <p className="muted center">
          Defense in depth: if the model or API misbehaves, Postgres still constrains what can be read.
        </p>
      </>
    ),
  },
  {
    id: "uc1-scenario",
    section: "Use case 1",
    content: (
      <>
        <h2>Use case 1 — Talk with a human</h2>
        <p className="lead">
          As a support human, I want to help debug the user&apos;s problems by logging in
          &ldquo;as them.&rdquo;
        </p>
        <div className="flow-diagram">
          <div className="flow-node">Support human</div>
          <div className="flow-arrow">→</div>
          <div className="flow-node highlight">Customer view</div>
          <div className="flow-arrow">→</div>
          <div className="flow-node">Production database</div>
        </div>
        <p>
          Sensitive columns stay in the production database — we <strong>anonymize at read time</strong> via
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
    id: "uc1-red-flags",
    section: "Use case 1",
    content: (
      <>
        <h2>Operational burden — masking</h2>
        <ul className="big-list">
          <li>
            <strong>Custom Postgres image</strong> — PGanon is not in stock Postgres; you own the
            build and upgrades.
          </li>
          <li>
            <strong>Managed Postgres</strong> — dynamic masking is off the table on RDS and most
            hosted providers.
          </li>
          <li>
            <strong>Label drift</strong> — every new column needs a security label or it stays
            exposed in <code>mask.*</code>.
          </li>
          <li>
            <strong>Schema footguns</strong> — one wrong <code>search_path</code> and support queries
            real PII from <code>public</code>.
          </li>
          <li>
            <strong>Live infrastructure</strong> — dynamic masking is runtime ops, not a one-time
            migration.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "uc2-scenario",
    section: "Use case 2",
    content: (
      <>
        <h2>Use case 2 — Chat with an LLM</h2>
        <p className="lead">
          As a user, I want to ask questions in plain English; the app generates SQL and runs it against
          production-shaped data to answer my questions.
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
    id: "uc2-red-flags",
    section: "Use case 2",
    content: (
      <>
        <h2>Operational burden — LLM + RLS</h2>
        <ul className="big-list">
          <li>
            <strong>LLM creativity</strong> — models will invent joins, bypass filters, and probe
            margins; prompt engineering is not a control.
          </li>
          <li>
            <strong>RLS is the last line</strong> — validation, scoping, and limits in the API must
            come first.
          </li>
          <li>
            <strong>Schema drift</strong> — new tables need RLS policies and allowlist entries in the
            API or they are wide open.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "failure-modes",
    section: "Drift",
    content: (
      <>
        <h2>Failure modes</h2>
        <p className="lead">The stack works until the schema or connection setup changes — then exposure is silent.</p>
        <div className="demo-grid">
          <div className="demo-item bad">
            <span className="demo-label">Drift</span>
            <p>
              <strong>New column, no mask.</strong> Added to <code>public.*</code>; label missing — real
              value appears in <code>mask.*</code>.
            </p>
          </div>
          <div className="demo-item bad">
            <span className="demo-label">Drift</span>
            <p>
              <strong>New table, no RLS.</strong> Allowlisted in the API by mistake — LLM can read all rows.
            </p>
          </div>
          <div className="demo-item bad">
            <span className="demo-label">Misconfiguration</span>
            <p>
              <strong>Wrong schema / search_path.</strong> Query hits <code>public</code> instead of{' '}
              <code>mask</code> — masking bypassed entirely.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "diy-reasonable",
    section: "Build vs buy",
    content: (
      <>
        <h2>When DIY is reasonable</h2>
        <ul className="big-list">
          <li>You own your Postgres runtime (custom image or self-hosted).</li>
          <li>You can maintain masking and RLS rules as the schema evolves.</li>
          <li>You have strong internal DB and security expertise.</li>
          <li>You can build audit and policy review workflows.</li>
        </ul>
        <p className="muted center">
          DIY is a good way to learn the control surface — even if you later outsource operations.
        </p>
      </>
    ),
  },
  {
    id: "diy-risky",
    section: "Build vs buy",
    content: (
      <>
        <h2>When DIY gets risky</h2>
        <ul className="big-list">
          <li>Managed Postgres without extension support.</li>
          <li>Frequent schema changes across multiple services.</li>
          <li>Multiple teams adding tables without a single policy owner.</li>
          <li>LLM-generated SQL with weak API guardrails.</li>
          <li>Compliance or audit requirements you cannot meet in-house.</li>
          <li>Customer support workflows touching production data at scale.</li>
        </ul>
        <p className="muted center">
          Hosted products (including VeilStream) exist to carry masking, policy, and audit — not because DIY is
          impossible, but because keeping it correct is ongoing work.
        </p>
      </>
    ),
  },
  {
    id: "about",
    section: "About",
    content: (
      <div className="about-slide">
        <h2>About me</h2>
        <header className="intro-header">
          <a href={SITE_URL} target="_blank" rel="noreferrer" className="profile-photo-link">
            <img src={PROFILE_IMAGE} alt="John Oram" className="profile-photo" />
          </a>
          <div className="intro-about">
            <p className="about-name">John Oram</p>
            <p className="intro-role">
              Co-founder &amp; CTO, VeilStream · Victoria, BC
            </p>
            <p className="lead">
              I build secure data-access tooling and shared this DIY stack so teams can see the controls
              and operational cost directly — then decide what to own vs. outsource.
            </p>
            <p className="about-links">
              <a href={SITE_URL} target="_blank" rel="noreferrer">
                john.oram.ca
              </a>
              <span className="dot">·</span>
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                GitHub repo
              </a>
            </p>
          </div>
        </header>
      </div>
    ),
  },
  {
    id: "takeaway",
    section: "Close",
    content: (
      <div className="takeaway-slide">
        <h2>Takeaway</h2>
        <p className="takeaway-lead">
          Safe production-shaped access is <strong>not one control</strong>.
        </p>
        <p>
          It is a stack: masking, RLS, restricted roles, scoped queries, limits, and audit.
        </p>
        <p>
          The hard part is not making it work once.
        </p>
        <p className="takeaway-emphasis">
          The hard part is keeping it correct as your schema, product, and teams change.
        </p>
      </div>
    ),
  },
  {
    id: "thanks",
    content: (
      <div className="slide-title">
        <h1>Questions?</h1>
        <p className="subtitle">
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="repo-link-large">
            github.com/joram/diy-alternative-to-veilstream
          </a>
        </p>
        <p className="muted center">Run the demo: <code>docker compose up</code></p>
        <div className="thanks-links">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub repo
          </a>
          <span className="dot">·</span>
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
