# Bokningstjänsten (förslag)

> **FÖRSLAG.** Det här är en provversion. Den är inte beslutad av föreningen och används inte på
> den publicerade sidan. Prova den bara med påhittade uppgifter. Bakgrunden står i
> [docs/beslut/tjanst-for-bokning.md](../docs/beslut/tjanst-for-bokning.md).

Tjänsten bygger på [PocketBase](https://pocketbase.io) v0.40.6. Det är ett enda program med en
inbyggd databas och en administrationssida. Det är öppen källkod (MIT-licens).

## Vad som finns här

```
hamta-pocketbase.sh        hämtar programmet och kontrollerar att filen är äkta
starta.sh                  startar tjänsten
installningar.exempel.env  mall för inställningarna (mottagare, e-post, adress)
pb_migrations/             skapar tabellerna och reglerna för vem som får se vad
pb_hooks/bokning.pb.js     formuläret, mejlen, beslutssidan och påminnelserna
pb_hooks/mallar.js         texterna i mejlen, som föreningen ändrar själv
pb_hooks/stod.js           hjälpfunktioner
pb_public/                 formuläret för bokningsförfrågan (provversion)
uppdatera_kalender.py      skriver in bekräftade datum i kalendern i hyr.html
epost_prov.py              testbrevlåda som sparar mejlen som filer i stället för att skicka dem
hemsida_prov.py            testversion av hemsidan, med kalendern från provet
systemd/                   tjänster som startar allt ovan när datorn startar
hamta-newt.sh              hämtar Newt, som håller tunneln till Pangolin öppen
newt.exempel.env           mall för tunnelns uppgifter
```

Det här checkas **inte** in: programfilen `pocketbase`, datamappen (den innehåller
förfrågningarna, och de innehåller personuppgifter), `installningar.env` (den kan innehålla
lösenord) och `verktyg/` (testbrevlådans mejl).

Lägg helst datamappen och inställningarna **utanför** projektmappen, så att de inte följer med
om projektmappen säkerhetskopieras till en molntjänst. Se *Köra som tjänster* nedan.

## Så fungerar det

Bokningsansvariga behöver bara e-posten. De behöver inget konto, inget lösenord och ingen
administrationssida.

1. **Förfrågan.** Den som vill hyra fyller i formuläret: namn, e-post, datum, ungefärligt antal
   personer och vad det gäller. Förfrågan sparas med status **ny**, och den som frågat får ett
   mejl om att den har kommit fram.
2. **Notis.** Bokningsansvariga får ett mejl med allt som behövs för att bedöma förfrågan: om
   dagen är ledig, om fler har frågat om samma dag och en checklista. Mejlet har två knappar:
   **Godkänn** och **Avböj**. Svarar man på mejlet går svaret till den som frågat.
3. **Beslut.** Knappen öppnar en sida där man bekräftar valet och kan skriva ett meddelande.
   Länken visar bara förfrågan. Inget ändras förrän man trycker på knappen på sidan, så det gör
   inget om ett e-postprogram öppnar länken i förväg.
4. **Svar.** Den som frågat får ett mejl enligt mallarna i `pb_hooks/mallar.js`. De andra
   bokningsansvariga får veta att förfrågan är besvarad. Har fler frågat om samma dag visar sidan
   länkar för att avböja dem.
5. **Kalendern.** `uppdatera_kalender.py` körs varje gång en förfrågan godkänns eller ändras, och
   varje timme. Under provet skriver den en kopia av `hyr.html`, som visas i testversionen av
   hemsidan. Den riktiga `hyr.html` ändras inte.
6. **Påminnelse.** Har ingen svarat på tre dagar kommer ett nytt mejl, kl. 8 på morgonen.

Länken i mejlet fungerar bara för just den förfrågan. Den som har tillgång till mejlet kan alltså
besluta om förfrågan. Därför ska mejlen bara gå till bokningsansvariga.

Administrationssidan behövs bara för det ovanliga, till exempel att ändra ett beslut som blev fel.

Vem ser vad:

| Tabell | Innehåll | Vem kan läsa |
|---|---|---|
| `forfragningar` | Namn, e-post, datum, antal, vad det gäller, status | Bara administratörer |
| `bokade_datum` | Bara datumen för bekräftade bokningar | Alla |

Fler skydd:

- Besökare kan inte sätta status själva. Allt som kommer via formuläret blir **ny**.
- Länkarna i mejlen har en slumpad nyckel. En förfrågan som redan är besvarad kan inte ändras via
  länken.
- Samma dag kan inte bekräftas för två förfrågningar.
- Formuläret tar inte emot datum som har passerat, eller dagar som redan är bekräftade.
- Högst fem förfrågningar per minut från samma adress. Ett dolt fält fångar skräpprogram.
- Namn och texter från formuläret visas alltid som vanlig text, aldrig som kod.
- Formuläret fungerar utan JavaScript.

## Prova på egen dator

Det behövs Linux (eller en Mac med andra filnamn i `hamta-pocketbase.sh`), `curl`, `unzip` och
Python 3.

```sh
cd tjanst
./hamta-pocketbase.sh
./pocketbase superuser upsert din-adress@example.com ett-langt-losenord --dir=pb_data --migrationsDir=pb_migrations
cp installningar.exempel.env installningar.env
python3 epost_prov.py      # testbrevlådan, i ett eget terminalfönster
./starta.sh                # tjänsten, i ett eget terminalfönster
python3 hemsida_prov.py    # testversionen av hemsidan, i ett eget terminalfönster
```

Öppna sedan i webbläsaren på samma dator:

- **Testversionen av hemsidan:** http://127.0.0.1:8096/ (under *Hyr bygdegården* leder knappen
  för bokningsförfrågan till formuläret)
