// Static venue content, copied from the original Flutter site so the two read the same.
// Edit here to change marketing copy. Prices, slots, offers and bookings always come from the API.
import type { IconType } from 'react-icons';
import { LuBath, LuCar, LuCctv, LuCoffee, LuDroplets, LuHeartPulse, LuLampCeiling, LuPackage, LuShirt, LuUsers } from 'react-icons/lu';

export const facilities: { name: string; icon: IconType; desc: string }[] = [
  { name: 'Floodlights', icon: LuLampCeiling, desc: 'Bright LED lights for night games' },
  { name: 'Parking', icon: LuCar, desc: 'Free parking on site' },
  { name: 'Washrooms', icon: LuBath, desc: 'Clean washrooms at the venue' },
  { name: 'Drinking Water', icon: LuDroplets, desc: 'Water available for players' },
  { name: 'Changing Room', icon: LuShirt, desc: 'Change before and after play' },
  { name: 'Cafe & Snacks', icon: LuCoffee, desc: 'Drinks and snacks between overs' },
  { name: 'Spectator Seating', icon: LuUsers, desc: 'Seats for friends and family' },
  { name: 'Equipment Rental', icon: LuPackage, desc: 'Rent a bat at the arena' },
  { name: 'First Aid', icon: LuHeartPulse, desc: 'First aid kit kept on site' },
  { name: 'CCTV', icon: LuCctv, desc: 'Venue covered by cameras' },
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

export type PhotoCategory = 'Ground' | 'Pitch' | 'Floodlights' | 'Seating' | 'Facilities';
export const photoCategories: PhotoCategory[] = ['Ground', 'Pitch', 'Floodlights', 'Seating', 'Facilities'];

export interface Photo {
  src: string;
  thumb: string;
  alt: string;
  caption: string;
  categories: PhotoCategory[];
}

const photo = (name: string, caption: string, alt: string, categories: PhotoCategory[]): Photo => ({
  src: `/images/${name}.webp`,
  thumb: `/images/${name}-sm.webp`,
  caption,
  alt,
  categories,
});

// arena-night is the real venue. The others are mood shots: replace them with venue photos when available.
export const photos = (venueName: string): Photo[] => [
  photo('arena-night', `${venueName} under lights`, 'Aerial view of the netted, floodlit turf box at night with players on the field', ['Ground', 'Pitch', 'Floodlights']),
  photo('golden-hour', 'Golden-hour warm-up', 'Players stretching on the outfield at sunset', ['Ground']),
  photo('bat-and-ball', 'Bats available on rent', 'A cricket bat and a red ball on a dark surface', ['Facilities']),
  photo('floodlit-stadium', 'Big-match floodlights', 'Aerial view of a floodlit cricket stadium at night', ['Floodlights']),
  photo('batting-under-lights', 'Batting under the lights', 'A batter playing a shot at night with the wicketkeeper behind the stumps', ['Pitch', 'Floodlights']),
];

export const arenaFaqs: [string, string][] = [
  ['What surface is the box?', 'A netted box with premium turf and a marked centre pitch. Wear non-marking sports shoes; spikes are not allowed.'],
  ['Which balls can we use?', 'Tennis and rubber balls only. Leather balls are not allowed in the box.'],
  ['How many players can play?', 'The box is set up for 6-a-side. Extra players may be charged at the venue.'],
  ['Can we play at night?', 'Yes. The arena is open 24 hours and fully floodlit, at the same flat rate any hour.'],
  ['Do you provide equipment?', 'You can rent a bat at the arena, or bring your own kit.'],
  ['When should we arrive?', 'Please arrive 10 minutes early. Your slot ends on time so the next team can start.'],
  ['Can I cancel or reschedule?', 'Yes, from My Bookings. Full refund 24+ hours before your slot, 50% from 6 to 24 hours, no refund under 6 hours.'],
];

export const CONTACT_EMAIL = 'book@theriverside.example';
export const ADMIN_PANEL_URL = import.meta.env.VITE_ADMIN_PANEL_URL ?? 'http://localhost:3000/admin';
