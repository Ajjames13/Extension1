import { useEffect, useMemo, useState } from "react";
import { listReflections } from "../../storage/reflectionStore";
import { Reflection } from "../../storage/db";
import { ReflectionDetail } from "../ReflectionDetail/ReflectionDetail";
import "./ReflectionList.css";

// --- Types ---

// Helper type for the parsed body of our new "Financy" reflections
type ParsedBody = {
  symbol?: string;
  outcome?: "win" | "loss" | "break_even";
  confidence?: number;
  setupName?: string;
  entryPrice?: string;
  direction?: "long" | "short";
};

type DayStats = {
  date: string; // ISO date string YYYY-MM-DD
  trades: Reflection[];
  winCount: number;
  lossCount: number;
  beCount: number;
};

// --- Helpers ---

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// Safely parse the JSON body we stored in NewReflection.tsx
const parseReflection = (r: Reflection): ParsedBody => {
  try {
    return JSON.parse(r.body);
  } catch {
    return {}; // Handle legacy/plain text data safely
  }
};

const formatDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export const ReflectionList = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedReflectionId, setSelectedReflectionId] = useState<number | null>(null);

  // Load data on mount
  useEffect(() => {
    listReflections().then(setReflections);
  }, []);

  // --- Calendar Logic ---

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // 1. Group trades by Date
  const tradesByDay = useMemo(() => {
    const map = new Map<string, Reflection[]>();
    
    reflections.forEach((r) => {
      const dayKey = r.createdAt.split("T")[0]; // YYYY-MM-DD
      const existing = map.get(dayKey) || [];
      map.set(dayKey, [...existing, r]);
    });
    
    return map;
  }, [reflections]);

  // 2. Build the Calendar Grid Data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month); // 0 = Sun, 1 = Mon...
    
    // Adjust for Monday start if preferred, currently Sunday start standard
    const padding = Array.from({ length: startDay }, () => null);
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayTrades = tradesByDay.get(dateStr) || [];
      
      // Calculate Stats for visual dots
      let win = 0, loss = 0, be = 0;
      dayTrades.forEach(t => {
        const data = parseReflection(t);
        if (data.outcome === "win") win++;
        else if (data.outcome === "loss") loss++;
        else if (data.outcome === "break_even") be++;
      });

      return {
        dayNum,
        dateStr,
        trades: dayTrades,
        stats: { win, loss, be }
      };
    });

    return [...padding, ...days];
  }, [year, month, tradesByDay]);

  // 3. Stats for the Header
  const monthStats = useMemo(() => {
    let total = 0, wins = 0, losses = 0;
    calendarDays.forEach(day => {
      if (!day) return;
      total += day.trades.length;
      wins += day.stats.win;
      losses += day.stats.loss;
    });
    const winRate = total > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;
    return { total, wins, losses, winRate };
  }, [calendarDays]);

  // --- Handlers ---

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDay(null); // Close sidebar on month change
  };

  const handleDayClick = (dateStr: string) => {
    if (selectedDay === dateStr) setSelectedDay(null); // Toggle off
    else setSelectedDay(dateStr);
  };

  // --- Render ---

  return (
    <div className="calendar-container">
      {/* HEADER */}
      <header className="calendar-header">
        <div className="calendar-nav">
          <button onClick={() => changeMonth(-1)}>&lt;</button>
          <h2>{monthName} {year}</h2>
          <button onClick={() => changeMonth(1)}>&gt;</button>
        </div>
        <div className="calendar-stats">
          <div className="stat-pill">
            <span className="label">TRADES</span>
            <span className="value">{monthStats.total}</span>
          </div>
          <div className="stat-pill win">
            <span className="label">WIN RATE</span>
            <span className="value">{monthStats.winRate}%</span>
          </div>
          <div className="stat-pill">
            <span className="label">P/L RATIO</span>
            <span className="value">{monthStats.wins}:{monthStats.losses}</span>
          </div>
        </div>
      </header>

      {/* GRID */}
      <div className="calendar-grid">
        {/* Weekday Headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}

        {/* Days */}
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="cal-day empty" />;

          const isActive = selectedDay === day.dateStr;
          const hasTrades = day.trades.length > 0;

          return (
            <div 
              key={day.dateStr} 
              className={`cal-day ${isActive ? "active" : ""} ${hasTrades ? "has-data" : ""}`}
              onClick={() => handleDayClick(day.dateStr)}
            >
              <div className="cal-day-num">{day.dayNum}</div>
              
              {/* Visual Dots */}
              <div className="cal-dots">
                {Array.from({ length: day.stats.win }).map((_, i) => (
                  <span key={`w-${i}`} className="dot win" />
                ))}
                {Array.from({ length: day.stats.loss }).map((_, i) => (
                  <span key={`l-${i}`} className="dot loss" />
                ))}
                {Array.from({ length: day.stats.be }).map((_, i) => (
                  <span key={`b-${i}`} className="dot be" />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* SIDEBAR (Day Summary) */}
      <div className={`day-sidebar ${selectedDay ? "open" : ""}`}>
        <div className="sidebar-header">
          <h3>{selectedDay}</h3>
          <button onClick={() => setSelectedDay(null)}>×</button>
        </div>
        
        <div className="sidebar-content">
          {selectedDay && tradesByDay.get(selectedDay)?.map((trade) => {
            const data = parseReflection(trade);
            const isWin = data.outcome === "win";
            const isLoss = data.outcome === "loss";
            
            return (
              <div 
                key={trade.id} 
                className={`trade-card ${isWin ? "win-border" : isLoss ? "loss-border" : ""}`}
                onClick={() => setSelectedReflectionId(trade.id!)}
              >
                <div className="trade-card-header">
                  <span className="symbol">{data.symbol || "Unknown"}</span>
                  <span className={`badge ${data.outcome || "neutral"}`}>
                    {data.outcome?.toUpperCase() || "N/A"}
                  </span>
                </div>
                <div className="trade-card-body">
                  <div className="row">
                    <span>{data.direction?.toUpperCase()}</span>
                    <span>Conf: {data.confidence}/10</span>
                  </div>
                  <div className="setup-name">{data.setupName || trade.title}</div>
                </div>
              </div>
            );
          })}
          
          {selectedDay && (!tradesByDay.get(selectedDay)?.length) && (
            <div className="empty-state">No trades recorded for this day.</div>
          )}
        </div>
      </div>

      {/* MODAL (Full Details) */}
      {selectedReflectionId && (
        <div className="modal-overlay" onClick={() => setSelectedReflectionId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ReflectionDetail 
              id={selectedReflectionId} 
              onClose={() => setSelectedReflectionId(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};