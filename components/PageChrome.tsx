"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import type { Lang } from "@/lib/content";

/**
 * Chrome client per le sotto-pagine: header/menu solido del sito con i link che
 * puntano alla homepage (/#sezione). Tiene lo stato lingua localmente.
 */
export function PageChrome({ initialLang = "it" }: { initialLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  return <SiteHeader lang={lang} setLang={setLang} mode="solid" linkBase="/" />;
}
