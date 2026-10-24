# Kristvalla Bygdegårdsförening

Hemsidan för bygdegårdsföreningen i Kristvallabrunn, Nybro kommun.

Sidan ska vara **bygdens gemensamma anslagstavla**. Här ska man se vad som händer i veckan,
kunna hyra bygdegården och bli medlem, och få veta hur det är att bo här. Aktiviteter från andra
föreningar, skolan, kyrkan och företagen i bygden får gärna synas. Föreningen lägger in dem och
ansvarar för innehållet.

> **Status:** utkast. Se hur sidan kan bli på
> **[kristvalla.github.io/kristvalla](https://kristvalla.github.io/kristvalla/)**.
> Domänen är tänkt att bli kristvalla.se.

## Vad sidan ska göra

- **Kalender** med det som händer i bygden. Den går att prenumerera på i mobilen och skriva ut
  som ett månadsblad för dem som inte är på nätet.
- **Hyr bygdegården**: bilder, pris och lediga datum, och en bokningsförfrågan.
- **Bli medlem** i bygdegårdsföreningen.
- **Om föreningen och bygden**, med husets och ortens historia.
- Senare: **Flytta hit**, en anslagstavla för att låna och hjälpa varandra, och *Så används
  föreningens pengar*, om vad intäkterna från verksamheten går till.

## Principer

1. **Mata in en gång, ut överallt.** En aktivitet läggs in på ett ställe och syns på webben, i
   kalendern i telefonen, i nyhetsbrevet och i månadsbladet på papper.
2. **Föreningen ansvarar för innehållet.** Det är styrelsen som lägger in och godkänner det som
   publiceras. Den som vill ha med något hör av sig till föreningen.
3. **Få klick för den som uppdaterar.** Mobilen först, mallar för det som återkommer, inga
   lösenord att komma ihåg.
4. **Ingen lämnas utanför.** Papper och nät är lika viktiga. Stor och lättläst text. Sidan ska
   fungera på en gammal mobil och med skärmläsare.
5. **Driftsäkert och billigt.** Den information som besökare behöver ska fungera även om något
   annat ligger nere. Inga prenumerationer som låser in föreningen.
6. **Ska gå att ärva.** Fler än en person kan sköta sidan, och allt är dokumenterat här.
7. **Öppen källkod.** Andra bygdegårdar ska kunna kopiera upplägget.
8. **Besökarnas integritet.** Ingen spårning, inga annonser och inga tredjepartstjänster som
   samlar in uppgifter om den som läser.

## Hur sidan är tänkt att byggas

Sidan delas i två delar, så att det viktigaste alltid fungerar:

| Del | Innehåll | Om den går ner |
|---|---|---|
| **Statisk sida** | Startsida, kalender, fasta sidor | Händer i praktiken inte |
| **Tjänst** (senare) | Inloggning för föreningen, bokning, redigering, nyhetsbrev | Sidan visar den senaste kalendern och "boka via e-post tills vidare" |

Tekniken är inte vald ännu. Alternativen för var tjänsten ska köras:

| Alternativ | För | Emot |
|---|---|---|
| **En laptop som server i bygdegården** | Ingen månadskostnad, föreningen äger allt, data stannar i huset | Kräver stabil uppkoppling och ström, någon måste sköta den, säkerhetskopia behövs på ett annat ställe |
| **En liten hyrd server i EU** | Driftsäker, oberoende av huset | Månadskostnad, någon måste sköta uppdateringar |
| **En hanterad tjänst i EU** | Minst eget arbete | Beroende av leverantören, kan kosta mer |

Oavsett val ska servern stå i EU, avtal och utrustning ska tillhöra föreningen och inte en
privatperson, och det ska finnas en säkerhetskopia på ett annat ställe.

## Etapper

1. **Grunden:** en statisk sida med startsida, kalender, hyr bygdegården (förfrågan via e-post),
   bli medlem och om föreningen.
2. **Tjänsten:** föreningen kan lägga in och ändra innehåll från mobilen, med bokningskalender,
   nyhetsbrev och månadsblad.
3. **Bygdens sida fullt ut:** Flytta hit, anslagstavla, bygdens företag och andra föreningars
   aktiviteter.

## Vill du vara med?

- **Har du en aktivitet i bygden** som ska synas på sidan? Hör av dig till föreningen.
- **Kan du webb, eller vill du lära dig?** Hjälp är välkommen. Skapa ett *issue* här på GitHub
  med en fråga eller ett förslag.
- **Är du med i en annan bygdegård** och vill göra något liknande? Koden och texterna får
  återanvändas enligt licenserna nedan.

## Titta på sidan

Utkastet finns på **[kristvalla.github.io/kristvalla](https://kristvalla.github.io/kristvalla/)**.
Det är en förhandsvisning via GitHub Pages och uppdateras när en ändring förs in i
huvudgrenen (`main`). Det är inte sidans slutliga adress.

Sidan är vanliga HTML-filer utan byggsteg. Du kan också öppna `index.html` i en webbläsare
på din egen dator, så fungerar den direkt.

```
index.html     startsidan med kalendern
hyr.html       hyr bygdegården
medlem.html    bli medlem
om.html        om föreningen
css/stil.css   gemensam stil, även för utskrift av kalendern
bilder/        loggan och andra bilder
```

Text inom gul markering är platshållare som ska bytas ut innan sidan publiceras.

## Repot

Det här repot är **publikt**. Allt som läggs här kan läsas av vem som helst och finns kvar i
historiken även om det tas bort senare. Därför:

- Inga personuppgifter om någon som inte uttryckligen har sagt ja till att synas.
- Inga lösenord, nycklar eller koder.
- Inget om föreningens interna ekonomi eller styrelsens arbete som inte är beslutat att vara
  offentligt.

Instruktioner för den som arbetar i repot med AI-assistans finns i [AGENTS.md](AGENTS.md).

## Licens

- **Koden:** [MIT](LICENSE).
- **Texterna:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.sv). Du får
  använda och bearbeta dem om du anger Kristvalla Bygdegårdsförening som källa.
- **Bilderna** omfattas inte av licenserna. De får bara användas om det står att de får det,
  eftersom fotografen och de som syns på bilden har egna rättigheter.

## Kontakt

Kristvalla Bygdegårdsförening, Kristvallabrunn, Nybro kommun\
E-post: [kristvalla@proton.me](mailto:kristvalla@proton.me)
