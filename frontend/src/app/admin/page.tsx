import { Admin } from "@/features/admin/admin";
export const metadata = {
  title: "Studio dashboard",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Admin />;
}
