#!/usr/bin/env bash
# Compare row counts, triggers and routines between two databases (Member 3).
# Usage: database/backup/compare.sh [db_a] [db_b]
set -euo pipefail
A="${1:-teddy_and_gift_heaven}"
B="${2:-teddy_and_gift_heaven_restore}"
CNF="${TAGH_MIGRATE_CNF:-$HOME/.tagh-migrate.cnf}"
q() { mysql --defaults-extra-file="$CNF" -N -B -e "$1"; }

DIFF=0
printf "%-28s %10s %10s\n" "table" "$A" "restore"
for t in $(q "SELECT table_name FROM information_schema.tables WHERE table_schema='$A' AND table_type='BASE TABLE' ORDER BY table_name"); do
  ca=$(q "SELECT COUNT(*) FROM \`$A\`.\`$t\`")
  cb=$(q "SELECT COUNT(*) FROM \`$B\`.\`$t\`" 2>/dev/null || echo "missing")
  mark=""; [ "$ca" = "$cb" ] || { mark="  <-- differs"; DIFF=1; }
  printf "%-28s %10s %10s%s\n" "$t" "$ca" "$cb" "$mark"
done
for kind in TRIGGERS ROUTINES EVENTS; do
  col=$([ $kind = TRIGGERS ] && echo trigger_schema || ([ $kind = ROUTINES ] && echo routine_schema || echo event_schema))
  na=$(q "SELECT COUNT(*) FROM information_schema.$kind WHERE $col='$A'")
  nb=$(q "SELECT COUNT(*) FROM information_schema.$kind WHERE $col='$B'")
  mark=""; [ "$na" = "$nb" ] || { mark="  <-- differs"; DIFF=1; }
  printf "%-28s %10s %10s%s\n" "($kind)" "$na" "$nb" "$mark"
done
[ $DIFF -eq 0 ] && echo "MATCH: the restored copy is identical in rows, triggers, routines and events." || echo "DIFFERENT: see the marked lines."
