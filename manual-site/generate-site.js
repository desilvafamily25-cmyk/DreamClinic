const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

const tabs = [
  { id: "complete-manual", label: "Complete Full Manual", title: "Complete Full Manual" },
  { id: "part-1", label: "Part 1 Foundations", title: "Part 1 Foundations" },
  { id: "part-2", label: "Part 2 Operations", title: "Part 2 Operations" },
  { id: "part-3", label: "Part 3 Owner Control", title: "Part 3 Owner Control" },
];

const documentConfigs = {
  "DreamClinic_GP_Operators_Framework.docx": {
    id: "complete-framework",
    tab: "complete-manual",
    title: "DreamClinic GP Clinic Operator's Framework",
    summary: "Compiled full operations manual in one document.",
  },
  "01a_Parts_1-2_Executive_Overview_Management_Structure.md": {
    id: "part-1-overview",
    tab: "part-1",
    title: "Parts 1-2 Executive Overview & Management Structure",
    summary: "Executive overview, business model, management structure, and owner oversight.",
  },
  "01b_Part3a_TaskMap_Cat1-10.md": {
    id: "part-1-taskmap-a",
    tab: "part-1",
    title: "Part 3A Task Map Categories 1-10",
    summary: "Core operational task categories 1-10.",
  },
  "01c_Part3b_TaskMap_Cat11-20.md": {
    id: "part-1-taskmap-b",
    tab: "part-1",
    title: "Part 3B Task Map Categories 11-20",
    summary: "Core operational task categories 11-20.",
  },
  "01d_Part4_Recurring_Task_Calendar.md": {
    id: "part-1-calendar",
    tab: "part-1",
    title: "Part 4 Recurring Task Calendar",
    summary: "Daily, weekly, monthly, annual, and event-based operating tasks.",
  },
  "02_Parts_5-8_Money_Contracts_HR_Registrations.md": {
    id: "part-2-finance-hr",
    tab: "part-2",
    title: "Parts 5-8 Money, Contracts, HR & Registrations",
    summary: "Money flow, legal documents, HR controls, and registrations.",
  },
  "03_Parts_9-12_Insurance_Suppliers_Documents_Retrieval.md": {
    id: "part-2-insurance-docs",
    tab: "part-2",
    title: "Parts 9-12 Insurance, Suppliers, Documents & Retrieval",
    summary: "Insurance, suppliers, document systems, and retrieval workflows.",
  },
  "04_Parts_13-16_Dashboard_90Days_RedFlags_Final.md": {
    id: "part-3-owner-control",
    tab: "part-3",
    title: "Parts 13-16 Dashboard, 90 Days, Red Flags & Final Checklist",
    summary: "Owner dashboard, 90-day plan, red flags, and final review tools.",
  },
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/ /g, "-");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function repairMojibake(value) {
  if (typeof value !== "string") return value;
  if (!/[âÂ]/.test(value)) return value;

  return value
    .replace(/â€™/g, "’")
    .replace(/â€˜/g, "‘")
    .replace(/â€œ/g, "“")
    .replace(/â€�/g, "”")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€¢/g, "•")
    .replace(/â€¦/g, "…")
    .replace(/Â£/g, "£")
    .replace(/Â/g, "")
    .replace(/Ã©/g, "é")
    .replace(/Ã—/g, "×");
}

function deepRepair(value) {
  if (typeof value === "string") {
    return repairMojibake(value);
  }
  if (Array.isArray(value)) {
    return value.map(deepRepair);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, deepRepair(inner)]));
  }
  return value;
}

function inlineMarkdown(value) {
  let text = escapeHtml(repairMojibake(value));
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return text;
}

function renderTable(lines) {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim())
  );
  if (rows.length < 2) {
    return rows.map((row) => `<p>${row.map(inlineMarkdown).join(" | ")}</p>`).join("");
  }
  const header = rows[0];
  const body = rows.slice(2);
  const thead = `<thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
}

function renderTableRows(rows) {
  if (!rows.length) return "";
  const header = rows[0];
  const body = rows.slice(1);
  const thead = `<thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell).replace(/\n/g, "<br>")}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
}

function renderList(lines, ordered) {
  const tag = ordered ? "ol" : "ul";
  const items = lines
    .map((line) => {
      const match = ordered ? line.match(/^\d+\.\s+(.*)$/) : line.match(/^[-*]\s+(.*)$/);
      const raw = match ? match[1] : line;
      const task = raw.match(/^\[([ xX])\]\s+(.*)$/);
      if (task) {
        const checked = task[1].toLowerCase() === "x";
        return `<li class="task-item">${checked ? '<span class="checkbox checked"></span>' : '<span class="checkbox"></span>'}<span>${inlineMarkdown(task[2])}</span></li>`;
      }
      return `<li>${inlineMarkdown(raw)}</li>`;
    })
    .join("");
  return `<${tag}>${items}</${tag}>`;
}

function sectionId(text, seenIds) {
  const baseId = slugify(text) || "section";
  const count = (seenIds.get(baseId) || 0) + 1;
  seenIds.set(baseId, count);
  return count === 1 ? baseId : `${baseId}-${count}`;
}

