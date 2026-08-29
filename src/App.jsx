import React, { useState, useEffect, useRef } from "react";
import {
  Upload, X, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  History as HistoryIcon, RotateCcw, AlertCircle, Loader2, Trophy,
  FileText, Sparkles, ImageIcon, LogOut, Eye, Bookmark, BookmarkCheck,
  BarChart3, Target, Zap, ChevronDown, Filter, Award, Timer, Hash,
  GraduationCap, Train, Landmark, Building2, Shield, BookOpen
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
  { label: "No Negative", value: 0 },
  { label: "\u22120.25", value: 0.25 },
  { label: "\u22120.33", value: 0.33 },
  { label: "\u22120.5", value: 0.5 },
];
const TIMER_OPTIONS = [
  { key: "none", label: "No Timer" },
  { key: "total", label: "Full Test" },
  { key: "perQuestion", label: "60s / Q" },
];

const EXAM_ICONS = {
  SSC: "🏛️",
  Banking: "🏦",
  Railways: "🚆",
  UPSC: "📜",
  "State PSC": "🗳️",
  "General/Other": "📚",
};

const EXAM_SHORT_DESC = {
  SSC: "CGL, CHSL, MTS & more",
  Banking: "IBPS, SBI, RBI",
  Railways: "NTPC, Group D, ALP",
  UPSC: "CSE, CDS, NDA",
  "State PSC": "UPPSC, BPSC, MPSC",
  "General/Other": "Teaching, Police & GK",
};

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
    "bpsc", "uppsc", "mppsc", "rpsc", "jpsc", "opsc", "wbcs", "wbpsc",
    "hpsc", "gpsc", "cgpsc", "jkpsc", "kpsc", "appsc", "tspsc", "tnpsc",
    "ukpsc", "hppsc", "ppsc", "mpsc", "public service commission",
    "provincial civil service", "pcs",
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

function getDifficultyLabel(levelMeta) {
  const target = getTargetExamLevel(levelMeta);
  if (target === "basic") return "Easy";
  if (target === "advanced") return "Hard";
  return "Medium";
}

