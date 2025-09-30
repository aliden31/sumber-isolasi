
import type { NewProduct } from './types';

export const PRODUCTS_SEED_DATA: NewProduct[] = [
  // Alat Tulis Kantor
  {
    name: 'Pulpen Gel Hitam',
    category: 'ATK',
    stock: 100,
    baseUnit: 'Pcs',
    units: [
      { name: 'Pcs', price: 3000, cost: 1500, conversionRate: 1 },
      { name: 'Lusin', price: 34000, cost: 17000, conversionRate: 12 },
    ],
  },
  {
    name: 'Buku Tulis Sidu 38',
    category: 'ATK',
    stock: 50,
    baseUnit: 'Buku',
    units: [
        { name: 'Buku', price: 4500, cost: 2500, conversionRate: 1 },
        { name: 'Pak', price: 42000, cost: 24000, conversionRate: 10 },
    ],
  },
  {
    name: 'Kertas HVS A4 70gr',
    category: 'ATK',
    stock: 20,
    baseUnit: 'Rim',
    units: [
      { name: 'Rim', price: 55000, cost: 45000, conversionRate: 1 },
    ],
  },
  {
    name: 'Sticky Notes Post-It',
    category: 'ATK',
    stock: 30,
    baseUnit: 'Pad',
    units: [
      { name: 'Pad', price: 15000, cost: 9000, conversionRate: 1 },
    ],
  },
  // Minuman
  {
    name: 'Air Mineral 600ml',
    category: 'Minuman',
    stock: 80,
    baseUnit: 'Botol',
    units: [
      { name: 'Botol', price: 3500, cost: 2000, conversionRate: 1 },
      { name: 'Dus', price: 78000, cost: 45000, conversionRate: 24 },
    ],
  },
  {
    name: 'Teh Kotak 250ml',
    category: 'Minuman',
    stock: 60,
    baseUnit: 'Pcs',
    units: [
        { name: 'Pcs', price: 4000, cost: 2800, conversionRate: 1 },
    ]
  },
  {
    name: 'Kopi Instan Sachet',
    category: 'Minuman',
    stock: 200,
    baseUnit: 'Sachet',
    units: [
      { name: 'Sachet', price: 1500, cost: 800, conversionRate: 1 },
      { name: 'Renteng', price: 14000, cost: 7500, conversionRate: 10 },
    ],
  },
  // Makanan Ringan
  {
    name: 'Biskuit Roma Kelapa',
    category: 'Makanan',
    stock: 40,
    baseUnit: 'Bungkus',
    units: [
      { name: 'Bungkus', price: 8000, cost: 6000, conversionRate: 1 },
    ],
  },
];
