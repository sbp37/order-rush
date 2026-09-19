export type DishKey = 'noodle' | 'wok' | 'fry' | 'griddle' | 'stew';

export interface Dish {
  key: DishKey;
  name: string;
  emoji: string;
  price: number;
  cookTime: number; // seconds
}

export const DISHES: Dish[] = [
  { key: 'noodle', name: '라면', emoji: '🍜', price: 7000, cookTime: 4 },
  { key: 'wok', name: '볶음', emoji: '🍳', price: 9000, cookTime: 5 },
  { key: 'fry', name: '후라이드', emoji: '🍗', price: 11000, cookTime: 6 },
  { key: 'griddle', name: '부침', emoji: '🥞', price: 8000, cookTime: 4.5 },
  { key: 'stew', name: '찌개', emoji: '🍲', price: 10000, cookTime: 5.5 },
];

export interface StationDef {
  dish: DishKey;
  label: string;
  /** GLB ids: idle -> cooking -> done */
  models: { idle: string; cooking: string; done: string };
  /** world position */
  x: number;
  z: number;
  /** on top of a workbench? */
  onBench: boolean;
}

export const STATIONS: StationDef[] = [
  {
    dish: 'noodle',
    label: '면 삶기',
    models: {
      idle: 'rounded-restaurant-noodle-boiler-empty',
      cooking: 'rounded-restaurant-noodle-boiler-baskets-loaded',
      done: 'rounded-restaurant-noodle-boiler-baskets-raised',
    },
    x: -3.4,
    z: -1.1,
    onBench: false,
  },
  {
    dish: 'fry',
    label: '튀김',
    models: {
      idle: 'rounded-restaurant-countertop-fryer-idle',
      cooking: 'rounded-restaurant-countertop-fryer-basket-food-loaded',
      done: 'rounded-restaurant-countertop-fryer-basket-raised',
    },
    x: -1.7,
    z: -1.15,
    onBench: true,
  },
  {
    dish: 'wok',
    label: '볶음',
    models: {
      idle: 'rounded-restaurant-wok-burner-empty-wok',
      cooking: 'rounded-restaurant-wok-burner-food-in-wok',
      done: 'rounded-restaurant-wok-burner-used-wok',
    },
    x: 0,
    z: -1.1,
    onBench: false,
  },
  {
    dish: 'griddle',
    label: '부침',
    models: {
      idle: 'rounded-restaurant-flat-griddle-clean',
      cooking: 'rounded-restaurant-flat-griddle-ingredients-loaded',
      done: 'rounded-restaurant-flat-griddle-cooked-food',
    },
    x: 1.7,
    z: -1.15,
    onBench: true,
  },
  {
    dish: 'stew',
    label: '찌개',
    models: {
      idle: 'rounded-restaurant-stock-pot-empty',
      cooking: 'rounded-restaurant-stock-pot-full',
      done: 'rounded-restaurant-stock-pot-covered',
    },
    x: 3.4,
    z: -1.15,
    onBench: true,
  },
];

export const GAME = {
  dayLength: 90, // seconds of service
  counterSlots: [-1.4, 0, 1.4], // x positions where customers stand at the counter
  counterZ: 1.05,
  doorPos: { x: 4.6, z: 4.6 },
  patienceStart: 26, // seconds, ramps down with day progress
  patienceMin: 14,
  spawnStart: 3.4, // seconds between arrivals at day start
  spawnMin: 1.5,
  comboWindow: 6, // seconds to keep combo alive
};
