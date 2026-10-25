// Visar en uppmaning ovanför kalendern när de lediga dagarna går att klicka på.
document.addEventListener("DOMContentLoaded", function () {
  var manader = document.querySelector(".manader");
  if (!manader || !manader.querySelector("a.boka-dag")) return;
  var tips = document.createElement("p");
  tips.className = "boka-tips";
  tips.textContent = "Tryck på en ledig dag för att skicka en bokningsförfrågan.";
  manader.parentNode.insertBefore(tips, manader);
});

// Öppnar bokningsformuläret i en ruta ovanpå kalendern när man klickar på en
// ledig dag. Utan JavaScript, eller i en äldre webbläsare utan <dialog>, är
// dagen en vanlig länk till formuläret.
document.addEventListener("click", function (handelse) {
  var lank = handelse.target.closest && handelse.target.closest("a.boka-dag");
  if (!lank || typeof HTMLDialogElement !== "function") return;
  handelse.preventDefault();

  var ruta = document.createElement("dialog");
  ruta.className = "boka-ruta";
  ruta.setAttribute("aria-label", "Bokningsförfrågan");
  ruta.innerHTML =
    '<form method="dialog"><button class="knapp ljus" type="submit">Stäng</button></form>' +
    '<iframe title="Formulär för bokningsförfrågan"></iframe>';
  ruta.querySelector("iframe").src = lank.href + "&inbaddad=1";
  ruta.addEventListener("close", function () {
    ruta.remove();
    lank.focus();
  });
  document.body.appendChild(ruta);
  ruta.showModal();
});
