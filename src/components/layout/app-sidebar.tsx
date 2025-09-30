

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
  Coins,
  SlidersHorizontal,
  DatabaseZap,
  Wrench
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
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
      { href: "/pos/returns", label: "Retur Penjualan", icon: ArrowRightLeft },
      { href: "/pos/print", label: "Cetak Ulang Struk", icon: Printer },
    ],
  },
  {
    label: "Penjualan",
    icon: CircleDollarSign,
    subItems: [
      { href: "/transactions", label: "Riwayat Transaksi", icon: History },
      { href: "/sales/manual-input", label: "Input Manual", icon: FileDigit },
      { href: "/sales/import", label: "Impor Penjualan", icon: FileUp, isDev: true },
      { href: "/sales/receivables", label: "Piutang Usaha", icon: Handshake },
      { href: "/sales/returns", label: "Retur Penjualan", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Pembelian",
    icon: Truck,
    subItems: [
      { href: "/purchasing/request", label: "Permintaan Pembelian", icon: FilePlus, isDev: true },
      { href: "/purchasing/order", label: "Pesanan Pembelian", icon: PackagePlus },
      { href: "/purchasing/goods-receipt", label: "Penerimaan Barang", icon: PackageCheck },
      { href: "/purchasing/invoice", label: "Faktur Pemasok", icon: FileKey2, isDev: true },
      { href: "/purchasing/returns", label: "Retur Pembelian", icon: ArrowRightLeft, isDev: true },
      { href: "/purchasing/payables", label: "Utang Usaha", icon: Handshake, isDev: true },
    ],
  },
  {
    label: "Produk & Stok",
    icon: Package,
    subItems: [
      { href: "/products", label: "Master Produk", icon: Package },
      { href: "/products/categories", label: "Kategori Produk", icon: BookUser, isDev: true },
      { href: "/stock/warehouses", label: "Multi-Gudang", icon: Warehouse, isDev: true },
      { href: "/stock/transfer", label: "Transfer Stok", icon: ArrowRightLeft, isDev: true },
      { href: "/stock/opname", label: "Penyesuaian Stok", icon: ClipboardCheck, isDev: true },
      { href: "/stock-estimation", label: "Estimasi Stok (AI)", icon: BrainCircuit },
      { href: "/stock/notifications", label: "Notifikasi Stok", icon: Bell, isDev: true },
    ],
  },
  {
    label: "Kas & Bank",
    icon: Landmark,
    subItems: [
      { href: "/cash/in", label: "Kas Masuk", icon: Banknote },
      { href: "/cash/out", label: "Kas Keluar", icon: LogOut },
      { href: "/cash/transfer", label: "Transfer Antar Kas", icon: ArrowRightLeft },
      { href: "/cash/reconciliation", label: "Rekonsiliasi Bank", icon: RefreshCcw, isDev: true },
    ],
  },
  {
    label: "Akuntansi",
    icon: Book,
    subItems: [
      { href: "/accounting/coa", label: "Bagan Akun (COA)", icon: FileSpreadsheet },
      { href: "/accounting/journal", label: "Jurnal Umum", icon: FileDigit },
      { href: "/accounting/ledger", label: "Buku Besar", icon: BookCopy },
      { href: "/accounting/closing", label: "Tutup Buku", icon: BookLock, isDev: true },
    ],
  },
  {
    label: "Laporan",
    icon: BarChart2,
    subItems: [
      { href: "/reports", label: "Laporan Penjualan", icon: FileText, isDev: true },
      { href: "/reports/purchasing", label: "Laporan Pembelian", icon: FileText, isDev: true },
      { href: "/reports/stock", label: "Laporan Stok", icon: FileText, isDev: true },
      { href: "/reports/financial", label: "Laporan Keuangan", icon: FileText },
    ],
  },
    {
    label: "Master Data",
    icon: Archive,
    subItems: [
      { href: "/customers", label: "Pelanggan", icon: Users },
      { href: "/suppliers", label: "Pemasok", icon: Factory },
      { href: "/users", label: "Pengguna & Hak Akses", icon: UserCheck, isDev: true },
      { href: "/taxes", label: "Pajak", icon: Percent, isDev: true },
      { href: "/currencies", label: "Mata Uang", icon: Coins, isDev: true },
    ],
  },
  {
    label: "Pengaturan",
    icon: Settings,
    subItems: [
      { href: "/settings", label: "Profil Perusahaan", icon: Building },
      { href: "/settings/accounting", label: "Akuntansi", icon: SlidersHorizontal },
      { href: "/settings/danger", label: "Data & Reset", icon: DatabaseZap },
    ],
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
              <SidebarMenuItem key={`${item.label}-${index}`}>
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
                               {subItem.isDev && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Wrench className="ml-auto h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" align="center">
                                    <p>Dalam Pengembangan</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
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
