#!/bin/sh
# Startar provversionen av bokningstjänsten.
# Inställningarna läses från installningar.env (se installningar.exempel.env).
# Utan den lyssnar tjänsten bara på den egna datorn och skickar inga mejl.
set -eu
cd "$(dirname "$0")"
if [ -f installningar.env ]; then
  set -a
  . ./installningar.env
  set +a
fi
export BOKNING_HTTP="${BOKNING_HTTP:-127.0.0.1:8097}"
exec ./pocketbase serve --http="$BOKNING_HTTP" \
  --dir=pb_data --hooksDir=pb_hooks --migrationsDir=pb_migrations --publicDir=pb_public
