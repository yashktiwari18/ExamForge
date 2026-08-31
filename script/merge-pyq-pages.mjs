import fs from "fs";
import path from "path";

const inputDir = path.resolve(
  "data/pyq/ssc/mts/2024/pyq-json"
);

const outputPath = path.resolve(
  "data/pyq/ssc/mts/2024/ssc-mts-2024-pyq.json"
);

const examMetadata = {
  exam: {
    category: "SSC",
    name: "MTS",
    year: 2024,
    stage: "",
    paper: "",
  },
  source: {
    type: "pyq",
    authority: "SSC",
    verified: false,
    sourceUrl: "",
    sourceFile: "SSC MTS Solved Paper-2024.pdf",
  },
};

function getPageNumber(fileName) {
  const match = fileName.match(/^page-(\d+)\.json$/i);

  return match ? Number(match[1]) : null;
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

if (!fs.existsSync(inputDir)) {
  console.error(`Input directory not found: ${inputDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(inputDir)
  .filter((file) => /^page-\d+\.json$/i.test(file))
  .sort((a, b) => getPageNumber(a) - getPageNumber(b));

if (files.length === 0) {
  console.error("No valid page JSON files found.");
  process.exit(1);
}

const allQuestions = [];
const seenQuestions = new Set();

let duplicateCount = 0;

for (const file of files) {
  const filePath = path.join(inputDir, file);

  try {
    const data = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    if (!Array.isArray(data.questions)) {
      console.warn(
        `Skipping ${file}: questions array not found.`
      );
      continue;
    }

    for (const question of data.questions) {
      if (
        !question ||
        !question.question ||
        !Array.isArray(question.options)
      ) {
        console.warn(
          `Skipping invalid question in ${file}`
        );
        continue;
      }

      const normalizedQuestion = normalizeText(
        question.question
      );

      if (seenQuestions.has(normalizedQuestion)) {
        duplicateCount += 1;
        console.log(
          `Duplicate skipped from ${file}`
        );
        continue;
      }

      seenQuestions.add(normalizedQuestion);

      allQuestions.push({
        ...question,
      });
    }

    console.log(`Merged: ${file}`);
  } catch (error) {
    console.error(
      `Failed to read ${file}: ${error.message}`
    );
  }
}

/*
  Re-number all questions sequentially.
*/

const finalQuestions = allQuestions.map(
  (question, index) => {
    const questionNumber = index + 1;

    return {
      ...question,

      id: `ssc-mts-2024-q${String(
        questionNumber
      ).padStart(2, "0")}`,

      questionNumber,
    };
  }
);

const finalData = {
  ...examMetadata,

  questions: finalQuestions,
};

fs.mkdirSync(
  path.dirname(outputPath),
  {
    recursive: true,
  }
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(finalData, null, 2),
  "utf8"
);

console.log("");
console.log("================================");
console.log("PYQ MERGE COMPLETED");
console.log("================================");
console.log(`Pages merged: ${files.length}`);
console.log(
  `Total questions: ${finalQuestions.length}`
);
console.log(
  `Duplicates removed: ${duplicateCount}`
);
console.log(`Saved to: ${outputPath}`);
console.log("================================");