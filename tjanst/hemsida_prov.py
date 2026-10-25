#!/usr/bin/env python3
"""Testversion av hemsidan, för provet med bokningstjänsten.

Visar hemsidans statiska filer, precis som de ligger i repot, med två skillnader:

- hyr.html hämtas från förhandsvisningen som bokningstjänsten uppdaterar
  (forhandsvisning/hyr.html i datamappen, se BOKNING_DATA). Där syns bokningarna från provet, och
  knappen för bokningsförfrågan leder till formuläret. Den riktiga hyr.html
  ändras aldrig.
- Överst på varje sida står att det är en testversion.

Bara hemsidans egna filer visas: html-filerna i repots rot och mapparna css/,
bilder/ och js/. Allt annat, till exempel tjanst/ med databasen och
inställningarna, går inte att nå.

    python3 hemsida_prov.py                  # http://127.0.0.1:8096/
    python3 hemsida_prov.py 0.0.0.0:8096     # nås även från andra datorer

Skriptet behöver bara Python 3, inga tillägg.
"""

import http.server
import mimetypes
import os
import re
import sys
import urllib.parse
from pathlib import Path

TJANST = Path(__file__).resolve().parent
REPO = TJANST.parent
FORHANDSVISNING = Path(os.environ.get("BOKNING_KALENDERFIL") or
                       Path(os.environ.get("BOKNING_DATA") or TJANST / "pb_data") / "forhandsvisning" / "hyr.html")
TILLATNA_MAPPAR = ("css", "bilder", "js")

TESTRAD = ('<p style="margin:0;padding:.6rem 1rem;background:#fff3cd;border-bottom:2px solid #b58900;'
           'font-weight:700;text-align:center">TESTVERSION av hemsidan. Bokningarna är påhittade.</p>')


def hitta(sokvag):
    """Filen som ska visas, eller None om den inte får visas."""
    delar = [d for d in urllib.parse.unquote(sokvag).split("/") if d]
    if not delar:
        delar = ["index.html"]
    if any(d.startswith(".") for d in delar):
        return None
    if len(delar) == 1 and delar[0].endswith(".html"):
        if delar[0] == "hyr.html" and FORHANDSVISNING.is_file():
            return FORHANDSVISNING
        fil = REPO / delar[0]
    elif delar[0] in TILLATNA_MAPPAR:
        fil = REPO.joinpath(*delar)
    else:
        return None
    fil = fil.resolve()
    if not fil.is_file() or REPO not in fil.parents:
        return None
    return fil


class Hemsida(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        # Testversionen ska aldrig hamna i sökmotorer och förväxlas med hemsidan.
        if urllib.parse.urlsplit(self.path).path == "/robots.txt":
            data = b"User-agent: *\nDisallow: /\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        fil = hitta(urllib.parse.urlsplit(self.path).path)
        if fil is None:
            self.send_error(404, "Sidan finns inte")
            return
        data = fil.read_bytes()
        typ = mimetypes.guess_type(fil.name)[0] or "application/octet-stream"
        if typ == "text/html":
            data = re.sub(rb"(<body[^>]*>)", lambda m: m.group(1) + TESTRAD.encode(), data, count=1)
            typ += "; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    adress = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1:8096"
    vard, port = adress.rsplit(":", 1)
    print(f"Testversionen av hemsidan: http://{adress}/", flush=True)
    http.server.ThreadingHTTPServer((vard, int(port)), Hemsida).serve_forever()
