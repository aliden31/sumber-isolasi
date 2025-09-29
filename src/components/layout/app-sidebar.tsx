"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Bot,
  History,
  LayoutDashboard,
  Package,
  ShoppingCart,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TokoKilatLogo } from "../icons/logo";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pos", icon: ShoppingCart, label: "Point of Sale" },
  { href: "/products", icon: Package, label: "Produk" },
  { href: "/transactions", icon: History, label: "Transaksi" },
  { href: "/reports", icon: BarChart2, label: "Laporan" },
  { href: "/stock-estimation", icon: Bot, label: "Estimasi Stok" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

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
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
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
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
