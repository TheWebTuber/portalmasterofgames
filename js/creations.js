(() => {
  const tablist = document.getElementById("creation-tabs");
  const panel = document.getElementById("projects-panel");
  const heading = document.getElementById("projects-heading");
  const count = document.getElementById("project-count");
  if (!tablist || !panel || !heading || !count) return;
  const tabs = [...tablist.querySelectorAll("[role=tab]")];
  const cards = [...panel.querySelectorAll(".project-card")];
  if (!tabs.length) return;

  function select(tab) {
    const category = tab.dataset.category;
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    let visible = 0;
    cards.forEach((card) => {
      const categories = card.dataset.categories.split(/\s+/);
      card.hidden = category !== "all" && !categories.includes(category);
      if (!card.hidden) visible += 1;
    });
    heading.textContent = category === "all" ? "All creations" : tab.textContent;
    count.textContent = `${visible} ${visible === 1 ? "collection" : "collections"}`;
    panel.setAttribute("aria-labelledby", tab.id);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(tabs[next]);
      tabs[next].focus();
    });
  });
  panel.setAttribute("role", "tabpanel");
  panel.tabIndex = 0;
  select(tabs[0]);
  tablist.hidden = false;
})();
