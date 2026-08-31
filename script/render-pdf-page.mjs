import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const pdfPath = process.argv[2];
const outputPath = process.argv[3] || "data/pyq/rendered";

if (!pdfPath) {
  console.error("Please provide the PDF path.");
  process.exit(1);
}

const absolutePath = path.resolve(pdfPath);

if (!fs.existsSync(absolutePath)) {
  console.error("PDF not found:");
  console.error(absolutePath);
  process.exit(1);
}

console.log("Rendering first PDF page...");

const buffer = fs.readFileSync(absolutePath);

const parser = new PDFParse({
  data: buffer,
});

const result = await parser.getScreenshot({
  
  scale: 1.5,
});

const outputDir = path.resolve(outputPath);
fs.mkdirSync(outputDir, {
  recursive: true,
});

result.pages.forEach((page, index) => {
  const outputPath = path.join(
    outputDir,
    `page-${index + 1}.png`
  );

  fs.writeFileSync(outputPath, page.data);

  console.log(`Saved page ${index + 1}`);
});

await parser.destroy();

console.log("All PDF pages rendered successfully.");
console.log(`Saved to: ${outputDir}`);