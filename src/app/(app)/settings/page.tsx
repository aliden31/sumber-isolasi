import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Pengaturan</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profil Perusahaan</CardTitle>
          <CardDescription>
            Atur informasi dasar mengenai usaha Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nama Perusahaan</Label>
            <Input id="company-name" placeholder="Contoh: Toko Kilat Sejahtera" defaultValue="Toko Kilat" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Alamat</Label>
            <Textarea id="company-address" placeholder="Masukkan alamat lengkap perusahaan" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="company-phone">Nomor Telepon</Label>
                <Input id="company-phone" placeholder="Contoh: 021-1234567" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <Input id="company-email" type="email" placeholder="Contoh: kontak@tokokilat.com" />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="logo">Logo Perusahaan</Label>
            <Input id="logo" type="file" />
            <p className="text-xs text-muted-foreground">Unggah logo Anda dalam format PNG atau JPG.</p>
          </div>
          <div className="flex justify-end">
             <Button>Simpan Perubahan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
