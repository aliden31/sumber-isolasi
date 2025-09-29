
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Book,
  Building,
  ChevronDown,
  CircleDollarSign,
  Contact,
  FileText,
  History,
  Home,
  Landmark,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
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
      { href: "/pos", label: "Transaksi Baru" },
      { href: "/pos/parked", label: "Parkir Transaksi" },
      { href: "/pos/returns", label: "Retur Penjualan" },
    ],
  },
  {
    label: "Penjualan",
    icon: CircleDollarSign,
    subItems: [
      { href: "/sales", label: "Daftar Penjualan" },
      { href: "/sales/new", label: "Input Manual" },
      { href: "/sales/import", label: "Import Penjualan" },
      { href: "/sales/receivables", label: "Piutang Usaha" },
    ],
  },
  {
    label: "Pembelian",
    icon: Truck,
    subItems: [
      { href: "/purchases/request", label: "Purchase Request (PR)" },
      { href: "/purchases", label: "Purchase Order (PO)" },
      { href: "/purchases/grn", label: "Penerimaan Barang" },
      { href: "/purchases/invoices", label: "Faktur Supplier" },
      { href: "/purchases/payables", label: "Hutang Usaha" },
    ],
  },
  {
    label: "Produk & Stok",
    icon: Package,
    subItems: [
      { href: "/products", label: "Master Produk" },
      { href: "/products/categories", label: "Kategori Produk" },
      { href: "/stock/warehouses", label: "Multi Gudang" },
      { href: "/stock/transfers", label: "Transfer Stok" },
      { href: "/stock-estimation", label: "Stock Opname" },
    ],
  },
  {
    label: "Kas & Bank",
    icon: Landmark,
    subItems: [
      { href: "/cash/in", label: "Kas Masuk" },
      { href: "/cash/out", label: "Kas Keluar" },
      { href: "/cash/transfers", label: "Transfer Antar Kas" },
      { href: "/cash/reconciliation", label: "Rekonsiliasi Bank" },
    ],
  },
  {
    label: "Akuntansi",
    icon: Book,
    subItems: [
      { href: "/accounting/coa", label: "Chart of Accounts" },
      { href: "/accounting/journals", label: "Jurnal Umum" },
      { href: "/accounting/ledger", label: "Buku Besar" },
    ],
  },
  {
    label: "Laporan",
    icon: BarChart2,
    subItems: [
      { href: "/reports", label: "Laporan Penjualan" },
      { href: "/reports/purchases", label: "Laporan Pembelian" },
      { href: "/reports/stock", label: "Laporan Stok" },
      { href: "/reports/financial", label: "Laporan Keuangan" },
    ],
  },
    {
    label: "Master Data",
    icon: History,
    subItems: [
      { href: "/master/customers", label: "Pelanggan" },
      { href: "/master/suppliers", label: "Supplier" },
      { href: "/master/users", label: "Pengguna" },
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
  const { isMobile } = useSidebar();

  const isActive = (href: string) => pathname === href;
  const isSubActive = (subItems: any[]) =>
    subItems.some((item) => item.href && isActive(item.href));

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className={cn("border-r border-border/80", isMobile ? "" : "hidden md:block")}
    >
      <SidebarHeader className="hidden items-center gap-2 md:flex">
        <TokoKilatLogo className="size-8" />
        <span className="text-lg font-headline font-semibold text-primary">
          Toko Kilat
        </span>
        <SidebarTrigger className="ml-auto" />
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
                        <SidebarMenuSubItem key={subItem.href} asChild>
                          <Link href={subItem.href || "#"}>
                             <SidebarMenuSubButton
                              isActive={isActive(subItem.href || "#")}
                            >
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
