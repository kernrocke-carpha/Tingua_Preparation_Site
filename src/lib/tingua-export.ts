import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType, PageBreak, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from "docx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import carphaLogo from "@/assets/carpha-logo.png";
import { STEPS, type FileAttachment, type InjectEntry, type RosterEntry, type Step } from "./tingua-steps";

export type PlanState = Record<number, Record<string, unknown>>;

// ---------- helpers ----------

export function fileToAttachment(file: File): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: String(reader.result),
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function fetchLogoBytes(): Promise<Uint8Array> {
  const res = await fetch(carphaLogo);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

function get(state: PlanState, stepId: number, key: string): unknown {
  return state[stepId]?.[key];
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function slugify(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "untitled";
}

// ---------- Markdown ----------

export function buildMarkdown(state: PlanState): string {
  const lines: string[] = ["# Tingua SimEx — Exercise Plan\n"];
  for (const step of STEPS) {
    lines.push(`\n## Step ${step.id}. ${step.title}`);
    lines.push(step.summary);
    if (!step.fields) continue;
    for (const f of step.fields) {
      const v = get(state, step.id, f.key);
      if (f.type === "text" || f.type === "textarea" || f.type === "select" || f.type === "number" || f.type === "date") {
        const s = asString(v).trim();
        if (s) lines.push(`- **${f.label}:** ${s}`);
      } else if (f.type === "multiselect" || f.type === "checklist") {
        const arr = asArray<string>(v);
        if (arr.length) lines.push(`- **${f.label}:** ${arr.join(", ")}`);
      } else if (f.type === "injects") {
        const arr = asArray<InjectEntry>(v);
        if (arr.length) {
          lines.push(`- **${f.label}:**`);
          for (const i of arr) {
            const files = i.files.map((x) => x.name).join(", ") || "(no files)";
            lines.push(`  - ${i.name || "(unnamed)"} — ${files}`);
          }
        }
      } else if (f.type === "roster") {
        const arr = asArray<RosterEntry>(v);
        if (arr.length) {
          lines.push(`- **${f.label}:**`);
          for (const r of arr) lines.push(`  - ${r.name} — ${r.role} — ${r.email}`);
        }
      } else if (f.type === "files") {
        if (f.slots) {
          const map = (v ?? {}) as Record<string, FileAttachment[]>;
          for (const slot of f.slots) {
            const files = map[slot] ?? [];
            if (files.length) lines.push(`- **${slot}:** ${files.map((x) => x.name).join(", ")}`);
          }
        } else {
          const files = asArray<FileAttachment>(v);
          if (files.length) lines.push(`- **${f.label}:** ${files.map((x) => x.name).join(", ")}`);
        }
      }
    }
  }
  return lines.join("\n");
}

// ---------- DOCX ----------

const TEAL = "1F6F80";
const CORAL = "E8734A";
const INK = "1B2A33";

function p(text: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 22,
        color: opts.color ?? INK,
        italics: opts.italics,
        font: "Calibri",
      }),
    ],
  });
}

function h(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel], color = TEAL): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color, font: "Calibri" })],
  });
}

function labelValueRow(label: string, value: string): Table {
  const cell = (text: string, bold = false, fill?: string) =>
    new TableCell({
      width: { size: 4680, type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      shading: fill ? { fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "D6DBDE" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "D6DBDE" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "D6DBDE" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "D6DBDE" },
      },
      children: [new Paragraph({ children: [new TextRun({ text, bold, size: 20, font: "Calibri", color: INK })] })],
    });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [new TableRow({ children: [cell(label, true, "F1F5F7"), cell(value)] })],
  });
}

function stepChildren(step: Step, state: PlanState): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h(`Step ${step.id} · ${step.title}`, HeadingLevel.HEADING_2));
  out.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: step.phase.toUpperCase(), color: CORAL, bold: true, size: 18, font: "Calibri" })],
    })
  );
  out.push(p(step.summary));
  if (step.bullets?.length) {
    for (const b of step.bullets) {
      out.push(new Paragraph({ text: b, bullet: { level: 0 }, spacing: { after: 60 } }));
    }
  }
  if (!step.fields) return out;

  for (const f of step.fields) {
    const v = get(state, step.id, f.key);
    if (f.type === "text" || f.type === "select" || f.type === "number" || f.type === "date") {
      const s = asString(v).trim();
      if (s) out.push(labelValueRow(f.label, s));
    } else if (f.type === "textarea") {
      const s = asString(v).trim();
      if (s) {
        out.push(p(f.label, { bold: true, color: TEAL }));
        for (const line of s.split(/\n+/)) out.push(p(line));
      }
    } else if (f.type === "multiselect" || f.type === "checklist") {
      const arr = asArray<string>(v);
      if (arr.length) {
        out.push(p(f.label, { bold: true, color: TEAL }));
        for (const item of arr) out.push(new Paragraph({ text: item, bullet: { level: 0 } }));
      }
    } else if (f.type === "injects") {
      const arr = asArray<InjectEntry>(v);
      if (arr.length) {
        out.push(p(f.label, { bold: true, color: TEAL }));
        for (const inject of arr) {
          out.push(p(`• ${inject.name || "(unnamed)"}`, { bold: true }));
          for (const fl of inject.files) out.push(p(`   – ${fl.name}`, { italics: true }));
        }
      }
    } else if (f.type === "roster") {
      const arr = asArray<RosterEntry>(v);
      if (arr.length) {
        out.push(p(f.label, { bold: true, color: TEAL }));
        for (const r of arr) out.push(p(`${r.name} — ${r.role} — ${r.email}`));
      }
    } else if (f.type === "files") {
      if (f.slots) {
        const map = (v ?? {}) as Record<string, FileAttachment[]>;
        out.push(p(f.label, { bold: true, color: TEAL }));
        for (const slot of f.slots) {
          const files = map[slot] ?? [];
          const names = files.map((x) => x.name).join(", ") || "—";
          out.push(p(`${slot}: ${names}`));
        }
      } else {
        const files = asArray<FileAttachment>(v);
        if (files.length) {
          out.push(p(f.label, { bold: true, color: TEAL }));
          for (const fl of files) out.push(p(`• ${fl.name}`));
        }
      }
    }
  }
  return out;
}

