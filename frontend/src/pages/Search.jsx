import React, { useState, useEffect, useCallback } from 'react';
import { MealAPI } from '../services/mealAPI';
import RecipeCard from '../components/RecipeCard';
import { Search as SearchIcon, X, Sparkles, RefreshCw } from 'lucide-react';

// Helper function to filter out duplicate meals by id
const filterUniqueMeals = (mealsArray) => {
  const seen = new Set();
  return mealsArray.filter(meal => {
    if (!meal || !meal.id) return false;
    const isDuplicate = seen.has(meal.id);
    seen.add(meal.id);
    return !isDuplicate;
  });
};

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [meals, setMeals] = useState([]);
  const [allFetchedMeals, setAllFetchedMeals] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isRandom, setIsRandom] = useState(true);

  // 1. Fetch Random Meals
  const fetchRandomMeals = useCallback(async () => {
    setLoading(true);
    try {
      const rawMeals = await MealAPI.getRandomMeals(8); // Web shows 8 items instead of 6 for better grid layout
      const transformed = rawMeals
        .map(meal => MealAPI.transformMealData(meal))
        .filter(meal => meal !== null);
      setMeals(filterUniqueMeals(transformed));
      setIsRandom(true);
      setAllFetchedMeals([]);
      setPage(0);
    } catch (error) {
      console.error('Failed to fetch random meals:', error);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Search Results
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      fetchRandomMeals();
      return;
    }
    
    setLoading(true);
    try {
      let rawMeals = await MealAPI.searchMealByName(query);
      
      // Fallback search by ingredient if name search yields nothing
      if (!rawMeals || rawMeals.length === 0) {
        rawMeals = await MealAPI.filterByIngredient(query);
      }

      const transformed = rawMeals
        .map(meal => MealAPI.transformMealData(meal))
        .filter(meal => meal !== null);
      
      const uniqueMeals = filterUniqueMeals(transformed);
      setAllFetchedMeals(uniqueMeals);
      setPage(0);
      setIsRandom(false);
      
      // Initially show first 12 items for search
      setMeals(uniqueMeals.slice(0, 12));
    } catch (error) {
      console.error('Search failed:', error);
      setMeals([]);
      setAllFetchedMeals([]);
    } finally {
      setLoading(false);
    }
  }, [fetchRandomMeals]);

  // Load random meals on mount
  useEffect(() => {
    fetchRandomMeals();
  }, [fetchRandomMeals]);

  // Debounce search query (600ms)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      fetchRandomMeals();
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchRandomMeals, handleSearch]);

  // 3. Refresh Action (Only valid for random meals state)
  const onRefresh = async () => {
    if (!isRandom) return;
    setRefreshing(true);
    await fetchRandomMeals();
    setRefreshing(false);
  };

  // 4. Load More (Infinite scroll pagination)
  const loadMoreMeals = () => {
    if (isRandom || loading) return;

    const nextPage = page + 1;
    const startIndex = nextPage * 12;

    if (startIndex < allFetchedMeals.length) {
      const nextBatch = allFetchedMeals.slice(startIndex, startIndex + 12);
      setMeals(prevMeals => filterUniqueMeals([...prevMeals, ...nextBatch]));
      setPage(nextPage);
    }
  };

  const hasMore = !isRandom && (page + 1) * 12 < allFetchedMeals.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <SearchIcon className="h-8 w-8 text-indigo-500" />
              <span>Search Recipes</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">
              Discover delicious recipes by typing names or ingredients.
            </p>
          </div>

          {isRandom && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl hover:bg-slate-800 transition-all duration-200"
              title="Shuffle random recipes"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Search Bar Container */}
        <div className="relative max-w-2xl mb-10 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
            <SearchIcon className="h-5 w-5" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-3xl py-4 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300 text-base shadow-lg"
            placeholder="Search recipes, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Results Info */}
        {!isRandom && meals.length > 0 && (
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-8">
            <h2 className="text-lg font-bold text-white">Search Results</h2>
            <span className="text-sm font-semibold text-slate-400">
              {allFetchedMeals.length} recipes found
            </span>
          </div>
        )}

        {isRandom && (
          <div className="flex items-center space-x-2 pb-4 mb-8">
            <Sparkles className="h-5 w-5 text-indigo-400 fill-current" />
            <h2 className="text-lg font-bold text-white">Recommended Recipes</h2>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-slate-400 text-sm">Searching recipes...</p>
          </div>
        ) : meals.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-xl mx-auto flex flex-col items-center">
            <div className="p-4 bg-slate-800/50 text-slate-500 rounded-full mb-6">
              <SearchIcon className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No recipes found</h3>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              Try searching with different keywords like 'Chicken', 'Cake', or 'Rice'.
            </p>
          </div>
        ) : (
          /* Recipes Grid */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {meals.map((meal, index) => (
                <RecipeCard key={meal?.id || index} recipe={meal} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMoreMeals}
                  className="px-8 py-3.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-2xl transition-all duration-200"
                >
                  Load More Recipes
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
