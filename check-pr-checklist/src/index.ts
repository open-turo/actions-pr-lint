import { getInput, info, setFailed, setOutput } from "@actions/core";

import { parseChecklist } from "./checklist-parser.js";

export function main(): void {
  const prBody = getInput("pr-body");

  const result = parseChecklist(prBody);

  setOutput("total", String(result.total));
  setOutput("checked", String(result.checked));
  setOutput("unchecked", String(result.unchecked));

  if (result.total === 0) {
    info("No checkboxes found in PR body");
    return;
  }

  info(
    `Found ${String(result.total)} checkbox(es): ${String(
      result.checked,
    )} checked, ${String(result.unchecked)} unchecked`,
  );

  if (result.unchecked > 0) {
    setFailed(
      `${String(result.unchecked)} of ${String(
        result.total,
      )} checklist items are unchecked`,
    );
  }
}

main();
