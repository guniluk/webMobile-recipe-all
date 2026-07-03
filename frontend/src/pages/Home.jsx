import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { MealAPI } from "../services/mealAPI";
import RecipeCard from "../components/RecipeCard";
import LatestRecipe from "../components/LatestRecipe";
import { RefreshCw, ChefHat, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const { user } = useUser();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [latestRecipe, setLatestRecipe] = useState(null);
  const [allRecipes, setAllRecipes] = useState([]);
  const [displayedRecipes, setDisplayedRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollContainerRef = useRef(null);

  // Scroll categories left or right
  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 1. Initial Data Load
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const apiCategories = await MealAPI.getCategories();
      const mappedCategories = apiCategories.map((cat) => ({
        id: cat.strCategory.toLowerCase(),
        name: cat.strCategory,
        image: cat.strCategoryThumb,
      }));
      setCategories(mappedCategories);

      if (mappedCategories.length > 0) {
        setSelectedCategory(mappedCategories[0].id);
      }

      // Latest random recipe
      const randomMeal = await MealAPI.getRandomMeal();
      if (randomMeal) {
        const transformed = MealAPI.transformMealData(randomMeal);
        setLatestRecipe({
          id: transformed.id,
          title: transformed.title,
          time: "25m",
          servings: "2 Servings",
          image: transformed.imageUrl,
          area:
            transformed.area && transformed.area !== "Unknown"
              ? transformed.area
              : "Anywhere",
        });
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitialData();
  }, [fetchInitialData]);

  // 2. Fetch Recipes by Category
  const fetchRecipes = useCallback(async () => {
    if (!selectedCategory || categories.length === 0) return;

    try {
      setRecipesLoading(true);
      setDisplayedRecipes([]);
      setLoadingMore(false);

      const currentCat = categories.find((cat) => cat.id === selectedCategory);
      if (!currentCat) {
        setRecipesLoading(false);
        return;
      }

      const meals = await MealAPI.filterByCategory(currentCat.name);
      const formattedRecipes = meals.map((meal) => ({
        id: meal.idMeal,
        title: meal.strMeal,
        image: meal.strMealThumb,
        time: "30m",
        servings: "4",
        area: null,
      }));

      setAllRecipes(formattedRecipes);

      // Fetch detail (area info) for the first 8 recipes in web (web shows more items than mobile)
      const initialBatch = formattedRecipes.slice(0, 8);
      const detailedBatch = await Promise.all(
        initialBatch.map(async (recipe) => {
          const detail = await MealAPI.getMealById(recipe.id);
          return {
            ...recipe,
            description: detail?.strInstructions
              ? detail.strInstructions
                  .replace(/[\r\n]+/g, " ")
                  .substring(0, 80) + "..."
              : "Delicious meal from TheMealDB",
            area:
              detail && detail.strArea && detail.strArea !== "Unknown"
                ? detail.strArea
                : "Anywhere",
          };
        }),
      );

      setDisplayedRecipes(detailedBatch);
      setPage(1);
      setHasMore(formattedRecipes.length > 8);
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setRecipesLoading(false);
    }
  }, [selectedCategory, categories]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecipes();
  }, [fetchRecipes]);

  // 3. Load More Recipes (Web version pagination)
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const itemsToLoad = nextPage * 8;
      const startIndex = page * 8;
      const nextBatch = allRecipes.slice(startIndex, itemsToLoad);

      if (nextBatch.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const detailedNextBatch = await Promise.all(
        nextBatch.map(async (recipe) => {
          const detail = await MealAPI.getMealById(recipe.id);
          return {
            ...recipe,
            description: detail?.strInstructions
              ? detail.strInstructions
                  .replace(/[\r\n]+/g, " ")
                  .substring(0, 80) + "..."
              : "Delicious meal from TheMealDB",
            area:
              detail && detail.strArea && detail.strArea !== "Unknown"
                ? detail.strArea
                : "Anywhere",
          };
        }),
      );

      setDisplayedRecipes((prev) => {
        const prevIds = new Set(prev.map((item) => item.id));
        const filteredNext = detailedNextBatch.filter(
          (item) => !prevIds.has(item.id),
        );
        return [...prev, ...filteredNext];
      });

      setPage(nextPage);
      setHasMore(allRecipes.length > itemsToLoad);
    } catch (error) {
      console.error("Error loading more recipes:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 4. Refresh Button Action
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    if (selectedCategory) {
      await fetchRecipes();
    }
    setRefreshing(false);
  };

  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "Guest";
  const userNickName = userEmail.split("@")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-indigo-500" />
              <span>Hello, {userNickName}!</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">
              Find recipes, filter by category and discover new dishes to cook
              today.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl hover:bg-slate-800 transition-all duration-200"
            title="Refresh recipes"
          >
            <RefreshCw
              className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Featured Latest Recipe */}
        {latestRecipe && (
          <div className="mb-12">
            <LatestRecipe latestRecipe={latestRecipe} />
          </div>
        )}
      </header>

      {/* Category Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
          Categories
        </h2>

        {/* Relative Wrapper for Navigation Arrows */}
        <div className="relative group">
          {/* Left Arrow Button */}
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-2.5 bg-slate-900/90 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-full shadow-xl hover:scale-110 transition-all duration-200 cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Horizontal Category Scroll */}
          <div
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all duration-200 border ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105"
                      : "bg-slate-900 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-8 h-8 object-contain rounded-lg bg-white/5 p-0.5"
                  />
                  <span className="font-bold text-sm">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-2.5 bg-slate-900/90 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-full shadow-xl hover:scale-110 transition-all duration-200 cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Recipe List Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
          Recipes in{" "}
          {categories.find((cat) => cat.id === selectedCategory)?.name || ""}
        </h2>

        {recipesLoading && displayedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-slate-400 text-sm">Loading recipes...</p>
          </div>
        ) : displayedRecipes.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <p className="text-slate-400 text-lg">
              No recipes found in this category.
            </p>
          </div>
        ) : (
          <>
            {/* Dynamic Grid: 1 col on mobile, 2 on tablet, 3 on small laptop, 4 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {displayedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-2xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load More Recipes</span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
