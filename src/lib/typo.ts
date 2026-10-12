/**
 * Мини-типограф для русского текста:
 * неразрывный пробел перед тире, после коротких слов и после чисел,
 * чтобы строки не начинались с «—» и не заканчивались на «в», «с», «и».
 */
const NBSP = ' ';
const SHORT_WORDS =
  'а|в|и|к|о|с|у|я|на|по|за|из|от|до|не|но|ни|со|во|об|без|для|при';
// Ретроспективная проверка не «съедает» пробел, поэтому цепочки «и в шкафу» обрабатываются за один проход.
const shortWordRe = new RegExp(`(?<=^|[\\s«(])(${SHORT_WORDS})\\s+`, 'giu');

export function typoString(input: string): string {
  if (/^https?:\/\//.test(input) || input.startsWith('#')) return input;
  let s = input.replace(/ +— /g, `${NBSP}— `).replace(/(\d)\s+(?=\S)/g, `$1${NBSP}`);
  s = s.replace(shortWordRe, `$1${NBSP}`);
  return s;
}

export function typo<T>(value: T): T {
  if (typeof value === 'string') return typoString(value) as T;
  if (Array.isArray(value)) return value.map((v) => typo(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = typo(v);
    return out as T;
  }
  return value;
}
