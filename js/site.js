(() => {
  const shell = document.querySelector(".nav-shell");
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-navigation");
  if (shell && toggle && nav) {
    const small = matchMedia("(max-width: 900px)");
    shell.classList.add("nav-enhanced");
    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
    };
    const resize = () => {
      toggle.hidden = !small.matches;
      close();
    };
    resize();
    small.addEventListener("change", resize);
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      toggle.textContent = open ? "Close" : "Menu";
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a") && small.matches) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        close();
        toggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (small.matches && !shell.contains(event.target)) close();
    });
  }
  const failed = (img) => {
    if (img.dataset.fallback && !img.dataset.fallbackUsed) {
      img.dataset.fallbackUsed = "true";
      img.src = img.dataset.fallback;
      return;
    }
    const placeholder = document.createElement("span");
    placeholder.className = "asset-unavailable";
    placeholder.textContent = "Artwork unavailable";
    placeholder.setAttribute("role", "img");
    placeholder.setAttribute(
      "aria-label",
      img.alt ? `${img.alt}: unavailable` : "Artwork unavailable",
    );
    img.replaceWith(placeholder);
  };
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => failed(img));
    if (img.complete && img.naturalWidth === 0) failed(img);
  });
})();
