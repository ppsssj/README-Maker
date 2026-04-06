export type ReadmeBlockType =
  | "title"
  | "paragraph"
  | "list"
  | "checklist"
  | "code"
  | "image"
  | "divider";

export interface ChecklistItem {
  checked: boolean;
  text: string;
}

export interface ReadmeBlock {
  id: string;
  type: ReadmeBlockType;
  text?: string;
  level?: number;
  language?: string;
  code?: string;
  alt?: string;
  url?: string;
  items?: string[];
  checklistItems?: ChecklistItem[];
}

export function parseMarkdown(markdown: string): ReadmeBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReadmeBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim().length === 0) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      index += 1;

      const codeLines: string[] = [];
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && lines[index].startsWith("```")) {
        index += 1;
      }

      blocks.push({
        id: createId("code", blocks.length),
        type: "code",
        language,
        code: codeLines.join("\n")
      });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        id: createId("title", blocks.length),
        type: "title",
        level: headingMatch[1].length,
        text: headingMatch[2].trim()
      });
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({
        id: createId("divider", blocks.length),
        type: "divider"
      });
      index += 1;
      continue;
    }

    const imageMatch = line.trim().match(/^!\[(.*)\]\((.*)\)$/);
    if (imageMatch) {
      blocks.push({
        id: createId("image", blocks.length),
        type: "image",
        alt: imageMatch[1].trim(),
        url: imageMatch[2].trim()
      });
      index += 1;
      continue;
    }

    if (isChecklistLine(line)) {
      const items: ChecklistItem[] = [];
      while (index < lines.length && isChecklistLine(lines[index])) {
        const match = lines[index].match(/^- \[([ xX])\]\s+(.*)$/);
        if (match) {
          items.push({
            checked: match[1].toLowerCase() === "x",
            text: match[2].trim()
          });
        }
        index += 1;
      }

      blocks.push({
        id: createId("checklist", blocks.length),
        type: "checklist",
        checklistItems: items
      });
      continue;
    }

    if (isListLine(line)) {
      const items: string[] = [];
      while (index < lines.length && isListLine(lines[index])) {
        items.push(lines[index].replace(/^- /, "").trim());
        index += 1;
      }

      blocks.push({
        id: createId("list", blocks.length),
        type: "list",
        items
      });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && !isBlockBoundary(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({
      id: createId("paragraph", blocks.length),
      type: "paragraph",
      text: paragraphLines.join("\n").trim()
    });
  }

  return blocks;
}

export function generateMarkdown(blocks: ReadmeBlock[]): string {
  const renderedBlocks = blocks
    .map(renderBlock)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return renderedBlocks.length > 0 ? `${renderedBlocks.join("\n\n")}\n` : "";
}

function renderBlock(block: ReadmeBlock): string {
  switch (block.type) {
    case "title": {
      const text = cleanInline(block.text);
      if (!text) {
        return "";
      }

      const level = clamp(block.level ?? 1, 1, 6);
      return `${"#".repeat(level)} ${text}`;
    }

    case "paragraph":
      return normalizeParagraph(block.text);

    case "list": {
      const items = (block.items ?? [])
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      return items.map((item) => `- ${item}`).join("\n");
    }

    case "checklist": {
      const items = (block.checklistItems ?? [])
        .map((item) => ({
          ...item,
          text: item.text.trim()
        }))
        .filter((item) => item.text.length > 0);

      return items
        .map((item) => `- [${item.checked ? "x" : " "}] ${item.text}`)
        .join("\n");
    }

    case "code": {
      const code = (block.code ?? "").trimEnd();
      if (!code) {
        return "";
      }

      const language = cleanInline(block.language);
      return ["```" + language, code, "```"].join("\n");
    }

    case "image": {
      const url = (block.url ?? "").trim();
      if (!url) {
        return "";
      }

      const alt = cleanInline(block.alt);
      return `![${alt}](${url})`;
    }

    case "divider":
      return "---";

    default:
      return "";
  }
}

function isBlockBoundary(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.length === 0 ||
    line.startsWith("```") ||
    /^(#{1,6})\s+/.test(line) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed) ||
    /^!\[(.*)\]\((.*)\)$/.test(trimmed) ||
    isChecklistLine(line) ||
    isListLine(line)
  );
}

function isChecklistLine(line: string): boolean {
  return /^- \[[ xX]\]\s+/.test(line);
}

function isListLine(line: string): boolean {
  return /^- (?!\[[ xX]\])/.test(line);
}

function normalizeParagraph(text?: string): string {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function cleanInline(value?: string): string {
  return (value ?? "").replace(/\r?\n/g, " ").trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}
