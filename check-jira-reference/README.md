# check-jira-reference

Validates that pull requests contain Jira ticket references in the PR title,
body, branch name, and/or commit messages.

<!-- prettier-ignore-start -->
<!-- action-docs-description source="action.yaml" -->
## Description

GitHub Action that validates pull requests contain Jira ticket references
in the PR title, body, branch name, and commit messages. Fails if no
references are found when in required mode.
<!-- action-docs-description -->
<!-- prettier-ignore-end -->

## Usage

```yaml
name: PR Jira Reference

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  check-jira-reference:
    runs-on: ubuntu-latest
    steps:
      - uses: open-turo/actions-pr-lint/check-jira-reference@v1
```

### With custom Jira pattern

```yaml
- uses: open-turo/actions-pr-lint/check-jira-reference@v1
  with:
    jira-pattern: "MYPROJ-\\d+"
```

### Optional mode (warn instead of fail)

```yaml
- uses: open-turo/actions-pr-lint/check-jira-reference@v1
  with:
    required: "false"
```

### Exclude bot authors

```yaml
- uses: open-turo/actions-pr-lint/check-jira-reference@v1
  with:
    excluded-authors: "renovate[bot],dependabot[bot]"
```

<!-- prettier-ignore-start -->
<!-- action-docs-inputs source="action.yaml" -->
## Inputs

| parameter | description | required | default |
| --- | --- | --- | --- |
| jira-pattern | Regular expression pattern for matching Jira issue keys. Default: [A-Z][A-Z0-9]+-\d+ (matches PROJECT-123 format) | `false` | `[A-Z][A-Z0-9]+-\d+` |
| required | Whether Jira references are required. If true, the action will fail when no references are found. If false, only outputs warnings. | `false` | `true` |
| excluded-authors | Comma-separated list of PR authors to skip validation for. Useful for bot accounts that create automated PRs without Jira references. | `false` | `""` |
| skip-commits | Whether to skip checking commit messages for Jira references. Useful when you only want to check PR metadata. | `false` | `false` |
| pr-author | The login of the pull request author | `false` | `${{ github.event.pull_request.user.login }}` |
| pr-title | Pull request title to check for Jira references | `false` | `${{ github.event.pull_request.title }}` |
| pr-body | Pull request body/description to check for Jira references | `false` | `${{ github.event.pull_request.body }}` |
| branch-name | Branch name to check for Jira references | `false` | `${{ github.event.pull_request.head.ref }}` |
| github-token | GitHub token for fetching PR commits. Required if skip-commits is false. Defaults to GITHUB_TOKEN from the workflow. | `false` | `${{ github.token }}` |
<!-- action-docs-inputs -->

<!-- action-docs-outputs source="action.yaml" -->
## Outputs

| parameter | description |
| --- | --- |
| issues | Comma-separated list of found Jira issue keys |
| issue-count | Number of unique Jira issue keys found |
| sources | JSON object showing which sources contained issues |
| found | "true" if any Jira issue keys were found, "false" otherwise |
<!-- action-docs-outputs -->

<!-- action-docs-runs source="action.yaml" -->
## Runs

This action is a `node24` action.
<!-- action-docs-runs -->
<!-- prettier-ignore-end -->
