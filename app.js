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

function setupSlideshow(root) {
  const slides = [...root.querySelectorAll('.slide')];
  if (!slides.length) return;
  const dots = root.querySelector('.slide-dots');
  let i = slides.findIndex((s) => s.classList.contains('is-on'));
  if (i < 0) i = 0;

  const go = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle('is-on', idx === i));
    if (dots) {
      [...dots.children].forEach((d, idx) => d.classList.toggle('is-on', idx === i));
    }
  };

  if (dots) {
    slides.forEach((_, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Slide ${idx + 1}`);
      if (idx === i) b.classList.add('is-on');
      b.addEventListener('click', () => go(idx));
      dots.appendChild(b);
    });
  }

  root.querySelector('.prev')?.addEventListener('click', () => go(i - 1));
  root.querySelector('.next')?.addEventListener('click', () => go(i + 1));
  const href = root.dataset.href;
  if (href) {
    root.style.cursor = 'pointer';
    root.querySelector('.slides')?.addEventListener('click', () => {
      window.open(href, '_blank', 'noopener,noreferrer');
    });
  }
  setInterval(() => go(i + 1), 4500);
}

document.querySelectorAll('[data-slideshow]').forEach(setupSlideshow);

const studioForm = document.getElementById('studioForm');
const formNote = document.getElementById('formNote');
const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const nameOk = /^[\p{L}][\p{L}\s.'-]{1,79}$/u;

function setError(id, message) {
  const field = document.getElementById(id)?.closest('.field');
  const err = document.querySelector(`[data-error-for="${id}"]`);
  if (field) field.classList.toggle('is-invalid', Boolean(message));
  if (err) err.textContent = message || '';
}

function validateStudio() {
  const name = document.getElementById('name').value.trim();
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const aboutWork = document.getElementById('aboutWork').value.trim();
  let ok = true;

  if (name.length < 2) {
    setError('name', 'Enter a name (at least 2 characters).');
    ok = false;
  } else if (!nameOk.test(name)) {
    setError('name', 'Use letters only — no numbers or links.');
    ok = false;
  } else {
    setError('name', '');
  }

  if (fullName.length < 3) {
    setError('fullName', 'Enter your full name.');
    ok = false;
  } else if (!nameOk.test(fullName)) {
    setError('fullName', 'Use letters only — no numbers or links.');
    ok = false;
  } else if (!fullName.includes(' ')) {
    setError('fullName', 'Please enter first and last name.');
    ok = false;
  } else {
    setError('fullName', '');
  }

  if (!emailOk.test(email)) {
    setError('email', 'Enter a valid email address.');
    ok = false;
  } else {
    setError('email', '');
  }

  if (aboutWork.length < 20) {
    setError('aboutWork', 'Tell us a bit more about your work (at least 20 characters).');
    ok = false;
  } else if (aboutWork.length > 2000) {
    setError('aboutWork', 'Please keep this under 2000 characters.');
    ok = false;
  } else {
    setError('aboutWork', '');
  }

  return ok;
}

function clearStudioErrors() {
  ['name', 'fullName', 'email', 'aboutWork'].forEach((id) => setError(id, ''));
  if (formNote) formNote.hidden = true;
}

if (studioForm) {
  studioForm.addEventListener('submit', (e) => {
    if (studioForm.querySelector('.honeypot')?.value) {
      e.preventDefault();
      return;
    }
    if (!validateStudio()) {
      e.preventDefault();
      formNote.hidden = true;
      return;
    }
    formNote.hidden = false;
    formNote.textContent = 'Sending to Dip\'s software studio…';
  });

  document.addEventListener('pointerdown', (e) => {
    if (!studioForm.contains(e.target)) clearStudioErrors();
  });
}
