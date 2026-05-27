// ─── drawer.js - logica hamburger menu mobile ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const overlay  = document.getElementById('drawer-overlay');
  const drawer   = document.getElementById('drawer');
  const openBtn  = document.getElementById('hamburger-btn');
  const closeBtn = document.getElementById('drawer-close');

  if (!overlay || !drawer || !openBtn || !closeBtn) return;

  const openDrawer  = () => { drawer.classList.add('open');    overlay.classList.add('open'); };
  const closeDrawer = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };

  openBtn.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
});
