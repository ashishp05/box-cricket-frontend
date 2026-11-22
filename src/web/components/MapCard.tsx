import { MdCall, MdDirections } from 'react-icons/md';

import { MapArt } from './art';

export const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const MapCard = ({ address, phone }: { address: string; phone: string }) => (
  <div className="card map-card">
    <MapArt />
    <div className="map-body">
      <p style={{ fontSize: 15 }}>{address}</p>
      <div className="map-actions">
        <a className="btn outline" href={mapsUrl(address)} target="_blank" rel="noreferrer">
          <MdDirections aria-hidden /> Directions
        </a>
        <a className="btn outline" href={`tel:${phone.replace(/\s/g, '')}`}>
          <MdCall aria-hidden /> Call venue
        </a>
      </div>
    </div>
  </div>
);
