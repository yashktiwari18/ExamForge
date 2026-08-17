import { promises as fs } from "node:fs";
import path from "node:path";
import { pdf } from "pdf-to-img";

const pdfPath = path.resolve(
  "data/pyq/upsc/ssc/so-steno-ldce/2024/source/paper-1.pdf"
);

const outputDir = path.resolve("data/pyq/test-render");

await fs.mkdir(outputDir, { recursive: true });

console.log("Opening PDF...");

const document = await pdf(pdfPath, {
  scale: 3,
});

console.log("Rendering page 1...");

const page = await document.getPage(1);

const outputPath = path.join(outputDir, "page-1.png");

await fs.writeFile(outputPath, page);

console.log("Page 1 rendered successfully.");
console.log(`Saved to: ${outputPath}`);

await document.destroy();