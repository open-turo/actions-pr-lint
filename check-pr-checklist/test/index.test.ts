import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@actions/core", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getInput: vi.fn(),
    info: vi.fn(),
    setFailed: vi.fn(),
    setOutput: vi.fn(),
    warning: vi.fn(),
  };
});

import { getInput, info, setFailed, setOutput, warning } from "@actions/core";

import { main } from "../src/index.js";

const mockedGetInput = vi.mocked(getInput);
const mockedSetFailed = vi.mocked(setFailed);

function mockInputs(inputs: Record<string, string>): void {
  mockedGetInput.mockImplementation((name: string) => inputs[name] ?? "");
}

describe("main action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetInput.mockReturnValue("");
  });

  test("Mode 1: passes when all checkboxes are checked", () => {
    mockInputs({ "pr-body": "- [x] Item 1\n- [x] Item 2" });

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "2");
    expect(setOutput).toHaveBeenCalledWith("checked", "2");
    expect(setOutput).toHaveBeenCalledWith("unchecked", "0");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("Mode 1: fails when checkboxes are unchecked", () => {
    mockInputs({
      "pr-body": "- [x] Done\n- [ ] Not done\n- [ ] Also not done",
    });

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "3");
    expect(setOutput).toHaveBeenCalledWith("checked", "1");
    expect(setOutput).toHaveBeenCalledWith("unchecked", "2");
    expect(setFailed).toHaveBeenCalledWith(
      "2 of 3 checklist items are unchecked",
    );
  });

  test("Mode 1: passes with an info log when the body is empty", () => {
    mockInputs({});

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "0");
    expect(setOutput).toHaveBeenCalledWith("checked", "0");
    expect(setOutput).toHaveBeenCalledWith("unchecked", "0");
    expect(info).toHaveBeenCalledWith("No checkboxes found in PR body");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("Mode 1: passes with an info log when no checkboxes are found", () => {
    mockInputs({ "pr-body": "This PR does stuff. No checkboxes here." });

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "0");
    expect(info).toHaveBeenCalledWith("No checkboxes found in PR body");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("Mode 2: passes when the marked block is complete, ignoring unmarked checkboxes", () => {
    mockInputs({
      "pr-body": "- [ ] unmarked\n\n<!-- checklist -->\n- [x] marked",
    });

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "1");
    expect(setOutput).toHaveBeenCalledWith("checked", "1");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("Mode 3: passes when the exact number of items is selected", () => {
    mockInputs({
      "pr-body": "<!-- checklist select=1 -->\n- [x] a\n- [ ] b",
    });

    main();

    expect(setFailed).not.toHaveBeenCalled();
  });

  test("Mode 3: fails when the wrong number of items is selected", () => {
    mockInputs({
      "pr-body": "<!-- checklist select=2 -->\n- [x] a\n- [ ] b",
    });

    main();

    expect(setFailed).toHaveBeenCalled();
    expect(mockedSetFailed.mock.calls[0]?.[0]).toContain(
      "Incomplete select list",
    );
  });

  test("logs warnings via core.warning()", () => {
    mockInputs({
      "pr-body": "<!-- checklist -->\n## Heading\n- [ ] a",
    });

    main();

    expect(warning).toHaveBeenCalled();
  });

  test("fails when select=0 is used", () => {
    mockInputs({
      "pr-body": "<!-- checklist select=0 -->\n- [x] a",
    });

    main();

    expect(setFailed).toHaveBeenCalled();
    expect(mockedSetFailed.mock.calls[0]?.[0]).toContain("select=0");
  });

  test("supports a custom indicator keyword", () => {
    mockInputs({
      indicator: "todo",
      "pr-body": "<!-- todo select=1 -->\n- [x] a\n- [ ] b",
    });

    main();

    expect(setFailed).not.toHaveBeenCalled();
  });

  test("joins multiple group errors with a semicolon", () => {
    mockInputs({
      "pr-body": [
        "<!-- checklist select=1 -->",
        "- [ ] a",
        "- [ ] b",
        "",
        "<!-- checklist select=1 -->",
        "- [ ] c",
        "- [ ] d",
      ].join("\n"),
    });

    main();

    expect(setFailed).toHaveBeenCalledTimes(1);
    expect(mockedSetFailed.mock.calls[0]?.[0]).toContain(";");
  });
});
