

export type Product = {
  id: string;
  name: string;
  price: number;
  cost: number; // Harga pokok produk
  stock: number;
  category: string;
};

export type NewProduct = Omit<Product, 'id'>;

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

export type ProcurementItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
};

export type PurchaseRequestStatus =
  | 'Draft'
  | 'Menunggu Persetujuan'
  | 'Disetujui'
  | 'Ditolak';

export type PurchaseRequest = {
  id: string;
  number: string;
  requestedBy: string;
  department: string;
  neededBy?: string;
  notes?: string;
  createdAt: string;
  status: PurchaseRequestStatus;
  items: ProcurementItem[];
};

export type PurchaseOrderStatus =
  | 'Draft'
  | 'Dikirim ke Pemasok'
  | 'Diterima Parsial'
  | 'Selesai'
  | 'Dibatalkan';

export type ProcurementOrderItem = ProcurementItem & {
  unitPrice: number;
};

export type LocalPurchaseOrder = {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  requestNumber?: string;
  orderDate: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
  notes?: string;
  items: ProcurementOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
};

export type GoodsReceiptStatus = 'Draft' | 'Diposting';

export type GoodsReceiptItem = {
  productId: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
};

export type GoodsReceipt = {
  id: string;
  number: string;
  supplierName: string;
  receiptDate: string;
  purchaseOrderNumber: string;
  status: GoodsReceiptStatus;
  notes?: string;
  items: GoodsReceiptItem[];
};

export type PurchaseInvoiceStatus =
  | 'Draft'
  | 'Belum Dibayar'
  | 'Sebagian Dibayar'
  | 'Lunas';

export type PurchaseInvoice = {
  id: string;
  number: string;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  referenceNumbers: string[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: PurchaseInvoiceStatus;
  notes?: string;
};

export type PurchaseReturn = {
  id: string;
  number: string;
  supplierName: string;
  referenceNumber: string;
  returnDate: string;
  total: number;
  reason: string;
};

export type PayableStatus =
  | 'Belum Jatuh Tempo'
  | 'Jatuh Tempo'
  | 'Lewat Jatuh Tempo'
  | 'Lunas';

export type PayableSummary = {
  invoiceId: string;
  invoiceNumber: string;
  supplierName: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: PayableStatus;
};

export type Warehouse = {
  id: string;
  name: string;
  type: 'Gudang' | 'Toko' | 'Retur';
  address: string;
  notes?: string;
};

export type StockTransferStatus = 'Draft' | 'Dikirim' | 'Diterima';

export type StockTransferItem = {
  productId: string;
  productName: string;
  quantity: number;
};

export type StockTransfer = {
  id: string;
  reference: string;
  date: string;
  fromWarehouse: string;
  toWarehouse: string;
  status: StockTransferStatus;
  items: StockTransferItem[];
  notes?: string;
};

export type StockOpnameStatus = 'Draft' | 'Berlangsung' | 'Selesai';

export type StockOpnameLine = {
  productId: string;
  productName: string;
  systemQty: number;
  countedQty: number;
};

export type StockOpnameSession = {
  id: string;
  reference: string;
  warehouse: string;
  scheduledDate: string;
  status: StockOpnameStatus;
  notes?: string;
  lines: StockOpnameLine[];
};

export type StockNotificationRule = {
  id: string;
  productId: string;
  productName: string;
  minStock: number;
  emailNotification: boolean;
  lastNotifiedAt?: string | null;
};

export type ProductCategory = {
  id: string;
  name: string;
  description?: string;
  color: string;
  productIds: string[];
};

export type BankStatementLine = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Debit' | 'Kredit';
  matched: boolean;
  referenceId?: string;
};

export type BankReconciliation = {
  id: string;
  accountName: string;
  period: string;
  startingBalance: number;
  endingBalance: number;
  difference: number;
  lines: BankStatementLine[];
  notes?: string;
};

export type ClosingTask = {
  id: string;
  title: string;
  owner: string;
  completed: boolean;
  notes?: string;
};

export type PeriodClosing = {
  id: string;
  period: string;
  startedAt: string;
  closedAt?: string;
  tasks: ClosingTask[];
};
