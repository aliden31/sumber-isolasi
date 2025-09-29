import type { NewProduct } from './types';

export const PRODUCTS_SEED_DATA: NewProduct[] = [
  // Alat Tulis Kantor
  {
    name: 'Pulpen Gel Hitam',
    category: 'ATK',
    price: 3000,
    cost: 1500,
    stock: 100,
  },
  {
    name: 'Buku Tulis Sidu 38',
    category: 'ATK',
    price: 4500,
    cost: 2500,
    stock: 50,
  },
  {
    name: 'Kertas HVS A4 70gr',
    category: 'ATK',
    price: 55000,
    cost: 45000,
    stock: 20,
  },
  {
    name: 'Sticky Notes Post-It',
    category: 'ATK',
    price: 15000,
    cost: 9000,
    stock: 30,
  },
  // Minuman
  {
    name: 'Air Mineral 600ml',
    category: 'Minuman',
    price: 3500,
    cost: 2000,
    stock: 80,
  },
  {
    name: 'Teh Kotak 250ml',
    category: 'Minuman',
    price: 4000,
    cost: 2800,
    stock: 60,
  },
  {
    name: 'Kopi Instan Sachet',
    category: 'Minuman',
    price: 1500,
    cost: 800,
    stock: 200,
  },
  // Makanan Ringan
  {
    name: 'Biskuit Roma Kelapa',
    category: 'Makanan',
    price: 8000,
    cost: 6000,
    stock: 40,
  },
];
