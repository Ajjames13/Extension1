import { db, Reflection } from "./db";

// Helper interface for creation payload
interface CreatePayload {
  title: string;
  body: string;
  tags: string[];
  images?: Array<{ name: string; dataUrl: string }>;
}

export const createReflection = async (data: CreatePayload) => {
  const now = new Date().toISOString();
  
  // 1. Create the Reflection entry
  const id = await db.reflections.add({
    title: data.title,
    body: data.body,
    tags: data.tags,
    createdAt: now,
    updatedAt: now,
  } as Reflection);

  // 2. Handle Images (if provided and images table exists)
  if (data.images && data.images.length > 0) {
    try {
      const imageTable = db.table("images");
      if (imageTable) {
        await Promise.all(
          data.images.map((img) =>
            imageTable.add({
              reflectionId: id,
              name: img.name,
              dataUrl: img.dataUrl,
            })
          )
        );
      }
    } catch (e) {
      console.error("Failed to save images", e);
    }
  }

  return id;
};

export const updateReflection = async (id: number, updates: Partial<Reflection>) => {
  await db.reflections.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};

export const listReflections = async (): Promise<Reflection[]> => {
  return await db.reflections.orderBy("id").reverse().toArray();
};

export const deleteReflection = async (id: number): Promise<void> => {
  await db.transaction("rw", db.reflections, db.table("images"), async () => {
    await db.reflections.delete(id);
    // Try to delete associated images if table exists
    try {
      await db.table("images").where({ reflectionId: id }).delete();
    } catch (e) {
      // Ignore if image table issues
    }
  });
};

export const getReflection = async (id: number): Promise<Reflection | undefined> => {
  return await db.reflections.get(id);
};