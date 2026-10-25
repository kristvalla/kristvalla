// Gemensamma hjälpfunktioner för bokningstjänsten. Används av bokning.pb.js.
//
// Inställningarna läses från miljövariabler. starta.sh hämtar dem från filen
// installningar.env, som inte checkas in. Se installningar.exempel.env.

const MANADER = ["januari", "februari", "mars", "april", "maj", "juni", "juli",
  "augusti", "september", "oktober", "november", "december"]
const VECKODAGAR = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"]

function inst() {
  const env = (namn, standard) => $os.getenv(namn) || standard
  return {
    adress: env("BOKNING_ADRESS", "http://127.0.0.1:8097").replace(/\/+$/, ""),
    lokal: "http://" + env("BOKNING_HTTP", "127.0.0.1:8097"),
    mottagare: env("BOKNING_MOTTAGARE", "").split(",").map((s) => s.trim()).filter((s) => s),
    svarsadress: env("BOKNING_SVARSADRESS", "kristvalla@proton.me"),
    amnesprefix: env("BOKNING_AMNESPREFIX", "[PROV] "),
    paminnDagar: parseInt(env("BOKNING_PAMINN_DAGAR", "3"), 10),
    kalenderfil: env("BOKNING_KALENDERFIL", `${$app.dataDir()}/forhandsvisning/hyr.html`),
  }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
}

// "2026-11-07" blir "lördag 7 november 2026".
function datumText(datum) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum || "")
  if (!m) return datum
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return `${VECKODAGAR[d.getUTCDay()]} ${+m[3]} ${MANADER[+m[2] - 1]} ${m[1]}`
}

// Svensk tid som ÅÅÅÅ-MM-DD TT:MM. Sommartid gäller från sista söndagen i mars
// till sista söndagen i oktober, kl. 01.00 UTC (EU:s regel).
function nu() {
  const t = new Date()
  const ar = t.getUTCFullYear()
  const sistaSondag = (manad) => {
    const d = new Date(Date.UTC(ar, manad + 1, 0, 1))
    return d.getTime() - d.getUTCDay() * 86400000
  }
  const sommar = t.getTime() >= sistaSondag(2) && t.getTime() < sistaSondag(9)
  const svensk = new Date(t.getTime() + (sommar ? 2 : 1) * 3600000)
  return svensk.toISOString().slice(0, 16).replace("T", " ")
}

function fyll(text, rec, meddelande) {
  const tillagg = meddelande ? `\n${meddelande}\n` : ""
  return text
    .replaceAll("{namn}", rec.getString("namn"))
    .replaceAll("{datum}", datumText(rec.getString("datum")))
    .replaceAll("{meddelande}", tillagg)
}

function lank(rec, val) {
  const bas = `${inst().adress}/beslut/${rec.id}?nyckel=${rec.getString("nyckel")}`
  return val ? `${bas}&val=${val}` : bas
}

// Hur det ser ut för samma dag: är den redan bokad, och vilka andra frågar om den?
function lage(rec) {
  const samma = $app.findRecordsByFilter("forfragningar",
    "datum = {:datum} && id != {:id}", "created", 50, 0,
    { datum: rec.getString("datum"), id: rec.id })
  return {
    bokad: samma.some((r) => r.getString("status") === "bekräftad"),
    andraNya: samma.filter((r) => r.getString("status") === "ny"),
  }
}

// Skickar ett mejl. Ett fel stoppar aldrig bokningen, det loggas bara.
function skicka({ till, amne, text, html, svarTill }) {
  if (!till.length) return false
  try {
    const s = $app.settings()
    $app.newMailClient().send(new MailerMessage({
      from: { address: s.meta.senderAddress, name: s.meta.senderName },
      to: till.map((address) => ({ address })),
      subject: inst().amnesprefix + amne,
      text: text,
      html: html || "",
      headers: svarTill ? { "Reply-To": svarTill } : {},
    }))
    return true
  } catch (err) {
    $app.logger().error("Kunde inte skicka mejl", "amne", amne, "fel", String(err))
    return false
  }
}

