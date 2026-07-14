const NAV_ITEMS = [
  { id: "objectives", label: "Objectives" },
  { id: "key-results", label: "Key Results" },
  { id: "initiatives", label: "Initiatives" },
  { id: "tasks", label: "Tasks" },
  { id: "reviews", label: "Reviews" },
  { id: "automations", label: "Automations" },
  { id: "custom-fields", label: "Custom Fields" },
  { id: "roles", label: "Roles" },
  { id: "status-kr", label: "Status (KR)" },
  { id: "status-initiative", label: "Status (Initiative)" },
  { id: "status-task", label: "Status (Task)" },
];

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">Example: </span>
      {children}
    </div>
  );
}

function WhyItMatters({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
        Why it matters
      </h3>
      <p className="text-muted-foreground leading-relaxed">{children}</p>
    </>
  );
}

function DefList({ items }: { items: { term: string; desc: React.ReactNode }[] }) {
  return (
    <dl className="space-y-2">
      {items.map((item) => (
        <div key={item.term} className="text-sm">
          <dt className="inline font-semibold text-foreground">{item.term}</dt>
          <dd className="inline text-muted-foreground"> — {item.desc}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Help() {
  return (
    <div className="max-w-3xl mx-auto pb-16">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-display font-bold">Help &amp; Glossary</h1>
        <p className="text-muted-foreground">
          A single-page reference for every concept in OKRoutcomeFlow. Use Cmd/Ctrl+F to search.
        </p>
      </div>

      <nav
        aria-label="Glossary sections"
        className="sticky top-12 sm:top-14 z-10 -mx-3 sm:-mx-6 lg:-mx-8 mt-6 px-3 sm:px-6 lg:px-8 py-2 bg-background/85 backdrop-blur border-y border-border/60"
      >
        <ul className="flex gap-2 overflow-x-auto whitespace-nowrap text-sm">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="inline-block px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-12 mt-8">
        <section id="objectives" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Objectives</h2>
          <p className="text-muted-foreground leading-relaxed">
            A qualitative, inspirational statement of what you want to achieve this cycle.{" "}
            <span className="font-semibold text-foreground">Objectives</span> are destinations,
            not metrics.
          </p>
          <WhyItMatters>
            Objectives set direction. If your team can't rally behind an Objective, the Key
            Results underneath it won't matter.
          </WhyItMatters>
          <Example>"Become the preferred marketplace for US jewelers."</Example>
        </section>

        <section id="key-results" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Key Results</h2>
          <p className="text-muted-foreground leading-relaxed">
            A measurable outcome that proves an Objective is being met. Each{" "}
            <span className="font-semibold text-foreground">KR</span> has a start value, target
            value, direction (increase / decrease / maintain), and deadline. Progress and status
            are calculated automatically.
          </p>
          <WhyItMatters>
            KRs make strategy accountable. Without numbers, an Objective is a slogan.
          </WhyItMatters>
          <Example>"Grow monthly active buyers from 200 to 500."</Example>
        </section>

        <section id="sub-key-results" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Sub Key Results</h2>
          <p className="text-muted-foreground leading-relaxed">
            A child KR that rolls up to a parent. Used when a team-level KR needs to be broken
            into contributions from multiple teams or workstreams.
          </p>
          <Example>
            Parent KR "Grow MAU from 200 to 500" might have sub-KRs for Sales, Marketing, and
            Product — each with its own target that adds up to the total.
          </Example>
        </section>

        <section id="initiatives" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Initiatives</h2>
          <p className="text-muted-foreground leading-relaxed">
            A project or workstream you run to move one or more Key Results.{" "}
            <span className="font-semibold text-foreground">Initiatives</span> are the "how" —
            the bets you're making to move the numbers.
          </p>
          <WhyItMatters>
            An Objective without Initiatives is a wish. An Initiative that doesn't link to a KR
            is busywork.
          </WhyItMatters>
          <Example>
            "Launch referral program for existing buyers" — linked to the KR "Grow MAU from 200
            to 500".
          </Example>
        </section>

        <section id="tasks" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Tasks</h2>
          <p className="text-muted-foreground leading-relaxed">
            Concrete, assignable work items under an Initiative.{" "}
            <span className="font-semibold text-foreground">Tasks</span> have owners, due dates,
            dependencies, and statuses.
          </p>
          <Example>
            Under the referral program initiative: "Draft referral email copy", "Build referral
            tracking pixel", "Launch announcement post".
          </Example>
        </section>

        <section id="reviews" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Reviews</h2>
          <p className="text-muted-foreground leading-relaxed">
            Scheduled check-ins where KR owners report progress. A{" "}
            <span className="font-semibold text-foreground">Cadence</span> is the recurring rule
            (e.g. "every Monday"). A <span className="font-semibold text-foreground">Session</span>{" "}
            is one specific instance of that cadence.
          </p>
          <WhyItMatters>
            Reviews are where OKRs stay alive. Without a cadence, they become a planning artifact
            nobody looks at.
          </WhyItMatters>
        </section>

        <section id="automations" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Automations</h2>
          <p className="text-muted-foreground leading-relaxed">
            When-then rules that run in the background. Example: "When a task becomes Done,
            change its Initiative to Completed." Managers can create them; they save hours of
            manual status-keeping.
          </p>
        </section>

        <section id="custom-fields" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Custom Fields</h2>
          <p className="text-muted-foreground leading-relaxed">
            Extra columns you can add to Initiatives or Tasks — priority, category, effort
            estimate, T-shirt size, whatever your team needs. Custom fields show up in Table
            view and can be filtered.
          </p>
        </section>

        <section id="roles" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Roles</h2>
          <DefList
            items={[
              {
                term: "Contributor",
                desc: "view everything in their org; edit KRs / initiatives / tasks they own.",
              },
              {
                term: "Manager",
                desc: "everything above, plus create/edit any OKR and manage teams and users.",
              },
              {
                term: "Admin",
                desc: "everything above, plus organization settings, custom fields, and automations.",
              },
              {
                term: "Platform admin",
                desc: (
                  <>
                    manage multiple organizations from the{" "}
                    <code className="text-xs px-1 py-0.5 rounded bg-muted text-foreground">
                      /platform
                    </code>{" "}
                    console.
                  </>
                ),
              },
            ]}
          />
        </section>

        <section id="status-kr" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">KR Status</h2>
          <DefList
            items={[
              {
                term: "On Track",
                desc: "today's value is at or above the expected line for today's date.",
              },
              {
                term: "At Risk",
                desc: "behind the expected pace, but recoverable with action.",
              },
              {
                term: "Off Track",
                desc: "significantly behind; without intervention, won't hit target.",
              },
              {
                term: "No Data",
                desc: "metric is configured but no values have been logged yet.",
              },
              { term: "No Config", desc: "the KR doesn't have a metric set up yet." },
            ]}
          />
        </section>

        <section id="status-initiative" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Initiative Status</h2>
          <DefList
            items={[
              { term: "Not Started", desc: "planned but not yet begun." },
              { term: "In Progress", desc: "actively being worked on." },
              { term: "Completed", desc: "done and shipped." },
              { term: "Blocked", desc: "can't proceed until something else resolves." },
            ]}
          />
        </section>

        <section id="status-task" className="space-y-4 scroll-mt-32">
          <h2 className="text-2xl font-display font-semibold">Task Status</h2>
          <DefList
            items={[
              { term: "Todo", desc: "not started." },
              { term: "In Progress", desc: "being worked on." },
              { term: "Blocked", desc: "stuck on something." },
              { term: "Done", desc: "completed." },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
