#!/usr/bin/env bash
# Full backup of teddy_and_gift_heaven (Member 3).
# Usage: database/backup/backup.sh [SCHEDULED|MANUAL]
# Needs ~/.tagh-backup.cnf (user tagh_backup) and binary logging on.
set -uo pipefail

DB="teddy_and_gift_heaven"
CNF="${TAGH_BACKUP_CNF:-$HOME/.tagh-backup.cnf}"
DIR="${TAGH_BACKUP_DIR:-$HOME/tagh-backups}"
KEEP_DAYS="${TAGH_KEEP_DAYS:-14}"
METHOD="${1:-MANUAL}"

mkdir -p "$DIR"
chmod 700 "$DIR"
STARTED="$(date '+%F %T')"
FILE="$DIR/${DB}_$(date +%Y%m%d_%H%M%S).sql.gz"

# --single-transaction: a consistent copy without locking the shop
# --routines --triggers --events: include procedures, functions, triggers and events
# --source-data=2: write the binary log file and position as a comment (point-in-time recovery)
mysqldump --defaults-extra-file="$CNF" \
  --single-transaction --routines --triggers --events \
  --source-data=2 --no-tablespaces --set-gtid-purged=OFF \
  "$DB" | gzip > "$FILE"
RESULT=$?

SIZE=$(stat -c %s "$FILE" 2>/dev/null || echo 0)
POS_LINE=$(zcat "$FILE" 2>/dev/null | head -50 | grep -m1 "CHANGE REPLICATION SOURCE TO" || true)
BINFILE=$(echo "$POS_LINE" | sed -n "s/.*SOURCE_LOG_FILE='\([^']*\)'.*/\1/p")
BINPOS=$(echo "$POS_LINE" | sed -n "s/.*SOURCE_LOG_POS=\([0-9]*\).*/\1/p")

if [ $RESULT -eq 0 ] && [ "$SIZE" -gt 1000 ]; then
  STATUS="SUCCESS"; NOTE=""
else
  STATUS="FAILED"; NOTE="mysqldump exit code $RESULT"
  rm -f "$FILE"
fi

mysql --defaults-extra-file="$CNF" "$DB" -e "
  INSERT INTO backup_history (file_name, size_bytes, binlog_file, binlog_pos, method, status, started_at, note)
  VALUES ('$(basename "$FILE")', $SIZE, NULLIF('$BINFILE',''), NULLIF('$BINPOS','') + 0,
          '$METHOD', '$STATUS', '$STARTED', NULLIF('$NOTE',''));"

# remove backups older than KEEP_DAYS
find "$DIR" -name "${DB}_*.sql.gz" -mtime +"$KEEP_DAYS" -delete

echo "$STATUS: $FILE ($SIZE bytes, binlog $BINFILE:$BINPOS)"
[ "$STATUS" = "SUCCESS" ]
