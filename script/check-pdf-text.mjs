import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const pdfPath = process.argv[2];

if (!pdfPath) {
  console.error("Please provide the PDF path.");
  process.exit(1);
}

const absolutePath = path.resolve(pdfPath);

console.log("Reading PDF...");
console.log(absolutePath);

if (!fs.existsSync(absolutePath)) {
  console.error("PDF not found:");
  console.error(absolutePath);
  process.exit(1);
}

const buffer = fs.readFileSync(absolutePath);

const parser = new PDFParse({ data: buffer });

const data = await parser.getText();

console.log("\n========== PDF TEXT PREVIEW ==========\n");
console.log(data.text.slice(0, 5000));

await parser.destroy();

console.log("\n======================================");
console.log(`Pages: ${data.numpages}`);
console.log(`Characters extracted: ${data.text.length}`);