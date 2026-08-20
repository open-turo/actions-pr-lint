/**
 * GitHub Action entry point for check-jira-reference.
 *
 * Validates that a pull request contains at least one Jira issue reference
 * in its title, body, branch name, or commit messages. Outputs the found
 * issues and optionally fails the workflow when none are found.
 */

import { getInput, info, setFailed, setOutput, warning } from "@actions/core";
import { context, getOctokit } from "@actions/github";

import { parsePullRequestForIssues } from "./parsers/aggregate-parser.js";

/** Reads action inputs, scans PR metadata for Jira references, and sets outputs. */
export async function main(): Promise<void> {
  const jiraPatternInput =
    getInput("jira-pattern") || String.raw`[A-Z][A-Z0-9]+-\d+`;
  const prTitle = getInput("pr-title") || "";
  const prBody = getInput("pr-body") || "";
  const branchName = getInput("branch-name") || "";
  const prAuthor = getInput("pr-author") || "";
  const excludedAuthors = new Set(
    (getInput("excluded-authors") || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

  const required = (getInput("required") || "true").toLowerCase() === "true";
  const skipCommits =
    (getInput("skip-commits") || "false").toLowerCase() === "true";

  if (prAuthor !== "" && excludedAuthors.has(prAuthor)) {
    info(
      `Skipping Jira reference check: PR author "${prAuthor}" is in the excluded authors list`,
    );
    setOutput("issues", "");
    setOutput("issue-count", "0");
    setOutput(
      "sources",
      JSON.stringify({ body: [], branch: [], commits: [], title: [] }),
    );
    setOutput("found", "false");
    return;
  }

  info("=== Check Jira Reference ===");
  info(`PR Author: ${prAuthor || "(empty)"}`);
  info(`Excluded Authors: ${[...excludedAuthors].join(", ") || "(none)"}`);
  info(`Pattern: ${jiraPatternInput}`);
  info(`Required: ${String(required)}`);
  info(`Skip Commits: ${String(skipCommits)}`);
  info(`PR Title: ${prTitle || "(empty)"}`);
  info(`Branch: ${branchName || "(empty)"}`);

  let issuePattern: RegExp;
  try {
    issuePattern = new RegExp(jiraPatternInput, "gi");
  } catch {
    setFailed(`Invalid Jira pattern: ${jiraPatternInput}`);
    return;
  }

  let commits: Array<{ message: string }> = [];
  if (!skipCommits) {
    try {
      const token = getInput("github-token");
      if (token && context.payload.pull_request) {
        const octokit = getOctokit(token);
        const { data: commitData } = await octokit.rest.pulls.listCommits({
          owner: context.repo.owner,
          pull_number: context.payload.pull_request.number,
          repo: context.repo.repo,
        });
        commits = commitData.map((commit) => ({
          message: commit.commit.message,
        }));
        info(`Fetched ${String(commits.length)} commits from PR`);
      }
    } catch (error) {
      warning(`Could not fetch commits from GitHub API: ${String(error)}`);
    }
  }

  const result = parsePullRequestForIssues(
    prTitle,
    prBody,
    branchName,
    commits,
    issuePattern,
  );

  const { sources } = result;

  info("=== Results ===");
  info(`Issues found in title: ${sources.title.join(", ") || "(none)"}`);
  info(`Issues found in body: ${sources.body.join(", ") || "(none)"}`);
  info(`Issues found in branch: ${sources.branch.join(", ") || "(none)"}`);
  info(`Issues found in commits: ${sources.commits.join(", ") || "(none)"}`);

  const issuesArray = [...result.issues];
  const issuesString = issuesArray.join(", ");

  setOutput("issues", issuesString);
  setOutput("issue-count", String(issuesArray.length));
  setOutput("sources", JSON.stringify(sources));
  setOutput("found", issuesArray.length > 0 ? "true" : "false");

  if (required && issuesArray.length === 0) {
    setFailed(
      "No Jira issue references found in PR title, body, branch name, or commits. " +
        "Please include a Jira ticket reference (e.g., PROJECT-123).",
    );
    return;
  }

  if (issuesArray.length > 0) {
    info(`Found ${String(issuesArray.length)} Jira issue(s): ${issuesString}`);
  } else {
    info("No Jira issue references found (optional mode)");
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises, unicorn/prefer-top-level-await -- ncc bundles to CJS where top-level await is unsupported
main();
