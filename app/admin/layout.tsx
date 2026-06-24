import type { Metadata } from "next";
import { AdminThemeProvider } from "./AdminThemeProvider";

export const metadata: Metadata = {
  title: { default: "Vitrix CMS", template: "%s - Vitrix CMS" },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
