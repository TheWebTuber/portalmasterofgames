(() => {
  const carousel = document.querySelector(".slider");
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll(".list .item")];
  const thumbs = [...document.querySelectorAll(".thumbnail .item")];
  const next = document.querySelector("#next"),
    prev = document.querySelector("#prev"),
    pause = document.querySelector("#pause");
  if (!slides.length || !next || !prev || !pause) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let active = 0,
    paused = reduced.matches,
    timer;
  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === active);
      slide.setAttribute("aria-hidden", String(i !== active));
    });
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle("active", i === active);
      thumb.setAttribute("aria-pressed", String(i === active));
    });
    document.querySelector("#slide-position").textContent =
      `${active + 1} / ${slides.length}`;
  };
  const schedule = () => {
    clearInterval(timer);
    if (
      !paused &&
      !document.hidden &&
      !carousel.contains(document.activeElement) &&
      !carousel.matches(":hover")
    )
      timer = setInterval(() => show(active + 1), 15000);
  };
  const updatePause = () => {
    pause.textContent = paused ? "Play slideshow" : "Pause slideshow";
    pause.setAttribute("aria-pressed", String(paused));
    schedule();
  };
  const step = (offset) => {
    show(active + offset);
    schedule();
  };
  next.addEventListener("click", () => step(1));
  prev.addEventListener("click", () => step(-1));
  thumbs.forEach((thumb, index) =>
    thumb.addEventListener("click", () => {
      show(index);
      schedule();
    }),
  );
  pause.addEventListener("click", () => {
    paused = !paused;
    updatePause();
  });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  });
  carousel.addEventListener("mouseenter", () => clearInterval(timer));
  carousel.addEventListener("mouseleave", schedule);
  carousel.addEventListener("focusin", () => clearInterval(timer));
  carousel.addEventListener("focusout", () => setTimeout(schedule, 0));
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", () => {
    paused = reduced.matches;
    updatePause();
  });
  let start;
  carousel.addEventListener(
    "touchstart",
    (event) => {
      start = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
    },
    { passive: true },
  );
  carousel.addEventListener(
    "touchend",
    (event) => {
      if (!start || event.target.closest("a,button")) return;
      const dx = event.changedTouches[0].clientX - start.x,
        dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
        step(dx < 0 ? 1 : -1);
      start = null;
    },
    { passive: true },
  );
  show(0);
  updatePause();
})();
