import Dexie, { Table } from "dexie";

export type Reflection = {
  id?: number;
  title: string;
  body: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export type Image = {
  id?: number;
  reflectionId: number;
  name: string;
  dataUrl: string;
  createdAt: string;
};

export type Setting = {
  key: string;
  value: string;
  updatedAt: string;
};

class ExtensionDatabase extends Dexie {
  reflections!: Table<Reflection, number>;
  images!: Table<Image, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super("extension1");
    this.version(1).stores({
      reflections: "++id, createdAt, updatedAt, title",
      images: "++id, reflectionId, createdAt",
      settings: "key, updatedAt"
    });
  }
}

export const db = new ExtensionDatabase();
