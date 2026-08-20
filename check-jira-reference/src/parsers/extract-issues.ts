/**
 * Extracts all Jira issue keys matching the pattern from a text string
 *
 * @param text - The text to search for Jira issue keys
 * @param issuePattern - RegExp pattern for matching Jira issue keys
 * @returns Set of unique Jira issue keys
 */
export function extractIssuesFromText(
  text: string,
  issuePattern: RegExp,
): Set<string> {
  const issues = new Set<string>();
  const matches = text?.matchAll(issuePattern) ?? [];

  for (const match of matches) {
    // Convert to uppercase for consistency
    issues.add(match[0].toUpperCase());
  }

  return issues;
}

/**
 * Extracts all Jira issue keys from multiple text strings
 *
 * @param texts - Array of texts to search
 * @param issuePattern - RegExp pattern for matching Jira issue keys
 * @returns Set of unique Jira issue keys
 */
export function extractIssuesFromTexts(
  texts: string[],
  issuePattern: RegExp,
): Set<string> {
  const issues = new Set<string>();

  for (const text of texts) {
    for (const issue of extractIssuesFromText(text, issuePattern)) {
      issues.add(issue);
    }
  }

  return issues;
}
