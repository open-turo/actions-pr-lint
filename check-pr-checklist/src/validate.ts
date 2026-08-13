import type {
  CheckboxBlock,
  ChecklistGroup,
  ClassifiedLine,
  IndicatorMarker,
  ValidationError,
  ValidationResult,
} from "./types.js";

/** Returns an empty passing result. */
export function emptyResult(): ValidationResult {
  return {
    checked: 0,
    errors: [],
    pass: true,
    total: 0,
    unchecked: 0,
    warnings: [],
  };
}

/** Validates markers and partitions them into valid and zero-select errors. */
export function rejectZeroSelectMarkers(markers: IndicatorMarker[]): {
  errors: ValidationError[];
  valid: IndicatorMarker[];
} {
  const errors: ValidationError[] = [];
  const valid: IndicatorMarker[] = [];
  for (const m of markers) {
    if (m.mode === "select" && m.selectCount === 0) {
      errors.push({
        message: `select=0 at line ${String(
          m.line,
        )} is invalid; select must be at least 1`,
      });
    } else {
      valid.push(m);
    }
  }
  return { errors, valid };
}

/** Fallback validation when no indicator markers are present: all checkboxes must be checked. */
export function validateAllCheckboxes(
  blocks: CheckboxBlock[],
): ValidationResult {
  const items = blocks.flatMap((block) => block.items);
  const checked = items.filter((item) => item.checked).length;
  const total = items.length;
  const unchecked = total - checked;

  const errors: ValidationError[] =
    unchecked > 0
      ? [
          {
            message: `${String(unchecked)} of ${String(
              total,
            )} checklist items are unchecked`,
          },
        ]
      : [];

  return {
    checked,
    errors,
    pass: errors.length === 0,
    total,
    unchecked,
    warnings: [],
  };
}

/** Validates indicator-marked checklist groups, collecting errors, warnings, and checkbox counts. */
export function validateMarkedGroups(
  classified: ClassifiedLine[],
  validMarkers: IndicatorMarker[],
  blocks: CheckboxBlock[],
  zeroSelectErrors: ValidationError[],
): ValidationResult {
  const { groups, warnings } = mapIndicatorsToBlocks(
    classified,
    validMarkers,
    blocks,
  );

  const errors: ValidationError[] = [...zeroSelectErrors];
  let checked = 0;
  let total = 0;

  for (const group of groups) {
    checked += group.block.items.filter((item) => item.checked).length;
    total += group.block.items.length;

    const error = validateGroup(group);
    if (error) {
      errors.push(error);
    }
  }

  return {
    checked,
    errors,
    pass: errors.length === 0,
    total,
    unchecked: total - checked,
    warnings,
  };
}

/**
 * Maps each indicator marker to the next checkbox block that follows it. A heading or horizontal
 * rule between a marker and the next block acts as a barrier, preventing the association. When two
 * markers target the same block, the first one wins and subsequent markers produce a warning.
 * Blocks with no associated marker and markers with no following block are also warned about.
 * @param classified - Classified lines produced by classifyLines.
 * @param markers - Indicator markers found in the body, in line order.
 * @param blocks - Checkbox blocks found in the body, in line order.
 * @returns The resulting marker/block pairings and any warnings about unmapped markers or blocks.
 */
function mapIndicatorsToBlocks(
  classified: ClassifiedLine[],
  markers: IndicatorMarker[],
  blocks: CheckboxBlock[],
): { groups: ChecklistGroup[]; warnings: string[] } {
  const warnings: string[] = [];
  const groups: ChecklistGroup[] = [];
  const claimedStartLines = new Set<number>();

  for (const marker of markers) {
    const candidate = blocks.find((block) => block.startLine > marker.line);

    if (!candidate) {
      warnings.push(
        `Indicator marker at line ${String(
          marker.line,
        )} has no following checklist block and was ignored`,
      );
      continue;
    }

    const hasBarrier = classified.some(
      (line) =>
        line.lineNumber > marker.line &&
        line.lineNumber < candidate.startLine &&
        (line.type === "heading" || line.type === "hr"),
    );

    if (hasBarrier) {
      warnings.push(
        `Indicator marker at line ${String(
          marker.line,
        )} is separated from the next checklist by a heading or horizontal rule and was skipped`,
      );
      continue;
    }

    if (claimedStartLines.has(candidate.startLine)) {
      warnings.push(
        `Indicator marker at line ${String(
          marker.line,
        )} conflicts with another marker for the checklist starting at line ${String(
          candidate.startLine,
        )}; the first marker takes precedence`,
      );
      continue;
    }

    claimedStartLines.add(candidate.startLine);
    groups.push({ block: candidate, marker });
  }

  for (const block of blocks) {
    if (!claimedStartLines.has(block.startLine)) {
      warnings.push(
        `Checklist at lines ${String(block.startLine)}-${String(
          block.endLine,
        )} has no indicator marker and was ignored`,
      );
    }
  }

  return { groups, warnings };
}

/**
 * Validates a single checklist group against its indicator marker's rule.
 * @param group - The marker/block pairing to validate.
 * @returns A {@link ValidationError} if the group fails validation, otherwise undefined.
 */
function validateGroup(group: ChecklistGroup): undefined | ValidationError {
  const { block, marker } = group;
  const checkedCount = block.items.filter((item) => item.checked).length;
  const rangeLabel = `checkboxes lines ${String(block.startLine)}-${String(
    block.endLine,
  )}`;

  if (marker.mode === "all") {
    const uncheckedCount = block.items.length - checkedCount;
    if (uncheckedCount > 0) {
      return {
        message: `${String(uncheckedCount)} of ${String(
          block.items.length,
        )} checklist items are unchecked (marker line ${String(
          marker.line,
        )}, ${rangeLabel})`,
      };
    }
    return undefined;
  }

  if (marker.selectCount > block.items.length) {
    return {
      message: `select=${String(marker.selectCount)} at line ${String(
        marker.line,
      )} but block only has ${String(block.items.length)} checkboxes`,
    };
  }

  if (checkedCount < marker.selectCount) {
    return {
      message: `Incomplete select list (marker line ${String(
        marker.line,
      )}, ${rangeLabel}): ${String(checkedCount)} of ${String(
        marker.selectCount,
      )} items selected`,
    };
  }

  if (checkedCount > marker.selectCount) {
    return {
      message: `Too many items selected (marker line ${String(
        marker.line,
      )}, ${rangeLabel}): ${String(checkedCount)} selected, expected ${String(
        marker.selectCount,
      )}`,
    };
  }

  return undefined;
}
