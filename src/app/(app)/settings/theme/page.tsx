

'use client';

import { useState, useTransition, useEffect } from 'react';
import { Check, Moon, Palette, Sun, Save, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { THEMES } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

export default function ThemeSettingsPage() {
  const { setTheme, theme: activeTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedTheme, setSelectedTheme] = useState(activeTheme);

  useEffect(() => {
    setSelectedTheme(activeTheme);
  }, [activeTheme]);

  const handleSave = () => {
    startTransition(() => {
      setTheme(selectedTheme || 'theme-samudra');
      toast({
        title: 'Tema Disimpan',
        description: 'Tampilan aplikasi telah berhasil diperbarui.',
      });
    });
  };
  
  const hasChanges = activeTheme !== selectedTheme;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Pilih Tema</CardTitle>
          <CardDescription>
            Sesuaikan tampilan aplikasi dengan memilih skema warna dan tipografi di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {THEMES.map(theme => {
            const isSelected = selectedTheme === theme.name;
            return (
              <div key={theme.name} className="flex flex-col items-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'h-24 w-full justify-start rounded-lg border-2 p-4',
                                    isSelected && 'border-primary'
                                )}
                                onClick={() => setSelectedTheme(theme.name)}
                            >
                                <div className="flex flex-col gap-2 items-start">
                                    {theme.colors.map((color, index) => (
                                        <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <div
                                                className="h-4 w-4 rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-sans">Font Headline: {theme.headlineFont}</p>
                            <p className="font-sans">Font Body: {theme.bodyFont}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-2">
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                    <span className="text-sm font-medium">{theme.label}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
         <CardFooter className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending || !hasChanges}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Perubahan
            </Button>
        </CardFooter>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Mode Tampilan</CardTitle>
          <CardDescription>
            Pilih antara mode terang, gelap, atau mengikuti pengaturan sistem Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
           <Button variant={resolvedTheme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" /> Terang
            </Button>
            <Button variant={resolvedTheme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" /> Gelap
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
