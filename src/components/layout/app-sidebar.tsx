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

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-border/80"
    >
      <SidebarHeader className="flex items-center gap-2">
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
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
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
