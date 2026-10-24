/// <reference path="../pb_data/types.d.ts" />

// Fält för att godkänna eller avböja en förfrågan via en länk i e-post.
//
// nyckel:     slumpad nyckel i länken. Den som har länken kan besluta om just
//             den här förfrågan. Fältet är dolt och syns aldrig i API:t.
// meddelande: ett frivilligt meddelande till den som har frågat.
// besvarad:   när förfrågan godkändes eller avböjdes (ÅÅÅÅ-MM-DD TT:MM, svensk tid).
// paminnd:    när en påminnelse senast skickades till bokningsansvariga (UTC).

migrate((app) => {
  const c = app.findCollectionByNameOrId("forfragningar")
  c.fields.add(new TextField({ name: "nyckel", hidden: true, max: 100 }))
  c.fields.add(new TextField({ name: "meddelande", max: 1000 }))
  c.fields.add(new TextField({ name: "besvarad", max: 30 }))
  c.fields.add(new TextField({ name: "paminnd", max: 30 }))
  app.save(c)

  // Begränsa också hur ofta beslutssidan kan anropas.
  const settings = app.settings()
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules,
    { label: "/beslut/", maxRequests: 30, duration: 60, audience: "" },
  ]
  app.save(settings)
}, (app) => {
  const c = app.findCollectionByNameOrId("forfragningar")
  for (const namn of ["nyckel", "meddelande", "besvarad", "paminnd"]) {
    c.fields.removeByName(namn)
  }
  app.save(c)
})
