import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { getSettings } from '@/actions/settings';

// Helper to convert hex to HSL string
const hexToHslString = (hex: string | undefined): string | undefined => {
    if (!hex) return undefined;
    hex = hex.replace(/^#/, '');
    // Handle short hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `${h} ${s}% ${l}%`;
};


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.appName || 'Staff Hub',
    description: settings.appDescription || 'An application for employee management.',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  
  const customStyles = {
    '--primary': hexToHslString(settings.primaryColor),
    '--background': hexToHslString(settings.backgroundColor),
    '--accent': hexToHslString(settings.accentColor),
    // Define other colors based on the main ones if needed, or use defaults
  };

  return (
    <html lang={settings.language || 'id'} suppressHydrationWarning>
      <head>
        {settings.logo && <link rel="icon" href={settings.logo} type="image/x-icon" sizes="any" />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" style={customStyles as React.CSSProperties}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
