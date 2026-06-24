"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "../VitrixShell.module.css";

const tenants = [
  { id: 't_default', name: 'Default' },
  { id: 't_shop', name: 'Shop' },
  { id: 't_blog', name: 'Blog' }
];

export default function AvatarMultiTenant() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button type="button" className={styles.avatarButton} onClick={() => setOpen(s => !s)} aria-haspopup="true" aria-expanded={open} aria-label="Seleziona tenant">
        DT
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 52, background: 'var(--vx-surface)', border: '1px solid var(--vx-border)', borderRadius: 10, boxShadow: 'var(--vx-shadow-md)', minWidth: 180, zIndex: 70 }}>
          <div style={{ padding: 10, borderBottom: '1px solid var(--vx-border-soft)', color: 'var(--vx-text-secondary)', fontSize: 13 }}>Seleziona tenant</div>
          <div>
            {tenants.map(t => (
              <button key={t.id} type="button" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--vx-text-primary)' }} onClick={() => { setOpen(false); /* TODO: switch tenant */ }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
