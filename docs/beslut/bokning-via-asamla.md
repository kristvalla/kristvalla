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

## Länk, inte inbäddning

Sidan länkar till Asamla och bäddar inte in Asamla i sidan. En inbäddad ruta laddar Asamlas sida
redan när besökaren öppnar *Hyr bygdegården*. Då får Asamla veta vem som besöker föreningens sida,
och det kan sättas cookies. Det strider mot reglerna i [AGENTS.md](../../AGENTS.md). Med en länk
kontaktas Asamla först när besökaren själv väljer att boka.

## Att ta reda på

- ⚠️ verifiera att Asamlas bokning räcker: lediga dagar, hel dag och pass, godkännande av
  föreningen, svar till den som bokar.
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
- Adressen till bokningen är en platshållare tills den är känd: ⚠️ [länk till bokningen i Asamla].
