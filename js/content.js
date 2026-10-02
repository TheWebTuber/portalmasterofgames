/* Pause decorative motion while a visitor is interacting with the page. */
(() => {
  const orbit = document.querySelector('.banner .slider');
  if (!orbit) return;
  let paused = false;
  const button = document.createElement('button');
  button.type = 'button';button.className = 'motion-toggle';button.textContent = 'Pause animation';button.setAttribute('aria-pressed','false');
  const setMotion = () => {orbit.style.animationPlayState = paused || document.hidden ? 'paused' : 'running';};
  button.addEventListener('click', () => {paused = !paused;button.textContent = paused ? 'Play animation' : 'Pause animation';button.setAttribute('aria-pressed',String(paused));setMotion();});
  orbit.parentElement.append(button);
  document.addEventListener('visibilitychange', setMotion);
})();
