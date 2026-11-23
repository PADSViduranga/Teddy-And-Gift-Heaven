#!/usr/bin/env bash
# Point-in-time recovery (Member 3): restore a backup, then replay the binary log up to a moment.
# Usage: database/backup/pitr.sh <backup.sql.gz> "YYYY-MM-DD HH:MM:SS"
# The result goes into teddy_and_gift_heaven_restore; the live database is not touched.
# Replaying binary log events needs root, so it asks for the MySQL root password.
set -euo pipefail

FILE="${1:?Give the backup file}"
STOP="${2:?Give the moment to recover to, e.g. \"2026-11-23 14:05:10\"}"
SRC="teddy_and_gift_heaven"
TARGET="teddy_and_gift_heaven_restore"
BACKUP_CNF="${TAGH_BACKUP_CNF:-$HOME/.tagh-backup.cnf}"

# 1. where the backup ends in the binary log
LINE=$(zcat "$FILE" | head -50 | grep -m1 "CHANGE REPLICATION SOURCE TO")
BINFILE=$(echo "$LINE" | sed -n "s/.*SOURCE_LOG_FILE='\([^']*\)'.*/\1/p")
BINPOS=$(echo "$LINE" | sed -n "s/.*SOURCE_LOG_POS=\([0-9]*\).*/\1/p")
echo "Backup ends at binary log $BINFILE position $BINPOS"

# 2. restore the backup into the test database
"$(dirname "$0")/restore.sh" "$FILE" "$TARGET"

# 3. replay everything after the backup, up to the chosen moment, renamed to the test database
echo "Replaying changes until $STOP (enter the MySQL root password) ..."
mysqlbinlog --defaults-extra-file="$BACKUP_CNF" --read-from-remote-server --to-last-log \
  --start-position="$BINPOS" --stop-datetime="$STOP" \
  --rewrite-db="$SRC->$TARGET" --database="$TARGET" --skip-gtids \
  "$BINFILE" | mysql -u root -p
echo "Recovered $TARGET to $STOP."
