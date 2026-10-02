/* The original js/live.js remains the data source. It was not uploaded.
   This companion only handles the clock, mirrored status, and unavailable state. */
(() => {
  const status = document.getElementById("liveStatus");
  const statusCard = document.getElementById("liveStatusCard");
  const clock = document.getElementById("clock");
  const note = document.getElementById("live-data-note");
  const dot = document.getElementById("liveDot");
  if (!status || !statusCard) return;
  const tick = () => {
    clock.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
  };
  tick();
  setInterval(tick, 1000);
  const sync = () => {
    statusCard.textContent = status.textContent;
  };
  new MutationObserver(sync).observe(status, {
    childList: true,
    characterData: true,
    subtree: true,
  });
  const hasData = () => {
    const count = document.getElementById("subscribers").textContent.trim();
    return /^\d/.test(count);
  };
  const unavailable = () => {
    if (!hasData()) {
      status.textContent = "Channel data unavailable";
      note.hidden = false;
      dot.hidden = true;
      document.getElementById("goalText").textContent = "Unavailable";
    }
  };
  const observer = new MutationObserver(() => {
    if (hasData()) {
      note.hidden = true;
      dot.hidden = false;
    }
    const fill = document.getElementById("goalFill");
    const width = Math.max(0, Math.min(100, parseFloat(fill.style.width) || 0));
    fill.parentElement.setAttribute("aria-valuenow", String(width));
  });
  observer.observe(document.getElementById("subscribers"), {
    childList: true,
    characterData: true,
    subtree: true,
  });
  observer.observe(document.getElementById("goalFill"), {
    attributes: true,
    attributeFilter: ["style"],
  });
  const dataScript = document.createElement("script");
  dataScript.src = "js/live.js";
  dataScript.addEventListener("error", unavailable);
  dataScript.addEventListener("load", () => setTimeout(unavailable, 12000));
  document.body.append(dataScript);
  setTimeout(unavailable, 15000);
})();
