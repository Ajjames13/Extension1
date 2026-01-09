import { db, Image, Reflection, Setting } from "./db";

type NewReflection = {
  title: string;
  body: string;
  tags?: string[];
  images?: Array<Pick<Image, "name" | "dataUrl">>;
};

type ReflectionFilters = {
  query?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export type ReflectionWithImages = {
  reflection: Reflection;
  images: Image[];
};

const nowIso = () => new Date().toISOString();

export const createReflection = async (
  input: NewReflection
): Promise<ReflectionWithImages> => {
  const timestamp = nowIso();

  return db.transaction("rw", db.reflections, db.images, async () => {
    const reflectionId = await db.reflections.add({
      title: input.title,
      body: input.body,
      tags: input.tags,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    const images: Image[] = [];
    if (input.images?.length) {
      const payload = input.images.map((image) => ({
        reflectionId,
        name: image.name,
        dataUrl: image.dataUrl,
        createdAt: timestamp
      }));

      const ids = await db.images.bulkAdd(payload, { allKeys: true });
      ids.forEach((id, index) => {
        images.push({
          id: id as number,
          ...payload[index]
        });
      });
    }

    const reflection: Reflection = {
      id: reflectionId,
      title: input.title,
      body: input.body,
      tags: input.tags,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    return { reflection, images };
  });
};

export const updateReflection = async (
  id: number,
  updates: Partial<Pick<Reflection, "title" | "body" | "tags">>
): Promise<Reflection | null> => {
  const existing = await db.reflections.get(id);
  if (!existing) {
    return null;
  }

  const updatedAt = nowIso();
  const nextReflection = {
    ...existing,
    ...updates,
    updatedAt
  };

  await db.reflections.update(id, {
    title: nextReflection.title,
    body: nextReflection.body,
    tags: nextReflection.tags,
    updatedAt
  });

  return nextReflection;
};

export const deleteReflection = async (id: number): Promise<void> => {
  await db.transaction("rw", db.reflections, db.images, async () => {
    await db.images.where("reflectionId").equals(id).delete();
    await db.reflections.delete(id);
  });
};

export const getReflection = async (
  id: number
): Promise<ReflectionWithImages | null> => {
  const reflection = await db.reflections.get(id);
  if (!reflection) {
    return null;
  }

  const images = await db.images.where("reflectionId").equals(id).toArray();
  return { reflection, images };
};

export const listReflections = async (
  filters: ReflectionFilters = {}
): Promise<Reflection[]> => {
  const reflections = await db.reflections.orderBy("createdAt").reverse().toArray();

  let result = reflections;

  if (filters.query) {
    const query = filters.query.toLowerCase();
    result = result.filter((reflection) =>
      `${reflection.title} ${reflection.body}`.toLowerCase().includes(query)
    );
  }

  if (filters.tag) {
    result = result.filter((reflection) =>
      reflection.tags?.includes(filters.tag as string)
    );
  }

  if (filters.startDate) {
    result = result.filter(
      (reflection) => reflection.createdAt >= filters.startDate
    );
  }

  if (filters.endDate) {
    result = result.filter(
      (reflection) => reflection.createdAt <= filters.endDate
    );
  }

  if (filters.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
};

export const exportAllData = async (): Promise<{
  reflections: Reflection[];
  images: Image[];
  settings: Setting[];
}> => {
  const [reflections, images, settings] = await Promise.all([
    db.reflections.toArray(),
    db.images.toArray(),
    db.settings.toArray()
  ]);

  return { reflections, images, settings };
};
