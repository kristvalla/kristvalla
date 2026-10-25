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
  // Bakom en tunnel (Pangolin) kommer alla anrop från tunneln. Besökarens egen
  // adress står då i ett huvud, och den behövs för gränsen för antal förfrågningar.
  // Lita bara på huvudet när tjänsten lyssnar på 127.0.0.1, så att ingen kan
  // skicka ett falskt huvud direkt till tjänsten.
  s.trustedProxy.headers = env("BOKNING_PROXYHUVUD") ? [env("BOKNING_PROXYHUVUD")] : []
  s.trustedProxy.useLeftmostIP = false
  e.app.save(s)
})

// Varje förfrågan får en slumpad nyckel till länkarna i mejlen.
onRecordCreate((e) => {
  if (!e.record.getString("nyckel")) {
    e.record.set("nyckel", $security.randomString(40))
  }
  e.next()
}, "forfragningar")

// Samma tid kan bara vara bekräftad för en förfrågan. Hel dag krockar med alla pass.
onRecordValidate((e) => {
  if (e.record.getString("status") === "bekräftad") {
    const stod = require(`${__hooks}/stod.js`)
    const upptaget = stod.upptaget(e.record.getString("datum"), e.record.id)
    if (stod.krockar(stod.tidAv(e.record), upptaget)) {
      throw new BadRequestError("Tiden är redan bekräftad för en annan förfrågan samma dag.")
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

// En bokning som läggs in som bekräftad direkt på administrationssidan.
onRecordAfterCreateSuccess((e) => {
  e.next()
  if (e.record.getString("status") === "bekräftad") {
    require(`${__hooks}/stod.js`).uppdateraKalender()
  }
}, "forfragningar")

onRecordAfterDeleteSuccess((e) => {
  e.next()
  if (e.record.getString("status") === "bekräftad") {
    require(`${__hooks}/stod.js`).uppdateraKalender()
  }
}, "forfragningar")

// Formuläret. ?datum=ÅÅÅÅ-MM-DD fyller i datumet, ?inbaddad=1 när det visas i
// en ruta ovanpå kalendern på hemsidan.
routerAdd("GET", "/{$}", (e) => {
  const stod = require(`${__hooks}/stod.js`)
  const q = e.request.url.query()
  stod.tillatInbaddning(e)
  return e.html(200, stod.formular(q.get("datum"), q.get("inbaddad") === "1"))
})

routerAdd("POST", "/boka", (e) => {
  const stod = require(`${__hooks}/stod.js`)
  const inbaddad = e.request.formValue("inbaddad") === "1"
  stod.tillatInbaddning(e)
  const tillbaka = `<p><a href="/${inbaddad ? "?inbaddad=1" : ""}">Tillbaka till formuläret</a></p>`
  const fel = (text) => e.html(400, stod.sida("Förfrågan skickades inte",
    `<p>${stod.esc(text)}</p>${tillbaka}`, inbaddad))
  const tack = (text) => e.html(200, stod.sida("Tack!",
    `<p>${stod.esc(text)}</p>${tillbaka}`, inbaddad))

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
  if (e.request.formValue("avtal") !== "ja") {
    return fel("Du behöver läsa hyresavtalet och kryssa i att du godkänner det.")
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

  // Tid: hel dag eller ett eller flera pass.
  const mallar = require(`${__hooks}/mallar.js`)
  const valdaPass = mallar.pass.map((p) => p.kod).filter((k) => e.request.formValue(`pass_${k}`) === "ja")
  const omfattning = e.request.formValue("omfattning")
  const tid = omfattning === "dag" ? ["dag"] : valdaPass
  if (!tid.length) {
    return fel("Välj hel dag eller minst ett pass.")
  }
  if (stod.krockar(tid, stod.upptaget(datum, ""))) {
    return fel(`${stod.datumText(datum)}, ${stod.tidText(tid).toLowerCase()} är redan bokat. Välj gärna en annan tid.`)
  }

  const record = new Record($app.findCollectionByNameOrId("forfragningar"))
  record.set("namn", namn)
  record.set("epost", epost)
  record.set("datum", datum)
  record.set("antal", antal)
  record.set("syfte", syfte)
  record.set("status", "ny")
  record.set("tid", tid)
  record.set("medlem", e.request.formValue("medlem") === "ja")
  record.set("avtal", require(`${__hooks}/mallar.js`).avtal.version)

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
      <dt>Tid</dt><dd>${stod.esc(stod.tidText(stod.tidAv(rec)))}</dd>
      <dt>Medlem</dt><dd>${rec.getBool("medlem") ? "Ja, vill ha medlemspris. Kontrollera." : "Nej"}</dd>
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
    ? `<p class="varning">Tiden är redan bokad. Förfrågan kan inte godkännas.</p>`
    : `<p class="notis">Tiden är ledig.${l.andraNya.length ? ` ${l.andraNya.length} till har frågat om samma tid.` : ""}</p>`

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
    return svar(409, "Kunde inte godkännas", `Tiden ${stod.esc(datum)} är redan bokad för någon annan. Avböj förfrågan i stället.`)
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
    text += `</p><p class="varning">${l.andraNya.length} till har frågat om samma tid. De behöver avböjas:</p><ul>` +
      l.andraNya.map((r) => `<li><a href="${stod.esc(stod.lank(r, "avboj"))}">${stod.esc(r.getString("namn"))}</a></li>`).join("") +
      "</ul><p>"
  }
  return svar(200, "Klart", text)
})

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

// Kalendern uppdateras också varje timme, så att den följer med när en ny månad börjar.
cronAdd("bokning_kalender", "0 * * * *", () => {
  require(`${__hooks}/stod.js`).uppdateraKalender()
})