// Mejl till bokningsansvariga med allt som behövs för att bedöma förfrågan.
function mejlTillAnsvariga(rec, rubrik) {
  const mallar = require(`${__hooks}/mallar.js`)
  const l = lage(rec)
  const datum = datumText(rec.getString("datum"))
  const ledig = l.bokad ? "NEJ, dagen är redan bokad." : "Ja, dagen är ledig."
  const andra = l.andraNya.length ? `${l.andraNya.length} till har frågat om samma dag.` : ""
  const fakta = [
    ["Datum", datum],
    ["Ledig?", `${ledig} ${andra}`],
    ["Namn", rec.getString("namn")],
    ["E-post", rec.getString("epost")],
    ["Antal personer", rec.getString("antal")],
    ["Vad det gäller", rec.getString("syfte")],
  ]
  const text = `${rubrik}

${fakta.map(([k, v]) => `${k}: ${v}`).join("\n")}

Att tänka på:
${mallar.checklista.map((p) => `- ${p}`).join("\n")}

Godkänn: ${lank(rec, "godkann")}
Avböj: ${lank(rec, "avboj")}

Svarar du på det här mejlet går svaret till den som har frågat.`

  const knapp = (href, farg, etikett) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:0 12px 12px 0;padding:16px 28px;background:${farg};color:#fff;font-size:20px;font-weight:bold;text-decoration:none;border-radius:8px">${etikett}</a>`
  const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:18px;line-height:1.5;color:#24221f;max-width:36rem">
<p style="background:#fff3cd;padding:8px 12px;font-weight:bold">FÖRSLAG. Provversion med påhittade uppgifter.</p>
<h1 style="font-size:24px">${esc(rubrik)}</h1>
<table style="border-collapse:collapse;font-size:18px">
${fakta.map(([k, v]) => `<tr><th style="text-align:left;padding:4px 16px 4px 0;vertical-align:top">${esc(k)}</th><td style="padding:4px 0">${esc(v)}</td></tr>`).join("\n")}
</table>
<h2 style="font-size:20px">Att tänka på</h2>
<ul>${mallar.checklista.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
<p>${knapp(lank(rec, "godkann"), "#3f5a2c", "Godkänn")}${knapp(lank(rec, "avboj"), "#781f19", "Avböj")}</p>
<p style="font-size:16px;color:#5b564e">Knapparna öppnar en sida där du bekräftar ditt val. Svarar du på det här mejlet går svaret till den som har frågat.</p>
</div>`

  return skicka({
    till: inst().mottagare,
    amne: `${rubrik}: ${datum}`,
    text, html,
    svarTill: rec.getString("epost"),
  })
}

// Mejl till den som har frågat, enligt en mall i mallar.js.
function mejlTillHyresgast(rec, mallnamn) {
  const mall = require(`${__hooks}/mallar.js`)[mallnamn]
  return skicka({
    till: [rec.getString("epost")],
    amne: fyll(mall.amne, rec, ""),
    text: fyll(mall.text, rec, rec.getString("meddelande")),
    svarTill: inst().svarsadress,
  })
}

// Kör uppdatera_kalender.py. Under provet skrivs en kopia av hyr.html i
// datamappen (forhandsvisning/hyr.html), aldrig den riktiga sidan. Kopian visas av
// testversionen av hemsidan (hemsida_prov.py), och där leder knappen för
// bokningsförfrågan till formuläret i stället för till e-post.
function uppdateraKalender() {
  const fil = inst().kalenderfil
  try {
    try {
      $os.stat(fil)
    } catch (_) {
      const html = toString($os.readFile(`${__hooks}/../../hyr.html`))
        .replace(/href="mailto:[^"]*subject=Bokningsf[^"]*"/, `href="${inst().adress}/"`)
      $os.mkdirAll(fil.replace(/\/[^/]*$/, ""), 0o755)
      $os.writeFile(fil, html, 0o644)
    }
    $os.cmd("python3", `${__hooks}/../uppdatera_kalender.py`,
      "--tjanst", inst().lokal, "--fil", fil, "--boka-adress", inst().adress).output()
  } catch (err) {
    $app.logger().error("Kunde inte uppdatera kalendern", "fel", String(err))
  }
}

function sida(rubrik, innehall, inbaddad) {
  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${esc(rubrik)} – Kristvalla Bygdegårdsförening</title>
  <link rel="stylesheet" href="/stil.css">
</head>
<body${inbaddad ? ' class="inbaddad"' : ""}>
  <p class="forslag">FÖRSLAG. Provversion med påhittade uppgifter. Används inte på den riktiga sidan.</p>
  <main>
    <h1>${esc(rubrik)}</h1>
    ${innehall}
  </main>
</body>
</html>`
}

// Formuläret för bokningsförfrågan. datum (ÅÅÅÅ-MM-DD) fylls i om det finns,
// till exempel när man har klickat på en dag i kalendern på hemsidan.
function formular(datum, inbaddad) {
  const giltigt = /^\d{4}-\d{2}-\d{2}$/.test(datum || "") ? datum : ""
  let lageText = ""
  if (giltigt) {
    const bokad = $app.countRecords("forfragningar",
      $dbx.hashExp({ datum: giltigt, status: "bekräftad" })) > 0
    lageText = bokad
      ? `<p class="varning">${esc(datumText(giltigt))} är redan bokat. Välj gärna ett annat datum.</p>`
      : `<p class="notis">Du frågar om <strong>${esc(datumText(giltigt))}</strong>.</p>`
  }
  return sida("Skicka en bokningsförfrågan", `
    ${lageText}
    <p>Fyll i formuläret, så hör vi av oss via e-post. Dagen är inte bokad förrän du har fått
      en bekräftelse från föreningen. Hyran betalas i förskott via Swish.</p>

    <form method="post" action="/boka">
      ${inbaddad ? '<input type="hidden" name="inbaddad" value="1">' : ""}
      <label for="datum">Datum
        <span class="hjalp">Skriv som ÅÅÅÅ-MM-DD om du inte får upp en kalender.</span></label>
      <input id="datum" name="datum" type="date" required value="${esc(giltigt)}">

      <label for="namn">Namn</label>
      <input id="namn" name="namn" required maxlength="100" autocomplete="name">

      <label for="epost">E-post</label>
      <input id="epost" name="epost" type="email" required autocomplete="email">

      <label for="antal">Ungefär hur många blir ni?</label>
      <input id="antal" name="antal" type="number" inputmode="numeric" min="1" max="1000" required>

      <label for="syfte">Vad gäller det?
        <span class="hjalp">Till exempel födelsedagsfest, minnesstund eller föreningsmöte.</span></label>
      <textarea id="syfte" name="syfte" rows="3" maxlength="500" required></textarea>

      <!-- Fältet syns inte för besökare. Det fångar automatiska skräpprogram. -->
      <div class="dold" aria-hidden="true">
        <label for="webbplats">Lämna tomt</label>
        <input id="webbplats" name="webbplats" tabindex="-1" autocomplete="off">
      </div>

      <button type="submit">Skicka förfrågan</button>
    </form>

    <p class="notis">Vi använder dina uppgifter bara för att hantera bokningen. Bara föreningen
      ser dem. De sparas <span class="platshallare">[hur länge, enligt föreningens beslut]</span>
      och tas sedan bort. Kalendern på hemsidan visar bara att en dag är bokad, aldrig vem som
      har bokat.</p>`, inbaddad)
}

// Formuläret får visas inuti hemsidans kalender, men bara från hemsidans adress
// (BOKNING_HEMSIDA). Alla andra sidor får inte bäddas in någonstans.
function tillatInbaddning(e) {
  const hemsida = $os.getenv("BOKNING_HEMSIDA")
  if (!hemsida) return
  e.response.header().del("X-Frame-Options")
  e.response.header().set("Content-Security-Policy", `frame-ancestors 'self' ${hemsida}`)
}

module.exports = {
  inst, esc, datumText, nu, lank, lage, skicka,
  mejlTillAnsvariga, mejlTillHyresgast, uppdateraKalender, sida, formular, tillatInbaddning,
}
