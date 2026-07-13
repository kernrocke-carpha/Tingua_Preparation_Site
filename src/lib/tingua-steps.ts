export type StepField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  placeholder?: string;
  options?: string[];
  hint?: string;
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
  { name: "Agenda", hue: "primary", blurb: "Design the three-day flow of sessions and injects." },
  { name: "Delivery", hue: "gold", blurb: "Prepare, rehearse and run the exercise." },
  { name: "Review", hue: "coral", blurb: "Capture lessons and finalise the AAR." },
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
        label: "Natural Disaster Hazard",
        type: "select",
        options: ["Hurricane", "Flooding", "Volcanic eruption", "Earthquake", "Landslide", "Drought", "Wildfire", "Severe weather"],
      },
      {
        key: "medical",
        label: "Medical Outbreak Hazard",
        type: "select",
        options: ["Communicable disease", "Zoonotic event", "Foodborne illness", "Vector-borne disease", "Chemical exposure", "Emerging pathogen"],
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
      { key: "disciplines", label: "Disciplines represented per group", type: "textarea" },
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
      "Assign the nine generic roles: Exercise Director, Lead Facilitator, Group Facilitators, Minister of Health, EM Actor, PH Technical Actor, One Health Actor, Risk Communication Actor, Rapporteur/Evaluator.",
    bullets: [
      "Minister of Health role activates on Day 2 and Day 3 — challenges recommendations, asks about legal/political implications.",
      "Group Facilitators guide, question and observe — they must never solve the scenario for participants.",
    ],
    fields: [
      { key: "director", label: "Exercise Director", type: "text" },
      { key: "lead", label: "Lead Facilitator", type: "text" },
      { key: "minister", label: "Minister of Health Actor", type: "text" },
      { key: "media", label: "Risk Communication / Media Actor", type: "text" },
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
    fields: [{ key: "day1", label: "Day 1 Session Plan", type: "textarea" }],
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
    fields: [{ key: "day2", label: "Day 2 Session Plan", type: "textarea" }],
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
    fields: [{ key: "day3", label: "Day 3 Session Plan", type: "textarea" }],
  },
  {
    id: 9,
    title: "Complete the Inject Planner",
    short: "Injects",
    phase: "Delivery",
    summary:
      "For every inject capture: number, time, scenario development, recommended inject type, expected discussion / decision and owner.",
    fields: [{ key: "injects", label: "Inject Log", type: "textarea", placeholder: "#01 · 09:15 · Hurricane advisory · Bulletin · Activate EOC · Lead Facilitator" }],
  },
  {
    id: 10,
    title: "Select Inject Types by Day",
    short: "Inject Mix",
    phase: "Delivery",
    summary:
      "Vary the inject formats to keep pressure realistic: WhatsApp messages, lab reports, news clips, maps, videos, dashboards and formal SitReps.",
    bullets: [
      "Day 1 — bulletins, WhatsApp messages, early surveillance snapshots.",
      "Day 2 — laboratory reports, media requests, dashboards, ministerial queries.",
      "Day 3 — recovery bulletins, community feedback, AAR prompts.",
    ],
  },
  {
    id: 11,
    title: "Define Daily Outputs",
    short: "Outputs",
    phase: "Delivery",
    summary:
      "Each day must produce tangible outputs: SitReps, decision logs, ministerial briefings, action plans and observation notes.",
    fields: [{ key: "outputs", label: "Required Daily Outputs", type: "textarea" }],
  },
  {
    id: 12,
    title: "Use the Daily SitRep Template",
    short: "SitRep",
    phase: "Delivery",
    summary:
      "Standardise Situation Reports across groups so evaluators can compare quality and timeliness.",
    bullets: ["Header · Situation Overview · Health Impact · Response Actions · Gaps · Recommendations · Next Steps."],
  },
  {
    id: 13,
    title: "Prepare Facilitator Materials",
    short: "Materials",
    phase: "Delivery",
    summary:
      "Assemble the facilitator pack: scenario document, inject schedule, expected responses, escalation pathways, evaluator checklists.",
  },
  {
    id: 14,
    title: "Conduct a Facilitator Rehearsal",
    short: "Rehearsal",
    phase: "Delivery",
    summary:
      "Walk the entire scenario end-to-end with facilitators and actors at least 48 hours before Day 1.",
  },
  {
    id: 15,
    title: "Monitor Exercise Progress",
    short: "Monitor",
    phase: "Delivery",
    summary:
      "During delivery: watch timing, participation balance, decision quality and inject flow. Adjust pace, not the learning objectives.",
  },
  {
    id: 16,
    title: "Complete the After-Action Review",
    short: "AAR",
    phase: "Review",
    summary:
      "Structured AAR: what was planned, what happened, why, what will be improved. Translate observations into corrective actions with owners and dates.",
    fields: [{ key: "aar", label: "AAR Findings & Actions", type: "textarea" }],
  },
  {
    id: 17,
    title: "Final Quality Check",
    short: "Sign-off",
    phase: "Review",
    summary:
      "Confirm every objective has success criteria, every inject has an owner, every day has outputs, and the AAR is scheduled.",
  },
];
