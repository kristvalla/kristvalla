/// <reference path="../pb_data/types.d.ts" />

// Tar emot bokningsförfrågningar från formuläret i pb_public/index.html.
// Formuläret skickas som ett vanligt formulär, så det fungerar utan JavaScript.
// Varje förfrågan sparas med status "ny". Bokningsansvarig ändrar status på
// administrationssidan.
routerAdd("POST", "/boka", (e) => {
  const { sida } = require(`${__hooks}/sidor.js`)
  const fel = (text) => e.html(400, sida("Förfrågan skickades inte", text))

  // Dolt fält som bara automatiska skräpprogram fyller i.
  if (e.request.formValue("webbplats") !== "") {
    return e.html(200, sida("Tack!", "Vi har tagit emot din förfrågan."))
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
  const idag = new Date().toISOString().slice(0, 10)
  if (datum < idag) {
    return fel("Datumet har redan passerat.")
  }

  const upptagen = $app.countRecords(
    "forfragningar",
    $dbx.hashExp({ datum: datum, status: "bekräftad" }),
  )
  if (upptagen > 0) {
    return fel(`${datum} är redan bokat. Välj gärna ett annat datum.`)
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

  return e.html(200, sida(
    "Tack!",
    `Vi har tagit emot din förfrågan för ${datum}. Vi svarar via e-post. Dagen är inte bokad förrän du har fått en bekräftelse.`,
  ))
})

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
