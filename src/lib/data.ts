import type { Product, Transaction, SalesData, TopProductData, MonthlyRevenue, Customer } from './types';

export const mockProducts: Product[] = [
  { id: 'PROD001', name: 'Kopi Arabika', price: 55000, stock: 48, category: 'Minuman' },
  { id: 'PROD002', name: 'Roti Gandum', price: 25000, stock: 120, category: 'Roti' },
  { id: 'PROD003', name: 'Susu UHT Full Cream 1L', price: 18000, stock: 80, category: 'Susu' },
  { id: 'PROD004', name: 'Teh Melati', price: 12000, stock: 7, category: 'Minuman' },
  { id: 'PROD005', name: 'Keju Cheddar', price: 32000, stock: 60, category: 'Susu' },
  { id: 'PROD006', name: 'Croissant Coklat', price: 15000, stock: 95, category: 'Roti' },
  { id: 'PROD007', name: 'Jus Jeruk 1L', price: 28000, stock: 4, category: 'Minuman' },
  { id: 'PROD008', name: 'Yogurt Plain', price: 14000, stock: 45, category: 'Susu' },
  { id: 'PROD009', name: 'Donat Gula', price: 8000, stock: 150, category: 'Roti' },
  { id: 'PROD010', name: 'Air Mineral 600ml', price: 3500, stock: 200, category: 'Minuman' },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'TRX001',
    date: new Date('2024-07-28T10:30:00'),
    items: [
      { productId: 'PROD001', quantity: 1, price: 55000 },
      { productId: 'PROD002', quantity: 2, price: 25000 },
    ],
    total: 105000,
    paymentMethod: 'Tunai',
  },
  {
    id: 'TRX002',
    date: new Date('2024-07-28T11:15:00'),
    items: [{ productId: 'PROD003', quantity: 3, price: 18000 }],
    total: 54000,
    paymentMethod: 'Transfer',
  },
  {
    id: 'TRX003',
    date: new Date('2024-07-27T14:00:00'),
    items: [
      { productId: 'PROD004', quantity: 5, price: 12000 },
      { productId: 'PROD009', quantity: 10, price: 8000 },
    ],
    total: 140000,
    paymentMethod: 'Tunai',
  },
  {
    id: 'TRX004',
    date: new Date('2024-07-26T09:00:00'),
    items: [
        { productId: 'PROD006', quantity: 4, price: 15000 },
        { productId: 'PROD001', quantity: 2, price: 55000 },
    ],
    total: 170000,
    paymentMethod: 'Transfer',
  },
    {
    id: 'TRX005',
    date: new Date(),
    items: [
        { productId: 'PROD007', quantity: 2, price: 28000 },
    ],
    total: 56000,
    paymentMethod: 'Tunai',
  },
];

export const mockWeeklySales: SalesData[] = [
    { day: 'Sen', total: 350000 },
    { day: 'Sel', total: 420000 },
    { day: 'Rab', total: 390000 },
    { day: 'Kam', total: 510000 },
    { day: 'Jum', total: 680000 },
    { day: 'Sab', total: 820000 },
    { day: 'Min', total: 750000 },
];


export const mockTopProducts: TopProductData[] = [
  { name: 'Kopi Arabika', sold: 150 },
  { name: 'Donat Gula', sold: 320 },
  { name: 'Roti Gandum', sold: 120 },
  { name: 'Air Mineral 600ml', sold: 500 },
  { name: 'Susu UHT Full Cream 1L', sold: 210 },
];

export const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 15000000 },
  { month: 'Feb', revenue: 18000000 },
  { month: 'Mar', revenue: 22000000 },
  { month: 'Apr', revenue: 19000000 },
  { month: 'Mei', revenue: 25000000 },
  { month: 'Jun', revenue: 28000000 },
];

export const mockCustomers: Customer[] = [
  { id: 'CUST001', name: 'Budi Santoso', phone: '081234567890', email: 'budi.s@example.com' },
  { id: 'CUST002', name: 'Citra Lestari', phone: '085678901234', email: 'citra.l@example.com' },
  { id: 'CUST003', name: 'Adi Prasetyo', phone: '087812345678', email: 'adi.p@example.com' },
  { id: 'CUST004', name: 'Dewi Anggraini', phone: '089956781234', email: 'dewi.a@example.com' },
];
