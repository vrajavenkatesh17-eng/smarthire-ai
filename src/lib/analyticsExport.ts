interface AnalyticsData {
  totalUsers: number;
  companyUsers: number;
  totalResumes: number;
  resumesTrend: { date: string; count: number }[];
  usersTrend: { date: string; count: number }[];
  roleDistribution: { name: string; value: number }[];
}

export const exportAnalyticsToCSV = (analytics: AnalyticsData): void => {
  const lines: string[] = [];
  
  // Summary section
  lines.push("ANALYTICS SUMMARY");
  lines.push(`Report Generated,${new Date().toLocaleDateString()}`);
  lines.push("");
  lines.push("Metric,Value");
  lines.push(`Total Company Users,${analytics.companyUsers}`);
  lines.push(`Total Resumes Analyzed,${analytics.totalResumes}`);
  lines.push(`Weekly Activity,${analytics.resumesTrend.reduce((sum, d) => sum + d.count, 0)}`);
  lines.push(`Average Daily Usage,${Math.round(analytics.resumesTrend.reduce((sum, d) => sum + d.count, 0) / 7)}`);
  lines.push("");
  
  // Resume trend section
  lines.push("RESUME ANALYSIS TREND (Last 7 Days)");
  lines.push("Day,Resumes Analyzed");
  analytics.resumesTrend.forEach(item => {
    lines.push(`${item.date},${item.count}`);
  });
  lines.push("");
  
  // User trend section
  lines.push("NEW USERS TREND (Last 7 Days)");
  lines.push("Day,New Users");
  analytics.usersTrend.forEach(item => {
    lines.push(`${item.date},${item.count}`);
  });
  lines.push("");
  
  // Role distribution section
  lines.push("ROLE DISTRIBUTION");
  lines.push("Role Category,Count");
  analytics.roleDistribution.forEach(item => {
    lines.push(`${item.name},${item.value}`);
  });
  
  const csvContent = lines.join("\n");
  downloadFile(csvContent, `analytics-report-${formatDate(new Date())}.csv`, "text/csv");
};

export const exportAnalyticsToPDF = (analytics: AnalyticsData): void => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          padding: 40px; 
          color: #1a1a2e;
          background: #fafafa;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #6366f1;
        }
        h1 { 
          color: #6366f1; 
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .date { color: #6b7280; font-size: 14px; }
        .metrics { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 20px; 
          margin-bottom: 40px;
        }
        .metric { 
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 24px; 
          border-radius: 12px;
          text-align: center;
        }
        .metric-value { 
          font-size: 36px; 
          font-weight: bold;
          margin-bottom: 8px;
        }
        .metric-label { 
          font-size: 14px;
          opacity: 0.9;
        }
        .section { 
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section h2 { 
          color: #1a1a2e;
          font-size: 18px;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section h2::before {
          content: "";
          display: block;
          width: 4px;
          height: 20px;
          background: #6366f1;
          border-radius: 2px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse;
        }
        th, td { 
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th { 
          background: #f9fafb;
          font-weight: 600;
          color: #4b5563;
          font-size: 12px;
          text-transform: uppercase;
        }
        td { color: #1f2937; }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          color: #9ca3af; 
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; background: white; }
          .section { box-shadow: none; border: 1px solid #e5e7eb; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Analytics Report</h1>
        <p class="date">Generated on ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
      
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${analytics.companyUsers}</div>
          <div class="metric-label">Total Company Users</div>
        </div>
        <div class="metric">
          <div class="metric-value">${analytics.totalResumes}</div>
          <div class="metric-label">Resumes Analyzed</div>
        </div>
        <div class="metric">
          <div class="metric-value">${analytics.resumesTrend.reduce((sum, d) => sum + d.count, 0)}</div>
          <div class="metric-label">Weekly Activity</div>
        </div>
        <div class="metric">
          <div class="metric-value">${Math.round(analytics.resumesTrend.reduce((sum, d) => sum + d.count, 0) / 7)}</div>
          <div class="metric-label">Avg. Daily Usage</div>
        </div>
      </div>
      
      <div class="section">
        <h2>Resume Analysis Trend (Last 7 Days)</h2>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Resumes Analyzed</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.resumesTrend.map(item => `
              <tr>
                <td>${item.date}</td>
                <td>${item.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2>New Users This Week</h2>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>New Users</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.usersTrend.map(item => `
              <tr>
                <td>${item.date}</td>
                <td>${item.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${analytics.roleDistribution.length > 0 ? `
        <div class="section">
          <h2>Role Distribution</h2>
          <table>
            <thead>
              <tr>
                <th>Role Category</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.roleDistribution.map(item => {
                const total = analytics.roleDistribution.reduce((sum, r) => sum + r.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(1);
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.value}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      <div class="footer">
        Powered by ResumeAI Analytics
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
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
