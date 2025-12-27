interface ResumeData {
  id: string;
  file_name: string;
  candidate_name: string | null;
  candidate_email: string | null;
  analysis_result: any;
  ai_score: number | null;
  created_at: string;
}

export const exportToCSV = (resumes: ResumeData[]): void => {
  const headers = ["Candidate Name", "Email", "File Name", "AI Score", "Analysis Date", "Analysis Summary"];
  
  const rows = resumes.map(resume => {
    const analysisText = typeof resume.analysis_result === "string" 
      ? resume.analysis_result 
      : JSON.stringify(resume.analysis_result);
    
    // Extract a brief summary (first 200 chars)
    const summary = analysisText.replace(/\n/g, " ").slice(0, 200).replace(/"/g, '""');
    
    return [
      resume.candidate_name || "Unknown",
      resume.candidate_email || "",
      resume.file_name,
      resume.ai_score?.toString() || "N/A",
      new Date(resume.created_at).toLocaleDateString(),
      `"${summary}..."`,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  downloadFile(csvContent, "resume-analysis-export.csv", "text/csv");
};

export const exportToPDF = async (resumes: ResumeData[]): Promise<void> => {
  // Create a printable HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resume Analysis Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
        .resume { page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .name { font-size: 18px; font-weight: bold; color: #1f2937; }
        .score { font-size: 24px; font-weight: bold; padding: 8px 16px; border-radius: 8px; }
        .score-high { background: #dcfce7; color: #166534; }
        .score-medium { background: #fef3c7; color: #92400e; }
        .score-low { background: #fee2e2; color: #991b1b; }
        .meta { color: #6b7280; font-size: 12px; margin-bottom: 15px; }
        .analysis { background: #f9fafb; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
        .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 11px; }
      </style>
    </head>
    <body>
      <h1>Resume Analysis Report</h1>
      <p style="color: #6b7280; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString()} • ${resumes.length} candidate(s)</p>
      
      ${resumes.map(resume => {
        const score = resume.ai_score || 0;
        const scoreClass = score >= 80 ? 'score-high' : score >= 60 ? 'score-medium' : 'score-low';
        const analysisText = typeof resume.analysis_result === "string" 
          ? resume.analysis_result 
          : JSON.stringify(resume.analysis_result, null, 2);
        
        return `
          <div class="resume">
            <div class="header">
              <div class="name">${resume.candidate_name || resume.file_name}</div>
              <div class="score ${scoreClass}">${resume.ai_score || 'N/A'}/100</div>
            </div>
            <div class="meta">
              ${resume.candidate_email ? `Email: ${resume.candidate_email} • ` : ''}
              Analyzed: ${new Date(resume.created_at).toLocaleDateString()}
            </div>
            <div class="analysis">${analysisText.slice(0, 2000)}${analysisText.length > 2000 ? '\n\n[Analysis truncated...]' : ''}</div>
          </div>
        `;
      }).join('')}
      
      <div class="footer">
        Powered by AI Resume Analyzer
      </div>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const exportSingleResumeToPDF = (resume: ResumeData): void => {
  exportToPDF([resume]);
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
