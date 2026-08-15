import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import QueryProvider from '@/components/query-provider';
import PushRegister from '@/components/push-register';

// const defaultUrl = process.env.VERCEL_URL
//   ? `https://${process.env.VERCEL_URL}`
//   : "http://localhost:3000"

const APP_NAME = "شهر شهر | جمع‌آوران";
const APP_DEFAULT_TITLE = "شهر شهر — برنامهٔ جمع‌آوران";
const APP_TITLE_TEMPLATE = "%s | شهر شهر";
const APP_DESCRIPTION = "برنامهٔ خدمات‌دهندگان سامانهٔ خدمات شهری شهر شهر: دیدن درخواست‌های جمع‌آوری پسماند، پذیرش، توزین و تسویه.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#00613b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* The two faces the first screen paints in, fetched alongside the CSS
            rather than after it. Same self-hosted IRANSans as the citizen app. */}
        <link rel="preload" href="/fonts/iransans/IRANSansWeb.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/iransans/IRANSansWeb_Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-sans">
        <AuthProvider>
          <QueryProvider>
            <Providers>
              {children}
              <PushRegister />
              <Toaster />
            </Providers>
            </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}