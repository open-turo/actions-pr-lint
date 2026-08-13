import { beforeEach, describe, expect, test, vi } from "vitest";

import { main } from "../src/index.js";

vi.mock("@actions/core", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getInput: vi.fn(),
    info: vi.fn(),
    setFailed: vi.fn(),
    setOutput: vi.fn(),
  };
});

import { getInput, info, setFailed, setOutput } from "@actions/core";

const mockedGetInput = vi.mocked(getInput);

describe("main action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetInput.mockReturnValue("");
  });

  test("sets outputs and does not fail when all checkboxes are checked", () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === "pr-body") {
        return "- [x] Item 1\n- [x] Item 2";
      }
      return "";
    });

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "2");
    expect(setOutput).toHaveBeenCalledWith("checked", "2");
    expect(setOutput).toHaveBeenCalledWith("unchecked", "0");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("calls setFailed when unchecked checkboxes exist", () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === "pr-body") {
        return "- [x] Done\n- [ ] Not done\n- [ ] Also not done";
      }
      return "";
    });

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "3");
    expect(setOutput).toHaveBeenCalledWith("checked", "1");
    expect(setOutput).toHaveBeenCalledWith("unchecked", "2");
    expect(setFailed).toHaveBeenCalledWith(
      "2 of 3 checklist items are unchecked",
    );
  });

  test("passes with info log when body is empty", () => {
    mockedGetInput.mockReturnValue("");

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "0");
    expect(setOutput).toHaveBeenCalledWith("checked", "0");
    expect(setOutput).toHaveBeenCalledWith("unchecked", "0");
    expect(info).toHaveBeenCalledWith("No checkboxes found in PR body");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("passes with info log when no checkboxes found", () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === "pr-body") {
        return "This PR does stuff. No checkboxes here.";
      }
      return "";
    });

    main();

    expect(setOutput).toHaveBeenCalledWith("total", "0");
    expect(info).toHaveBeenCalledWith("No checkboxes found in PR body");
    expect(setFailed).not.toHaveBeenCalled();
  });
});
