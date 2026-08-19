import {
  Upload, X, Clock, AlertCircle,
  ImageIcon, Sparkles, FileText, XCircle,
} from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import ChipRow from "../components/ChipRow";
import { EXAM_TYPES, NUM_GEN_OPTIONS, NEG_OPTIONS, TIMER_OPTIONS } from "../constants";

export default function SetupScreen(props) {
  const {
    images, dragActive, setDragActive, handleFiles, removeImage, fileInputRef,
    topicText, setTopicText, examType, setExamType, numGenerate, setNumGenerate,
    negativeMarking, setNegativeMarking, timerMode, setTimerMode, error, runGeneration,
  } = props;
  const canStart = images.length > 0 || topicText.trim().length > 0;

  return (
    <div className="ef-anim">
      <div className="mb-7">
        <div className="ef-serif font-extrabold text-3xl sm:text-4xl leading-tight" style={{ color: "var(--ink)" }}>
          Turn any question paper<br />into a live mock test.
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--pencil)" }}>
          Upload photos of MCQs from Banking, UPSC, SSC or Railways papers &mdash; ExamForge reads them,
          adds fresh practice questions on the same topic, and runs a timed, negatively-marked test.
        </p>
      </div>

      <div className="ef-card p-5 sm:p-6 mb-5">
        <div className="ef-corner tl" /><div className="ef-corner tr" /><div className="ef-corner bl" /><div className="ef-corner br" />

        <SectionLabel icon={<ImageIcon size={14} />} text="1. Upload question paper images (up to 5)" />
        <div
          className={`ef-dashed rounded-lg p-5 text-center cursor-pointer mt-2 ${dragActive ? "ef-dashed-active" : ""}`}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload size={22} style={{ color: "var(--ink)", margin: "0 auto" }} />
          <div className="text-sm mt-2" style={{ color: "var(--graphite)" }}>Drop images here, or tap to choose</div>
          <div className="text-xs mt-1" style={{ color: "var(--pencil)" }}>JPG or PNG &middot; {images.length}/5 uploaded</div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {images.map((img) => (
              <div key={img.id} className="relative">
                <img src={img.preview} alt={img.name} className="w-16 h-16 object-cover rounded" style={{ border: "1.5px solid var(--ink)" }} />
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  className="absolute -top-2 -right-2 rounded-full flex items-center justify-center"
                  style={{ width: 20, height: 20, background: "var(--stamp)", color: "var(--paper)" }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <SectionLabel icon={<Sparkles size={14} />} text="2. Or, type a topic to generate questions on" />
          <input
            type="text" value={topicText} onChange={(e) => setTopicText(e.target.value)}
            placeholder="e.g. Indian Polity \u2014 Fundamental Rights, or Banking Awareness \u2014 RBI Functions"
            className="w-full mt-2 px-3 py-2 rounded text-sm outline-none ef-input"
          />
        </div>
      </div>

      <div className="ef-card p-5 sm:p-6 mb-5">
        <div className="ef-corner tl" /><div className="ef-corner tr" /><div className="ef-corner bl" /><div className="ef-corner br" />

        <SectionLabel icon={<FileText size={14} />} text="3. Exam style" />
        <ChipRow options={EXAM_TYPES} value={examType} onChange={setExamType} />

        <div className="mt-5">
          <SectionLabel icon={<Sparkles size={14} />} text="4. New practice questions to generate" />
          <ChipRow
            options={NUM_GEN_OPTIONS.map((n) => (n === 0 ? "None (extract only)" : `+${n} new`))}
            value={numGenerate === 0 ? "None (extract only)" : `+${numGenerate} new`}
            onChange={(label) => setNumGenerate(label.startsWith("None") ? 0 : parseInt(label.replace(/\D/g, ""), 10))}
          />
        </div>

        <div className="mt-5">
          <SectionLabel icon={<XCircle size={14} />} text="5. Negative marking" />
          <ChipRow
            options={NEG_OPTIONS.map((o) => o.label)}
            value={NEG_OPTIONS.find((o) => o.value === negativeMarking)?.label}
            onChange={(label) => setNegativeMarking(NEG_OPTIONS.find((o) => o.label === label).value)}
          />
        </div>

        <div className="mt-5">
          <SectionLabel icon={<Clock size={14} />} text="6. Timer" />
          <ChipRow
            options={TIMER_OPTIONS.map((o) => o.label)}
            value={TIMER_OPTIONS.find((o) => o.key === timerMode)?.label}
            onChange={(label) => setTimerMode(TIMER_OPTIONS.find((o) => o.label === label).key)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded mb-4 text-sm" style={{ background: "rgba(178,58,46,0.1)", color: "var(--stamp)" }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <button
        disabled={!canStart}
        onClick={runGeneration}
        className="ef-btn-primary w-full py-3.5 rounded-lg font-semibold ef-serif text-base flex items-center justify-center gap-2"
      >
        <Sparkles size={18} /> Generate Test
      </button>
      {!canStart && <div className="text-xs text-center mt-2" style={{ color: "var(--pencil)" }}>Upload an image or type a topic to continue</div>}
      <div className="text-[10px] text-center mt-4 ef-mono" style={{ color: "var(--pencil)" }}>
        Local development mode · Never expose your Claude API key in a public frontend deployment.
      </div>
    </div>
  );
}
