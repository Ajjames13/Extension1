import { useState } from "react";
import { exportAllData } from "../../storage/reflectionStore";
import type { Reflection } from "../../storage/db";
import "./ExportData.css";

type ReflectionPayload = {
  setupName?: string;
  instrument?: string;
  timeframe?: string;
  direction?: string;
  entryPrice?: string;
  exitPrice?: string;
  quantity?: string;
  prices?: string;
  outcome?: string;
  pnl?: string;
  confidence?: string;
  notes?: string;
  questions?: Record<string, string>;
};

type ImageMetadata = {
  id?: number;
  reflectionId: number;
  name: string;
  createdAt: string;
};

type ExportPayload = {
  reflections: Reflection[];
  images: ImageMetadata[];
  settings: unknown[];
};

const parseBody = (body: string): ReflectionPayload => {
  try {
    return JSON.parse(body) as ReflectionPayload;
  } catch {
    return {};
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

const escapeCsvValue = (value: string) => {
  const needsEscaping = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsEscaping ? `"${escaped}"` : escaped;
};

const buildCsv = (reflections: Reflection[]) => {
  const parsedRows = reflections.map((reflection) => ({
    reflection,
    payload: parseBody(reflection.body)
  }));

  const questionKeys = new Set<string>();
  parsedRows.forEach((row) => {
    Object.keys(row.payload.questions ?? {}).forEach((key) => questionKeys.add(key));
  });

  const questionColumns = Array.from(questionKeys).sort();

  const headers = [
    "id",
    "title",
    "setup_name",
    "instrument",
    "timeframe",
    "direction",
    "quantity",
    "entry_price",
    "exit_price",
    "planned_prices",
    "outcome",
    "pnl",
    "confidence",
    "notes",
    "tags",
    "created_at",
    "updated_at",
    ...questionColumns.map((key) => `answer_${key}`)
  ];

  const rows = parsedRows.map(({ reflection, payload }) => {
    const tagsValue = reflection.tags?.join("|") ?? "";
    const answers = questionColumns.map((key) => payload.questions?.[key] ?? "");

    return [
      `${reflection.id ?? ""}`,
      reflection.title ?? "",
      payload.setupName ?? "",
      payload.instrument ?? "",
      payload.timeframe ?? "",
      payload.direction ?? "",
      payload.quantity ?? "",
      payload.entryPrice ?? "",
      payload.exitPrice ?? "",
      payload.prices ?? "",
      payload.outcome ?? "",
      payload.pnl ?? "",
      payload.confidence ?? "",
      payload.notes ?? "",
      tagsValue,
      reflection.createdAt,
      reflection.updatedAt,
      ...answers
    ];
  });

  const lines = [headers, ...rows].map((row) =>
    row.map((value) => escapeCsvValue(value)).join(",")
  );

  return lines.join("\n");
};

export const ExportData = () => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJson = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const { reflections, images, settings } = await exportAllData();
      const payload: ExportPayload = {
        reflections,
        images: images.map((image) => ({
          id: image.id,
          reflectionId: image.reflectionId,
          name: image.name,
          createdAt: image.createdAt
        })),
        settings
      };
      const filename = `reflections-${new Date().toISOString()}.json`;
      downloadFile(filename, JSON.stringify(payload, null, 2), "application/json");
      setStatusMessage("JSON export downloaded.");
    } catch {
      setStatusMessage("Unable to export JSON data.");
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
      const filename = `reflections-${new Date().toISOString()}.csv`;
      downloadFile(filename, csv, "text/csv");
      setStatusMessage("CSV export downloaded.");
    } catch {
      setStatusMessage("Unable to export CSV data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="export-data">
      <header>
        <h3>Export Data</h3>
        <p>Download reflections in JSON or CSV format.</p>
      </header>
      <div className="export-data__actions">
        <button type="button" onClick={handleExportJson} disabled={isExporting}>
          Export JSON
        </button>
        <button type="button" onClick={handleExportCsv} disabled={isExporting}>
          Export CSV
        </button>
      </div>
      {statusMessage ? <p className="export-data__status">{statusMessage}</p> : null}
    </section>
  );
};