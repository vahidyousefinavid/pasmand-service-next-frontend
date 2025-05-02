'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme !== 'light') {
      setTheme('light');
    }
  }, [theme, setTheme]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      themes={['light', 'dark', 'modern', 'classic']}
    >
      {children}
    </ThemeProvider>
  );
}