import { useEffect, useState } from "react";
import { 
  getTargetTemplates, 
  saveTargetTemplates, 
  getSectionOrder, 
  saveSectionOrder,
  getDataSummary,
  SectionConfig,
  DEFAULT_TARGET_TEMPLATES 
} from "../../storage/settingsStore";
import { db } from "../../storage/db";
import { ChecklistEditor } from "../ChecklistEditor/ChecklistEditor";
import "./SettingsPage.css";

export const SettingsPage = () => {
  // --- State ---
  const [targetTemplates, setTargetTemplates] = useState<string[]>([]);
  const [newTemplate, setNewTemplate] = useState("");
  
  const [sectionOrder, setSectionOrder] = useState<SectionConfig[]>([]);
  
  const [dataStats, setDataStats] = useState<{ reflectionCount: number; imageCount: number } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // --- Load Initial Data ---
  useEffect(() => {
    getTargetTemplates().then(setTargetTemplates);
    getSectionOrder().then(setSectionOrder);
    getDataSummary().then(setDataStats);
  }, []);

  // --- Handlers: Target Templates ---
  
  const handleAddTemplate = () => {
    if (!newTemplate.trim()) return;
    const next = [...targetTemplates, newTemplate.trim()];
    setTargetTemplates(next);
    saveTargetTemplates(next);
    setNewTemplate("");
  };

  const handleRemoveTemplate = (index: number) => {
    const next = targetTemplates.filter((_, i) => i !== index);
    setTargetTemplates(next);
    saveTargetTemplates(next);
  };

  const handleResetTemplates = () => {
    setTargetTemplates(DEFAULT_TARGET_TEMPLATES);
    saveTargetTemplates(DEFAULT_TARGET_TEMPLATES);
  };

  // --- Handlers: Section Layout ---

  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...sectionOrder];
    if (direction === -1 && index > 0) {
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
    } else if (direction === 1 && index < next.length - 1) {
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
    }
    setSectionOrder(next);
    saveSectionOrder(next);
  };

  const toggleSectionVisibility = (index: number) => {
    const next = [...sectionOrder];
    next[index].visible = !next[index].visible;
    setSectionOrder(next);
    saveSectionOrder(next);
  };

  // --- Handlers: Data Danger Zone ---

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await db.delete();
      await db.open(); // Re-open to reset
      window.location.reload();
    } catch (e) {
      alert("Failed to clear data.");
      setIsClearing(false);
    }
  };

  return (
    <div className="settings-container">
      
      {/* 1. LAYOUT CONFIGURATION */}
      <section className="settings-card">
        <div className="card-header">
          <h3>EXTENSION LAYOUT</h3>
          <p>Reorder or hide sections in the "Add Trade" popup.</p>
        </div>
        <div className="layout-list">
          {sectionOrder.map((section, idx) => (
            <div key={section.id} className={`layout-item ${!section.visible ? "hidden" : ""}`}>
              <div className="layout-info">
                <span className="layout-name">{section.label}</span>
                <span className="layout-status">{section.visible ? "VISIBLE" : "HIDDEN"}</span>
              </div>
              <div className="layout-actions">
                <button 
                  onClick={() => toggleSectionVisibility(idx)} 
                  className="icon-btn"
                  title="Toggle Visibility"
                >
                  {section.visible ? "👁️" : "🚫"}
                </button>
                <div className="move-btns">
                  <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}>▲</button>
                  <button onClick={() => moveSection(idx, 1)} disabled={idx === sectionOrder.length - 1}>▼</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. TARGET TEMPLATES */}
      <section className="settings-card">
        <div className="card-header">
          <h3>TARGET TEMPLATES</h3>
          <p>Customize the dropdown options for trade targets.</p>
        </div>
        <div className="template-manager">
          <div className="template-input-row">
            <input 
              type="text" 
              placeholder="e.g. 2.0 Standard Deviation"
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
            />
            <button className="add-btn" onClick={handleAddTemplate}>ADD</button>
          </div>
          <div className="template-chips">
            {targetTemplates.map((t, idx) => (
              <span key={`${t}-${idx}`} className="chip">
                {t}
                <button onClick={() => handleRemoveTemplate(idx)}>×</button>
              </span>
            ))}
          </div>
          <button className="text-btn" onClick={handleResetTemplates}>Reset to Defaults</button>
        </div>
      </section>

      {/* 3. CHECKLIST EDITOR (Existing Component) */}
      <section className="settings-card">
        <div className="card-header">
          <h3>PRE-TRADE CHECKLIST</h3>
          <p>Define the rules you must acknowledge before every trade.</p>
        </div>
        <div className="checklist-wrapper">
          <ChecklistEditor />
        </div>
      </section>

      {/* 4. DANGER ZONE */}
      <section className="settings-card danger">
        <div className="card-header">
          <h3>CLEAR LOCAL DATA</h3>
          <p>Permanently delete all trades, images, and settings.</p>
        </div>
        <div className="danger-actions">
          <button className="danger-btn" onClick={() => setShowDeleteModal(true)}>
            CLEAR ALL DATA
          </button>
        </div>
      </section>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-danger">
            <h2>⚠️ ARE YOU SURE?</h2>
            <p>This action cannot be undone. You are about to delete:</p>
            <ul className="stats-list">
              <li><strong>{dataStats?.reflectionCount || 0}</strong> Trade Recaps</li>
              <li><strong>{dataStats?.imageCount || 0}</strong> Stored Images</li>
              <li>All Custom Settings & Templates</li>
            </ul>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>CANCEL</button>
              <button className="confirm-delete-btn" onClick={handleClearAllData} disabled={isClearing}>
                {isClearing ? "DELETING..." : "YES, DELETE EVERYTHING"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};