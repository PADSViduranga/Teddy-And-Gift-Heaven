#!/usr/bin/env bash
# Restore a backup file into a database (Member 3).
# Usage: database/backup/restore.sh <backup.sql.gz> [target_database]
# The target defaults to teddy_and_gift_heaven_restore, so the live database is never touched by accident.
set -euo pipefail

FILE="${1:?Give the backup file, e.g. ~/tagh-backups/teddy_and_gift_heaven_20261123_133000.sql.gz}"
TARGET="${2:-teddy_and_gift_heaven_restore}"
CNF="${TAGH_MIGRATE_CNF:-$HOME/.tagh-migrate.cnf}"

if [ "$TARGET" = "teddy_and_gift_heaven" ]; then
  echo "Refusing to overwrite the live database. Stop the backend first, and run with RESTORE_LIVE=yes if you really mean it."
  [ "${RESTORE_LIVE:-no}" = "yes" ] || exit 1
fi

echo "Restoring $FILE into $TARGET ..."
mysql --defaults-extra-file="$CNF" -e "DROP DATABASE IF EXISTS \`$TARGET\`; CREATE DATABASE \`$TARGET\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
zcat "$FILE" | mysql --defaults-extra-file="$CNF" "$TARGET"
echo "Done. Tables in $TARGET:"
mysql --defaults-extra-file="$CNF" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$TARGET';"
