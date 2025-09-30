
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Data contoh statis
const sampleUsers = [
  { id: '1', name: 'Admin Utama', email: 'admin@tokokilat.com', role: 'Admin', status: 'Aktif' },
  { id: '2', name: 'Kasir Shift Pagi', email: 'kasir.pagi@tokokilat.com', role: 'Kasir', status: 'Aktif' },
  { id: '3', name: 'Kepala Gudang', email: 'gudang@tokokilat.com', role: 'Manajer Gudang', status: 'Aktif' },
  { id: '4', name: 'User Nonaktif', email: 'resign@tokokilat.com', role: 'Kasir', status: 'Nonaktif' },
];

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Pengguna & Hak Akses
        </h1>
        <Button disabled>
            <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna (Segera Hadir)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Kelola pengguna yang memiliki akses ke sistem aplikasi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Pengguna</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Peran (Role)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sampleUsers.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.status === 'Aktif' ? 'default' : 'outline'}>{user.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" disabled>
                                      <span className="sr-only">Buka menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                    <DropdownMenuItem disabled className="text-destructive">Hapus</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             <div className="text-center text-sm text-muted-foreground pt-8">
                Fungsionalitas penuh manajemen pengguna sedang dalam pengembangan.
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
