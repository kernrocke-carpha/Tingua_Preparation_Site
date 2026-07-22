export type FileAttachment = {
  name: string;
  mime: string;
  dataUrl: string;
  size: number;
};

export type InjectEntry = {
  id: string;
  name: string;
  files: FileAttachment[];
};

export type RosterEntry = {
  id: string;
  name: string;
  role: string;
  email: string;
};

export type HazardSelection = {
  option: string;
  name: string;
};

export type NamedListEntry = {
  id: string;
  title: string;
  description: string;
};

export type StepField =
  | {
      key: string;
      label: string;
      type: "text" | "textarea" | "select" | "number" | "date";
      placeholder?: string;
      options?: string[];
      hint?: string;
      autofillFrom?: { step: number; key: string };
    }
  | {
      key: string;
      label: string;
      type: "multiselect" | "checklist";
      options: string[];
      hint?: string;
    }
  | {
      key: string;
      label: string;
      type: "hazards";
      options: string[];
      hint?: string;
      namePlaceholder?: string;
    }
  | {
      key: string;
      label: string;
      type: "files";
      slots?: string[]; // named upload rows; if omitted, single free-form uploader
      hint?: string;
    }
  | {
      key: string;
      label: string;
      type: "injects" | "roster";
      hint?: string;
    }
  | {
      key: string;
      label: string;
      type: "namedList";
      hint?: string;
      titlePlaceholder?: string;
      descriptionPlaceholder?: string;
      addLabel?: string;
    };

export type Step = {
  id: number;
  title: string;
  short: string;
  phase: "Profile" | "Structure" | "Scenario" | "Agenda" | "Delivery" | "Review";
  summary: string;
  bullets?: string[];
  fields?: StepField[];
};

export const PHASES: { name: Step["phase"]; hue: string; blurb: string }[] = [
  { name: "Profile", hue: "primary", blurb: "Define the exercise identity, hazards and objectives." },
  { name: "Structure", hue: "gold", blurb: "Assemble the groups, facilitators and role players." },
  { name: "Scenario", hue: "coral", blurb: "Build the dual-hazard narrative and decision points." },
  { name: "Agenda", hue: "primary", blurb: "Design the three-day flow of sessions, injects and outputs." },
  { name: "Delivery", hue: "gold", blurb: "Prepare, rehearse and run the exercise." },
  { name: "Review", hue: "coral", blurb: "Capture lessons and finalise the AAR." },
];

export const INJECT_TYPE_OPTIONS = [
  "Bulletin",
  "WhatsApp message",
  "Laboratory report",
  "News clip",
  "Map",
  "Video",
  "Dashboard",
  "SitRep",
  "Ministerial query",
  "Community feedback",
  "Rumour",
  "AAR prompt",
];

