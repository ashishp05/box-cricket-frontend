import { LuMapPin, LuNavigation, LuPhone } from 'react-icons/lu';

import { MapArt } from './art';

export const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const MapCard = ({ address, phone }: { address: string; phone: string }) => (
  <div className="map-card">
    <a className="map-frame" href={mapsUrl(address)} target="_blank" rel="noreferrer" aria-label="Open in Google Maps">
      <MapArt />
    </a>
    <p className="map-address">
      <LuMapPin aria-hidden /> {address}
    </p>
    <div className="map-actions">
      <a className="h-btn dark" href={mapsUrl(address)} target="_blank" rel="noreferrer">
        <LuNavigation aria-hidden /> Get Directions
      </a>
      <a className="h-btn light" href={`tel:${phone.replace(/\s/g, '')}`}>
        <LuPhone aria-hidden /> Call Venue
      </a>
    </div>
  </div>
);
