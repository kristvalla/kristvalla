// Bokningen från Asamla på sidan Hyr bygdegården.
//
// Utan JavaScript är bokningen en vanlig länk som öppnar Asamlas egen sida.
// Med JavaScript får besökaren också en knapp som visar bokningen här på sidan.
// Bokningen hämtas från Asamla först när besökaren trycker på knappen. Då får
// Asamla inte veta att någon har öppnat vår sida bara för att den laddas, se
// docs/beslut/bokning-via-asamla.md.
(function () {
  var ASAMLA = "https://www.asamla.se";

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".boka-embed").forEach(function (rad) {
      var adress = rad.getAttribute("data-embed");
      // Bara adresser till Asamlas inbäddning accepteras.
      if (!adress || adress.indexOf(ASAMLA + "/embed/") !== 0) return;

      var lank = rad.querySelector("a.knapp");
      if (lank) lank.classList.add("ljus");

      var knapp = document.createElement("button");
      knapp.type = "button";
      knapp.className = "knapp";
      knapp.textContent = "Visa bokningen här på sidan";

      var notis = document.createElement("p");
      notis.className = "boka-notis";
      notis.textContent = "När du trycker hämtas bokningen från Asamla. Asamla kan då se din " +
        "IP-adress. Vill du inte det, öppna Asamlas sida med den andra knappen.";

      rad.insertBefore(notis, rad.firstChild);
      rad.insertBefore(knapp, rad.firstChild);

      knapp.addEventListener("click", function () {
        var ram = document.createElement("iframe");
        ram.className = "boka-ram";
        ram.title = rad.getAttribute("data-titel") || "Bokning";
        ram.src = adress;
        rad.insertBefore(ram, rad.firstChild);
        knapp.remove();
        notis.remove();
        ram.focus();
      });
    });
  });

  // Asamlas ruta talar om hur hög den behöver vara. Svaret godtas bara från
  // Asamla och bara från rutan som skickade det.
  window.addEventListener("message", function (handelse) {
    if (handelse.origin !== ASAMLA) return;
    var data = handelse.data;
    if (!data || data.type !== "asamla:embed:height") return;
    var hojd = Number(data.height);
    if (!isFinite(hojd) || hojd <= 0 || hojd > 20000) return;
    document.querySelectorAll("iframe.boka-ram").forEach(function (ram) {
      if (ram.contentWindow === handelse.source) ram.style.height = Math.ceil(hojd) + "px";
    });
  });
})();
