import fs from "fs/promises";
import * as pdfParseModule from "pdf-parse";

export const extracttextFromPDF = async (filePath) => {
  try {
    // Read PDF file
    const dataBuffer = await fs.readFile(filePath);

    // Resolve parser function (supports different pdf-parse versions)
    const pdfParseFn =
      (pdfParseModule && pdfParseModule.default) ||
      (pdfParseModule && pdfParseModule.PDFParse) ||
      (typeof pdfParseModule === "function"
        ? pdfParseModule
        : null) ||
      (pdfParseModule &&
        Object.values(pdfParseModule).find(
          (v) => typeof v === "function"
        ));

    if (!pdfParseFn || typeof pdfParseFn !== "function") {
      throw new Error(
        "pdf-parse library did not export a valid parse function."
      );
    }

    let result;

    try {
      // Handle newer class-based versions of pdf-parse
      if (
        /PDFParse/i.test(String(pdfParseFn?.name || "")) ||
        String(pdfParseFn).includes("class")
      ) {
        const parser = new pdfParseFn({
          data: new Uint8Array(dataBuffer),
        });

        result =
          typeof parser.getText === "function"
            ? await parser.getText()
            : await parser;

        if (typeof parser.destroy === "function") {
          try {
            await parser.destroy();
          } catch (_) {}
        }
      } else {
        // Older versions
        result = await pdfParseFn(dataBuffer);
      }
    } catch (err) {
      console.log(
        "[pdf-parse] Falling back to direct parser:",
        err.message
      );

      result = await pdfParseFn(dataBuffer);
    }

    const text =
      typeof result?.text === "string"
        ? result.text
        : typeof result === "string"
        ? result
        : "";

    const safeText = text.replace(/\u0000/g, "").trim();

    // ===========================
    // DEBUG LOGS
    // ===========================

    console.log("======================================");
    console.log("PDF Parsed Successfully");
    console.log("Characters:", safeText.length);
    console.log("Pages:", result?.numpages || result?.total || 0);
    console.log("First 500 Characters:");
    console.log(safeText.substring(0, 500));
    console.log("======================================");

    return {
      text: safeText,
      numPages:
        Number(result?.numpages ?? result?.total ?? 0) || 0,
      info: result?.info || {},
    };
  } catch (error) {
    console.error("PDF Parsing Error:", error);

    throw new Error("Failed to extract text from PDF");
  }
};