export const navItems = ['Live city', 'Routes', 'Signals', 'Insights'];

export const metrics = [
  { label: 'City traffic score', value: '82', suffix: '/100', trend: '+8.4%', icon: 'activity', tone: 'green' },
  { label: 'Vehicles in motion', value: '48,291', suffix: '', trend: '+2.1%', icon: 'car', tone: 'blue' },
  { label: 'Congestion index', value: '24', suffix: '%', trend: '−12.6%', icon: 'gauge', tone: 'amber' },
  { label: 'Avg. travel time', value: '18.4', suffix: ' min', trend: '−3.2 min', icon: 'clock', tone: 'purple' },
  { label: 'CO₂ avoided today', value: '2.8', suffix: ' t', trend: '+18.9%', icon: 'leaf', tone: 'green' }
];

export const routes = [
  { id: 'fastest', label: 'AI recommended', via: 'VIP Road · Polytechnic Sq.', time: '18 min', distance: '8.6 km', saving: 'Save 11 min', emission: '0.9 kg', color: '#5be7a9', points: '245,490 300,445 355,415 405,362 472,340 525,300 580,266 645,225 713,190', path: [] as string[] },
  { id: 'eco', label: 'Eco route', via: 'Lake View Rd · Roshanpura', time: '22 min', distance: '9.1 km', saving: '−22% CO₂', emission: '0.7 kg', color: '#62a8ff', points: '245,490 320,478 386,449 452,422 524,385 574,326 630,292 713,190', path: [] as string[] },
  { id: 'shortest', label: 'Shortest', via: 'Hamidia Rd · Peer Gate', time: '27 min', distance: '7.4 km', saving: 'Busy traffic', emission: '1.2 kg', color: '#ad8cff', points: '245,490 282,435 340,385 408,335 470,286 541,252 610,220 713,190', path: [] as string[] }
];

export const congestion = [
  { name: '08:00', actual: 42, predicted: 38 }, { name: '10:00', actual: 56, predicted: 52 },
  { name: '12:00', actual: 44, predicted: 49 }, { name: '14:00', actual: 61, predicted: 60 },
  { name: '16:00', actual: 74, predicted: 70 }, { name: '18:00', actual: 88, predicted: 92 },
  { name: '20:00', actual: 66, predicted: 70 }, { name: '22:00', actual: 38, predicted: 42 }
];

export const signals = [
  { name: 'Board Office Sq.', queue: 84, status: 'Optimize', gain: '−18%', tone: 'red' },
  { name: 'Roshanpura Sq.', queue: 62, status: 'Adaptive', gain: '−12%', tone: 'amber' },
  { name: 'Lalghati Circle', queue: 38, status: 'Balanced', gain: '−6%', tone: 'green' }
];
