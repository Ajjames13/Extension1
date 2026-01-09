import React, { useEffect, useMemo, useState } from "react";
import {
  ChecklistSnapshot,
  ChecklistSnapshotItem
} from "../ChecklistSnapshot/ChecklistSnapshot";
import { getChecklistTemplate } from "../../storage/checklistStore";
import {
  ReflectionQuestion,
  getReflectionQuestions
} from "../../storage/reflectionQuestionsStore";
import { createReflection } from "../../storage/reflectionStore";
import { FUTURES_INFO } from "../../shared/futuresinfo";
import { db } from "../../storage/db";
import "./NewReflection.css";

type QuestionTemplate = {
  id: string;
  label: string;
  placeholder: string;
};

type DraftState = {
  instrument: string;
  timeframe: string;
  direction: string;
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  prices: string;
  setupName: string;
  outcome: string;
  pnl: string;
  confidence: string;
  tags: string;
  questions: Record<string, string>;
  images: Array<{ name: string; dataUrl: string }>;
  checklist: ChecklistSnapshotItem[];
};

const buildQuestionDefaults = (questions: ReflectionQuestion[]) => {
  return questions.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = "";
    return acc;
  }, {});
};

// Original hardcoded template constant
const questionTemplate: QuestionTemplate[] = [
  {
    id: "thesis",
    label: "What is your core thesis for this trade?",
    placeholder: "Summarize the idea behind the setup."
  },
  {
    id: "risk",
    label: "What is the primary risk you are watching?",
    placeholder: "Note invalidation or stop context."
  },
  {
    id: "improvement",
    label: "What would you improve next time?",
    placeholder: "Capture a key learning from this reflection."
  }
];

// Initialization logic using questionTemplate
const emptyDraft: DraftState = {
  instrument: "ES", // Defaulting to ES for convenience
  timeframe: "1m",
  direction: "Long",
  entryPrice: "",
  exitPrice: "",
  quantity: "1",
  prices: "",
  setupName: "",
  outcome: "Win",
  pnl: "",
  confidence: "3",
  tags: "",
  questions: questionTemplate.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = "";
    return acc;
  }, {}),
  images: [],
  checklist: []
};

let cachedDraft: DraftState | null = null;

const buildBody = (draft: DraftState) => {
  return JSON.stringify(
    {
      instrument: draft.instrument,
      timeframe: draft.timeframe,
      direction: draft.direction,
      entryPrice: draft.entryPrice,
      exitPrice: draft.exitPrice,
      quantity: draft.quantity,
      prices: draft.prices,
      setupName: draft.setupName,
      outcome: draft.outcome,
      pnl: draft.pnl,
      confidence: draft.confidence,
      tags: draft.tags,
      questions: draft.questions,
      checklist: draft.checklist
    },
    null,
    2
  );
};

const getTodayString = () => new Date().toISOString().split("T")[0];

