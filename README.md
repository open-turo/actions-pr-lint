# `open-turo/actions-pr-lint`

GitHub Actions for PR description validation (checklists, formatting, conventions).

[![Release](https://img.shields.io/github/v/release/open-turo/actions-pr-lint)](https://github.com/open-turo/actions-pr-lint/releases/)
[![Tests pass/fail](https://img.shields.io/github/actions/workflow/status/open-turo/actions-pr-lint/ci.yaml)](https://github.com/open-turo/actions-pr-lint/actions/)
[![License](https://img.shields.io/github/license/open-turo/actions-pr-lint)](./LICENSE)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/dwyl/esta/issues)
![CI](https://github.com/open-turo/actions-pr-lint/actions/workflows/ci.yaml/badge.svg)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Conventional commits](https://img.shields.io/badge/conventional%20commits-1.0.2-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![Join us!](https://img.shields.io/badge/Turo-Join%20us%21-593CFB.svg)](https://turo.com/jobs)

## Actions

### action: [`check-jira-reference`](./check-jira-reference)

Validates that pull requests contain Jira ticket references in the PR title, body, branch name, and/or commit messages.

See usage [here](check-jira-reference/README.md#usage).

Documentation is found [here](check-jira-reference/README.md).

### action: [`check-pr-checklist`](./check-pr-checklist)

Validates that all markdown checkboxes in a PR description are checked.

See usage [here](check-pr-checklist/README.md#usage).

Documentation is found [here](check-pr-checklist/README.md).

## Get Help

Each Action has a detailed README for how to use it as referenced above. Please review Issues, post new Issues against
this repository as needed.

## Contributions

Please see [here](https://github.com/open-turo/contributions) for guidelines on how to contribute to this project.

## Development

### Documentation

We are using [`action-docs`](https://github.com/npalm/action-docs) to keep our action documentation up to date. This is
handled by a script that uses `npx` to run action-docs. To update documentation manually, run:

```shell
pre-commit run -a update-action-readme
```
