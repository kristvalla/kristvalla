// Enkla svarssidor för formuläret. Används av bokning.pb.js.
// Sidorna fungerar utan JavaScript.

module.exports = {
  sida: (rubrik, text) => `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${rubrik} – Kristvalla Bygdegårdsförening</title>
  <link rel="stylesheet" href="/stil.css">
</head>
<body>
  <p class="forslag">FÖRSLAG. Provversion med påhittade uppgifter. Används inte på den riktiga sidan.</p>
  <main>
    <h1>${rubrik}</h1>
    <p>${text}</p>
    <p><a href="/">Tillbaka till formuläret</a></p>
  </main>
</body>
</html>`,
}
