import { notFound } from "next/navigation";
import { getSite, type Item } from "@/lib/api";
import { SiteShell } from "@/components/site-shell";
import { PublicPage } from "@/components/public-pages";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
};
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const site = await getSite();
  const page = site.pages.find((p: Item) => p.slug === slug);
  return {
    title: `${page?.seoTitle || page?.title || slug.charAt(0).toUpperCase() + slug.slice(1)} · ${site.settings.name}`,
    description: page?.seoDescription || site.settings.seoDescription,
    icons: site.settings.favicon ? { icon: site.settings.favicon } : undefined,
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const { service } = await searchParams;
  const site = await getSite();
  if (
    !["services", "work", "team", "videos", "contact", "quote"].includes(
      slug,
    ) &&
    !site.pages.some((p: Item) => p.slug === slug)
  )
    notFound();
  return (
    <SiteShell site={site} path={`/${slug}`}>
      <PublicPage site={site} slug={slug} service={service} />
    </SiteShell>
  );
}
