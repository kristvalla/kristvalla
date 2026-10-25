#!/usr/bin/env python3
"""Uppdaterar kalendern "Lediga och bokade datum" i hyr.html.

Skriptet hämtar de bekräftade datumen från bokningstjänsten och skriver om
månadstabellerna i hyr.html. Det hämtar bara datum, aldrig namn eller
kontaktuppgifter. Om tjänsten inte svarar ändras ingenting, och hemsidan
visar den kalender den hade senast.

Exempel:
    python3 uppdatera_kalender.py
    python3 uppdatera_kalender.py --manader 4 --tjanst http://127.0.0.1:8097
    python3 uppdatera_kalender.py --fil /tmp/hyr-prov.html

Skriptet behöver bara Python 3, inga tillägg.
"""

import argparse
import calendar
import datetime
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

MANADER = ["januari", "februari", "mars", "april", "maj", "juni", "juli",
           "augusti", "september", "oktober", "november", "december"]
VECKODAGAR = [("mån", "måndag"), ("tis", "tisdag"), ("ons", "onsdag"), ("tor", "torsdag"),
              ("fre", "fredag"), ("lör", "lördag"), ("sön", "söndag")]

STANDARDFIL = Path(__file__).resolve().parent.parent / "hyr.html"


def hamta_bokade(tjanst, fran):
    """Hämtar bekräftade datum (ÅÅÅÅ-MM-DD) från och med 'fran'."""
    bokade = set()
    sida = 1
    while True:
        fraga = urllib.parse.urlencode({
            "filter": f"datum >= '{fran}'",
            "sort": "datum",
            "perPage": 500,
            "page": sida,
            "skipTotal": 1,
        })
        url = f"{tjanst.rstrip('/')}/api/collections/bokade_datum/records?{fraga}"
        with urllib.request.urlopen(url, timeout=15) as svar:
            data = json.load(svar)
        for post in data["items"]:
            bokade.add(post["datum"])
        if len(data["items"]) < data["perPage"]:
            return bokade
        sida += 1


def manadstabell(ar, manad, bokade):
    """Bygger en <table> i samma form som i hyr.html."""
    huvud = "".join(f'<th scope="col" abbr="{lang}">{kort}</th>' for kort, lang in VECKODAGAR)
    rader = []
    for vecka in calendar.Calendar(firstweekday=0).monthdayscalendar(ar, manad):
        celler = []
        for dag in vecka:
            if dag == 0:
                celler.append("<td></td>")
            elif f"{ar:04d}-{manad:02d}-{dag:02d}" in bokade:
                celler.append(f'<td class="bokad">{dag}<span class="visuellt-dold"> bokad</span></td>')
            else:
                celler.append(f"<td>{dag}</td>")
        rader.append(f"          <tr>{''.join(celler)}</tr>")
    return "\n".join([
        '      <table class="belaggning">',
        f"        <caption>{MANADER[manad - 1].capitalize()} {ar}</caption>",
        f"        <thead><tr>{huvud}</tr></thead>",
        "        <tbody>",
        *rader,
        "        </tbody>",
        "      </table>",
    ])


def kommande_manader(idag, antal):
    ar, manad = idag.year, idag.month
    for _ in range(antal):
        yield ar, manad
        ar, manad = (ar + 1, 1) if manad == 12 else (ar, manad + 1)


def main():
    tolk = argparse.ArgumentParser(description="Uppdaterar kalendern i hyr.html.")
    tolk.add_argument("--tjanst", default="http://127.0.0.1:8097",
                      help="adressen till bokningstjänsten (standard: %(default)s)")
    tolk.add_argument("--fil", type=Path, default=STANDARDFIL,
                      help="filen som ska uppdateras (standard: hyr.html i repot)")
    tolk.add_argument("--manader", type=int, default=3,
                      help="hur många månader som visas, från och med denna (standard: %(default)s)")
    args = tolk.parse_args()

    idag = datetime.date.today()
    manader = list(kommande_manader(idag, args.manader))

    try:
        bokade = hamta_bokade(args.tjanst, f"{manader[0][0]:04d}-{manader[0][1]:02d}-01")
    except (OSError, ValueError, KeyError) as fel:
        print(f"Kunde inte hämta bokningar från {args.tjanst}: {fel}", file=sys.stderr)
        print("Kalendern ändrades inte.", file=sys.stderr)
        return 1

    html = args.fil.read_text(encoding="utf-8")

    tabeller = "\n".join(manadstabell(ar, manad, bokade) for ar, manad in manader)
    html, antal = re.subn(r'(<div class="manader">\n).*?(\n    </div>)',
                          lambda m: m.group(1) + tabeller + m.group(2), html, count=1, flags=re.S)
    if antal != 1:
        print(f'Hittade inte <div class="manader"> i {args.fil}. Inget ändrades.', file=sys.stderr)
        return 1

    datum = f'<time datetime="{idag.isoformat()}">{idag.day} {MANADER[idag.month - 1]} {idag.year}</time>'
    html, antal = re.subn(r'(Senast uppdaterad:\s*)(<span class="platshallare">\[datum\]</span>|<time [^>]*>[^<]*</time>)',
                          lambda m: m.group(1) + datum, html, count=1)
    if antal != 1:
        print("Hittade inte texten \"Senast uppdaterad\". Datumet för uppdateringen ändrades inte.",
              file=sys.stderr)

    args.fil.write_text(html, encoding="utf-8")
    print(f"Uppdaterade {args.fil}: {len(manader)} månader, "
          f"{sum(1 for d in bokade if d[:7] <= f'{manader[-1][0]:04d}-{manader[-1][1]:02d}')} bokade dagar.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
