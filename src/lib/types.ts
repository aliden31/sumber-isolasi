

export type Product = {
  id: string;
  name: string;
  price: number;
  cost: number; // Harga pokok produk
  stock: number;
  category: string;
  minStockThreshold?: number;
};

export type NewProduct = Omit<Product, 'id'>;

export type ProductCategory = {
  id: string;
  name: string;
  description: string;
};

export type NewProductCategory = Omit<ProductCategory, 'id'>;


export type TransactionItem = {
  productId: string;
  productName: string; // denormalized for easier display
  quantity: number;
  price: number;
  cost: number; // denormalized for COGS calculation
};

export type Transaction = {
  id: string;
  date: Date;
  items: TransactionItem[];
  total: number;
  paymentMethod: 'Tunai' | 'Transfer' | 'Kredit';
  status: 'Lunas' | 'Belum Lunas';
  customerId?: string;
  customerName?: string;
};

export type NewTransaction = Omit<Transaction, 'id' | 'date' | 'status'> & {
  date: Date | any; // Allow for server timestamp
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type ParkedTransaction = {
    id: string;
    name: string;
    cart: CartItem[];
    createdAt: any; // Firestore timestamp
}

export type NewParkedTransaction = Omit<ParkedTransaction, 'id'>;


export type SalesReturnItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  cost: number;
}

export type SalesReturn = {
  id: string;
  date: Date;
  originalTransactionId: string;
  items: SalesReturnItem[];
  total: number;
  originalPaymentMethod: 'Tunai' | 'Transfer' | 'Kredit';
}

export type NewSalesReturn = Omit<SalesReturn, 'id'>;


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

export type SalesMetric = {
  grossSales: number;
  totalTransactions: number;
  avgTransactionValue: number;
  productsSold: number;
};

export type ProductSalesSummary = {
  productId: string;
  productName: string;
  quantitySold: number;
  grossRevenue: number;
  grossProfit: number;
};

export type SalesTrendData = {
  date: string;
  total: number;
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


export type PurchaseRequestItem = {
  productId: string;
  productName: string;
  quantity: number;
};

export type PurchaseRequest = {
  id: string;
  date: Date;
  requestedBy: string;
  items: PurchaseRequestItem[];
  notes?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Processed';
};

export type NewPurchaseRequest = Omit<PurchaseRequest, 'id'>;


export type PurchaseOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  date: Date;
  items: PurchaseOrderItem[];
  total: number;
  status: 'Draft' | 'Sent' | 'Completed' | 'Cancelled';
  purchaseRequestId?: string;
};

export type NewPurchaseOrder = Omit<PurchaseOrder, 'id'>;

export type GoodsReceiptItem = {
    productId: string;
    productName: string;
    quantity: number; // Jumlah yang dipesan
    receivedQuantity: number;
    cost: number;
};

export type GoodsReceipt = {
    id: string;
    date: Date;
    purchaseOrderId: string;
    supplierId: string;
    supplierName: string;
    items: GoodsReceiptItem[];
    status: 'Pending Invoice' | 'Invoiced';
};

export type NewGoodsReceipt = Omit<GoodsReceipt, 'id' | 'date' | 'status'> & {
    date: Date | any;
};

export type SupplierInvoice = {
    id: string;
    date: Date;
    invoiceNumber: string;
    goodsReceiptId: string;
    purchaseOrderId: string;
    supplierId: string;
    supplierName: string;
    total: number;
    status: 'Unpaid' | 'Paid';
}

export type NewSupplierInvoice = Omit<SupplierInvoice, 'id' | 'status'> & {
  date: Date | any;
};

export type PurchasePayment = {
    id: string;
    date: Date;
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    paymentAccountId: string; // ID of the cash/bank account
}

export type NewPurchasePayment = Omit<PurchasePayment, 'id'>;


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

export type Warehouse = {
    id: string;
    name: string;
    address: string;
    isDefault: boolean;
};
export type NewWarehouse = Omit<Warehouse, 'id'>;

export type Tax = {
    id: string;
    name: string;
    rate: number; // in percent, e.g., 11 for 11%
    description: string;
};
export type NewTax = Omit<Tax, 'id'>;

export type Currency = {
    id: string;
    name: string;
    code: string; // e.g., USD, IDR
    symbol: string; // e.g., $, Rp
    exchangeRate: number; // relative to base currency
};
export type NewCurrency = Omit<Currency, 'id'>;
