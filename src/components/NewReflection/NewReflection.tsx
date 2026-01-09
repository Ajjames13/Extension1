import { useEffect, useMemo, useState } from "react";
import {
  ChecklistSnapshot,
  ChecklistSnapshotItem
} from "../ChecklistSnapshot/ChecklistSnapshot";
import { getChecklistTemplate } from "../../storage/checklistStore";
import { createReflection } from "../../storage/reflectionStore";
import { getSectionOrder, SectionConfig, DEFAULT_SECTION_ORDER } from "../../storage/settingsStore";
import "./NewReflection.css";

// --- Types ---
type StopLossType = "structural" | "emotional" | "arbitrary";
type OutcomeType = "win" | "loss" | "break_even";

type DraftState = {
  symbol: string;
  setupName: string;
  direction: "long" | "short";
  entryPrice: string;
  stopLossPrice: string;
  stopLossType: StopLossType | null;
  targetPrice: string;
  targetType: string;
  outcome: OutcomeType | null;
  confidence: number;
  notes: string;
  tags: string;
  images: Array<{ name: string; dataUrl: string }>;
  checklist: ChecklistSnapshotItem[];
};

const CONFIDENCE_SCALE = Array.from({ length: 10 }, (_, i) => i + 1);

const TARGET_TEMPLATES = [
  "Manual",
  "Resting Liquidity",
  "Next FVG",
  "Measured Move",
  "Previous High/Low"
];

const emptyDraft: DraftState = {
  symbol: "",
  setupName: "",
  direction: "long",
  entryPrice: "",
  stopLossPrice: "",
  stopLossType: null,
  targetPrice: "",
  targetType: "Manual",
  outcome: null,
  confidence: 5,
  notes: "",
  tags: "",
  images: [],
  checklist: []
};

const getConfidenceColor = (val: number) => {
  const hue = ((val - 1) / 9) * 120; 
  return `hsl(${hue}, 70%, 45%)`;
};

