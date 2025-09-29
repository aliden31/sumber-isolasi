export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
};

export type NewProduct = Omit<Product, 'id'>;

export type TransactionItem = {
  productId: string;
  productName: string; // denormalized for easier display
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

export type NewTransaction = Omit<Transaction, 'id'>;

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

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export type NewCustomer = Omit<Customer, 'id'>;

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type NewSupplier = Omit<Supplier, 'id'>;
