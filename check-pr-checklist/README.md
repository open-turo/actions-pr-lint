# check-pr-checklist

Validates markdown checklists in a PR description using automatic mode detection.

<!-- prettier-ignore-start -->
<!-- action-docs-description source="action.yaml" -->
## Description

Validates markdown checklists in a PR description with automatic mode detection
<!-- action-docs-description -->
<!-- prettier-ignore-end -->

## Validation modes

The action automatically detects how to validate based on the presence of HTML
comment markers (`<!-- checklist -->`) in the PR body.

### Mode 1: No markers — all checkboxes must be checked

When the PR body contains no indicator markers, every checkbox must be checked.

```markdown
- [x] Updated tests
- [x] Ran linter
- [ ] Updated docs <!-- this would fail -->
```

### Mode 2: Bare marker — opt-in validation

When a bare `<!-- checklist -->` marker appears before a checkbox block, only
marked blocks are validated. Unmarked checkboxes are ignored.

```markdown
Some optional checklist:

- [ ] Nice to have <!-- ignored, no marker -->

<!-- checklist -->

- [x] Required item 1
- [x] Required item 2
```

### Mode 3: Select marker — exactly N must be checked

Use `<!-- checklist select=N -->` to require exactly N checkboxes to be checked
in the following block. This is useful for "pick one of" lists.

```markdown
<!-- checklist select=1 -->

- [x] Option A
- [ ] Option B
- [ ] Option C
```

Modes 2 and 3 can be mixed in the same PR body. A marker applies to the
immediately following contiguous block of checkboxes. Headings and horizontal
rules act as structural barriers — a marker cannot reach past them.

### Checkbox block boundaries

Checkboxes are grouped into contiguous blocks. Non-checkbox content like
continuation text, images, or HTML between checkboxes is absorbed into the same
block. The following line types break a block and start a new one:

- Blank lines
- Headings (`# ...`)
- Horizontal rules (`---`)
- Indicator markers (`<!-- checklist -->`)

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

### With a custom indicator keyword

Use a custom keyword if your templates already use a different marker (e.g.
`Checkmate` for backwards compatibility with [checkmate](https://github.com/RoryQ/checkmate)):

```yaml
- uses: open-turo/actions-pr-lint/check-pr-checklist@v1
  with:
    indicator: Checkmate
```

This makes the action recognize `<!-- Checkmate -->` and
`<!-- Checkmate select=N -->` markers instead of the default `<!-- checklist -->`.

<!-- prettier-ignore-start -->
<!-- action-docs-inputs source="action.yaml" -->
## Inputs

| parameter | description | required | default |
| --- | --- | --- | --- |
| pr-body | The PR body to check for unchecked checkboxes | `false` | `${{ github.event.pull_request.body }}` |
| indicator | Keyword for HTML comment markers that identify validated checklist groups (e.g. `<!-- checklist -->` or `<!-- checklist select=2 -->`). When no markers are found, all checkboxes must be checked. When markers are present, only marked blocks are validated. | `false` | `checklist` |
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
