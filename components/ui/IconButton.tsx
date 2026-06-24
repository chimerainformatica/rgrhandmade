"use client";

import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode };

export default function IconButton(props: Props) {
  const { children, style, className, ...rest } = props;
  const baseStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(17,25,42,0.06)',
    color: 'var(--vx-text-primary)',
    borderRadius: 10,
    border: 0,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  };

  return (
    <button type="button" {...rest} className={className} style={{ ...baseStyle, ...style }}>
      {children}
    </button>
  );
}
