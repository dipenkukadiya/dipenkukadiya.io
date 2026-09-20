const glow = document.getElementById('cursorGlow');
if (glow) {
  document.addEventListener('pointermove', (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('in');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)';
  io.observe(el);
});

const revealStyle = document.createElement('style');
revealStyle.textContent = '.reveal.in{opacity:1!important;transform:none!important}';
document.head.appendChild(revealStyle);

const menuToggle = document.getElementById('menuToggle');
const siteNav = document.getElementById('siteNav');

function setMenu(open) {
  document.body.classList.toggle('nav-open', open);
  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    setMenu(!document.body.classList.contains('nav-open'));
  });
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});
