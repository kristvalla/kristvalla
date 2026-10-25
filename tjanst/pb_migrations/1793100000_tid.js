/// <reference path="../pb_data/types.d.ts" />

// tid:    hel dag ("dag") eller ett eller flera pass om tre timmar ("fm", "em", "kv").
//         Passens namn och klockslag står i pb_hooks/mallar.js.
// medlem: den som frågade säger sig vara medlem och vill ha medlemspris.
//
// Förfrågningar från före den här ändringen gällde hela dagen.
// bokade_datum visar nu också vilken tid som är bokad, fortfarande utan namn.

migrate((app) => {
  const c = app.findCollectionByNameOrId("forfragningar")
  c.fields.add(new SelectField({ name: "tid", maxSelect: 4, values: ["dag", "fm", "em", "kv"] }))
  c.fields.add(new BoolField({ name: "medlem" }))
  app.save(c)
  app.db().newQuery(`UPDATE forfragningar SET tid = '["dag"]' WHERE tid IS NULL OR tid = '' OR tid = '[]'`).execute()

  const v = app.findCollectionByNameOrId("bokade_datum")
  v.viewQuery = "SELECT id, datum, tid FROM forfragningar WHERE status = 'bekräftad'"
  app.save(v)
}, (app) => {
  const v = app.findCollectionByNameOrId("bokade_datum")
  v.viewQuery = "SELECT MIN(id) AS id, datum FROM forfragningar WHERE status = 'bekräftad' GROUP BY datum"
  app.save(v)
  const c = app.findCollectionByNameOrId("forfragningar")
  c.fields.removeByName("tid")
  c.fields.removeByName("medlem")
  app.save(c)
})
