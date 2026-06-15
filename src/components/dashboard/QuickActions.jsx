import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, TrendingUp, User } from 'lucide-react';
import { motion } from 'framer-motion';

const ACTIONS = [
  { path: '/programmes', icon: Dumbbell, label: 'Programmes', sub: 'Gérer mes séances', color: 'bg-green-500', shadow: 'shadow-green-200' },
  { path: '/nutrition', icon: UtensilsCrossed, label: 'Nutrition', sub: 'Mon plan alimentaire', color: 'bg-orange-400', shadow: 'shadow-orange-200' },
  { path: '/progres', icon: TrendingUp, label: 'Progrès', sub: 'Suivre mon évolution', color: 'bg-purple-500', shadow: 'shadow-purple-200' },
  { path: '/profil', icon: User, label: 'Profil', sub: 'Mon profil & photos', color: 'bg-blue-500', shadow: 'shadow-blue-200' },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="font-heading text-lg text-foreground tracking-wider mb-3">ACCÈS RAPIDE</h3>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((a, i) => (
          <motion.div key={a.path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Link to={a.path}>
              <div className={`bg-white rounded-2xl border border-gray-200 p-4 card-hover shadow-sm hover:shadow-md`}>
                <div className={`h-10 w-10 rounded-xl ${a.color} shadow-lg ${a.shadow} flex items-center justify-center mb-3`}>
                  <a.icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-sm text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.sub}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}