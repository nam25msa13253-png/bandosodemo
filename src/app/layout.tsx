import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings, siteUrl } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const st = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: st.meta_title, template: `%s | ${st.meta_title}` },
    description: st.meta_description,
    icons: st.logo_url ? { icon: st.logo_url } : undefined,
    openGraph: {
      title: st.meta_title,
      description: st.meta_description,
      images: st.banner_url ? [st.banner_url] : undefined,
      locale: "vi_VN",
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f3460",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