function getDifficultyColor(label) {
  if (label === "Easy") return "var(--success)";
  if (label === "Hard") return "var(--danger)";
  return "var(--warning)";
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

/* ============================================
   MAIN APP COMPONENT
   ============================================ */

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

  // New state for enhanced features
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

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
      setMarkedForReview(new Set());
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

  function toggleReview(qId) {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      if (timerMode === "perQuestion") setTimeLeft(60);
    } else {
      setShowSubmitConfirm(true);
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
    setShowSubmitConfirm(false);
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
    setMarkedForReview(new Set());
    setShowSubmitConfirm(false);
  }

  function exitQuiz() {
    if (window.confirm("Exit this test? Your progress will be lost.")) {
      resetToSetup();
    }
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="ef-root">
      <div className="ef-container">
        {/* Navbar */}
        <div className="ef-navbar">
          <div className="ef-logo" onClick={() => screen !== "quiz" && resetToSetup()}>
            <div className="ef-logo-icon">EF</div>
            <div>
              <div className="ef-logo-text">ExamForge</div>
              <div className="ef-logo-sub">Mock Test Generator</div>
            </div>
          </div>
          {screen === "quiz" ? (
            <button onClick={exitQuiz} className="ef-btn ef-btn-secondary" style={{ padding: "8px 16px" }}>
              <LogOut size={14} /> Exit
            </button>
          ) : (
            <button
              onClick={() => { setPrevScreen(screen === "history" ? prevScreen : screen); setScreen("history"); loadHistoryList(); }}
              className="ef-btn ef-btn-secondary" style={{ padding: "8px 16px" }}
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
            jumpTo={jumpTo} timerMode={timerMode} timeLeft={timeLeft}
            submitTest={() => setShowSubmitConfirm(true)}
            answeredCount={answeredCount}
            markedForReview={markedForReview} toggleReview={toggleReview}
            examType={examType} subExam={subExam}
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

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="ef-overlay" onClick={() => setShowSubmitConfirm(false)}>
          <div className="ef-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center" }}>
              <AlertCircle size={40} style={{ color: "var(--warning)", margin: "0 auto 12px" }} />
              <h3 className="ef-subheading" style={{ fontSize: 18, marginBottom: 8 }}>Submit Test?</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 4 }}>
                {answeredCount} of {questions.length} questions answered
              </p>
              {questions.length - answeredCount > 0 && (
                <p style={{ color: "var(--warning)", fontSize: 13, fontWeight: 600 }}>
                  {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} unanswered
                </p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="ef-btn ef-btn-secondary"
                  style={{ flex: 1, padding: "10px 16px" }}
                >
                  Continue Test
                </button>
                <button
                  onClick={submitTest}
                  className="ef-btn ef-btn-primary"
                  style={{ flex: 1, padding: "10px 16px" }}
                >
                  <CheckCircle2 size={16} /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   SETUP SCREEN
   ============================================ */

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
  const levelMeta = getExamLevelMetadata(examType, subExam);
  const diffLabel = getDifficultyLabel(levelMeta);

  return (
    <div className="ef-anim">
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="ef-heading" style={{ fontSize: "clamp(24px, 5vw, 36px)", color: "var(--text-primary)", marginBottom: 8 }}>
          Generate Mock Tests<br />
          <span style={{ color: "var(--primary)" }}>for Any Exam</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, maxWidth: 480 }}>
          Upload question papers or pick a topic — ExamForge creates timed, negatively-marked tests
          matching your exam's difficulty level.
        </p>
      </div>

      {/* Step 1 — Choose Exam */}
      <div className="ef-card" style={{ padding: "20px 20px 24px", marginBottom: 16 }}>
        <div className="ef-section-label" style={{ marginBottom: 14 }}>
          <Target size={14} /> Step 1 — Choose Your Exam
        </div>

        <div className="ef-exam-grid">
          {categories.map((cat) => (
            <div
              key={cat}
              className={`ef-exam-card ${examType === cat ? "ef-exam-card-active" : ""}`}
              onClick={() => { setExamType(cat); setSubExam(""); }}
            >
              <div className="ef-exam-card-icon">{EXAM_ICONS[cat] || "📝"}</div>
              <div className="ef-exam-card-name">{cat}</div>
              <div className="ef-exam-card-desc">{EXAM_SHORT_DESC[cat] || ""}</div>
            </div>
          ))}
        </div>

        {/* Sub-exam select */}
        {examType && availableSubExams.length > 0 && (
          <div className="ef-anim" style={{ marginTop: 14 }}>
            <div className="ef-label" style={{ marginBottom: 6 }}>Sub Exam</div>
            <select
              value={subExam}
              onChange={(e) => setSubExam(e.target.value)}
              className="ef-select"
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

        {/* Difficulty badge */}
        <div className="ef-anim" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ef-badge" style={{
            background: `${getDifficultyColor(diffLabel)}15`,
            color: getDifficultyColor(diffLabel),
          }}>
            <Zap size={10} /> Difficulty: {diffLabel}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{levelMeta}</span>
        </div>
      </div>

      {/* Step 2 — Topic & Source */}
      <div className="ef-card" style={{ padding: "20px", marginBottom: 16 }}>
        <div className="ef-section-label" style={{ marginBottom: 14 }}>
          <BookOpen size={14} /> Step 2 — Topic & Question Source
        </div>

        {/* Topic input */}
        <div style={{ marginBottom: 16 }}>
          <div className="ef-label" style={{ marginBottom: 6 }}>Topic / Subject</div>
          <input
            type="text" value={topicText} onChange={(e) => setTopicText(e.target.value)}
            placeholder="e.g. Indian Polity — Fundamental Rights, Banking Awareness — RBI"
            className="ef-input"
          />
        </div>

        {/* Image upload */}
        <div className="ef-label" style={{ marginBottom: 6 }}>Upload Question Paper (Optional)</div>
        <div
          className={`ef-dropzone ${dragActive ? "ef-dropzone-active" : ""}`}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload size={22} style={{ color: "var(--primary)", margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Drop images here, or click to upload</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>JPG or PNG · {images.length}/5 uploaded</div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="ef-hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {images.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {images.map((img) => (
              <div key={img.id} style={{ position: "relative" }}>
                <img
                  src={img.preview} alt={img.name}
                  style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  style={{
                    position: "absolute", top: -6, right: -6, width: 20, height: 20,
                    borderRadius: "50%", background: "var(--danger)", color: "white",
                    border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 0
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 3 — Test Configuration */}
      <div className="ef-card" style={{ padding: "20px", marginBottom: 16 }}>
        <div className="ef-section-label" style={{ marginBottom: 14 }}>
          <BarChart3 size={14} /> Step 3 — Test Configuration
        </div>

        {/* Questions count */}
        <div style={{ marginBottom: 16 }}>
          <div className="ef-label" style={{ marginBottom: 8 }}>Questions to Generate</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {NUM_GEN_OPTIONS.map((n) => {
              const label = n === 0 ? "None" : `+${n}`;
              return (
                <button
                  key={n}
                  onClick={() => setNumGenerate(n)}
                  className={`ef-chip ${numGenerate === n ? "ef-chip-active" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Negative marking */}
        <div style={{ marginBottom: 16 }}>
          <div className="ef-label" style={{ marginBottom: 8 }}>Negative Marking</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {NEG_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setNegativeMarking(o.value)}
                className={`ef-chip ${negativeMarking === o.value ? "ef-chip-active" : ""}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <div className="ef-label" style={{ marginBottom: 8 }}>Timer</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TIMER_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => setTimerMode(o.key)}
                className={`ef-chip ${timerMode === o.key ? "ef-chip-active" : ""}`}
              >
                <Clock size={12} /> {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
          borderRadius: "var(--radius-sm)", marginBottom: 16,
          background: "var(--danger-light)", color: "var(--danger)", fontSize: 13
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        disabled={!canStart}
        onClick={runGeneration}
        className="ef-btn ef-btn-primary"
        style={{ width: "100%", padding: "14px 20px", borderRadius: "var(--radius-md)", fontSize: 16, fontWeight: 700 }}
      >
        <Sparkles size={18} /> Generate Mock Test
      </button>
      {!canStart && (
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          Upload an image or type a topic to get started
        </div>
      )}
    </div>
  );
}

/* ============================================
   PROCESSING SCREEN
   ============================================ */

function ProcessingScreen({ status }) {
  return (
    <div className="ef-anim" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center" }}>
      <div className="ef-card" style={{ padding: "48px 32px", width: "100%", maxWidth: 420 }}>
        {/* Animated dots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          <div className="ef-processing-dot" />
          <div className="ef-processing-dot" />
          <div className="ef-processing-dot" />
        </div>
        <h2 className="ef-subheading" style={{ fontSize: 20, marginBottom: 8, color: "var(--text-primary)" }}>Building Your Test</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{status || "Preparing questions..."}</p>
      </div>
    </div>
  );
}

/* ============================================
   QUIZ SCREEN
   ============================================ */

function QuizScreen({ questions, currentQ, currentIndex, answers, selectAnswer, goNext, goPrev, jumpTo, timerMode, timeLeft, submitTest, answeredCount, markedForReview, toggleReview, examType, subExam }) {
  const isLast = currentIndex === questions.length - 1;
  const selected = answers[currentQ.id];
  const isReviewed = markedForReview.has(currentQ.id);
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="ef-anim">
      {/* Progress bar */}
      <div className="ef-progress-bar" style={{ marginBottom: 16 }}>
        <div className="ef-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ef-badge ef-badge-primary">
            Q {currentIndex + 1}/{questions.length}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {answeredCount} answered
          </span>
        </div>
        {timerMode !== "none" && (
          <div className={`ef-timer ${timeLeft <= 10 ? "ef-timer-danger" : ""}`}>
            <Clock size={14} /> {fmtTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Question palette */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {questions.map((q, i) => {
          let cls = "ef-qdot";
          if (i === currentIndex) cls += " ef-qdot-current";
          if (answers[q.id] !== undefined) cls += " ef-qdot-answered";
          if (markedForReview.has(q.id)) cls += " ef-qdot-review";
          return (
            <div key={q.id} onClick={() => jumpTo(i)} className={cls} title={`Q${i + 1}`}>
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* Question card */}
      <div className="ef-card" style={{ padding: "20px 24px" }}>
        {/* Source & difficulty badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {(currentQ.source?.type === "pyq" || currentQ.source === "pyq") ? (
            <span className="ef-badge ef-badge-primary">
              🏛️ PYQ {currentQ.exam && `· ${currentQ.exam}`} {currentQ.year && `· ${currentQ.year}`}
            </span>
          ) : currentQ.source === "generated" ? (
            <span className="ef-badge ef-badge-success">
              <Sparkles size={10} /> AI Generated
            </span>
          ) : currentQ.source === "extracted" ? (
            <span className="ef-badge" style={{ background: "#FEF3C7", color: "#92400E" }}>
              <ImageIcon size={10} /> Extracted
            </span>
          ) : null}
          {isReviewed && (
            <span className="ef-badge ef-badge-warning">
              <Bookmark size={10} /> Marked for Review
            </span>
          )}
        </div>

        {/* Question text */}
        <h3 className="ef-subheading" style={{ fontSize: 16, lineHeight: 1.55, marginBottom: 20, color: "var(--text-primary)", whiteSpace: "pre-line" }}>
          {currentQ.question}
        </h3>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {currentQ.options.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => selectAnswer(currentQ.id, idx)}
              className={`ef-option ${selected === idx ? "ef-option-selected" : ""}`}
            >
              <div className="ef-option-letter">{String.fromCharCode(65 + idx)}</div>
              <div className="ef-option-text">{opt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, gap: 8 }}>
        <button onClick={goPrev} disabled={currentIndex === 0} className="ef-btn ef-btn-secondary" style={{ padding: "10px 16px" }}>
          <ChevronLeft size={16} /> Prev
        </button>

        <button
          onClick={() => toggleReview(currentQ.id)}
          className={`ef-btn ${isReviewed ? "ef-btn-secondary" : "ef-btn-ghost"}`}
          style={{ padding: "10px 14px" }}
          title={isReviewed ? "Remove from review" : "Mark for review"}
        >
          {isReviewed ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>

        {isLast ? (
          <button onClick={submitTest} className="ef-btn ef-btn-primary" style={{ padding: "10px 20px" }}>
            Submit <CheckCircle2 size={16} />
          </button>
        ) : (
          <button onClick={goNext} className="ef-btn ef-btn-primary" style={{ padding: "10px 20px" }}>
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16, justifyContent: "center" }}>
        {[
          { cls: "ef-qdot", label: "Not visited" },
          { cls: "ef-qdot ef-qdot-answered", label: "Answered" },
          { cls: "ef-qdot ef-qdot-review", label: "Review" },
          { cls: "ef-qdot ef-qdot-current", label: "Current" },
        ].map(({ cls, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
            <div className={cls} style={{ width: 16, height: 16, fontSize: 0, cursor: "default" }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================
   RESULTS SCREEN
   ============================================ */

function ResultsScreen({ result, onReview, onNewTest, onHistory }) {
  const accuracy = result.total - result.unattempted > 0 ? Math.round((result.correct / (result.total - result.unattempted)) * 100) : 0;
  const scorePct = result.maxScore > 0 ? Math.max(0, Math.round((result.score / result.maxScore) * 100)) : 0;
  const circumference = 2 * Math.PI * 65;
  const strokeOffset = circumference - (circumference * scorePct) / 100;
  const ringColor = scorePct >= 70 ? "var(--success)" : scorePct >= 40 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="ef-anim">
      {/* Score card */}
      <div className="ef-card" style={{ padding: "32px 24px", textAlign: "center", marginBottom: 16 }}>
        <Award size={28} style={{ color: "var(--primary)", margin: "0 auto 8px" }} />
        <div className="ef-label" style={{ marginBottom: 16 }}>Test Complete</div>

        {/* Score ring */}
        <div className="ef-score-ring">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle className="ef-score-ring-bg" cx="80" cy="80" r="65" />
            <circle
              className="ef-score-ring-fill"
              cx="80" cy="80" r="65"
              stroke={ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          </svg>
          <div className="ef-score-ring-text">
            <div className="ef-heading" style={{ fontSize: 36, color: ringColor }}>{result.score}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>of {result.maxScore}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 12 }}>
          {result.examType} · {result.topic}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        <div className="ef-card ef-stat">
          <div className="ef-stat-value" style={{ color: "var(--success)" }}>{result.correct}</div>
          <div className="ef-stat-label">Correct</div>
        </div>
        <div className="ef-card ef-stat">
          <div className="ef-stat-value" style={{ color: "var(--danger)" }}>{result.wrong}</div>
          <div className="ef-stat-label">Wrong</div>
        </div>
        <div className="ef-card ef-stat">
          <div className="ef-stat-value" style={{ color: "var(--text-muted)" }}>{result.unattempted}</div>
          <div className="ef-stat-label">Skipped</div>
        </div>
        <div className="ef-card ef-stat">
          <div className="ef-stat-value" style={{ color: "var(--primary)" }}>{accuracy}%</div>
          <div className="ef-stat-label">Accuracy</div>
        </div>
      </div>

      {/* Time & Details */}
      <div className="ef-card" style={{ padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Time Taken</div>
          <div className="ef-subheading" style={{ fontSize: 18, color: "var(--text-primary)", marginTop: 2 }}>{fmtTime(result.timeTakenSec)}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Avg / Question</div>
          <div className="ef-subheading" style={{ fontSize: 18, color: "var(--text-primary)", marginTop: 2 }}>
            {result.total > 0 ? fmtTime(Math.round(result.timeTakenSec / result.total)) : "—"}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Neg. Marks</div>
          <div className="ef-subheading" style={{ fontSize: 18, color: "var(--danger)", marginTop: 2 }}>
            {result.negativeMarking > 0 ? `-${(result.wrong * result.negativeMarking).toFixed(2)}` : "0"}
          </div>
        </div>
      </div>

      {/* Topic-wise breakdown */}
      {result.performance && Object.keys(result.performance.topicWise || {}).length > 0 && (
        <div className="ef-card" style={{ padding: "16px 20px", marginBottom: 16 }}>
          <div className="ef-section-label" style={{ marginBottom: 12 }}>
            <BarChart3 size={14} /> Topic-wise Performance
          </div>
          {Object.entries(result.performance.topicWise).map(([topic, stats]) => {
            const pct = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
            return (
              <div key={topic} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{topic}</span>
                  <span style={{ color: pct >= 60 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{stats.correct}/{stats.attempted}</span>
                </div>
                <div className="ef-progress-bar" style={{ height: 6 }}>
                  <div className="ef-progress-fill" style={{
                    width: `${pct}%`,
                    background: pct >= 60 ? "var(--success)" : "var(--danger)"
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onReview} className="ef-btn ef-btn-primary" style={{ width: "100%", padding: "12px 20px", borderRadius: "var(--radius-md)" }}>
          <Eye size={16} /> Review All Answers
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onNewTest} className="ef-btn ef-btn-secondary" style={{ flex: 1, padding: "10px 16px", borderRadius: "var(--radius-sm)" }}>
            <RotateCcw size={14} /> New Test
          </button>
          <button onClick={onHistory} className="ef-btn ef-btn-secondary" style={{ flex: 1, padding: "10px 16px", borderRadius: "var(--radius-sm)" }}>
            <HistoryIcon size={14} /> History
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   REVIEW SCREEN
   ============================================ */

function ReviewScreen({ test, onBack }) {
  const [filter, setFilter] = useState("all");

  const filtered = test.questions.filter((q) => {
    if (filter === "all") return true;
    const isSkipped = q.selected === null || q.selected === undefined;
    if (filter === "correct") return !isSkipped && q.selected === q.correctIndex;
    if (filter === "wrong") return !isSkipped && q.selected !== q.correctIndex;
    if (filter === "skipped") return isSkipped;
    return true;
  });

  const counts = {
    all: test.questions.length,
    correct: test.questions.filter((q) => q.selected !== null && q.selected !== undefined && q.selected === q.correctIndex).length,
    wrong: test.questions.filter((q) => q.selected !== null && q.selected !== undefined && q.selected !== q.correctIndex).length,
    skipped: test.questions.filter((q) => q.selected === null || q.selected === undefined).length,
  };

  return (
    <div className="ef-anim">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onBack} className="ef-btn ef-btn-secondary" style={{ padding: "8px 14px" }}>
          <ChevronLeft size={14} /> Back
        </button>
        <h2 className="ef-subheading" style={{ fontSize: 16 }}>Answer Review</h2>
        <div style={{ width: 72 }} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {[
          { key: "all", label: `All (${counts.all})` },
          { key: "correct", label: `Correct (${counts.correct})` },
          { key: "wrong", label: `Wrong (${counts.wrong})` },
          { key: "skipped", label: `Skipped (${counts.skipped})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`ef-tab ${filter === tab.key ? "ef-tab-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ef-card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
          No questions in this category.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((q, i) => {
            const origIdx = test.questions.indexOf(q);
            const isCorrect = q.selected === q.correctIndex;
            const isSkipped = q.selected === null || q.selected === undefined;
            return (
              <ReviewCard key={q.id} q={q} index={origIdx} isCorrect={isCorrect} isSkipped={isSkipped} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ q, index, isCorrect, isSkipped }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="ef-card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", cursor: "pointer", borderBottom: expanded ? "1px solid var(--border-light)" : "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ef-badge ef-badge-muted" style={{ fontVariantNumeric: "tabular-nums" }}>Q{index + 1}</span>
          {isSkipped ? (
            <span className="ef-badge ef-badge-muted">Skipped</span>
          ) : isCorrect ? (
            <span className="ef-badge ef-badge-success"><CheckCircle2 size={10} /> Correct</span>
          ) : (
            <span className="ef-badge ef-badge-danger"><XCircle size={10} /> Wrong</span>
          )}
        </div>
        <ChevronDown size={16} style={{
          color: "var(--text-muted)", transition: "transform 0.2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
        }} />
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: "16px" }}>
          <p className="ef-subheading" style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 14, color: "var(--text-primary)", whiteSpace: "pre-line" }}>
            {q.question}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {q.options.map((opt, idx) => {
              let cls = "ef-option";
              if (idx === q.correctIndex) cls += " ef-option-correct";
              else if (idx === q.selected && idx !== q.correctIndex) cls += " ef-option-wrong";
              return (
                <div key={idx} className={cls} style={{ cursor: "default", padding: "10px 14px" }}>
                  <div className="ef-option-letter" style={{ width: 28, height: 28, fontSize: 11 }}>{String.fromCharCode(65 + idx)}</div>
                  <div className="ef-option-text" style={{ fontSize: 13 }}>{opt}</div>
                </div>
              );
            })}
          </div>

          {q.explanation && (
            <div className="ef-explanation">
              <strong>Explanation: </strong>{q.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================
   HISTORY SCREEN
   ============================================ */

function HistoryScreen({ history, onOpen, onClear, onNewTest, onBack }) {
  return (
    <div className="ef-anim">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={onBack} className="ef-btn ef-btn-secondary" style={{ padding: "8px 14px" }}>
          <ChevronLeft size={14} /> Back
        </button>
        <button onClick={onNewTest} className="ef-btn ef-btn-primary" style={{ padding: "8px 16px" }}>
          <Sparkles size={14} /> New Test
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="ef-subheading" style={{ fontSize: 20 }}>Past Attempts</h2>
        {history.length > 0 && (
          <button onClick={onClear} className="ef-btn ef-btn-ghost" style={{ fontSize: 12, color: "var(--danger)", padding: "4px 8px" }}>
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="ef-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <FileText size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>No tests taken yet. Your results will appear here.</p>
          <button onClick={onNewTest} className="ef-btn ef-btn-primary" style={{ padding: "10px 24px" }}>Start a Test</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.map((h) => {
            const pct = h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0;
            const scoreColor = pct >= 70 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)";
            return (
              <div key={h.id} onClick={() => onOpen(h.id)} className="ef-card ef-card-interactive" style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ef-subheading" style={{ fontSize: 14, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.topic || "Untitled Test"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {h.examType} · {new Date(h.date).toLocaleDateString()} · {h.correct}/{h.total} correct
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                  <span className="ef-badge" style={{ background: `${scoreColor}18`, color: scoreColor, fontWeight: 700 }}>
                    {pct}%
                  </span>
                  <span className="ef-subheading" style={{ fontSize: 18, color: "var(--text-primary)" }}>{h.score}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
