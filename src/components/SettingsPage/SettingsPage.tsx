import { useEffect, useMemo, useState } from "react";
import { ChecklistEditor } from "../ChecklistEditor/ChecklistEditor";
import {
  ReflectionQuestion,
  getReflectionQuestions,
  saveReflectionQuestions
} from "../../storage/reflectionQuestionsStore";
import { db } from "../../storage/db";
import "./SettingsPage.css";

const createId = () =>
  `question-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const SettingsPage = () => {
  const [questions, setQuestions] = useState<ReflectionQuestion[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const indexedDbVersion = useMemo(() => db.verno, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const template = await getReflectionQuestions();
        if (isMounted) {
          setQuestions(template);
        }
      } catch {
        if (isMounted) {
          setStatusMessage("Unable to load reflection questions.");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuestionChange = (
    id: string,
    field: "label" | "placeholder",
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id ? { ...question, [field]: value } : question
      )
    );
  };

  const handleAdd = () => {
    if (!newLabel.trim()) {
      return;
    }
    setQuestions((prev) => [
      ...prev,
      {
        id: createId(),
        label: newLabel.trim(),
        placeholder: newPlaceholder.trim() || "Add your answer"
      }
    ]);
    setNewLabel("");
    setNewPlaceholder("");
  };

  const handleRemove = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    setQuestions((prev) => {
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

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const trimmed = questions
        .map((question) => ({
          ...question,
          label: question.label.trim(),
          placeholder: question.placeholder.trim()
        }))
        .filter((question) => question.label && question.placeholder);
      await saveReflectionQuestions(trimmed);
      setStatusMessage("Reflection questions saved.");
    } catch {
      setStatusMessage("Unable to save reflection questions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      "This will permanently delete all local data. Continue?"
    );
    if (!confirmed) {
      return;
    }
    setIsClearing(true);
    setStatusMessage(null);
    try {
      await db.delete();
      setStatusMessage("Local data cleared. Reloading...");
      window.location.reload();
    } catch {
      setStatusMessage("Unable to clear local data.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <section className="settings-page">
      <header>
        <h2>Settings</h2>
        <p>Manage templates and local data for the extension.</p>
      </header>

      <div className="settings-page__section">
        <div className="settings-page__section-header">
          <h3>Reflection questions</h3>
          <button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save questions"}
          </button>
        </div>
        <div className="settings-page__questions">
          {questions.map((question, index) => (
            <div key={question.id} className="settings-page__question">
              <input
                type="text"
                value={question.label}
                placeholder="Question label"
                onChange={(event) =>
                  handleQuestionChange(question.id, "label", event.target.value)
                }
              />
              <input
                type="text"
                value={question.placeholder}
                placeholder="Placeholder"
                onChange={(event) =>
                  handleQuestionChange(
                    question.id,
                    "placeholder",
                    event.target.value
                  )
                }
              />
              <div className="settings-page__question-actions">
                <button type="button" onClick={() => handleMove(index, "up")}>
                  Up
                </button>
                <button type="button" onClick={() => handleMove(index, "down")}>
                  Down
                </button>
                <button type="button" onClick={() => handleRemove(question.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="settings-page__question-new">
          <input
            type="text"
            value={newLabel}
            placeholder="New question label"
            onChange={(event) => setNewLabel(event.target.value)}
          />
          <input
            type="text"
            value={newPlaceholder}
            placeholder="New question placeholder"
            onChange={(event) => setNewPlaceholder(event.target.value)}
          />
          <button type="button" onClick={handleAdd}>
            Add question
          </button>
        </div>
      </div>

      <div className="settings-page__section">
        <ChecklistEditor />
      </div>

      <div className="settings-page__section settings-page__danger">
        <div>
          <h3>Danger zone</h3>
          <p>Clear all local data stored in IndexedDB.</p>
        </div>
        <button type="button" onClick={handleClearData} disabled={isClearing}>
          {isClearing ? "Clearing..." : "Clear local data"}
        </button>
      </div>

      <footer className="settings-page__footer">
        <span>IndexedDB version: {indexedDbVersion}</span>
        {statusMessage ? <span>{statusMessage}</span> : null}
      </footer>
    </section>
  );
};
