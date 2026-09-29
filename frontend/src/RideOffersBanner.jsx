import React, { useState } from 'react';
import {
  Gift,
  Zap,
  Tag,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  X,
  ChevronRight,
  BadgePercent
} from 'lucide-react';
import { PROMO_OFFERS, calculateDiscount } from './RideOffersModal';

export default function RideOffersBanner({
  currentFare = 150,
  appliedOffer = null,
  onApplyOffer,
  onRemoveOffer,
  onOpenOffersModal
}) {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="w-full my-3">
      {/* If an offer is already applied */}
      {appliedOffer ? (
        <div className="p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-white text-emerald-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {appliedOffer.code} Applied
                </span>
                <span className="text-xs text-emerald-100 font-bold">
                  {appliedOffer.title}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-0.5">
                🎉 Discount will be deducted directly from your ride fare &amp; checkout!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenOffersModal}
              className="text-xs font-bold text-white underline hover:text-emerald-100 px-2 py-1"
            >
              Change
            </button>
            <button
              onClick={onRemoveOffer}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
              title="Remove offer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Interactive Uber-style Promotional Offers Strip */
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
              <span>Special Ride Offers &amp; Free Rides</span>
            </div>
            <button
              onClick={onOpenOffersModal}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All (6)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizontal Scrollable Offers Carousel */}
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none snap-x">
            {PROMO_OFFERS.slice(0, 4).map((offer) => {
              const Icon = offer.icon;
              const { discount } = calculateDiscount(offer, currentFare);

              return (
                <div
                  key={offer.code}
                  onClick={() => onApplyOffer(offer)}
                  onMouseEnter={() => setHoveredCard(offer.code)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`min-w-[240px] sm:min-w-[270px] snap-start cursor-pointer rounded-2xl p-3.5 border-2 transition-all transform hover:-translate-y-0.5 bg-gradient-to-br ${offer.bgGradient} ${offer.borderTone} shadow-sm hover:shadow-md relative overflow-hidden`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${offer.badgeTone}`}>
                      {offer.badge}
                    </span>
                    <span className="text-[10px] font-mono font-black bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      {offer.code}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5 mt-2.5">
                    <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm shrink-0 ${offer.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {offer.title}
                      </h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        {offer.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      Save {offer.type === 'percentage' ? `${offer.value}%` : `₹${offer.value}`}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-0.5 group-hover:underline">
                      Tap to Apply <ArrowRight className="w-3 h-3 text-emerald-600" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
