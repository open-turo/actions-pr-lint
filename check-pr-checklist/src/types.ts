/** A single parsed checkbox line. */
export interface Checkbox {
  checked: boolean;
  line: number;
  text: string;
}

/** A contiguous block of checkbox lines. */
export interface CheckboxBlock {
  endLine: number;
  items: Checkbox[];
  startLine: number;
}

/** An indicator paired with its checkbox block. */
export interface ChecklistGroup {
  block: CheckboxBlock;
  marker: IndicatorMarker;
}

/** A classified line with extracted data. */
export interface ClassifiedLine {
  checkbox?: Checkbox;
  lineNumber: number;
  marker?: IndicatorMarker;
  raw: string;
  type: LineType;
}

/** A parsed indicator marker. */
export interface IndicatorMarker {
  line: number;
  mode: "all" | "select";
  selectCount: number;
}

/** Line type tag. */
export type LineType =
  "blank" | "checkbox" | "heading" | "hr" | "indicator" | "other";

/**
 * Line types that terminate a checkbox block. Non-checkbox lines whose type is NOT
 * in this set are absorbed into the current block (e.g. continuation text, images).
 */
export const BLOCK_BREAKING_LINE_TYPES: ReadonlySet<LineType> = new Set([
  "blank",
  "heading",
  "hr",
  "indicator",
]);

/** A single validation error. */
export interface ValidationError {
  message: string;
}

/** Result of validating the PR body. */
export interface ValidationResult {
  checked: number;
  errors: ValidationError[];
  pass: boolean;
  total: number;
  unchecked: number;
  warnings: string[];
}
