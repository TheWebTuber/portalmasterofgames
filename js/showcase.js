(() => {
  // Merch cards live in the HTML, so adding products requires no JavaScript edits.
  const grid = document.getElementById("merch-grid");
  if (grid) {
    const products = [...grid.querySelectorAll(".product-card")];
    const search = document.getElementById("merch-search");
    const searchBox = document.getElementById("catalog-search");
    const count = document.getElementById("catalog-count");
    const empty = document.getElementById("merch-empty");
    const noResults = document.getElementById("merch-no-results");
    if (products.length && search && searchBox && count && empty && noResults) {
      searchBox.hidden = false;
      empty.hidden = true;
      function filterProducts() {
        const query = search.value.trim().toLocaleLowerCase();
        let visible = 0;
        products.forEach((product) => {
          product.hidden = !product.textContent.toLocaleLowerCase().includes(query);
          if (!product.hidden) visible += 1;
        });
        count.textContent = `${visible} ${visible === 1 ? "design" : "designs"}`;
        noResults.hidden = visible > 0;
      }
      search.addEventListener("input", filterProducts);
      filterProducts();
    }
  }

  const triggers = [...document.querySelectorAll("[data-lightbox]")];
  const galleryCount = document.getElementById("gallery-count");
  if (galleryCount) {
    galleryCount.textContent = `${triggers.length} ${triggers.length === 1 ? "work" : "works"}`;
  }
  const dialog = document.getElementById("image-lightbox");
  // Without dialog support, the image links still open the original image.
  if (!dialog || typeof dialog.showModal !== "function" || !triggers.length) return;
  const imageSpace = document.getElementById("lightbox-image-space");
  const title = document.getElementById("lightbox-title");
  const description = document.getElementById("lightbox-description");
  const position = document.getElementById("lightbox-position");
  const original = document.getElementById("lightbox-original");
  const error = document.getElementById("lightbox-error");
  const navigation = dialog.querySelector(".lightbox-navigation");
  let items = [];
  let index = 0;
  let opener;
  let previousOverflow = "";
  let image;

  function showImage(nextIndex) {
    index = (nextIndex + items.length) % items.length;
    const item = items[index];
    const thumb = item.querySelector("img");
    // Create this on first open, after the shared site's image fallbacks run.
    if (!image) {
      image = document.createElement("img");
      image.id = "lightbox-image";
      image.addEventListener("error", () => {
        image.hidden = true;
        if (error) error.hidden = false;
      });
      imageSpace.prepend(image);
    }
    image.hidden = false;
    if (error) error.hidden = true;
    image.alt = thumb?.alt || item.dataset.imageTitle || "";
    image.src = item.href;
    title.textContent = item.dataset.imageTitle || "Image";
    description.textContent = item.dataset.imageDescription || "";
    original.href = item.href;
    position.textContent = `${index + 1} / ${items.length}`;
    navigation.hidden = items.length < 2;
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      // Let modified clicks keep their normal browser behavior.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      let url;
      try {
        url = new URL(trigger.href, document.baseURI);
      } catch {
        return;
      }
      if (!/^https?:$/.test(url.protocol)) return;
      event.preventDefault();
      items = triggers.filter((item) => !item.closest(".product-card")?.hidden);
      opener = trigger;
      showImage(items.indexOf(trigger));
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = "hidden";
    });
  });
  dialog.querySelector("[data-close-lightbox]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-previous-image]").addEventListener("click", () => showImage(index - 1));
  dialog.querySelector("[data-next-image]").addEventListener("click", () => showImage(index + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showImage(index + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = previousOverflow;
    image.removeAttribute("src");
    opener?.focus();
  });
})();
