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

export type NewTransaction = Omit<Transaction, 'id' | 'date'> & {
  date: Date | any; // Allow for server timestamp
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

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  date: Date;
  items: TransactionItem[];
  total: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
};

export type NewPurchaseOrder = Omit<PurchaseOrder, 'id'>;

export type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
};

export type NewAccount = Omit<Account, 'id'>;

export type JournalEntry = {
  accountId: string;
  accountName: string; // Denormalized for display
  debit: number;
  credit: number;
};

export type Journal = {
  id: string;
  date: Date;
  refNumber: string;
  description: string;
  entries: JournalEntry[];
  total: number;
};

export type NewJournal = Omit<Journal, 'id' | 'date'> & {
  date: Date | any; // Allow for server timestamp
};