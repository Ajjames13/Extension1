import { db, Setting } from "./db";

export type ReflectionQuestion = {
  id: string;
  label: string;
  placeholder: string;
};

const SETTINGS_KEY = "reflectionQuestions";

const defaultQuestions: ReflectionQuestion[] = [
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

const parseQuestions = (value?: string | null): ReflectionQuestion[] => {
  if (!value) {
    return defaultQuestions;
  }

  try {
    const parsed = JSON.parse(value) as ReflectionQuestion[];
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => item.id && item.label && item.placeholder)
    ) {
      return parsed;
    }
    return defaultQuestions;
  } catch {
    return defaultQuestions;
  }
};

export const getReflectionQuestions = async (): Promise<ReflectionQuestion[]> => {
  const setting = await db.settings.get(SETTINGS_KEY);
  return parseQuestions(setting?.value);
};

export const saveReflectionQuestions = async (
  questions: ReflectionQuestion[]
): Promise<Setting> => {
  const updatedAt = new Date().toISOString();
  const value = JSON.stringify(questions);
  await db.settings.put({ key: SETTINGS_KEY, value, updatedAt });
  return { key: SETTINGS_KEY, value, updatedAt };
};
