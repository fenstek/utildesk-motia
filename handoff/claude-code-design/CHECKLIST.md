# Claude Code visual QA checklist

Use this checklist after each design batch.

## Before editing

- [ ] Confirm branch is not `master`.
- [ ] Confirm restore tag exists: `restore/pre-claude-code-design-20260529-baca47ac`.
- [ ] Run a baseline build if not already done.
- [ ] Capture baseline screenshot(s) for the target route.

## During editing

- [ ] Change only the current route/component batch.
- [ ] Avoid broad global CSS that changes unrelated pages.
- [ ] Keep header/footer shared and consistent.
- [ ] Keep legal links reachable.
- [ ] Do not edit secrets or content automation.

## After editing

- [ ] `git diff --stat`
- [ ] `npm --prefix site run build`
- [ ] target routes return 200 in local preview/dev server
- [ ] desktop screenshot checked
- [ ] mobile-ish screenshot checked
- [ ] no giant empty blocks
- [ ] no awkward clipped titles or CTAs touching frames
- [ ] footer hover/spacing consistent with home

## Before handing back

- [ ] Mention exact changed files.
- [ ] Mention exact checked routes.
- [ ] Mention screenshot folder.
- [ ] Leave repo clean or clearly state uncommitted files.
