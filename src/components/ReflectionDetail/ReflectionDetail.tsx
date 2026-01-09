import React, { useEffect, useState } from "react";
import {
  deleteReflection,
  getReflection,
  updateReflection // Now correctly exported
} from "../../storage/reflectionStore";
import type { Reflection } from "../../storage/db";
import { FUTURES_INFO } from "../../shared/futuresinfo";
import { ChecklistSnapshot } from "../ChecklistSnapshot/ChecklistSnapshot";
import "./ReflectionDetail.css";

interface ReflectionDetailProps {
  id: number;
  onClose: () => void;
  onDelete: () => void;
}

// Helper to safely parse the JSON body
const parseBody = (bodyStr: string) => {
  try {
    return JSON.parse(bodyStr);
  } catch {
    return {};
  }
};

export const ReflectionDetail: React.FC<ReflectionDetailProps> = ({
  id,
  onClose,
  onDelete,
}) => {
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Editable State ---
  const [formData, setFormData] = useState({
    instrument: "",
    timeframe: "",
    direction: "Long",
    setupName: "",
    entryPrice: "",
    exitPrice: "",
    quantity: "1",
    prices: "", // Planned prices text
    outcome: "Win",
    pnl: "",
    confidence: "3",
    tags: "",
    questions: {} as Record<string, string>,
    checklist: [] as any[],
  });

  // Load Data
  useEffect(() => {
    let mounted = true;
    getReflection(id).then((data) => {
      if (mounted && data) {
        setReflection(data);
        const parsed = parseBody(data.body);
        
        // Populate form data from parsed body, with fallbacks
        setFormData({
          instrument: parsed.instrument || "",
          timeframe: parsed.timeframe || "",
          direction: parsed.direction || "Long",
          setupName: parsed.setupName || data.title,
          entryPrice: parsed.entryPrice || "",
          exitPrice: parsed.exitPrice || "",
          quantity: parsed.quantity || "1",
          prices: parsed.prices || "",
          outcome: parsed.outcome || "Win",
          pnl: parsed.pnl || "",
          confidence: parsed.confidence || "3",
          tags: parsed.tags || (data.tags || []).join(", "),
          questions: parsed.questions || {},
          checklist: parsed.checklist || [],
        });
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [id]);

  // PnL Auto-Calc Logic (Only active during Edit)
  useEffect(() => {
    if (!isEditing) return; 

    const symbolKey = formData.instrument.trim().toUpperCase();
    const info = FUTURES_INFO[symbolKey];

    const entry = parseFloat(formData.entryPrice);
    const exit = parseFloat(formData.exitPrice);
    const qty = parseFloat(formData.quantity);

    if (info && !isNaN(entry) && !isNaN(exit) && !isNaN(qty) && qty > 0) {
       let diff = 0;
       if (formData.direction === "Long") diff = exit - entry;
       else if (formData.direction === "Short") diff = entry - exit;

       const ticks = diff / info.tickSize;
       const totalPnl = ticks * info.tickValue * qty;
       
       if (!isNaN(totalPnl)) {
         setFormData(prev => ({ ...prev, pnl: totalPnl.toFixed(2) }));
       }
    }
  }, [formData.entryPrice, formData.exitPrice, formData.quantity, formData.direction, formData.instrument, isEditing]);


  // Handlers
  const handleSave = async () => {
    if (!reflection) return;

    // Reconstruct the body JSON preserving existing extra fields
    const currentBody = parseBody(reflection.body);
    const updatedBody = JSON.stringify({
      ...currentBody,
      instrument: formData.instrument,
      timeframe: formData.timeframe,
      direction: formData.direction,
      entryPrice: formData.entryPrice,
      exitPrice: formData.exitPrice,
      quantity: formData.quantity,
      prices: formData.prices,
      setupName: formData.setupName,
      outcome: formData.outcome,
      pnl: formData.pnl,
      confidence: formData.confidence,
      tags: formData.tags,
      questions: formData.questions,
      // Checklist remains as is
      checklist: formData.checklist, 
    });

    const updatedTags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);

    await updateReflection(id, {
      title: formData.setupName,
      body: updatedBody,
      tags: updatedTags,
    });

    setIsEditing(false);
    
    // Refresh local state
    const fresh = await getReflection(id);
    if(fresh) {
        setReflection(fresh);
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Delete this reflection permanently?")) {
      await deleteReflection(id);
      onDelete();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading || !reflection) return <div className="detail-loading">Loading...</div>;

  return (
    <div className="reflection-detail-overlay">
      <div className="reflection-detail-modal">
        
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            {isEditing ? (
              <input 
                className="edit-title-input"
                value={formData.setupName}
                onChange={(e) => handleChange("setupName", e.target.value)}
              />
            ) : (
              <h2>{reflection.title}</h2>
            )}
            <span className="date-badge">
              {new Date(reflection.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="header-actions">
            {!isEditing ? (
              <>
                <button className="btn-icon" onClick={() => setIsEditing(true)}>✎ Edit</button>
                <button className="btn-icon text-danger" onClick={handleDelete}>🗑</button>
                <button className="btn-close" onClick={onClose}>×</button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave}>Save Changes</button>
              </>
            )}
          </div>
        </div>

        <div className="modal-scroll-area">
          {/* Main Grid */}
          <div className="detail-grid">
            <div className="grid-item">
              <label>Instrument</label>
              {isEditing ? (
                 <select value={formData.instrument} onChange={(e) => handleChange("instrument", e.target.value)}>
                   {Object.keys(FUTURES_INFO).map(s => <option key={s} value={s}>{s}</option>)}
                   <option value="Custom">Custom</option>
                 </select>
              ) : (
                <div className="value">{formData.instrument}</div>
              )}
            </div>

            <div className="grid-item">
              <label>Direction</label>
              {isEditing ? (
                <select value={formData.direction} onChange={(e) => handleChange("direction", e.target.value)}>
                  <option>Long</option>
                  <option>Short</option>
                </select>
              ) : (
                <div className={`value ${formData.direction.toLowerCase()}`}>{formData.direction}</div>
              )}
            </div>

            <div className="grid-item">
              <label>Timeframe</label>
              {isEditing ? (
                <input value={formData.timeframe} onChange={(e) => handleChange("timeframe", e.target.value)} />
              ) : (
                <div className="value">{formData.timeframe}</div>
              )}
            </div>

            <div className="grid-item">
              <label>Entry</label>
              {isEditing ? (
                <input type="number" value={formData.entryPrice} onChange={(e) => handleChange("entryPrice", e.target.value)} />
              ) : (
                <div className="value">{formData.entryPrice}</div>
              )}
            </div>

            <div className="grid-item">
              <label>Exit</label>
              {isEditing ? (
                <input type="number" value={formData.exitPrice} onChange={(e) => handleChange("exitPrice", e.target.value)} />
              ) : (
                <div className="value">{formData.exitPrice}</div>
              )}
            </div>

            <div className="grid-item">
              <label>PnL</label>
              {isEditing ? (
                <input value={formData.pnl} readOnly className="pnl-input-readonly" />
              ) : (
                <div className={`value pnl ${parseFloat(formData.pnl) >= 0 ? "positive" : "negative"}`}>
                  {formData.pnl ? `$${formData.pnl}` : "-"}
                </div>
              )}
            </div>
            
            <div className="grid-item full">
              <label>Outcome</label>
              {isEditing ? (
                <select value={formData.outcome} onChange={(e) => handleChange("outcome", e.target.value)}>
                  <option>Win</option>
                  <option>Loss</option>
                  <option>BreakEven</option>
                  <option>Missed</option>
                </select>
              ) : (
                <div className="value">{formData.outcome}</div>
              )}
            </div>
          </div>

          {/* Checklist Snapshot (Read Only) */}
          {formData.checklist && formData.checklist.length > 0 && (
            <div className="detail-section">
              <h3>Execution Checklist</h3>
              <ChecklistSnapshot items={formData.checklist} readonly={true} />
            </div>
          )}

          {/* Questions */}
          <div className="detail-section">
             <h3>Analysis</h3>
             {Object.entries(formData.questions).map(([key, answer]) => (
               <div key={key} className="qa-block">
                 <div className="question-label">{key}</div> 
                 {isEditing ? (
                   <textarea 
                     value={answer as string} 
                     onChange={(e) => setFormData(prev => ({
                       ...prev,
                       questions: { ...prev.questions, [key]: e.target.value }
                     }))}
                   />
                 ) : (
                   <div className="answer-text">{answer as string || "No answer provided."}</div>
                 )}
               </div>
             ))}
          </div>
          
        </div>
      </div>
    </div>
  );
};