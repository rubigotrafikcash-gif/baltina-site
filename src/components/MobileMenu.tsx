import { useCallback, useEffect, useId, useRef, useState } from 'react';
import styles from './MobileMenu.module.css';

interface MenuItem {
  href: string;
  label: string;
}

interface Props {
  items: MenuItem[];
  ctaHref: string;
  ctaLabel: string;
}

export default function MobileMenu({ items, ctaHref, ctaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    panelRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        close(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, close]);

  return (
    <div className={styles.root}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.icon} data-open={open} aria-hidden="true">
          <span />
          <span />
        </span>
        <span className={styles.text}>{open ? 'Закрыть' : 'Меню'}</span>
      </button>

      <div ref={panelRef} id={panelId} className={styles.panel} hidden={!open}>
        <nav aria-label="Разделы страницы">
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={styles.link} onClick={() => close(false)}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a className={styles.cta} href={ctaHref} target="_blank" rel="noopener">
          {ctaLabel}
          <span className="visually-hidden"> (откроется в новой вкладке)</span>
        </a>
      </div>
    </div>
  );
}
