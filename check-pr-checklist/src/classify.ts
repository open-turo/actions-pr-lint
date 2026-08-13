import type {
  Checkbox,
  CheckboxBlock,
  ClassifiedLine,
  IndicatorMarker,
} from "./types.js";

import { BLOCK_BREAKING_LINE_TYPES } from "./types.js";

const CHECKBOX_PATTERN = /^\s*[-*+]\s+\[([ xX])\]\s*(.*)/;
const HEADING_PATTERN = /^#{1,6}\s/;
const HR_PATTERN = /^\s*(?:[-*_]\s*){3,}$/;
const REGEX_METACHARACTERS_PATTERN = /[.*+?^${}()|[\]\\]/g;

/**
 * Creates a closure that tests a raw line for an indicator marker and returns a parsed
 * {@link IndicatorMarker} on match, or `undefined` otherwise.
 * @param indicator - The keyword identifying the marker (e.g. "checklist").
 * @returns A matcher function accepting `(raw, lineNumber)`.
 */
export function buildIndicatorMatcher(
  indicator: string,
): (raw: string, lineNumber: number) => IndicatorMarker | undefined {
  const escaped = indicator.replaceAll(
    REGEX_METACHARACTERS_PATTERN,
    String.raw`\$&`,
  );
  const pattern = new RegExp(
    String.raw`^\s*<!--\s*${escaped}(?:\s+select=(\d+))?\s*-->\s*$`,
    "i",
  );
  return (raw, lineNumber) => {
    const match = pattern.exec(raw);
    if (!match) return;
    const selectRaw = match[1];
    return selectRaw === undefined
      ? { line: lineNumber, mode: "all" as const, selectCount: 0 }
      : {
          line: lineNumber,
          mode: "select" as const,
          selectCount: Number.parseInt(selectRaw, 10),
        };
  };
}

/**
 * Classifies each line of a (fence-stripped) markdown body.
 * @param strippedLines - Lines of markdown with fenced code block contents blanked out.
 * @param matchIndicator - Matcher built by {@link buildIndicatorMatcher}.
 * @returns One {@link ClassifiedLine} per input line, 1-indexed.
 */
export function classifyLines(
  strippedLines: string[],
  matchIndicator: (
    raw: string,
    lineNumber: number,
  ) => IndicatorMarker | undefined,
): ClassifiedLine[] {
  return strippedLines.map((raw, index) => {
    const lineNumber = index + 1;

    const marker = matchIndicator(raw, lineNumber);
    if (marker) {
      return { lineNumber, marker, raw, type: "indicator" };
    }

    const checkboxMatch = CHECKBOX_PATTERN.exec(raw);
    if (checkboxMatch) {
      const checkedMarker = checkboxMatch[1];
      const text = checkboxMatch[2] ?? "";
      const checkbox: Checkbox = {
        checked: checkedMarker === "x" || checkedMarker === "X",
        line: lineNumber,
        text,
      };
      return { checkbox, lineNumber, raw, type: "checkbox" };
    }

    if (HEADING_PATTERN.test(raw)) {
      return { lineNumber, raw, type: "heading" };
    }

    if (HR_PATTERN.test(raw)) {
      return { lineNumber, raw, type: "hr" };
    }

    if (raw.trim() === "") {
      return { lineNumber, raw, type: "blank" };
    }

    return { lineNumber, raw, type: "other" };
  });
}

/**
 * Groups checkbox lines into blocks, absorbing non-structural content between them.
 * Only blank lines, headings, horizontal rules, and indicator markers break a block.
 * @param classified - Classified lines produced by {@link classifyLines}.
 * @returns The checkbox blocks found, in line order.
 */
export function findCheckboxBlocks(
  classified: ClassifiedLine[],
): CheckboxBlock[] {
  const blocks: CheckboxBlock[] = [];
  let current: Checkbox[] = [];

  for (const line of classified) {
    if (line.type === "checkbox" && line.checkbox) {
      current.push(line.checkbox);
      continue;
    }

    if (BLOCK_BREAKING_LINE_TYPES.has(line.type)) {
      pushCheckboxBlock(blocks, current);
      current = [];
    }
  }

  pushCheckboxBlock(blocks, current);

  return blocks;
}

/**
 * Pushes a checkbox block built from `items` onto `blocks`, if `items` is non-empty.
 * @param blocks - The blocks array to append to.
 * @param items - The contiguous checkbox items collected so far.
 */
function pushCheckboxBlock(blocks: CheckboxBlock[], items: Checkbox[]): void {
  const startLine = items[0]?.line;
  const endLine = items.at(-1)?.line;
  if (startLine === undefined || endLine === undefined) {
    return;
  }
  blocks.push({ endLine, items: [...items], startLine });
}
