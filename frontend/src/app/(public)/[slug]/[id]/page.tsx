import { notFound } from "next/navigation";
import { getSite, type Item } from "@/lib/api";
import { SiteShell } from "@/components/site-shell";
import { Detail } from "@/components/public-pages";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string; id: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug, id } = await params;
  const site = await getSite();
  const item = (slug === "work" ? site.projects : site.services).find(
    (p: Item) => p.id === id,
  );
  return {
    title: `${item?.title || "Project"} · ${site.settings.name}`,
    description: item?.description,
  };
}
export default async function Page({ params }: Props) {
  const { slug, id } = await params;
  if (!["services", "work"].includes(slug)) notFound();
  const site = await getSite();
  const type = slug === "work" ? "projects" : "services";
  const item = site[type].find((p: Item) => p.id === id);
  if (!item) notFound();
  return (
    <SiteShell site={site} path={`/${slug}/${id}`}>
      <Detail site={site} type={type} item={item} />
    </SiteShell>
  );
}
