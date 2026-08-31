import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";

const renderedPath = process.argv[2] || "data/pyq/rendered";
const outputPath = process.argv[3] || "data/pyq/ocr-output.txt";

const renderedDir = path.resolve(renderedPath);
const outputFile = path.resolve(outputPath);

if (!fs.existsSync(renderedDir)) {
  console.error("Rendered PDF directory not found.");
  process.exit(1);
}

const files = fs
  .readdirSync(renderedDir)
  .filter((file) => /^page-\d+\.png$/i.test(file))
  .sort((a, b) => {
    const pageA = Number(a.match(/\d+/)[0]);
    const pageB = Number(b.match(/\d+/)[0]);
    return pageA - pageB;
  });

if (files.length === 0) {
  console.error("No rendered PNG pages found.");
  process.exit(1);
}

console.log(`Found ${files.length} rendered pages.`);

const worker = await createWorker("eng");

let fullText = "";

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const filePath = path.join(renderedDir, file);

  console.log(`OCR processing page ${i + 1}/${files.length}...`);

  const {
    data: { text },
  } = await worker.recognize(filePath);

  fullText += `\n\n========== PAGE ${i + 1} ==========\n\n`;
  fullText += text;
}

await worker.terminate();

fs.writeFileSync(outputFile, fullText, "utf8");

console.log("\nOCR completed successfully.");
console.log(`Saved OCR text to: ${outputFile}`);