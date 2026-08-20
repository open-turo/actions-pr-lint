import { CommitParser } from "conventional-commits-parser";

import { extractIssuesFromTexts } from "./extract-issues.js";

const parser = new CommitParser();

/**
 * Extracts Jira issue keys from commit messages
 *
 * @param commits - Array of commits with messages
 * @param issuePattern - RegExp pattern for matching Jira issue keys
 * @returns Set of unique Jira issue keys
 */
export function parseCommitsForIssues(
  commits: Array<{ message: string }>,
  issuePattern: RegExp,
): Set<string> {
  const issues = new Set<string>();

  for (const commit of commits) {
    const parsed = parser.parse(commit.message);

    const searchParts = [
      parsed.header,
      parsed.body,
      parsed.footer,
      ...parsed.references.map((reference: { raw: string }) => reference.raw),
      // eslint-disable-next-line unicorn/prefer-native-coercion-functions -- Type guard required for TypeScript
    ].filter((part): part is string => Boolean(part));

    for (const issue of extractIssuesFromTexts(searchParts, issuePattern)) {
      issues.add(issue);
    }
  }

  return issues;
}
