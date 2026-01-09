import { useEffect, useState } from "react";
import {
  ChecklistTemplateItem,
  getChecklistTemplate,
  saveChecklistTemplate
} from "../../storage/checklistStore";
import "./ChecklistEditor.css";

const createId = () =>
  `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const ChecklistEditor = () => {
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const template = await getChecklistTemplate();
      if (isMounted) {
        setItems(template);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAdd = () => {
    if (!newItem.trim()) {
      return;
    }
    setItems((prev) => [...prev, { id: createId(), text: newItem.trim() }]);
    setNewItem("");
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    setItems((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) {
        return prev;
      }
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      return next;
    });
  };

  const handleItemChange = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: value } : item))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await saveChecklistTemplate(items.filter((item) => item.text.trim()));
      setStatusMessage("Checklist template saved.");
    } catch {
      setStatusMessage("Unable to save checklist template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="checklist-editor">
      <header>
        <h3>Checklist Template</h3>
        <p>Manage the reusable checklist items for new reflections.</p>
      </header>

      <div className="checklist-editor__list">
        {items.map((item, index) => (
          <div key={item.id} className="checklist-editor__item">
            <input
              type="text"
              value={item.text}
              onChange={(event) => handleItemChange(item.id, event.target.value)}
            />
            <div className="checklist-editor__actions">
              <button type="button" onClick={() => handleMove(index, "up")}>
                Up
              </button>
              <button type="button" onClick={() => handleMove(index, "down")}>
                Down
              </button>
              <button type="button" onClick={() => handleRemove(item.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="checklist-editor__new">
        <input
          type="text"
          value={newItem}
          placeholder="Add checklist item"
          onChange={(event) => setNewItem(event.target.value)}
        />
        <button type="button" onClick={handleAdd}>
          Add
        </button>
      </div>

      <footer className="checklist-editor__footer">
        <button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save template"}
        </button>
        {statusMessage ? <span>{statusMessage}</span> : null}
      </footer>
    </section>
  );
};
