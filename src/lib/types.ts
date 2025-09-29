export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
};

export type TransactionItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type Transaction = {
  id: string;
  date: Date;
  items: TransactionItem[];
  total: number;
  paymentMethod: 'Tunai' | 'Transfer';
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type SalesData = {
  day: string;
  total: number;
};

export type TopProductData = {
  name: string;
  sold: number;
};

export type MonthlyRevenue = {
  month: string;
  revenue: number;
};
