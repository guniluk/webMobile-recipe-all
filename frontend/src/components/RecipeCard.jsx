import { Link, useLocation } from "react-router-dom";
import { Globe, Clock, Users } from "lucide-react";

export default function RecipeCard({ recipe }) {
  const location = useLocation();
  if (!recipe) return null;

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      state={{ from: location.pathname }}
      className="group bg-slate-900 rounded-3xl border border-slate-800/80 overflow-hidden shadow-md hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-slate-700/80 transition-all duration-300 flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-slate-950">
        <img
          src={recipe.image || recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {recipe.area && (
          <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
            <Globe className="h-3 w-3 text-indigo-400" />
            <span>{recipe.area}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col grow">
        <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
            {recipe.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-slate-800/60 flex items-center justify-between text-slate-400 text-xs font-semibold">
          <div className="flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{recipe.time || "30m"}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>{recipe.servings || "4"} Servings</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
