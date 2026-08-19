import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import { fmtTime } from "../utils/helpers";

export default function QuizScreen({ questions, currentQ, currentIndex, answers, selectAnswer, goNext, goPrev, jumpTo, timerMode, timeLeft, submitTest, answeredCount }) {
  const isLast = currentIndex === questions.length - 1;
  const selected = answers[currentQ.id];

  return (
    <div className="ef-anim">
      <div className="flex items-center justify-between mb-4">
        <div className="ef-mono text-sm" style={{ color: "var(--ink)" }}>
          Question {currentIndex + 1} <span style={{ color: "var(--pencil)" }}>of {questions.length}</span>
        </div>
        {timerMode !== "none" && (
          <div className="flex items-center gap-1.5 ef-mono font-semibold px-3 py-1 rounded" style={{ background: timeLeft <= 10 ? "var(--stamp)" : "var(--ink)", color: "var(--paper)" }}>
            <Clock size={14} /> {fmtTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {questions.map((q, i) => (
          <div
            key={q.id}
            onClick={() => jumpTo(i)}
            className={`ef-dot ${answers[q.id] !== undefined ? "ef-dot-answered" : ""} ${i === currentIndex ? "ef-dot-current" : ""}`}
            title={`Question ${i + 1}`}
          />
        ))}
      </div>

      <div className="ef-card p-5 sm:p-6">
        <div className="ef-corner tl" /><div className="ef-corner tr" /><div className="ef-corner bl" /><div className="ef-corner br" />

        {currentQ.source === "generated" && (
          <div className="inline-flex items-center gap-1 ef-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded mb-3" style={{ background: "rgba(47,110,79,0.12)", color: "var(--ledger)" }}>
            <Sparkles size={10} /> New practice question
          </div>
        )}

        <div className="ef-serif font-semibold text-lg leading-snug mb-5" style={{ color: "var(--graphite)" }}>
          {currentQ.question}
        </div>

        <div className="flex flex-col gap-3">
          {currentQ.options.map((opt, idx) => (
            <div key={idx} onClick={() => selectAnswer(currentQ.id, idx)} className="flex items-center gap-3 cursor-pointer">
              <div className={`ef-bubble ${selected === idx ? "ef-bubble-selected" : ""}`}>{String.fromCharCode(65 + idx)}</div>
              <div className="text-sm sm:text-base" style={{ color: "var(--graphite)" }}>{opt}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 gap-3">
        <button onClick={goPrev} disabled={currentIndex === 0} className="ef-btn-secondary px-4 py-2.5 rounded flex items-center gap-1 text-sm disabled:opacity-30">
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="text-xs ef-mono" style={{ color: "var(--pencil)" }}>{answeredCount}/{questions.length} answered</div>
        {isLast ? (
          <button onClick={submitTest} className="ef-btn-primary px-5 py-2.5 rounded font-semibold text-sm flex items-center gap-1.5">
            Submit Test <CheckCircle2 size={16} />
          </button>
        ) : (
          <button onClick={goNext} className="ef-btn-primary px-5 py-2.5 rounded font-semibold text-sm flex items-center gap-1.5">
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
