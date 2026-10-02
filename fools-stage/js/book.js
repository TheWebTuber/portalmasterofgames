// Shared behavior for every book page. The page title supplies the share title.
(() => {
  const button = document.getElementById('shareButton');
  const message = document.getElementById('shareMessage');
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  if (!button || !message) return;
  button.addEventListener('click', async () => {
    button.disabled = true;
    message.textContent = '';
    const url = new URL(window.location.href);
    url.hash = '';
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, text: 'Read the beta reader edition of ' + document.title, url: url.href });
        message.textContent = 'Thanks for sharing!';
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url.href);
        message.textContent = 'Link copied!';
      } else {
        message.textContent = 'Copy this link to share: ' + url.href;
      }
    } catch (error) {
      if (error.name !== 'AbortError') message.textContent = 'Copy this link to share: ' + url.href;
    } finally {
      button.disabled = false;
    }
  });
})();
