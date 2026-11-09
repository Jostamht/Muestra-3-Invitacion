const $ = (id) => document.getElementById(id);
const I = window.INVITE || {};

/* ---------- Datos de la invitación (invite.js) ---------- */
const eventDate = new Date(I.eventStart || '2026-12-31T17:00:00-04:00');

function applyInvitation() {
  if (!window.INVITE) return;
  const tz = I.timeZone || 'America/La_Paz';
  const part = (options, type) => new Intl.DateTimeFormat('es', { timeZone: tz, ...options })
    .formatToParts(eventDate).find((p) => p.type === type).value;
  const weekday = part({ weekday: 'long' }, 'weekday');
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const monthName = part({ month: 'long' }, 'month');
  const dayNumber = part({ day: 'numeric' }, 'day');
  const day = part({ day: '2-digit' }, 'day');
  const month = part({ month: '2-digit' }, 'month');
  const year = part({ year: 'numeric' }, 'year');
  const dateDay = `${dayNumber} de ${monthName} de ${year}`;

  const data = {
    ...I,
    day, month, year,
    dateDay,
    dateShort: `${day} · ${month} · ${year}`,
    dateLabel: `${weekdayCap} · ${dayNumber} de ${monthName} · ${year}`,
    dateLong: `${weekdayCap}, ${dateDay}`,
    coupleUpper: `${I.bride} & ${I.groom}`.toUpperCase(),
    footerNote: `Gracias por ser parte de nuestra historia · ${dateDay}`
  };

  document.querySelectorAll('[data-bind]').forEach((el) => {
    const value = data[el.dataset.bind];
    if (value !== undefined) el.textContent = value;
  });
  document.querySelectorAll('[data-bind-label]').forEach((el) => {
    el.setAttribute('aria-label', data[el.dataset.bindLabel]);
  });
  document.querySelectorAll('[data-couple]').forEach((el) => {
    const amp = document.createElement('em');
    amp.textContent = '&';
    el.replaceChildren(I.bride, ' ', amp, ' ', I.groom);
  });

  document.title = `${I.bride} & ${I.groom} — ${day}.${month}.${year}`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = `Invitación de boda de ${I.bride} y ${I.groom} — ${dateDay}.`;

  const stamp = (date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const end = new Date(eventDate.getTime() + (I.durationHours || 7) * 3600000);
  const calendarLink = $('calendarLink');
  if (calendarLink) {
    calendarLink.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + `&text=${encodeURIComponent(`Boda de ${I.bride} y ${I.groom}`)}`
      + `&dates=${stamp(eventDate)}/${stamp(end)}`
      + `&details=${encodeURIComponent('Celebramos nuestra boda.')}`
      + `&location=${encodeURIComponent(I.calendarLocation || '')}`;
  }
}
applyInvitation();

/* ---------- Nombres largos: reducir la letra si no caben en una línea ---------- */
function fitText(el, available) {
  el.style.fontSize = '';
  if (!available || available <= 0) return;
  const needed = el.scrollWidth;
  if (needed > available) {
    const size = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${Math.floor(size * (available / needed) * 0.97)}px`;
  }
}
function fitNames() {
  const heroTitle = document.querySelector('.hero-copy h1');
  if (heroTitle) fitText(heroTitle, heroTitle.parentElement.clientWidth);
  const footerName = document.querySelector('.footer-name');
  if (footerName) fitText(footerName, footerName.parentElement.clientWidth - footerName.offsetLeft * 2);
}
fitNames();
window.addEventListener('resize', fitNames);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);

/* ---------- Cuenta regresiva ---------- */
const units = { days: 86400000, hours: 3600000, minutes: 60000, seconds: 1000 };

function updateCountdown() {
  let remaining = Math.max(0, eventDate.getTime() - Date.now());
  Object.entries(units).forEach(([name, size]) => {
    const value = Math.floor(remaining / size);
    remaining %= size;
    $(name).textContent = String(value).padStart(2, '0');
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ---------- Sobre y música ---------- */
const envelope = $('envelope');
const invitation = $('invitation');
const weddingMusic = $('weddingMusic');
const musicToggle = $('musicToggle');

function setMusicUI(playing) {
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.textContent = playing ? 'Pausar música' : 'Reproducir música';
  musicToggle.title = musicToggle.textContent;
}
weddingMusic.addEventListener('play', () => setMusicUI(true));
weddingMusic.addEventListener('pause', () => setMusicUI(false));

$('openInvitation').addEventListener('click', () => {
  // play() va directo en el clic para que iPhone/Safari lo permita
  weddingMusic.play().catch(() => {});
  envelope.classList.add('is-open');
  invitation.removeAttribute('inert');
  document.body.classList.remove('is-locked');
  fitNames();
});

musicToggle.addEventListener('click', () => {
  if (weddingMusic.paused) weddingMusic.play().catch(() => {});
  else weddingMusic.pause();
});

/* ---------- Animaciones al hacer scroll ---------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
}, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const timeline = document.querySelector('.schedule-list');
const timelineItems = [...timeline.querySelectorAll('li')];
function updateTimeline() {
  const rect = timeline.getBoundingClientRect();
  const viewportLine = window.innerHeight * 0.67;
  const progress = Math.max(0, Math.min(1, (viewportLine - rect.top) / rect.height));
  timeline.style.setProperty('--timeline-progress', progress);
  timelineItems.forEach((item) => {
    item.classList.toggle('is-lit', item.getBoundingClientRect().top < viewportLine);
  });
}

/* ---------- Confirmación de asistencia ---------- */
const guests = I.guests || [];
const rsvpForm = $('rsvpForm');
const guestName = $('guestName');
const guestPasses = $('guestPasses');
const guestPhone = $('guestPhone');
const guestHint = $('guestHint');
const feedback = $('formFeedback');

const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
function findGuest(query) {
  const words = normalize(query).split(' ').filter(Boolean);
  if (words.length < 2) return null;
  return guests.find((guest) => words.every((word) => normalize(guest.name).includes(word))) || null;
}
const passesText = (n) => `${n} pase${n === 1 ? '' : 's'}`;

function resetPasses() {
  guestPasses.replaceChildren(new Option('Primero escribe tu nombre', ''));
  guestPasses.disabled = true;
}

guestName.addEventListener('input', () => {
  feedback.textContent = '';
  const guest = findGuest(guestName.value);
  if (guest) {
    const options = [];
    for (let n = guest.passes; n >= 1; n -= 1) options.push(new Option(passesText(n), String(n)));
    options.push(new Option('No podré asistir', '0'));
    guestPasses.replaceChildren(...options);
    guestPasses.disabled = false;
    guestHint.textContent = `Hola, ${guest.name}. Tienes ${passesText(guest.passes)} disponibles.`;
  } else {
    resetPasses();
    guestHint.textContent = normalize(guestName.value).split(' ').length >= 2
      ? 'No encontramos ese nombre. Escríbelo como aparece en tu invitación.'
      : '';
  }
});

guestPhone.addEventListener('input', () => {
  guestPhone.value = guestPhone.value.replace(/\D/g, '').slice(0, 4);
});

rsvpForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const guest = findGuest(guestName.value);
  if (!guest) {
    feedback.textContent = 'Escribe tu nombre y apellido tal como aparece en tu invitación.';
    return;
  }
  if (guestPhone.value !== guest.phone) {
    feedback.textContent = 'Los últimos 4 dígitos del celular no coinciden.';
    return;
  }
  const attending = Number(guestPasses.value);
  const reply = attending > 0
    ? `¡Gracias, ${guest.name}! Confirmaste ${passesText(attending)}.`
    : `Gracias por avisarnos, ${guest.name}. Lamentamos que no puedas acompañarnos.`;
  if (I.whatsapp) {
    const text = attending > 0
      ? `Hola, soy ${guest.name}. Confirmo mi asistencia con ${passesText(attending)}.`
      : `Hola, soy ${guest.name}. Lamentablemente no podré asistir.`;
    window.open(`https://wa.me/${I.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    feedback.textContent = `${reply} Se abrió WhatsApp para enviar tu respuesta.`;
  } else {
    feedback.textContent = `${reply} (Muestra: esta respuesta todavía no se envía a los novios.)`;
  }
  rsvpForm.reset();
  resetPasses();
  guestHint.textContent = '';
});

/* ---------- Galería ---------- */
const galleryModal = $('galleryModal');
const modalImage = galleryModal.querySelector('img');
document.querySelectorAll('.gallery .print img').forEach((image) => {
  image.closest('.print').addEventListener('click', () => {
    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt;
    galleryModal.classList.add('is-open');
    galleryModal.setAttribute('aria-hidden', 'false');
  });
});
galleryModal.addEventListener('click', (event) => {
  if (event.target === galleryModal || event.target.tagName === 'BUTTON') {
    galleryModal.classList.remove('is-open');
    galleryModal.setAttribute('aria-hidden', 'true');
  }
});

/* ---------- Barra de progreso ---------- */
const progress = document.querySelector('.progress span');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max ? (window.scrollY / max) * 100 : 0}%`;
  updateTimeline();
}, { passive: true });
updateTimeline();
