import { useId, useState } from 'react';
import styles from './Faq.module.css';

export interface FaqItem {
  q: string;
  a: string;
  withPriceLink?: boolean;
}

interface Props {
  items: FaqItem[];
  priceHref: string;
  priceLabel: string;
}

export default function Faq({ items, priceHref, priceLabel }: Props) {
  // Первый вопрос (про стоимость) открыт сразу: его задают чаще всего.
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const baseId = useId();

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className={styles.list}>
      {items.map((item, i) => {
        const isOpen = open.has(i);
        const buttonId = `${baseId}-q${i}`;
        const panelId = `${baseId}-a${i}`;
        return (
          <div className={styles.item} key={item.q}>
            <h3 className={styles.heading}>
              <button
                id={buttonId}
                type="button"
                className={styles.button}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(i)}
              >
                <span>{item.q}</span>
                <span className={styles.icon} data-open={isOpen} aria-hidden="true" />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={styles.panel}
              data-open={isOpen}
            >
              <div className={styles.inner}>
                <p>{item.a}</p>
                {item.withPriceLink && (
                  <p>
                    <a className={styles.link} href={priceHref} target="_blank" rel="noopener">
                      {priceLabel}
                      <span className="visually-hidden"> (откроется в новой вкладке)</span>
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
