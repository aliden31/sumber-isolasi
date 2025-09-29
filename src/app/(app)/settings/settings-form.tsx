'use client';

import React, { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { CompanySettings, updateCompanySettings } from './actions';

export function SettingsForm({ initialData }: { initialData: CompanySettings }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [companyName, setCompanyName] = useState(initialData.companyName || "Toko Kilat");
  const [address, setAddress] = useState(initialData.address || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");

  const handleSaveChanges = () => {
    startTransition(async () => {
      const result = await updateCompanySettings({
        companyName,
        address,
        phone,
        email,
      });

      if (result.error) {
        toast({
          title: "Gagal Menyimpan",
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: "Pengaturan Disimpan",
          description: "Informasi perusahaan telah berhasil diperbarui.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="company-name">Nama Perusahaan</Label>
            <Input 
              id="company-name" 
              placeholder="Contoh: Toko Kilat Sejahtera" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Alamat</Label>
            <Textarea 
              id="company-address" 
              placeholder="Masukkan alamat lengkap perusahaan"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="company-phone">Nomor Telepon</Label>
                <Input 
                  id="company-phone" 
                  placeholder="Contoh: 021-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <Input 
                  id="company-email" 
                  type="email" 
                  placeholder="Contoh: kontak@tokokilat.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="logo">Logo Perusahaan</Label>
            <Input id="logo" type="file" disabled={isPending}/>
            <p className="text-xs text-muted-foreground">Unggah logo Anda dalam format PNG atau JPG. Fitur ini belum diimplementasikan.</p>
          </div>
          <div className="flex justify-end">
             <Button onClick={handleSaveChanges} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Perubahan
             </Button>
          </div>
    </div>
  );
}