export const NewReflection = () => {
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sectionOrder, setSectionOrder] = useState<SectionConfig[]>(DEFAULT_SECTION_ORDER);

  // --- Gatekeeper Logic ---
  const isChecklistComplete = useMemo(() => {
    return (
      draft.checklist.length > 0 && 
      draft.checklist.every((item) => item.checked)
    );
  }, [draft.checklist]);

  // --- Load Data on Mount ---
  useEffect(() => {
    let isMounted = true;

    // Load Checklist
    getChecklistTemplate().then((template) => {
      if (!isMounted) return;
      setDraft((prev) => ({
        ...prev,
        checklist: template.map((t) => ({ 
          id: t.id, 
          text: t.text, 
          checked: false 
        }))
      }));
    });

    // Load Layout Preferences
    getSectionOrder().then((order) => {
      if (isMounted && order.length > 0) {
        setSectionOrder(order);
      }
    });

    return () => { isMounted = false; };
  }, []);

  // --- Handlers ---
  const handleFieldChange = (field: keyof DraftState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files).slice(0, 5 - draft.images.length);
    
    Promise.all(
      files.map((file) => new Promise<{ name: string; dataUrl: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, dataUrl: reader.result as string });
        reader.readAsDataURL(file);
      }))
    ).then((imgs) => setDraft((p) => ({ ...p, images: [...p.images, ...imgs] })));
  };

  const handleRemoveImage = (name: string) => {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.name !== name)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.symbol || !draft.outcome) {
      setStatusMessage("Symbol and Outcome are required.");
      return;
    }
    
    setIsSaving(true);
    try {
      const bodyPayload = JSON.stringify({
        ...draft,
        instrument: draft.symbol, 
        prices: `E: ${draft.entryPrice} | S: ${draft.stopLossPrice} | T: ${draft.targetPrice}`
      }, null, 2);

      await createReflection({
        title: `${draft.symbol} - ${draft.setupName}`,
        body: bodyPayload,
        tags: draft.tags.split(",").map(t => t.trim()).filter(Boolean),
        images: draft.images
      });

      setDraft({ 
        ...emptyDraft, 
        checklist: draft.checklist.map(c => ({...c, checked: false})) 
      });
      setStatusMessage("Trade recap saved successfully.");
    } catch (err) {
      console.error(err);
      setStatusMessage("Error saving trade.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Sections (Sub-components) ---

  const renderSectionSetup = () => (
    <div className="nr-card" key="setup">
      <div className="nr-card__header">:: Setup Details</div>
      <div className="nr-grid-2">
        <label className="nr-label">
          SYMBOL
          <input 
            className="nr-input font-mono" 
            placeholder="ES_F, BTCUSD" 
            value={draft.symbol}
            onChange={handleFieldChange("symbol")}
          />
        </label>
        <label className="nr-label">
          DIRECTION
          <div className="nr-toggle-group">
            {["long", "short"].map((dir) => (
              <button
                key={dir}
                type="button"
                className={`nr-toggle-btn ${draft.direction === dir ? "active" : ""}`}
                onClick={() => setDraft(p => ({ ...p, direction: dir as "long" | "short" }))}
              >
                {dir.toUpperCase()}
              </button>
            ))}
          </div>
        </label>
      </div>
      
      <label className="nr-label">
        CONFIDENCE ({draft.confidence}/10)
        <div className="nr-confidence-track">
          {CONFIDENCE_SCALE.map((num) => (
            <button
              key={num}
              type="button"
              className={`nr-conf-node ${draft.confidence === num ? "active" : ""}`}
              style={{ 
                borderColor: getConfidenceColor(num),
                backgroundColor: draft.confidence === num ? getConfidenceColor(num) : undefined,
                color: draft.confidence === num ? "#fff" : undefined
              }}
              onClick={() => setDraft(p => ({ ...p, confidence: num }))}
            >
              {num}
            </button>
          ))}
        </div>
      </label>
      <label className="nr-label">
        SETUP NAME
        <input 
          className="nr-input" 
          placeholder="e.g. AM Session Reversal" 
          value={draft.setupName}
          onChange={handleFieldChange("setupName")}
        />
      </label>
    </div>
  );

  const renderSectionExecution = () => (
    <div className="nr-card" key="execution">
      <div className="nr-card__header">:: Execution & Risk</div>
      <div className="nr-grid-2">
        <label className="nr-label">
          ENTRY PRICE
          <input 
            className="nr-input font-mono" 
            value={draft.entryPrice} onChange={handleFieldChange("entryPrice")} 
          />
        </label>
        <label className="nr-label">
          TARGET PRICE
           <div className="nr-input-group">
            <input 
              className="nr-input font-mono" 
              value={draft.targetPrice} onChange={handleFieldChange("targetPrice")} 
            />
            <select 
              className="nr-select-addon"
              value={draft.targetType}
              onChange={(e) => setDraft(p => ({ ...p, targetType: e.target.value }))}
            >
              {TARGET_TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </label>
      </div>
      <div className="nr-separator" />
      <label className="nr-label">
        STOP LOSS PRICE
        <input 
          className="nr-input font-mono" 
          value={draft.stopLossPrice} 
          onChange={handleFieldChange("stopLossPrice")}
          placeholder="Leave empty if no stop used"
        />
      </label>
      {draft.stopLossPrice && (
        <div className="nr-sub-options fade-in">
          <span className="nr-label-sm">STOP TYPE:</span>
          <div className="nr-chips">
            {(["structural", "emotional", "arbitrary"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={`nr-chip ${draft.stopLossType === type ? "active" : ""}`}
                onClick={() => setDraft(p => ({ ...p, stopLossType: type }))}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSectionOutcome = () => (
    <div className="nr-card" key="outcome">
      <div className="nr-card__header">:: Outcome</div>
      <div className="nr-outcome-grid">
        <button
          type="button"
          className={`nr-outcome-btn win ${draft.outcome === "win" ? "active" : ""}`}
          onClick={() => setDraft(p => ({ ...p, outcome: "win" }))}
        >
          WIN
        </button>
        <button
          type="button"
          className={`nr-outcome-btn loss ${draft.outcome === "loss" ? "active" : ""}`}
          onClick={() => setDraft(p => ({ ...p, outcome: "loss" }))}
        >
          LOSS
        </button>
        <button
          type="button"
          className={`nr-outcome-btn be ${draft.outcome === "break_even" ? "active" : ""}`}
          onClick={() => setDraft(p => ({ ...p, outcome: "break_even" }))}
        >
          STOPPED AT B/E
        </button>
      </div>
    </div>
  );

  const renderSectionEvidence = () => (
    <div className="nr-card" key="evidence">
      <div className="nr-card__header">:: Charts & Notes</div>
      <textarea 
        className="nr-textarea"
        rows={4}
        placeholder="Key thoughts, thesis, or improvements..."
        value={draft.notes}
        onChange={handleFieldChange("notes")}
      />
      <div className="nr-image-upload">
        <label className="nr-upload-btn">
          <span>+ Add Image ({draft.images.length}/5)</span>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} hidden />
        </label>
        <div className="nr-thumbnails">
          {draft.images.map(img => (
            <div key={img.name} className="nr-thumb">
              <img src={img.dataUrl} alt="thumb" />
              <button 
                type="button" 
                onClick={() => handleRemoveImage(img.name)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      <input 
        className="nr-input mt-2" 
        placeholder="Tags (comma separated)" 
        value={draft.tags}
        onChange={handleFieldChange("tags")}
      />
    </div>
  );

  // --- Map IDs to Render Functions ---
  const sectionRenderer: Record<string, () => JSX.Element> = {
    setup: renderSectionSetup,
    execution: renderSectionExecution,
    outcome: renderSectionOutcome,
    evidence: renderSectionEvidence
  };

  return (
    <form className="new-reflection" onSubmit={handleSave}>
      <header className="nr-header">
        <h2>ADD TRADE RECAP</h2>
        <span className="nr-date">{new Date().toLocaleDateString()}</span>
      </header>

      {/* SECTION 1: THE GATEKEEPER (Always Top) */}
      <section className="nr-section">
        <div className="nr-card checklist-card">
          <div className="nr-card__header">PRE-TRADE CHECKLIST</div>
          <ChecklistSnapshot
            items={draft.checklist}
            onToggle={(id) => setDraft(p => ({
              ...p,
              checklist: p.checklist.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
            }))}
          />
        </div>
      </section>

      {/* DYNAMIC SECTIONS: Render based on Settings order */}
      <div className={`nr-locked-content ${isChecklistComplete ? "unlocked" : "locked"}`}>
        {sectionOrder.map((section) => {
          if (!section.visible) return null;
          const renderer = sectionRenderer[section.id];
          return renderer ? renderer() : null;
        })}

        <footer className="nr-footer">
          <button 
            type="submit" 
            className="nr-save-btn" 
            disabled={isSaving || !isChecklistComplete}
          >
            {isSaving ? "SAVING..." : "SAVE TRADE RECAP"}
          </button>
          
          {statusMessage && (
            <div className={`nr-status ${statusMessage.includes("Error") ? "error" : "success"}`}>
              {statusMessage}
            </div>
          )}
        </footer>
      </div>
    </form>
  );
};