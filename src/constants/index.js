export const EXAM_TYPES = ["Banking", "UPSC", "SSC", "Railways", "State PSC", "General/Other"];

export const NUM_GEN_OPTIONS = [0, 5, 10, 15];

export const NEG_OPTIONS = [
  { label: "No Negative Marking", value: 0 },
  { label: "\u22120.25 / wrong", value: 0.25 },
  { label: "\u22120.33 / wrong", value: 0.33 },
  { label: "\u22120.5 / wrong", value: 0.5 },
];

export const TIMER_OPTIONS = [
  { key: "none", label: "No Timer" },
  { key: "total", label: "Full-Test Timer" },
  { key: "perQuestion", label: "60s / Question" },
];
