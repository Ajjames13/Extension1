import "./ChecklistSnapshot.css";

export type ChecklistSnapshotItem = {
  id: string;
  text: string;
  checked: boolean;
};

export type ChecklistSnapshotProps = {
  items: ChecklistSnapshotItem[];
  onToggle?: (id: string) => void;
};

export const ChecklistSnapshot = ({
  items,
  onToggle
}: ChecklistSnapshotProps) => {
  return (
    <section className="checklist-snapshot">
      <h3>Checklist</h3>
      {items.length === 0 ? (
        <p>No checklist items added.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <label>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => onToggle?.(item.id)}
                />
                <span>{item.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
