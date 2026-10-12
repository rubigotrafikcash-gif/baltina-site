/**
 * Моушн-система сайта на GSAP + ScrollTrigger + SplitText и плавной прокрутке Lenis.
 *
 * Принципы:
 * - контент всегда есть в HTML (SEO, без JS страница видна целиком);
 * - при «уменьшить движение» — только мягкие появления, без закреплений и параллакса;
 * - тяжёлые сцены (горизонтальные шаги, курсор) — только на широких экранах с мышью.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

declare global {
  interface Window {
    __motion?: boolean;
  }
}

window.__motion = true;

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) =>
  ctx.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) => [
  ...ctx.querySelectorAll<T>(sel),
];

/* ------------------------------------------------------------------ */
/* Простые появления (IntersectionObserver) — работают в любом режиме  */
/* ------------------------------------------------------------------ */
function initSoftReveals() {
  $$('[data-reveal-group]').forEach((group) => {
    const step = Number(group.dataset.revealGroup) || 90;
    $$('[data-reveal]', group).forEach((el, i) => el.style.setProperty('--d', `${i * step}ms`));
  });

  const targets = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => io.observe(el));
}

function showStatic() {
  gsap.set('[data-split], [data-hero-fade], [data-final-fade]', { autoAlpha: 1 });
}

/* ------------------------------------------------------------------ */
/* Полоса прогресса                                                    */
/* ------------------------------------------------------------------ */
function initProgress() {
  const bar = $('.progress');
  if (!bar) return;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => bar.style.setProperty('--progress', self.progress.toFixed(4)),
  });
}

initSoftReveals();

if (reduce) {
  showStatic();
  initProgress();
} else {
  const fontsReady = Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((r) => setTimeout(r, 1500)),
  ]);
  fontsReady.then(initMotion);
}

/* ================================================================== */
function initMotion() {
  /* ---------- Плавная прокрутка ---------- */
  const lenis = new Lenis({ lerp: 0.085, anchors: { offset: -16 }, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  initProgress();
  initHeader();

  const heroDelay = introTimeline();
  initHero(heroDelay);
  initTicker(lenis);
  initStory();
  initSplitHeadings();
  initService();
  initSteps();
  initPortrait();
  initParallax();
  initFinal();
  initPointer();

  // Пересчитать позиции после загрузки шрифтов и картинок
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* ---------- Заставка ---------- */
function introTimeline(): number {
  const intro = $('[data-intro]');
  if (!intro || !root.classList.contains('intro-on')) return 0.1;

  const name = $('.name', intro);
  const sub = $('.sub', intro);
  const split = name ? SplitText.create(name, { type: 'chars', mask: 'chars', reduceWhiteSpace: false }) : null;

  const tl = gsap.timeline();
  if (split) tl.from(split.chars, { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.035 });
  if (sub) tl.from(sub, { autoAlpha: 0, y: 12, duration: 0.6, ease: 'power2.out' }, '-=0.45');
  tl.to(intro, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '+=0.3').add(() => {
    root.classList.remove('intro-on');
  });
  return tl.duration() - 0.55;
}

/* ---------- Шапка: прячется вниз, появляется вверх ---------- */
function initHeader() {
  const header = $('.header');
  if (!header) return;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const hide = self.direction === 1 && self.scroll() > 480;
      header.classList.toggle('header--hidden', hide);
    },
  });
}

