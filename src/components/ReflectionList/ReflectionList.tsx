import React, { useEffect, useMemo, useState } from "react";
import { listReflections } from "../../storage/reflectionStore";
import type { Reflection } from "../../storage/db";
import "./ReflectionList.css";

type ParsedReflection = {
  instrument: string;
  timeframe: string;
  direction: string;
  prices: string;
  setupName: string;
  outcome: string;
  pnl?: string;
  confidence: string;
  tags: string;
  notes: string;
  questions: Record<string, string>;
};

type FiltersState = {
  instrument: string;
  direction: string;
  outcome: string;
  keyword: string;
  tag: string;
};

type ReflectionRow = {
  reflection: Reflection;
  parsed: ParsedReflection;
};

const PAGE_SIZE = 25;

const parseReflectionBody = (body: string): ParsedReflection => {
  try {
    const parsed = JSON.parse(body) as Partial<ParsedReflection>;
    return {
      instrument: parsed.instrument ?? "",
      timeframe: parsed.timeframe ?? "",
      direction: parsed.direction ?? "",
      prices: parsed.prices ?? "",
      setupName: parsed.setupName ?? "",
      outcome: parsed.outcome ?? "",
      pnl: parsed.pnl,
      confidence: parsed.confidence ?? "",
      tags: parsed.tags ?? "",
      notes: parsed.notes ?? "",
      questions: parsed.questions ?? {}
    };
  } catch {
    return {
      instrument: "",
      timeframe: "",
      direction: "",
      prices: "",
      setupName: "",
      outcome: "",
      confidence: "",
      tags: "",
      notes: "",
      questions: {}
    };
  }
};

