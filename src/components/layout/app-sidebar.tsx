
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
      { href: "#", label: "Parkir Transaksi" },
      { href: "#", label: "Retur Penjualan" },
      { href: "#", label: "Cetak Struk" },
    ],
  },
  {
    label: "Penjualan",
    icon: CircleDollarSign,
    subItems: [
      { href: "/transactions", label: "Daftar Penjualan" },
      { href: "#", label: "Input Manual" },
      { href: "#", label: "Import Penjualan" },
      { href: "#", label: "Piutang Usaha" },
    ],
  },
  {
    label: "Pembelian",
    icon: Truck,
    subItems: [
      { href: "#", label: "Purchase Request (PR)" },
      { href: "#", label: "Purchase Order (PO)" },
      { href: "#", label: "Penerimaan Barang" },
      { href: "#", label: "Faktur Supplier" },
      { href: "#", label: "Hutang Usaha" },
    ],
  },
  {
    label: "Produk & Stok",
    icon: Package,
    subItems: [
      { href: "/products", label: "Master Produk" },
      { href: "#", label: "Kategori Produk" },
      { href: "#", label: "Multi Gudang" },
      { href: "#", label: "Transfer Stok" },
      { href: "/stock-estimation", label: "Stock Opname (AI)" },
    ],
  },
  {
    label: "Kas & Bank",
    icon: Landmark,
    subItems: [
      { href: "#", label: "Kas Masuk" },
      { href: "#", label: "Kas Keluar" },
      { href: "#", label: "Transfer Antar Kas" },
      { href: "#", label: "Rekonsiliasi Bank" },
    ],
  },
  {
    label: "Akuntansi",
    icon: Book,
    subItems: [
      { href: "#", label: "Chart of Accounts" },
      { href: "#", label: "Jurnal Umum" },
      { href: "#", label: "Buku Besar" },
    ],
  },
  {
    label: "Laporan",
    icon: BarChart2,
    subItems: [
      { href: "/reports", label: "Laporan Penjualan" },
      { href: "#", label: "Laporan Pembelian" },
      { href: "#", label: "Laporan Stok" },
      { href: "#", label: "Laporan Keuangan" },
    ],
  },
    {
    label: "Master Data",
    icon: History,
    subItems: [
      { href: "/customers", label: "Pelanggan" },
      { href: "#", label: "Supplier" },
      { href: "#", label: "Pengguna" },
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
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const isActive = (href: string) => pathname === href;
  const isSubActive = (subItems: any[]) =>
    subItems.some((item) => item.href && isActive(item.href));

  return (
    <Sidebar
      className={cn("border-r", isMobile ? "" : "md:block")}
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
