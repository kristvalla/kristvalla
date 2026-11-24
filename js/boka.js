// Bokningen från Asamla på sidan Hyr bygdegården.
//
// Besökaren väljer ett hyresalternativ och ser bara den bokningen, i en gemensam yta.
// Bokningen från Asamla visas inbäddad. Asamla är föreningens system och kan se besökarens
// IP-adress, vilket sidan säger. Utan JavaScript syns alternativen som text och besökaren
// hänvisas till e-post. Se docs/beslut/bokning-via-asamla.md.
(function () {
  var ASAMLA = "https://www.asamla.se";

  document.addEventListener("DOMContentLoaded", function () {
    var yta = document.getElementById("boka-yta");
    var poster = document.querySelectorAll(".val-lista li[data-embed]");
    if (!yta || !poster.length) return;

    var knappar = [];

    function visa(knapp) {
      var adress = knapp.getAttribute("data-embed");
      // Bara adresser till Asamlas inbäddning accepteras.
      if (!adress || adress.indexOf(ASAMLA + "/embed/") !== 0) return;
      knappar.forEach(function (k) {
        k.setAttribute("aria-pressed", k === knapp ? "true" : "false");
      });
      var gammal = yta.querySelector("iframe");
      if (gammal) gammal.remove();
      var ram = document.createElement("iframe");
      ram.className = "boka-ram";
      ram.title = knapp.getAttribute("data-titel") || "Bokning";
      // Asamla ber om att rutan får använda betalning (Payment Request), för förskottsbetalningen.
      ram.setAttribute("allow", "payment");
      ram.src = adress;
      yta.insertBefore(ram, yta.firstChild);
    }

    poster.forEach(function (post) {
      var knapp = document.createElement("button");
      knapp.type = "button";
      knapp.className = "val";
      knapp.setAttribute("aria-pressed", "false");
      knapp.setAttribute("data-embed", post.getAttribute("data-embed"));
      knapp.setAttribute("data-titel", post.getAttribute("data-titel") || "");
      while (post.firstChild) knapp.appendChild(post.firstChild);
      post.appendChild(knapp);
      post.removeAttribute("data-embed");
      post.removeAttribute("data-titel");
      knapp.addEventListener("click", function () { visa(knapp); });
      knappar.push(knapp);
    });
    // Den första bokningen visas från början, så att ytan inte är tom.
    visa(knappar[0]);
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
