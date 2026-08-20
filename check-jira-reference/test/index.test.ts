import { beforeEach, describe, expect, test, vi } from "vitest";

import { main } from "../src/index.js";

// Mock @actions/core
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

// Mock @actions/github
vi.mock("@actions/github", () => ({
  context: {
    payload: { pull_request: { number: 123, user: { login: "test-user" } } },
    repo: { owner: "test-org", repo: "test-repo" },
  },
  getOctokit: vi.fn(() => ({
    rest: {
      pulls: {
        listCommits: vi.fn().mockResolvedValue({
          data: [
            { commit: { message: "feat: add feature DEVOPS-111" } },
            { commit: { message: "fix: resolve bug PROJECT-222" } },
          ],
        }),
      },
    },
  })),
}));

import { getInput, setFailed, setOutput } from "@actions/core";

const mockedGetInput = vi.mocked(getInput);

describe("main action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetInput.mockReturnValue("");
  });

  test("finds issues in title and sets outputs", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "branch-name": "feature/other",
        "jira-pattern": String.raw`[A-Z][A-Z0-9]+-\d+`,
        "pr-body": "",
        "pr-title": "DEVOPS-123 Add new feature",
        required: "true",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setOutput).toHaveBeenCalledWith("issues", "DEVOPS-123");
    expect(setOutput).toHaveBeenCalledWith("issue-count", "1");
    expect(setOutput).toHaveBeenCalledWith("found", "true");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("finds issues in body and sets outputs", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "branch-name": "feature/other",
        "jira-pattern": String.raw`[A-Z][A-Z0-9]+-\d+`,
        "pr-body": "This implements DEVOPS-456",
        "pr-title": "Add feature",
        required: "true",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setOutput).toHaveBeenCalledWith("issues", "DEVOPS-456");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("finds issues in branch name", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "branch-name": "feature/devops-789-work",
        "jira-pattern": String.raw`[A-Z][A-Z0-9]+-\d+`,
        "pr-body": "",
        "pr-title": "Add feature",
        required: "true",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setOutput).toHaveBeenCalledWith("issues", "DEVOPS-789");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("finds issues in commits", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "branch-name": "feature/work",
        "github-token": "fake-token",
        "jira-pattern": String.raw`[A-Z][A-Z0-9]+-\d+`,
        "pr-body": "",
        "pr-title": "Add feature",
        required: "true",
        "skip-commits": "false",
      };
      return inputs[name] ?? "";
    });

    await main();

    // Should find DEVOPS-111 and PROJECT-222 from commits
    expect(setOutput).toHaveBeenCalledWith(
      "issues",
      expect.stringContaining("DEVOPS-111"),
    );
    expect(setOutput).toHaveBeenCalledWith(
      "issues",
      expect.stringContaining("PROJECT-222"),
    );
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("fails when no issues found and required is true", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "branch-name": "feature/normal-branch",
        "jira-pattern": String.raw`[A-Z][A-Z0-9]+-\d+`,
        "pr-body": "Just a body",
        "pr-title": "Just a title",
        required: "true",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setFailed).toHaveBeenCalledWith(
      expect.stringContaining("No Jira issue references found"),
    );
  });

  test("does not fail when no issues found and required is false", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "branch-name": "feature/normal-branch",
        "jira-pattern": String.raw`[A-Z][A-Z0-9]+-\d+`,
        "pr-body": "Just a body",
        "pr-title": "Just a title",
        required: "false",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setFailed).not.toHaveBeenCalled();
    expect(setOutput).toHaveBeenCalledWith("found", "false");
  });

  test("deduplicates issues across sources", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "branch-name": "feature/devops-123-branch",
        "jira-pattern": String.raw`[A-Z][A-Z0-9]+-\d+`,
        "pr-body": "DEVOPS-123 Body",
        "pr-title": "DEVOPS-123 Title",
        required: "true",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    // Should only report unique issues
    expect(setOutput).toHaveBeenCalledWith("issues", "DEVOPS-123");
    expect(setOutput).toHaveBeenCalledWith("issue-count", "1");
  });

  test("handles empty environment with defaults", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "pr-title": "DEVOPS-999 Test",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setOutput).toHaveBeenCalledWith("issues", "DEVOPS-999");
    expect(setFailed).not.toHaveBeenCalled();
  });

  test("skips validation when PR author is in excluded list", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "excluded-authors": "bot[bot],test-user",
        "pr-author": "test-user",
        "pr-title": "No jira ref here",
        required: "true",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setFailed).not.toHaveBeenCalled();
    expect(setOutput).toHaveBeenCalledWith("found", "false");
    expect(setOutput).toHaveBeenCalledWith("issues", "");
  });

  test("runs validation when PR author is not in excluded list", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "excluded-authors": "other-bot[bot]",
        "pr-author": "test-user",
        "pr-title": "No jira ref here",
        required: "true",
        "skip-commits": "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setFailed).toHaveBeenCalledWith(
      expect.stringContaining("No Jira issue references found"),
    );
  });

  test("fails with invalid Jira pattern", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "jira-pattern": "[invalid",
        "pr-title": "Test",
        required: "true",
      };
      return inputs[name] ?? "";
    });

    await main();

    expect(setFailed).toHaveBeenCalledWith(
      expect.stringContaining("Invalid Jira pattern"),
    );
  });
});
