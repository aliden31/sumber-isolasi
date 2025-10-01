"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TokoKilatLogo } from '@/components/icons/logo';

const CORRECT_PASSWORD = "123qwe";

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setError('');
      sessionStorage.setItem('isAuthenticated', 'true');
      toast({ title: "Berhasil masuk!" });
      router.push('/dashboard');
    } else {
      setError('Kata sandi salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <TokoKilatLogo />
          </div>
          <CardTitle className="font-headline text-2xl">Selamat Datang</CardTitle>
          <CardDescription>Silakan masukkan kata sandi untuk melanjutkan.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Masuk</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