const buildKeywordHaystack = (row: ReflectionRow) => {
  const answers = Object.values(row.parsed.questions).join(" ");
  return [
    row.parsed.setupName,
    row.parsed.tags,
    row.parsed.notes,
    answers,
    row.reflection.body
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const buildReflectionRows = (items: Reflection[]): ReflectionRow[] => {
  return items.map((reflection) => ({
    reflection,
    parsed: parseReflectionBody(reflection.body)
  }));
};

export const ReflectionList = () => {
  const [rows, setRows] = useState<ReflectionRow[]>([]);
  const [filters, setFilters] = useState<FiltersState>({
    instrument: "",
    direction: "",
    outcome: "",
    keyword: "",
    tag: ""
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReflectionRow | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const reflections = await listReflections();
        if (!isMounted) return;
        setRows(buildReflectionRows(reflections));
      } catch {
        if (isMounted) setStatusMessage("Unable to load reflections.");
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    rows.forEach(row => {
      if (row.reflection.tags) row.reflection.tags.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    const result = rows.filter((row) => {
      if (filters.instrument && row.parsed.instrument.toLowerCase() !== filters.instrument.toLowerCase()) return false;
      if (filters.direction && row.parsed.direction.toLowerCase() !== filters.direction.toLowerCase()) return false;
      if (filters.outcome && row.parsed.outcome.toLowerCase() !== filters.outcome.toLowerCase()) return false;
      if (filters.tag && !row.reflection.tags?.includes(filters.tag)) return false;
      if (keyword) return buildKeywordHaystack(row).includes(keyword);
      return true;
    });
    return result;
  }, [filters, rows]);

  const stats = useMemo(() => {
    let totalPnl = 0;
    let winCount = 0;
    let lossCount = 0;

    filteredRows.forEach(row => {
      const pnlVal = parseFloat(row.parsed.pnl ?? "0");
      if (!isNaN(pnlVal) && row.parsed.pnl !== "") {
        totalPnl += pnlVal;
      }

      const outcome = row.parsed.outcome.toLowerCase();
      const pnl = parseFloat(row.parsed.pnl ?? "0");

      if (pnl > 0) winCount++;
      else if (pnl < 0) lossCount++;
      else {
        if (outcome.includes("win") || outcome.includes("profit") || outcome.includes("target")) winCount++;
        else if (outcome.includes("loss") || outcome.includes("stop")) lossCount++;
      }
    });

    const totalTrades = winCount + lossCount;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    return { totalPnl, winRate, totalTrades };
  }, [filteredRows]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount);

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [clampedPage, page]);

  const paginatedRows = useMemo(() => {
    const start = (clampedPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [clampedPage, filteredRows]);

  const handleFilterChange = (field: keyof FiltersState) => {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFilters((prev) => ({ ...prev, [field]: event.target.value }));
      setPage(1);
    };
  };

  return (
    <div className="reflection-list">
      <header className="reflection-list__header">
        <div>
          <h2>Reflections</h2>
          <p>Browse saved reflections and review outcomes.</p>
        </div>
        
        {/* Stats Summary - Dark Theme */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center', 
          background: 'var(--bg-input)', 
          padding: '8px 16px', 
          borderRadius: '8px', 
          fontSize: '14px',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)'
        }}>
             <div><strong>Total PnL:</strong> <span style={{ color: stats.totalPnl >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>${stats.totalPnl.toFixed(2)}</span></div>
             <div><strong>Win Rate:</strong> {stats.winRate.toFixed(1)}% ({stats.totalTrades} trades)</div>
        </div>

        <div className="reflection-list__filters">
          <input
            type="text"
            placeholder="Search keywords"
            value={filters.keyword}
            onChange={handleFilterChange("keyword")}
          />
          <input
            type="text"
            placeholder="Instrument"
            value={filters.instrument}
            onChange={handleFilterChange("instrument")}
          />
          <select
            value={filters.direction}
            onChange={handleFilterChange("direction")}
          >
            <option value="">Direction</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
            <option value="neutral">Neutral</option>
          </select>
          <select
             value={filters.tag}
             onChange={handleFilterChange("tag")}
          >
             <option value="">All Tags</option>
             {uniqueTags.map(tag => (
               <option key={tag} value={tag}>{tag}</option>
             ))}
          </select>
        </div>
      </header>

      {statusMessage ? (
        <p className="reflection-list__status">{statusMessage}</p>
      ) : null}

      <div className="reflection-list__table">
        <div className="reflection-list__row reflection-list__row--header" style={{ gridTemplateColumns: '72px 1fr 1fr 100px 100px 100px 120px' }}>
          <span>Preview</span>
          <span>Instrument</span>
          <span>Setup</span>
          <span>Direction</span>
          <span>PnL</span>
          <span>Outcome</span>
          <span>Updated</span>
        </div>
        {paginatedRows.length === 0 ? (
          <div className="reflection-list__empty">No reflections found.</div>
        ) : (
          paginatedRows.map((row) => (
            <button
              key={row.reflection.id}
              className="reflection-list__row"
              type="button"
              onClick={() => setSelected(row)}
              style={{ gridTemplateColumns: '72px 1fr 1fr 100px 100px 100px 120px' }}
            >
              <span className="reflection-list__thumb" aria-hidden="true">
                {row.parsed.instrument
                  ? row.parsed.instrument.slice(0, 2).toUpperCase()
                  : "--"}
              </span>
              <span>{row.parsed.instrument || "—"}</span>
              <span>{row.parsed.setupName || row.reflection.title}</span>
              <span>{row.parsed.direction || "—"}</span>
              <span style={{ color: parseFloat(row.parsed.pnl ?? "0") >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                {row.parsed.pnl ? `$${row.parsed.pnl}` : "—"}
              </span>
              <span>{row.parsed.outcome || "—"}</span>
              <span>
                {new Date(row.reflection.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))
        )}
      </div>

      <footer className="reflection-list__pagination">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={clampedPage === 1}
        >
          Prev
        </button>
        <span>
          Page {clampedPage} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
          disabled={clampedPage === pageCount}
        >
          Next
        </button>
      </footer>

      {selected ? (
        <aside className="reflection-list__detail">
          <header>
            <h3>{selected.parsed.setupName || selected.reflection.title}</h3>
            <p>
              {selected.parsed.instrument} · {selected.parsed.timeframe} ·{" "}
              {selected.parsed.direction}
            </p>
          </header>
          <div className="reflection-list__detail-grid">
            <div>
              <span>Outcome</span>
              <strong>{selected.parsed.outcome || "—"}</strong>
            </div>
            <div>
              <span>PnL</span>
              <strong style={{ color: parseFloat(selected.parsed.pnl ?? "0") >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                 {selected.parsed.pnl ? `$${selected.parsed.pnl}` : "—"}
              </strong>
            </div>
            <div>
              <span>Confidence</span>
              <strong>{selected.parsed.confidence || "—"}</strong>
            </div>
            <div>
              <span>Planned Prices</span>
              <strong>{selected.parsed.prices || "—"}</strong>
            </div>
            <div>
              <span>Tags</span>
              <strong>{selected.reflection.tags?.join(", ") || "—"}</strong>
            </div>
          </div>
          <section>
            <h4>Reflection answers</h4>
            {Object.keys(selected.parsed.questions).length === 0 ? (
              <p>No answers captured.</p>
            ) : (
              <ul>
                {Object.entries(selected.parsed.questions).map(
                  ([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value || "—"}
                    </li>
                  )
                )}
              </ul>
            )}
          </section>
          <button
            type="button"
            className="reflection-list__detail-close"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
        </aside>
      ) : null}
    </div>
  );
};