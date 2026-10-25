/// <reference path="../pb_data/types.d.ts" />

// Bokningstjänsten (förslag).
//
// 1. Besökaren skickar formuläret i pb_public/index.html till /boka.
// 2. Bokningsansvariga får ett mejl med förfrågan och knapparna Godkänn och Avböj.
// 3. Knapparna öppnar /beslut/<id>, där valet bekräftas. Den som har frågat får
//    ett svar enligt mallarna i mallar.js, och kalendern uppdateras.
//
// Allt fungerar utan JavaScript i webbläsaren. Hjälpfunktionerna finns i stod.js.
// Varje hanterare läser in stod.js själv, eftersom PocketBase kör dem var för sig.

// E-postinställningar från installningar.env, så att lösenord aldrig hamnar i repot.
onBootstrap((e) => {
  e.next()
  const env = (namn) => $os.getenv(namn)
  const s = e.app.settings()
  if (env("BOKNING_AVSANDARE")) {
    s.meta.senderAddress = env("BOKNING_AVSANDARE")
    s.meta.senderName = env("BOKNING_AVSANDARNAMN") || "Kristvalla Bygdegårdsförening"
  }
  if (env("SMTP_HOST")) {
    s.smtp.enabled = true
    s.smtp.host = env("SMTP_HOST")
    s.smtp.port = parseInt(env("SMTP_PORT") || "587", 10)
    s.smtp.username = env("SMTP_ANVANDARE")
    s.smtp.password = env("SMTP_LOSENORD")
    s.smtp.tls = env("SMTP_TLS") === "true"
  }
  e.app.save(s)
})

// Varje förfrågan får en slumpad nyckel till länkarna i mejlen.
onRecordCreate((e) => {
  if (!e.record.getString("nyckel")) {
    e.record.set("nyckel", $security.randomString(40))
  }
  e.next()
}, "forfragningar")

// Samma dag kan bara vara bekräftad för en förfrågan.
onRecordValidate((e) => {
  if (e.record.getString("status") === "bekräftad") {
    const andra = $app.countRecords(
      "forfragningar",
      $dbx.hashExp({ datum: e.record.getString("datum"), status: "bekräftad" }),
      $dbx.not($dbx.hashExp({ id: e.record.id })),
    )
    if (andra > 0) {
      throw new BadRequestError("Datumet är redan bekräftat för en annan förfrågan.")
    }
  }
  e.next()
}, "forfragningar")

// Kalendern uppdateras när status ändras, både via mejlen och administrationssidan.
onRecordAfterUpdateSuccess((e) => {
  e.next()
  if (e.record.getString("status") !== e.record.original().getString("status")) {
    require(`${__hooks}/stod.js`).uppdateraKalender()
  }
}, "forfragningar")

onRecordAfterDeleteSuccess((e) => {
  e.next()
  if (e.record.getString("status") === "bekräftad") {
    require(`${__hooks}/stod.js`).uppdateraKalender()
  }
}, "forfragningar")

routerAdd("POST", "/boka", (e) => {
  const stod = require(`${__hooks}/stod.js`)
  const fel = (text) => e.html(400, stod.sida("Förfrågan skickades inte",
    `<p>${stod.esc(text)}</p><p><a href="/">Tillbaka till formuläret</a></p>`))
  const tack = (text) => e.html(200, stod.sida("Tack!",
    `<p>${stod.esc(text)}</p><p><a href="/">Tillbaka till formuläret</a></p>`))

  // Dolt fält som bara automatiska skräpprogram fyller i.
  if (e.request.formValue("webbplats") !== "") {
    return tack("Vi har tagit emot din förfrågan.")
  }

  const namn = e.request.formValue("namn").trim()
  const epost = e.request.formValue("epost").trim()
  const datum = e.request.formValue("datum").trim()
  const antal = parseInt(e.request.formValue("antal"), 10)
  const syfte = e.request.formValue("syfte").trim()

  if (!namn || !epost || !datum || !syfte || !(antal > 0)) {
    return fel("Fyll i alla fält.")
  }

  // Kontrollera att datumet finns och inte har passerat.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum)
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null
  if (!d || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
    return fel("Datumet ska skrivas som ÅÅÅÅ-MM-DD, till exempel 2026-11-07.")
  }
  if (datum < new Date().toISOString().slice(0, 10)) {
    return fel("Datumet har redan passerat.")
  }

  const upptagen = $app.countRecords("forfragningar",
    $dbx.hashExp({ datum: datum, status: "bekräftad" }))
  if (upptagen > 0) {
    return fel(`${stod.datumText(datum)} är redan bokat. Välj gärna ett annat datum.`)
  }

  const record = new Record($app.findCollectionByNameOrId("forfragningar"))
  record.set("namn", namn)
  record.set("epost", epost)
  record.set("datum", datum)
  record.set("antal", antal)
  record.set("syfte", syfte)
  record.set("status", "ny")

  try {
    $app.save(record)
  } catch (err) {
    return fel("Något av fälten är inte rätt ifyllt. Kontrollera e-postadressen och att texterna inte är för långa.")
  }

  stod.mejlTillAnsvariga(record, "Ny bokningsförfrågan")
  stod.mejlTillHyresgast(record, "kvitto")

  return tack(`Vi har tagit emot din förfrågan för ${stod.datumText(datum)}. Vi svarar via e-post. Dagen är inte bokad förrän du har fått en bekräftelse.`)
})