- **Formuläret:** http://127.0.0.1:8097/
- **Administrationssidan:** http://127.0.0.1:8097/_/ (logga in med adressen och lösenordet ovan)

Testversionen av hemsidan visar bara hemsidans egna filer: html-filerna och mapparna `css/` och
`bilder/`. Databasen och inställningarna i `tjanst/` går inte att nå därifrån. `hyr.html` visas
med kalendern från provet. Innan någon förfrågan har besvarats visas den vanliga `hyr.html`.

Mejlen hamnar i `verktyg/mejl/` som `.eml`-filer. De går att öppna i ett vanligt e-postprogram,
och länkarna i dem fungerar. Testbrevlådan skriver också ut ämnesraden för varje mejl.

Stoppa tjänsten och testbrevlådan med Ctrl+C.

### Inställningar

Inställningarna står i `installningar.env`. Se kommentarerna i `installningar.exempel.env`. De
viktigaste:

| Inställning | Vad den gör |
|---|---|
| `BOKNING_MOTTAGARE` | Vilka som får mejl om nya förfrågningar. Minst två, så att någon kan ta över |
| `BOKNING_HTTP` | Var tjänsten lyssnar. `127.0.0.1:8097` betyder bara den egna datorn |
| `BOKNING_ADRESS` | Adressen i länkarna i mejlen, så som bokningsansvariga når tjänsten |
| `SMTP_…` | Kontot som mejlen skickas från. Under provet: testbrevlådan |

Startas tjänsten utan `installningar.env` lyssnar den bara på den egna datorn och skickar inga
mejl.

### Prov med styrelsen

För att styrelsen ska kunna prova från sina mobiler måste tjänsten gå att nå från dem, och mejlen
måste komma fram på riktigt:

1. **Nå tjänsten:** till exempel via Tailscale, med maskinen delad med just dem som provar. Sätt
   `BOKNING_HTTP` och `BOKNING_ADRESS` till maskinens adress i Tailscale.
2. **Mejl på riktigt:** fyll i `SMTP_…` med ett konto som får skicka e-post, och sätt
   `BOKNING_MOTTAGARE` till de bokningsansvarigas adresser.
3. **Bara påhittade uppgifter** i förfrågningarna. Ämnesraden börjar med `[PROV]`.

Uppdatera kalendern för hand, medan tjänsten är igång:

```sh
python3 uppdatera_kalender.py                         # skriver om ../hyr.html
python3 uppdatera_kalender.py --fil /tmp/hyr-prov.html # prova på en kopia
python3 uppdatera_kalender.py --manader 4              # visa fyra månader
```

Skriptet visar månaderna från och med den här månaden och sätter datumet för *Senast
uppdaterad*. Om tjänsten inte svarar ändras ingenting. Under provperioden: kör skriptet mot en
kopia, så att de påhittade bokningarna inte hamnar på den riktiga sidan.

Tjänsten kör skriptet själv mot filen i `BOKNING_KALENDERFIL` (som standard
`pb_data/forhandsvisning/hyr.html`, som testversionen av hemsidan visar). Att ändringen sedan publiceras på hemsidan av sig själv kräver
ett beslut, se *Inte klart*.

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

## Köra som tjänster

På en Linux-dator med systemd kan tjänsten, testbrevlådan och testversionen av hemsidan startas
automatiskt när datorn startar. De körs som den vanliga användaren, utan administratörsrättigheter.
Filerna i `systemd/` förutsätter att repot ligger i `~/Projects/kristvalla`.