export const STEPS: Step[] = [
  {
    id: 1,
    title: "Define the Exercise Profile",
    short: "Profile",
    phase: "Profile",
    summary:
      "Establish the identity of the exercise: title, country setting, dates, venue, hazards, scenario summary, participants and success criteria.",
    bullets: [
      "Give the exercise a distinct, memorable title tied to the dual-hazard scenario.",
      "Confirm the fictional country setting — Tingua — and the sub-national location.",
      "Fix dates, venue and target participant numbers before scenario design begins.",
    ],
    fields: [
      { key: "title", label: "Exercise Title", type: "text", placeholder: "e.g. Tingua SimEx 2026 — Storm & Fever" },
      { key: "country", label: "Country and Setting", type: "text", placeholder: "Tingua — Northern District" },
      { key: "dates", label: "Dates", type: "text", placeholder: "3 – 5 June 2026" },
      { key: "venue", label: "Venue", type: "text", placeholder: "National EOC, Port Tingua" },
      {
        key: "natural",
        label: "Natural Disaster Hazard(s)",
        type: "hazards",
        options: ["Hurricane", "Flooding", "Volcanic eruption", "Earthquake", "Landslide", "Drought", "Wildfire", "Severe weather"],
        namePlaceholder: "Name this hazard (e.g. Hurricane Selene)",
        hint: "Tap each hazard that applies, then name it as it will appear in the scenario.",
      },
      {
        key: "medical",
        label: "Medical Outbreak Hazard(s)",
        type: "hazards",
        options: ["Communicable disease", "Zoonotic event", "Foodborne illness", "Vector-borne disease", "Chemical exposure", "Emerging pathogen"],
        namePlaceholder: "Name this outbreak (e.g. Dengue serotype 2)",
        hint: "Tap each outbreak that applies, then name the pathogen or event.",
      },
      { key: "scenario", label: "Scenario Summary", type: "textarea", placeholder: "One paragraph describing the compound emergency…" },
      { key: "participants", label: "Target Participants", type: "textarea", placeholder: "Ministry of Health, NDMO, laboratories, veterinary services…" },
      { key: "total", label: "Total Number of Participants", type: "number", placeholder: "32" },
      { key: "objectives", label: "Exercise Objectives (3–6, SMART)", type: "textarea", placeholder: "By the end of the exercise, participants should be able to…" },
      { key: "success", label: "Success Criteria", type: "textarea", placeholder: "Observable, measurable indicators of successful performance." },
    ],
  },
  {
    id: 2,
    title: "Establish the Group Structure",
    short: "Groups",
    phase: "Structure",
    summary:
      "Split participants into multidisciplinary coordination teams. Use 3 groups (18–24), 4 groups (25–32) or 5 groups (33–50).",
    bullets: [
      "Each group blends surveillance, laboratory, clinical, veterinary, emergency management, communication, logistics and policy.",
      "Assign a chair, rapporteur, SitRep lead, technical data lead, spokesperson and timekeeper — rotate daily.",
    ],
    fields: [
      { key: "groups", label: "Number of Groups", type: "number", placeholder: "4" },
      {
        key: "disciplines",
        label: "Disciplines represented per group",
        type: "textarea",
        placeholder: "Auto-populated from Target Participants in Step 1 — edit as needed.",
        autofillFrom: { step: 1, key: "participants" },
        hint: "This mirrors the Target Participants field in Step 1. Edits made here are kept independently.",
      },
      { key: "roles", label: "Rotating Group Roles", type: "textarea", placeholder: "Chair, rapporteur, SitRep lead, spokesperson…" },
    ],
  },
  {
    id: 3,
    title: "Determine the Number of Facilitators",
    short: "Facilitators",
    phase: "Structure",
    summary: "Plan 6 to 10 facilitators depending on size and complexity of the exercise.",
    bullets: [
      "Minimum for three groups: Exercise Director, Lead Facilitator, three Group Facilitators, Rapporteur/Evaluator.",
      "Expand with floating technical, laboratory, EM, veterinary, media, Minister, logistics and evaluator actors.",
      "Brief every facilitator with the full scenario, inject schedule and escalation pathway.",
    ],
    fields: [
      { key: "facCount", label: "Total Facilitators", type: "number", placeholder: "8" },
      { key: "facNotes", label: "Facilitator Assignments", type: "textarea" },
    ],
  },
  {
    id: 4,
    title: "Assign Generic Facilitator Roles",
    short: "Roles",
    phase: "Structure",
    summary:
      "Assign the nine generic roles used across the exercise. Names entered here flow into the final report and facilitator pack.",
    bullets: [
      "Minister of Health role activates on Day 2 and Day 3 — challenges recommendations, asks about legal/political implications.",
      "Group Facilitators guide, question and observe — they must never solve the scenario for participants.",
      "The Rapporteur/Evaluator captures decisions, gaps and improvement proposals throughout.",
    ],
    fields: [
      { key: "director", label: "Exercise Director", type: "text" },
      { key: "lead", label: "Lead Facilitator", type: "text" },
      { key: "groupFac", label: "Group Facilitator(s)", type: "textarea", placeholder: "One name per line — one facilitator per group." },
      { key: "minister", label: "Minister of Health Actor", type: "text" },
      { key: "emActor", label: "Emergency Management Actor", type: "text" },
      { key: "phActor", label: "Public Health Technical Actor", type: "text" },
      { key: "oneHealthActor", label: "One Health / Environmental Actor", type: "text" },
      { key: "media", label: "Risk Communication / Media Actor", type: "text" },
      { key: "rapporteur", label: "Rapporteur / Evaluator", type: "text" },
      {
        key: "rolesDoc",
        label: "Detailed Roles Description Document",
        type: "files",
        hint: "Upload a document that expands on each role's responsibilities, decisions and escalation lines.",
      },
      {
        key: "extraRoles",
        label: "Additional Roles",
        type: "namedList",
        titlePlaceholder: "Role title (e.g. Port Health Liaison)",
        descriptionPlaceholder: "Responsibilities, when they activate, who they report to…",
        addLabel: "Add another role",
        hint: "Add any custom roles specific to this exercise.",
      },
    ],
  },
  {
    id: 5,
    title: "Build the Scenario Architecture",
    short: "Scenario",
    phase: "Scenario",
    summary:
      "Layer the natural disaster and outbreak events, affected populations, health-system disruption, One Health dimensions, national security exposure, information gaps and decision points.",
    bullets: [
      "Natural disaster event & impact — hazard type, intensity, footprint.",
      "Outbreak event & transmission — pathogen, mode, incubation, laboratory context.",
      "Affected populations, locations and displaced-persons estimates.",
      "Health-system disruption — bed capacity, cold chain, staff, supply lines.",
      "One Health & environmental dimensions — animals, water, food, vectors.",
      "Critical infrastructure & security implications.",
      "Information gaps, rumours and media pressure.",
      "Decision points and escalation thresholds.",
    ],
    fields: [
      { key: "arch", label: "Scenario Architecture Notes", type: "textarea", placeholder: "Draft the interlocking events, timeline and thresholds." },
      {
        key: "agendaDoc",
        label: "Full Exercise Agenda",
        type: "files",
        hint: "Upload the complete three-day agenda document (PDF, DOCX or similar).",
      },
    ],
  },
  {
    id: 6,
    title: "Day 1 Agenda — Situational Awareness",
    short: "Day 1",
    phase: "Agenda",
    summary:
      "Day 1 focuses on establishing situational awareness: opening plenary, scenario introduction, first surveillance signals, initial risk assessment and the first coordinated SitRep.",
    bullets: [
      "Registration, opening remarks, exercise rules and safety brief.",
      "Scenario Inject 1 — natural disaster impact bulletin.",
      "Inject 2 — early public health signal from clinical or laboratory data.",
      "Group work: initial risk assessment.",
      "End-of-day SitRep 1.",
    ],
    fields: [
      { key: "day1", label: "Day 1 Session Plan", type: "textarea" },
      { key: "day1Outputs", label: "Required Day 1 Outputs", type: "textarea", placeholder: "SitRep 1, initial risk assessment, decision log…" },
      { key: "day1Injects", label: "Day 1 Injects", type: "injects", hint: "Add each inject with a name and upload the supporting file(s)." },
    ],
  },
  {
    id: 7,
    title: "Day 2 Agenda — Response & Escalation",
    short: "Day 2",
    phase: "Agenda",
    summary:
      "Day 2 introduces complexity: outbreak confirmation, resource strain, media pressure, ministerial briefing and multisectoral coordination.",
    bullets: [
      "Laboratory confirmation inject and case-definition refinement.",
      "Media / rumour inject requiring risk communication.",
      "Group ministerial briefing to the Minister of Health actor.",
      "One Health inject connecting animal, environmental and human signals.",
      "SitRep 2.",
    ],
    fields: [
      { key: "day2", label: "Day 2 Session Plan", type: "textarea" },
      { key: "day2Outputs", label: "Required Day 2 Outputs", type: "textarea", placeholder: "SitRep 2, ministerial briefing note, media statement…" },
      { key: "day2Injects", label: "Day 2 Injects", type: "injects", hint: "Add each inject with a name and upload the supporting file(s)." },
    ],
  },
  {
    id: 8,
    title: "Day 3 Agenda — Recovery & Review",
    short: "Day 3",
    phase: "Agenda",
    summary:
      "Day 3 shifts to recovery planning, continuity of essential health services and the After-Action Review.",
    bullets: [
      "Recovery inject — restoring essential services and resuming surveillance.",
      "Group presentations of response strategy and recommendations.",
      "Facilitated After-Action Review.",
      "Certificates and closing plenary.",
    ],
    fields: [
      { key: "day3", label: "Day 3 Session Plan", type: "textarea" },
      { key: "day3Outputs", label: "Required Day 3 Outputs", type: "textarea", placeholder: "SitRep 3, recovery plan, AAR outputs, certificates…" },
      { key: "day3Injects", label: "Day 3 Injects", type: "injects", hint: "Add each inject with a name and upload the supporting file(s)." },
    ],
  },
  {
    id: 9,
    title: "Complete the Inject Planner",
    short: "Injects",
    phase: "Delivery",
    summary:
      "For every inject capture: number, time, scenario development, recommended inject type, expected discussion / decision and owner.",
    fields: [
      {
        key: "injects",
        label: "Inject Log",
        type: "textarea",
        placeholder: "#01 · 09:15 · Hurricane advisory · Bulletin · Activate EOC · Lead Facilitator",
      },
    ],
  },
  {
    id: 10,
    title: "Select Inject Types by Day",
    short: "Inject Mix",
    phase: "Delivery",
    summary:
      "Vary the inject formats to keep pressure realistic. Tap any bubble to add or remove that inject type for the day. Multiple selections per day are expected.",
    fields: [
      { key: "day1Types", label: "Day 1 inject types", type: "multiselect", options: INJECT_TYPE_OPTIONS },
      { key: "day2Types", label: "Day 2 inject types", type: "multiselect", options: INJECT_TYPE_OPTIONS },
      { key: "day3Types", label: "Day 3 inject types", type: "multiselect", options: INJECT_TYPE_OPTIONS },
    ],
  },
  {
    id: 11,
    title: "Use the Daily SitRep Template",
    short: "SitRep",
    phase: "Delivery",
    summary:
      "Standardise Situation Reports across groups so evaluators can compare quality and timeliness.",
    bullets: ["Header · Situation Overview · Health Impact · Response Actions · Gaps · Recommendations · Next Steps."],
    fields: [
      { key: "sitrepNotes", label: "SitRep Notes", type: "textarea", placeholder: "Any local adaptations to the template." },
      { key: "sitrepTemplate", label: "SitRep Template File", type: "files", hint: "Upload the SitRep template used by all groups." },
    ],
  },
  {
    id: 12,
    title: "Prepare Facilitator Materials",
    short: "Materials",
    phase: "Delivery",
    summary:
      "Assemble the facilitator pack. Upload each component below so it can be bundled into the exercise ZIP.",
    fields: [
      {
        key: "pack",
        label: "Facilitator Pack",
        type: "files",
        slots: [
          "Scenario document",
          "Inject schedule",
          "Expected responses",
          "Escalation pathways",
          "Evaluator checklists",
        ],
      },
    ],
  },
  {
    id: 13,
    title: "Conduct a Facilitator Rehearsal",
    short: "Rehearsal",
    phase: "Delivery",
    summary:
      "Walk the entire scenario end-to-end with facilitators and actors at least 48 hours before Day 1.",
    fields: [
      { key: "rehearsalDate", label: "Rehearsal Date", type: "date" },
      { key: "rehearsalVenue", label: "Rehearsal Venue / Link", type: "text", placeholder: "EOC boardroom / Zoom" },
      { key: "rehearsalTeam", label: "Rehearsal Team", type: "roster", hint: "Add each attendee with their role and email." },
      { key: "rehearsalNotes", label: "Rehearsal Notes", type: "textarea" },
    ],
  },
  {
    id: 14,
    title: "Monitor Exercise Progress",
    short: "Monitor",
    phase: "Delivery",
    summary:
      "During delivery: watch timing, participation balance, decision quality and inject flow. Adjust pace, not the learning objectives.",
    fields: [
      {
        key: "monitorChecklist",
        label: "Monitoring Checklist",
        type: "checklist",
        options: [
          "Timing on track against agenda",
          "Balanced participation across disciplines",
          "Decision quality captured by rapporteur",
          "Injects delivered on cue",
          "Evaluators positioned at each group",
          "Role-play actors coordinated",
          "Room logistics stable (AV, catering, breaks)",
          "Safety and wellbeing observed",
          "Media / rumour pressure calibrated",
          "Adjustments logged for AAR",
        ],
      },
      { key: "monitorNotes", label: "Monitoring Notes", type: "textarea" },
    ],
  },
  {
    id: 15,
    title: "Complete the After-Action Review",
    short: "AAR",
    phase: "Review",
    summary:
      "Structured AAR: capture what was planned, what happened, why, and what will be improved. Translate observations into corrective actions with owners and dates.",
    fields: [
      { key: "aarPlanned", label: "What was planned", type: "textarea" },
      { key: "aarHappened", label: "What actually happened", type: "textarea" },
      { key: "aarWhy", label: "Why — root causes & contributing factors", type: "textarea" },
      { key: "aarImprove", label: "What will be improved (actions, owners, dates)", type: "textarea" },
    ],
  },
  {
    id: 16,
    title: "Final Quality Check",
    short: "Sign-off",
    phase: "Review",
    summary:
      "Confirm every objective has success criteria, every inject has an owner, every day has outputs, and the AAR is scheduled.",
    fields: [
      { key: "signoff", label: "Sign-off Notes", type: "textarea" },
    ],
  },
];