/* ---------- Первый экран ---------- */
function initHero(delay: number) {
  const h1 = $('[data-split="hero"]');
  if (h1) {
    gsap.set(h1, { autoAlpha: 1 });
    SplitText.create(h1, {
      type: 'lines',
      mask: 'lines',
      // не схлопывать неразрывные пробелы (иначе «—» уезжает в начало строки)
      reduceWhiteSpace: false,
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 120,
          rotate: 4,
          transformOrigin: '0% 100%',
          duration: 1.4,
          ease: 'expo.out',
          stagger: 0.1,
          delay,
        }),
    });
  }

  gsap.fromTo(
    '[data-hero-fade]',
    { autoAlpha: 0, y: 30 },
    { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, delay: delay + 0.55 },
  );

  const cards = $$('[data-hero-card]');
  const deck = $('[data-hero-cards]');
  if (!cards.length || !deck) return;

  // Карточки «раздаются» снизу и раскрываются веером
  gsap.from(cards, {
    y: () => window.innerHeight * 0.6,
    x: 0,
    rotation: (i) => [-4, 0, 4][i] ?? 0,
    autoAlpha: 0,
    duration: 1.6,
    ease: 'expo.out',
    stagger: { each: 0.12, from: 'center' },
    delay: delay + 0.25,
    onComplete: () => {
      // При прокрутке веер раскрывается шире и уходит вверх
      gsap.to(cards, {
        yPercent: (i) => [-18, -34, -12][i] ?? 0,
        rotation: (i) => [-20, -3, 20][i] ?? 0,
        xPercent: (i) => [-16, 0, 16][i] ?? 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      });
    },
  });

  // «Печать» вращается постоянно и ускоряется при прокрутке
  const ring = $('[data-seal-ring]');
  if (ring) {
    const spin = gsap.to(ring, { rotation: 360, svgOrigin: '60 60', duration: 18, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
        gsap.to(spin, { timeScale: 1 + v, duration: 0.3, overwrite: true });
        gsap.to(spin, { timeScale: 1, duration: 1.2, delay: 0.3 });
      },
    });
  }
  gsap.from('[data-hero-disc]', { scale: 0.4, autoAlpha: 0, duration: 1.8, ease: 'expo.out', delay: delay + 0.1 });
  gsap.from('[data-hero-seal]', { scale: 0, rotation: -120, duration: 1.4, ease: 'back.out(1.6)', delay: delay + 1 });

  // Лёгкий 3D-наклон колоды за мышью
  if (window.matchMedia('(pointer: fine)').matches) {
    gsap.set(deck, { transformPerspective: 1200 });
    const rx = gsap.quickTo(deck, 'rotationX', { duration: 0.8, ease: 'power3.out' });
    const ry = gsap.quickTo(deck, 'rotationY', { duration: 0.8, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      ry(nx * 14);
      rx(-ny * 10);
    });
  }

  if (h1) {
    gsap.to(h1, {
      yPercent: -18,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

/* ---------- Бегущая строка, реагирующая на скорость прокрутки ---------- */
function initTicker(lenis: Lenis) {
  const track = $('.ticker .track');
  if (!track) return;
  track.style.animation = 'none';

  let half = track.scrollWidth / 2;
  let x = 0;
  let velocity = 0;
  const skew = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' });
  const wrap = () => gsap.utils.wrap(-half, 0);
  let wrapX = wrap();

  lenis.on('scroll', (l: Lenis) => {
    velocity = l.velocity;
  });
  window.addEventListener('resize', () => {
    half = track.scrollWidth / 2;
    wrapX = wrap();
  });

  gsap.ticker.add((_, delta) => {
    const dir = velocity < 0 ? -1 : 1;
    const speed = 0.06 * delta * (1 + Math.min(Math.abs(velocity), 40) * 0.35);
    x = wrapX(x - speed * dir);
    gsap.set(track, { x });
    skew(gsap.utils.clamp(-10, 10, -velocity * 0.45));
    velocity *= 0.92;
  });
}

/* ---------- Главная сцена: шкаф → капсула → образы ---------- */
type Pose = [x: number, y: number, rotation: number, scale: number];

const CHAOS: Record<string, Pose> = {
  jacket: [0.34, 0.3, -16, 1.1],
  top: [0.66, 0.2, 14, 1],
  sweater: [0.5, 0.5, -6, 1.15],
  skirt: [0.8, 0.52, 22, 1],
  trousers: [0.22, 0.64, 10, 1.05],
  dress: [0.6, 0.76, -12, 1.1],
  sneakers: [0.86, 0.86, -20, 0.9],
  heels: [0.14, 0.36, 28, 0.9],
  bag: [0.38, 0.88, 8, 0.95],
};

const LOOKS: Record<string, Pose> = {
  top: [0.12, 0.2, -6, 0.75],
  jacket: [0.2, 0.24, 0, 1],
  trousers: [0.18, 0.56, 0, 1],
  heels: [0.2, 0.84, 0, 0.75],
  sweater: [0.5, 0.24, 0, 1],
  skirt: [0.5, 0.56, 0, 1],
  sneakers: [0.5, 0.84, 0, 0.75],
  dress: [0.82, 0.4, 0, 1.25],
  bag: [0.88, 0.78, 6, 0.75],
};

function initStory() {
  const story = $('[data-story]');
  const pin = $('[data-story-pin]');
  const stage = $('[data-story-stage]');
  if (!story || !pin || !stage) return;

  story.classList.add('story--motion');

  const items = $$('[data-story-item]', story);
  const labels = $$('.label', story);
  const caps = $$('[data-story-cap]', story);
  const rail = $$('[data-story-rail]', story);
  const looks = $$('[data-story-look]', story);
  const glow = $('[data-story-glow]', story);

  const W = () => stage.offsetWidth;
  const H = () => stage.offsetHeight;
  const g = (el: HTMLElement, prop: '--gx' | '--gy') => parseFloat(el.style.getPropertyValue(prop));

  // Подписи разбиваем на слова для смены «как в титрах»
  const capWords = caps.map((cap) => {
    const title = $('.cap-title', cap);
    return title ? SplitText.create(title, { type: 'lines,words', mask: 'lines', reduceWhiteSpace: false, aria: 'none' }).words : [];
  });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: {
      trigger: story,
      pin,
      start: 'top top',
      end: () => `+=${window.innerHeight * 2.8}`,
      scrub: 1.2,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  // 1. Хаос → капсула-сетка
  items.forEach((el, i) => {
    const pose = CHAOS[el.dataset.storyItem ?? ''] ?? [0.5, 0.5, 0, 1];
    tl.fromTo(
      el,
      {
        x: () => (pose[0] - g(el, '--gx')) * W(),
        y: () => (pose[1] - g(el, '--gy')) * H(),
        rotation: pose[2],
        scale: pose[3],
      },
      { x: 0, y: 0, rotation: 0, scale: 1, duration: 1 },
      0.15 + i * 0.03,
    );
  });

  if (glow) tl.fromTo(glow, { scale: 0.55, autoAlpha: 0.4 }, { scale: 1.05, autoAlpha: 1, duration: 1 }, 0.2);
  tl.to(labels, { autoAlpha: 1, duration: 0.3, stagger: 0.02 }, 1.05);

  // Смена подписей 1 → 2
  tl.to(capWords[0] ?? [], { yPercent: -110, duration: 0.4, stagger: 0.02, ease: 'power2.in' }, 0.45)
    .to(caps[0]?.querySelector('.cap-text') ?? {}, { autoAlpha: 0, duration: 0.3 }, 0.45)
    .set(caps[0] ?? {}, { autoAlpha: 0 }, 0.9)
    .set(caps[1] ?? {}, { autoAlpha: 1 }, 0.9)
    .from(capWords[1] ?? [], { yPercent: 110, duration: 0.5, stagger: 0.03, ease: 'power3.out' }, 0.9)
    .from(caps[1]?.querySelector('.cap-text') ?? {}, { autoAlpha: 0, y: 20, duration: 0.4 }, 1.05)
    .to(rail[1] ?? {}, { '--on': 1, duration: 0.5 }, 0.9);

  // Пауза на капсуле
  tl.to({}, { duration: 0.35 });

  // 2. Капсула → три образа
  tl.to(labels, { autoAlpha: 0, duration: 0.25 }, 1.7);
  items.forEach((el, i) => {
    const pose = LOOKS[el.dataset.storyItem ?? ''] ?? [0.5, 0.5, 0, 1];
    tl.to(
      el,
      {
        x: () => (pose[0] - g(el, '--gx')) * W(),
        y: () => (pose[1] - g(el, '--gy')) * H(),
        rotation: pose[2],
        scale: pose[3],
        duration: 1,
      },
      1.8 + i * 0.025,
    );
  });

  tl.to(capWords[1] ?? [], { yPercent: -110, duration: 0.4, stagger: 0.02, ease: 'power2.in' }, 1.8)
    .to(caps[1]?.querySelector('.cap-text') ?? {}, { autoAlpha: 0, duration: 0.3 }, 1.8)
    .set(caps[1] ?? {}, { autoAlpha: 0 }, 2.25)
    .set(caps[2] ?? {}, { autoAlpha: 1 }, 2.25)
    .from(capWords[2] ?? [], { yPercent: 110, duration: 0.5, stagger: 0.03, ease: 'power3.out' }, 2.25)
    .from(caps[2]?.querySelector('.cap-text') ?? {}, { autoAlpha: 0, y: 20, duration: 0.4 }, 2.4)
    .to(rail[2] ?? {}, { '--on': 1, duration: 0.5 }, 2.25)
    .fromTo(looks, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1 }, 2.6);

  if (glow) tl.to(glow, { scaleX: 1.35, scaleY: 0.9, duration: 1 }, 1.8);

  // Пауза на образах перед уходом сцены
  tl.to({}, { duration: 0.5 });
}

/* ---------- Заголовки разделов: строки выезжают из-под маски ---------- */
function initSplitHeadings() {
  $$('[data-split="lines"]').forEach((el) => {
    gsap.set(el, { autoAlpha: 1 });
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      // не схлопывать неразрывные пробелы (иначе «—» уезжает в начало строки)
      reduceWhiteSpace: false,
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.2,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });

  $$('[data-split="soft"]').forEach((el) => {
    gsap.set(el, { autoAlpha: 1 });
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      // не схлопывать неразрывные пробелы (иначе «—» уезжает в начало строки)
      reduceWhiteSpace: false,
      // абзацы читаются скринридером как обычный текст, без aria-label на <p>
      aria: 'none',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 100,
          autoAlpha: 0,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.06,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        }),
    });
  });
}

