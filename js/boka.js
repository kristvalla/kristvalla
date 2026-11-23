// Bokningen från Asamla på sidan Hyr bygdegården.
//
// Bokningen från Asamla visas inbäddad på sidan. Asamla är föreningens system och kan se
// besökarens IP-adress, vilket sidan säger. Utan JavaScript hänvisas besökaren till e-post.
// Se docs/beslut/bokning-via-asamla.md.
(function () {
  var ASAMLA = "https://www.asamla.se";

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".boka-embed").forEach(function (rad) {
      var adress = rad.getAttribute("data-embed");
      // Bara adresser till Asamlas inbäddning accepteras.
      if (!adress || adress.indexOf(ASAMLA + "/embed/") !== 0) return;

      var ram = document.createElement("iframe");
      ram.className = "boka-ram";
      ram.title = rad.getAttribute("data-titel") || "Bokning";
      ram.src = adress;
      rad.insertBefore(ram, rad.firstChild);
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
