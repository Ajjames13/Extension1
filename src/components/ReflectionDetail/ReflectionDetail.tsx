import { useEffect, useState } from "react";
import { getReflection, ReflectionWithImages } from "../../storage/reflectionStore";
import "./ReflectionDetail.css";

type Props = {
  id: number;
  onClose: () => void;
};

// Helper to parse the body safely
const parseBody = (body: string) => {
  try {
    const data = JSON.parse(body);
    // If it's the new structured format, it returns an object.
    // If it's old legacy text, JSON.parse might fail or return a string/number.
    if (typeof data === "object" && data !== null) return data;
    return { notes: body }; // Fallback for legacy text
  } catch {
    return { notes: body }; // Fallback for plain text
  }
};

export const ReflectionDetail = ({ id, onClose }: Props) => {
  const [data, setData] = useState<ReflectionWithImages | null>(null);

  useEffect(() => {
    getReflection(id).then(setData);
  }, [id]);

  if (!data) return <div className="rd-loading">Loading trade details...</div>;

  const { reflection, images } = data;
  const details = parseBody(reflection.body);

  // Determine styles based on outcome
  const outcomeClass = details.outcome || "neutral"; // win, loss, break_even

  return (
    <div className="rd-container">
      {/* HEADER */}
      <header className={`rd-header ${outcomeClass}`}>
        <div className="rd-header-top">
          <span className="rd-id">#{reflection.id}</span>
          <button className="rd-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="rd-header-main">
          <h1>{details.symbol || reflection.title}</h1>
          <div className="rd-badges">
            <span className="rd-badge direction">
              {details.direction?.toUpperCase() || "—"}
            </span>
            <span className={`rd-badge outcome ${outcomeClass}`}>
              {details.outcome?.replace("_", " ").toUpperCase() || "UNKNOWN"}
            </span>
          </div>
        </div>
        <div className="rd-header-meta">
          <span>{new Date(reflection.createdAt).toLocaleString()}</span>
          {details.setupName && <span> • {details.setupName}</span>}
        </div>
      </header>

      {/* CONTENT GRID */}
      <div className="rd-content">
        
        {/* ROW 1: Execution Data */}
        <section className="rd-section">
          <div className="rd-section-title">:: EXECUTION & RISK</div>
          <div className="rd-stat-grid">
            <div className="rd-stat">
              <label>ENTRY</label>
              <div className="font-mono">{details.entryPrice || "—"}</div>
            </div>
            <div className="rd-stat">
              <label>TARGET</label>
              <div className="font-mono">{details.targetPrice || "—"}</div>
            </div>
            <div className="rd-stat">
              <label>STOP LOSS</label>
              <div className="font-mono">{details.stopLossPrice || "—"}</div>
            </div>
            <div className="rd-stat">
              <label>CONFIDENCE</label>
              <div className="rd-confidence-pill">
                {details.confidence ? `${details.confidence}/10` : "—"}
              </div>
            </div>
          </div>
          
          {details.stopLossType && (
            <div className="rd-extra-row">
              <span className="rd-label-sm">RISK TYPE:</span>
              <span className="rd-tag">{details.stopLossType.toUpperCase()}</span>
            </div>
          )}
        </section>

        {/* ROW 2: Notes & Thesis */}
        <section className="rd-section">
          <div className="rd-section-title">:: TRADER NOTES</div>
          <div className="rd-notes">
            {details.notes || details.questions?.thesis || "No notes recorded."}
          </div>
        </section>

        {/* ROW 3: Checklist (ReadOnly) */}
        {details.checklist && details.checklist.length > 0 && (
          <section className="rd-section">
            <div className="rd-section-title">:: PRE-TRADE CHECKLIST STATE</div>
            <div className="rd-checklist-read">
              {details.checklist.map((item: any) => (
                <div key={item.id} className="rd-check-item">
                  <span className="rd-check-icon">{item.checked ? "☑" : "☐"}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ROW 4: Images */}
        {images.length > 0 && (
          <section className="rd-section">
            <div className="rd-section-title">:: CHART EVIDENCE</div>
            <div className="rd-gallery">
              {images.map((img) => (
                <div key={img.id} className="rd-image-card">
                  <img src={img.dataUrl} alt={img.name} />
                  <div className="rd-img-caption">{img.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER: Tags */}
        {reflection.tags && reflection.tags.length > 0 && (
          <div className="rd-tags-footer">
            {reflection.tags.map((tag) => (
              <span key={tag} className="rd-footer-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};