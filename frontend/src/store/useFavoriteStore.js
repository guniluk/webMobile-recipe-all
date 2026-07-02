import { create } from "zustand";

const API_URL = import.meta.env.VITE_API_URL;
// const API_URL = "https://webmobile-recipe.onrender.com/api";

export const useFavoriteStore = create((set, get) => ({
  favorites: [],
  loading: false,

  fetchFavorites: async (userId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const response = await fetch(`${API_URL}/favorites/${userId}`);
      if (response.ok) {
        const data = await response.json();
        set({ favorites: data || [] });
      } else {
        console.error("Failed to fetch favorites");
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      set({ loading: false });
    }
  },

  addFavorite: async (userId, recipe) => {
    if (!userId || !recipe) return;
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          recipeId: parseInt(recipe.id),
          title: recipe.title,
          image: recipe.imageUrl,
          cookTime: recipe.cookTime || "30m",
          servings: recipe.servings?.toString() || "4",
        }),
      });
      if (response.ok) {
        const newFav = {
          userId,
          recipeId: parseInt(recipe.id),
          title: recipe.title,
          image: recipe.imageUrl,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
        };
        set((state) => ({ favorites: [...state.favorites, newFav] }));
        return true;
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
    return false;
  },

  removeFavorite: async (userId, recipeId) => {
    if (!userId) return;
    try {
      const response = await fetch(
        `${API_URL}/favorites/${userId}/${recipeId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        set((state) => ({
          favorites: state.favorites.filter(
            (fav) => fav.recipeId !== parseInt(recipeId),
          ),
        }));
        return true;
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
    return false;
  },

  isFavorite: (recipeId) => {
    return get().favorites.some((fav) => fav.recipeId === parseInt(recipeId));
  },
}));
