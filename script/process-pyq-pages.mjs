import "dotenv/config";
import fs from "fs";
import path from "path";

const pagesDir = path.resolve("data/pyq/ssc/mts/2024/pages");
const outputDir = path.resolve("data/pyq/ssc/mts/2024/pyq-json");
const apiKey = process.env.GEMINI_API_KEY;

const metadata = {
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

const systemInstruction = `
You are a specialist in converting scanned Indian competitive-exam question papers into structured PYQ datasets.

Your task is NOT to generate new questions.

You must extract and structure ONLY the questions that actually appear in the supplied OCR text.

Important rules:

1. Preserve the original question wording as closely as possible.
2. Do not invent questions.
3. Do not add questions from your own knowledge.
4. Extract every MCQ that can be reliably identified.
5. Preserve all visible answer options.
6. If OCR contains obvious spacing or line-break errors, clean them without changing the meaning.
7. If a question cannot be reliably reconstructed, do not invent missing text.
8. Identify the correct answer only when it is supported by the source or can be confidently determined.
9. Keep the original question order.
10. Assign sequential question numbers.
11. This is historical PYQ data, so source information must clearly identify it as a previous-year question paper.
12. Return ONLY valid JSON. No markdown. No explanation outside JSON.

Return exactly this structure:

{
  "exam": {
    "category": "SSC",
    "name": "MTS",
    "year": 2024,
    "stage": "",
    "paper": ""
  },
  "source": {
    "type": "pyq",
    "authority": "SSC",
    "verified": false,
    "sourceUrl": "",
    "sourceFile": "SSC MTS Solved Paper-2024.pdf"
  },
  "questions": [
    {
      "id": "ssc-mts-2024-q01",
      "questionNumber": 1,
      "question": "",
      "options": [
        "",
        "",
        "",
        ""
      ],
      "correctIndex": null,
      "topic": "",
      "subTopic": "",
      "difficulty": "",
      "questionType": "MCQ",
      "explanation": "",
      "answerVerified": false
    }
  ]
}

Do not create placeholder questions.

If the OCR text does not contain enough information to reliably extract a question, skip that question rather than guessing.
`;

function getPageNumberFromFileName(fileName) {
  const match = fileName.match(/page-(\d+)/i);
  return match ? Number(match[1]) : null;
}

function saveRawResponse(outputBasePath, rawText) {
  const rawPath = `${outputBasePath}.raw-response.txt`;
  fs.writeFileSync(rawPath, rawText, "utf8");
  return rawPath;
}

async function callGeminiForPage(pageText, pageNumber) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
Convert the following OCR text from one page of the SSC MTS 2024 paper into the required PYQ JSON structure.

This is a historical question paper.

Extract ONLY questions actually present in the OCR for this single page.

Do not include questions from other pages.

OCR PAGE ${pageNumber}:

${pageText}
`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 12000,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(
      data?.error?.message || `Gemini API request failed (${response.status})`
    );
  }

  const result = (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();

  if (!result) {
    throw new Error("Gemini returned an empty response.");
  }

  return result;
}

function normalizePyqResponse(rawText, outputBasePath) {
  const clean = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(clean);
    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error("Parsed JSON is missing a valid questions array.");
    }

    const examSource = {
      ...metadata,
      ...parsed,
    };

    if (!examSource.exam || !examSource.source) {
      throw new Error("Parsed JSON is missing exam or source metadata.");
    }

    examSource.exam = {
      ...metadata.exam,
      ...(parsed.exam || {}),
    };
    examSource.source = {
      ...metadata.source,
      ...(parsed.source || {}),
    };
    examSource.questions = parsed.questions;

    return examSource;
  } catch (error) {
    const savedRawPath = saveRawResponse(outputBasePath, clean);
    console.error(`Invalid JSON returned for page ${path.basename(outputBasePath)}.`);
    console.error(`Raw response saved to: ${savedRawPath}`);
    console.error(`JSON parse error: ${error.message}`);
    throw error;
  }
}

async function processPage(fileName) {
  const pageNumber = getPageNumberFromFileName(fileName);

  if (pageNumber === null) {
    console.warn(
      `Skipping file without numeric page name: ${fileName}`
    );
    return;
  }

  const inputPath = path.join(
    pagesDir,
    fileName
  );

  const outputBasePath = path.join(
    outputDir,
    `page-${String(pageNumber).padStart(2, "0")}`
  );

  if (!fs.existsSync(inputPath)) {
    throw new Error(
      `Page file not found: ${inputPath}`
    );
  }

  const pageText = fs.readFileSync(
    inputPath,
    "utf8"
  );

  const rawResponse = await callGeminiForPage(
    pageText,
    pageNumber
  );

  const pyqData = normalizePyqResponse(
    rawResponse,
    outputBasePath
  );

  fs.writeFileSync(
    `${outputBasePath}.json`,
    `${JSON.stringify(pyqData, null, 2)}\n`,
    "utf8"
  );

  console.log(
    `Saved page ${pageNumber} -> ${outputBasePath}.json`
  );
}

async function main() {
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in environment.");
    process.exit(1);
  }

  if (!fs.existsSync(pagesDir)) {
    console.error(`Page directory not found: ${pagesDir}`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(pagesDir)
    .filter((file) => file.toLowerCase().endsWith(".txt"))
    .sort((a, b) => {
      const pageA = getPageNumberFromFileName(a);
      const pageB = getPageNumberFromFileName(b);
      return (pageA ?? Number.MAX_SAFE_INTEGER) - (pageB ?? Number.MAX_SAFE_INTEGER);
    });

  if (files.length === 0) {
    console.error(`No .txt page files found in: ${pagesDir}`);
    process.exit(1);
  }

  let failedPages = 0;

  for (const file of files) {
    const pageNumber = getPageNumberFromFileName(file);
    if (pageNumber === null) {
      continue;
    }

    try {
      await processPage(file);
    } catch (error) {
      failedPages += 1;
      console.error(`Page ${pageNumber} failed: ${error.message}`);
    }
  }

  console.log(`\nProcessed ${files.length} page(s).`);
  console.log(`Output directory: ${outputDir}`);

  if (failedPages > 0) {
    console.error(`Completed with ${failedPages} failed page(s).`);
    process.exitCode = 1;
  }
}

main();
