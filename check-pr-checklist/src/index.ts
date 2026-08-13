import { getInput, info, setFailed, setOutput, warning } from "@actions/core";

import { parseAndValidate } from "./checklist-parser.js";

export function main(): void {
  const prBody = getInput("pr-body");
  const indicator = getInput("indicator") || "checklist";

  const result = parseAndValidate(prBody, indicator);

  for (const w of result.warnings) {
    warning(w);
  }

  setOutput("total", String(result.total));
  setOutput("checked", String(result.checked));
  setOutput("unchecked", String(result.unchecked));

  if (result.total === 0 && result.errors.length === 0) {
    info("No checkboxes found in PR body");
    return;
  }

  info(
    `Found ${String(result.total)} checkbox(es): ${String(
      result.checked,
    )} checked, ${String(result.unchecked)} unchecked`,
  );

  if (!result.pass) {
    setFailed(result.errors.map((error) => error.message).join("; "));
  }
}

main();
