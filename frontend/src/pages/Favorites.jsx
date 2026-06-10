import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useFavoriteStore } from '../store/useFavoriteStore';
import { Heart, Clock, Users, ArrowRight, HeartCrack } from 'lucide-react';

export default function Favorites() {
  const { user } = useUser();
  const { favorites, loading, fetchFavorites, removeFavorite } = useFavoriteStore();

  useEffect(() => {
    if (user?.id) {
      fetchFavorites(user.id);
    }
  }, [user, fetchFavorites]);

  const handleRemove = async (e, recipeId) => {
    e.preventDefault(); // Link 클릭 이벤트 방지
    e.stopPropagation();
    if (window.confirm('Do you want to remove this recipe from favorites?')) {
      await removeFavorite(user.id, recipeId);
    }
  };

  // Average cook time calculation
  const averageCookTime = useMemo(() => {
    if (favorites.length === 0) return '0m';
    const total = favorites.reduce((acc, curr) => {
      const timeNum = parseInt(curr.cookTime) || 30;
      return acc + timeNum;
    }, 0);
    return `${Math.round(total / favorites.length)}m`;
  }, [favorites]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Heart className="h-8 w-8 text-rose-500 fill-current" />
            <span>My Favorites</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Your saved recipes collection. View recipe details or manage list.
          </p>
        </div>

        {/* Stats Section */}
        {!loading && favorites.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {/* Stat Item 1 */}
            <div className="relative group bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-md overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
                  <Heart className="h-6 w-6 fill-current" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Saved Recipes</p>
                  <p className="text-2xl font-black text-white mt-1">{favorites.length} Items</p>
                </div>
              </div>
            </div>

            {/* Stat Item 2 */}
            <div className="relative group bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-md overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg. Cook Time</p>
                  <p className="text-2xl font-black text-white mt-1">{averageCookTime}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-slate-400 text-sm">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-xl mx-auto mt-8 flex flex-col items-center">
            <div className="p-4 bg-slate-800/50 text-slate-500 rounded-full mb-6">
              <HeartCrack className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No favorites yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mb-8">
              Explore our recipes, cook tasty meals, and save your favorites here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl transition-all duration-200"
            >
              <span>Explore Recipes</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {favorites.map((item) => (
              <Link
                key={item.recipeId}
                to={`/recipe/${item.recipeId}`}
                className="group bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-md hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-700 transition-all duration-300 flex flex-col h-full"
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={(e) => handleRemove(e, item.recipeId)}
                    className="absolute top-4 right-4 p-2.5 bg-rose-500/90 text-white rounded-full hover:bg-rose-600 transition-colors shadow-md border border-rose-400/20"
                    title="Remove Favorite"
                  >
                    <Heart className="h-4.5 w-4.5 fill-current text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-4">
                    {item.title}
                  </h3>

                  <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{item.cookTime || '30m'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>{item.servings || '4'} Servings</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
