// SAMPLE DATA — fictional restaurants for testing the app.
// Locations are approximate points around Vernon, BC.
// In Phase 2 this comes from the backend, entered by restaurants on the website.

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  latitude: number;
  longitude: number;
  /** Allergen ids this restaurant has committed to accommodating. */
  accommodates: string[];
  crossContact: string;
  callAhead: boolean;
  notes: string;
  updated: string;
  /** Fictional test data. */
  isSample?: boolean;
};

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Green Leaf Bistro',
    cuisine: 'Cafe',
    address: '30th Ave, Downtown Vernon',
    latitude: 50.2671,
    longitude: -119.2720,
    accommodates: ['celery', 'garlic', 'onion', 'corn', 'gluten', 'milk', 'mustard'],
    crossContact: 'Separate prep area and utensils for allergy orders',
    callAhead: false,
    notes: 'Makes stocks and sauces in-house, so can leave out garlic, onion and celery',
    updated: '2026-10-28',
    isSample: true,
  },
  {
    id: '2',
    name: 'Kalamalka Grill',
    cuisine: 'Canadian',
    address: '25th Ave, Vernon',
    latitude: 50.2610,
    longitude: -119.2665,
    accommodates: ['alpha-gal', 'sulphites', 'tomato', 'nightshades', 'egg', 'soy'],
    crossContact: 'Dedicated grill for poultry and fish; red meat cooked separately',
    callAhead: true,
    notes: 'Please call ahead for alpha-gal so the kitchen can plan fryer oil',
    updated: '2026-10-15',
    isSample: true,
  },
  {
    id: '3',
    name: 'Okanagan Harvest Kitchen',
    cuisine: 'Farm-to-table',
    address: '32nd St, Vernon',
    latitude: 50.2735,
    longitude: -119.2752,
    accommodates: [
      'corn', 'coconut', 'avocado', 'banana', 'kiwi', 'stone-fruit', 'apple',
      'citrus', 'strawberry', 'sunflower', 'poppy', 'peanut', 'almond', 'cashew',
    ],
    crossContact: 'Nut-free kitchen; fruit allergies handled with separate cutting boards',
    callAhead: false,
    notes: 'Menu changes weekly — staff can list every ingredient on request',
    updated: '2026-11-02',
    isSample: true,
  },
  {
    id: '4',
    name: 'Swan Lake Noodle House',
    cuisine: 'Asian fusion',
    address: '27th St, Vernon',
    latitude: 50.2790,
    longitude: -119.2690,
    accommodates: ['sesame', 'soy', 'shrimp', 'crab', 'squid', 'buckwheat', 'lupin', 'chickpea'],
    crossContact: 'Shared woks are cleaned between allergy orders; fryer is shared',
    callAhead: true,
    notes: 'Buckwheat-free noodles available; sesame oil can be swapped',
    updated: '2026-09-30',
    isSample: true,
  },
  {
    id: '5',
    name: 'Silver Star Bakehouse',
    cuisine: 'Bakery & brunch',
    address: '35th Ave, Vernon',
    latitude: 50.2700,
    longitude: -119.2600,
    accommodates: ['egg', 'milk', 'lupin', 'pea', 'lentil', 'beans', 'mustard', 'sulphites'],
    crossContact: 'Flour is in the air — not suitable for severe wheat or gluten allergies',
    callAhead: false,
    notes: 'Labels every baked item with a full ingredient card',
    updated: '2026-10-20',
    isSample: true,
  },
];
