import React, { useState, useEffect, useRef } from "react";
import {
  Upload, X, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  History as HistoryIcon, RotateCcw, AlertCircle, Loader2, Trophy,
  FileText, Sparkles, ImageIcon, LogOut, Eye
} from "lucide-react";
import {
  extractFromImage,
  generateBatch,
  getAIErrorMessage,
} from "./api/aiService";


import { filterPYQs } from "./utils/pyqRepository";

import { getExams, getSubExams, getExamLevelMetadata } from "./constants/examConfig";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const fmtTime = (sec) => {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

const NUM_GEN_OPTIONS = [0, 5, 10, 15];
const NEG_OPTIONS = [
  { label: "No Negative Marking", value: 0 },
  { label: "\u22120.25 / wrong", value: 0.25 },
  { label: "\u22120.33 / wrong", value: 0.33 },
  { label: "\u22120.5 / wrong", value: 0.5 },
];
const TIMER_OPTIONS = [
  { key: "none", label: "No Timer" },
  { key: "total", label: "Full-Test Timer" },
  { key: "perQuestion", label: "60s / Question" },
];

function normalizeQuestionMetadata(question, context = {}) {
  const {
    source = "generated",
    topic = "General Knowledge",
    examType = "General/Other",
    difficulty = "medium",
    subtopic = "General",
  } = context;

  const id = question.id || uid();

  return {
    ...question,
    id,
    source: question.source || source,
    questionId: question.questionId || id,
    topic: question.topic || topic,
    examType: question.examType || examType,
    difficulty: question.difficulty || difficulty,
    subtopic: question.subtopic || subtopic,
  };
}

function getRepositoryPYQs(examGuess, topic) {
  const normalizedExam = String(examGuess || "").trim().toLowerCase();
  const normalizedTopic = String(topic || "").trim().toLowerCase();

  let pyqs = filterPYQs({
    verifiedOnly: true,
  });

  // -----------------------------
  // EXAM FILTER
  // -----------------------------

  if (normalizedExam.includes("upsc")) {
    pyqs = pyqs.filter((pyq) =>
      String(pyq.exam || "").toLowerCase().includes("upsc")
    );
  } else if (normalizedExam.includes("ssc")) {
    pyqs = pyqs.filter((pyq) =>
      String(pyq.exam || "").toLowerCase().includes("ssc")
    );
  } else if (normalizedExam.includes("railway")) {
    pyqs = pyqs.filter((pyq) =>
      String(pyq.exam || "").toLowerCase().includes("railway")
    );
  } else if (normalizedExam.includes("state pcs") || normalizedExam.includes("pcs") || normalizedExam.includes("psc")) {
    pyqs = pyqs.filter((pyq) => isStatePCSPYQ(pyq));
  } else if (normalizedExam.includes("bank")) {
    pyqs = pyqs.filter((pyq) =>
      String(pyq.exam || "").toLowerCase().includes("bank")
    );
  }

  // -----------------------------
  // TOPIC / SUBJECT FILTER
  // -----------------------------

  if (normalizedTopic) {
    pyqs = pyqs.filter((pyq) => {
      const subject = String(pyq.subject || "").toLowerCase();
      const pyqTopic = String(pyq.topic || "").toLowerCase();

      return (
        subject === normalizedTopic ||
        pyqTopic === normalizedTopic ||
        subject.includes(normalizedTopic) ||
        pyqTopic.includes(normalizedTopic) ||
        normalizedTopic.includes(subject)
      );
    });
  }

  return pyqs;
}


function isStatePCSPYQ(pyq) {
  if (!pyq || pyq.state === "All India") return false;

  const exam = String(pyq.exam || "").toLowerCase();

  const statePCSKeywords = [
    "bpsc",
    "uppsc",
    "mppsc",
    "rpsc",
    "jpsc",
    "opsc",
    "wbcs",
    "wbpsc",
    "hpsc",
    "gpsc",
    "cgpsc",
    "jkpsc",
    "kpsc",
    "appsc",
    "tspsc",
    "tnpsc",
    "ukpsc",
    "hppsc",
    "ppsc",
    "mpsc",
    "public service commission",
    "provincial civil service",
    "pcs",
  ];

  return statePCSKeywords.some((keyword) =>
    exam.includes(keyword)
  );
}



function getWeakTopics(topicWise) {
  return Object.entries(topicWise)
    .filter(([, stats]) => (
      stats.attempted >= 2 &&
      (stats.correct / stats.attempted) < 0.6
    ))
    .map(([topic]) => topic);
}

function getTargetExamLevel(levelMeta) {
  const normalized = String(levelMeta || "").toLowerCase();

  if (
    normalized.includes("easy") ||
    normalized.includes("10th") ||
    normalized.includes("matriculation")
  ) {
    return "basic";
  }

  if (normalized.includes("hard") || normalized.includes("advanced")) {
    return "advanced";
  }

  return "moderate";
}

function buildPerformance(answerResults) {
  const records = Object.values(answerResults);
  const topicWise = {};
  const difficultyWise = {};

  records.forEach((record) => {
    const topic = record.topic || "General Knowledge";
    const difficulty = record.difficulty || "medium";

    if (!topicWise[topic]) topicWise[topic] = { attempted: 0, correct: 0, wrong: 0 };
    if (!difficultyWise[difficulty]) difficultyWise[difficulty] = { attempted: 0, correct: 0, wrong: 0 };

    topicWise[topic].attempted += 1;
    difficultyWise[difficulty].attempted += 1;

    if (record.isCorrect) {
      topicWise[topic].correct += 1;
      difficultyWise[difficulty].correct += 1;
    } else {
      topicWise[topic].wrong += 1;
      difficultyWise[difficulty].wrong += 1;
    }
  });

  return {
    totalAttempted: records.length,
    correctAnswers: records.filter((record) => record.isCorrect).length,
    wrongAnswers: records.filter((record) => !record.isCorrect).length,
    topicWise,
    difficultyWise,
    weakTopics: getWeakTopics(topicWise),
    recentlyWrongQuestions: records
      .filter((record) => !record.isCorrect)
      .sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt))
      .map((record) => record.questionId),
  };
}

