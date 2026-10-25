# Åtkomst utifrån till bokningstjänsten

> **Status: förslag, 2026-10-25.** Valet för provet är gjort (se *Beslut*). Valet för riktig drift
> är inte beslutat av föreningen.

## Vad som ska lösas

Bokningstjänsten (se [tjanst-for-bokning.md](tjanst-for-bokning.md)) körs på en dator som står
inomhus, i dag en provdator och senare kanske en laptop i bygdegården. Den som vill hyra och
styrelsens mobiler måste kunna nå den över internet, med HTTPS. En app på mobilens hemskärm
(PWA) fungerar bara med HTTPS.

Två saker gör det svårt:

- Ett vanligt bredbandsabonnemang har ofta ingen fast adress, och ibland delar flera kunder på
  samma adress (CGNAT). Då går det inte att nå datorn utifrån alls.
- Att öppna en port i routern exponerar hela nätverket i huset.

Det vanliga sättet är en **tunnel**: datorn öppnar själv en krypterad förbindelse ut till en
mellanstation på internet. Besökarna går till mellanstationen, som skickar trafiken vidare
genom tunneln. Inget behöver öppnas i routern.

## Vad mellanstationen kan se

Mellanstationen ordnar HTTPS-certifikatet för adressen. Krypteringen avslutas där och startas
på nytt i tunneln. Den som driver mellanstationen kan alltså läsa trafiken i klartext:

- bokningsförfrågningar (namn, e-post, antal personer och vad det gäller),
- styrelsens inloggningar och listor över förfrågningar,
- besökarnas IP-adresser.

Därför spelar det roll vem som driver mellanstationen och var den står.

## Undersökta alternativ

Undersökt 2026-10-25. Priser och villkor ändras. ⚠️ verifiera före beslut.

| Alternativ | Vem driver det | Kostnad | Bedömning |
|---|---|---|---|
| **Cloudflare Tunnel** | Cloudflare, USA | Gratis | Fungerar bra. Ett amerikanskt företag kan läsa trafiken. Kräver att domänen sköts av Cloudflare |
| **Pangolin Cloud** | Fossorial Inc., New York, USA | Gratis upp till 5 användare och 5 domäner | Fungerar som Cloudflare Tunnel och har noder i EU. Ett amerikanskt företag kan läsa trafiken. Har ett personuppgiftsbiträdesavtal med EU:s standardavtalsklausuler |
| **Pangolin på egen server i EU** | Föreningen, på en hyrd server hos t.ex. Hetzner (Tyskland, Finland) eller Scaleway (Frankrike) | Ca 3–6 € i månaden | Ingen annan kan läsa trafiken. En server till att hålla uppdaterad |
| **Expose** | Beyond Code GmbH, troligen Tyskland | Gratis med tidsgräns och slumpad adress, egen domän kostar | Gratisnivån duger inte, eftersom adressen byts varje gång |
| **nsl.sh** | Aptero SAS, Paris | Gratis | Trafiken går via både Cloudflare och nsl.sh, som båda kan läsa den. Ingen egen domän. Avfärdat |
| **Koyeb** | Paris (köpt av Mistral AI 2026) | Gratis server i Frankfurt | Stängs av efter en timme utan trafik och kan inte hålla en tunnel öppen. Avfärdat |
| **Oracle Always Free** | Oracle, USA | Gratis server i EU | Gratisnivån halverades 2026, och lite använda servrar kan stängas. Avfärdat |
| **Öppna en port i routern** | – | Gratis | Exponerar nätverket i huset och fungerar inte med CGNAT. Avfärdat |

Ingen gratistjänst drivs av ett företag i EU och ger en fast adress med egen domän.

**Pangolin** är öppen källkod (AGPL-3.0) och bygger på WireGuard. Samma program finns som
molntjänst och för egen server. Därför går det att börja gratis i molnet och flytta till en
egen server i EU senare, utan att något ändras på datorn med tjänsten eller för styrelsen.

Källor: [pangolin.net/pricing](https://pangolin.net/pricing),
[pangolin.net/dpa](https://pangolin.net/dpa),
[docs.pangolin.net](https://docs.pangolin.net/),
[expose.dev](https://expose.dev/),
[nsl.sh](https://nsl.sh/) och dess
[säkerhetsdokumentation](https://github.com/Yundera/mesh-router-root/blob/main/doc/SECURITY_IN_TRANSIT.md),
[github.com/anderspitman/awesome-tunneling](https://github.com/anderspitman/awesome-tunneling).

## Förslag

1. **Under provet: Pangolin Cloud.** Förfrågningarna är påhittade, och de enda riktiga adresserna
   är styrelsens egna. Det är gratis och kräver ingen egen server.
2. **Före riktiga bokningar: Pangolin på en egen server i EU**, i föreningens namn. Tunneln på
   datorn med tjänsten pekas om till föreningens server.

## Det här behövs

- **En domän** som tillhör föreningen, till exempel kristvalla.se. ⚠️ [om och var den är
  registrerad]
- **Ett konto hos Pangolin Cloud** under provet. Kontot ska senare tillhöra föreningen.
- **Programmet Newt** på datorn med tjänsten. Det håller tunneln öppen. Se
  [tjanst/README.md](../../tjanst/README.md).

## Beslut

- [x] Provet använder Pangolin Cloud. Beslutat av den som sköter provet, 2026-10-25.
- [ ] Föreningen beslutar om åtkomst utifrån för riktig drift: ⚠️ [datum, protokoll §]
