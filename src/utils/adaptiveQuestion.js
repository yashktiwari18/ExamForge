import { generateBatch } from "../api/aiService";

const DIFFICULTY_LEVELS = ["easy", "medium", "hard"];

function getDifficultyLevel(question, tracking = {}) {
  const value = String(question.difficulty || "medium").toLowerCase();
  let level = value.includes("hard") ? "hard" : value.includes("easy") ? "easy" : "medium";
  let index = DIFFICULTY_LEVELS.indexOf(level);

  if (tracking.incorrectCount >= 2 && tracking.correctCount < tracking.incorrectCount && index > 0) {
    index -= 1;
  } else if (tracking.correctCount >= 2 && tracking.correctCount > tracking.incorrectCount && index < DIFFICULTY_LEVELS.length - 1) {
    index += 1;
  }

  return DIFFICULTY_LEVELS[index];
}

function getOptionSignature(options = []) {
  return options
    .map((option) => String(option).trim())
    .sort()
    .join("|");
}

function isValidAdaptiveQuestion(candidate, originalQuestion, existingQuestions) {
  if (!candidate || typeof candidate.question !== "string" || !candidate.question.trim()) return false;
  if (!Array.isArray(candidate.options) || candidate.options.length !== 4) return false;
  if (new Set(candidate.options.map((option) => String(option).trim())).size !== 4) return false;
  if (!Number.isInteger(candidate.correctIndex) || candidate.correctIndex < 0 || candidate.correctIndex > 3) return false;
  if (candidate.question.trim() === String(originalQuestion.question || "").trim()) return false;

  const originalOptions = getOptionSignature(originalQuestion.options);
  const candidateOptions = getOptionSignature(candidate.options);
  if (candidateOptions === originalOptions) return false;

  return !existingQuestions.some((question) => (
    question.question?.trim() === candidate.question.trim() ||
    (question.options || []).map((option) => String(option).trim()).join("|") === candidateOptions
  ));
}

export async function generateAdaptiveQuestion({
  originalQuestion,
  tracking = {},
  examType,
  existingQuestions = [],
}) {
  if (!originalQuestion || (!tracking.isMistake && !(tracking.incorrectCount > 0))) return null;

  const targetDifficulty = getDifficultyLevel(originalQuestion, tracking);
  const topic = originalQuestion.topic || "General Knowledge";
  const subtopic = originalQuestion.subtopic || topic;
  const learningTarget = `${topic}; focus concept: ${subtopic}; target difficulty: ${targetDifficulty}`;
  const avoidList = [
    ...existingQuestions.map((question) => question.question).filter(Boolean),
    originalQuestion.question,
  ];

  const result = await generateBatch(
    learningTarget,
    examType || originalQuestion.examType || "General/Other",
    avoidList,
    1
  );
  const candidate = result?.questions?.[0];

  if (!isValidAdaptiveQuestion(candidate, originalQuestion, existingQuestions)) return null;

  const baseId = originalQuestion.questionId || originalQuestion.id;
  const suffix = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    ...candidate,
    id: `${baseId}-adaptive-${suffix}`,
    questionId: `${baseId}-adaptive-${suffix}`,
    topic,
    subtopic,
    examType: examType || originalQuestion.examType || "General/Other",
    difficulty: targetDifficulty,
    source: "adaptive",
  };
}
