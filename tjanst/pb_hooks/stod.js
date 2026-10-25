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
    hemsida: env("BOKNING_HEMSIDA", "").replace(/\/+$/, ""),
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
    .replaceAll("{tid}", tidText(tidAv(rec)).toLowerCase())
    .replaceAll("{datum}", datumText(rec.getString("datum")))
    .replaceAll("{meddelande}", tillagg)
}

// --- Tider: hel dag ("dag") eller pass ("fm", "em", "kv"), se mallar.js ---

// Tiden för en förfrågan. Äldre förfrågningar utan tid gällde hela dagen.
function tidAv(rec) {
  const tid = Array.from(rec.getStringSlice("tid") || [])
  return tid.length ? tid : ["dag"]
}

// Krockar två tider? Hel dag krockar med allt, pass bara med samma pass.
function krockar(a, b) {
  if (!a.length || !b.length) return false
  return a.includes("dag") || b.includes("dag") || a.some((k) => b.includes(k))
}

// Allt som redan är bekräftat ett visst datum, som en lista med koder.
function upptaget(datum, uteslutId) {
  const bekraftade = $app.findRecordsByFilter("forfragningar",
    "datum = {:datum} && status = 'bekräftad' && id != {:id}", "", 50, 0,
    { datum: datum, id: uteslutId || "" })
  const koder = []
  for (const r of bekraftade) for (const k of tidAv(r)) if (!koder.includes(k)) koder.push(k)
  return koder
}

// Är hela dagen upptagen, antingen av en heldag eller av alla pass?
function heltUpptaget(koder) {
  const mallar = require(`${__hooks}/mallar.js`)
  return koder.includes("dag") || mallar.pass.every((p) => koder.includes(p.kod))
}

// "Hel dag (kl. 09–01)" eller "Förmiddag (kl. 09–12), Kväll (kl. 17–20)".
function tidText(tid) {
  const mallar = require(`${__hooks}/mallar.js`)
  const alla = [mallar.helDag, ...mallar.pass]
  return alla.filter((p) => tid.includes(p.kod)).map((p) => `${p.namn} (kl. ${p.tid})`).join(", ")
}

function lank(rec, val) {
  const bas = `${inst().adress}/beslut/${rec.id}?nyckel=${rec.getString("nyckel")}`
  return val ? `${bas}&val=${val}` : bas
}

