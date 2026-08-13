interface ChecklistResult {
  checked: number;
  total: number;
  unchecked: number;
}

const CHECKBOX_PATTERN = /^\s*[-*+]\s+\[([ xX])\]/;

export function parseChecklist(body?: null | string): ChecklistResult {
  if (!body) {
    return { checked: 0, total: 0, unchecked: 0 };
  }

  const stripped = stripFencedCodeBlocks(body);
  const lines = stripped.split("\n");

  let checked = 0;
  let unchecked = 0;

  for (const line of lines) {
    const match = CHECKBOX_PATTERN.exec(line);
    if (match) {
      const marker = match[1];
      if (marker === "x" || marker === "X") {
        checked++;
      } else {
        unchecked++;
      }
    }
  }

  return {
    checked,
    total: checked + unchecked,
    unchecked,
  };
}

function stripFencedCodeBlocks(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fenceChar = "";

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (!inFence) {
      if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
        inFence = true;
        fenceChar = trimmed.slice(0, 3);
        continue;
      }
      result.push(line);
    } else if (trimmed.startsWith(fenceChar)) {
      inFence = false;
    }
  }

  return result.join("\n");
}
