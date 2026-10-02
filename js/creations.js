(() => {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  const gifURL = file => new URL(`gifs/${encodeURIComponent(file)}`, location.href).href;
  async function copy(url, button, info) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      button.textContent = 'Copied!';setTimeout(() => {button.textContent = 'Copy link';}, 1800);
    } catch {
      let input = info.querySelector('.copy-fallback');
      if (!input) {input = document.createElement('input');input.className = 'copy-fallback';input.readOnly = true;input.setAttribute('aria-label', 'GIF link: select and copy');info.append(input);}
      input.value = url;input.focus();input.select();button.textContent = 'Select and copy the link';
    }
  }
  fetch('gifs.json').then(response => {if (!response.ok) throw new Error('Manifest unavailable');return response.json();}).then(files => {
    if (!Array.isArray(files)) throw new Error('Invalid GIF list');
    gallery.replaceChildren();
    files.forEach(file => {
      if (typeof file !== 'string' || /[\/\\]/.test(file) || !/\.gif$/i.test(file)) return;
      const name = file.replace(/^@PMOG\(PortalMasterOfGames\)_/, '').replace(/_\d{4}-\d{2}-\d{2}-.*\.gif$/i, '').replace(/\.gif$/i, '');
      const card = document.createElement('article');card.className = 'card';
      const img = document.createElement('img');img.src = gifURL(file);img.alt = `${name} animation`;img.loading = 'lazy';img.decoding = 'async';
      img.addEventListener('error', () => {const placeholder = document.createElement('div');placeholder.className = 'asset-unavailable';placeholder.textContent = 'GIF preview unavailable';img.replaceWith(placeholder);});
      const info = document.createElement('div');info.className = 'info';
      const title = document.createElement('div');title.className = 'filename';title.textContent = name;
      const button = document.createElement('button');button.type = 'button';button.className = 'share-btn';button.textContent = 'Copy link';button.setAttribute('aria-label',`Copy link to ${name}`);
      button.addEventListener('click', () => copy(gifURL(file), button, info));
      info.append(title, button);card.append(img, info);gallery.append(card);
    });
    if (!gallery.children.length) gallery.textContent = 'No GIFs to show yet.';
    gallery.setAttribute('aria-busy','false');
  }).catch(() => {gallery.classList.add('notice');gallery.textContent = 'The GIF collection could not load. Please try again later.';gallery.setAttribute('aria-busy','false');});
})();