function buildHeading(line, seenIds) {
  const match = line.match(/^(#{1,3})\s+(.*)$/);
  if (!match) return null;
  const level = match[1].length;
  const text = match[2].trim();
  const id = sectionId(text, seenIds);
  return { level, text, id };
}

function markdownToHtml(markdown, docId) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const sections = [];
  const seenIds = new Map();
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const block = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        block.push(lines[i]);
        i += 1;
      }
      i += 1;
      html.push(`<pre><code>${escapeHtml(block.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^\|/.test(trimmed)) {
      const tableLines = [];
      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        tableLines.push(lines[i]);
        i += 1;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const listLines = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        listLines.push(lines[i].trim());
        i += 1;
      }
      html.push(renderList(listLines, false));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const listLines = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listLines.push(lines[i].trim());
        i += 1;
      }
      html.push(renderList(listLines, true));
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      html.push("<hr>");
      i += 1;
      continue;
    }

    const heading = buildHeading(trimmed, seenIds);
    if (heading) {
      const tag = `h${heading.level}`;
      html.push(`<${tag} id="${heading.id}">${inlineMarkdown(heading.text)}</${tag}>`);
      if (heading.level >= 2) {
        sections.push({ id: heading.id, title: heading.text, level: heading.level });
      }
      i += 1;
      continue;
    }

    const paragraph = [];
    while (i < lines.length) {
      const current = lines[i];
      const currentTrimmed = current.trim();
      if (
        !currentTrimmed ||
        /^#{1,3}\s+/.test(currentTrimmed) ||
        /^```/.test(currentTrimmed) ||
        /^\|/.test(currentTrimmed) ||
        /^[-*]\s+/.test(currentTrimmed) ||
        /^\d+\.\s+/.test(currentTrimmed) ||
        /^---+$/.test(currentTrimmed)
      ) {
        break;
      }
      paragraph.push(currentTrimmed);
      i += 1;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return {
    html: html.join("\n"),
    sections,
  };
}

function parseDocx(filePath) {
  const cachePath = `${filePath}.json`;
  if (!fs.existsSync(cachePath)) {
    throw new Error(`Missing extracted DOCX cache: ${cachePath}`);
  }
  return deepRepair(JSON.parse(fs.readFileSync(cachePath, "utf8")));
}

function docxToHtml(blocks, docId) {
  const html = [];
  const sections = [];
  const seenIds = new Map();
  let title = "";

  const headingLevels = {
    Title: 1,
    Heading1: 2,
    Heading2: 3,
    Heading3: 3,
    Heading4: 3,
  };

  blocks.forEach((block) => {
    if (block.type === "hr") {
      html.push("<hr>");
      return;
    }

    if (block.type === "table") {
      html.push(renderTableRows(block.rows || []));
      return;
    }

    if (block.type !== "paragraph") return;

    const text = (block.text || "").trim();
    if (!text) return;

    if (!title && block.style === "Title") {
      title = text;
    }

    if (headingLevels[block.style]) {
      const level = headingLevels[block.style];
      const id = sectionId(text, seenIds);
      const tag = `h${Math.min(level, 3)}`;
      html.push(`<${tag} id="${id}">${inlineMarkdown(text)}</${tag}>`);
      if (level >= 2) {
        sections.push({ id, title: text, level: Math.min(level, 3) });
      }
      return;
    }

    if (block.style === "Subtitle") {
      html.push(`<p class="lead">${inlineMarkdown(text).replace(/\n/g, "<br>")}</p>`);
      return;
    }

    html.push(`<p>${inlineMarkdown(text).replace(/\n/g, "<br>")}</p>`);
  });

  return {
    html: html.join("\n"),
    sections,
    title,
    sourceType: "docx",
  };
}

function discoverDocuments() {
  const sourceRoot = path.join(ROOT, "..");
  return fs
    .readdirSync(sourceRoot)
    .filter((name) => !name.startsWith("~$"))
    .filter((name) => /\.(md|docx)$/i.test(name))
    .sort((a, b) => {
      const aConfig = documentConfigs[a];
      const bConfig = documentConfigs[b];
      if (aConfig && bConfig) {
        return Object.keys(documentConfigs).indexOf(a) - Object.keys(documentConfigs).indexOf(b);
      }
      return a.localeCompare(b);
    })
    .map((name) => {
      const config = documentConfigs[name] || {
        id: slugify(path.basename(name, path.extname(name))),
        tab: "complete-manual",
        title: path.basename(name, path.extname(name)),
        summary: "Additional source document.",
      };
      return { ...config, file: name };
    });
}

const docs = discoverDocuments().map((doc) => {
  const filePath = path.join(ROOT, "..", doc.file);
  if (doc.file.toLowerCase().endsWith(".docx")) {
    const rendered = docxToHtml(parseDocx(filePath), doc.id);
    return {
      ...doc,
      title: rendered.title || doc.title,
      ...rendered,
    };
  }

  const markdown = fs.readFileSync(filePath, "utf8");
  const rendered = markdownToHtml(markdown, doc.id);
  return {
    ...doc,
    markdown,
    sourceType: "markdown",
    ...rendered,
  };
});

const output = `window.MANUAL_DATA = ${JSON.stringify({ tabs, docs }, null, 2)};\n`;

fs.writeFileSync(path.join(ROOT, "manual-data.js"), output);
console.log("manual-data.js generated");
