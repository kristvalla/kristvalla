#!/bin/sh
# Startar provversionen av bokningstjänsten.
#
# Inställningarna läses från filen i BOKNING_INSTALLNINGAR, annars från
# installningar.env i den här mappen (se installningar.exempel.env).
# Utan inställningar lyssnar tjänsten bara på den egna datorn och skickar inga mejl.
#
# BOKNING_DATA anger datamappen. Standard är pb_data/ i den här mappen.
set -eu
cd "$(dirname "$0")"
INSTALLNINGAR="${BOKNING_INSTALLNINGAR:-./installningar.env}"
if [ -f "$INSTALLNINGAR" ]; then
  set -a
  . "$INSTALLNINGAR"
  set +a
fi
export BOKNING_HTTP="${BOKNING_HTTP:-127.0.0.1:8097}"
exec ./pocketbase serve --http="$BOKNING_HTTP" \
  --dir="${BOKNING_DATA:-pb_data}" --hooksDir=pb_hooks --migrationsDir=pb_migrations --publicDir=pb_public
