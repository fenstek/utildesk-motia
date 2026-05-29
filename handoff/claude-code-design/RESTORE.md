# Restore and rollback guide

## Restore point

The safe restore point created before Claude Code design handoff is:

```bash
git switch master
git reset --hard restore/pre-claude-code-design-20260529-baca47ac
```

Commit:

```text
baca47aced8d5bbddf16df7bc6a847e065607f8c
```

Tag:

```text
restore/pre-claude-code-design-20260529-baca47ac
```

## Safer rollback after publishing a bad commit

If a bad design commit has already been pushed/shared, prefer revert instead of rewriting history:

```bash
git revert <bad_commit_sha>
```

## Compare current work to restore point

```bash
git diff restore/pre-claude-code-design-20260529-baca47ac..HEAD --stat
git diff restore/pre-claude-code-design-20260529-baca47ac..HEAD -- site/src
```

## Known bad experiment

Do not use this as a base:

```text
8e145c09 design: align dossier pages with decision template
```

It was reverted because it changed too much too broadly and broke visual consistency.
