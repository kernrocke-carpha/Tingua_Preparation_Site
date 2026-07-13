import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import heroImg from "@/assets/tingua-hero.jpg";
import { STEPS, PHASES, type Step } from "@/lib/tingua-steps";

export const Route = createFileRoute("/")({
  component: Index,
});

const STORAGE_KEY = "tingua-simex-planner-v1";

type FormState = Record<string, Record<string, string>>;

function useLocalPlan() {
  const [state, setState] = useState<FormState>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  const set = (stepId: number, key: string, value: string) =>
    setState((s) => ({ ...s, [stepId]: { ...(s[stepId] ?? {}), [key]: value } }));

  const reset = () => setState({});

  return { state, set, reset, ready };
}

function Index() {
  const { state, set, reset, ready } = useLocalPlan();
  const [activeStep, setActiveStep] = useState(1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!ready) return;
    const c = new Set<number>();
    for (const s of STEPS) {
      const entries = state[s.id];
      if (!s.fields || s.fields.length === 0) continue;
      if (entries && s.fields.some((f) => (entries[f.key] ?? "").trim().length > 0)) {
        c.add(s.id);
      }
    }
    setCompleted(c);
  }, [state, ready]);

  const progress = Math.round((completed.size / STEPS.filter((s) => s.fields?.length).length) * 100);
  const step = useMemo(() => STEPS.find((s) => s.id === activeStep) ?? STEPS[0], [activeStep]);

  const exportPlan = () => {
    const lines: string[] = [];
    lines.push("# Tingua SimEx — Exercise Plan\n");
    for (const s of STEPS) {
      lines.push(`\n## Step ${s.id}. ${s.title}`);
      lines.push(s.summary);
      if (s.fields) {
        for (const f of s.fields) {
          const v = state[s.id]?.[f.key];
          if (v && v.trim()) lines.push(`- **${f.label}:** ${v}`);
        }
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tingua-simex-plan.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/75 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            <TinguaMark />
            <div className="leading-tight">
              <div className="font-display font-semibold text-[15px]">Tingua SimEx</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Toolkit · v1</div>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#overview" className="hover:text-primary">Overview</a>
            <a href="#phases" className="hover:text-primary">Phases</a>
            <a href="#planner" className="hover:text-primary">Planner</a>
            <a href="#roles" className="hover:text-primary">Roles</a>
          </nav>
          <a href="#planner" className="text-sm rounded-full bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition">
            Start planning →
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" width={1600} height={1000} className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.22_0.045_210/0.55)] via-[oklch(0.22_0.045_210/0.65)] to-background" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32 text-[oklch(0.98_0.01_85)]">
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.25em] text-[oklch(0.9_0.06_75)]">
            <span className="w-8 h-px bg-[oklch(0.9_0.06_75)]" />
            CARPHA · Caribbean Simulation Exercise
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[0.98] max-w-4xl">
            A three-day simulation for the compound emergencies of a{" "}
            <span className="italic text-[oklch(0.82_0.14_60)]">small island world</span>.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-[oklch(0.94_0.02_85)]/85">
            Tingua is a fictional Caribbean state where a hurricane, a rising outbreak and a strained health system arrive at the same time. This interactive toolkit walks planners through seventeen steps to design, deliver and review a dual-hazard exercise.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#planner" className="rounded-full bg-[oklch(0.68_0.17_30)] text-[oklch(0.98_0.01_85)] px-5 py-3 text-sm font-medium hover:brightness-110">
              Open the interactive planner
            </a>
            <a href="#overview" className="rounded-full border border-[oklch(0.98_0.01_85)]/30 px-5 py-3 text-sm hover:bg-[oklch(0.98_0.01_85)]/10">
              How the exercise works
            </a>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            {[
              ["3", "days of scenario"],
              ["17", "planning steps"],
              ["9", "facilitator roles"],
              ["2", "hazards, one crisis"],
            ].map(([n, l]) => (
              <div key={l} className="border-l border-[oklch(0.9_0.06_75)]/40 pl-4">
                <div className="font-display text-4xl">{n}</div>
                <div className="text-xs uppercase tracking-widest text-[oklch(0.94_0.02_85)]/70 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overview */}
      <section id="overview" className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-[1fr_2fr] gap-12">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-coral">§ Purpose</div>
            <h2 className="mt-4 font-display text-4xl leading-tight">What Tingua tests</h2>
          </div>
          <div className="space-y-5 text-[17px] leading-relaxed text-foreground/85">
            <p>
              Each Tingua exercise pairs a <strong className="text-primary">medical or public health outbreak</strong> with a <strong className="text-coral">natural disaster or environmental emergency</strong>. Bringing them together creates the complex emergency environment Caribbean and Small Island Developing States actually face — competing priorities, disrupted infrastructure, rapid rumours, and coordinated decision-making across sectors.
            </p>
            <p>
              The toolkit tests capacities across the whole emergency cycle: prevention, preparedness, early warning, surveillance, laboratory coordination, incident management, One Health, risk communication, logistics, continuity of care, recovery, and after-action review.
            </p>
          </div>
        </div>
      </section>

      {/* Phases */}
      <section id="phases" className="bg-[oklch(0.22_0.045_210)] text-[oklch(0.96_0.01_85)] py-24 grain">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.25em] text-[oklch(0.82_0.14_60)]">§ 17 steps · 6 phases</div>
              <h2 className="mt-4 font-display text-4xl md:text-5xl">The planning arc</h2>
            </div>
            <p className="max-w-md text-sm text-[oklch(0.94_0.02_85)]/70">
              Tap a phase to jump into the corresponding steps of the planner. Your inputs save automatically to this browser.
            </p>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {PHASES.map((p, i) => {
              const stepsIn = STEPS.filter((s) => s.phase === p.name);
              return (
                <button
                  key={p.name}
                  onClick={() => {
                    setActiveStep(stepsIn[0].id);
                    document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group text-left rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.07] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[oklch(0.82_0.14_60)]">
                      0{i + 1}
                    </span>
                    <span className="text-xs text-white/50">{stepsIn.length} steps</span>
                  </div>
                  <h3 className="font-display text-2xl mt-4">{p.name}</h3>
                  <p className="text-sm mt-2 text-white/70">{p.blurb}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {stepsIn.map((s) => (
                      <span key={s.id} className="text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/10">
                        {s.short}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 text-xs uppercase tracking-widest text-[oklch(0.82_0.14_60)] opacity-0 group-hover:opacity-100 transition">
                    Open in planner →
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Planner */}
      <section id="planner" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-coral">§ Interactive planner</div>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">Build your exercise</h2>
            <p className="mt-3 max-w-xl text-foreground/70">
              Progress {progress}% · {completed.size} of {STEPS.filter((s) => s.fields?.length).length} interactive steps filled. Autosaves to your browser.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportPlan} className="text-sm rounded-full bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90">
              Export as Markdown
            </button>
            <button
              onClick={() => {
                if (confirm("Clear all planner inputs from this browser?")) reset();
              }}
              className="text-sm rounded-full border border-border px-4 py-2 hover:bg-muted"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-10">
          <div
            className="h-full bg-gradient-to-r from-primary via-[oklch(0.55_0.13_195)] to-coral transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ol className="space-y-1">
              {STEPS.map((s) => {
                const active = s.id === activeStep;
                const done = completed.has(s.id);
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setActiveStep(s.id)}
                      className={`w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/75"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-6 h-6 grid place-items-center rounded-full text-[11px] font-mono ${
                          done
                            ? "bg-coral text-[oklch(0.98_0.01_85)]"
                            : active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? "✓" : s.id}
                      </span>
                      <span className="truncate">{s.short}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Detail */}
          <div key={step.id} className="rounded-2xl border border-border bg-card p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Step {step.id} · {step.phase}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={step.id === 1}
                  onClick={() => setActiveStep((n) => Math.max(1, n - 1))}
                  className="text-xs rounded-md border border-border px-3 py-1.5 disabled:opacity-40 hover:bg-muted"
                >
                  ← Prev
                </button>
                <button
                  disabled={step.id === STEPS.length}
                  onClick={() => setActiveStep((n) => Math.min(STEPS.length, n + 1))}
                  className="text-xs rounded-md bg-primary text-primary-foreground px-3 py-1.5 disabled:opacity-40 hover:bg-primary/90"
                >
                  Next →
                </button>
              </div>
            </div>

            <h3 className="mt-4 font-display text-3xl md:text-4xl leading-tight">{step.title}</h3>
            <p className="mt-4 text-foreground/75 leading-relaxed">{step.summary}</p>

            {step.bullets && (
              <ul className="mt-6 space-y-2.5">
                {step.bullets.map((b, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground/80">
                    <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-coral" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {step.fields && step.fields.length > 0 && (
              <div className="mt-10 pt-8 border-t border-border">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-6">Your inputs</div>
                <div className="grid md:grid-cols-2 gap-5">
                  {step.fields.map((f) => (
                    <Field
                      key={f.key}
                      field={f}
                      value={state[step.id]?.[f.key] ?? ""}
                      onChange={(v) => set(step.id, f.key, v)}
                      full={f.type === "textarea"}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-xs font-mono uppercase tracking-[0.25em] text-coral">§ Facilitator roles</div>
        <h2 className="mt-4 font-display text-4xl md:text-5xl max-w-2xl">Nine people who make the room work</h2>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLE_CARDS.map((r, i) => (
            <div key={r.name} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${r.tone}`}>{r.tag}</span>
              </div>
              <h3 className="font-display text-xl mt-4">{r.name}</h3>
              <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-[oklch(0.22_0.045_210)] text-[oklch(0.96_0.01_85)] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <TinguaMark />
            <div className="text-sm">
              <div className="font-display font-semibold">Tingua SimEx Toolkit</div>
              <div className="text-xs text-white/60">Interactive companion to the CARPHA planning template.</div>
            </div>
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-white/50">
            Unity · Resilience · Pride
          </div>
        </div>
      </footer>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
  full,
}: {
  field: import("@/lib/tingua-steps").StepField;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  const common = "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-foreground/80 mb-1.5">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={common} />
      ) : field.type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={common}>
          <option value="">Choose…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={common}
        />
      )}
    </label>
  );
}

function TinguaMark() {
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary via-[oklch(0.42_0.08_195)] to-coral grid place-items-center text-[oklch(0.98_0.01_85)] font-display text-sm">
      T
    </div>
  );
}

const ROLE_CARDS = [
  { name: "Exercise Director", tag: "Command", tone: "bg-primary/10 text-primary", desc: "Overall responsibility — approves scenario, confirms objectives, maintains exercise control and alignment with purpose." },
  { name: "Lead Facilitator", tag: "Plenary", tone: "bg-primary/10 text-primary", desc: "Runs plenary delivery, coordinates group facilitators, controls timing and manages transitions." },
  { name: "Group Facilitator", tag: "Table", tone: "bg-primary/10 text-primary", desc: "Guides one group's discussion, presents injects, asks probing questions and documents strengths and gaps." },
  { name: "Minister of Health", tag: "Role-play", tone: "bg-coral/15 text-coral", desc: "Receives briefings, requires prioritisation, questions unsupported advice, tests accountability. Activates Day 2–3." },
  { name: "Emergency Mgmt Actor", tag: "Role-play", tone: "bg-coral/15 text-coral", desc: "Hazard bulletins, infrastructure damage, shelters, logistics constraints, access and transport." },
  { name: "Public Health Technical Actor", tag: "Technical", tone: "bg-[oklch(0.78_0.13_75)]/25 text-[oklch(0.5_0.13_75)]", desc: "Surveillance data, case updates, reporting gaps, challenges to unsupported assumptions." },
  { name: "One Health / Environmental Actor", tag: "Technical", tone: "bg-[oklch(0.78_0.13_75)]/25 text-[oklch(0.5_0.13_75)]", desc: "Animal-health alerts, environmental contamination, vector/food/water concerns, interface risks." },
  { name: "Risk Comms / Media Actor", tag: "Pressure", tone: "bg-coral/15 text-coral", desc: "Introduces rumours, requests statements, challenges inconsistency, tests uncertainty communication." },
  { name: "Rapporteur / Evaluator", tag: "Observe", tone: "bg-muted text-muted-foreground", desc: "Records decisions, strengths, gaps, delayed actions, missed information, improvement proposals." },
];
