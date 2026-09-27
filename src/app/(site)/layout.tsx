import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const st = await getSettings();
  return (
    <>
      <SiteHeader siteName={st.site_name} logo={st.logo_url} />
      <main>{children}</main>
      <SiteFooter settings={st} />
      <MobileTabBar />
    </>
  );
}
