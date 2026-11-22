// Static venue content, copied from the original Flutter site so the two read the same.
// Edit here to change marketing copy. Prices, slots, offers and bookings always come from the API.
import type { IconType } from 'react-icons';
import {
  MdCheckroom,
  MdLocalParking,
  MdMedicalServices,
  MdOutlineChair,
  MdOutlineCoffee,
  MdOutlineVideocam,
  MdOutlineWaterDrop,
  MdSportsCricket,
  MdWc,
  MdWbTwilight,
} from 'react-icons/md';

import type { GalleryVariant } from './components/art';

export const facilities: { name: string; icon: IconType }[] = [
  { name: 'Floodlights', icon: MdWbTwilight },
  { name: 'Parking', icon: MdLocalParking },
  { name: 'Washrooms', icon: MdWc },
  { name: 'Drinking water', icon: MdOutlineWaterDrop },
  { name: 'Changing room', icon: MdCheckroom },
  { name: 'Cafe & snacks', icon: MdOutlineCoffee },
  { name: 'Spectator seating', icon: MdOutlineChair },
  { name: 'Equipment rental', icon: MdSportsCricket },
  { name: 'First aid', icon: MdMedicalServices },
  { name: 'CCTV', icon: MdOutlineVideocam },
];

export const groundRules = [
  'Tennis or rubber balls only. Leather balls are not allowed.',
  'Wear sports or non-marking shoes. Spikes are not allowed on the turf.',
  'Please arrive 10 minutes early. Your slot ends on time for the next team.',
  'Maximum players as per the box format (6-a-side). Extra players may be charged at the venue.',
  'No smoking, alcohol or gutka anywhere on the premises.',
  'Damage to nets, turf or lights will be charged at actuals.',
];

export const faqs: [string, string][] = [
  [
    'How do I book a slot?',
    'Pick a date and back-to-back hourly slots, review the total, log in with your mobile number and pay online. Your ticket arrives instantly.',
  ],
  [
    'Can I cancel or reschedule?',
    'Yes. Cancel or reschedule from My Bookings. You get a full refund up to 24 hours before your slot and 50% up to 6 hours before.',
  ],
  [
    'How long are slots held while I pay?',
    'Once you continue to review, we hold your slots for 8 minutes so nobody else can take them while you check out.',
  ],
  ['What can we play with?', 'Tennis and rubber balls only. Bring your own bat or rent one at the arena. Non-marking sports shoes are required.'],
  ['How many players are allowed?', 'The Main Box is 6-a-side. Extra players can join for a small additional charge at the venue.'],
  ['Are you open overnight?', 'Yes - we are open 24 hours. Book any hour of the day or night at the same flat rate.'],
];

// Sample testimonials from the original design. Replace with real customer reviews before launch.
export const rating = { score: 4.8, count: 286, bars: [0.85, 0.09, 0.04, 0.01, 0.01] };

export const homeReviews = [
  { name: 'Rohan P.', team: 'Porbandar XI', text: 'We used to spend half the day calling around. Now we pick a riverside slot at 9 PM and the team is sorted before dinner.' },
  { name: 'Hetal M.', team: 'Office League, Porbandar', text: 'Clear flat price, no hidden charges and the slot was ready when we reached. Booking feels so smooth.' },
  { name: 'Aman K.', team: 'Weekend Warriors', text: 'Sunday morning by the Ashmavati used to be a fight to arrange. Now I can see what is free and lock it in a minute.' },
];

export const arenaReviews = [
  { name: 'Rohan P.', when: '2 weeks ago', stars: 5, tag: 'Played 6 times', text: 'Playing by the riverfront under the lights is special. Turf is clean, booking was quick and the staff were ready when we arrived.' },
  { name: 'Karan S.', when: '1 month ago', stars: 5, tag: 'Corporate match', text: "Parking is easy, washrooms are clean and the cafe is handy between overs. Our office team's go-to box in Porbandar." },
  { name: 'Meet D.', when: '3 weeks ago', stars: 4, tag: 'Weekend regular', text: 'Great bounce and netting. Weekends fill up fast, so book early. Fair flat rate for the quality.' },
  { name: 'Jenil T.', when: '5 days ago', stars: 5, tag: 'Birthday', text: 'Hosted a birthday match here. Open late, floodlights are bright and the riverside breeze is a bonus.' },
  { name: 'Aditya M.', when: '2 months ago', stars: 5, tag: 'Morning game', text: 'Morning sessions with the gang are brilliant. Same clear price any hour - no surprises at checkout.' },
  { name: 'Dev V.', when: '1 week ago', stars: 5, tag: 'Played 3 times', text: 'Smooth check-in, on-time start and clean turf. Slot timings are respected, which matters a lot.' },
];

export const gallery = (venueName: string): { variant: GalleryVariant; caption: string }[] => [
  { variant: 'lights', caption: `${venueName} under lights` },
  { variant: 'aerial', caption: 'Aerial view of the box' },
  { variant: 'nets', caption: 'Netting and boundary' },
  { variant: 'pavilion', caption: 'Seating and pavilion' },
  { variant: 'cafe', caption: 'Cafe and lounge' },
];

export const CONTACT_EMAIL = 'book@theriverside.example';
export const ADMIN_PANEL_URL = import.meta.env.VITE_ADMIN_PANEL_URL ?? 'http://localhost:3000/admin';
