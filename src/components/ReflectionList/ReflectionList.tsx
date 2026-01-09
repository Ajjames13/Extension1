import React, { useEffect, useMemo, useState } from "react";
import { listReflections, deleteReflection } from "../../storage/reflectionStore";
import type { Reflection } from "../../storage/db";
import "./ReflectionList.css";

// --- Types ---
type ParsedBody = {
  instrument?: string;
  timeframe?: string;
  direction?: string;
  setupName?: string;
  outcome?: string;
  pnl?: string | number;
  confidence?: string | number;
  date?: string;
  images?: Array<any>;
};

// Extended type for internal use in this component
type ProcessedReflection = Reflection & {
  parsed: {
    instrument: string;
    setupName: string;
    outcome: string;
    pnl: number;
    date: Date;
    direction: string;
    hasImages: boolean;
    confidence: number;
  };
};

// --- Helper: Safely Parse JSON Body ---
const parseBody = (bodyStr: string): ParsedBody => {
  try {
    return JSON.parse(bodyStr);
  } catch (e) {
    return {};
  }
};

export const ReflectionList: React.FC<{
  onSelect: (r: Reflection) => void;
  searchTerm?: string;
}> = ({ onSelect, searchTerm = "" }) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // FIX: ID is number, so state must accept number
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // --- Initial Load ---
  const loadData = async () => {
    try {
      const data = await listReflections();
      setReflections(data);
    } catch (err) {
      console.error("Error loading reflections:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers ---
  const handleDelete = async (e: React.MouseEvent, id?: number) => {
    e.stopPropagation(); // Prevent row click
    if (id === undefined) return;

    // eslint-disable-next-line no-restricted-globals
    if (confirm("Are you sure you want to delete this reflection?")) {
      setIsDeleting(id);
      await deleteReflection(id);
      await loadData();
      setIsDeleting(null);
    }
  };

  // --- Derived Data: Processing ---
  const processedData: ProcessedReflection[] = useMemo(() => {
    return reflections.map((r) => {
      const data = parseBody(r.body);
      
      // Normalize PnL safely
      let rawPnl = data.pnl ?? 0;
      if (typeof rawPnl === "string") {
        rawPnl = parseFloat(rawPnl.replace(/[^0-9.-]+/g, ""));
      }
      const pnlVal = Number.isFinite(rawPnl) ? (rawPnl as number) : 0;

      // FIX: Use 'createdAt' from DB as fallback, not 'timestamp'
      const dateVal = data.date ? new Date(data.date) : new Date(r.createdAt);

      return {
        ...r,
        parsed: {
          instrument: data.instrument || "Unknown",
          setupName: data.setupName || r.title || "Untitled",
          outcome: data.outcome || "Missed",
          pnl: pnlVal,
          date: dateVal,
          direction: data.direction || "-",
          hasImages: Array.isArray(data.images) && data.images.length > 0,
          confidence: Number(data.confidence) || 0,
        }
      };
    });
  }, [reflections]);

  // --- Filtering & Sorting ---
  const filteredReflections = useMemo(() => {
    let result = processedData;

    // 1. Text Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(lower) ||
          r.parsed.instrument.toLowerCase().includes(lower) ||
          r.parsed.setupName.toLowerCase().includes(lower) ||
          // FIX: Handle undefined tags
          (r.tags?.some((t) => t.toLowerCase().includes(lower)))
      );
    }

    // 2. Date Filter
    if (startDate) {
      const start = new Date(startDate).getTime();
      result = result.filter((r) => r.parsed.date.getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((r) => r.parsed.date.getTime() <= end.getTime());
    }

    // 3. Sort (Newest First)
    return result.sort((a, b) => b.parsed.date.getTime() - a.parsed.date.getTime());
  }, [processedData, searchTerm, startDate, endDate]);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    let totalPnl = 0;
    let wins = 0;
    let totalTrades = 0;

    filteredReflections.forEach((r) => {
      totalPnl += r.parsed.pnl;
      
      const outcome = (r.parsed.outcome || "").toLowerCase();
      if (outcome === "win") wins++;
      
      // Count only valid trades for Win Rate
      if (["win", "loss", "breakeven"].includes(outcome)) {
        totalTrades++;
      }
    });

    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0.0";

    return {
      totalPnl: totalPnl.toFixed(2),
      winRate,
      totalTrades,
    };
  }, [filteredReflections]);

  return (
    <div className="reflection-list-container">
      {/* --- Stats Dashboard --- */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <span className="stat-label">NET P&L</span>
          <span className={`stat-value ${parseFloat(stats.totalPnl) >= 0 ? "text-success" : "text-danger"}`}>
            {parseFloat(stats.totalPnl) >= 0 ? "$" : "-$"}{Math.abs(parseFloat(stats.totalPnl)).toFixed(2)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">WIN RATE</span>
          <span className="stat-value">{stats.winRate}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">TRADES</span>
          <span className="stat-value">{stats.totalTrades}</span>
        </div>
      </div>

      {/* --- Controls Bar --- */}
      <div className="filter-bar">
        <div className="date-inputs">
          <div className="input-group">
            <label>From</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <label>To</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
        </div>
        
        {(startDate || endDate) && (
          <button 
            className="btn-text-only"
            onClick={() => { setStartDate(""); setEndDate(""); }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* --- Data Table Header --- */}
      <div className="reflections-grid-header">
        <div className="col-date">Date</div>
        <div className="col-symbol">Symbol</div>
        <div className="col-setup">Setup</div>
        <div className="col-outcome">Result</div>
        <div className="col-pnl">PnL</div>
        <div className="col-actions"></div>
      </div>

      {/* --- Scrollable List --- */}
      <div className="reflections-scroll-area">
        {filteredReflections.length === 0 ? (
          <div className="empty-state">
            <p>No reflections found.</p>
          </div>
        ) : (
          filteredReflections.map((r) => (
            <div
              key={r.id} // r.id should be a number here
              className="reflection-row"
              onClick={() => onSelect(r)}
            >
              <div className="col-date">
                <span className="date-main">{r.parsed.date.toLocaleDateString()}</span>
                <span className="date-sub">{r.parsed.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              <div className="col-symbol">
                <div className="symbol-wrapper">
                  <span className={`badge-direction ${r.parsed.direction.toLowerCase()}`}>
                    {r.parsed.direction === "Long" ? "L" : r.parsed.direction === "Short" ? "S" : "?"}
                  </span>
                  <span className="symbol-text">{r.parsed.instrument}</span>
                  {r.parsed.hasImages && <span className="icon-attachment" title="Has Images">📎</span>}
                </div>
                
                {/* Safe Tag Rendering */}
                {r.tags && r.tags.length > 0 && (
                  <div className="row-tags">
                    {r.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                    {r.tags.length > 3 && <span className="tag-more">+{r.tags.length - 3}</span>}
                  </div>
                )}
              </div>

              <div className="col-setup">
                {r.parsed.setupName}
              </div>

              <div className="col-outcome">
                <span className={`outcome-pill ${r.parsed.outcome.toLowerCase()}`}>
                  {r.parsed.outcome}
                </span>
              </div>

              <div className={`col-pnl ${r.parsed.pnl > 0 ? "text-success" : r.parsed.pnl < 0 ? "text-danger" : ""}`}>
                {r.parsed.pnl > 0 ? "+" : r.parsed.pnl < 0 ? "-" : ""}${Math.abs(r.parsed.pnl).toFixed(2)}
              </div>

              <div className="col-actions">
                <button 
                  className="btn-delete"
                  // FIX: Pass number ID properly
                  onClick={(e) => handleDelete(e, r.id)}
                  // FIX: Comparison works now (number vs number)
                  disabled={isDeleting === r.id}
                  title="Delete"
                >
                  {isDeleting === r.id ? "..." : "×"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};