export function selectRevisionQuestions(questions, questionTracking, options = {}) {
  const { limit } = options;
  const excludedIds = new Set(options.excludedQuestionIds || []);

  const candidates = questions
    .map((question, index) => ({
      question,
      index,
      tracking: questionTracking[question.id] || questionTracking[question.questionId],
    }))
    .filter(({ question, tracking }) => {
      const questionId = question.questionId || question.id;
      return tracking &&
        (tracking.isMistake || tracking.incorrectCount > 0) &&
        !excludedIds.has(question.id) &&
        !excludedIds.has(questionId);
    })
    .sort((a, b) => {
      const aCurrentlyWrong = a.tracking.lastIsCorrect === false ? 1 : 0;
      const bCurrentlyWrong = b.tracking.lastIsCorrect === false ? 1 : 0;
      if (aCurrentlyWrong !== bCurrentlyWrong) return bCurrentlyWrong - aCurrentlyWrong;

      const incorrectDifference = b.tracking.incorrectCount - a.tracking.incorrectCount;
      if (incorrectDifference !== 0) return incorrectDifference;

      const recentDifference = new Date(b.tracking.lastAttemptedAt) - new Date(a.tracking.lastAttemptedAt);
      if (recentDifference !== 0) return recentDifference;

      const aId = a.question.questionId || a.question.id;
      const bId = b.question.questionId || b.question.id;
      return String(aId).localeCompare(String(bId)) || a.index - b.index;
    })
    .map(({ question }) => question);

  return typeof limit === "number" ? candidates.slice(0, Math.max(0, limit)) : candidates;
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const meta = result.split(",")[0];
      const data = result.split(",")[1];
      const mediaType = (meta.match(/data:(.*?);base64/) || [, "image/png"])[1];
      resolve({ data, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ExamForge() {
  const [screen, setScreen] = useState("setup");
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [topicText, setTopicText] = useState("");
  const [examType, setExamType] = useState("Banking");
  const [subExam, setSubExam] = useState("");
  const [numGenerate, setNumGenerate] = useState(5);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [timerMode, setTimerMode] = useState("total");
  const [processingStatus, setProcessingStatus] = useState("");
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState([]);
  const [detectedTopic, setDetectedTopic] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [answerResults, setAnswerResults] = useState({});
  const [questionTracking, setQuestionTracking] = useState({});
  const [performance, setPerformance] = useState(buildPerformance({}));
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStartedAt, setTestStartedAt] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [reviewTest, setReviewTest] = useState(null);
  const [reviewOrigin, setReviewOrigin] = useState("results");
  const [prevScreen, setPrevScreen] = useState("setup");

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadHistoryList();
  }, []);

  useEffect(() => {
    if (screen !== "quiz" || timerMode === "none") return;
    if (timeLeft <= 0) {
      if (timerMode === "total") {
        submitTest();
      } else if (timerMode === "perQuestion") {
        goNext();
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((tl) => tl - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [timeLeft, screen, timerMode]);

  async function loadHistoryList() {
    try {
      const value = localStorage.getItem("tests:index");
      if (value) setHistory(JSON.parse(value));
      else setHistory([]);
    } catch (e) {
      setHistory([]);
    }
  }

  async function handleFiles(fileList) {
    const remaining = 5 - images.length;
    if (remaining <= 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/")).slice(0, remaining);
    const newImages = [];
    for (const f of files) {
      try {
        const { data, mediaType } = await toBase64(f);
        newImages.push({ id: uid(), name: f.name, data, mediaType, preview: `data:${mediaType};base64,${data}` });
      } catch (e) {}
    }
    setImages((prev) => [...prev, ...newImages]);
  }

  function removeImage(id) {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }

  async function runGeneration() {
    setError("");
    setScreen("processing");
    let allQuestions = [];
    let topics = [];
    let examGuesses = [];
    try {
      const levelMeta = getExamLevelMetadata(examType, subExam);
const targetExamLevel = getTargetExamLevel(levelMeta);
for (let i = 0; i < images.length; i++) {
        setProcessingStatus(`Reading question paper image ${i + 1} of ${images.length}...`);
        const result = await extractFromImage(images[i]);
        if (result.topic) topics.push(result.topic);
        if (result.examType) examGuesses.push(result.examType);
        const extractedTopic = result.topic || topicText.trim() || "General Knowledge";
        const extractedExamType = result.examType || examType;
        (result.questions || []).forEach((q) => {
          allQuestions.push(
                normalizeQuestionMetadata(q, {
                  source: "extracted",
                  topic: extractedTopic,
                  examType: extractedExamType,
                  difficulty: levelMeta,
                  subtopic: extractedTopic,
                })
          );
        });
      }
      const topic = topicText.trim() || topics[0] || "General Knowledge";
      
      const fullExamName = subExam
        ? `${examType} — ${subExam} (Target Level: ${levelMeta})`
        : `${examType} (Target Level: ${levelMeta})`;

      const examGuess = examGuesses[0] || fullExamName;
      const repositoryPYQs = getRepositoryPYQs(examGuess, topic);

      repositoryPYQs.forEach((pyq) => {
        allQuestions.push(
            normalizeQuestionMetadata(pyq, {
              source: "pyq",
              topic: pyq.topic,
              examType: examGuess,
              difficulty: levelMeta,
              subtopic: pyq.topic,
            })
        );
      });

      const effectiveNumGenerate = (numGenerate === 0 && images.length === 0 && repositoryPYQs.length === 0) ? 5 : numGenerate;

      if (effectiveNumGenerate > 0) {
        let remaining = effectiveNumGenerate;
        let batchIndex = 0;
        while (remaining > 0) {
          const batchSize = Math.min(10, remaining);
          if (batchIndex > 0) {
            // Small pause to prevent rate limiting between requests
            await new Promise((res) => setTimeout(res, 1000));
          }
          setProcessingStatus(`Generating ${batchSize} new practice question${batchSize > 1 ? "s" : ""}...`);
          const avoidList = allQuestions.map((q) => q.question);
          try {
            const genResult = await generateBatch(topic, {
              category: examType,
              subExam: subExam || undefined,
              name: subExam || examType,
              level: `${targetExamLevel} (${levelMeta})`,
            }, avoidList, batchSize);
            (genResult.questions || []).forEach((q) => {
              allQuestions.push(
                normalizeQuestionMetadata(q, {
                  source: "generated",
                  topic,
                  examType: examGuess,
                  difficulty: levelMeta,
                  subtopic: topic,
                })
              );
            });
          } catch (batchErr) {
            console.error("Batch generation error:", batchErr);
            if (allQuestions.length === 0) {
              throw batchErr;
            }
            // If some questions were already generated or extracted, proceed with what we have
            break;
          }
          remaining -= batchSize;
          batchIndex++;
        }
      }
      if (allQuestions.length === 0) {
        setError("No questions could be extracted or generated. Try clearer images, or type a topic.");
        setScreen("setup");
        return;
      }
      setDetectedTopic(topic);
      setQuestions(allQuestions);
      setAnswers({});
      setAnswerResults({});
      setQuestionTracking({});
      setPerformance(buildPerformance({}));
      setCurrentIndex(0);
      if (timerMode === "total") setTimeLeft(Math.max(60, Math.round(allQuestions.length * 72)));
      else if (timerMode === "perQuestion") setTimeLeft(60);
      setTestStartedAt(Date.now());
      setScreen("quiz");
    } catch (e) {
      console.error(e);
      setError(getAIErrorMessage(e));
      setScreen("setup");
    }
  }

  function selectAnswer(qId, idx) {
    setAnswers((prev) => ({ ...prev, [qId]: idx }));

    const question = questions.find((q) => q.id === qId);
    const correctOption = question?.correctIndex;
    const isCorrect = typeof correctOption === "number" ? idx === correctOption : false;
    const answeredAt = new Date().toISOString();
    setAnswerResults((prev) => {
      const next = {
        ...prev,
        [qId]: {
          questionId: question?.questionId || question?.id || qId,
          selectedOption: idx,
          correctOption,
          isCorrect,
          topic: question?.topic || "General Knowledge",
          difficulty: question?.difficulty || "medium",
          answeredAt,
        },
      };
      setPerformance(buildPerformance(next));
      return next;
    });
    setQuestionTracking((prev) => {
      const previous = prev[qId] || {
        questionId: question?.questionId || question?.id || qId,
        topic: question?.topic || "General Knowledge",
        attempts: 0,
        incorrectCount: 0,
        correctCount: 0,
        isMistake: false,
      };

      return {
        ...prev,
        [qId]: {
          ...previous,
          questionId: question?.questionId || previous.questionId || qId,
          topic: question?.topic || previous.topic || "General Knowledge",
          attempts: previous.attempts + 1,
          incorrectCount: previous.incorrectCount + (isCorrect ? 0 : 1),
          correctCount: previous.correctCount + (isCorrect ? 1 : 0),
          isMistake: previous.isMistake || !isCorrect,
          lastIsCorrect: isCorrect,
          lastAttemptedAt: answeredAt,
        },
      };
    });
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      if (timerMode === "perQuestion") setTimeLeft(60);
    } else {
      submitTest();
    }
  }
  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      if (timerMode === "perQuestion") setTimeLeft(60);
    }
  }
  function jumpTo(idx) {
    setCurrentIndex(idx);
    if (timerMode === "perQuestion") setTimeLeft(60);
  }

  async function saveTestRecord(result) {
    try {
      const summary = {
        id: result.id, date: result.date, examType: result.examType, topic: result.topic,
        score: result.score, maxScore: result.maxScore, total: result.total,
        correct: result.correct, wrong: result.wrong, unattempted: result.unattempted,
      };
      let idx = [];
      try {
        const existing = localStorage.getItem("tests:index");
        if (existing) idx = JSON.parse(existing);
      } catch (e) {}
      idx = [summary, ...idx].slice(0, 200);
      localStorage.setItem("tests:index", JSON.stringify(idx));
      localStorage.setItem(`tests:${result.id}`, JSON.stringify(result));
      setHistory(idx);
    } catch (e) {
      console.error("save failed", e);
    }
  }

  function submitTest() {
    const total = questions.length;
    let correct = 0, wrong = 0, unattempted = 0;
    questions.forEach((q) => {
      const a = answers[q.id];
      if (a === undefined || a === null) unattempted++;
      else if (a === q.correctIndex) correct++;
      else wrong++;
    });
    const rawScore = correct * 1 - wrong * negativeMarking;
    const timeTakenSec = Math.round((Date.now() - (testStartedAt || Date.now())) / 1000);
    const result = {
      id: uid(), date: new Date().toISOString(), examType: subExam ? `${examType} (${subExam})` : examType, topic: detectedTopic,
      total, correct, wrong, unattempted, negativeMarking,
      score: Math.round(rawScore * 100) / 100, maxScore: total, timeTakenSec,
      questions: questions.map((q) => ({
        ...q,
        selected: answers[q.id] !== undefined ? answers[q.id] : null,
        answerResult: answerResults[q.id] || null,
      })),
      answerResults: Object.values(answerResults),
      questionTracking: Object.values(questionTracking),
      performance,
    };
    setTestResult(result);
    saveTestRecord(result);
    setScreen("results");
  }

  async function viewReview(id, origin) {
    try {
      const value = localStorage.getItem(`tests:${id}`);
      if (value) {
        setReviewTest(JSON.parse(value));
        setReviewOrigin(origin);
        setScreen("review");
      }
    } catch (e) {}
  }

  async function clearHistory() {
    if (!window.confirm("Clear all saved test history? This cannot be undone.")) return;
    try {
      for (const h of history) localStorage.removeItem(`tests:${h.id}`);
      localStorage.removeItem("tests:index");
    } catch (e) {}
    setHistory([]);
  }

  function resetToSetup() {
    setScreen("setup");
    setQuestions([]);
    setAnswers({});
    setAnswerResults({});
    setQuestionTracking({});
    setPerformance(buildPerformance({}));
    setCurrentIndex(0);
    setTestResult(null);
    setError("");
  }

  function exitQuiz() {
    if (window.confirm("Exit this test? Your progress will be lost.")) {
      resetToSetup();
    }
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="ef-root" style={ROOT_VARS}>
      <style>{CSS}</style>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => screen !== "quiz" && resetToSetup()}>
            <div className="ef-logo-box ef-serif">EF</div>
            <div>
              <div className="ef-serif font-bold text-lg leading-none" style={{ color: "var(--ink)" }}>ExamForge</div>
              <div className="text-[11px] ef-mono tracking-wide" style={{ color: "var(--pencil)" }}>MOCK TEST GENERATOR</div>
            </div>
          </div>
          {screen === "quiz" ? (
            <button onClick={exitQuiz} className="ef-btn-secondary px-3 py-1.5 rounded text-sm flex items-center gap-1.5">
              <LogOut size={14} /> Exit
            </button>
          ) : (
            <button
              onClick={() => { setPrevScreen(screen === "history" ? prevScreen : screen); setScreen("history"); loadHistoryList(); }}
              className="ef-btn-secondary px-3 py-1.5 rounded text-sm flex items-center gap-1.5"
            >
              <HistoryIcon size={14} /> History
            </button>
          )}
        </div>

        {screen === "setup" && (
          <SetupScreen
            images={images} dragActive={dragActive} setDragActive={setDragActive}
            handleFiles={handleFiles} removeImage={removeImage} fileInputRef={fileInputRef}
            topicText={topicText} setTopicText={setTopicText}
            examType={examType} setExamType={setExamType}
            subExam={subExam} setSubExam={setSubExam}
            numGenerate={numGenerate} setNumGenerate={setNumGenerate}
            negativeMarking={negativeMarking} setNegativeMarking={setNegativeMarking}
            timerMode={timerMode} setTimerMode={setTimerMode}
            error={error} runGeneration={runGeneration}
          />
        )}

        {screen === "processing" && <ProcessingScreen status={processingStatus} />}

        {screen === "quiz" && currentQ && (
          <QuizScreen
            questions={questions} currentQ={currentQ} currentIndex={currentIndex}
            answers={answers} selectAnswer={selectAnswer} goNext={goNext} goPrev={goPrev}
            jumpTo={jumpTo} timerMode={timerMode} timeLeft={timeLeft} submitTest={submitTest}
            answeredCount={answeredCount}
          />
        )}

        {screen === "results" && testResult && (
          <ResultsScreen
            result={testResult}
            onReview={() => { setReviewTest(testResult); setReviewOrigin("results"); setScreen("review"); }}
            onNewTest={resetToSetup}
            onHistory={() => { setPrevScreen("results"); setScreen("history"); loadHistoryList(); }}
          />
        )}

        {screen === "review" && reviewTest && (
          <ReviewScreen
            test={reviewTest}
            onBack={() => setScreen(reviewOrigin === "history" ? "history" : "results")}
          />
        )}

        {screen === "history" && (
          <HistoryScreen
            history={history}
            onOpen={(id) => viewReview(id, "history")}
            onClear={clearHistory}
            onNewTest={resetToSetup}
            onBack={() => setScreen(prevScreen === "history" ? "setup" : prevScreen)}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Screens ---------- */

function SetupScreen(props) {
  const {
    images, dragActive, setDragActive, handleFiles, removeImage, fileInputRef,
    topicText, setTopicText, examType, setExamType, subExam, setSubExam,
    numGenerate, setNumGenerate, negativeMarking, setNegativeMarking,
    timerMode, setTimerMode, error, runGeneration,
  } = props;
  const canStart = images.length > 0 || topicText.trim().length > 0;
  const categories = getExams();
  const availableSubExams = examType ? getSubExams(examType) : [];

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

        <SectionLabel icon={<FileText size={14} />} text="3. Exam Category & Sub Exam" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div>
            <label className="text-[11px] ef-mono uppercase tracking-wide block mb-1" style={{ color: "var(--pencil)" }}>
              Exam Category
            </label>
            <select
              value={examType}
              onChange={(e) => {
                const newCat = e.target.value;
                setExamType(newCat);
                setSubExam("");
              }}
              className="w-full px-3 py-2 rounded text-sm outline-none ef-input cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {examType && availableSubExams.length > 0 && (
            <div className="ef-anim">
              <label className="text-[11px] ef-mono uppercase tracking-wide block mb-1" style={{ color: "var(--pencil)" }}>
                Sub Exam
              </label>
              <select
                value={subExam}
                onChange={(e) => setSubExam(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm outline-none ef-input cursor-pointer"
              >
                <option value="">All / General {examType}</option>
                {availableSubExams.map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name} — {sub.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {subExam && (
          <div className="mt-2 text-xs flex items-center gap-1.5 ef-anim" style={{ color: "var(--pencil)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--ink)" }}></span>
            Target Level: <span className="font-semibold" style={{ color: "var(--ink)" }}>{getExamLevelMetadata(examType, subExam)}</span>
          </div>
        )}

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

function SectionLabel({ icon, text }) {
  return (
    <div className="flex items-center gap-1.5 ef-mono text-xs tracking-wide uppercase" style={{ color: "var(--ink)" }}>
      {icon} {text}
    </div>
  );
}

function ChipRow({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`ef-chip px-3 py-1.5 rounded-full text-xs sm:text-sm ${value === opt ? "ef-chip-active" : ""}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ProcessingScreen({ status }) {
  return (
    <div className="ef-anim ef-card p-10 flex flex-col items-center text-center" style={{ minHeight: 320, justifyContent: "center" }}>
      <div className="ef-corner tl" /><div className="ef-corner tr" /><div className="ef-corner bl" /><div className="ef-corner br" />
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--stamp)" }} />
      <div className="ef-serif font-bold text-xl mt-5" style={{ color: "var(--ink)" }}>Building your test</div>
      <div className="text-sm mt-2 ef-mono" style={{ color: "var(--pencil)" }}>{status}</div>
    </div>
  );
}

function QuizScreen({ questions, currentQ, currentIndex, answers, selectAnswer, goNext, goPrev, jumpTo, timerMode, timeLeft, submitTest, answeredCount }) {
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

        {(currentQ.source?.type === "pyq" || currentQ.source === "pyq") ? (
          <div
            className="inline-flex flex-wrap items-center gap-1 ef-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded mb-3"
            style={{
              background: "rgba(36,72,110,0.10)",
              color: "var(--ink)",
            }}
          >
            <span>🏛️ Actual PYQ</span>
            {currentQ.exam && <span>· {currentQ.exam}</span>}
            {currentQ.year && <span>· {currentQ.year}</span>}
            {currentQ.paper && <span>· {currentQ.paper}</span>}
            {currentQ.subject && <span>· {currentQ.subject}</span>}
          </div>
        ) : currentQ.source === "adaptive" ? (
          <div
            className="inline-flex items-center gap-1 ef-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded mb-3"
            style={{
              background: "rgba(47,110,79,0.12)",
              color: "var(--ledger)",
            }}
          >
            <Sparkles size={10} /> Adaptive practice question
          </div>
        ) : currentQ.source === "generated" ? (
          <div
            className="inline-flex items-center gap-1 ef-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded mb-3"
            style={{
              background: "rgba(47,110,79,0.12)",
              color: "var(--ledger)",
            }}
          >
            <Sparkles size={10} /> New practice question
          </div>
        ) : null}

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

function ResultsScreen({ result, onReview, onNewTest, onHistory }) {
  const accuracy = result.total - result.unattempted > 0 ? Math.round((result.correct / (result.total - result.unattempted)) * 100) : 0;
  return (
    <div className="ef-anim">
      <div className="ef-card p-6 sm:p-8 text-center mb-5">
        <div className="ef-corner tl" /><div className="ef-corner tr" /><div className="ef-corner bl" /><div className="ef-corner br" />
        <Trophy size={30} style={{ color: "var(--stamp)", margin: "0 auto" }} />
        <div className="ef-mono text-xs uppercase tracking-widest mt-3" style={{ color: "var(--pencil)" }}>Scorecard</div>
        <div className="ef-serif font-extrabold mt-1" style={{ color: "var(--ink)", fontSize: 48, lineHeight: 1 }}>
          {result.score}<span style={{ fontSize: 22, color: "var(--pencil)" }}> / {result.maxScore}</span>
        </div>
        <div className="text-sm mt-1" style={{ color: "var(--pencil)" }}>{result.examType} &middot; {result.topic}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBox label="Correct" value={result.correct} color="var(--ledger)" />
        <StatBox label="Wrong" value={result.wrong} color="var(--stamp)" />
        <StatBox label="Skipped" value={result.unattempted} color="var(--pencil)" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatBox label="Accuracy" value={`${accuracy}%`} color="var(--ink)" />
        <StatBox label="Time Taken" value={fmtTime(result.timeTakenSec)} color="var(--ink)" />
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={onReview} className="ef-btn-primary w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
          <Eye size={16} /> Review Answers
        </button>
        <div className="flex gap-3">
          <button onClick={onNewTest} className="ef-btn-secondary flex-1 py-2.5 rounded text-sm flex items-center justify-center gap-1.5">
            <RotateCcw size={14} /> New Test
          </button>
          <button onClick={onHistory} className="ef-btn-secondary flex-1 py-2.5 rounded text-sm flex items-center justify-center gap-1.5">
            <HistoryIcon size={14} /> History
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="ef-card p-3 text-center">
      <div className="ef-serif font-bold text-xl" style={{ color }}>{value}</div>
      <div className="ef-mono text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "var(--pencil)" }}>{label}</div>
    </div>
  );
}

function ReviewScreen({ test, onBack }) {
  return (
    <div className="ef-anim">
      <button onClick={onBack} className="ef-btn-secondary px-3 py-1.5 rounded text-sm flex items-center gap-1.5 mb-5">
        <ChevronLeft size={14} /> Back
      </button>
      <div className="flex flex-col gap-4">
        {test.questions.map((q, i) => {
          const isCorrect = q.selected === q.correctIndex;
          const isSkipped = q.selected === null || q.selected === undefined;
          return (
            <div key={q.id} className="ef-card p-4 sm:p-5">
              <div className="ef-corner tl" /><div className="ef-corner tr" /><div className="ef-corner bl" /><div className="ef-corner br" />
              <div className="flex items-center justify-between mb-2">
                <div className="ef-mono text-xs" style={{ color: "var(--pencil)" }}>Q{i + 1}</div>
                {isSkipped ? (
                  <span className="ef-mono text-[10px] uppercase px-2 py-0.5 rounded" style={{ background: "rgba(139,133,120,0.15)", color: "var(--pencil)" }}>Skipped</span>
                ) : isCorrect ? (
                  <span className="ef-mono text-[10px] uppercase px-2 py-0.5 rounded flex items-center gap-1" style={{ background: "rgba(47,110,79,0.12)", color: "var(--ledger)" }}><CheckCircle2 size={11} /> Correct</span>
                ) : (
                  <span className="ef-mono text-[10px] uppercase px-2 py-0.5 rounded flex items-center gap-1" style={{ background: "rgba(178,58,46,0.1)", color: "var(--stamp)" }}><XCircle size={11} /> Wrong</span>
                )}
              </div>
              <div className="ef-serif font-semibold text-base mb-3" style={{ color: "var(--graphite)" }}>{q.question}</div>
              <div className="flex flex-col gap-2 mb-3">
                {q.options.map((opt, idx) => {
                  let cls = "";
                  if (idx === q.correctIndex) cls = "ef-bubble-correct";
                  else if (idx === q.selected) cls = "ef-bubble-wrong";
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`ef-bubble ${cls}`} style={{ width: 30, height: 30, fontSize: 12 }}>{String.fromCharCode(65 + idx)}</div>
                      <div className="text-sm" style={{ color: "var(--graphite)" }}>{opt}</div>
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="text-xs p-2.5 rounded" style={{ background: "rgba(27,42,74,0.05)", color: "var(--graphite)" }}>
                  <span className="ef-mono uppercase" style={{ color: "var(--ink)" }}>Why: </span>{q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryScreen({ history, onOpen, onClear, onNewTest, onBack }) {
  return (
    <div className="ef-anim">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="ef-btn-secondary px-3 py-1.5 rounded text-sm flex items-center gap-1.5">
          <ChevronLeft size={14} /> Back
        </button>
        <button onClick={onNewTest} className="ef-btn-primary px-3 py-1.5 rounded text-sm flex items-center gap-1.5">
          <Sparkles size={14} /> New Test
        </button>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="ef-serif font-bold text-xl" style={{ color: "var(--ink)" }}>Past Attempts</div>
        {history.length > 0 && (
          <button onClick={onClear} className="text-xs ef-mono" style={{ color: "var(--stamp)" }}>Clear All</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="ef-card p-8 text-center">
          <div className="ef-corner tl" /><div className="ef-corner tr" /><div className="ef-corner bl" /><div className="ef-corner br" />
          <FileText size={26} style={{ color: "var(--pencil)", margin: "0 auto" }} />
          <div className="text-sm mt-3" style={{ color: "var(--pencil)" }}>No tests taken yet. Your scorecards will appear here.</div>
          <button onClick={onNewTest} className="ef-btn-primary px-5 py-2.5 rounded font-semibold text-sm mt-4">Start a Test</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((h) => (
            <div key={h.id} onClick={() => onOpen(h.id)} className="ef-card p-4 flex items-center justify-between cursor-pointer">
              <div>
                <div className="ef-serif font-semibold text-sm" style={{ color: "var(--graphite)" }}>{h.topic || "Untitled Test"}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--pencil)" }}>
                  {h.examType} &middot; {new Date(h.date).toLocaleDateString()} &middot; {h.correct}/{h.total} correct
                </div>
              </div>
              <div className="ef-serif font-bold text-lg" style={{ color: "var(--ink)" }}>{h.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Theme ---------- */

const ROOT_VARS = {
  "--ink": "#1B2A4A",
  "--paper": "#F3EFE3",
  "--paper-card": "#FAF7EE",
  "--stamp": "#B23A2E",
  "--graphite": "#2B2B28",
  "--ledger": "#2F6E4F",
  "--pencil": "#8B8578",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.ef-root {
  font-family: 'IBM Plex Sans', sans-serif;
  background-color: var(--paper);
  background-image: repeating-linear-gradient(0deg, rgba(27,42,74,0.035) 0px, rgba(27,42,74,0.035) 1px, transparent 1px, transparent 27px);
  color: var(--graphite);
  min-height: 100vh;
}
.ef-serif { font-family: 'Source Serif 4', serif; }
.ef-mono { font-family: 'IBM Plex Mono', monospace; }

.ef-logo-box {
  width: 34px; height: 34px; border-radius: 4px; background: var(--ink); color: var(--paper);
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px;
}

.ef-card { background: var(--paper-card); border: 1.5px solid var(--ink); border-radius: 6px; position: relative; }
.ef-corner { position: absolute; width: 14px; height: 14px; pointer-events: none; }
.ef-corner.tl { top: -1.5px; left: -1.5px; border-top: 3px solid var(--stamp); border-left: 3px solid var(--stamp); }
.ef-corner.tr { top: -1.5px; right: -1.5px; border-top: 3px solid var(--stamp); border-right: 3px solid var(--stamp); }
.ef-corner.bl { bottom: -1.5px; left: -1.5px; border-bottom: 3px solid var(--stamp); border-left: 3px solid var(--stamp); }
.ef-corner.br { bottom: -1.5px; right: -1.5px; border-bottom: 3px solid var(--stamp); border-right: 3px solid var(--stamp); }

.ef-chip { border: 1.5px solid var(--pencil); background: transparent; color: var(--graphite); transition: all .15s ease; cursor: pointer; }
.ef-chip:hover { border-color: var(--ink); }
.ef-chip-active { background: var(--ink); border-color: var(--ink); color: var(--paper); }

.ef-btn-primary { background: var(--stamp); color: var(--paper); border: none; cursor: pointer; transition: transform .1s ease, box-shadow .15s ease; }
.ef-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 0 rgba(27,42,74,0.2); }
.ef-btn-primary:disabled { opacity: .35; cursor: not-allowed; }
.ef-btn-secondary { background: transparent; border: 1.5px solid var(--ink); color: var(--ink); cursor: pointer; transition: background .15s ease; }
.ef-btn-secondary:hover:not(:disabled) { background: rgba(27,42,74,0.06); }
.ef-btn-secondary:disabled { opacity: .3; cursor: not-allowed; }

.ef-bubble {
  width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--ink);
  display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace;
  font-weight: 600; font-size: 13px; cursor: pointer; flex-shrink: 0; transition: all .15s ease; background: var(--paper-card);
}
.ef-bubble:hover { border-color: var(--stamp); }
.ef-bubble-selected { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.ef-bubble-correct { background: var(--ledger); color: var(--paper); border-color: var(--ledger); }
.ef-bubble-wrong { background: var(--stamp); color: var(--paper); border-color: var(--stamp); }

.ef-dot { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid var(--pencil); cursor: pointer; }
.ef-dot-answered { background: var(--ink); border-color: var(--ink); }
.ef-dot-current { box-shadow: 0 0 0 3px rgba(178,58,46,0.3); border-color: var(--stamp); }

.ef-dashed { border: 2px dashed var(--pencil); transition: border-color .15s ease, background .15s ease; }
.ef-dashed-active { border-color: var(--stamp); background: rgba(178,58,46,0.04); }

.ef-input { border: 1.5px solid var(--pencil); background: var(--paper-card); color: var(--graphite); }
.ef-input:focus { border-color: var(--ink); }

@keyframes ef-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.ef-anim { animation: ef-fade .35s ease; }
`;
