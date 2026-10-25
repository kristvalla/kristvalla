/// <reference path="../pb_data/types.d.ts" />

// avtal: vilken version av hyresavtalet (hyresavtal.html) som den som frågade
// godkände. Tomt för förfrågningar som har lagts in på annat sätt.

migrate((app) => {
  const c = app.findCollectionByNameOrId("forfragningar")
  c.fields.add(new TextField({ name: "avtal", max: 30 }))
  app.save(c)
}, (app) => {
  const c = app.findCollectionByNameOrId("forfragningar")
  c.fields.removeByName("avtal")
  app.save(c)
})
