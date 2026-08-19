import { Loader2 } from "lucide-react";

export default function ProcessingScreen({ status }) {
  return (
    <div className="ef-anim ef-card p-10 flex flex-col items-center text-center" style={{ minHeight: 320, justifyContent: "center" }}>
      <div className="ef-corner tl" /><div className="ef-corner tr" /><div className="ef-corner bl" /><div className="ef-corner br" />
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--stamp)" }} />
      <div className="ef-serif font-bold text-xl mt-5" style={{ color: "var(--ink)" }}>Building your test</div>
      <div className="text-sm mt-2 ef-mono" style={{ color: "var(--pencil)" }}>{status}</div>
    </div>
  );
}
