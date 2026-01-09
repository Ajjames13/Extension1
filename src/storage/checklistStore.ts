import { db, Setting } from "./db";

export type ChecklistTemplateItem = {
  id: string;
  text: string;
};

const SETTINGS_KEY = "checklistTemplate";

const defaultTemplate: ChecklistTemplateItem[] = [
  { id: "plan", text: "Plan the trade" },
  { id: "risk", text: "Define risk" },
  { id: "confirm", text: "Confirm setup" }
];

const parseTemplate = (value?: string | null): ChecklistTemplateItem[] => {
  if (!value) {
    return defaultTemplate;
  }

  try {
    const parsed = JSON.parse(value) as ChecklistTemplateItem[];
    if (Array.isArray(parsed) && parsed.every((item) => item.id && item.text)) {
      return parsed;
    }
    return defaultTemplate;
  } catch {
    return defaultTemplate;
  }
};

export const getChecklistTemplate = async (): Promise<ChecklistTemplateItem[]> => {
  const setting = await db.settings.get(SETTINGS_KEY);
  return parseTemplate(setting?.value);
};

export const saveChecklistTemplate = async (
  items: ChecklistTemplateItem[]
): Promise<Setting> => {
  const updatedAt = new Date().toISOString();
  const value = JSON.stringify(items);
  await db.settings.put({ key: SETTINGS_KEY, value, updatedAt });
  return { key: SETTINGS_KEY, value, updatedAt };
};
