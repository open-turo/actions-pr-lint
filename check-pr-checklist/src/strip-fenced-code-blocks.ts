/**
 * Replaces fenced code block contents with blank lines so their contents are never parsed as
 * checklist items or indicator markers, while preserving the original line count/numbers.
 * @param text - Raw markdown text.
 * @returns The text with fenced code block lines (opening, interior, and closing) blanked out.
 */
export function stripFencedCodeBlocks(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inFence = false;
  let fencePrefix = "";

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (inFence) {
      const fenceChar = fencePrefix[0] === "~" ? "~" : "`";
      const isClosing = new RegExp(
        `^${fenceChar}{${String(fencePrefix.length)},}\\s*$`,
      ).test(trimmed);
      if (isClosing) {
        inFence = false;
      }
      result.push("");
    } else {
      const backtickMatch = /^(`{3,})/.exec(trimmed);
      const tildeMatch = /^(~{3,})/.exec(trimmed);
      const match = backtickMatch ?? tildeMatch;
      if (match) {
        inFence = true;
        fencePrefix = match[1] ?? "";
        result.push("");
      } else {
        result.push(line);
      }
    }
  }

  return result.join("\n");
}
