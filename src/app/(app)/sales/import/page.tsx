
'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ImportMarketplacePage() {
  return (
     <PlaceholderPage 
        title="Impor Penjualan dari Marketplace"
        description="Fitur ini akan memungkinkan Anda untuk mengunggah file laporan penjualan dari platform seperti Tokopedia, Shopee, atau TikTok Shop. Sistem akan secara otomatis mem-parsing file tersebut, mencocokkan produk, dan membuat transaksi penjualan beserta jurnal akuntansinya. Ini akan menghemat waktu dan mengurangi kesalahan input manual."
    />
  );
}
