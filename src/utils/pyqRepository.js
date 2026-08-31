import pyqData from "../../data/pyq/verified-pyqs.json";

const EXAM_ALIASES = {
  ssc: ["ssc", "staff selection commission", "combined graduate level", "cgl", "chsl", "mts", "multi tasking staff", "multi-tasking staff"],
  upsc: ["upsc", "civil services", "cse", "civil services examination"],
  banking: ["banking", "ibps", "sbi", "rbi", "bank"],
  railways: ["railway", "rrb", "ntpc", "group d", "alp"],
  "state psc": ["state psc", "state pcs", "bpsc", "uppsc", "mppsc", "rpsc", "mpsc", "wbcs", "kpsc", "tnpsc", "pcs"],
  "general/other": ["general", "general knowledge", "aptitude", "other"],
};

const TOPIC_ALIASES = {
  "quantitative aptitude": ["quant", "quantitative aptitude", "math", "mathematics", "numerical ability", "arithmetic", "percentage", "ratio", "profit and loss", "simplification", "average", "time and work", "time speed distance", "speed and distance", "interest", "algebra", "number system", "geometry", "trigonometry"],
  "general reasoning": ["reasoning", "logical reasoning", "analytical reasoning", "verbal reasoning", "non verbal reasoning"],
  "general awareness": ["gk", "general awareness", "current affairs", "static gk"],
  "indian polity": ["polity", "constitution", "fundamental rights", "parliament", "president", "governor", "federalism", "indian polity"],
  "indian geography": ["geography", "indian geography", "physical geography", "world geography", "map"],
  economy: ["economy", "indian economy", "budget", "banking awareness", "finance"],
  history: ["history", "modern history", "ancient history", "medieval history", "freedom struggle"],
  science: ["science", "physics", "chemistry", "biology", "science and tech", "technology", "environment"],
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeExamName(value = "") {
  const text = normalizeText(value);
  if (!text) return "";

  for (const [key, aliases] of Object.entries(EXAM_ALIASES)) {
    if (aliases.some((alias) => text.includes(alias))) {
      return key;
    }
  }

  return text;
}

function canonicalizeTopic(value = "") {
  const text = normalizeText(value);
  if (!text) return "";

  for (const [key, aliases] of Object.entries(TOPIC_ALIASES)) {
    if (aliases.some((alias) => text.includes(alias))) {
      return key;
    }
  }

  return text;
}

function topicMatchScore(pyq, targetTopic) {
  if (!targetTopic) return 0;

  const pyqTopicText = normalizeText(`${pyq.subject || ""} ${pyq.topic || ""}`);
  const target = normalizeText(targetTopic);
  const pyqCanonical = canonicalizeTopic(pyqTopicText);
  const targetCanonical = canonicalizeTopic(target);

  if (pyqCanonical && targetCanonical && pyqCanonical === targetCanonical) {
    return 35;
  }

  if (pyqTopicText.includes(target) || target.includes(pyqTopicText)) {
    return 20;
  }

  return 0;
}

function examMatchScore(pyq, targetExam) {
  if (!targetExam) return 0;

  const pyqExam = canonicalizeExamName(pyq.exam || "");
  const target = canonicalizeExamName(targetExam);

  if (pyqExam && target && pyqExam === target) {
    return 45;
  }

  if (pyqExam && target && pyqExam.includes(target)) {
    return 30;
  }

  if (pyqExam && target && target.includes(pyqExam)) {
    return 25;
  }

  return 0;
}

export function getAllPYQs() {
  return [
    ...(pyqData.pyqs || []),
  ];
}

export function getVerifiedPYQs() {
  return getAllPYQs().filter((pyq) => pyq.source?.verified === true);
}

export function filterPYQs({
  exam,
  state,
  year,
  paper,
  subject,
  topic,
  verifiedOnly = true,
} = {}) {
  let pyqs = verifiedOnly ? getVerifiedPYQs() : getAllPYQs();

  if (exam) {
    const examKey = normalizeText(exam);
    pyqs = pyqs.filter((pyq) => {
      const pyqExam = normalizeText(pyq.exam || "");
      return pyqExam.includes(examKey) || examKey.includes(pyqExam);
    });
  }

  if (state) {
    pyqs = pyqs.filter((pyq) => pyq.state === state);
  }

  if (year) {
    pyqs = pyqs.filter((pyq) => pyq.year === Number(year));
  }

  if (paper) {
    pyqs = pyqs.filter((pyq) => pyq.paper === paper);
  }

  if (subject) {
    const subjectKey = normalizeText(subject);
    pyqs = pyqs.filter((pyq) => normalizeText(pyq.subject || "").includes(subjectKey));
  }

  if (topic) {
    const topicKey = normalizeText(topic);
    pyqs = pyqs.filter((pyq) => {
      const pyqText = normalizeText(`${pyq.subject || ""} ${pyq.topic || ""}`);
      return pyqText.includes(topicKey) || topicKey.includes(pyqText);
    });
  }

  return pyqs;
}

export function getReferencePYQs(examGuess = "", topic = "", limit = 5) {
  const targetExam = normalizeText(examGuess);
  const targetTopic = normalizeText(topic);

  let pyqs = getVerifiedPYQs();

  if (targetExam) {
    pyqs = pyqs.filter((pyq) => {
      const pyqExam = normalizeText(pyq.exam || "");
      return pyqExam.includes(targetExam) || targetExam.includes(pyqExam);
    });
  }

  if (targetTopic) {
    pyqs = pyqs.filter((pyq) => {
      const pyqText = normalizeText(`${pyq.subject || ""} ${pyq.topic || ""}`);
      return pyqText.includes(targetTopic) || targetTopic.includes(pyqText);
    });
  }

  return pyqs
    .map((pyq) => ({
      pyq,
      score: examMatchScore(pyq, examGuess) + topicMatchScore(pyq, topic),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ pyq }) => pyq);
}

export function getPYQById(id) {
  return getAllPYQs().find((pyq) => pyq.id === id) || null;
}