export const NewReflection = () => {
  const [draft, setDraft] = useState<DraftState>(
    () => cachedDraft ?? emptyDraft
  );
  const [dynamicQuestions, setDynamicQuestions] = useState<ReflectionQuestion[]>(
    []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Daily Checklist Logic
  const [checklistBlockingMode, setChecklistBlockingMode] = useState(false);
  const [dailyChecklistComplete, setDailyChecklistComplete] = useState(false);
  const [isChecklistCollapsed, setIsChecklistCollapsed] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const lastDate = localStorage.getItem("extension1_checklist_date");
      const today = getTodayString();
      const isCompleteToday = lastDate === today;
      setDailyChecklistComplete(isCompleteToday);
      setIsChecklistCollapsed(isCompleteToday);

      const setting = await db.settings.get("checklistBlocking");
      setChecklistBlockingMode(setting?.value === "true");
    };
    loadSettings();
  }, []);

  const handleMarkChecklistComplete = () => {
    const today = getTodayString();
    localStorage.setItem("extension1_checklist_date", today);
    setDailyChecklistComplete(true);
    setIsChecklistCollapsed(true);
  };

  const shouldBlockForm = checklistBlockingMode && !dailyChecklistComplete;

  const requiredFieldsFilled = useMemo(() => {
    return (
      draft.instrument.trim() &&
      draft.timeframe.trim() &&
      draft.direction.trim() &&
      draft.setupName.trim() &&
      draft.outcome.trim() &&
      draft.confidence.trim()
    );
  }, [draft]);

  useEffect(() => {
    cachedDraft = draft;
  }, [draft]);

  // PnL Auto Calculation
  useEffect(() => {
    const symbolKey = draft.instrument.trim().toUpperCase();
    const info = FUTURES_INFO[symbolKey];

    const canCalculate =
      info &&
      draft.entryPrice.trim() !== "" &&
      draft.exitPrice.trim() !== "" &&
      draft.quantity.trim() !== "" &&
      draft.direction;

    if (canCalculate) {
      const entry = parseFloat(draft.entryPrice);
      const exit = parseFloat(draft.exitPrice);
      const qty = parseFloat(draft.quantity);

      if (
        Number.isFinite(entry) &&
        Number.isFinite(exit) &&
        Number.isFinite(qty) &&
        info.tickSize > 0
      ) {
        let diff = 0;
        if (draft.direction === "Long") {
          diff = exit - entry;
        } else if (draft.direction === "Short") {
          diff = entry - exit;
        }

        const ticks = diff / info.tickSize;
        const totalPnl = ticks * info.tickValue * qty;

        if (Number.isFinite(totalPnl)) {
          setDraft((prev) => ({
            ...prev,
            pnl: totalPnl.toFixed(2)
          }));
          return;
        }
      }
    }

    if (draft.pnl !== "") {
      // Only clear if we were trying to calc and failed, but preserve manual entry if needed?
      // For now, sticking to original logic which clears it if calc fails
      // However, to be safe, if we can't calc, we probably shouldn't wipe manual input unless fields changed
      // sticking to exact original logic to be safe:
      setDraft((prev) => ({
        ...prev,
        pnl: ""
      }));
    }
  }, [
    draft.instrument,
    draft.entryPrice,
    draft.exitPrice,
    draft.quantity,
    draft.direction,
    // Note: removed draft.pnl dependency to avoid infinite loop if we set pnl inside
  ]);

  useEffect(() => {
    let isMounted = true;
    const loadChecklist = async () => {
      const template = await getChecklistTemplate();
      if (!isMounted) return;
      setDraft((prev) => {
        if (prev.checklist.length > 0) return prev;
        return {
          ...prev,
          checklist: template.map((item) => ({
            id: item.id,
            text: item.text,
            checked: false
          }))
        };
      });
    };
    loadChecklist();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadQuestions = async () => {
      const template = await getReflectionQuestions();
      if (!isMounted) return;
      setDynamicQuestions(template);
      setDraft((prev) => {
        const defaults = buildQuestionDefaults(template);
        return {
          ...prev,
          questions: { ...defaults, ...prev.questions }
        };
      });
    };
    loadQuestions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFieldChange = (field: keyof DraftState) => {
    return (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLSelectElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      setDraft((prev) => ({
        ...prev,
        [field]: event.target.value
      }));
    };
  };

  const handleQuestionChange = (id: string) => {
    return (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setDraft((prev) => ({
        ...prev,
        questions: { ...prev.questions, [id]: value }
      }));
    };
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const availableSlots = Math.max(0, 5 - draft.images.length);
    const nextFiles = files.slice(0, availableSlots);

    Promise.all(
      nextFiles.map(
        (file) =>
          new Promise<{ name: string; dataUrl: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    )
      .then((uploaded) => {
        setDraft((prev) => ({
          ...prev,
          images: [...prev.images, ...uploaded]
        }));
      })
      .catch(() => setStatusMessage("Unable to read one of the selected images."))
      .finally(() => {
        event.target.value = "";
      });
  };

  const handleChecklistToggle = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    }));
  };

  const handleRemoveImage = (name: string) => {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image.name !== name)
    }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    if (!requiredFieldsFilled) {
      setStatusMessage("Please fill all required fields before saving.");
      return;
    }
    setIsSaving(true);
    try {
      await createReflection({
        title: draft.setupName.trim(),
        body: buildBody(draft),
        tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        images: draft.images.map((image) => ({ name: image.name, dataUrl: image.dataUrl }))
      });
      setDraft((prev) => ({
        ...emptyDraft,
        checklist: prev.checklist.map((item) => ({ ...item, checked: false }))
      }));
      // Manually reset pnl/prices which might stick due to emptyDraft closures
      setDraft(emptyDraft); 
      
      setStatusMessage("Reflection saved.");
    } catch {
      setStatusMessage("Unable to save reflection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="new-reflection" onSubmit={handleSave}>
      <header className="new-reflection__header">
        <h2>New Reflection</h2>
        <p>Capture a quick reflection about the trade setup.</p>
      </header>

      {/* --- Mission Control Checklist Section --- */}
      <section className="mission-control-module">
        <div className="module-header">
          <span>EXECUTION CHECKLIST {dailyChecklistComplete ? "(COMPLETED)" : ""}</span>
          <button 
            type="button" 
            className="toggle-btn-small"
            onClick={() => setIsChecklistCollapsed(!isChecklistCollapsed)}
          >
            {isChecklistCollapsed ? "EXPAND" : "COLLAPSE"}
          </button>
        </div>
        
        {!isChecklistCollapsed && (
          <div className="checklist-content">
            <ChecklistSnapshot
              items={draft.checklist}
              onToggle={handleChecklistToggle}
            />
            {!dailyChecklistComplete && (
              <div className="checklist-actions">
                <button 
                  type="button" 
                  className="btn-success-small"
                  onClick={handleMarkChecklistComplete}
                >
                  Confirm Checklist Complete
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {shouldBlockForm ? (
        <div className="locked-state">
          <div className="lock-icon">🔒</div>
          <p>Complete the Pre-Trade Checklist to unlock.</p>
        </div>
      ) : (
        <div className="main-scroll-area">
          
          {/* --- Grid Layout for Trade Data --- */}
          <section className="new-reflection__section">
            <div className="form-grid">
              
              {/* Row 1 */}
              <div className="form-group">
                <label>Instrument *</label>
                <select 
                  name="instrument"
                  value={draft.instrument}
                  onChange={handleFieldChange("instrument")}
                  required
                >
                  <option value="">Select...</option>
                  {Object.keys(FUTURES_INFO).map(sym => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="form-group">
                <label>Timeframe *</label>
                <select 
                  name="timeframe"
                  value={draft.timeframe}
                  onChange={handleFieldChange("timeframe")}
                  required
                >
                   <option value="1m">1 Minute</option>
                   <option value="5m">5 Minute</option>
                   <option value="15m">15 Minute</option>
                   <option value="1H">1 Hour</option>
                   <option value="4H">4 Hour</option>
                   <option value="D">Daily</option>
                </select>
              </div>

              <div className="form-group">
                <label>Direction *</label>
                <div className="radio-group">
                   <button
                     type="button"
                     className={`toggle-btn ${draft.direction === "Long" ? "active long" : ""}`}
                     onClick={() => setDraft(prev => ({ ...prev, direction: "Long" }))}
                   >
                     Long
                   </button>
                   <button
                     type="button"
                     className={`toggle-btn ${draft.direction === "Short" ? "active short" : ""}`}
                     onClick={() => setDraft(prev => ({ ...prev, direction: "Short" }))}
                   >
                     Short
                   </button>
                </div>
              </div>

              {/* Row 2 */}
              <div className="form-group">
                <label>Entry</label>
                <input
                  type="number"
                  step="any"
                  name="entryPrice"
                  value={draft.entryPrice}
                  onChange={handleFieldChange("entryPrice")}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Exit</label>
                <input
                  type="number"
                  step="any"
                  name="exitPrice"
                  value={draft.exitPrice}
                  onChange={handleFieldChange("exitPrice")}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  step="any"
                  name="quantity"
                  value={draft.quantity}
                  onChange={handleFieldChange("quantity")}
                />
              </div>

              {/* Row 3 */}
              <div className="form-group">
                <label>Planned Prices</label>
                <input
                  type="text"
                  name="prices"
                  value={draft.prices}
                  onChange={handleFieldChange("prices")}
                  placeholder="Stop / Target context"
                />
              </div>

              <div className="form-group">
                <label>Setup Name *</label>
                <input
                  type="text"
                  name="setupName"
                  value={draft.setupName}
                  onChange={handleFieldChange("setupName")}
                  required
                  placeholder="e.g. Opening Range Breakout"
                />
              </div>

              {/* Row 4 */}
              <div className="form-group">
                <label>Outcome *</label>
                <select
                  name="outcome"
                  value={draft.outcome}
                  onChange={handleFieldChange("outcome")}
                  required
                >
                  <option value="Win">Win</option>
                  <option value="Loss">Loss</option>
                  <option value="BreakEven">Break Even</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>

              <div className="form-group">
                <label>PnL ($)</label>
                <input
                  type="text" // Keep as text to allow empty state if NaN
                  name="pnl"
                  value={draft.pnl}
                  readOnly
                  className={parseFloat(draft.pnl) > 0 ? "pnl-positive" : parseFloat(draft.pnl) < 0 ? "pnl-negative" : ""}
                  placeholder="Auto-calc"
                />
              </div>

              <div className="form-group">
                <label>Confidence (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  name="confidence"
                  value={draft.confidence}
                  onChange={handleFieldChange("confidence")}
                  required
                />
              </div>

              {/* Row 5 */}
              <div className="form-group full-width">
                <label>Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={draft.tags}
                  onChange={handleFieldChange("tags")}
                  placeholder="comma, separated, tags"
                />
              </div>

            </div>
          </section>

          {/* --- Reflection Questions --- */}
          <section className="new-reflection__section">
            <h3 className="section-title">Analysis</h3>
            <div className="questions-container">
              {dynamicQuestions.length > 0
                ? dynamicQuestions.map((question) => (
                    <div key={question.id} className="question-group">
                      <label>{question.label}</label>
                      <textarea
                        name={question.id}
                        value={draft.questions[question.id] ?? ""}
                        onChange={handleQuestionChange(question.id)}
                        placeholder={question.placeholder}
                        rows={3}
                      />
                    </div>
                  ))
                : questionTemplate.map((question) => (
                    <div key={question.id} className="question-group">
                      <label>{question.label}</label>
                      <textarea
                        name={question.id}
                        value={draft.questions[question.id] ?? ""}
                        onChange={handleQuestionChange(question.id)}
                        placeholder={question.placeholder}
                        rows={3}
                      />
                    </div>
                  ))}
            </div>
          </section>

          {/* --- Images --- */}
          <section className="new-reflection__section">
            <h3 className="section-title">Charts / Screenshots (Max 5)</h3>
            <div className="image-upload-wrapper">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={draft.images.length >= 5}
                className="file-input"
              />
              <div className="file-input-label">
                {draft.images.length >= 5 ? "Limit Reached" : "+ Add Images"}
              </div>
            </div>
            
            {draft.images.length > 0 && (
              <div className="new-reflection__images">
                {draft.images.map((image) => (
                  <figure key={image.name} className="new-reflection__image">
                    <img src={image.dataUrl} alt={image.name} />
                    <button
                      type="button"
                      className="remove-img-btn"
                      onClick={() => handleRemoveImage(image.name)}
                    >
                      ×
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </section>

          {/* --- Footer --- */}
          <footer className="new-reflection__footer">
            <button className="btn-primary full-width" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Reflection"}
            </button>
            {statusMessage && (
              <span className="new-reflection__status">{statusMessage}</span>
            )}
          </footer>
        </div>
      )}
    </form>
  );
};