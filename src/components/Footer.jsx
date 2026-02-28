import React from 'react';

export default function Footer({ className }) {
  return (
    <footer className={`text-center text-slate-400 text-xs ${className || 'mt-auto py-6'}`}>
      © Choco Li 2026 • v1.4.0
    </footer>
  );
}
