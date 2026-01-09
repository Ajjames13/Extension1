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
import { FUTURES_INFO } from "../../shared/futuresInfo";
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
  instrument: "",
  timeframe: "",
  direction: "",
  entryPrice: "",
  exitPrice: "",
  quantity: "1",
  prices: "",
  setupName: "",
  outcome: "",
  pnl: "",
  confidence: "",
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
        if (draft.direction === "long") {
          diff = exit - entry;
        } else if (draft.direction === "short") {
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
    draft.pnl
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

      {/* Daily Checklist Section */}
      <section 
        className="new-reflection__section" 
        style={{ 
          padding: '16px', 
          background: 'var(--bg-input)', 
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Pre-Trade Checklist {dailyChecklistComplete ? "(Completed Today)" : ""}</h3>
          <button 
            type="button" 
            onClick={() => setIsChecklistCollapsed(!isChecklistCollapsed)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-primary)' }}
          >
            {isChecklistCollapsed ? "Show" : "Hide"}
          </button>
        </div>
        
        {!isChecklistCollapsed && (
          <>
            <ChecklistSnapshot
              items={draft.checklist}
              onToggle={handleChecklistToggle}
            />
            {!dailyChecklistComplete && (
               <div style={{ marginTop: '12px' }}>
                 <button 
                   type="button" 
                   onClick={handleMarkChecklistComplete}
                   style={{ background: 'var(--accent-success)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                 >
                   Mark Checklist Complete for Today
                 </button>
               </div>
            )}
          </>
        )}
      </section>

      {shouldBlockForm ? (
        <div className="new-reflection__section">
          <p style={{ textAlign: "center", color: "var(--accent-danger)" }}>
            Complete the daily checklist above to unlock the reflection form.
          </p>
        </div>
      ) : (
        <>
          <section className="new-reflection__section">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <label>
                Instrument *
                <input
                  type="text"
                  name="instrument"
                  value={draft.instrument}
                  onChange={handleFieldChange("instrument")}
                  required
                  placeholder="e.g. ES, NQ, CL"
                />
              </label>
              <label>
                Timeframe *
                <input
                  type="text"
                  name="timeframe"
                  value={draft.timeframe}
                  onChange={handleFieldChange("timeframe")}
                  required
                />
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
              <label>
                Direction *
                <select
                  name="direction"
                  value={draft.direction}
                  onChange={handleFieldChange("direction")}
                  required
                >
                  <option value="">Select</option>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  step="any"
                  name="quantity"
                  value={draft.quantity}
                  onChange={handleFieldChange("quantity")}
                />
              </label>
              <label>
                Entry Price
                <input
                  type="number"
                  step="any"
                  name="entryPrice"
                  value={draft.entryPrice}
                  onChange={handleFieldChange("entryPrice")}
                />
              </label>
              <label>
                Exit Price
                <input
                  type="number"
                  step="any"
                  name="exitPrice"
                  value={draft.exitPrice}
                  onChange={handleFieldChange("exitPrice")}
                />
              </label>
            </div>

            <label>
              Planned Prices (Stop / Target)
              <input
                type="text"
                name="prices"
                value={draft.prices}
                onChange={handleFieldChange("prices")}
                placeholder="Entry, stop, target context"
              />
            </label>
            <label>
              Setup name *
              <input
                type="text"
                name="setupName"
                value={draft.setupName}
                onChange={handleFieldChange("setupName")}
                required
              />
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <label>
                Outcome *
                <input
                  type="text"
                  name="outcome"
                  value={draft.outcome}
                  onChange={handleFieldChange("outcome")}
                  required
                />
              </label>
              <label>
                PnL ($)
                <input
                  type="text"
                  name="pnl"
                  value={draft.pnl}
                  onChange={handleFieldChange("pnl")}
                  placeholder="Auto-calc if symbol valid"
                  readOnly
                  style={{ background: 'var(--bg-hover)' }}
                />
              </label>
              <label>
                Confidence *
                <input
                  type="text"
                  name="confidence"
                  value={draft.confidence}
                  onChange={handleFieldChange("confidence")}
                  required
                />
              </label>
            </div>

            <label>
              Tags
              <input
                type="text"
                name="tags"
                value={draft.tags}
                onChange={handleFieldChange("tags")}
                placeholder="comma,separated,tags"
              />
            </label>
          </section>

          <section className="new-reflection__section">
            <h3>Reflection questions</h3>
            <div className="new-reflection__questions">
              {dynamicQuestions.length > 0
                ? dynamicQuestions.map((question) => (
                    <label key={question.id}>
                      {question.label}
                      <textarea
                        name={question.id}
                        value={draft.questions[question.id] ?? ""}
                        onChange={handleQuestionChange(question.id)}
                        placeholder={question.placeholder}
                        rows={3}
                      />
                    </label>
                  ))
                : // Fallback if dynamic questions haven't loaded yet
                  questionTemplate.map((question) => (
                    <label key={question.id}>
                      {question.label}
                      <textarea
                        name={question.id}
                        value={draft.questions[question.id] ?? ""}
                        onChange={handleQuestionChange(question.id)}
                        placeholder={question.placeholder}
                        rows={3}
                      />
                    </label>
                  ))}
            </div>
          </section>

          <section className="new-reflection__section">
            <h3>Images (up to 5)</h3>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={draft.images.length >= 5}
            />
            {draft.images.length > 0 ? (
              <div className="new-reflection__images">
                {draft.images.map((image) => (
                  <figure key={image.name} className="new-reflection__image">
                    <img src={image.dataUrl} alt={image.name} />
                    <figcaption>{image.name}</figcaption>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.name)}
                    >
                      Remove
                    </button>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="new-reflection__hint">
                Add screenshots or charts to support the reflection.
              </p>
            )}
          </section>

          <footer className="new-reflection__footer">
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save reflection"}
            </button>
            {statusMessage ? (
              <span className="new-reflection__status">{statusMessage}</span>
            ) : null}
          </footer>
        </>
      )}
    </form>
  );
};