// Sidan som knapparna i mejlet öppnar. Den visar bara förfrågan och ändrar
// ingenting, så det gör inget om ett e-postprogram öppnar länken i förväg.
routerAdd("GET", "/beslut/{id}", (e) => {
  const stod = require(`${__hooks}/stod.js`)
  const ingen = () => e.html(404, stod.sida("Länken fungerar inte",
    "<p>Länken är felaktig. Kopiera hela länken från mejlet, eller fråga den som sköter tjänsten.</p>"))

  let rec
  try {
    rec = $app.findRecordById("forfragningar", e.request.pathValue("id"))
  } catch (_) {
    return ingen()
  }
  const nyckel = e.request.url.query().get("nyckel")
  if (!nyckel || !$security.equal(nyckel, rec.getString("nyckel"))) {
    return ingen()
  }

  const datum = stod.datumText(rec.getString("datum"))
  const l = stod.lage(rec)
  const fakta = `<dl class="fakta">
      <dt>Datum</dt><dd>${stod.esc(datum)}</dd>
      <dt>Namn</dt><dd>${stod.esc(rec.getString("namn"))}</dd>
      <dt>E-post</dt><dd>${stod.esc(rec.getString("epost"))}</dd>
      <dt>Antal personer</dt><dd>${stod.esc(rec.getString("antal"))}</dd>
      <dt>Vad det gäller</dt><dd>${stod.esc(rec.getString("syfte"))}</dd>
    </dl>`

  const status = rec.getString("status")
  if (status !== "ny") {
    const ord = status === "bekräftad" ? "godkänd" : "avböjd"
    return e.html(200, stod.sida(`Förfrågan är redan ${ord}`, `
    <p class="notis">Den här förfrågan ${ord === "godkänd" ? "godkändes" : "avböjdes"}
      ${stod.esc(rec.getString("besvarad"))}. Svaret har skickats till ${stod.esc(rec.getString("namn"))}.</p>
    ${fakta}
    <p>Har det blivit fel? Kontakta den som sköter tjänsten.</p>`))
  }

  const mallar = require(`${__hooks}/mallar.js`)
  const lageText = l.bokad
    ? `<p class="varning">${stod.esc(datum)} är redan bokat. Förfrågan kan inte godkännas.</p>`
    : `<p class="notis">Dagen är ledig.${l.andraNya.length ? ` ${l.andraNya.length} till har frågat om samma dag.` : ""}</p>`

  const val = e.request.url.query().get("val")
  const formular = (v) => {
    const godkann = v === "godkann"
    return `<form method="post" action="/beslut/${stod.esc(rec.id)}" class="beslut">
      <input type="hidden" name="nyckel" value="${stod.esc(nyckel)}">
      <input type="hidden" name="val" value="${v}">
      <label for="meddelande-${v}">Meddelande till ${stod.esc(rec.getString("namn"))} (frivilligt)
        <span class="hjalp">${godkann ? "Kommer med i bekräftelsen, under pris och nyckel." : "Till exempel varför, eller ett annat datum som passar."}</span></label>
      <textarea id="meddelande-${v}" name="meddelande" rows="3" maxlength="1000"></textarea>
      <button type="submit" class="${godkann ? "ja" : "nej"}">${godkann ? "Godkänn bokningen" : "Avböj förfrågan"}</button>
    </form>`
  }

  let knappar
  if (val === "godkann" && !l.bokad) {
    knappar = `${formular("godkann")}<p><a href="${stod.esc(stod.lank(rec, "avboj"))}">Jag vill i stället avböja</a></p>`
  } else if (val === "avboj" || l.bokad) {
    knappar = `${formular("avboj")}${l.bokad ? "" : `<p><a href="${stod.esc(stod.lank(rec, "godkann"))}">Jag vill i stället godkänna</a></p>`}`
  } else {
    knappar = `${formular("godkann")}${formular("avboj")}`
  }

  return e.html(200, stod.sida("Bokningsförfrågan", `
    ${lageText}
    ${fakta}
    <h2>Att tänka på</h2>
    <ul>${mallar.checklista.map((p) => `<li>${stod.esc(p)}</li>`).join("")}</ul>
    ${knappar}`))
})

