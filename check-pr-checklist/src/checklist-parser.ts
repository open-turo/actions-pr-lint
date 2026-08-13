import type {
  ClassifiedLine,
  IndicatorMarker,
  ValidationResult,
} from "./types.js";

import {
  buildIndicatorMatcher,
  classifyLines,
  findCheckboxBlocks,
} from "./classify.js";
import { stripFencedCodeBlocks } from "./strip-fenced-code-blocks.js";
import {
  emptyResult,
  rejectZeroSelectMarkers,
  validateAllCheckboxes,
  validateMarkedGroups,
} from "./validate.js";

export type {
  Checkbox,
  CheckboxBlock,
  ChecklistGroup,
  ClassifiedLine,
  IndicatorMarker,
  LineType,
  ValidationError,
  ValidationResult,
} from "./types.js";

/**
 * Parses a PR body and validates its checklist(s) against the marker-driven rules.
 * @param body - The PR body to validate.
 * @param indicator - Keyword identifying indicator marker comments (e.g. "checklist").
 * @returns The validation result, including pass/fail, errors, warnings, and checkbox counts.
 */
export function parseAndValidate(
  body: null | string | undefined,
  indicator: string,
): ValidationResult {
  if (!body || body.trim() === "") {
    return emptyResult();
  }

  const matchIndicator = buildIndicatorMatcher(indicator);
  const strippedLines = stripFencedCodeBlocks(body).split("\n");
  const classified = classifyLines(strippedLines, matchIndicator);

  const markers = classified
    .filter(
      (line): line is { marker: IndicatorMarker } & ClassifiedLine =>
        line.type === "indicator" && line.marker !== undefined,
    )
    .map((line) => line.marker);

  const blocks = findCheckboxBlocks(classified);

  const { errors: zeroSelectErrors, valid: validMarkers } =
    rejectZeroSelectMarkers(markers);

  if (validMarkers.length === 0 && zeroSelectErrors.length === 0) {
    return validateAllCheckboxes(blocks);
  }

  return validateMarkedGroups(
    classified,
    validMarkers,
    blocks,
    zeroSelectErrors,
  );
}
