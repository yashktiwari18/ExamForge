import "dotenv/config";
import fs from "fs";
import path from "path";

const ocrInputPath = process.argv[2] || "data/pyq/ocr-output.txt";
const jsonOutputPath =
  process.argv[3] ||
  "data/pyq/upsc/ssc/so-steno-ldce/2024/so-steno-ldce-2024-pyq.json";

const OCR_PATH = path.resolve(ocrInputPath);
const OUTPUT_PATH = path.resolve(jsonOutputPath);

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in environment.");
  process.exit(1);
}

if (!fs.existsSync(OCR_PATH)) {
  console.error(`OCR file not found: ${OCR_PATH}`);
  process.exit(1);
}

const ocrText = fs.readFileSync(OCR_PATH, "utf8");

console.log("Reading OCR text...");
console.log(`Characters: ${ocrText.length}`);

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

const userPrompt = `
Convert the following OCR text into the required PYQ JSON structure.

This is a historical question paper.

Extract ONLY questions actually present in the OCR.

OCR TEXT:

${ocrText}
`;

async function callGemini() {
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
          parts: [
            {
              text: systemInstruction,
            },
          ],
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: userPrompt,
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
      data?.error?.message ||
        `Gemini API request failed (${response.status})`
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

  const clean = result
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const rawResponsePath = path.resolve(
  "data/pyq/ssc/mts/2024/gemini-raw-response.txt"
);

fs.mkdirSync(path.dirname(rawResponsePath), {
  recursive: true,
});

fs.writeFileSync(
  rawResponsePath,
  clean,
  "utf8"
);

try {
  return JSON.parse(clean);
} catch (error) {
  console.error("");
  console.error("Gemini returned invalid JSON.");
  console.error(`Raw response saved to: ${rawResponsePath}`);
  console.error(`JSON error: ${error.message}`);
  throw error;
}

try {
    return JSON.parse(clean);
  } catch (error) {
    console.error("");
    console.error("Gemini returned invalid JSON.");
    console.error(`Raw response saved to: ${rawResponsePath}`);
    console.error(`JSON error: ${error.message}`);
    throw error;
  }
}

try {
  console.log("Sending OCR text to Gemini...");
  console.log("Extracting actual PYQs...");

  const pyqData = await callGemini();

  if (
    !pyqData ||
    !Array.isArray(pyqData.questions)
  ) {
    throw new Error("Invalid PYQ JSON returned by Gemini.");
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), {
    recursive: true,
  });

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(pyqData, null, 2),
    "utf8"
  );

  console.log("");
  console.log("======================================");
  console.log("PYQ STRUCTURING COMPLETED");
  console.log("======================================");
  console.log(`Questions extracted: ${pyqData.questions.length}`);
  console.log(`Saved to: ${OUTPUT_PATH}`);
  console.log("======================================");
} catch (error) {
  console.error("");
  console.error("PYQ processing failed:");
  console.error(error.message);
  process.exit(1);
}