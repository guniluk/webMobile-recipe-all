import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Clock, Users, Flame } from 'lucide-react';

export default function LatestRecipe({ latestRecipe }) {
  if (!latestRecipe) return null;

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-900 group">
      <Link to={`/recipe/${latestRecipe.id}`} className="block relative aspect-[21/9] w-full min-h-[300px] overflow-hidden">
        {/* Background Image */}
        <img
          src={latestRecipe.image}
          alt={latestRecipe.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent md:bg-gradient-to-r md:from-slate-950 md:via-slate-950/70 md:to-transparent" />
        
        {/* Content Box */}
        <div className="absolute inset-0 p-6 sm:p-8 md:p-12 flex flex-col justify-end md:justify-center md:max-w-xl">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full flex items-center space-x-1">
              <Flame className="h-3 w-3 fill-current text-amber-400" />
              <span>Latest Recipe</span>
            </span>
            {latestRecipe.area && (
              <span className="bg-slate-950/60 backdrop-blur-md border border-white/10 text-slate-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5">
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                <span>{latestRecipe.area}</span>
              </span>
            )}
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight group-hover:text-indigo-300 transition-colors duration-300 mb-4">
            {latestRecipe.title}
          </h2>
          
          <div className="flex items-center space-x-6 text-slate-300 text-sm font-semibold">
            <div className="flex items-center space-x-1.5">
              <Clock className="h-4.5 w-4.5 text-indigo-400" />
              <span>{latestRecipe.time || '25m'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users className="h-4.5 w-4.5 text-indigo-400" />
              <span>{latestRecipe.servings || '2 Servings'}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
