import { useEffect, useMemo, useState } from "react";
import { createReflection } from "../../storage/reflectionStore";
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
  prices: string;
  setupName: string;
  outcome: string;
  confidence: string;
  tags: string;
  questions: Record<string, string>;
  images: Array<{ name: string; dataUrl: string }>;
};

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

const emptyDraft: DraftState = {
  instrument: "",
  timeframe: "",
  direction: "",
  prices: "",
  setupName: "",
  outcome: "",
  confidence: "",
  tags: "",
  questions: questionTemplate.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = "";
    return acc;
  }, {}),
  images: []
};

let cachedDraft: DraftState | null = null;

const buildBody = (draft: DraftState) => {
  return JSON.stringify(
    {
      instrument: draft.instrument,
      timeframe: draft.timeframe,
      direction: draft.direction,
      prices: draft.prices,
      setupName: draft.setupName,
      outcome: draft.outcome,
      confidence: draft.confidence,
      tags: draft.tags,
      questions: draft.questions
    },
    null,
    2
  );
};

export const NewReflection = () => {
  const [draft, setDraft] = useState<DraftState>(() => cachedDraft ?? emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
        questions: {
          ...prev.questions,
          [id]: value
        }
      }));
    };
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const availableSlots = Math.max(0, 5 - draft.images.length);
    const nextFiles = files.slice(0, availableSlots);

    Promise.all(
      nextFiles.map(
        (file) =>
          new Promise<{ name: string; dataUrl: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({ name: file.name, dataUrl: reader.result as string });
            };
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
      .catch(() => {
        setStatusMessage("Unable to read one of the selected images.");
      })
      .finally(() => {
        event.target.value = "";
      });
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
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        images: draft.images.map((image) => ({
          name: image.name,
          dataUrl: image.dataUrl
        }))
      });

      setDraft(emptyDraft);
      setStatusMessage("Reflection saved.");
    } catch (error) {
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

      <section className="new-reflection__section">
        <label>
          Instrument *
          <input
            type="text"
            name="instrument"
            value={draft.instrument}
            onChange={handleFieldChange("instrument")}
            required
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
          Prices
          <input
            type="text"
            name="prices"
            value={draft.prices}
            onChange={handleFieldChange("prices")}
            placeholder="Entry, stop, target"
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
          Confidence *
          <input
            type="text"
            name="confidence"
            value={draft.confidence}
            onChange={handleFieldChange("confidence")}
            required
          />
        </label>
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
          {questionTemplate.map((question) => (
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
    </form>
  );
};
