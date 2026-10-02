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
  return (
    <div className="w-full my-3">
      {/* If an offer is already applied */}
      {appliedOffer ? (
        <div className="p-3.5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-2xl shadow-md border-2 border-emerald-500 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black bg-white text-emerald-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  {appliedOffer.code} Applied
                </span>
                <span className="text-xs text-white font-black">
                  {appliedOffer.title}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-semibold mt-0.5">
                🎉 Discount applied directly to your ride fare &amp; checkout!
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 pl-2">
            <button
              type="button"
              onClick={onOpenOffersModal}
              className="text-xs font-black text-white underline hover:text-emerald-200 px-1 py-1"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onRemoveOffer}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition"
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
            <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500 animate-bounce" />
              <span className="text-slate-900 font-black">Special Ride Offers &amp; Free Rides</span>
            </div>
            <button
              type="button"
              onClick={onOpenOffersModal}
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
            >
              <span>View All (6)</span>
              <ChevronRight className="w-4 h-4" />
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
                  className={`min-w-[250px] sm:min-w-[280px] snap-start cursor-pointer rounded-2xl p-3.5 border-2 transition-all transform hover:-translate-y-0.5 ${offer.cardBg} ${offer.borderTone} shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${offer.badgeTone}`}>
                        {offer.badge}
                      </span>
                      <span className="text-[11px] font-mono font-black bg-slate-950 text-white px-2 py-0.5 rounded-md shadow-sm">
                        {offer.code}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2.5 mt-2.5">
                      <div className={`p-2 rounded-xl bg-white shadow border border-slate-200/80 shrink-0 ${offer.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-slate-950 line-clamp-1">
                          {offer.title}
                        </h4>
                        <p className="text-[11px] text-slate-700 font-medium line-clamp-1 mt-0.5">
                          {offer.tagline}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-300/70 flex items-center justify-between text-xs">
                    <span className="font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                      Save {offer.type === 'percentage' ? `${offer.value}%` : `₹${offer.value}`}
                    </span>
                    <span className="font-black text-slate-900 flex items-center gap-1 group-hover:underline">
                      Tap to Apply <ArrowRight className="w-3.5 h-3.5 text-emerald-700 font-bold" />
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
