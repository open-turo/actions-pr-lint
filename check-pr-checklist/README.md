# check-pr-checklist

Validates that all markdown checkboxes in a PR description are checked.

<!-- prettier-ignore-start -->
<!-- action-docs-description source="action.yaml" -->
## Description

Validates that all markdown checkboxes in a PR description are checked
<!-- action-docs-description -->
<!-- prettier-ignore-end -->

## Usage

```yaml
name: PR Checklist

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  check-checklist:
    runs-on: ubuntu-latest
    steps:
      - uses: open-turo/actions-pr-lint/check-pr-checklist@v1
```

### With explicit PR body

```yaml
- uses: open-turo/actions-pr-lint/check-pr-checklist@v1
  with:
    pr-body: ${{ github.event.pull_request.body }}
```

<!-- prettier-ignore-start -->
<!-- action-docs-inputs source="action.yaml" -->
## Inputs

| parameter | description | required | default |
| --- | --- | --- | --- |
| pr-body | The PR body to check for unchecked checkboxes | `false` | `${{ github.event.pull_request.body }}` |
<!-- action-docs-inputs -->

<!-- action-docs-outputs source="action.yaml" -->
## Outputs

| parameter | description |
| --- | --- |
| total | Total number of checkboxes found |
| checked | Number of checked checkboxes |
| unchecked | Number of unchecked checkboxes |
<!-- action-docs-outputs -->

<!-- action-docs-runs -->
## Runs

This action is a `node24` action.
<!-- action-docs-runs -->
<!-- prettier-ignore-end -->