```sh
mkdir -p ~/.config/kristvalla ~/.local/share/kristvalla
cp installningar.exempel.env ~/.config/kristvalla/installningar.env
chmod 600 ~/.config/kristvalla/installningar.env     # bara du kan läsa den
nano ~/.config/kristvalla/installningar.env          # fyll i, BOKNING_DATA pekar på datamappen

cp systemd/kristvalla-*.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now kristvalla-epost kristvalla-tjanst kristvalla-hemsida
sudo loginctl enable-linger "$USER"     # så att tjänsterna startar utan att någon loggar in
```

| Tjänst | Vad | Adress |
|---|---|---|
| `kristvalla-tjanst` | Bokningstjänsten (PocketBase) | http://127.0.0.1:8097/ |
| `kristvalla-hemsida` | Testversionen av hemsidan | http://127.0.0.1:8096/ |
| `kristvalla-epost` | Testbrevlådan | 127.0.0.1:1025 |

Efter en ändring i inställningarna: `systemctl --user restart kristvalla-tjanst kristvalla-hemsida`.
Läget visas med `systemctl --user status kristvalla-tjanst`.

## Åtkomst utifrån med Pangolin

Under provet nås tjänsten utifrån via Pangolin Cloud. Varför, och vad det innebär, står i
[docs/beslut/atkomst-utifran.md](../docs/beslut/atkomst-utifran.md). Pangolin kan läsa trafiken,
så bara påhittade uppgifter får användas.

Så kopplas tjänsten in:

1. **Konto och domän.** Skapa ett konto på https://app.pangolin.net/ och lägg till domänen där.
2. **Site.** Skapa en *site* av typen Newt. Pangolin visar då ett ID och en hemlighet.
3. **Newt på datorn:**

   ```sh
   ./hamta-newt.sh
   cp newt.exempel.env ~/.config/kristvalla/newt.env
   chmod 600 ~/.config/kristvalla/newt.env
   nano ~/.config/kristvalla/newt.env       # fyll i ID och hemlighet
   cp systemd/kristvalla-newt.service ~/.config/systemd/user/
   systemctl --user daemon-reload
   systemctl --user enable --now kristvalla-newt
   ```

4. **Resurser i Pangolin**, en per adress. Båda pekar på sajten och `127.0.0.1`. Slå av Pangolins
   inloggning, så att besökare kommer in utan konto:

   | Resurs | Mål | Till exempel |
   |---|---|---|
   | Bokningstjänsten | `127.0.0.1:8097` | `boka.<domän>` |
   | Testversionen av hemsidan | `127.0.0.1:8096` | `prov.<domän>` |

5. **Stäng administrationen utåt.** Lägg till regler i Pangolin för bokningstjänsten som nekar
   sökvägarna `/_/*` och `/api/*`. Formuläret och sidan för beslut använder dem inte.
   Administrationssidan nås då bara från datorn själv.
6. **Inställningar** i `~/.config/kristvalla/installningar.env`:

   ```sh
   BOKNING_ADRESS=https://boka.<domän>     # länkarna i mejlen
   BOKNING_PROXYHUVUD=X-Forwarded-For      # besökarens egen adress, för gränsen per minut
   ```

   Starta sedan om: `systemctl --user restart kristvalla-tjanst kristvalla-hemsida`.

Tjänsten fortsätter att lyssna bara på `127.0.0.1`. Allt utifrån kommer genom tunneln.

Före riktig drift byts Pangolin Cloud mot Pangolin på föreningens egen server i EU. Då ändras
bara `PANGOLIN_ENDPOINT` och uppgifterna i `newt.env`.

## Börja om

Stoppa tjänsten och ta bort datamappen (`BOKNING_DATA`, annars `pb_data/`). Nästa gång tjänsten startar skapas tabellerna på
nytt, och administratören behöver skapas igen.

## Inte klart

- Hur länge förfrågningar sparas är inte beslutat. ⚠️ [enligt föreningens beslut]. Därefter ska
  de tas bort, för hand eller automatiskt.
- Texterna i mejlen har platshållare för pris, betalning och nyckel. Föreningen fyller i dem i
  `pb_hooks/mallar.js`.
- Vilket e-postkonto mejlen skickas från. Proton tillåter det bara med vissa betalda
  abonnemang. ⚠️ verifiera
- Att publicera kalendern automatiskt. Tjänsten skulle då behöva få skicka ändringar till repot
  med ett konto som föreningen äger, utan granskning i en pull request. Det som ändras är bara
  datum som föreningen redan har godkänt.
- Formuläret är inte inlagt på `hyr.html`. Det görs först när föreningen har beslutat, och då ska
  sidan visa knappen för e-post när tjänsten inte svarar.
- Säkerhetskopia, åtkomst utifrån och var datorn ska stå: se beslutsdokumentet.
- PocketBase skapar en tom tabell `users` som standard. Den används inte.
