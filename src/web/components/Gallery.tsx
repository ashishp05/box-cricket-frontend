import { useEffect, useRef, useState } from 'react';
import { LuCamera, LuChevronLeft, LuChevronRight, LuExpand, LuX } from 'react-icons/lu';

import { type Photo, type PhotoCategory, photoCategories, photos } from '../content';

// Left/right swipe on touch screens.
const useSwipe = (onSwipe: (dir: 1 | -1) => void) => {
  const x = useRef<number | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => (x.current = e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - (x.current ?? e.changedTouches[0].clientX);
      if (Math.abs(dx) > 40) onSwipe(dx < 0 ? 1 : -1);
      x.current = null;
    },
  };
};

const Lightbox = ({ items, start, onClose }: { items: Photo[]; start: number; onClose: () => void }) => {
  const [index, setIndex] = useState(start);
  const go = (d: number) => setIndex((i) => (i + d + items.length) % items.length);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useSwipe(go);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = items[index];
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery" onClick={onClose}>
      <div className="lb-top" onClick={(e) => e.stopPropagation()}>
        <span>
          {index + 1} / {items.length}
        </span>
        <button ref={closeRef} type="button" className="lb-btn" onClick={onClose} aria-label="Close gallery">
          <LuX />
        </button>
      </div>
      <figure className="lb-stage" onClick={(e) => e.stopPropagation()} {...swipe}>
        <img key={item.src} src={item.src} alt={item.alt} />
        <figcaption>{item.caption}</figcaption>
      </figure>
      {items.length > 1 && (
        <>
          <button type="button" className="lb-btn lb-nav prev" onClick={(e) => (e.stopPropagation(), go(-1))} aria-label="Previous photo">
            <LuChevronLeft />
          </button>
          <button type="button" className="lb-btn lb-nav next" onClick={(e) => (e.stopPropagation(), go(1))} aria-label="Next photo">
            <LuChevronRight />
          </button>
          <div className="lb-thumbs" onClick={(e) => e.stopPropagation()}>
            {items.map((it, i) => (
              <button key={it.src} type="button" aria-pressed={i === index} onClick={() => setIndex(i)} aria-label={`Show photo: ${it.caption}`}>
                <img src={it.thumb} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const Gallery = ({ venueName, withTabs = false }: { venueName: string; withTabs?: boolean }) => {
  const all = photos(venueName);
  const [category, setCategory] = useState<PhotoCategory | 'All'>('All');
  const items = category === 'All' ? all : all.filter((p) => p.categories.includes(category));
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = Math.min(index, Math.max(items.length - 1, 0));
  const go = (d: number) => setIndex((i) => (i + d + items.length) % items.length);
  const swipe = useSwipe(go);
  const item = items[current];

  const pick = (c: PhotoCategory | 'All') => {
    setCategory(c);
    setIndex(0);
  };

  return (
    <div className="gallery">
      {withTabs && (
        <div className="gallery-tabs" role="tablist" aria-label="Photo categories">
          {(['All', ...photoCategories] as const).map((c) => (
            <button key={c} type="button" role="tab" aria-selected={category === c} onClick={() => pick(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      {item ? (
        <>
          <div className="gallery-main" {...swipe}>
            <button type="button" className="gallery-open" onClick={() => setOpen(true)} aria-label={`Open full-screen: ${item.caption}`}>
              <img key={item.src} src={item.src} alt={item.alt} />
            </button>
            {items.length > 1 && (
              <>
                <button type="button" className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo">
                  <LuChevronLeft />
                </button>
                <button type="button" className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo">
                  <LuChevronRight />
                </button>
              </>
            )}
            <span className="gallery-caption">{item.caption}</span>
            <span className="gallery-count">
              {current + 1} / {items.length}
            </span>
            <button type="button" className="gallery-expand" onClick={() => setOpen(true)} aria-label="View full screen">
              <LuExpand />
            </button>
          </div>
          {items.length > 1 && (
            <>
              <div className="thumbs">
                {items.map((it, i) => (
                  <button key={it.src} type="button" aria-pressed={i === current} onClick={() => setIndex(i)} aria-label={`Show photo: ${it.caption}`}>
                    <img src={it.thumb} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
              <div className="gallery-dots" aria-hidden>
                {items.map((it, i) => (
                  <i key={it.src} className={i === current ? 'on' : ''} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="gallery-main gallery-empty">
          <LuCamera aria-hidden />
          <strong>{category} photos coming soon</strong>
          <span>We're adding fresh photos of the arena.</span>
        </div>
      )}

      {open && item && <Lightbox items={items} start={current} onClose={() => setOpen(false)} />}
    </div>
  );
};
