/**
 * examConfig.js
 * Hierarchical configuration for Exam -> Sub Exam selection with level metadata.
 */

export const EXAM_CONFIG = {
  SSC: {
    id: "SSC",
    name: "SSC",
    label: "SSC (Staff Selection Commission)",
    description: "Central government recruitment for various non-technical and technical posts.",
    defaultLevel: "Easy to Moderate",
    subExams: [
      { id: "ssc_cgl", name: "SSC CGL", fullName: "Combined Graduate Level", level: "Graduate / Moderate to Hard" },
      { id: "ssc_chsl", name: "SSC CHSL", fullName: "Combined Higher Secondary Level", level: "10+2 / Moderate" },
      { id: "ssc_mts", name: "SSC MTS", fullName: "Multi-Tasking Staff", level: "Matriculation / Easy to Moderate" },
      { id: "ssc_cpo", name: "SSC CPO", fullName: "Central Police Organisation SI", level: "Graduate / Moderate" },
      { id: "ssc_gd", name: "SSC GD Constable", fullName: "General Duty Constable", level: "Matriculation / Easy" },
      { id: "ssc_steno", name: "SSC Stenographer", fullName: "Stenographer Grade C & D", level: "10+2 / Easy to Moderate" },
      { id: "ssc_je", name: "SSC JE", fullName: "Junior Engineer", level: "Diploma / Degree / Moderate" },
    ],
  },
  Banking: {
    id: "Banking",
    name: "Banking",
    label: "Banking & Financial Exams",
    description: "Public and private sector bank officer and clerical recruitment exams.",
    defaultLevel: "Moderate to Hard",
    subExams: [
      { id: "ibps_po", name: "IBPS PO", fullName: "IBPS Probationary Officer", level: "Graduate / Moderate to Hard" },
      { id: "ibps_clerk", name: "IBPS Clerk", fullName: "IBPS Clerical Cadre", level: "Graduate / Easy to Moderate" },
      { id: "sbi_po", name: "SBI PO", fullName: "State Bank of India PO", level: "Graduate / Hard" },
      { id: "sbi_clerk", name: "SBI Clerk", fullName: "State Bank of India Clerk", level: "Graduate / Moderate" },
      { id: "rbi_grade_b", name: "RBI Grade B", fullName: "Reserve Bank of India Officer", level: "Graduate / Advanced" },
      { id: "rbi_assistant", name: "RBI Assistant", fullName: "Reserve Bank of India Assistant", level: "Graduate / Moderate" },
      { id: "ibps_rrb_po", name: "IBPS RRB Officer", fullName: "Regional Rural Bank Scale I", level: "Graduate / Moderate" },
      { id: "ibps_rrb_clerk", name: "IBPS RRB Assistant", fullName: "Regional Rural Bank Office Assistant", level: "Graduate / Easy to Moderate" },
    ],
  },
  Railways: {
    id: "Railways",
    name: "Railways",
    label: "Railway Recruitment Board (RRB)",
    description: "Indian Railways recruitment for technical and non-technical categories.",
    defaultLevel: "Easy to Moderate",
    subExams: [
      { id: "rrb_ntpc", name: "RRB NTPC", fullName: "Non-Technical Popular Categories", level: "Graduate & 10+2 / Easy to Moderate" },
      { id: "rrb_group_d", name: "RRB Group D", fullName: "Level-1 Posts", level: "10th / ITI / Easy" },
      { id: "rrb_alp", name: "RRB ALP", fullName: "Assistant Loco Pilot & Technician", level: "Matriculation / ITI / Moderate" },
      { id: "rrb_je", name: "RRB JE", fullName: "Junior Engineer", level: "Diploma / Degree / Moderate" },
      { id: "rpf_si_constable", name: "RPF SI & Constable", fullName: "Railway Protection Force", level: "Graduate & 10th / Moderate" },
    ],
  },
  UPSC: {
    id: "UPSC",
    name: "UPSC",
    label: "UPSC (Union Public Service Commission)",
    description: "Premier civil services and defence recruitment examinations.",
    defaultLevel: "Hard & Conceptual",
    subExams: [
      { id: "upsc_cse", name: "UPSC CSE Prelims", fullName: "Civil Services Examination", level: "Graduate / Hard & Conceptual" },
      { id: "upsc_cds", name: "UPSC CDS", fullName: "Combined Defence Services", level: "Graduate / Moderate to Hard" },
      { id: "upsc_nda", name: "UPSC NDA", fullName: "National Defence Academy", level: "10+2 / Moderate" },
      { id: "upsc_capf", name: "UPSC CAPF", fullName: "Central Armed Police Forces AC", level: "Graduate / Moderate to Hard" },
      { id: "upsc_ese", name: "UPSC ESE", fullName: "Engineering Services Examination", level: "Engineering Degree / Hard" },
    ],
  },
  "State PSC": {
    id: "State PSC",
    name: "State PSC",
    label: "State Public Service Commissions",
    description: "State civil services and administrative examinations across Indian states.",
    defaultLevel: "Moderate to Hard",
    subExams: [
      { id: "uppsc", name: "UPPSC", fullName: "Uttar Pradesh PSC", level: "Graduate / Moderate to Hard" },
      { id: "bpsc", name: "BPSC", fullName: "Bihar Public Service Commission", level: "Graduate / Moderate to Hard" },
      { id: "mppsc", name: "MPPSC", fullName: "Madhya Pradesh PSC", level: "Graduate / Moderate" },
      { id: "rpsc", name: "RPSC (RAS)", fullName: "Rajasthan Administrative Services", level: "Graduate / Moderate to Hard" },
      { id: "mpsc", name: "MPSC", fullName: "Maharashtra Public Service Commission", level: "Graduate / Moderate to Hard" },
      { id: "wbcs", name: "WBCS / WBPSC", fullName: "West Bengal Civil Service", level: "Graduate / Moderate" },
      { id: "kpsc", name: "KPSC", fullName: "Karnataka PSC", level: "Graduate / Moderate" },
      { id: "tnpsc", name: "TNPSC", fullName: "Tamil Nadu PSC", level: "Graduate / Moderate" },
    ],
  },
  "General/Other": {
    id: "General/Other",
    name: "General/Other",
    label: "General & Other Exams",
    description: "General competitive preparation, teaching exams, police & miscellaneous.",
    defaultLevel: "Moderate",
    subExams: [
      { id: "general_gk", name: "General Knowledge & Aptitude", fullName: "General GK & Reasoning", level: "Standard / Moderate" },
      { id: "ctet_tet", name: "Teaching (CTET / State TET)", fullName: "Teacher Eligibility Test", level: "Graduate / B.Ed / Moderate" },
      { id: "state_police", name: "State Police SI & Constable", fullName: "State Police Recruitment", level: "Graduate / 10+2 / Moderate" },
      { id: "defence_other", name: "Defence & Paramilitary", fullName: "Other Armed Forces Recruitment", level: "10+2 / Graduate / Moderate" },
      { id: "misc_exams", name: "Other Competitive Exams", fullName: "All Other Exams", level: "General / Mixed" },
    ],
  },
};

/**
 * Returns array of primary exam categories (e.g. ['Banking', 'UPSC', 'SSC', ...])
 */
export function getExams() {
  return Object.keys(EXAM_CONFIG);
}

/**
 * Returns list of sub-exams for a given main exam category key/name.
 */
export function getSubExams(examKey) {
  const category = EXAM_CONFIG[examKey] || EXAM_CONFIG[String(examKey).trim()];
  return category ? category.subExams : [];
}

/**
 * Returns level metadata for a specific exam and optional sub-exam.
 */
export function getExamLevelMetadata(examKey, subExamId) {
  const category = EXAM_CONFIG[examKey];
  if (!category) return "Moderate";

  if (subExamId) {
    const sub = category.subExams.find(
      (s) => s.id === subExamId || s.name === subExamId
    );
    if (sub) return sub.level;
  }

  return category.defaultLevel || "Moderate";
}

export default EXAM_CONFIG;
