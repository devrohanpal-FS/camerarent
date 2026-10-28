export interface TermItem {
  id: number;
  title: string;
  category: 'timings' | 'custody' | 'payment' | 'travel' | 'legal';
  icon: string;
  originalText: string;
  explanation: string;
  badge?: string;
}

export const TERMS_CONDITIONS: TermItem[] = [
  {
    id: 1,
    title: 'Shift Duration & Overtime Calculation',
    category: 'timings',
    icon: 'Clock',
    originalText: 'One Shift is of 8 hrs. and it is calculated from the time of delivery of Equipment. In case the equipment is used for more than 10 hours additional time will be calculated on hourly basis.',
    explanation: 'A standard rental shift equals 8 hours, starting directly from equipment handover. A 2-hour buffer is provided; any usage beyond 10 total hours will incur overtime billed on an hourly pro-rata basis.',
    badge: '1 Shift = 8 Hours'
  },
  {
    id: 2,
    title: 'Custody, Proper Care & Safe Return',
    category: 'custody',
    icon: 'Shield',
    originalText: 'The hirer will be responsible for proper use of the equipment and its safe return.',
    explanation: 'The hirer assumes full responsibility for handling the cameras, lenses, and accessories with professional care and returning all items safely in their original working order.',
    badge: 'Hirer Responsibility'
  },
  {
    id: 3,
    title: 'Inspection & Testing Upon Delivery',
    category: 'custody',
    icon: 'CheckSquare',
    originalText: 'The hirer will check / test the equipment at the time of taking the delivery.',
    explanation: 'Physical verification and operational checks (sensors, mounts, optics, batteries) must be performed by the hirer immediately upon delivery before signing off.',
    badge: 'Mandatory Inspection'
  },
  {
    id: 4,
    title: 'Damage & Loss Reimbursement',
    category: 'custody',
    icon: 'AlertTriangle',
    originalText: 'In case any damage is caused to the equipment in the custody of hirer the, loss will be reimbursed by the hirer to the owner.',
    explanation: 'Any physical damage, moisture/liquid exposure, optical scratches, or loss incurred while equipment is under the custody of the hirer must be fully compensated and reimbursed to the owner.',
    badge: 'Full Reimbursement'
  },
  {
    id: 5,
    title: 'Shoot Cancellation Charges',
    category: 'payment',
    icon: 'CalendarX',
    originalText: 'In case shooting is cancelled the hirer has to pay cancellation charges to the owners, for a minimum of one shift, If a notice of 48 hours is given before nominal charges of 10% of the total amount will be owner.',
    explanation: 'If a shoot is cancelled without sufficient prior notice, a minimum fee equivalent to 1 full shift is payable to the owner. If at least 48 hours advance notice is provided, only nominal charges of 10% of the total booking value will be charged.',
    badge: 'Min. 1 Shift / 10% at 48h'
  },
  {
    id: 6,
    title: 'Payment Schedule (50% Advance & Balance on Return)',
    category: 'payment',
    icon: 'CreditCard',
    originalText: '50% of the total amount of the equipment is to be paid at the time of booking of the equipment and balance amount has to be paid at the time of return of the equipment.',
    explanation: 'A 50% advance deposit is mandatory to lock in equipment dates and confirm booking. The remaining 50% balance must be settled in full upon return and verification of the gear.',
    badge: '50% Advance / 50% on Return'
  },
  {
    id: 7,
    title: 'Accompanying Technical Attendant',
    category: 'timings',
    icon: 'UserCheck',
    originalText: 'One attendant of Namita Kamti will accompany with the equipment.',
    explanation: 'For safety, calibration, and equipment support, a designated technical attendant from Namita Kamti / CameraRent will accompany the gear throughout the shoot.',
    badge: 'Dedicated Attendant'
  },
  {
    id: 8,
    title: 'Geographical Scope & Outstation Surcharge',
    category: 'travel',
    icon: 'MapPin',
    originalText: 'The equipment charges are for local hiring only. In case the equipment is taken out of Delhi, a surcharge of 50% will be levied in the rates.',
    explanation: 'Standard advertised rental rates apply strictly to Delhi local shoots. If equipment is moved or deployed outside Delhi NCR, an outstation surcharge of +50% will be added to the base rate.',
    badge: '+50% Outside Delhi'
  },
  {
    id: 9,
    title: 'Transportation & Cartage Expenses',
    category: 'travel',
    icon: 'Truck',
    originalText: 'In case the equipment is requested to be sent at desired place, the cartage/conveyance/transportation will be borne by the hire and paid in cash to the attendant.',
    explanation: 'Whenever equipment delivery is requested to a designated set/location, all actual conveyance, cab, or transit expenses must be borne by the hirer and settled directly in cash with the attendant.',
    badge: 'Actuals in Cash to Attendant'
  },
  {
    id: 10,
    title: 'Legal Jurisdiction',
    category: 'legal',
    icon: 'Scale',
    originalText: 'All disputes subject to Delhi Jurisdiction.',
    explanation: 'Any disagreements, claims, or legal matters arising under this rental agreement fall under the exclusive jurisdiction of the Courts of Delhi, India.',
    badge: 'Delhi Jurisdiction Only'
  }
];

export const KEY_POLICY_HIGHLIGHTS = [
  {
    label: 'Standard Shift',
    value: '8 Hours',
    subtext: 'Billed from delivery; >10 hrs calculated hourly',
    color: 'purple'
  },
  {
    label: 'Booking Advance',
    value: '50% Upfront',
    subtext: 'Balance 50% cleared upon gear return',
    color: 'emerald'
  },
  {
    label: 'Crew Support',
    value: '1 Attendant',
    subtext: 'Namita Kamti attendant accompanies gear',
    color: 'blue'
  },
  {
    label: 'Territory',
    value: 'Delhi NCR',
    subtext: 'Outstation travel subject to +50% surcharge',
    color: 'amber'
  }
];
