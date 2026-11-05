const eventDate = new Date('2026-12-31T17:00:00-04:00').getTime();
const units = { days: 86400000, hours: 3600000, minutes: 60000, seconds: 1000 };

function updateCountdown() {
  let remaining = Math.max(0, eventDate - Date.now());
  Object.entries(units).forEach(([name, size]) => {
    const value = Math.floor(remaining / size);
    remaining %= size;
    document.getElementById(name).textContent = String(value).padStart(2, '0');
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);

const envelope = document.getElementById('envelope');
const invitation = document.getElementById('invitation');
const weddingMusic = document.getElementById('weddingMusic');
let musicReady;
function prepareMusic() {
  if (!musicReady) {
    const parts = Array.from({ length: 5 }, (_, index) => `./audio/track-${index + 1}.b64`);
    musicReady = Promise.all(parts.map((path) => fetch(path).then((response) => {
      if (!response.ok) throw new Error('No se pudo cargar la música.');
      return response.text();
    })))
      .then((chunks) => {
        const binary = atob(chunks.join('').trim());
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        weddingMusic.src = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      });
  }
  return musicReady;
}
document.getElementById('openInvitation').addEventListener('click', () => {
  envelope.classList.add('is-open');
  invitation.setAttribute('aria-hidden', 'false');
  prepareMusic().then(() => weddingMusic.play()).catch(() => {});
});

const musicToggle = document.getElementById('musicToggle');
musicToggle.addEventListener('click', () => {
  if (weddingMusic.paused) {
    prepareMusic().then(() => weddingMusic.play()).catch(() => {});
    musicToggle.textContent = 'Pausar música';
    musicToggle.setAttribute('aria-pressed', 'true');
    musicToggle.title = 'Pausar música';
  } else {
    weddingMusic.pause();
    musicToggle.textContent = 'Reproducir música';
    musicToggle.setAttribute('aria-pressed', 'false');
    musicToggle.title = 'Reproducir música';
  }
});

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

document.getElementById('rsvpForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('guestName').value.trim();
  const passes = document.getElementById('guestPasses').value;
  const phone = document.getElementById('guestPhone').value;
  const feedback = document.getElementById('formFeedback');
  if (!/^\d{4}$/.test(phone)) {
    feedback.textContent = 'Ingresa los últimos 4 dígitos de tu celular.';
    return;
  }
  feedback.textContent = `¡Gracias, ${name}! Registramos ${passes} pase${passes === '1' ? '' : 's'} para tu confirmación.`;
  event.currentTarget.reset();
});

const galleryModal = document.getElementById('galleryModal');
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

const progress = document.querySelector('.progress span');
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max ? (window.scrollY / max) * 100 : 0}%`;
  updateTimeline();
}, { passive: true });
updateTimeline();

