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
    python3 uppdatera_kalender.py --boka-adress https://boka.example.se

Med --boka-adress blir lediga dagar från och med i dag länkar till formuläret,
med datumet ifyllt. Utan den visar kalendern bara lediga och bokade dagar.

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
    """Hämtar bekräftade bokningar från och med 'fran'.

    Ger en ordlista: datum (ÅÅÅÅ-MM-DD) -> mängd med bokade tider, där "dag" är
    hel dag och övriga koder är pass. Bokningar utan tid gäller hela dagen.
    """
    bokade = {}
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
            bokade.setdefault(post["datum"], set()).update(post.get("tid") or ["dag"])
        if len(data["items"]) < data["perPage"]:
            return bokade
        sida += 1


def manadstabell(ar, manad, bokade, idag=None, boka_adress=None, pass_koder=()):
    """Bygger en <table> i samma form som i hyr.html.

    En dag är bokad om hela dagen eller alla pass är bokade, och delvis bokad om
    några pass är bokade. Med boka_adress blir dagar som inte är fullbokade, från
    och med idag, länkar till formuläret.
    """
    huvud = "".join(f'<th scope="col" abbr="{lang}">{kort}</th>' for kort, lang in VECKODAGAR)
    rader = []
    for vecka in calendar.Calendar(firstweekday=0).monthdayscalendar(ar, manad):
        celler = []
        for dag in vecka:
            if dag == 0:
                celler.append("<td></td>")
                continue
            datum = f"{ar:04d}-{manad:02d}-{dag:02d}"
            tider = bokade.get(datum, set())
            if "dag" in tider or (pass_koder and set(pass_koder) <= tider):
                celler.append(f'<td class="bokad">{dag}<span class="visuellt-dold"> bokad</span></td>')
                continue
            delvis = bool(tider)
            klass = ' class="delvis"' if delvis else ""
            lage = "delvis bokad" if delvis else "ledig"
            if boka_adress and datetime.date(ar, manad, dag) >= idag:
                celler.append(f'<td{klass}><a class="boka-dag" href="{boka_adress}/?datum={datum}">{dag}'
                              f'<span class="visuellt-dold"> {MANADER[manad - 1]}, {lage}, skicka förfrågan</span></a></td>')
            elif delvis:
                celler.append(f'<td{klass}>{dag}<span class="visuellt-dold"> delvis bokad</span></td>')
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
    tolk.add_argument("--boka-adress",
                      help="formulärets adress; då blir lediga dagar länkar till formuläret")
    tolk.add_argument("--pass", dest="pass_koder", default="fm,em,kv",
                      help="koderna för passen; alla bokade betyder fullbokat (standard: %(default)s)")
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

    boka_adress = args.boka_adress.rstrip("/") if args.boka_adress else None
    pass_koder = tuple(k for k in args.pass_koder.split(",") if k)
    tabeller = "\n".join(manadstabell(ar, manad, bokade, idag, boka_adress, pass_koder) for ar, manad in manader)
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
