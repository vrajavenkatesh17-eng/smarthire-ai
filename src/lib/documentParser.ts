/**
 * Extract text from a plain text file
 */
async function extractTextFromTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Extract text from a PDF file using PDF.js loaded from CDN
 */
async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamically load PDF.js from CDN
  const pdfjsLib = await loadPdfJs();
  
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
 * Load PDF.js library from CDN
 */
let pdfjsPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (pdfjsPromise) return pdfjsPromise;
  
  pdfjsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
  
  return pdfjsPromise;
}

/**
 * Extract text from a DOCX file by parsing the XML content
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  const JSZip = await loadJSZip();
  
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // DOCX files contain the main content in word/document.xml
  const documentXml = await zip.file("word/document.xml")?.async("text");
  
  if (!documentXml) {
    throw new Error("Could not find document content in DOCX file");
  }
  
  // Parse XML and extract text content
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(documentXml, "text/xml");
  
  // Get all text nodes from <w:t> elements
  const textNodes = xmlDoc.getElementsByTagName("w:t");
  const paragraphs: string[] = [];
  let currentParagraph = "";
  
  // Also track paragraph breaks
  const allNodes = xmlDoc.getElementsByTagName("*");
  
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    if (node.tagName === "w:p") {
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = "";
    } else if (node.tagName === "w:t" && node.textContent) {
      currentParagraph += node.textContent;
    }
  }
  
  // Don't forget the last paragraph
  if (currentParagraph.trim()) {
    paragraphs.push(currentParagraph.trim());
  }
  
  return paragraphs.join("\n");
}

/**
 * Load JSZip library from CDN
 */
let jszipPromise: Promise<any> | null = null;

function loadJSZip(): Promise<any> {
  if (jszipPromise) return jszipPromise;
  
  jszipPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).JSZip) {
      resolve((window as any).JSZip);
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => resolve((window as any).JSZip);
    script.onerror = () => reject(new Error("Failed to load JSZip"));
    document.head.appendChild(script);
  });
  
  return jszipPromise;
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
      // Legacy .doc format - try as text but warn user
      console.warn("Legacy .doc format has limited support. Consider using .docx or PDF");
      return await extractTextFromTXT(file);
    }
    
    // Default to plain text extraction
    return await extractTextFromTXT(file);
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error(`Failed to extract text from ${fileName}. Please try a different file format (PDF or DOCX recommended).`);
  }
}
