const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

// Cache store to minimize redundant network requests and improve performance
const cache = {
  meals: new Map(),
  categories: null,
  categoryFilters: new Map(),
  searches: new Map(),
  ingredients: new Map(),
};

// Helper function to check if the meal has a valid image URL
const hasImage = (meal) => meal && typeof meal.strMealThumb === 'string' && meal.strMealThumb.trim() !== "";

export const MealAPI = {
  //search meal by name
  searchMealByName: async (query) => {
    try {
      if (!query) {
        throw new Error("Query is required");
      }
      const trimmedQuery = query.trim().toLowerCase();
      if (cache.searches.has(trimmedQuery)) {
        return cache.searches.get(trimmedQuery);
      }

      const response = await fetch(
        `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const meals = (data.meals || []).filter(hasImage);
      cache.searches.set(trimmedQuery, meals);
      
      // Also cache individual meals for fast lookup
      meals.forEach((meal) => {
        if (meal.idMeal) {
          cache.meals.set(meal.idMeal, meal);
        }
      });

      return meals;
    } catch (error) {
      console.log(error);
      return [];
    }
  },

  //look full meal details by id
  getMealById: async (id) => {
    try {
      if (!id) {
        throw new Error("ID is required");
      }
      const stringId = id.toString();
      if (cache.meals.has(stringId)) {
        return cache.meals.get(stringId);
      }

      const response = await fetch(`${BASE_URL}/lookup.php?i=${stringId}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const meal = data.meals ? data.meals[0] : null;
      if (meal) {
        cache.meals.set(stringId, meal);
      }
      return meal;
    } catch (error) {
      console.log(error);
      return null;
    }
  },

  //look up a random single meal
  getRandomMeal: async () => {
    try {
      const response = await fetch(`${BASE_URL}/random.php`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const meal = data.meals ? data.meals[0] : null;
      if (meal && hasImage(meal)) {
        if (meal.idMeal) {
          // Cache the random meal detail as well
          cache.meals.set(meal.idMeal.toString(), meal);
        }
        return meal;
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  },

  //get multiple random meals
  getRandomMeals: async (count = 6) => {
    try {
      // Choose a random letter to fetch a list of meals with a single request
      const letters = "abcdefgiklmnprstvy";
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      
      const response = await fetch(`${BASE_URL}/search.php?f=${randomLetter}`);
      if (!response.ok) {
        throw new Error("Failed to fetch by letter");
      }
      const data = await response.json();
      let meals = (data.meals || []).filter(hasImage);
      
      // Fallback if no meals found for the letter
      if (meals.length === 0) {
        const fallbackRes = await fetch(`${BASE_URL}/search.php?s=`);
        const fallbackData = await fallbackRes.json();
        meals = (fallbackData.meals || []).filter(hasImage);
      }

      // If we don't have enough meals, fallback to fetching single random meals in parallel (original behavior)
      if (meals.length < count) {
        const promises = Array(count)
          .fill()
          .map(() => MealAPI.getRandomMeal());
        const results = await Promise.all(promises);
        return results.filter((meal) => meal !== null);
      }

      // Shuffle and take 'count' meals
      const shuffled = [...meals].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } catch (error) {
      console.error("Error in getRandomMeals:", error);
      // Absolute fallback: run original parallel fetches
      try {
        const promises = Array(count)
          .fill()
          .map(() => MealAPI.getRandomMeal());
        const results = await Promise.all(promises);
        return results.filter((meal) => meal !== null);
      } catch (innerError) {
        console.error(innerError);
        return [];
      }
    }
  },

  //list all meal categories
  getCategories: async () => {
    try {
      if (cache.categories) {
        return cache.categories;
      }
      const response = await fetch(`${BASE_URL}/categories.php`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const categories = data.categories || [];
      cache.categories = categories;
      return categories;
    } catch (error) {
      console.log(error);
      return [];
    }
  },

  //filter by main ingredient
  filterByIngredient: async (ingredient) => {
    try {
      if (!ingredient) {
        throw new Error("Ingredient is required");
      }
      const trimmedKey = ingredient.trim().toLowerCase();
      if (cache.ingredients.has(trimmedKey)) {
        return cache.ingredients.get(trimmedKey);
      }

      const response = await fetch(
        `${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`,
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const meals = (data.meals || []).filter(hasImage);
      cache.ingredients.set(trimmedKey, meals);
      return meals;
    } catch (error) {
      console.log(error);
      return [];
    }
  },

  //filter by category
  filterByCategory: async (category) => {
    try {
      if (!category) {
        throw new Error("Category is required");
      }
      const trimmedKey = category.trim().toLowerCase();
      if (cache.categoryFilters.has(trimmedKey)) {
        return cache.categoryFilters.get(trimmedKey);
      }

      const response = await fetch(
        `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`,
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const meals = (data.meals || []).filter(hasImage);
      cache.categoryFilters.set(trimmedKey, meals);
      return meals;
    } catch (error) {
      console.log(error);
      return [];
    }
  },

  //transform TheMealDB meal data to our app format
  transformMealData: (meal) => {
    if (!meal) return null;
    // Loop 1-20 for ingredients and measures
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      // Only add if both exist
      if (ingredient && ingredient.trim()) {
        const measureText =
          measure && measure.trim() ? `${measure.trim()}` : "";
        ingredients.push(`${measureText} ${ingredient.trim()}`);
      }
    }
    //extract instruction
    const instructions = meal.strInstructions
      ? meal.strInstructions
          .split("\r\n")
          .map((step) => step.trim())
          .filter((step) => step.length > 0)
      : [];

    // Fallback description based on instruction or standard string
    const fallbackDesc = meal.strInstructions 
      ? meal.strInstructions.replace(/[\r\n]+/g, ' ').substring(0, 120) + "..."
      : "Delicious meal from TheMealDB";

    return {
      id: meal.idMeal,
      title: meal.strMeal,
      description: meal.strDescription 
        ? meal.strDescription.substring(0, 120) + "..." 
        : fallbackDesc,
      imageUrl: meal.strMealThumb,
      cookTime: "30 minutes",
      servings: 4,
      category: meal.strCategory || "main course",
      area: meal.strArea,
      ingredients,
      instructions,
      originalData: meal,
    };
  },
};