// Här verkställs beslutet.
routerAdd("POST", "/beslut/{id}", (e) => {
  const stod = require(`${__hooks}/stod.js`)
  const svar = (kod, rubrik, text) => e.html(kod, stod.sida(rubrik, `<p>${text}</p>`))

  let rec
  try {
    rec = $app.findRecordById("forfragningar", e.request.pathValue("id"))
  } catch (_) {
    return svar(404, "Länken fungerar inte", "Förfrågan finns inte.")
  }
  const nyckel = e.request.formValue("nyckel")
  if (!nyckel || !$security.equal(nyckel, rec.getString("nyckel"))) {
    return svar(404, "Länken fungerar inte", "Kopiera hela länken från mejlet och försök igen.")
  }
  if (rec.getString("status") !== "ny") {
    return svar(409, "Redan besvarad", "Någon annan har redan svarat på den här förfrågan. Ingenting ändrades.")
  }

  const val = e.request.formValue("val")
  if (val !== "godkann" && val !== "avboj") {
    return svar(400, "Något gick fel", "Välj Godkänn eller Avböj.")
  }

  const datum = stod.datumText(rec.getString("datum"))
  const namn = stod.esc(rec.getString("namn"))
  rec.set("status", val === "godkann" ? "bekräftad" : "avböjd")
  rec.set("meddelande", e.request.formValue("meddelande").trim())
  rec.set("besvarad", stod.nu())
  try {
    $app.save(rec)
  } catch (err) {
    return svar(409, "Kunde inte godkännas", `${stod.esc(datum)} är redan bokat för någon annan. Avböj förfrågan i stället.`)
  }

  const skickat = stod.mejlTillHyresgast(rec, val === "godkann" ? "godkand" : "avbojd")
  stod.skicka({
    till: stod.inst().mottagare,
    amne: `${val === "godkann" ? "Godkänd" : "Avböjd"}: ${datum}`,
    text: `Förfrågan från ${rec.getString("namn")} för ${datum} är ${val === "godkann" ? "godkänd" : "avböjd"}. Ingen mer behöver svara på den.`,
  })

  let text = val === "godkann"
    ? `Bokningen ${stod.esc(datum)} är godkänd, och dagen visas som bokad i kalendern.`
    : `Förfrågan ${stod.esc(datum)} är avböjd.`
  text += skickat
    ? ` ${namn} har fått ett mejl om det.`
    : ` <strong>Mejlet till ${namn} kunde inte skickas.</strong> Hör av dig till ${stod.esc(rec.getString("epost"))} själv.`

  const l = stod.lage(rec)
  if (val === "godkann" && l.andraNya.length) {
    text += `</p><p class="varning">${l.andraNya.length} till har frågat om samma dag. De behöver avböjas:</p><ul>` +
      l.andraNya.map((r) => `<li><a href="${stod.esc(stod.lank(r, "avboj"))}">${stod.esc(r.getString("namn"))}</a></li>`).join("") +
      "</ul><p>"
  }
  return svar(200, "Klart", text)
})

// Förhandsvisning av kalendern under provet: pb_data/forhandsvisning/hyr.html,
// med hemsidans stil och bilder. Den riktiga hyr.html ändras inte.
routerAdd("GET", "/forhandsvisning/css/{path...}", $apis.static(`${__hooks}/../../css`, false))
routerAdd("GET", "/forhandsvisning/bilder/{path...}", $apis.static(`${__hooks}/../../bilder`, false))
routerAdd("GET", "/forhandsvisning/{path...}", $apis.static(`${__hooks}/../pb_data/forhandsvisning`, false))

// Påminnelse till bokningsansvariga om förfrågningar som ingen har svarat på.
cronAdd("bokning_paminnelse", $os.getenv("BOKNING_PAMINN_SCHEMA") || "0 8 * * *", () => {
  const stod = require(`${__hooks}/stod.js`)
  const dagar = stod.inst().paminnDagar
  const grans = new Date(Date.now() - dagar * 86400000).toISOString().slice(0, 16).replace("T", " ")
  const obesvarade = $app.findRecordsByFilter("forfragningar",
    "status = 'ny' && created <= {:grans} && (paminnd = '' || paminnd <= {:grans})",
    "datum", 100, 0, { grans: grans })
  for (const rec of obesvarade) {
    if (stod.mejlTillAnsvariga(rec, "Påminnelse: ingen har svarat på förfrågan")) {
      // UTC, som created, så att jämförelsen ovan stämmer.
      rec.set("paminnd", new Date().toISOString().slice(0, 16).replace("T", " "))
      $app.save(rec)
    }
  }
})
