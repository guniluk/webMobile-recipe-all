import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useFavoriteStore } from '../store/useFavoriteStore';
import { MealAPI } from '../services/mealAPI';
import {
  ArrowLeft,
  Heart,
  Share2,
  Globe,
  Clock,
  Users,
  Utensils,
  CheckSquare,
  BookOpen,
  Video,
  Check,
} from 'lucide-react';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const {
    fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorite: checkIsFavorite,
  } = useFavoriteStore();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Fetch recipe detail and sync favorites state
  useEffect(() => {
    const loadRecipeData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const rawMeal = await MealAPI.getMealById(id);
        if (rawMeal) {
          const transformed = MealAPI.transformMealData(rawMeal);
          setRecipe(transformed);
        } else {
          alert('Recipe not found.');
          navigate(-1);
          return;
        }

        // Fetch user favorites if logged in
        if (user?.id) {
          await fetchFavorites(user.id);
        }
      } catch (error) {
        console.error('Error loading recipe details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipeData();
  }, [id, user, navigate, fetchFavorites]);

  const isFavorite = checkIsFavorite(id);

  // 2. Favorite Toggle Handler
  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      alert('Please log in to save recipes to your favorites.');
      return;
    }
    if (!recipe || favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(user.id, id);
      } else {
        await addFavorite(user.id, recipe);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  }, [
    user,
    recipe,
    favoriteLoading,
    isFavorite,
    id,
    addFavorite,
    removeFavorite,
  ]);

  // 3. Share Handler (Web API or Clipboard fallback)
  const handleShare = useCallback(async () => {
    if (!recipe) return;
    const shareText = `Check out this delicious recipe: ${recipe.title}\nEnjoy cooking!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  }, [recipe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Banner (Responsive: side-by-side on desktop, stacked on mobile) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-2 text-slate-400 hover:text-white font-bold transition-colors bg-slate-900 border border-slate-800/80 hover:border-slate-700 px-4 py-2 rounded-2xl"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Recipe Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Image and Meta Cards */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

              {/* Overlay Share & Favorite floating buttons */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={handleShare}
                  className="p-3 bg-slate-950/70 backdrop-blur-md border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 text-white rounded-2xl transition-all shadow-lg flex items-center space-x-1.5"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  <span className="text-xs font-bold">
                    {copied ? 'Copied!' : 'Share'}
                  </span>
                </button>
              </div>
            </div>

            {/* Meta Information Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col items-center justify-center text-center shadow-md">
                <Clock className="h-5 w-5 text-indigo-400 mb-2" />
                <span className="text-white font-black text-sm">
                  {recipe.cookTime || '30m'}
                </span>
                <span className="text-slate-400 text-xs mt-1 font-medium">
                  Cook Time
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col items-center justify-center text-center shadow-md">
                <Users className="h-5 w-5 text-indigo-400 mb-2" />
                <span className="text-white font-black text-sm">
                  {recipe.servings || '4'}
                </span>
                <span className="text-slate-400 text-xs mt-1 font-medium">
                  Servings
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col items-center justify-center text-center shadow-md">
                <Utensils className="h-5 w-5 text-indigo-400 mb-2" />
                <span className="text-white font-black text-sm truncate max-w-full px-1">
                  {recipe.category}
                </span>
                <span className="text-slate-400 text-xs mt-1 font-medium">
                  Category
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col items-center justify-center text-center shadow-md">
                <Globe className="h-5 w-5 text-indigo-400 mb-2" />
                <span className="text-white font-black text-sm truncate max-w-full px-1">
                  {recipe.area || 'Anywhere'}
                </span>
                <span className="text-slate-400 text-xs mt-1 font-medium">
                  Origin
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Ingredients, Instructions */}
          <div className="lg:col-span-7 space-y-8">
            {/* Title Block */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-indigo-400 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  {recipe.category} • {recipe.area}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 leading-tight tracking-tight">
                  {recipe.title}
                </h1>
              </div>

              {/* Toggle Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`flex-shrink-0 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl font-bold shadow-md transition-all duration-200 border ${
                  isFavorite
                    ? 'bg-rose-500 hover:bg-rose-600 border-rose-400/20 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {favoriteLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                ) : (
                  <Heart
                    className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`}
                  />
                )}
                <span>
                  {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
                </span>
              </button>
            </div>

            {/* Description fallback */}
            {recipe.description && (
              <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-indigo-500 pl-4 bg-slate-900/40 py-3 rounded-r-2xl pr-4">
                {recipe.description}
              </p>
            )}

            {/* Ingredients Section */}
            <div>
              <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-3">
                <CheckSquare className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Ingredients
                </h2>
              </div>

              <div className="bg-slate-900/55 rounded-3xl border border-slate-800/80 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 text-slate-300 text-sm"
                    >
                      <div className="mt-1 flex-shrink-0 w-4 h-4 rounded border border-indigo-500/50 bg-indigo-500/10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      </div>
                      <span className="font-medium leading-tight">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm col-span-2">
                    No ingredients information available.
                  </p>
                )}
              </div>
            </div>

            {/* Instructions Section */}
            <div>
              <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-3">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Instructions
                </h2>
              </div>

              <div className="space-y-4">
                {recipe.instructions && recipe.instructions.length > 0 ? (
                  recipe.instructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/40 border border-slate-800/80 hover:border-slate-800 p-5 rounded-3xl flex items-start space-x-4 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/25 flex items-center justify-center font-black text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
                        {step}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-center">
                    <p className="text-slate-500 text-sm">
                      No instructions information available.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Youtube Tutorial Button */}
            {recipe.originalData?.strYoutube && (
              <a
                href={recipe.originalData.strYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-3 w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base py-4 rounded-2xl transition-colors shadow-lg shadow-rose-600/10 cursor-pointer"
              >
                <Video className="h-5 w-5 fill-current" />
                <span>Watch Video Tutorial on YouTube</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
