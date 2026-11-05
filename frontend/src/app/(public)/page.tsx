import { getSite } from "@/lib/api";
import { SiteShell } from "@/components/site-shell";
import { Home } from "@/components/public-pages";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { settings: s } = await getSite();
  return {
    title: `${s.name} · ${s.seoTitle}`,
    description: s.seoDescription,
    icons: s.favicon ? { icon: s.favicon } : undefined,
    openGraph: { title: s.name, description: s.seoDescription },
  };
}
export default async function Page() {
  const site = await getSite();
  return (
    <SiteShell site={site}>
      <Home site={site} />
    </SiteShell>
  );
}
