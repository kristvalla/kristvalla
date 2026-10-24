# Tjänst för bokningar

> **Status: förslag, 2026-10-24.** Inte beslutat av föreningen. En provversion finns i
> [tjanst/](../../tjanst/README.md). Den används inte på den publicerade sidan.

## Vad som ska lösas

I dag mejlar den som vill hyra bygdegården, och föreningen uppdaterar kalendern på sidan
*Hyr bygdegården* för hand. Det fungerar, men det är lätt att glömma, och kalendern blir
inaktuell.

Tjänsten ska i första hand:

1. Ta emot en **bokningsförfrågan** via ett formulär på sidan.
2. Låta den som är bokningsansvarig **godkänna eller avböja** förfrågan.
3. **Uppdatera kalendern** med bokade datum, utan att någon ändrar i filerna för hand.

Senare kan samma tjänst användas för inloggning för föreningen och för att lägga in
aktiviteter i kalendariet. Det ingår inte i det här förslaget.

## Förslag

**PocketBase på en äldre laptop i bygdegården.**

- PocketBase är ett enda program och en databas som ligger i en mapp. Säkerhetskopian är en
  kopia av mappen.
- Det har inloggning och en enkel administrationssida inbyggt. Bokningsansvarig godkänner
  förfrågningar där, utan att något eget behöver byggas för det.
- Det är öppen källkod (MIT-licens) och lätt nog att gå på en gammal dator.
- Uppgifterna kan tas ut i öppna format, så föreningen kan byta lösning senare.

### Hur delarna hänger ihop

| Del | Vad den gör | Om tjänsten ligger nere |
|---|---|---|
| Den statiska sidan (som i dag) | Visar information och kalender | Fungerar som vanligt, med den senaste kalendern |
| Formuläret | Skickar förfrågan till tjänsten | Sidan visar knappen för e-post i stället |
| Tjänsten på laptopen | Sparar förfrågningar och bokningar | Förfrågningar tas emot via e-post tills vidare |

Kalendern på den statiska sidan visar bara *att* en dag är bokad, aldrig vem som har bokat.

## Provversion

En provversion med PocketBase v0.40.6 finns i [tjanst/](../../tjanst/README.md), med anvisning
för hur den startas. Den är provad på en vanlig dator med påhittade uppgifter. Den har:

- ett formulär för bokningsförfrågan som fungerar utan JavaScript,
- en tabell med förfrågningar som bara administratörer kan läsa,
- en öppen lista med bara datumen för bekräftade bokningar, utan namn,
- en spärr mot att samma dag bekräftas två gånger,
- ett skript som skriver in de bekräftade datumen i kalendern i `hyr.html`.

Skriptet ändrar bara filen. Ändringen publiceras sedan som vanligt. Om tjänsten ligger nere
ändras ingenting, och sidan visar den senaste kalendern.

## Alternativ

| Alternativ | För | Emot |
|---|---|---|
| **Som i dag: e-post och kalender för hand** | Inget att sköta | Kalendern blir inaktuell, mer handarbete |
| **PocketBase på en laptop i bygdegården** | Ingen hyra, föreningen äger allt, uppgifterna stannar i huset | Kräver bredband, värme och ström, någon måste sköta datorn |
| **PocketBase på en hyrd server i EU** | Driftsäkert, oberoende av huset | Månadskostnad ⚠️ jämför priser |
| **Färdigt bokningssystem för lokaler** | Ingen egen drift | Månadskostnad, svårare att bygga in i sidan, risk för inlåsning |

Börjar föreningen med laptopen kan tjänsten flyttas till en hyrd server senare. Det är samma
program.

## Kostnad

- **Laptop:** en äldre maskin som föreningen får eller köper begagnad.
- **Bredband:** fiber finns i huset. Abonnemanget kostar ⚠️ [pris per månad].
- **El:** liten.
- **Åtkomst utifrån:** se *Att lösa före start*. Det kan kosta något, beroende på val.

## Vem sköter vad

- **Minst två administratörer** som kan starta om tjänsten, installera uppdateringar och
  återställa en säkerhetskopia.
- **Bokningsansvarig** godkänner förfrågningar.
- **En driftanvisning** i repot, så att någon annan kan ta över.

## Personuppgifter

En bokningsförfrågan innehåller namn, e-post, önskat datum, ungefärligt antal personer och vad
det gäller. Inget mer.

- Bara föreningen ser uppgifterna. Föreningen är personuppgiftsansvarig.
- Uppgifterna sparas ⚠️ [hur länge, enligt föreningens beslut] och tas sedan bort.
- Formuläret har en kort text om vad uppgifterna används till och hur länge de sparas.

## Att lösa före start

- **Åtkomst utifrån.** Ett vanligt bredbandsabonnemang har ofta ingen fast adress, och att
  öppna routern utåt är en säkerhetsrisk. Det vanliga är en tunnel ut till en mellanstation.
  Mellanstationen ska ligga i EU.
- **Fysisk säkerhet.** Den som hyr lokalen har tillgång till huset. Laptopen ska stå inlåst och
  ha krypterad hårddisk.
- **Batteriet.** Ett batteri som alltid laddar kan svälla med åren. Ta ur det eller begränsa
  laddningen.
- **Säkerhetskopia** till ett annat ställe än huset.
- **Var den statiska sidan ligger.** Den ligger i dag på GitHub Pages, som drivs av ett
  amerikanskt företag. Sidan innehåller inga personuppgifter, men besökarnas webbläsare
  kontaktar GitHub. Föreningen behöver ta ställning till om det duger eller om även den statiska
  sidan ska ligga i EU.

## Beslut

- [ ] Föreningen beslutar om tjänsten: ⚠️ [datum, protokoll §]
