import { LayoutDashboard, ImageIcon, Newspaper, FileImage, Settings, LayoutTemplate, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";

export type AdminModuleId = "dashboard" | "catalogue" | "events" | "media" | "settings" | "widgets" | "privacy";

export type AdminModule = {
  id: AdminModuleId;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
  enabled: boolean;
};

export const adminModules: AdminModule[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Panoramica del sito e stato connessione.",
    icon: LayoutDashboard,
    enabled: true
  },
  {
    id: "catalogue",
    label: "Catalogo",
    description: "Gestione catalogo e collezioni prodotto.",
    icon: ImageIcon,
    enabled: true
  },
  {
    id: "events",
    label: "Eventi",
    description: "Gestione eventi, fiere, press e contenuti editoriali.",
    icon: Newspaper,
    enabled: true
  },
  {
    id: "media",
    label: "Media",
    description: "Gestione file e immagini.",
    icon: FileImage,
    enabled: true
  },
  {
    id: "settings",
    label: "Impostazioni",
    description: "Configurazione del sito.",
    icon: Settings,
    enabled: true
  },
  {
    id: "widgets",
    label: "Widgets",
    description: "Configura le sezioni della homepage.",
    icon: LayoutTemplate,
    enabled: true
  },
  {
    id: "privacy",
    label: "Privacy & Cookie",
    description: "Gestione informative, preferenze cookie e consensi.",
    icon: ShieldCheck,
    enabled: true
  }
];

export function isAdminModuleId(value: unknown): value is AdminModuleId {
  return typeof value === "string" && adminModules.some((module) => module.id === value);
}

export function getDefaultAdminModuleId(): AdminModuleId {
  return "dashboard";
}
