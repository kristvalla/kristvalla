#!/bin/sh
# Startar provversionen av bokningstjänsten.
# Den lyssnar bara på den egna datorn (127.0.0.1). PORT kan ändras, t.ex. PORT=8100 ./starta.sh
set -eu
cd "$(dirname "$0")"
exec ./pocketbase serve --http="127.0.0.1:${PORT:-8097}" \
  --dir=pb_data --hooksDir=pb_hooks --migrationsDir=pb_migrations --publicDir=pb_public
