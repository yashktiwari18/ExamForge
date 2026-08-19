export default function SectionLabel({ icon, text }) {
  return (
    <div className="flex items-center gap-1.5 ef-mono text-xs tracking-wide uppercase" style={{ color: "var(--ink)" }}>
      {icon} {text}
    </div>
  );
}
