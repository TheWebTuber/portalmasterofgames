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
    const category = document.getElementById("category-filter");
    if (products.length && search && searchBox && count && empty && noResults) {
      searchBox.hidden = false;
      empty.hidden = true;
      if (category) {
        const categories = [...new Set(products.map((product) => product.dataset.category || "Designs"))];
        categories.forEach((name) => {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          category.append(option);
        });
      }
      function filterProducts() {
        const query = search.value.trim().toLocaleLowerCase();
        let visible = 0;
        products.forEach((product) => {
          const matchesText = product.textContent.toLocaleLowerCase().includes(query);
          const matchesType = !category || category.value === "all" || category.value === (product.dataset.category || "Designs");
          product.hidden = !matchesText || !matchesType;
          if (!product.hidden) visible += 1;
        });
        count.textContent = `${visible} ${visible === 1 ? "piece" : "pieces"}`;
        noResults.hidden = visible > 0;
      }
      search.addEventListener("input", filterProducts);
      category?.addEventListener("change", filterProducts);
      filterProducts();
    }
  }

  // Keep failed thumbnails inside the same image space.
  document.querySelectorAll("img").forEach((thumb) => {
    const failed = () => {
      const placeholder = document.createElement("span");
      placeholder.className = "image-unavailable";
      placeholder.textContent = "Image preview unavailable";
      placeholder.setAttribute("role", "img");
      placeholder.setAttribute("aria-label", `${thumb.alt || "Product image"}: preview unavailable`);
      thumb.replaceWith(placeholder);
    };
    thumb.addEventListener("error", failed);
    if (thumb.complete && thumb.naturalWidth === 0) failed();
  });

  const triggers = [...document.querySelectorAll("[data-lightbox]")];
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
    // Load the larger image only when the viewer opens.
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
      if (!["http:", "https:", "file:"].includes(url.protocol)) return;
      event.preventDefault();
      const productGroup = Boolean(trigger.closest(".product-card"));
      items = triggers.filter((item) => Boolean(item.closest(".product-card")) === productGroup && !item.closest(".product-card")?.hidden);
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
