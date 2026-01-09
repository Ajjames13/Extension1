import { useState } from "react";
import { exportAllData } from "../../storage/reflectionStore";
import type { Reflection } from "../../storage/db";
import "./ExportData.css";

// Updated type to handle both old and new data structures
type ParsedBody = {
  symbol?: string;
  setupName?: string;
  direction?: string;
  outcome?: string;
  confidence?: number | string;
  entryPrice?: string;
  stopLossPrice?: string;
  stopLossType?: string;
  targetPrice?: string;
  targetType?: string;
  notes?: string;
  // Legacy fields
  instrument?: string;
  questions?: Record<string, string>;
};

const parseBody = (body: string): ParsedBody => {
  try {
    return JSON.parse(body);
  } catch {
    return { notes: body }; // Handle legacy plain text
  }
};

const downloadFile = (filename: string, contents: string, type: string) => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const escapeCsvValue = (value: unknown) => {
  const str = String(value ?? "");
  const needsEscaping = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsEscaping ? `"${escaped}"` : escaped;
};

const buildCsv = (reflections: Reflection[]) => {
  const headers = [
    "Date",
    "Symbol",
    "Direction",
    "Setup Name",
    "Outcome",
    "Confidence",
    "Entry",
    "Stop Loss",
    "Target",
    "Risk Type",
    "Notes",
    "Tags"
  ];

  const rows = reflections.map((r) => {
    const data = parseBody(r.body);
    const symbol = data.symbol || data.instrument || ""; // Fallback for old data
    
    return [
      new Date(r.createdAt).toLocaleString(),
      symbol,
      data.direction,
      data.setupName || r.title,
      data.outcome,
      data.confidence,
      data.entryPrice,
      data.stopLossPrice,
      data.targetPrice,
      data.stopLossType,
      data.notes,
      r.tags?.join(" | ")
    ].map(escapeCsvValue).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
};

export const ExportData = () => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJson = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const data = await exportAllData();
      const filename = `trade-journal-${new Date().toISOString().split("T")[0]}.json`;
      downloadFile(filename, JSON.stringify(data, null, 2), "application/json");
      setStatusMessage("JSON export downloaded.");
    } catch {
      setStatusMessage("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const { reflections } = await exportAllData();
      const csv = buildCsv(reflections);
      const filename = `trade-journal-${new Date().toISOString().split("T")[0]}.csv`;
      downloadFile(filename, csv, "text/csv");
      setStatusMessage("CSV export downloaded.");
    } catch {
      setStatusMessage("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-card">
      <div className="export-header">
        <h3>EXPORT DATA</h3>
        <p>Download your complete trading history.</p>
      </div>
      <div className="export-actions">
        <button className="export-btn" onClick={handleExportJson} disabled={isExporting}>
          DOWNLOAD JSON (BACKUP)
        </button>
        <button className="export-btn" onClick={handleExportCsv} disabled={isExporting}>
          DOWNLOAD CSV (EXCEL)
        </button>
      </div>
      {statusMessage && <div className="export-status">{statusMessage}</div>}
    </div>
  );
};