/* ---------- Услуга: пункты «прочерчиваются» ---------- */
function initService() {
  $$('#service li').forEach((li) => {
    gsap.from(li, {
      clipPath: 'inset(0% 100% 0% 0%)',
      autoAlpha: 0.2,
      duration: 1.1,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: li, start: 'top 90%', once: true },
    });
  });
}

/* ---------- Шаги: горизонтальная лента на десктопе ---------- */
function initSteps() {
  const steps = $('[data-steps]');
  const pin = $('[data-steps-pin]');
  const track = $('[data-steps-track]');
  if (!steps || !pin || !track) return;

  const mm = gsap.matchMedia();

  mm.add('(min-width: 64em)', () => {
    steps.classList.add('steps--motion');
    const distance = () => track.scrollWidth - window.innerWidth;

    const move = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        pin: true,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    $$('[data-step]', track).forEach((step) => {
      const num = $('[data-step-num]', step);
      if (num) {
        gsap.to(num, {
          color: '#c8215f',
          ease: 'none',
          scrollTrigger: { trigger: step, containerAnimation: move, start: 'left 75%', end: 'left 45%', scrub: true },
        });
      }
      gsap.from($$('h3, p', step), {
        y: 40,
        autoAlpha: 0,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: step, containerAnimation: move, start: 'left 85%', end: 'left 55%', scrub: true },
      });
    });

    return () => steps.classList.remove('steps--motion');
  });

  mm.add('(max-width: 63.99em)', () => {
    $$('[data-step]', track).forEach((step) => {
      gsap.from(step, {
        y: 50,
        autoAlpha: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: step, start: 'top 88%', once: true },
      });
    });
  });
}

