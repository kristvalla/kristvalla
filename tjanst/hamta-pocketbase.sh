#!/bin/sh
# Hämtar PocketBase och kontrollerar att filen är äkta (kontrollsumma).
# Programfilen hamnar i den här mappen och checkas inte in.
set -eu

VERSION="0.40.6"
cd "$(dirname "$0")"

case "$(uname -m)" in
  x86_64)        ARK=amd64 ;;
  aarch64|arm64) ARK=arm64 ;;
  armv7l)        ARK=armv7 ;;
  *) echo "Okänd processor: $(uname -m)" >&2; exit 1 ;;
esac

FIL="pocketbase_${VERSION}_linux_${ARK}.zip"
# Nya versioner finns bara på den nya plattformen efter flytten, se README.
BAS="https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}"

curl -fsSLO "$BAS/$FIL"
curl -fsSLO "$BAS/checksums.txt"
grep " $FIL\$" checksums.txt | sha256sum -c -
unzip -oq "$FIL" pocketbase
rm -f "$FIL" checksums.txt

./pocketbase --version
