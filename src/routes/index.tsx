import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import heroImg from "@/assets/tingua-hero.jpg";
import { STEPS, PHASES, type StepField, type FileAttachment, type InjectEntry, type RosterEntry, type HazardSelection, type NamedListEntry } from "@/lib/tingua-steps";
import {
  buildDocx,
  buildMarkdown,
  buildSaveJson,
  buildZip,
  downloadBlob,
  fileToAttachment,
  readSaveJson,
  type PlanState,
} from "@/lib/tingua-export";

export const Route = createFileRoute("/")({
  component: Index,
});

const STORAGE_KEY = "tingua-simex-planner-v2";

function useLocalPlan() {
  const [state, setState] = useState<PlanState>({});
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
    } catch {
      // quota exceeded — fall back silently; user can still export
    }
  }, [state, ready]);

  const set = (stepId: number, key: string, value: unknown) =>
    setState((s) => ({ ...s, [stepId]: { ...(s[stepId] ?? {}), [key]: value } }));

  const replace = (next: PlanState) => setState(next);

  const reset = () => setState({});

  return { state, set, replace, reset, ready };
}

function isFilled(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") {
    const vals = Object.values(v as Record<string, unknown>);
    return vals.some((x) => isFilled(x));
  }
  return false;
}

function Index() {
  const { state, set, replace, reset, ready } = useLocalPlan();
  const [activeStep, setActiveStep] = useState(1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const loadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    const c = new Set<number>();
    for (const s of STEPS) {
      if (!s.fields || s.fields.length === 0) continue;
      const entries = state[s.id];
      if (entries && s.fields.some((f) => isFilled(entries[f.key]))) c.add(s.id);
    }
    setCompleted(c);
  }, [state, ready]);

  // Auto-populate fields declared with `autofillFrom` when they are still empty.
  useEffect(() => {
    if (!ready) return;
    for (const s of STEPS) {
      for (const f of s.fields ?? []) {
        if ("autofillFrom" in f && f.autofillFrom) {
          const current = state[s.id]?.[f.key];
          const source = state[f.autofillFrom.step]?.[f.autofillFrom.key];
          if (
            (current == null || (typeof current === "string" && current.trim() === "")) &&
            typeof source === "string" &&
            source.trim() !== ""
          ) {
            set(s.id, f.key, source);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state[1]?.participants, ready]);

  const totalFillable = STEPS.filter((s) => s.fields?.length).length;
  const progress = Math.round((completed.size / totalFillable) * 100);
  const step = useMemo(() => STEPS.find((s) => s.id === activeStep) ?? STEPS[0], [activeStep]);

  const runExport = async (label: string, fn: () => Promise<void> | void) => {
    setBusy(label);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      alert(`Export failed: ${(err as Error).message ?? err}`);
    } finally {
      setBusy(null);
    }
  };

  const exportMarkdown = () =>
    runExport("markdown", () => {
      const blob = new Blob([buildMarkdown(state)], { type: "text/markdown" });
      downloadBlob(blob, "tingua-simex-plan.md");
    });
  const exportWord = () =>
    runExport("word", async () => {
      const blob = await buildDocx(state);
      downloadBlob(blob, "tingua-simex-plan.docx");
    });
  const exportZip = () =>
    runExport("zip", async () => {
      const blob = await buildZip(state);
      downloadBlob(blob, "tingua-simex-delivery-pack.zip");
    });
  const saveProgress = () =>
    runExport("save", () => {
      downloadBlob(buildSaveJson(state), "tingua-simex-progress.json");
    });
  const onLoadFile = async (file: File) => {
    try {
      const next = await readSaveJson(file);
      if (!confirm("This will replace your current planner data. Continue?")) return;
      replace(next);
      setActiveStep(1);
    } catch (err) {
      alert(`Could not load file: ${(err as Error).message ?? err}`);
    }
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
            Tingua is a fictional Caribbean state where a hurricane, a rising outbreak and a strained health system arrive at the same time. This interactive toolkit walks planners through every step to design, deliver and review a dual-hazard exercise.
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
              [`${STEPS.length}`, "planning steps"],
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
              <div className="text-xs font-mono uppercase tracking-[0.25em] text-[oklch(0.82_0.14_60)]">§ {STEPS.length} steps · 6 phases</div>
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
        <div className="flex items-end justify-between flex-wrap gap-6 mb-6">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-coral">§ Interactive planner</div>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">Build your exercise</h2>
            <p className="mt-3 max-w-xl text-foreground/70">
              Progress {progress}% · {completed.size} of {totalFillable} interactive steps filled. Autosaves to your browser.
            </p>
          </div>
        </div>

        {/* Export bar */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-4 md:p-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mr-2">Export</span>
          <button onClick={exportWord} disabled={!!busy} className="text-sm rounded-full bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 disabled:opacity-50">
            {busy === "word" ? "Building…" : "Word report (.docx)"}
          </button>
          <button onClick={exportZip} disabled={!!busy} className="text-sm rounded-full bg-coral text-[oklch(0.98_0.01_85)] px-4 py-2 hover:brightness-110 disabled:opacity-50">
            {busy === "zip" ? "Packing…" : "Full delivery pack (.zip)"}
          </button>
          <button onClick={exportMarkdown} disabled={!!busy} className="text-sm rounded-full border border-border px-4 py-2 hover:bg-muted disabled:opacity-50">
            Markdown
          </button>
          <span className="w-px h-6 bg-border mx-2 hidden md:block" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mr-2">Save / Resume</span>
          <button onClick={saveProgress} disabled={!!busy} className="text-sm rounded-full border border-border px-4 py-2 hover:bg-muted disabled:opacity-50">
            Save progress (.json)
          </button>
          <button onClick={() => loadInputRef.current?.click()} disabled={!!busy} className="text-sm rounded-full border border-border px-4 py-2 hover:bg-muted disabled:opacity-50">
            Load progress…
          </button>
          <input
            ref={loadInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onLoadFile(f);
              e.target.value = "";
            }}
          />
          <div className="grow" />
          <button
            onClick={() => {
              if (confirm("Clear all planner inputs from this browser?")) reset();
            }}
            className="text-sm rounded-full border border-border px-4 py-2 hover:bg-muted"
          >
            Reset
          </button>
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
                    <FieldRenderer
                      key={f.key}
                      field={f}
                      value={state[step.id]?.[f.key]}
                      onChange={(v) => set(step.id, f.key, v)}
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

// ================= Field renderer =================

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: StepField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const full =
    field.type === "textarea" ||
    field.type === "multiselect" ||
    field.type === "checklist" ||
    field.type === "files" ||
    field.type === "injects" ||
    field.type === "roster" ||
    field.type === "hazards" ||
    field.type === "namedList";

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";

  const wrap = (children: React.ReactNode) => (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-foreground/80 mb-1.5">{field.label}</span>
      {children}
      {"hint" in field && field.hint && (
        <span className="block text-[11px] text-muted-foreground mt-1.5">{field.hint}</span>
      )}
    </label>
  );

  switch (field.type) {
    case "text":
    case "number":
    case "date":
      return wrap(
        <input
          type={field.type}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      );
    case "textarea":
      return wrap(
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      );
    case "select":
      return wrap(
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Choose…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "multiselect":
      return wrap(<BubbleMulti value={Array.isArray(value) ? (value as string[]) : []} options={field.options} onChange={onChange} accent="primary" />);
    case "checklist":
      return wrap(<Checklist value={Array.isArray(value) ? (value as string[]) : []} options={field.options} onChange={onChange} />);
    case "files":
      return wrap(
        field.slots ? (
          <SlotFiles value={(value as Record<string, FileAttachment[]>) ?? {}} slots={field.slots} onChange={onChange} />
        ) : (
          <FreeFiles value={Array.isArray(value) ? (value as FileAttachment[]) : []} onChange={onChange} />
        )
      );
    case "injects":
      return wrap(<InjectsField value={Array.isArray(value) ? (value as InjectEntry[]) : []} onChange={onChange} />);
    case "roster":
      return wrap(<RosterField value={Array.isArray(value) ? (value as RosterEntry[]) : []} onChange={onChange} />);
    case "hazards":
      return wrap(
        <HazardsField
          value={Array.isArray(value) ? (value as HazardSelection[]) : []}
          options={field.options}
          onChange={onChange}
          namePlaceholder={field.namePlaceholder}
        />
      );
    case "namedList":
      return wrap(
        <NamedListField
          value={Array.isArray(value) ? (value as NamedListEntry[]) : []}
          onChange={onChange}
          titlePlaceholder={field.titlePlaceholder}
          descriptionPlaceholder={field.descriptionPlaceholder}
          addLabel={field.addLabel}
        />
      );
  }
}

function BubbleMulti({
  value,
  options,
  onChange,
  accent,
}: {
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
  accent: "primary" | "coral";
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt);
        const activeCls = accent === "primary" ? "bg-primary text-primary-foreground border-primary" : "bg-coral text-[oklch(0.98_0.01_85)] border-coral";
        return (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={`text-xs rounded-full border px-3 py-1.5 transition ${
              on ? activeCls : "border-border bg-background hover:bg-muted text-foreground/80"
            }`}
          >
            {on ? "✓ " : ""}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Checklist({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <label key={opt} className="flex items-start gap-3 text-sm cursor-pointer group">
            <span
              className={`mt-0.5 shrink-0 w-4 h-4 rounded border grid place-items-center text-[10px] ${
                on ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background group-hover:border-primary/60"
              }`}
            >
              {on ? "✓" : ""}
            </span>
            <input type="checkbox" checked={on} onChange={() => toggle(opt)} className="sr-only" />
            <span className={on ? "text-foreground" : "text-foreground/75"}>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

async function attachmentsFromFileList(files: FileList | null): Promise<FileAttachment[]> {
  if (!files) return [];
  const out: FileAttachment[] = [];
  for (const f of Array.from(files)) out.push(await fileToAttachment(f));
  return out;
}

function FileChip({ file, onRemove }: { file: FileAttachment; onRemove: () => void }) {
  const kb = Math.max(1, Math.round(file.size / 1024));
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
      <span className="font-mono text-[10px] uppercase text-muted-foreground">FILE</span>
      <span className="truncate max-w-[220px]" title={file.name}>{file.name}</span>
      <span className="text-muted-foreground">· {kb} KB</span>
      <button type="button" onClick={onRemove} className="ml-1 text-muted-foreground hover:text-coral" aria-label="Remove file">
        ✕
      </button>
    </div>
  );
}

function UploadButton({ onFiles, label = "Upload files" }: { onFiles: (files: FileAttachment[]) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="text-xs rounded-full border border-dashed border-primary/50 text-primary px-3 py-1.5 hover:bg-primary/5"
      >
        ＋ {label}
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = await attachmentsFromFileList(e.target.files);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </>
  );
}

function FreeFiles({ value, onChange }: { value: FileAttachment[]; onChange: (v: FileAttachment[]) => void }) {
  return (
    <div className="space-y-3">
      <UploadButton onFiles={(fs) => onChange([...value, ...fs])} />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((f, i) => (
            <FileChip key={i} file={f} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
    </div>
  );
}

function SlotFiles({
  value,
  slots,
  onChange,
}: {
  value: Record<string, FileAttachment[]>;
  slots: string[];
  onChange: (v: Record<string, FileAttachment[]>) => void;
}) {
  const setSlot = (slot: string, files: FileAttachment[]) => onChange({ ...value, [slot]: files });
  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const files = value[slot] ?? [];
        return (
          <div key={slot} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-medium">{slot}</div>
              <UploadButton onFiles={(fs) => setSlot(slot, [...files, ...fs])} label="Add file" />
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((f, i) => (
                  <FileChip key={i} file={f} onRemove={() => setSlot(slot, files.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InjectsField({ value, onChange }: { value: InjectEntry[]; onChange: (v: InjectEntry[]) => void }) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState<FileAttachment[]>([]);

  const add = () => {
    if (!name.trim() && pending.length === 0) return;
    const entry: InjectEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim() || "Untitled inject",
      files: pending,
    };
    onChange([...value, entry]);
    setName("");
    setPending([]);
  };

  const removeInject = (id: string) => onChange(value.filter((x) => x.id !== id));
  const removeFileFromInject = (id: string, idx: number) =>
    onChange(value.map((x) => (x.id === id ? { ...x, files: x.files.filter((_, i) => i !== idx) } : x)));
  const addFileToInject = (id: string, files: FileAttachment[]) =>
    onChange(value.map((x) => (x.id === id ? { ...x, files: [...x.files, ...files] } : x)));

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/[0.03] p-3 space-y-3">
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 items-center">
          <input
            type="text"
            placeholder="Name of inject (e.g. Hurricane advisory #1)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <UploadButton onFiles={(fs) => setPending([...pending, ...fs])} label="Attach file(s)" />
          <button
            type="button"
            onClick={add}
            className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-2 hover:bg-primary/90"
          >
            Add to log
          </button>
        </div>
        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pending.map((f, i) => (
              <FileChip key={i} file={f} onRemove={() => setPending(pending.filter((_, j) => j !== i))} />
            ))}
          </div>
        )}
      </div>

      {/* Log */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Inject log · {value.length} {value.length === 1 ? "entry" : "entries"}
        </div>
        {value.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">No injects added yet.</div>
        ) : (
          <ol className="space-y-2">
            {value.map((inj, i) => (
              <li key={inj.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-primary">#{String(i + 1).padStart(2, "0")}</div>
                    <div className="text-sm font-medium truncate">{inj.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UploadButton onFiles={(fs) => addFileToInject(inj.id, fs)} label="Add" />
                    <button
                      type="button"
                      onClick={() => removeInject(inj.id)}
                      className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted text-muted-foreground"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {inj.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inj.files.map((f, idx) => (
                      <FileChip key={idx} file={f} onRemove={() => removeFileFromInject(inj.id, idx)} />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function RosterField({ value, onChange }: { value: RosterEntry[]; onChange: (v: RosterEntry[]) => void }) {
  const add = () =>
    onChange([...value, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: "", role: "", email: "" }]);
  const update = (id: string, patch: Partial<RosterEntry>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => onChange(value.filter((r) => r.id !== id));

  const inputClass =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <div className="text-xs text-muted-foreground italic">No team members added yet.</div>
      )}
      {value.map((r) => (
        <div key={r.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} placeholder="Name" className={inputClass} />
          <input value={r.role} onChange={(e) => update(r.id, { role: e.target.value })} placeholder="Role" className={inputClass} />
          <input value={r.email} onChange={(e) => update(r.id, { email: e.target.value })} placeholder="Email" type="email" className={inputClass} />
          <button
            type="button"
            onClick={() => remove(r.id)}
            className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted text-muted-foreground"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs rounded-full border border-dashed border-primary/50 text-primary px-3 py-1.5 hover:bg-primary/5"
      >
        ＋ Add team member
      </button>
    </div>
  );
}

function HazardsField({
  value,
  options,
  onChange,
  namePlaceholder,
}: {
  value: HazardSelection[];
  options: string[];
  onChange: (v: HazardSelection[]) => void;
  namePlaceholder?: string;
}) {
  const toggle = (opt: string) => {
    const exists = value.find((v) => v.option === opt);
    if (exists) onChange(value.filter((v) => v.option !== opt));
    else onChange([...value, { option: opt, name: "" }]);
  };
  const setName = (opt: string, name: string) =>
    onChange(value.map((v) => (v.option === opt ? { ...v, name } : v)));

  const inputClass =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = !!value.find((v) => v.option === opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => toggle(opt)}
              className={`text-xs rounded-full border px-3 py-1.5 transition ${
                on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-background hover:bg-muted text-foreground/80"
              }`}
            >
              {on ? "✓ " : ""}
              {opt}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((h) => (
            <div key={h.option} className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 items-center">
              <div className="text-xs font-medium text-foreground/80">{h.option}</div>
              <input
                value={h.name}
                onChange={(e) => setName(h.option, e.target.value)}
                placeholder={namePlaceholder ?? "Name this hazard"}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NamedListField({
  value,
  onChange,
  titlePlaceholder,
  descriptionPlaceholder,
  addLabel,
}: {
  value: NamedListEntry[];
  onChange: (v: NamedListEntry[]) => void;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  addLabel?: string;
}) {
  const add = () =>
    onChange([
      ...value,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: "", description: "" },
    ]);
  const update = (id: string, patch: Partial<NamedListEntry>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => onChange(value.filter((r) => r.id !== id));

  const inputClass =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <div className="text-xs text-muted-foreground italic">Nothing added yet.</div>
      )}
      {value.map((r) => (
        <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <input
              value={r.title}
              onChange={(e) => update(r.id, { title: e.target.value })}
              placeholder={titlePlaceholder ?? "Title"}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => remove(r.id)}
              className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted text-muted-foreground"
            >
              ✕
            </button>
          </div>
          <textarea
            rows={3}
            value={r.description}
            onChange={(e) => update(r.id, { description: e.target.value })}
            placeholder={descriptionPlaceholder ?? "Description"}
            className={inputClass}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs rounded-full border border-dashed border-primary/50 text-primary px-3 py-1.5 hover:bg-primary/5"
      >
        ＋ {addLabel ?? "Add"}
      </button>
    </div>
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
