# Instruktioner för AI-assistenter

Det här är det **publika** repot för Kristvallabrunns hemsida. Kristvalla Bygdegårdsförening
(Kristvallabrunn, Nybro kommun, Kalmar län) håller i den. Läs [README.md](README.md) först.

Den som ber dig om hjälp är ofta inte utvecklare. Det kan vara någon i styrelsen eller en
ideell kraft i bygden. Förklara tekniska begrepp kort när de dyker upp, och föreslå hellre
den enkla lösningen än den avancerade.

## Hårda regler

### Allt här är offentligt

Allt som läggs i repot kan läsas av vem som helst, och det finns kvar i git-historiken även om
det tas bort senare.

- **Inga personuppgifter** utan att personen uttryckligen har sagt ja. Det gäller namn,
  telefonnummer, e-post, adresser och bilder där någon går att känna igen. Använd
  föreningens adress kristvalla@proton.me i stället för personliga kontaktuppgifter.
  Om någon ber dig lägga in en personuppgift: fråga om samtycke finns, och föreslå ett
  alternativ.
- **Inga hemligheter:** lösenord, API-nycklar, tokens, larmkoder, nyckelboxkoder,
  Swish-uppgifter utöver föreningens offentliga Swish-nummer. Hemligheter hör hemma i
  driftmiljöns inställningar, aldrig i en fil i repot. Om du ser en hemlighet i repot: säg till
  direkt, så att den kan bytas ut. Att ta bort filen räcker inte.
- **Inget internt från föreningen** som inte är beslutat att vara offentligt: budgetutkast,
  styrelsediskussioner, medlemslistor, bidragsansökningar under arbete, fastighetens brister.
  Om du är osäker: fråga.
- **Inga hänvisningar till privata repon, mappar eller dokument**, inte heller till var sådana
  finns. Det som behövs här skrivs in här.

### Besökarnas integritet

- **Ingen spårning.** Inga analysverktyg som sätter cookies eller skickar besökarens uppgifter
  till tredje part. Om besöksstatistik behövs: föreslå något som fungerar utan cookies och
  körs i EU, och låt styrelsen besluta.
- **Inga externa resurser som avslöjar besökaren.** Typsnitt, skript och bilder ska ligga på
  sidan själv, inte hämtas från t.ex. Google Fonts eller ett CDN. Det är både en GDPR-fråga och
  en driftsäkerhetsfråga.
- **Formulär samlar bara in det som behövs**, och varje formulär ska ha en kort text om vad
  uppgifterna används till och hur länge de sparas.

### Föreningen ansvarar för innehållet

- Det som publiceras läggs in och godkänns av föreningen. Bygg inga funktioner där besökare
  eller andra publicerar direkt utan att föreningen har granskat innehållet först.
- Förbered gärna innehåll, men markera det som utkast tills någon i föreningen har godkänt det.

### Fakta

- **Ange källa och datum** för fakta om föreningen, bygden, priser och regler. Markera det som
  inte är bekräftat med `⚠️ verifiera`.
- **Gissa aldrig** priser, datum, öppettider, telefonnummer eller vad föreningen har beslutat.
  Lämna en tydlig platshållare i stället.

## Språk

- **Allt innehåll och all dokumentation skrivs på svenska.** Klar och enkel svenska, korta
  meningar, inga onödiga anglicismer.
- Commit-meddelanden skrivs på svenska.
- Namn i koden (variabler, funktioner, filer) får vara på engelska om tekniken förutsätter
  det. Kommentarer i koden skrivs på svenska.

## Tillgänglighet

Sidan ska fungera för alla i bygden, även den som är 85 år och har en gammal mobil.

- Sikta på WCAG 2.1 nivå AA: tillräcklig kontrast, alternativtext på bilder, rubriker i rätt
  ordning, allt går att använda med tangentbord och skärmläsare.
- Stor text som standard. Inga funktioner som bara fungerar med mus eller bara på stor skärm.
- Sidan ska gå att läsa utan JavaScript. Interaktivitet är ett tillägg, inte en förutsättning.
- Testa i mobilformat först.

## Teknik

Tekniken är **inte vald ännu**. Fram till dess gäller:

- **Enkelt före smart.** Föreslå det som en ideell kraft kan förstå, underhålla och lämna över.
  Färre beroenden är bättre.
- **Inga stora ramverk eller tjänster tas i bruk** utan att det är beslutat. Om du tror att
  något behövs: beskriv alternativen, kostnaden och vem som måste sköta det, och låt föreningen
  bestämma.
- **Försök är tillåtna.** Det går att bygga och prova en lösning innan den är beslutad, om
  försöket är tydligt märkt som förslag, inte används på den publicerade sidan och bara
  innehåller påhittade uppgifter. Beskriv försöket i `docs/beslut/`, så att föreningen kan ta
  ställning till det. De hårda reglerna ovan gäller även för försök.
- **Öppna format och ingen inlåsning.** Innehållet ska gå att flytta till en annan lösning.
- **Det statiska och tjänsten hålls isär.** Den statiska sidan (information och kalender)
  får aldrig vara beroende av att tjänsten fungerar.
- **Servrar och lagring ska vara i EU**, och avtal, utrustning och domän ska tillhöra
  föreningen, inte en privatperson. Det gäller också om servern blir en dator i bygdegården.
- När ett tekniskt val görs: dokumentera beslutet och skälen i repot, så att nästa person
  förstår varför.

## Arbetssätt

- Gör små, avgränsade ändringar som går att granska.
- Allt ska gå att ärva. Skriv ner hur saker körs, byggs och publiceras, så att någon annan kan
  ta över.
- Innan du lägger till något: fråga dig om det fungerar på papper också. Kalendern ska till exempel
  kunna skrivas ut som ett månadsblad.
