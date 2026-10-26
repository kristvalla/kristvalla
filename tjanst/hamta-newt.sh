#!/bin/sh
# Hämtar Newt, programmet som håller tunneln till Pangolin öppen, och
# kontrollerar att filen är äkta (kontrollsumman från GitHub).
# Programfilen hamnar i den här mappen och checkas inte in.
# Se docs/beslut/atkomst-utifran.md.
set -eu

VERSION="1.19.0"
cd "$(dirname "$0")"

case "$(uname -m)" in
  x86_64)        ARK=amd64; SUMMA=6d40e223fa49d8bcfa9b7094208c58ff616997979bff7c884d0af61fcc1c5376 ;;
  aarch64|arm64) ARK=arm64; SUMMA=2a282e3edda7be17f092ac58aff0ec6dac9ddd152a642e8e61e6d625f2abe696 ;;
  *) echo "Okänd processor: $(uname -m)" >&2; exit 1 ;;
esac

curl -fsSL -o newt.ny "https://github.com/fosrl/newt/releases/download/${VERSION}/newt_linux_${ARK}"
echo "$SUMMA  newt.ny" | sha256sum -c -
chmod +x newt.ny
mv newt.ny newt
./newt --version 2>/dev/null || ./newt -version 2>/dev/null || true
