export interface VerifyTask {
  id: string;
  img: string;
  label: string;
  contributor: string;
  categoryName: string;
  reward: string;
  xp: number;
  lat: string;
  lng: string;
  days: number;
  dist: string;
  group: 'forestry' | 'water' | 'fishing' | 'health';
}

export const VERIFY_GROUPS = {
  forestry: {
    id: 'forestry',
    label: 'Forestry and trees',
    count: 12
  },
  water: {
    id: 'water',
    label: 'Water conservation',
    count: 8
  },
  fishing: {
    id: 'fishing',
    label: 'Sustainable fishing',
    count: 15
  },
  health: {
    id: 'health',
    label: 'Community health',
    count: 5
  }
};

export const TASK_LIST: VerifyTask[] = [
  // Forestry
  { img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80', id: 'FR-001', label: 'Mangrove Planting', contributor: 'Mary Wambua', categoryName: 'Tree Survival', reward: '5.0', xp: 50, lat: '-1.29', lng: '36.82', days: 12, dist: '0.8', group: 'forestry' },
  { img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', id: 'FR-002', label: 'Forest Edge Protection', contributor: 'Peter Kamau', categoryName: 'Boundary Check', reward: '4.5', xp: 45, lat: '-1.29', lng: '36.81', days: 8, dist: '1.1', group: 'forestry' },
  
  // Water
  { img: 'https://images.unsplash.com/photo-1541620986708-cb6c13eb738f?w=800&q=80', id: 'WT-001', label: 'Lake Quality Sample', contributor: 'Samuel Otieno', categoryName: 'Water Test', reward: '8.0', xp: 80, lat: '-1.30', lng: '36.81', days: 2, dist: '2.2', group: 'water' },
  { img: 'https://images.unsplash.com/photo-1582218086036-7c9ebbf2de75?w=800&q=80', id: 'WT-002', label: 'Basin Cleanup', contributor: 'Grace Njeri', categoryName: 'Waste Removal', reward: '6.0', xp: 60, lat: '-1.29', lng: '36.82', days: 1, dist: '1.4', group: 'water' },

  // Fishing
  { img: 'https://images.unsplash.com/photo-1476510344464-9646b9a89cde?w=800&q=80', id: 'FS-001', label: 'Net Inspection', contributor: 'John Ochieng', categoryName: 'Legal Gear', reward: '7.5', xp: 75, lat: '-1.31', lng: '36.80', days: 5, dist: '4.1', group: 'fishing' },
  { img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', id: 'FS-002', label: 'Fish Market Tally', contributor: 'Faith Akinyi', categoryName: 'Yield Report', reward: '5.5', xp: 55, lat: '-1.28', lng: '36.83', days: 0, dist: '3.0', group: 'fishing' },

  // Health
  { img: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&q=80', id: 'HL-001', label: 'Clinic Setup', contributor: 'Dr. James Mwenda', categoryName: 'Infrastructure', reward: '10.0', xp: 100, lat: '-1.28', lng: '36.84', days: 14, dist: '3.5', group: 'health' },
];
