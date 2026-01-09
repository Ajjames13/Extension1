import React from "react";
import "./ChecklistSnapshot.css";

export type ChecklistSnapshotItem = {
  id: string;
  text: string;
  checked: boolean;
};

export type ChecklistSnapshotProps = {
  items: ChecklistSnapshotItem[];
  onToggle?: (id: string) => void;
  readonly?: boolean; // Added this prop
};

export const ChecklistSnapshot: React.FC<ChecklistSnapshotProps> = ({
  items,
  onToggle,
  readonly = false,
}) => {
  return (
    <div className={`checklist-snapshot ${readonly ? "readonly" : ""}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`checklist-item ${item.checked ? "checked" : ""}`}
          onClick={() => !readonly && onToggle && onToggle(item.id)}
        >
          <div className="checkbox-box">
            {item.checked && <span>✓</span>}
          </div>
          <span className="item-text">{item.text}</span>
        </div>
      ))}
    </div>
  );
};