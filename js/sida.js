// Delar som går att fälla ut (<details>). Allt fungerar utan JavaScript; det här
// gör bara två saker bättre:
// - En länk till en del (till exempel #hitta) öppnar delen.
// - Vid utskrift öppnas alla delar, så att inget saknas på papperet.
(function () {
  function oppna() {
    var mal = location.hash && document.getElementById(location.hash.slice(1));
    if (mal && mal.tagName === "DETAILS") mal.open = true;
  }
  window.addEventListener("hashchange", oppna);
  document.addEventListener("DOMContentLoaded", oppna);

  var oppnadeForUtskrift = [];
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("details:not([open])").forEach(function (d) {
      d.open = true;
      oppnadeForUtskrift.push(d);
    });
  });
  window.addEventListener("afterprint", function () {
    oppnadeForUtskrift.forEach(function (d) { d.open = false; });
    oppnadeForUtskrift = [];
  });
})();
