# Backup and recovery

Member 3 looks after this. Everything here runs on your own machine. Backups contain customer data,
so they're kept in `~/tagh-backups` and never committed to Git.

## How it works

`backup.sh` makes a full copy of the database with `mysqldump`: the tables and data, plus the
triggers, procedures, functions and events. It uses `--single-transaction`, so the shop keeps
working while the backup runs. It also writes down the binary log position at that moment. That
position is what makes point-in-time recovery possible: the backup gets us back to last night, and
the binary log replays everything that happened after it, up to the second we choose.

Each run adds a row to `backup_history` (SUCCESS or FAILED, size, binary log position, and whether
it was scheduled or manual). Page 13 shows this table. Backups older than 14 days are deleted
automatically.

## One-time setup

1. As root, allow triggers and functions while binary logging is on:
   `SET PERSIST log_bin_trust_function_creators = 1;`
2. As root, create the backup user. It can read everything but only write to `backup_history`:
   ```sql
   CREATE USER 'tagh_backup'@'localhost' IDENTIFIED BY '<your password>';
   GRANT SELECT, SHOW VIEW, TRIGGER, EVENT, LOCK TABLES ON teddy_and_gift_heaven.* TO 'tagh_backup'@'localhost';
   GRANT SHOW_ROUTINE, RELOAD, REPLICATION CLIENT, REPLICATION SLAVE ON *.* TO 'tagh_backup'@'localhost';
   GRANT INSERT ON teddy_and_gift_heaven.backup_history TO 'tagh_backup'@'localhost';
   GRANT ALL PRIVILEGES ON teddy_and_gift_heaven_restore.* TO 'tagh_migrate'@'localhost';
   ```
3. Put the passwords in `~/.tagh-backup.cnf` and `~/.tagh-migrate.cnf` (a `[client]` section with
   `user=` and `password=`), then `chmod 600` both. The scripts read them, so no password ever
   appears in a script or on the command line.

## Everyday commands

| What | Command |
|---|---|
| Back up now | `database/backup/backup.sh MANUAL` |
| Restore a backup into the test database | `database/backup/restore.sh ~/tagh-backups/<file>.sql.gz` |
| Check the restored copy matches the live one | `database/backup/compare.sh` |
| Recover to a moment in time | `database/backup/pitr.sh ~/tagh-backups/<file>.sql.gz "2026-11-23 14:05:10"` |

`restore.sh` and `pitr.sh` always work on `teddy_and_gift_heaven_restore`, never on the live
database. Once the recovered copy looks right, copy back only what was damaged (see below), or stop
the backend and run `RESTORE_LIVE=yes database/backup/restore.sh <file> teddy_and_gift_heaven` to
replace everything.

## Nightly schedule

`systemd/tagh-backup.timer` runs the backup every night at 23:30, and catches up on the next start
if the computer was off. To install it:

```bash
mkdir -p ~/.config/systemd/user
cp database/backup/systemd/tagh-backup.* ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now tagh-backup.timer
```

Check it with `systemctl --user list-timers` and `journalctl --user -u tagh-backup.service`.

## Recovery test we ran

1. Took a backup.
2. Added a category ("Valentine Specials"), which is the good work done after the backup.
3. Made a mistake: deleted that category and set every personalization price to 0.
4. Ran `pitr.sh` with the moment just before the mistake. The recovered copy had both the new
   category and the original prices.
5. Repaired the live database from the recovered copy, using a LEFT JOIN to find the missing
   category and an UPDATE ... JOIN to put the prices back.

A plain restore would have lost step 2, and the live database had lost step 1's prices. Only
point-in-time recovery kept both.
