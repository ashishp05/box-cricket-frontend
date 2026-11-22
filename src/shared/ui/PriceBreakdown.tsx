import { MdAccessTime } from 'react-icons/md';

import type { Price } from '../api/types';
import { rupees, shortRange } from '../lib/format';

// Renders the server's Price object as-is (the client never calculates prices):
// per-hour lines, subtotal, offer, additional charges, GST and the total payable.
export const PriceBreakdown = ({ price, lines = true }: { price: Price; lines?: boolean }) => (
  <div>
    {lines && price.lines.length > 0 && (
      <>
        {price.lines.map((line) => (
          <div className="price-row" key={line.hour}>
            <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <MdAccessTime aria-hidden /> {shortRange(line.hour, 1)}
            </span>
            <span>{rupees(line.amount)}</span>
          </div>
        ))}
        <hr className="divider" />
      </>
    )}
    <div className="price-row">
      <span>Subtotal</span>
      <span>{rupees(price.subtotal)}</span>
    </div>
    {price.discount > 0 && (
      <div className="price-row">
        <span>Offer{price.couponCode ? ` (${price.couponCode})` : ''}</span>
        <span className="discount">- {rupees(price.discount)}</span>
      </div>
    )}
    <div className="price-row">
      <span>Additional charges</span>
      <span>{rupees(price.platformFee)}</span>
    </div>
    <div className="price-row">
      <span>GST ({price.gstRate}%)</span>
      <span>{rupees(price.taxes)}</span>
    </div>
    <hr className="divider" />
    <div className="price-total">
      <span>Total payable</span>
      <strong>{rupees(price.total)}</strong>
    </div>
  </div>
);
