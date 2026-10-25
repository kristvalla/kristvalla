/// <reference path="../pb_data/types.d.ts" />

// Skapar tabellerna för bokningstjänsten (förslag).
//
// forfragningar: bokningsförfrågningar med namn och e-post. Bara föreningen
//   (administratörer) kan läsa och ändra dem. Alla regler är låsta (null).
//   Besökare skickar förfrågningar via /boka i pb_hooks/bokning.pb.js.
// bokade_datum: en vy med bara datumen för bekräftade bokningar. Den är
//   öppen för alla, men innehåller inga namn eller kontaktuppgifter.

migrate((app) => {
  const forfragningar = new Collection({
    type: "base",
    name: "forfragningar",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { type: "text", name: "namn", required: true, max: 100 },
      { type: "email", name: "epost", required: true },
      // Datumet sparas som text (ÅÅÅÅ-MM-DD) så att det inte flyttas av tidszoner.
      { type: "text", name: "datum", required: true, min: 10, max: 10, pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      { type: "number", name: "antal", required: true, onlyInt: true, min: 1, max: 1000 },
      { type: "text", name: "syfte", required: true, max: 500 },
      { type: "select", name: "status", required: true, maxSelect: 1, values: ["ny", "bekräftad", "avböjd"] },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_forfragningar_datum ON forfragningar (datum)"],
  })
  app.save(forfragningar)

  const bokadeDatum = new Collection({
    type: "view",
    name: "bokade_datum",
    listRule: "",
    viewRule: "",
    viewQuery: "SELECT MIN(id) AS id, datum FROM forfragningar WHERE status = 'bekräftad' GROUP BY datum",
  })
  app.save(bokadeDatum)

  // Märk administrationssidan som förslag och begränsa hur ofta någon kan skicka förfrågningar.
  const settings = app.settings()
  settings.meta.appName = "Kristvalla bokning – FÖRSLAG"
  settings.rateLimits.enabled = true
  settings.rateLimits.rules = [
    ...settings.rateLimits.rules,
    { label: "/boka", maxRequests: 5, duration: 60, audience: "" },
  ]
  app.save(settings)
}, (app) => {
  app.delete(app.findCollectionByNameOrId("bokade_datum"))
  app.delete(app.findCollectionByNameOrId("forfragningar"))
})
