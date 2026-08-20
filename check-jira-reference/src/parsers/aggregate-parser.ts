import { parseCommitsForIssues } from "./commit-parser.js";
import { extractIssuesFromText } from "./extract-issues.js";

/** Result of scanning a pull request for Jira issue references. */
export interface ParseResult {
  /** Deduplicated set of all Jira issue keys found across every source. */
  issues: Set<string>;
  /** Issue keys broken out by where they were found. */
  sources: {
    body: string[];
    branch: string[];
    commits: string[];
    title: string[];
  };
}

/**
 * Scans pull request metadata and commits for Jira issue references.
 *
 * @param prTitle - Pull request title
 * @param prBody - Pull request body (may be undefined for empty bodies)
 * @param branchName - Source branch name (matched case-insensitively)
 * @param commits - Commit messages to scan (empty array skips commit parsing)
 * @param issuePattern - RegExp pattern for matching Jira issue keys
 * @returns Deduplicated issues and per-source breakdowns
 */
export function parsePullRequestForIssues(
  prTitle: string,
  prBody: string | undefined,
  branchName: string,
  commits: Array<{ message: string }>,
  issuePattern: RegExp,
): ParseResult {
  const titleIssues = extractIssuesFromText(prTitle, issuePattern);
  const bodyIssues = prBody
    ? extractIssuesFromText(prBody, issuePattern)
    : new Set<string>();
  const branchIssues = extractIssuesFromText(
    branchName?.toUpperCase() ?? "",
    issuePattern,
  );
  const commitIssues =
    commits.length > 0
      ? parseCommitsForIssues(commits, issuePattern)
      : new Set<string>();

  return {
    issues: new Set([
      ...titleIssues,
      ...bodyIssues,
      ...branchIssues,
      ...commitIssues,
    ]),
    sources: {
      body: [...bodyIssues],
      branch: [...branchIssues],
      commits: [...commitIssues],
      title: [...titleIssues],
    },
  };
}
