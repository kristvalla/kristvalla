# Bokningstjänsten (förslag)

> **FÖRSLAG.** Det här är en provversion. Den är inte beslutad av föreningen och används inte på
> den publicerade sidan. Prova den bara med påhittade uppgifter. Bakgrunden står i
> [docs/beslut/tjanst-for-bokning.md](../docs/beslut/tjanst-for-bokning.md).

Tjänsten bygger på [PocketBase](https://pocketbase.io) v0.40.6. Det är ett enda program med en
inbyggd databas och en administrationssida. Det är öppen källkod (MIT-licens).

## Vad som finns här

```
hamta-pocketbase.sh      hämtar programmet och kontrollerar att filen är äkta
starta.sh                startar tjänsten
pb_migrations/           skapar tabellerna och reglerna för vem som får se vad
pb_hooks/                tar emot formuläret och stoppar dubbelbokningar
pb_public/               formuläret för bokningsförfrågan (provversion)
uppdatera_kalender.py    skriver in bekräftade datum i kalendern i hyr.html
```

Programfilen `pocketbase` och datamappen `pb_data/` checkas **inte** in. Datamappen innehåller
förfrågningarna, och de innehåller personuppgifter.

## Så fungerar det

1. Den som vill hyra fyller i formuläret: namn, e-post, datum, ungefärligt antal personer och vad
   det gäller. Förfrågan sparas med status **ny**.
2. Bokningsansvarig loggar in på administrationssidan, öppnar tabellen `forfragningar` och
   ändrar status till **bekräftad** eller **avböjd**. Svaret till den som frågat skickas som
   vanligt via föreningens e-post.
3. Skriptet `uppdatera_kalender.py` hämtar de bekräftade datumen och skriver om kalendern i
   `hyr.html`. Ändringen publiceras sedan som alla andra ändringar (se README i repots rot).

Vem ser vad:

| Tabell | Innehåll | Vem kan läsa |
|---|---|---|
| `forfragningar` | Namn, e-post, datum, antal, vad det gäller, status | Bara administratörer |
| `bokade_datum` | Bara datumen för bekräftade bokningar | Alla |

Fler skydd:

- Besökare kan inte sätta status själva. Allt som kommer via formuläret blir **ny**.
- Samma dag kan inte bekräftas för två förfrågningar.
- Formuläret tar inte emot datum som har passerat, eller dagar som redan är bekräftade.
- Högst fem förfrågningar per minut från samma adress. Ett dolt fält fångar skräpprogram.
- Formuläret fungerar utan JavaScript.

## Prova på egen dator

Det behövs Linux (eller en Mac med andra filnamn i `hamta-pocketbase.sh`), `curl`, `unzip` och
Python 3.

```sh
cd tjanst
./hamta-pocketbase.sh
./pocketbase superuser upsert din-adress@example.com ett-langt-losenord --dir=pb_data --migrationsDir=pb_migrations
./starta.sh
```

Öppna sedan i webbläsaren på samma dator:

- **Formuläret:** http://127.0.0.1:8097/
- **Administrationssidan:** http://127.0.0.1:8097/_/ (logga in med adressen och lösenordet ovan)

Tjänsten lyssnar bara på den egna datorn. Port 8097 kan bytas: `PORT=8100 ./starta.sh`.
Stoppa tjänsten med Ctrl+C.

Uppdatera kalendern, medan tjänsten är igång:

```sh
python3 uppdatera_kalender.py                         # skriver om ../hyr.html
python3 uppdatera_kalender.py --fil /tmp/hyr-prov.html # prova på en kopia
python3 uppdatera_kalender.py --manader 4              # visa fyra månader
```

Skriptet visar månaderna från och med den här månaden och sätter datumet för *Senast
uppdaterad*. Om tjänsten inte svarar ändras ingenting. Under provperioden: kör skriptet mot en
kopia, så att de påhittade bokningarna inte hamnar på den riktiga sidan.

## PocketBase flyttar från GitHub

Utvecklaren har meddelat att PocketBase flyttar från GitHub till en egen plattform på
`ganigeorgiev.com/pocketbase/pocketbase`
([meddelandet](https://github.com/pocketbase/pocketbase/discussions/7841), 2026-09-12, läst
2026-10-24).

**Läget 2026-10-24:** flytten har inte skett än. v0.40.6, som provversionen använder, finns på
GitHub och ligger kvar där. `hamta-pocketbase.sh` fungerar alltså även efter flytten.

Det här ändras:

- **Nya versioner** finns bara på den nya plattformen. Ingen kopia läggs på GitHub.
- **Bevakningen flyttas inte.** Den som sköter tjänsten behöver följa PocketBase på den nya
  plattformen för att få veta om säkerhetsluckor.

Så ser du om flytten har skett:

```sh
gh api repos/pocketbase/pocketbase -q .archived   # true = flyttat
```

När föreningen går upp till en nyare version: byt `VERSION` och adressen `BAS` i
`hamta-pocketbase.sh`. Kontrollera att kontrollsummorna (`checksums.txt`) finns på samma
ställe och i samma form, annars behöver skriptet ändras.

| Vad | Adress |
|---|---|
| Projektsida | `https://ganigeorgiev.com/pocketbase/pocketbase` ⚠️ verifiera |
| Nedladdning av en version | ⚠️ [adressformat, när utvecklaren har publicerat det] |
| Kontrollsummor | ⚠️ [adress] |

## Börja om

Stoppa tjänsten och ta bort mappen `pb_data/`. Nästa gång tjänsten startar skapas tabellerna på
nytt, och administratören behöver skapas igen.

## Inte klart

- Hur länge förfrågningar sparas är inte beslutat. ⚠️ [enligt föreningens beslut]. Därefter ska
  de tas bort, för hand eller automatiskt.
- Formuläret är inte inlagt på `hyr.html`. Det görs först när föreningen har beslutat, och då ska
  sidan visa knappen för e-post när tjänsten inte svarar.
- Säkerhetskopia, åtkomst utifrån och var datorn ska stå: se beslutsdokumentet.
- PocketBase skapar en tom tabell `users` som standard. Den används inte.
