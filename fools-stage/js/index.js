(() => {
  const books = window.libraryBooks;

  const coverColors = {
    blue: "linear-gradient(145deg, #111827, #31506f, #090b10)",
    red: "linear-gradient(145deg, #2a0d12, #7c1f2a, #090609)",
    gray: "linear-gradient(145deg, #17171d, #5b5660, #08080b)",
    green: "linear-gradient(145deg, #102018, #3f644d, #070b08)"
  };

  const searchInput = document.getElementById("search-input");
  const authorFilter = document.getElementById("author-filter");
  const seriesFilter = document.getElementById("series-filter");
  const bookGrid = document.getElementById("book-grid");
  const authorGrid = document.getElementById("author-grid");
  const emptyState = document.getElementById("empty-state");
  const resultsLine = document.getElementById("results-line");

  document.getElementById("year").textContent = new Date().getFullYear();


  function uniqueValues(key) {
    return [...new Set(books.map((book) => book[key]))].sort();
  }

  function fillSelect(select, values) {
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function bookSearchText(book) {
    return [
      book.title,
      book.author,
      book.series,
      book.bookNumber,
      book.genre,
      book.status,
      book.description
    ]
      .join(" ")
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function createBookCard(source) {
    const book = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, escapeHtml(value)]));
    const card = document.createElement(source.pageLink ? "a" : "article");
    card.className = "book-card";
    if (book.pageLink) card.href = source.pageLink;
    card.setAttribute("aria-label", `${book.pageLink ? "Open" : "Coming soon:"} ${source.title} by ${source.author}`);

    const coverStyle = coverColors[book.color] || coverColors.blue;
    const statusClass = book.status.toLowerCase().includes("available") ? "available" : "coming";
    const imageHtml = book.coverImage
      ? `<img src="${book.coverImage}" alt="" loading="lazy">`
      : "";

    card.innerHTML = `
      <div class="cover">
        ${imageHtml}
        <div class="cover-fallback" style="background: ${coverStyle}">
          <div class="cover-title">
            <small>${book.series} - ${book.bookNumber}</small>
            ${book.title}
          </div>
        </div>
      </div>
      <div class="book-info">
        <div class="book-meta">
          <span class="chip ${statusClass}">${book.status}</span>
          <span class="chip">${book.author}</span>
          <span class="chip">${book.genre}</span>
        </div>
        <h3>${book.title}</h3>
        <p>${book.description}</p>
        <div class="open-row">${book.pageLink ? "Explore book →" : "Coming soon"}</div>
      </div>
    `;

    card.querySelector("img")?.addEventListener("error", event => { event.target.hidden = true; });
    return card;
  }

  function renderBooks() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedAuthor = authorFilter.value;
    const selectedSeries = seriesFilter.value;

    const filteredBooks = books.filter((book) => {
      const matchesSearch = query.split(/\s+/).every(word => bookSearchText(book).includes(word));
      const matchesAuthor = selectedAuthor === "all" || book.author === selectedAuthor;
      const matchesSeries = selectedSeries === "all" || book.series === selectedSeries;
      return matchesSearch && matchesAuthor && matchesSeries;
    });

    bookGrid.innerHTML = "";
    filteredBooks.forEach((book) => bookGrid.appendChild(createBookCard(book)));

    emptyState.hidden = filteredBooks.length !== 0;
    document.getElementById("reset-filters").hidden = !query && selectedAuthor === "all" && selectedSeries === "all";
    resultsLine.textContent = `${filteredBooks.length} book${filteredBooks.length === 1 ? "" : "s"} shown`;
  }

  function renderAuthors() {
    const authorCounts = books.reduce((counts, book) => {
      counts[book.author] = (counts[book.author] || 0) + 1;
      return counts;
    }, {});

    authorGrid.innerHTML = "";

    Object.entries(authorCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([author, count]) => {
        const card = document.createElement("article");
        card.className = "author-card";
        card.innerHTML = `
          <strong>${escapeHtml(author)}</strong>
          <p>${count} book${count === 1 ? "" : "s"} in the library</p>
        `;
        authorGrid.appendChild(card);
      });
  }

  fillSelect(authorFilter, uniqueValues("author"));
  fillSelect(seriesFilter, uniqueValues("series"));

  searchInput.addEventListener("input", renderBooks);
  authorFilter.addEventListener("change", renderBooks);
  seriesFilter.addEventListener("change", renderBooks);

  renderBooks();
  renderAuthors();

  document.getElementById('reset-filters').addEventListener('click', () => {
    searchInput.value = '';
    authorFilter.value = 'all';
    seriesFilter.value = 'all';
    renderBooks();
    searchInput.focus();
  });
})();
