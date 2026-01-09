import React, { useState } from 'react';
import { listReflections } from '../../storage/reflectionStore';
import './ExportData.css';

export const ExportData: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const reflections = await listReflections();

      // 1. Define Headers
      const headers = [
        "Date",
        "Instrument",
        "Direction",
        "Setup Name",
        "Entry Price",
        "Exit Price",
        "Quantity",
        "PnL",
        "Outcome",
        "Confidence",
        "Tags",
        "Analysis (Q&A)" 
      ];

      // 2. Convert Data to CSV Rows
      const rows = reflections.map(r => {
        let parsed: any = {};
        try {
          parsed = JSON.parse(r.body);
        } catch (e) { 
          // If body isn't JSON, handle gracefully
        }

        // Safely access fields with fallbacks
        const date = parsed.date || new Date(r.createdAt).toISOString();
        const instrument = parsed.instrument || "";
        const direction = parsed.direction || "";
        const setup = parsed.setupName || r.title || "";
        const entry = parsed.entryPrice || "";
        const exit = parsed.exitPrice || "";
        const qty = parsed.quantity || "";
        const pnl = parsed.pnl || "";
        const outcome = parsed.outcome || "";
        const confidence = parsed.confidence || "";
        
        // Handle Arrays/Objects
        const tags = (r.tags || []).join("; "); 
        
        // Flatten Questions into a single string for the CSV
        const notes = Object.entries(parsed.questions || {})
            .map(([k, v]) => `[${k}]: ${v}`)
            .join(" | ")
            .replace(/"/g, '""'); // Escape double quotes for CSV

        // Construct Row (wrapping strings in quotes to handle commas inside text)
        return [
          `"${date}"`,
          `"${instrument}"`,
          `"${direction}"`,
          `"${setup}"`,
          entry,
          exit,
          qty,
          pnl,
          `"${outcome}"`,
          confidence,
          `"${tags}"`,
          `"${notes}"`
        ].join(",");
      });

      // 3. Combine and Download
      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `trading_journal_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-container">
      <div className="export-card">
        <h3>Export Data</h3>
        <p>Download your complete trading journal, including PnL and Execution details, as a CSV file.</p>
        <button 
          className="btn-primary full-width" 
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? "Generating CSV..." : "Download CSV"}
        </button>
      </div>
    </div>
  );
};