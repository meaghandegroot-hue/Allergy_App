// Draft list — have a dietitian or allergist review before launch.
// `priority` marks Health Canada priority allergens (already widely labelled).
// Unmarked ones are the app's focus: lesser-known allergens menus rarely mention.

export type AllergenGroup =
  | 'Nuts & seeds'
  | 'Dairy & egg'
  | 'Fish & shellfish'
  | 'Grains'
  | 'Legumes'
  | 'Fruit'
  | 'Vegetables'
  | 'Other';

export type Allergen = {
  id: string;
  name: string;
  group: AllergenGroup;
  priority: boolean;
};

const a = (id: string, name: string, group: AllergenGroup, priority = false): Allergen => ({
  id,
  name,
  group,
  priority,
});

export const allergens: Allergen[] = [
  a('peanut', 'Peanut', 'Nuts & seeds', true),
  a('almond', 'Almond', 'Nuts & seeds', true),
  a('brazil-nut', 'Brazil nut', 'Nuts & seeds', true),
  a('cashew', 'Cashew', 'Nuts & seeds', true),
  a('hazelnut', 'Hazelnut', 'Nuts & seeds', true),
  a('macadamia', 'Macadamia', 'Nuts & seeds', true),
  a('pecan', 'Pecan', 'Nuts & seeds', true),
  a('pine-nut', 'Pine nut', 'Nuts & seeds', true),
  a('pistachio', 'Pistachio', 'Nuts & seeds', true),
  a('walnut', 'Walnut', 'Nuts & seeds', true),
  a('sesame', 'Sesame', 'Nuts & seeds', true),
  a('sunflower', 'Sunflower seed', 'Nuts & seeds'),
  a('poppy', 'Poppy seed', 'Nuts & seeds'),

  a('milk', 'Milk / dairy', 'Dairy & egg', true),
  a('egg', 'Egg', 'Dairy & egg', true),

  a('fish', 'Fish', 'Fish & shellfish', true),
  a('shrimp', 'Shrimp / prawn', 'Fish & shellfish', true),
  a('crab', 'Crab', 'Fish & shellfish', true),
  a('lobster', 'Lobster', 'Fish & shellfish', true),
  a('clam', 'Clam', 'Fish & shellfish', true),
  a('mussel', 'Mussel', 'Fish & shellfish', true),
  a('oyster', 'Oyster', 'Fish & shellfish', true),
  a('scallop', 'Scallop', 'Fish & shellfish', true),
  a('squid', 'Squid / octopus', 'Fish & shellfish', true),

  a('wheat', 'Wheat / triticale', 'Grains', true),
  a('gluten', 'Gluten (wheat, barley, rye, oats)', 'Grains', true),
  a('corn', 'Corn', 'Grains'),
  a('buckwheat', 'Buckwheat', 'Grains'),

  a('soy', 'Soy', 'Legumes', true),
  a('lupin', 'Lupin', 'Legumes'),
  a('chickpea', 'Chickpea', 'Legumes'),
  a('lentil', 'Lentil', 'Legumes'),
  a('pea', 'Pea', 'Legumes'),
  a('beans', 'Other beans', 'Legumes'),

  a('kiwi', 'Kiwi', 'Fruit'),
  a('banana', 'Banana', 'Fruit'),
  a('avocado', 'Avocado', 'Fruit'),
  a('strawberry', 'Strawberry', 'Fruit'),
  a('stone-fruit', 'Peach / stone fruit', 'Fruit'),
  a('apple', 'Apple', 'Fruit'),
  a('citrus', 'Citrus', 'Fruit'),
  a('coconut', 'Coconut', 'Fruit'),

  a('celery', 'Celery', 'Vegetables'),
  a('tomato', 'Tomato', 'Vegetables'),
  a('nightshades', 'Nightshades (potato, peppers, eggplant)', 'Vegetables'),
  a('garlic', 'Garlic', 'Vegetables'),
  a('onion', 'Onion', 'Vegetables'),

  a('mustard', 'Mustard', 'Other', true),
  a('sulphites', 'Sulphites', 'Other', true),
  a('alpha-gal', 'Red meat (alpha-gal)', 'Other'),
];

export const allergenGroups: AllergenGroup[] = [
  'Nuts & seeds',
  'Dairy & egg',
  'Fish & shellfish',
  'Grains',
  'Legumes',
  'Fruit',
  'Vegetables',
  'Other',
];

const byId = new Map(allergens.map((x) => [x.id, x]));

export function allergenName(id: string): string {
  return byId.get(id)?.name ?? id;
}
