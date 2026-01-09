import { db } from "./db";

// Default configuration if nothing is saved
export const DEFAULT_TARGET_TEMPLATES = [
  "Manual",
  "Resting Liquidity",
  "Next FVG",
  "Measured Move",
  "Previous High/Low"
];

export const DEFAULT_SECTION_ORDER = [
  { id: "setup", label: "Setup Details", visible: true },
  { id: "execution", label: "Execution & Risk", visible: true },
  { id: "outcome", label: "Outcome", visible: true },
  { id: "evidence", label: "Charts & Notes", visible: true }
];

export type SectionConfig = typeof DEFAULT_SECTION_ORDER[0];

// --- API ---

export const getTargetTemplates = async (): Promise<string[]> => {
  // Use "key" (matches db.ts schema) instead of "id"
  const setting = await db.settings.get("targetTemplates");
  
  // FIX: Parse the string back into an array
  if (setting && setting.value) {
    try {
      return JSON.parse(setting.value);
    } catch {
      return DEFAULT_TARGET_TEMPLATES;
    }
  }
  return DEFAULT_TARGET_TEMPLATES;
};

export const saveTargetTemplates = async (templates: string[]) => {
  // FIX: Stringify the array before saving and use "key"
  await db.settings.put({ 
    key: "targetTemplates", 
    value: JSON.stringify(templates),
    updatedAt: new Date().toISOString()
  });
};

export const getSectionOrder = async (): Promise<SectionConfig[]> => {
  const setting = await db.settings.get("sectionOrder");
  
  // FIX: Parse the string back into an array
  if (setting && setting.value) {
    try {
      return JSON.parse(setting.value);
    } catch {
      return DEFAULT_SECTION_ORDER;
    }
  }
  return DEFAULT_SECTION_ORDER;
};

export const saveSectionOrder = async (order: SectionConfig[]) => {
  // FIX: Stringify the array before saving and use "key"
  await db.settings.put({ 
    key: "sectionOrder", 
    value: JSON.stringify(order),
    updatedAt: new Date().toISOString()
  });
};

export const getDataSummary = async () => {
  const [reflectionCount, imageCount] = await Promise.all([
    db.reflections.count(),
    db.images.count()
  ]);
  return { reflectionCount, imageCount };
};