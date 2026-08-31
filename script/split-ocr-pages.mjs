import fs from "fs";
import path from "path";

const inputPathArg = process.argv[2] || "data/pyq/ssc/mts/2024/ocr-output.txt";
const outputDirArg =
  process.argv[3] ||
  path.join(path.dirname(path.resolve(inputPathArg)), "pages");

const inputPath = path.resolve(inputPathArg);
const outputDir = path.resolve(outputDirArg);

if (!fs.existsSync(inputPath)) {
  console.error(`OCR file not found: ${inputPath}`);
  process.exit(1);
}

const content = fs.readFileSync(inputPath, "utf8");
const normalized = content.replace(/\r\n/g, "\n");
const markerRegex = /^========== PAGE\s+(\d+)\s*==========\s*$/gm;
const matches = [...normalized.matchAll(markerRegex)];

if (matches.length === 0) {
  fs.mkdirSync(outputDir, { recursive: true });
  const singlePagePath = path.join(outputDir, "page-01.txt");
  fs.writeFileSync(singlePagePath, normalized.trim(), "utf8");
  console.log(`No page markers found. Wrote a single page file to: ${singlePagePath}`);
  process.exit(0);
}

const pages = [];

for (let i = 0; i < matches.length; i += 1) {
  const match = matches[i];
  const pageNumber = Number(match[1]);
  const startIndex = match.index + match[0].length;
  const endIndex = i < matches.length - 1 ? matches[i + 1].index : normalized.length;
  const pageText = normalized.slice(startIndex, endIndex).trim();

  pages.push({
    pageNumber,
    text: pageText,
  });
}

fs.mkdirSync(outputDir, { recursive: true });

pages.forEach(({ pageNumber, text }) => {
  const outputFile = path.join(
    outputDir,
    `page-${String(pageNumber).padStart(2, "0")}.txt`
  );

  fs.writeFileSync(outputFile, text, "utf8");
  console.log(`Saved page ${pageNumber} -> ${outputFile}`);
});

console.log(`\nSplit complete. Total pages: ${pages.length}`);
console.log(`Output directory: ${outputDir}`);
