"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { IconSearch, IconBell, IconDashboard, IconSettings, IconUsers, type IconProps } from "./ui/Icons";
import AvatarMultiTenant from "./ui/AvatarMultiTenant";
import styles from "./VitrixShell.module.css";

type ModuleId = "dashboard" | "utenti" | "impostazioni";

type NavItem = {
  id: ModuleId;
  label: string;
  icon: ComponentType<IconProps>;
};

const navItems: Array<NavItem> = [
  { id: "dashboard", label: "Dashboard", icon: IconDashboard },
  { id: "utenti", label: "Utenti", icon: IconUsers },
  { id: "impostazioni", label: "Impostazioni", icon: IconSettings }
];

const mobileNavItems = navItems;

const moduleInfo: Record<ModuleId, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: "Panoramica",
    title: "Dashboard Vitrix",
    description: "Controllo iniziale per accessi, ruoli e impostazioni di base."
  },
  utenti: {
    eyebrow: "Utenti",
    title: "Gestione operatori",
    description: "Profili, ruoli e stato degli account attivi."
  },
  impostazioni: {
    eyebrow: "Impostazioni",
    title: "Configurazione",
    description: "Controllo delle politiche di accesso e delle opzioni di base."
  }
};

const dashboardCards = [
  { label: "Account attivi", value: "24" },
  { label: "Ruoli definiti", value: "5" },
  { label: "Login recenti", value: "58" },
  { label: "Verifica sicurezza", value: "OK" }
];

const userList = [
  { name: "Elena Rossi", role: "Admin", status: "Online" },
  { name: "Matteo Berni", role: "Operatore", status: "In riunione" },
  { name: "Giulia Neri", role: "Viewer", status: "Disponibile" }
];

function renderModuleBody(moduleId: ModuleId) {
  switch (moduleId) {
    case "dashboard":
      return (
        <>
          <div className={styles.summaryGrid}>
            {dashboardCards.map((card) => (
              <article key={card.label} className={styles.statCard}>
                <span className={styles.statLabel}>{card.label}</span>
                <div className={styles.statValue}>{card.value}</div>
              </article>
            ))}
          </div>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Controlli essenziali</span>
            </div>
            <div className={styles.emptyState}>
              <p>Usa il menu per gestire utenti, ruoli e impostazioni di accesso.</p>
              <small>La piattaforma rimane pronta per i moduli futuri.</small>
            </div>
          </section>
        </>
      );

    case "utenti":
      return (
        <div className={styles.sectionGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Operatori attivi</span>
            </div>
            <div className={styles.listBlock}>
              {userList.map((user) => (
                <div key={user.name} className={styles.listItem}>
                  <div>
                    <p>{user.name}</p>
                    <small>{user.role}</small>
                  </div>
                  <span className={`${styles.badge} ${user.status === "Online" ? styles.success : styles.warning}`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Ruoli e permessi</span>
            </div>
            <div className={styles.emptyState}>
              <p>Definisci i livelli di accesso per gruppi e operatori.</p>
            </div>
          </section>
        </div>
      );

    case "impostazioni":
      return (
        <div className={styles.sectionGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Accesso e sicurezza</span>
            </div>
            <div className={styles.settingsGrid}>
              <div className={styles.settingCard}>
                <strong>Login</strong>
                <p>Politiche di accesso e opzioni di autenticazione.</p>
              </div>
              <div className={styles.settingCard}>
                <strong>Ruoli</strong>
                <p>Definisci chi può modificare, visualizzare e gestire.</p>
              </div>
              <div className={styles.settingCard}>
                <strong>Notifiche</strong>
                <p>Imposta gli avvisi essenziali del sistema.</p>
              </div>
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span>Note</span>
            </div>
            <div className={styles.emptyState}>
              <p>Questa area resta volutamente ridotta fino all&apos;arrivo dei moduli successivi.</p>
            </div>
          </section>
        </div>
      );

    default:
      return null;
  }
}

export function VitrixShell() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const info = moduleInfo[activeModule];

  return (
    <div className={styles.vitrixShell}>
      <aside className={styles.sidebar} aria-label="Navigazione principale">
        <button type="button" className={styles.brandButton} aria-label="Vitrix">
          V
        </button>
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeModule;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                onClick={() => setActiveModule(item.id)}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </nav>
      </aside>

      <div className={styles.mainLayout}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>{info.eyebrow}</p>
            <h1>{info.title}</h1>
          </div>
          <div className={styles.topbarActions}>
            <span className={`${styles.badge} ${styles.info}`}>Sincronizzato</span>
            <button type="button" className={styles.iconButton} aria-label="Cerca">
              <IconSearch />
            </button>
            <button type="button" className={styles.iconButton} aria-label="Notifiche">
              <IconBell />
            </button>
            <AvatarMultiTenant />
          </div>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.pageHeader}>
            <div>
              <p className={styles.pageMeta}>{info.description}</p>
            </div>
            <div className={styles.headerActions}>
              <button type="button" className={styles.primaryButton}>
                Nuova attività
              </button>
              <button type="button" className={styles.secondaryButton}>
                Altro
              </button>
            </div>
          </div>

          <div className={styles.pageBody}>{renderModuleBody(activeModule)}</div>
        </main>
      </div>

      <div className={styles.mobileBottomWrap}>
        <div className={styles.mobileStatusStrip}>
          <div>
            <span className={styles.statusLabel}>{info.eyebrow}</span>
            <span className={styles.statusDetail}>{info.title}</span>
          </div>
          <span className={`${styles.badge} ${styles.secondary}`}>Attivo</span>
        </div>
        <nav className={styles.mobileBottomNav} aria-label="Navigazione mobile">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeModule;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.mobileNavItem} ${active ? styles.mobileNavItemActive : ""}`}
                onClick={() => setActiveModule(item.id)}
                aria-label={item.label}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
