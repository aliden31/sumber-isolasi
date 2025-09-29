

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Book,
  ChevronDown,
  CircleDollarSign,
  Contact,
  FileText,
  History,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Landmark,
  BrainCircuit,
  PackageSearch,
  Warehouse,
  ArrowRightLeft,
  ClipboardCheck,
  Bell,
  Banknote,
  LogOut,
  RefreshCcw,
  BookUser,
  FileDigit,
  FileSpreadsheet,
  Handshake,
  FilePlus,
  PackagePlus,
  PackageCheck,
  FileKey2,
  ReceiptText,
  Factory,
  CreditCard,
  FileBox,
  FileClock,
  Printer,
  FileUp,
  Download,
  BookCopy,
  BookLock,
  Archive,
  Building,
  UserCheck,
  Percent,
  Coins
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TokoKilatLogo } from "../icons/logo";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    label: "Kasir (POS)",
    icon: ShoppingCart,
    subItems: [
      { href: "/pos", label: "Transaksi Baru", icon: FilePlus },
      { href: "/pos/parked", label: "Parkir Transaksi", icon: FileClock },
      { href: "/sales/returns", label: "Retur Penjualan", icon: ArrowRightLeft },
      { href: "/pos/print", label: "Cetak Struk", icon: Printer },
    ],
  },
  {
    label: "Penjualan",
    icon: CircleDollarSign,
    subItems: [
      { href: "/transactions", label: "Daftar Penjualan", icon: History },
      { href: "/sales/manual-input", label: "Input Manual", icon: FileDigit },
      { href: "/sales/import", label: "Import Penjualan", icon: FileUp },
      { href: "/sales/receivables", label: "Piutang Usaha", icon: Handshake },
    ],
  },
  {
    label: "Pembelian",
    icon: Truck,
    subItems: [
      { href: "/purchasing/request", label: "Purchase Request", icon: FilePlus },
      { href: "/purchasing/order", label: "Purchase Order", icon: PackagePlus },
      { href: "/purchasing/goods-receipt", label: "Penerimaan Barang", icon: PackageCheck },
      { href: "/purchasing/invoice", label: "Faktur Supplier", icon: FileKey2 },
      { href: "/purchasing/returns", label: "Retur Pembelian", icon: ArrowRightLeft },
      { href: "/purchasing/payables", label: "Hutang Usaha", icon: Handshake },
    ],
  },
  {
    label: "Produk & Stok",
    icon: Package,
    subItems: [
      { href: "/products", label: "Master Produk", icon: Package },
      { href: "/products/categories", label: "Kategori Produk", icon: BookUser },
      { href: "/stock/warehouses", label: "Multi Gudang", icon: Warehouse },
      { href: "/stock/transfer", label: "Transfer Stok", icon: ArrowRightLeft },
      { href: "/stock-estimation", label: "Stock Opname", icon: ClipboardCheck },
      { href: "/stock/notifications", label: "Notifikasi Stok", icon: Bell },
    ],
  },
  {
    label: "Kas & Bank",
    icon: Landmark,
    subItems: [
      { href: "/cash/in", label: "Kas Masuk", icon: Banknote },
      { href: "/cash/out", label: "Kas Keluar", icon: LogOut },
      { href: "/cash/transfer", label: "Transfer Antar Kas", icon: ArrowRightLeft },
      { href: "/cash/reconciliation", label: "Rekonsiliasi Bank", icon: RefreshCcw },
    ],
  },
  {
    label: "Akuntansi",
    icon: Book,
    subItems: [
      { href: "/accounting/coa", label: "Chart of Accounts", icon: FileSpreadsheet },
      { href: "/accounting/journal", label: "Jurnal Umum", icon: FileDigit },
      { href: "/srcs/app/(app)/accounting/ledger", label: "Buku Besar", icon: BookCopy },
      { href: "/accounting/closing", label: "Closing Periode", icon: BookLock },
    ],
  },
  {
    label: "Laporan",
    icon: BarChart2,
    subItems: [
      { href: "/reports", label: "Laporan Penjualan" },
      { href: "/reports/purchasing", label: "Laporan Pembelian" },
      { href: "/reports/stock", label: "Laporan Stok" },
      { href: "/reports/financial", label: "Laporan Keuangan" },
    ],
  },
    {
    label: "Master Data",
    icon: Archive,
    subItems: [
      { href: "/customers", label: "Pelanggan", icon: Users },
      { href: "/suppliers", label: "Supplier", icon: Factory },
      { href: "/users", label: "Pengguna & Hak Akses", icon: UserCheck },
      { href: "/taxes", label: "Pajak", icon: Percent },
      { href: "/currencies", label: "Mata Uang", icon: Coins },
    ],
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Pengaturan",
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;
  const isSubActive = (subItems: any[]) =>
    subItems.some((item) => item.href && isActive(item.href));

  return (
    <Sidebar
      className="border-r"
    >
      <SidebarHeader className="flex items-center gap-2">
        <TokoKilatLogo className="size-8" />
        <span className="text-lg font-headline font-semibold text-primary">
          Toko Kilat
        </span>
      </SidebarHeader>
        <SidebarContent>
        <SidebarMenu>
          {navItems.map((item, index) =>
            item.subItems ? (
              <SidebarMenuItem key={`${item.label}-${index}`} asChild>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="w-full justify-between font-headline"
                      isActive={isSubActive(item.subItems)}
                       tooltip={{
                        children: item.label,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <Link href={subItem.href || "#"}>
                             <SidebarMenuSubButton
                              isActive={isActive(subItem.href || "#")}
                            >
                              {subItem.icon && <subItem.icon />}
                              <span>{subItem.label}</span>
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href || "#"}>
                  <SidebarMenuButton
                    isActive={isActive(item.href || "#")}
                    tooltip={{
                      children: item.label,
                    }}
                    className="font-headline"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
