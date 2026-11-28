import { LuCopy, LuTag } from 'react-icons/lu';

import type { Offer } from '@shared/api/types';
import { useToast } from '@shared/ui/Toast';

export const OfferCards = ({ offers }: { offers: Offer[] }) => {
  const toast = useToast();
  const copy = (code: string) =>
    void navigator.clipboard
      .writeText(code)
      .then(() => toast.show(`${code} copied`))
      .catch(() => toast.show(`Use code ${code} at checkout`));
  return (
    <div className="offers-row">
      {offers.map((o) => (
        <div key={o.id} className="offer" data-accent={o.accent}>
          <LuTag className="offer-tag" aria-hidden />
          <div className="offer-label">{o.label}</div>
          <div className="offer-title">{o.title || o.code}</div>
          {o.description && <div className="offer-desc">{o.description}</div>}
          <button type="button" className="offer-code" onClick={() => copy(o.code)} aria-label={`Copy code ${o.code}`}>
            {o.code} <LuCopy aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
};
