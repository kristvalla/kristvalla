#!/usr/bin/env python3
"""Testbrevlåda för provet. Tar emot mejl från tjänsten och sparar dem som filer.

Inget skickas vidare. Varje mejl sparas i verktyg/mejl/ som en .eml-fil, som går
att öppna i ett vanligt e-postprogram. Ämnesraden skrivs också ut i terminalen.

    python3 epost_prov.py            # lyssnar på 127.0.0.1:1025

Skriptet behöver bara Python 3, inga tillägg.
"""

import email
import email.policy
import socketserver
import sys
import time
from pathlib import Path

MAPP = Path(__file__).resolve().parent / "verktyg" / "mejl"


class Smtp(socketserver.StreamRequestHandler):
    """Det minsta av SMTP som tjänsten behöver: EHLO, MAIL, RCPT, DATA, QUIT."""

    def svara(self, rad):
        self.wfile.write((rad + "\r\n").encode())

    def handle(self):
        self.svara("220 epost_prov")
        mottagare = []
        while True:
            rad = self.rfile.readline()
            if not rad:
                return
            kommando = rad.decode(errors="replace").strip().upper()
            if kommando.startswith(("EHLO", "HELO")):
                self.svara("250 epost_prov")
            elif kommando.startswith("MAIL FROM"):
                mottagare = []
                self.svara("250 OK")
            elif kommando.startswith("RCPT TO"):
                mottagare.append(rad.decode().split(":", 1)[1].strip().strip("<>"))
                self.svara("250 OK")
            elif kommando == "DATA":
                self.svara("354 Skicka")
                data = bytearray()
                while True:
                    del_ = self.rfile.readline()
                    if del_ in (b".\r\n", b".\n", b""):
                        break
                    data += del_[1:] if del_.startswith(b"..") else del_
                self.spara(bytes(data), mottagare)
                self.svara("250 OK")
            elif kommando == "QUIT":
                self.svara("221 Hej då")
                return
            else:
                self.svara("250 OK")

    def spara(self, data, mottagare):
        MAPP.mkdir(parents=True, exist_ok=True)
        fil = MAPP / f"{time.strftime('%Y%m%d-%H%M%S')}-{time.time_ns() % 10**6:06d}.eml"
        fil.write_bytes(data)
        amne = email.message_from_bytes(data, policy=email.policy.default)["Subject"]
        print(f"{fil.name}  till {', '.join(mottagare)}  {amne}", flush=True)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    adress = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1:1025"
    vard, port = adress.rsplit(":", 1)
    print(f"Testbrevlådan lyssnar på {adress}. Mejlen sparas i {MAPP}", flush=True)
    Server((vard, int(port)), Smtp).serve_forever()
