# cron_publish_push lock behavior

`scripts/cron_publish_push.sh` is started by cron with:

- `flock -n /tmp/utildesk-motia_publish.lock ...`

The script also writes metadata into the same lock file for diagnostics:

- On start: `pid=<PID> started=<ISO_TIMESTAMP>`
- On exit (via `trap EXIT`): `pid=<PID> finished=<ISO_TIMESTAMP> exit=<CODE>`

Notes:

- The lock file is not removed by the script.
- `flock -n` still controls mutual exclusion.
- Metadata in the lock file helps detect stale-lock situations and identify the last process that touched publish lock state.
