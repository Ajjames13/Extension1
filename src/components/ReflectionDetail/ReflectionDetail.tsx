import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteReflection,
  getReflection,
  updateReflection
} from "../../storage/reflectionStore";
import type { Image, Reflection } from "../../storage/db";
import "./ReflectionDetail.css";

type ReflectionPayload = {
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
  tags: string[];
  notes: string;
  questions: Record<string, string>;
};

const defaultPayload: ReflectionPayload = {
  instrument: "",
  timeframe: "",
  direction: "",
  entryPrice: "",
  exitPrice: "",
  quantity: "",
  prices: "",
  setupName: "",
  outcome: "",
  pnl: "",
  confidence: "",
  tags: [],
  notes: "",
  questions: {}
};

const normalizeTags = (tags: ReflectionPayload["tags"] | string): string[] => {
  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const parseBody = (body: string): ReflectionPayload => {
  try {
    const parsed = JSON.parse(body) as Partial<ReflectionPayload>;
    return {
      instrument: parsed.instrument ?? "",
      timeframe: parsed.timeframe ?? "",
      direction: parsed.direction ?? "",
      entryPrice: parsed.entryPrice ?? "",
      exitPrice: parsed.exitPrice ?? "",
      quantity: parsed.quantity ?? "",
      prices: parsed.prices ?? "",
      setupName: parsed.setupName ?? "",
      outcome: parsed.outcome ?? "",
      pnl: parsed.pnl ?? "",
      confidence: parsed.confidence ?? "",
      tags: parsed.tags ? normalizeTags(parsed.tags) : [],
      notes: parsed.notes ?? "",
      questions: parsed.questions ?? {}
    };
  } catch {
    return { ...defaultPayload };
  }
};

const serializeBody = (payload: ReflectionPayload) =>
  JSON.stringify(
    {
      instrument: payload.instrument,
      timeframe: payload.timeframe,
      direction: payload.direction,
      entryPrice: payload.entryPrice,
      exitPrice: payload.exitPrice,
      quantity: payload.quantity,
      prices: payload.prices,
      setupName: payload.setupName,
      outcome: payload.outcome,
      pnl: payload.pnl,
      confidence: payload.confidence,
      tags: payload.tags,
      notes: payload.notes,
      questions: payload.questions
    },
    null,
    2
  );

export type ReflectionDetailProps = {
  reflectionId: number;
};

export const ReflectionDetail = ({ reflectionId }: ReflectionDetailProps) => {
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [draft, setDraft] = useState<ReflectionPayload | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReflection = useCallback(async () => {
    setStatusMessage(null);
    try {
      const result = await getReflection(reflectionId);
      if (!result) {
        setStatusMessage("Reflection not found.");
        setReflection(null);
        setImages([]);
        setDraft(null);
        return;
      }

      setReflection(result.reflection);
      setImages(result.images);
      const parsed = parseBody(result.reflection.body);
      setDraft({
        ...parsed,
        tags: result.reflection.tags ?? parsed.tags
      });
    } catch {
      setStatusMessage("Unable to load reflection.");
    }
  }, [reflectionId]);

  useEffect(() => {
    loadReflection();
  }, [loadReflection]);

  const questionEntries = useMemo(() => {
    return Object.entries(draft?.questions ?? {});
  }, [draft]);

  const handleFieldChange = (field: keyof ReflectionPayload) => {
    return (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLSelectElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      if (!draft) {
        return;
      }
      setDraft({
        ...draft,
        [field]: event.target.value
      });
    };
  };

  const handleTagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!draft) {
      return;
    }
    const value = event.target.value;
    setDraft({
      ...draft,
      tags: value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    });
  };

  const handleQuestionChange = (key: string) => {
    return (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!draft) {
        return;
      }
      setDraft({
        ...draft,
        questions: {
          ...draft.questions,
          [key]: event.target.value
        }
      });
    };
  };

  const handleSave = async () => {
    if (!reflection || !draft) {
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated = await updateReflection(reflection.id as number, {
        title: draft.setupName || reflection.title,
        body: serializeBody(draft),
        tags: draft.tags
      });

      if (updated) {
        setReflection(updated);
        setIsEditing(false);
        setStatusMessage("Reflection updated.");
      } else {
        setStatusMessage("Unable to update reflection.");
      }
    } catch {
      setStatusMessage("Unable to update reflection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!reflection) {
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to delete this reflection?"
    );
    if (!confirmed) {
      return;
    }
    setIsDeleting(true);
    setStatusMessage(null);
    try {
      await deleteReflection(reflection.id as number);
      setReflection(null);
      setDraft(null);
      setImages([]);
      setStatusMessage("Reflection deleted.");
    } catch {
      setStatusMessage("Unable to delete reflection.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!reflection || !draft) {
    return (
      <section className="reflection-detail">
        <h2>Reflection Detail</h2>
        <p>{statusMessage ?? "Loading reflection..."}</p>
      </section>
    );
  }

  return (
    <section className="reflection-detail">
      <header className="reflection-detail__header">
        <div>
          <h2>{draft.setupName || reflection.title || "Reflection"}</h2>
          <p>
            {draft.instrument} · {draft.timeframe} · {draft.direction}
          </p>
        </div>
        <div className="reflection-detail__actions">
          <button type="button" onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? "Cancel edit" : "Edit"}
          </button>
          <button type="button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </header>

      {statusMessage ? (
        <p className="reflection-detail__status">{statusMessage}</p>
      ) : null}

      <div className="reflection-detail__grid">
        <label>
          Setup name
          <input
            type="text"
            value={draft.setupName}
            onChange={handleFieldChange("setupName")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Instrument
          <input
            type="text"
            value={draft.instrument}
            onChange={handleFieldChange("instrument")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Timeframe
          <input
            type="text"
            value={draft.timeframe}
            onChange={handleFieldChange("timeframe")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Direction
          <select
            value={draft.direction}
            onChange={handleFieldChange("direction")}
            disabled={!isEditing}
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
            value={draft.quantity}
            onChange={handleFieldChange("quantity")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Entry Price
          <input
            type="number"
            step="any"
            value={draft.entryPrice}
            onChange={handleFieldChange("entryPrice")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Exit Price
          <input
            type="number"
            step="any"
            value={draft.exitPrice}
            onChange={handleFieldChange("exitPrice")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Planned Prices
          <input
            type="text"
            value={draft.prices}
            onChange={handleFieldChange("prices")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Outcome
          <input
            type="text"
            value={draft.outcome}
            onChange={handleFieldChange("outcome")}
            disabled={!isEditing}
          />
        </label>
        <label>
          PnL ($)
          <input
            type="text"
            value={draft.pnl}
            onChange={handleFieldChange("pnl")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Confidence
          <input
            type="text"
            value={draft.confidence}
            onChange={handleFieldChange("confidence")}
            disabled={!isEditing}
          />
        </label>
        <label>
          Tags
          <input
            type="text"
            value={draft.tags.join(", ")}
            onChange={handleTagChange}
            disabled={!isEditing}
          />
        </label>
      </div>

      <section className="reflection-detail__notes">
        <label>
          Notes
          <textarea
            value={draft.notes}
            onChange={handleFieldChange("notes")}
            rows={4}
            disabled={!isEditing}
          />
        </label>
      </section>

      <section className="reflection-detail__questions">
        <h3>Reflection answers</h3>
        {questionEntries.length === 0 ? (
          <p>No answers captured.</p>
        ) : (
          questionEntries.map(([key, value]) => (
            <label key={key}>
              {key}
              <textarea
                value={value}
                onChange={handleQuestionChange(key)}
                rows={3}
                disabled={!isEditing}
              />
            </label>
          ))
        )}
      </section>

      <section className="reflection-detail__gallery">
        <h3>Images</h3>
        {images.length === 0 ? (
          <p>No images uploaded.</p>
        ) : (
          <div className="reflection-detail__images">
            {images.map((image) => (
              <figure key={image.id}>
                <img src={image.dataUrl} alt={image.name} />
                <figcaption>{image.name}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {isEditing ? (
        <footer className="reflection-detail__footer">
          <button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save updates"}
          </button>
        </footer>
      ) : null}
    </section>
  );
};