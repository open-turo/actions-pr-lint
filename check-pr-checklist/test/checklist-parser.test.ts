import { describe, expect, test } from "vitest";

import { parseAndValidate } from "../src/checklist-parser.js";

describe("no-markers", () => {
  test("null body", () => {
    // eslint-disable-next-line unicorn/no-null -- exercising the documented null input case
    expect(parseAndValidate(null, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [],
        "pass": true,
        "total": 0,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("undefined body", () => {
    expect(parseAndValidate(undefined, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [],
        "pass": true,
        "total": 0,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("empty string body", () => {
    expect(parseAndValidate("", "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [],
        "pass": true,
        "total": 0,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("whitespace-only body", () => {
    expect(parseAndValidate("   \n\n  \t  ", "checklist"))
      .toMatchInlineSnapshot(`
        {
          "checked": 0,
          "errors": [],
          "pass": true,
          "total": 0,
          "unchecked": 0,
          "warnings": [],
        }
      `);
  });

  test("all checked pass", () => {
    expect(parseAndValidate("- [x] a\n- [x] b", "checklist"))
      .toMatchInlineSnapshot(`
        {
          "checked": 2,
          "errors": [],
          "pass": true,
          "total": 2,
          "unchecked": 0,
          "warnings": [],
        }
      `);
  });

  test("unchecked fail", () => {
    expect(parseAndValidate("- [x] a\n- [ ] b\n- [ ] c", "checklist"))
      .toMatchInlineSnapshot(`
        {
          "checked": 1,
          "errors": [
            {
              "message": "2 of 3 checklist items are unchecked",
            },
          ],
          "pass": false,
          "total": 3,
          "unchecked": 2,
          "warnings": [],
        }
      `);
  });

  test("no checkboxes", () => {
    expect(parseAndValidate("Just a description.", "checklist"))
      .toMatchInlineSnapshot(`
        {
          "checked": 0,
          "errors": [],
          "pass": true,
          "total": 0,
          "unchecked": 0,
          "warnings": [],
        }
      `);
  });
});

describe("bare-markers", () => {
  test("all-checked pass", () => {
    const body = ["<!-- checklist -->", "- [x] a", "- [x] b"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 2,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("unchecked fail", () => {
    const body = ["<!-- checklist -->", "- [x] a", "- [ ] b"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [
          {
            "message": "1 of 2 checklist items are unchecked (marker line 1, checkboxes lines 2-3)",
          },
        ],
        "pass": false,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("unmarked blocks ignored", () => {
    const body = [
      "- [ ] unmarked",
      "",
      "<!-- checklist -->",
      "- [x] marked",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [
          "Checklist at lines 1-1 has no indicator marker and was ignored",
        ],
      }
    `);
  });
});

describe("select-markers", () => {
  test("exact match pass", () => {
    const body = ["<!-- checklist select=1 -->", "- [x] a", "- [ ] b"].join(
      "\n",
    );
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("too-few fail", () => {
    const body = ["<!-- checklist select=2 -->", "- [x] a", "- [ ] b"].join(
      "\n",
    );
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [
          {
            "message": "Incomplete select list (marker line 1, checkboxes lines 2-3): 1 of 2 items selected",
          },
        ],
        "pass": false,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("too-many fail", () => {
    const body = ["<!-- checklist select=1 -->", "- [x] a", "- [x] b"].join(
      "\n",
    );
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 2,
        "errors": [
          {
            "message": "Too many items selected (marker line 1, checkboxes lines 2-3): 2 selected, expected 1",
          },
        ],
        "pass": false,
        "total": 2,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("select exceeds block size", () => {
    const body = ["<!-- checklist select=5 -->", "- [x] a", "- [ ] b"].join(
      "\n",
    );
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [
          {
            "message": "select=5 at line 1 but block only has 2 checkboxes",
          },
        ],
        "pass": false,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });
});

describe("mixed-markers", () => {
  test("multiple groups both passing", () => {
    const body = [
      "<!-- checklist -->",
      "- [x] a",
      "- [x] b",
      "",
      "<!-- checklist select=1 -->",
      "- [x] c",
      "- [ ] d",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 3,
        "errors": [],
        "pass": true,
        "total": 4,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("partial failure", () => {
    const body = [
      "<!-- checklist -->",
      "- [x] a",
      "- [x] b",
      "",
      "<!-- checklist select=1 -->",
      "- [ ] c",
      "- [ ] d",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 2,
        "errors": [
          {
            "message": "Incomplete select list (marker line 5, checkboxes lines 6-7): 0 of 1 items selected",
          },
        ],
        "pass": false,
        "total": 4,
        "unchecked": 2,
        "warnings": [],
      }
    `);
  });
});

describe("fenced-code-blocks", () => {
  test("backtick fences: checkboxes inside ignored", () => {
    const body = [
      "- [x] real",
      "```",
      "- [ ] fake",
      "```",
      "- [x] also real",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 2,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("tilde fences: checkboxes inside ignored", () => {
    const body = [
      "- [x] real",
      "~~~",
      "- [ ] fake",
      "~~~",
      "- [x] also real",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 2,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("fence char-count requirement: ``` does not close ````", () => {
    const body = [
      "````",
      "- [ ] inside 4-backtick fence",
      "```",
      "- [ ] still inside (3 < 4)",
      "````",
      "- [x] outside",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("unclosed fences: everything after opening is ignored", () => {
    const body = [
      "- [x] before",
      "```",
      "- [ ] inside 1",
      "- [x] inside 2",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("preserves line numbers through fenced code blocks", () => {
    const body = [
      "<!-- checklist select=1 -->",
      "```",
      "- [ ] fake checkbox inside fence",
      "```",
      "- [ ] real a",
      "- [ ] real b",
    ].join("\n");

    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [
          {
            "message": "Incomplete select list (marker line 1, checkboxes lines 5-6): 0 of 1 items selected",
          },
        ],
        "pass": false,
        "total": 2,
        "unchecked": 2,
        "warnings": [],
      }
    `);
  });
});

describe("indicator-matching", () => {
  test("case-insensitivity", () => {
    const body = ["<!-- CHECKLIST -->", "- [x] a"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("custom keyword", () => {
    const body = ["<!-- todo select=1 -->", "- [x] a", "- [ ] b"].join("\n");
    expect(parseAndValidate(body, "todo")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("regex metacharacter escaping: check.list matches literal dot", () => {
    const body = ["<!-- check.list -->", "- [x] a"].join("\n");
    expect(parseAndValidate(body, "check.list")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("regex metacharacter escaping: check.list does not match checkXlist", () => {
    const body = ["<!-- checkXlist -->", "- [x] a"].join("\n");
    // "checkXlist" is not a marker for "check.list", so no-markers mode applies
    expect(parseAndValidate(body, "check.list")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("mid-line rejection: text around marker prevents matching", () => {
    const body = ["text <!-- checklist --> more", "- [ ] a"].join("\n");
    // The marker is not recognized, so no-markers mode applies (all checkboxes must be checked)
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [
          {
            "message": "1 of 1 checklist items are unchecked",
          },
        ],
        "pass": false,
        "total": 1,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("extra whitespace in marker", () => {
    const body = [
      "<!--   checklist   select=1   -->",
      "- [x] a",
      "- [ ] b",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });
});

describe("marker-block-association", () => {
  test("heading barrier", () => {
    const body = ["<!-- checklist -->", "## Heading", "- [ ] a"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [],
        "pass": true,
        "total": 0,
        "unchecked": 0,
        "warnings": [
          "Indicator marker at line 1 is separated from the next checklist by a heading or horizontal rule and was skipped",
          "Checklist at lines 3-3 has no indicator marker and was ignored",
        ],
      }
    `);
  });

  test("HR barrier", () => {
    const body = ["<!-- checklist -->", "---", "- [ ] a"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [],
        "pass": true,
        "total": 0,
        "unchecked": 0,
        "warnings": [
          "Indicator marker at line 1 is separated from the next checklist by a heading or horizontal rule and was skipped",
          "Checklist at lines 3-3 has no indicator marker and was ignored",
        ],
      }
    `);
  });

  test("marker with no following block", () => {
    const body = ["- [x] before", "<!-- checklist -->"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [],
        "pass": true,
        "total": 0,
        "unchecked": 0,
        "warnings": [
          "Indicator marker at line 2 has no following checklist block and was ignored",
          "Checklist at lines 1-1 has no indicator marker and was ignored",
        ],
      }
    `);
  });

  test("duplicate markers: first wins", () => {
    const body = [
      "<!-- checklist -->",
      "<!-- checklist select=1 -->",
      "- [x] a",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [
          "Indicator marker at line 2 conflicts with another marker for the checklist starting at line 3; the first marker takes precedence",
        ],
      }
    `);
  });

  test("orphaned blocks", () => {
    const body = [
      "- [x] orphaned",
      "",
      "<!-- checklist -->",
      "- [x] claimed",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [
          "Checklist at lines 1-1 has no indicator marker and was ignored",
        ],
      }
    `);
  });
});

describe("block absorption", () => {
  test("continuation text between checkboxes stays in one block", () => {
    const body = [
      "<!-- checklist -->",
      "- [x] Long line",
      "continuation text",
      "- [x] Second item",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 2,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("inline image between checkboxes stays in one block", () => {
    const body = [
      "<!-- checklist -->",
      "- [x] Item with image",
      '<img src="screenshot.png" />',
      "- [x] Second item",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 2,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("blank line between checkboxes creates separate blocks", () => {
    const body = [
      "<!-- checklist -->",
      "- [x] First group",
      "",
      "- [ ] Second group",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [
          "Checklist at lines 4-4 has no indicator marker and was ignored",
        ],
      }
    `);
  });

  test("multiple non-blank lines between checkboxes stay in one block", () => {
    const body = ["- [x] first", "some text", "more text", "- [x] second"].join(
      "\n",
    );
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 2,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });

  test("HR between checkboxes breaks the block", () => {
    const body = ["- [x] first", "---", "- [ ] second"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [
          {
            "message": "1 of 2 checklist items are unchecked",
          },
        ],
        "pass": false,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("heading between checkboxes breaks the block", () => {
    const body = ["- [x] first", "## New Section", "- [ ] second"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [
          {
            "message": "1 of 2 checklist items are unchecked",
          },
        ],
        "pass": false,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("indicator marker between checkboxes breaks the block", () => {
    const body = [
      "- [x] before marker",
      "<!-- checklist select=1 -->",
      "- [x] a",
      "- [ ] b",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 2,
        "unchecked": 1,
        "warnings": [
          "Checklist at lines 1-1 has no indicator marker and was ignored",
        ],
      }
    `);
  });

  test("no-markers mode: continuation text does not split checkboxes", () => {
    const body = ["- [x] first", "continuation", "- [ ] second"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [
          {
            "message": "1 of 2 checklist items are unchecked",
          },
        ],
        "pass": false,
        "total": 2,
        "unchecked": 1,
        "warnings": [],
      }
    `);
  });

  test("trailing text after last checkbox does not affect block", () => {
    const body = ["- [x] only item", "some trailing text"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 1,
        "errors": [],
        "pass": true,
        "total": 1,
        "unchecked": 0,
        "warnings": [],
      }
    `);
  });
});

describe("select=0-rejection", () => {
  test("select=0 error", () => {
    const body = ["<!-- checklist select=0 -->", "- [x] a"].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [
          {
            "message": "select=0 at line 1 is invalid; select must be at least 1",
          },
        ],
        "pass": false,
        "total": 0,
        "unchecked": 0,
        "warnings": [
          "Checklist at lines 2-2 has no indicator marker and was ignored",
        ],
      }
    `);
  });

  test("sibling groups still validated", () => {
    const body = [
      "<!-- checklist select=0 -->",
      "- [x] a",
      "",
      "<!-- checklist -->",
      "- [ ] b",
    ].join("\n");
    expect(parseAndValidate(body, "checklist")).toMatchInlineSnapshot(`
      {
        "checked": 0,
        "errors": [
          {
            "message": "select=0 at line 1 is invalid; select must be at least 1",
          },
          {
            "message": "1 of 1 checklist items are unchecked (marker line 4, checkboxes lines 5-5)",
          },
        ],
        "pass": false,
        "total": 1,
        "unchecked": 1,
        "warnings": [
          "Checklist at lines 2-2 has no indicator marker and was ignored",
        ],
      }
    `);
  });
});