/* ---------- Портрет: открывается шторкой ---------- */
function initPortrait() {
  $$('[data-mask-reveal]').forEach((el) => {
    const inner = el.firstElementChild;
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
    tl.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' },
    );
    if (inner) tl.from(inner, { scale: 1.25, duration: 1.8, ease: 'expo.out' }, 0.2);
  });
}

/* ---------- Параллакс досок с капсулами ---------- */
function initParallax() {
  $$('[data-parallax]').forEach((el) => {
    const k = Number(el.dataset.parallax) || 0;
    gsap.fromTo(
      el,
      { y: () => -k * window.innerHeight * 1.2 },
      {
        y: () => k * window.innerHeight * 1.2,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      },
    );
  });
}

/* ---------- Финал: розовый разливается кругом ---------- */
function initFinal() {
  const final = $('[data-final]');
  const bg = $('[data-final-bg]');
  if (!final || !bg) return;
  final.classList.add('final--motion');

  gsap.fromTo(
    bg,
    { clipPath: 'circle(0% at 50% 55%)' },
    {
      clipPath: 'circle(100% at 50% 55%)',
      ease: 'none',
      scrollTrigger: { trigger: final, start: 'top 90%', end: 'top 15%', scrub: 1 },
    },
  );

  const title = $('[data-split="final"]', final);
  if (title) {
    gsap.set(title, { autoAlpha: 1 });
    SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      // не схлопывать неразрывные пробелы (иначе «—» уезжает в начало строки)
      reduceWhiteSpace: false,
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 120,
          rotate: 4,
          transformOrigin: '0% 100%',
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: final, start: 'top 35%', once: true },
        }),
    });
  }

  gsap.fromTo(
    $$('[data-final-fade]', final),
    { autoAlpha: 0, y: 30 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.12,
      delay: 0.4,
      scrollTrigger: { trigger: final, start: 'top 35%', once: true },
    },
  );
}

/* ---------- Мышь: курсор-кольцо и «магнитные» кнопки ---------- */
function initPointer() {
  if (!window.matchMedia('(pointer: fine) and (min-width: 48em)').matches) return;

  const cursor = $('[data-cursor]');
  const label = $('[data-cursor-label]');
  if (cursor) {
    root.classList.add('cursor-on');
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    document.addEventListener('pointerover', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest<HTMLElement>('a, button');
      const tg = link?.getAttribute('href')?.includes('t.me');
      cursor.classList.toggle('is-link', Boolean(link) && !tg);
      cursor.classList.toggle('has-label', Boolean(tg));
      if (label) label.textContent = tg ? 'написать' : '';
    });
  }

  $$('.btn--solid, .btn--light').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.35)' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.45);
    });
    btn.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
