import fs from "fs/promises";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const extracttextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);

    const result = await pdfParse(dataBuffer);

    return {
      text: result.text.trim(),
      numPages: result.numpages,
      info: result.info,
    };
  } catch (err) {
    console.error(err);
    throw new Error("Failed to extract text from PDF");
  }
};