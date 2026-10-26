// Texterna i mejlen. Föreningen ändrar dem här.
//
// FÖRSLAG: texterna inom [hakparenteser] ska bytas ut när föreningen har
// beslutat om pris, betalning och nycklar. Gissa inte, lämna platshållaren.
//
// {namn}, {datum}, {tid}, {meddelande} och {avtal} (länken till hyresavtalet) byts ut automatiskt.

module.exports = {
  // Tiderna man kan hyra. Koderna (dag, fm, em, kv) sparas i förfrågan och får
  // inte ändras, men namn och klockslag får det. Ändra då också Tider på hyr.html.
  // FÖRSLAG: klockslagen är inte beslutade av föreningen.
  helDag: { kod: "dag", namn: "Hel dag", tid: "09–01" },
  pass: [
    { kod: "fm", namn: "Förmiddag", tid: "09–12" },
    { kod: "em", namn: "Eftermiddag", tid: "13–16" },
    { kod: "kv", namn: "Kväll", tid: "17–20" },
  ],

  // Hyresavtalet på hemsidan (hyresavtal.html). Byt version när avtalet ändras,
  // samma datum som står i avtalet. Varje förfrågan sparar vilken version som godkändes.
  avtal: {
    version: "2026-10-25",
    sokvag: "/hyresavtal.html",
  },

  // Visas för bokningsansvarig när förfrågan ska bedömas.
  checklista: [
    "Är dagen ledig? (Står ovan.)",
    "Ryms sällskapet? Lokalen tar högst [antal personer enligt brandskyddet] personer.",
    "Säger sig hyresgästen vara medlem? Kontrollera det innan medlemspris ges.",
    "Passar det som förfrågan gäller i bygdegården?",
    "[Fler punkter enligt föreningens regler för uthyrning]",
  ],

  // Till den som har frågat, direkt när förfrågan har kommit in.
  kvitto: {
    amne: "Vi har tagit emot din förfrågan för {datum}",
    text: `Hej {namn}!

Tack för din förfrågan om att hyra Kristvalla bygdegård {datum}, {tid}.

Dagen är inte bokad förrän du har fått en bekräftelse från oss. Vi hör av oss via e-post.

Hyresavtalet som du har godkänt finns här: {avtal}

Vänliga hälsningar
Kristvalla Bygdegårdsförening`,
  },

  // Till den som har frågat, när förfrågan är godkänd.
  godkand: {
    amne: "Din bokning {datum} är bekräftad",
    text: `Hej {namn}!

Vi bekräftar din bokning av Kristvalla bygdegård {datum}, {tid}.

Pris: [enligt föreningens prislista]
Betalning: Swisha hyran i förskott till [föreningens Swish-nummer], senast [antal] dagar efter den här bekräftelsen. Skriv datumet för bokningen i meddelandet. Bokningen gäller när betalningen har kommit in.
Nyckel: [hur man får nyckeln och lämnar tillbaka den]

Hyresavtalet gäller: {avtal}
{meddelande}
Välkommen!

Kristvalla Bygdegårdsförening`,
  },

  // Till den som har frågat, när förfrågan är avböjd.
  avbojd: {
    amne: "Om din förfrågan för {datum}",
    text: `Hej {namn}!

Tack för din förfrågan. Tyvärr kan vi inte hyra ut bygdegården {datum}, {tid}.
{meddelande}
Hör gärna av dig om ett annat datum passar.

Vänliga hälsningar
Kristvalla Bygdegårdsförening`,
  },
}
