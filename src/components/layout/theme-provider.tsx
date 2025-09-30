'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { THEMES } from '@/lib/themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider 
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={THEMES.map(t => t.name)}
            {...props}
        >
            {children}
        </NextThemesProvider>;
}
