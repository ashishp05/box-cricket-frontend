import { useState } from 'react';
import { MdChevronLeft, MdChevronRight, MdPhotoLibrary } from 'react-icons/md';

import { gallery } from '../content';
import { GalleryScene } from './art';

export const Gallery = ({ venueName }: { venueName: string }) => {
  const items = gallery(venueName);
  const [index, setIndex] = useState(0);
  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);
  const item = items[index];
  return (
    <div>
      <div className="gallery-main">
        <GalleryScene variant={item.variant} />
        {index > 0 && (
          <button type="button" className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo">
            <MdChevronLeft />
          </button>
        )}
        <button type="button" className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo">
          <MdChevronRight />
        </button>
        <span className="gallery-caption">{item.caption}</span>
        <span className="gallery-count">
          <MdPhotoLibrary aria-hidden /> {index + 1}/{items.length}
        </span>
      </div>
      <div className="thumbs">
        {items.map((it, i) => (
          <button key={it.variant} type="button" aria-pressed={i === index} onClick={() => setIndex(i)} aria-label={`Show photo: ${it.caption}`}>
            <GalleryScene variant={it.variant} />
          </button>
        ))}
      </div>
      <div className="gallery-dots" aria-hidden>
        {items.map((it, i) => (
          <i key={it.variant} className={i === index ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
};
