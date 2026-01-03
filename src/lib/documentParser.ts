import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts: string[] = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    textParts.push(pageText);
  }
  
  return textParts.join("\n\n");
}

/**
 * Extract text content from a DOCX file
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extract text from a plain text file
 */
export async function extractTextFromTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Extract text from any supported resume file format
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;
  
  try {
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      return await extractTextFromPDF(file);
    }
    
    if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      return await extractTextFromDOCX(file);
    }
    
    if (fileType === "application/msword" || fileName.endsWith(".doc")) {
      // .doc files are harder to parse - try as text, but may not work well
      console.warn("Legacy .doc format has limited support. Consider using .docx");
      return await extractTextFromTXT(file);
    }
    
    // Default to plain text extraction
    return await extractTextFromTXT(file);
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error(`Failed to extract text from ${fileName}. Please try a different file format.`);
  }
}
