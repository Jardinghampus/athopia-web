// template.tsx remountas vid varje navigering (till skillnad från layout) —
// det ger en konsekvent, kort fade-up på sidinnehållet i hela app-chromet.
// Ren CSS (.page-enter), respekterar prefers-reduced-motion, noll JS-kostnad.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
