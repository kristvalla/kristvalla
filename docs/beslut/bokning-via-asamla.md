# Bokning via Asamla

> **Status: beslutat av den som sköter hemsidan, 2026-11-23.** ⚠️ Styrelsen behöver bekräfta att
> föreningen använder Asamla för bokning: [datum, protokoll §].

Styrelsen beslutade 2026-11-22 (§ 8.1) att Asamla är föreningens system och medlemsregister. Det
gäller medlemskapet. Beslutet om bokning i Asamla är inte taget av styrelsen än.

## Beslut

Föreningen behåller sin egen hemsida. Bokningen av bygdegården sköts i Asamla
(asamla.se), som föreningen redan använder för medlemskap. Sidan *Hyr bygdegården* länkar dit.

Den egna bokningstjänsten i [tjanst/](../../tjanst/README.md) utvecklas inte vidare. Förslaget i
[tjanst-for-bokning.md](tjanst-for-bokning.md) och valet i [atkomst-utifran.md](atkomst-utifran.md)
gäller inte längre.

## Varför

Den egna tjänsten består av många delar: PocketBase på en dator, en tunnel ut till internet,
mejlflöden och ett skript som skriver kalendern. Det är mycket att sköta, och svårt att lämna
över till nästa person. Med Asamla sköter en leverantör driften. Föreningen behöver bara hålla i
innehållet.

Hemsidan behålls, eftersom den är föreningens egen och går att flytta. Den fungerar även om
Asamla ligger nere: den som vill hyra kan alltid mejla.

## Länk, och inbäddning först efter ett klick

En inbäddad ruta som laddas direkt skulle kontakta Asamla redan när besökaren öppnar *Hyr
bygdegården*. Då får Asamla veta vem som besöker föreningens sida. Det strider mot reglerna i
[AGENTS.md](../../AGENTS.md). Därför gäller:

- Varje bokningsalternativ är en **vanlig länk** till Asamlas egen sida. Det fungerar utan
  JavaScript.
- Med JavaScript finns också en **knapp som visar bokningen på sidan**. Rutan hämtas från Asamla
  först när besökaren trycker på knappen, och sidan säger då att Asamla ser besökarens
  IP-adress. Koden finns i [js/boka.js](../../js/boka.js).
- Vi använder inte Asamlas eget skript `embed.js`. `js/boka.js` gör samma sak, att ändra rutans
  höjd, och godtar bara svar från Asamla.

Provat 2026-11-23: bokningssidorna går att öppna utan konto, och Asamla tillåter inbäddning på
andra sidor. Rutan gav inga cookies och ingen lagring i webbläsaren, och inga anrop till andra än
www.asamla.se.

## Att ta reda på

- Provat 2026-11-23: de tre alternativen (vardag kväll, heldag lördag eller söndag, helg) går att
  öppna utan konto, och Asamla säger att föreningen godkänner bokningen innan den gäller.
  ⚠️ verifiera med en provbokning: att förfrågan går fram, att föreningen får den, godkännande,
  svar till den som bokar och att en redan bokad tid inte går att boka igen.
- ⚠️ verifiera var Asamla lagrar uppgifterna (inom EU?), och att det finns ett
  personuppgiftsbiträdesavtal.
- ⚠️ verifiera vad bokning kostar i Asamla, och vad gratisnivån innehåller.
- ⚠️ verifiera att uppgifterna går att exportera, så att föreningen kan byta lösning.
- Kontot ska tillhöra föreningen, och minst två personer ska ha åtkomst.
- Hur länge bokningsuppgifterna sparas: ⚠️ [enligt föreningens beslut].

## Det här ändras på sidan

- *Hyr bygdegården* har en knapp till bokningen i Asamla. Knappen för e-post finns kvar.
- Kalendern med bokade dagar på sidan tas bort. Lediga dagar visas i Asamla, så att ingen behöver
  uppdatera två kalendrar.
- Länkarna till de tre bokningsalternativen är inlagda. Priserna kommer från beskrivningarna i
  Asamla, 2026-11-23. ⚠️ verifiera mot det undertecknade protokollet.
