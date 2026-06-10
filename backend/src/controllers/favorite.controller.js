import { and, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { favoriteTable } from '../db/schema.js';

export const createFavorite = async (req, res) => {
  const { userId, recipeId, title, image, cookTime, servings } = req.body;
  if (!userId || !recipeId || !title) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const newFavorite = await db
    .insert(favoriteTable)
    .values({
      userId,
      recipeId,
      title,
      image,
      cookTime,
      servings,
    })
    .returning();
  res.status(201).json(newFavorite[0]);
};

export const getFavorites = async (req, res) => {
  const { userId } = req.params;
  const favorites = await db
    .select()
    .from(favoriteTable)
    .where(eq(favoriteTable.userId, userId));
  res.status(200).json(favorites);
};

export const deleteFavorite = async (req, res) => {
  const { userId, recipeId } = req.params;
  const deletedFavorite = await db
    .delete(favoriteTable)
    .where(
      and(
        eq(favoriteTable.userId, userId),
        eq(favoriteTable.recipeId, parseInt(recipeId)),
      ),
    )
    .returning();
  res.status(200).json(deletedFavorite[0]);
};

