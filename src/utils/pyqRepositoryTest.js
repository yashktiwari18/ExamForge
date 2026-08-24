import {
  getAllPYQs,
  getVerifiedPYQs,
  filterPYQs,
  getPYQById,
} from "./pyqRepository";

console.log("===== ExamForge PYQ Repository Test =====");

const allPYQs = getAllPYQs();

console.log("1. All PYQs:", allPYQs);
console.log("Total PYQs:", allPYQs.length);

const verifiedPYQs = getVerifiedPYQs();

console.log("2. Verified PYQs:", verifiedPYQs);
console.log("Verified count:", verifiedPYQs.length);

const upscPYQs = filterPYQs({
  exam: "UPSC Civil Services Examination",
  verifiedOnly: false,
});

console.log("3. UPSC PYQs:", upscPYQs);

const polityPYQs = filterPYQs({
  subject: "Indian Polity",
  verifiedOnly: false,
});

console.log("4. Indian Polity PYQs:", polityPYQs);

const yearPYQs = filterPYQs({
  year: 2024,
  verifiedOnly: false,
});

console.log("5. 2024 PYQs:", yearPYQs);

if (allPYQs.length > 0) {
  const firstId = allPYQs[0].id;

  console.log("6. Testing ID:", firstId);

  const foundPYQ = getPYQById(firstId);

  console.log("PYQ found by ID:", foundPYQ);
}

console.log("===== PYQ Repository Test Complete =====");