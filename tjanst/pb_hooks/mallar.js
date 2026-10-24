// Texterna i mejlen. Föreningen ändrar dem här.
//
// FÖRSLAG: texterna inom [hakparenteser] ska bytas ut när föreningen har
// beslutat om pris, betalning och nycklar. Gissa inte, lämna platshållaren.
//
// {namn}, {datum} och {meddelande} byts ut automatiskt.

module.exports = {
  // Visas för bokningsansvarig när förfrågan ska bedömas.
  checklista: [
    "Är dagen ledig? (Står ovan.)",
    "Ryms sällskapet? Lokalen tar högst [antal personer enligt brandskyddet] personer.",
    "Passar det som förfrågan gäller i bygdegården?",
    "[Fler punkter enligt föreningens regler för uthyrning]",
  ],

  // Till den som har frågat, direkt när förfrågan har kommit in.
  kvitto: {
    amne: "Vi har tagit emot din förfrågan för {datum}",
    text: `Hej {namn}!

Tack för din förfrågan om att hyra Kristvalla bygdegård {datum}.

Dagen är inte bokad förrän du har fått en bekräftelse från oss. Vi hör av oss via e-post.

Vänliga hälsningar
Kristvalla Bygdegårdsförening`,
  },

  // Till den som har frågat, när förfrågan är godkänd.
  godkand: {
    amne: "Din bokning {datum} är bekräftad",
    text: `Hej {namn}!

Vi bekräftar din bokning av Kristvalla bygdegård {datum}.

Pris: [enligt föreningens prislista]
Betalning: [hur och när man betalar]
Nyckel: [hur man får nyckeln och lämnar tillbaka den]
{meddelande}
Välkommen!

Kristvalla Bygdegårdsförening`,
  },

  // Till den som har frågat, när förfrågan är avböjd.
  avbojd: {
    amne: "Om din förfrågan för {datum}",
    text: `Hej {namn}!

Tack för din förfrågan. Tyvärr kan vi inte hyra ut bygdegården {datum}.
{meddelande}
Hör gärna av dig om ett annat datum passar.

Vänliga hälsningar
Kristvalla Bygdegårdsförening`,
  },
}
