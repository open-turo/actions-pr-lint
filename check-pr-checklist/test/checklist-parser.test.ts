import { describe, expect, test } from "vitest";

import { parseChecklist } from "../src/checklist-parser.js";

describe("parseChecklist", () => {
  test("returns all checked with correct counts", () => {
    const body = `
## Checklist
- [x] Item 1
- [x] Item 2
- [x] Item 3
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 3, total: 3, unchecked: 0 });
  });

  test("returns one unchecked with correct counts", () => {
    const body = `
- [x] Done
- [ ] Not done
- [x] Also done
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 2, total: 3, unchecked: 1 });
  });

  test("handles mixed checked and unchecked", () => {
    const body = `
- [ ] First
- [x] Second
- [ ] Third
- [X] Fourth
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 2, total: 4, unchecked: 2 });
  });

  test("returns zeros when no checkboxes found", () => {
    const body = "This is a regular PR description with no checkboxes.";
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 0, total: 0, unchecked: 0 });
  });

  test("returns zeros for empty body", () => {
    expect(parseChecklist("")).toEqual({ checked: 0, total: 0, unchecked: 0 });
  });

  test("returns zeros for null body", () => {
    // eslint-disable-next-line unicorn/no-null -- exercising the documented null input case
    expect(parseChecklist(null)).toEqual({
      checked: 0,
      total: 0,
      unchecked: 0,
    });
  });

  test("returns zeros for undefined body", () => {
    expect(parseChecklist()).toEqual({
      checked: 0,
      total: 0,
      unchecked: 0,
    });
  });

  test("ignores checkboxes inside backtick fenced code blocks", () => {
    const body = `
- [x] Real checkbox

\`\`\`markdown
- [ ] This is in a code block
- [x] This too
\`\`\`

- [ ] Another real checkbox
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 1, total: 2, unchecked: 1 });
  });

  test("ignores checkboxes inside tilde fenced code blocks", () => {
    const body = `
- [x] Before

~~~
- [ ] Inside tilde fence
~~~

- [ ] After
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 1, total: 2, unchecked: 1 });
  });

  test("handles multiple fenced code blocks", () => {
    const body = `
- [x] Real 1

\`\`\`
- [ ] Fake 1
\`\`\`

- [ ] Real 2

\`\`\`yaml
- [ ] Fake 2
\`\`\`

- [x] Real 3
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 2, total: 3, unchecked: 1 });
  });

  test("detects nested/indented checkboxes", () => {
    const body = `
- [x] Top level
  - [ ] Indented
    - [x] Double indented
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 2, total: 3, unchecked: 1 });
  });

  test("treats [X] and [x] both as checked (case-insensitive)", () => {
    const body = `
- [x] Lowercase x
- [X] Uppercase X
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 2, total: 2, unchecked: 0 });
  });

  test("detects checkboxes with content after them", () => {
    const body = `
- [x] This has **bold** and [links](http://example.com)
- [ ] This has \`code\` and other stuff
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 1, total: 2, unchecked: 1 });
  });

  test("does not detect checkbox-like text without list marker", () => {
    const body = `
[x] No list marker
[ ] Also no list marker
Some text - [x] inline checkbox-like thing
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 0, total: 0, unchecked: 0 });
  });

  test("supports asterisk and plus list markers", () => {
    const body = `
* [x] Asterisk checked
+ [ ] Plus unchecked
- [x] Dash checked
`;
    const result = parseChecklist(body);
    expect(result).toEqual({ checked: 2, total: 3, unchecked: 1 });
  });
});