// Hur det ser ut för samma dag: är den redan bokad, och vilka andra frågar om den?
function lage(rec) {
  const tid = tidAv(rec)
  const samma = $app.findRecordsByFilter("forfragningar",
    "datum = {:datum} && id != {:id} && status = 'ny'", "created", 50, 0,
    { datum: rec.getString("datum"), id: rec.id })
  return {
    bokad: krockar(tid, upptaget(rec.getString("datum"), rec.id)),
    andraNya: samma.filter((r) => krockar(tid, tidAv(r))),
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
  const ledig = l.bokad ? "NEJ, tiden är redan bokad." : "Ja, tiden är ledig."
  const andra = l.andraNya.length ? `${l.andraNya.length} till har frågat om samma tid.` : ""
  const fakta = [
    ["Datum", datum],
    ["Tid", tidText(tidAv(rec))],
    ["Ledig?", `${ledig} ${andra}`],
    ["Namn", rec.getString("namn")],
    ["E-post", rec.getString("epost")],
    ["Antal personer", rec.getString("antal")],
    ["Vad det gäller", rec.getString("syfte")],
    ["Medlem", rec.getBool("medlem") ? "Ja, vill ha medlemspris. Kontrollera." : "Nej"],
    ["Hyresavtal", rec.getString("avtal") ? `Godkänt, version ${rec.getString("avtal")}` : "Inte godkänt"],
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
    text: fyll(mall.text, rec, rec.getString("meddelande")).replaceAll("{avtal}", avtalLank()),
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
    // Kopieras på nytt varje gång, så att ändringar i hyr.html kommer med.
    const html = toString($os.readFile(`${__hooks}/../../hyr.html`))
      .replace(/href="mailto:[^"]*subject=Bokningsf[^"]*"/, `href="${inst().adress}/"`)
    // Byggs i en tillfällig fil, så att hemsidan aldrig visar en halvfärdig sida.
    const ny = fil + ".ny"
    $os.mkdirAll(fil.replace(/\/[^/]*$/, ""), 0o755)
    $os.writeFile(ny, html, 0o644)
    $os.cmd("python3", `${__hooks}/../uppdatera_kalender.py`,
      "--tjanst", inst().lokal, "--fil", ny, "--boka-adress", inst().adress,
      "--pass", require(`${__hooks}/mallar.js`).pass.map((p) => p.kod).join(",")).output()
    $os.rename(ny, fil)
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
  const mallar = require(`${__hooks}/mallar.js`)
  const giltigt = /^\d{4}-\d{2}-\d{2}$/.test(datum || "") ? datum : ""
  const koder = giltigt ? upptaget(giltigt, "") : []
  let lageText = ""
  if (giltigt && heltUpptaget(koder)) {
    lageText = `<p class="varning">${esc(datumText(giltigt))} är redan bokat. Välj gärna ett annat datum.</p>`
  } else if (giltigt) {
    const bokadePass = mallar.pass.filter((p) => koder.includes(p.kod)).map((p) => p.namn.toLowerCase())
    lageText = `<p class="notis">Du frågar om <strong>${esc(datumText(giltigt))}</strong>.` +
      (bokadePass.length ? ` Redan bokat: ${esc(bokadePass.join(", "))}.` : "") + `</p>`
  }
  // Ett val i formuläret för tid. Det som redan är bokat går inte att välja.
  const passVal = mallar.pass.map((p) => {
    const tagen = koder.includes("dag") || koder.includes(p.kod)
    return `<div class="val"><input type="checkbox" id="pass-${p.kod}" name="pass_${p.kod}" value="ja"${tagen ? " disabled" : ""}>
          <label for="pass-${p.kod}">${esc(p.namn)}, kl. ${esc(p.tid)}${tagen ? " (bokat)" : ""}</label></div>`
  }).join("\n        ")
  const dagTagen = koder.length > 0
  return sida("Skicka en bokningsförfrågan", `
    ${lageText}
    <p>Fyll i formuläret, så hör vi av oss via e-post. Dagen är inte bokad förrän du har fått
      en bekräftelse från föreningen. Hyran betalas i förskott via Swish.</p>

    <form method="post" action="/boka">
      ${inbaddad ? '<input type="hidden" name="inbaddad" value="1">' : ""}
      <label for="datum">Datum
        <span class="hjalp">Skriv som ÅÅÅÅ-MM-DD om du inte får upp en kalender.</span></label>
      <input id="datum" name="datum" type="date" required value="${esc(giltigt)}">

      <fieldset class="tid">
        <legend>Tid</legend>
        <div class="val"><input type="radio" id="omfattning-dag" name="omfattning" value="dag"${dagTagen ? " disabled" : ""}>
          <label for="omfattning-dag">${esc(mallar.helDag.namn)}, kl. ${esc(mallar.helDag.tid)}${dagTagen ? " (går inte, delvis bokat)" : ""}</label></div>
        <div class="val"><input type="radio" id="omfattning-pass" name="omfattning" value="pass">
          <label for="omfattning-pass">Ett eller flera pass om tre timmar:</label></div>
        <div class="pass">
        ${passVal}
        </div>
      </fieldset>

      <label for="namn">Namn</label>
      <input id="namn" name="namn" required maxlength="100" autocomplete="name">

      <label for="epost">E-post</label>
      <input id="epost" name="epost" type="email" required autocomplete="email">

      <label for="antal">Ungefär hur många blir ni?</label>
      <input id="antal" name="antal" type="number" inputmode="numeric" min="1" max="1000" required>

      <label for="syfte">Vad gäller det?
        <span class="hjalp">Till exempel födelsedagsfest, minnesstund eller föreningsmöte.</span></label>
      <textarea id="syfte" name="syfte" rows="3" maxlength="500" required></textarea>

      <div class="kryss">
        <input id="medlem" name="medlem" type="checkbox" value="ja">
        <label for="medlem">Jag är medlem i Kristvalla Bygdegårdsförening och vill ha medlemspris.</label>
      </div>

      <div class="kryss">
        <input id="avtal" name="avtal" type="checkbox" value="ja" required>
        <label for="avtal">Jag har läst <a href="${esc(avtalLank())}" target="_blank" rel="noopener">hyresavtalet</a>
          och godkänner det.<span class="hjalp">Avtalet öppnas i en ny flik.</span></label>
      </div>

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

// Adressen till hyresavtalet på hemsidan.
function avtalLank() {
  const mallar = require(`${__hooks}/mallar.js`)
  return inst().hemsida + mallar.avtal.sokvag
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
  mejlTillAnsvariga, mejlTillHyresgast, uppdateraKalender, sida, formular, tillatInbaddning, avtalLank,
  tidAv, krockar, upptaget, heltUpptaget, tidText,
}
