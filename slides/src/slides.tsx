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
        <p className="repo-link">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            github.com/joram/diy-alternative-to-veilstream
          </a>
        </p>
      </div>
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
              Software developer with over a decade of experience across the full stack — from cloud
              infrastructure to user-facing apps — focused on secure, scalable systems.
            </p>
            <p>
              Active in the Victoria tech community; enjoys mentoring and sharing ideas with other
              developers.
            </p>
            <p className="about-links">
              <a href={SITE_URL} target="_blank" rel="noreferrer">
                john.oram.ca
              </a>
            </p>
          </div>
        </header>
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
          I built this repo as <strong>competitive analysis</strong> — a working DIY version of the
          same problem VeilStream solves — and thought it was worth sharing openly.
        </p>
        <div className="two-col">
          <div className="card card-warn">
            <h3>What I set out to learn</h3>
            <ul>
              <li>What teams actually wire up when they roll their own safe DB access</li>
              <li>Where masking, RLS, and scoped SQL get painful to operate</li>
              <li>What a credible DIY stack looks like end-to-end</li>
            </ul>
          </div>
          <div className="card card-safe">
            <h3>Why share it</h3>
            <ul>
              <li>Side-by-side with VeilStream — same patterns, different operational model</li>
              <li>Honest look at build vs. buy for preview envs and production-like data</li>
              <li>Useful whether you DIY, use VeilStream, or mix both</li>
            </ul>
          </div>
        </div>
        <p className="muted center">
          This deck is the DIY path in code; VeilStream is the hosted layer for masking, policy, and
          audit on preview environments.
        </p>
      </>
    ),
  },
  {
    id: "why",
    section: "Why",
    content: (
      <>
        <h2>Tour the demo project</h2>
        <p className="lead">
          Let's take a tour of the demo project and see how it works.
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
          </div>
          <div className="card card-safe">
            <h3>Production has secrets that must be protected</h3>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "overview",
    section: "Overview",
    content: (
      <div className="slide-with-rail">
        <aside className="side-rail side-rail--animate" aria-label="Project requirements">
          <h3>Project requirements</h3>
          <h4>Use case 1 - Talk with a human</h4>
          <ul>
            <li>Support impersonation</li>
            <li>Only show the customer's data</li>
            <li>Prevent the support human from modifying the data</li>
            <li>read only access ?</li>
          </ul>
          
          <h4>Use case 2 - Chat with an LLM</h4>
          <ul>
            <li>LLM chat</li>
            <li>Hide sensitive columns from the LLM (RLS)</li>
            <li>Only show the customer's data</li>
            <li>read only access</li>
          </ul>

          <h4>Shared requirements</h4>
          <ul>
            <li>Tenant isolation</li>
            <li>No superuser</li>
            <li>Easy maintainability</li>
          </ul>

        </aside>
        <div className="slide-rail-main">
          <h2>Feature requests in the project</h2>
          <div className="use-case-grid">
            <article className="uc-card uc-support">
              <span className="uc-badge">Use case 1</span>
              <h3>Talk with a human</h3>
              <p>
                As a customer, I want to contact support humans about billing, orders, or account access. The support human needs
                to see the account <em>as the customer sees it</em> to reproduce and fix the issue.
              </p>
            </article>
            <article className="uc-card uc-llm">
              <span className="uc-badge">Use case 2</span>
              <h3>Chat with an LLM</h3>
              <p>
                As a user, I want to ask account questions in plain English inside the product. The app generates
                SQL and runs it against live, production-shaped data to answer.
              </p>
            </article>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "uc1-scenario",
    section: "Use case 1",
    content: (
      <>
        <h2>Use case 1 - Talk with a human</h2>
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
        <h2>Big Red Flags</h2>
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
          <li>
            <strong>Package availability</strong> — <code>postgresql_anonymizer_18</code> is not on
            every distro yet.
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
        <h2>Use case 2 - Chat with an LLM</h2>
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
        <h2>More Big Red Flags</h2>
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
