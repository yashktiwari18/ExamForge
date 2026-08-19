export default function StatBox({ label, value, color }) {
  return (
    <div className="ef-card p-3 text-center">
      <div className="ef-serif font-bold text-xl" style={{ color }}>{value}</div>
      <div className="ef-mono text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "var(--pencil)" }}>{label}</div>
    </div>
  );
}
