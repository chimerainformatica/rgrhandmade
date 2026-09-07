"use client";

import type { ReactNode } from "react";
import { LEGALBLINK_SETTINGS_ANCHOR_ID, isLegalBlinkEnabled } from "./config";

type ManageCookiesButtonProps = {
  label: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Riapre il pannello preferenze del CMP.
 *
 * Non porta data-lb="c-settings" di suo: il CMP scandisce il DOM una volta
 * sola, quindi un nodo renderizzato o rimontato da React resterebbe inerte.
 * Inoltra invece il click all'anchor stabile montato da LegalBlinkProvider.
 */
export function ManageCookiesButton({ label, className, children }: ManageCookiesButtonProps) {
  if (!isLegalBlinkEnabled()) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        document.getElementById(LEGALBLINK_SETTINGS_ANCHOR_ID)?.click();
      }}
    >
      {children ?? label}
    </button>
  );
}
