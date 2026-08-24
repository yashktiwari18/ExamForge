import pyqData from "../../data/pyq/verified-pyqs.json";

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
    pyqs = pyqs.filter((pyq) => pyq.exam === exam);
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
    pyqs = pyqs.filter((pyq) => pyq.subject === subject);
  }

  if (topic) {
    pyqs = pyqs.filter((pyq) => pyq.topic === topic);
  }

  return pyqs;
}

export function getPYQById(id) {
  return getAllPYQs().find((pyq) => pyq.id === id) || null;
}