export async function buildDocx(state: PlanState): Promise<Blob> {
  const logo = await fetchLogoBytes();
  const title = asString(get(state, 1, "title")) || "Tingua SimEx Exercise Plan";
  const dates = asString(get(state, 1, "dates"));
  const venue = asString(get(state, 1, "venue"));

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          type: "png",
          data: logo,
          transformation: { width: 120, height: 120 },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "CARPHA", bold: true, size: 32, color: TEAL, font: "Calibri" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: "Caribbean Public Health Agency · Tingua Simulation Exercise",
          size: 20,
          color: CORAL,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: title, bold: true, size: 40, color: INK, font: "Calibri" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [
        new TextRun({
          text: [dates, venue].filter(Boolean).join("  ·  ") || "Exercise Plan",
          size: 22,
          color: INK,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
    h("Exercise Plan", HeadingLevel.HEADING_1),
    p(
      "This report has been generated from the Tingua SimEx interactive planner. It consolidates each of the planning steps into a single structured document to accompany the exercise delivery pack."
    ),
  ];

  for (const step of STEPS) children.push(...stepChildren(step, state));

  const doc = new Document({
    creator: "Tingua SimEx Toolkit",
    title,
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

// ---------- Save / Load ----------

export function buildSaveJson(state: PlanState): Blob {
  const payload = { version: 1, savedAt: new Date().toISOString(), state };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export async function readSaveJson(file: File): Promise<PlanState> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || !data.state) throw new Error("Invalid save file");
  return data.state as PlanState;
}

// ---------- ZIP ----------

function collectDayInjects(state: PlanState, stepId: number, key: string) {
  return asArray<InjectEntry>(get(state, stepId, key));
}

export async function buildZip(state: PlanState): Promise<Blob> {
  const zip = new JSZip();
  const title = asString(get(state, 1, "title")) || "Tingua SimEx";

  zip.file("README.txt",
    `${title}\n\nThis archive contains everything needed to deliver the Tingua Simulation Exercise:\n` +
    `  • plan.docx — structured exercise report\n` +
    `  • plan.md — same content as Markdown\n` +
    `  • progress.json — reload this in the planner to resume editing\n` +
    `  • injects/ — inject files uploaded for Day 1–3\n` +
    `  • facilitator-pack/ — scenario document, inject schedule, evaluator checklists, etc.\n` +
    `  • sitrep/ — SitRep template\n\n` +
    `Generated ${new Date().toISOString()}\n`);

  zip.file("plan.md", buildMarkdown(state));
  zip.file("progress.json", await buildSaveJson(state).text());

  const docx = await buildDocx(state);
  zip.file("plan.docx", docx);

  const dayMap: { folder: string; step: number; key: string }[] = [
    { folder: "injects/day-1", step: 6, key: "day1Injects" },
    { folder: "injects/day-2", step: 7, key: "day2Injects" },
    { folder: "injects/day-3", step: 8, key: "day3Injects" },
  ];
  for (const d of dayMap) {
    const injects = collectDayInjects(state, d.step, d.key);
    for (const inj of injects) {
      const injFolder = `${d.folder}/${slugify(inj.name)}`;
      for (const f of inj.files) {
        zip.file(`${injFolder}/${f.name}`, dataUrlToUint8(f.dataUrl));
      }
    }
  }

  const pack = (get(state, 12, "pack") ?? {}) as Record<string, FileAttachment[]>;
  for (const [slot, files] of Object.entries(pack)) {
    for (const f of files) {
      zip.file(`facilitator-pack/${slugify(slot)}/${f.name}`, dataUrlToUint8(f.dataUrl));
    }
  }

  const sitrepFiles = asArray<FileAttachment>(get(state, 11, "sitrepTemplate"));
  for (const f of sitrepFiles) {
    zip.file(`sitrep/${f.name}`, dataUrlToUint8(f.dataUrl));
  }

  return zip.generateAsync({ type: "blob" });
}

// ---------- Downloads ----------

export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}
