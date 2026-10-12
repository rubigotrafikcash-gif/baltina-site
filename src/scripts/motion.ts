/**
 * Анимации при прокрутке: появление блоков, параллакс досок, прогресс чтения.
 * Без зависимостей (~1 КБ). Уважает prefers-reduced-motion.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Задержки «лесенкой» для детей группы
document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
  const step = Number(group.dataset.revealGroup) || 90;
  group.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
    el.style.setProperty('--d', `${i * step}ms`);
  });
});

const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');

if (reduce || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => io.observe(el));
}

// Параллакс и прогресс чтения — один обработчик прокрутки через requestAnimationFrame
const parallax = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
const progress = document.querySelector<HTMLElement>('.progress');
let ticking = false;

function update() {
  ticking = false;
  const vh = window.innerHeight;
  const doc = document.documentElement;
  const max = doc.scrollHeight - vh;
  progress?.style.setProperty('--progress', String(max > 0 ? window.scrollY / max : 0));

  if (reduce) return;
  for (const el of parallax) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > vh + 200) continue;
    const center = rect.top + rect.height / 2 - vh / 2;
    const k = Number(el.dataset.parallax) || 0;
    el.style.setProperty('--py', `${(center * k).toFixed(1)}px`);
  }
}

function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
update();
