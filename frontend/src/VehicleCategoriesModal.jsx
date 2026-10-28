import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Bike,
  Shield,
  ShieldCheck,
  Zap,
  Users,
  Briefcase,
  Flame,
  CheckCircle2,
  Sliders,
  Wind,
  VolumeX,
  Volume2,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  ChevronRight,
  HelpCircle,
  Clock,
  Navigation
} from 'lucide-react';
import { API_BASE } from './api';

export const CATEGORIES_DATA = [
  {
    id: 'SmartAuto',
    displayName: 'SmartAuto CNG',
    tier: 'Auto Rickshaw',
    categoryGroup: 'daily',
    icon: Car,
    emoji: '🛺',
    baseFare: 30,
    perKmRate: 11,
    capacity: 3,
    luggage: '1-2 Bags (25 kg)',
    fuelType: '🌿 Green CNG Eco',
    etaMin: 2,
    badge: 'Meter Guaranteed',
    badgeTone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tagline: 'Pocket-friendly 3-wheeler · Zero surge option',
    description: 'The quintessential Indian city ride. Best for zipping through narrow streets and heavy traffic with zero surge meter assurance.',
    comfortOptions: {
      acAvailable: false,
      quietMode: false,
      luggageAssistance: true,
      womenDriver: true,
    },
    safetyPerks: [
      'Govt Verified Meter Fare Guarantee',
      'Direct Driver UPI QR Code Payment',
      'GPS Sentinel Live Route Tracking',
      'Instant SOS 112 Trigger Button',
    ],
    popularRoutes: ['Station ↔ Home', 'Local Market Runs', 'Metro Feeder Connection'],
    sampleVehicles: ['Bajaj RE Compact CNG', 'Piaggio Ape City DX', 'Mahindra Alfa DX'],
  },
  {
    id: 'SmartBike',
    displayName: 'SmartBike Express',
    tier: 'Bike Taxi',
    categoryGroup: 'daily',
    icon: Bike,
    emoji: '🛵',
    baseFare: 18,
    perKmRate: 7,
    capacity: 1,
    luggage: '1 Backpack (10 kg)',
    fuelType: '⚡ EV / Petrol',
    etaMin: 2,
    badge: 'Sanitized Helmet Provided',
    badgeTone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tagline: 'Fastest in city traffic · Solo ride',
    description: 'Beat rush-hour traffic on a certified two-wheeler. Includes sanitized helmet with clear visor and live emergency dash sentinel.',
    comfortOptions: {
      acAvailable: false,
      quietMode: true,
      luggageAssistance: false,
      womenDriver: false,
    },
    safetyPerks: [
      'Sanitized ISI Certified Helmet with Visor',
      'Real-Time Speed & Lean Telemetry',
      'Zero Emission EV Motor Options',
      'Cheapest Per-Km Rate (Only ₹7/km)',
    ],
    popularRoutes: ['Rush Hour Office Commute', 'Tech Park Express', 'College & University Runs'],
    sampleVehicles: ['Ather 450X EV', 'Hero Electric Optima', 'Bajaj Pulsar 150'],
  },
  {
    id: 'SmartMini',
    displayName: 'SmartMini AC',
    tier: 'Compact Cab',
    categoryGroup: 'daily',
    icon: Car,
    emoji: '🚗',
    baseFare: 40,
    perKmRate: 10,
    capacity: 4,
    luggage: '2 Medium Bags (40 kg)',
    fuelType: '⚡ Electric / CNG',
    etaMin: 4,
    badge: 'SOS 112 Shield',
    badgeTone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tagline: 'Affordable compact AC cab',
    description: 'Comfy air-conditioned hatchback cab for daily city transit. High fuel efficiency, door-to-door convenience, and full GPS monitoring.',
    comfortOptions: {
      acAvailable: true,
      quietMode: true,
      luggageAssistance: true,
      womenDriver: true,
    },
    safetyPerks: [
      '100% Chilled AC Guaranteed',
      'Child Lock Safety Deactivation',
      'AI Night Route Deviation Sentinel',
      'Shared Live Ride Beacon with Family',
    ],
    popularRoutes: ['City Hospital Visits', 'Daily Office Commute', 'Family Shopping Outings'],
    sampleVehicles: ['Maruti Suzuki WagonR AC', 'Tata Tiago EV', 'Hyundai Grand i10 Nios'],
  },
  {
    id: 'SmartSedan',
    displayName: 'SmartSedan Prime',
    tier: 'Prime Sedan',
    categoryGroup: 'premium',
    icon: Car,
    emoji: '🚘',
    baseFare: 55,
    perKmRate: 14,
    capacity: 4,
    luggage: '3 Large Bags (60 kg)',
    fuelType: '⛽ Hybrid Petrol',
    etaMin: 5,
    badge: 'Top Rated 4.9★ Driver',
    badgeTone: 'bg-blue-50 text-blue-700 border-blue-200',
    tagline: 'Extra legroom & top rated diamond driver',
    description: 'Executive sedan travel featuring premium legroom, leatherette seating, in-car charging cables, and 4.85+ star rated Diamond fleet drivers.',
    comfortOptions: {
      acAvailable: true,
      quietMode: true,
      luggageAssistance: true,
      womenDriver: true,
    },
    safetyPerks: [
      'Top-Rated Diamond Fleet Drivers (4.85+ ★)',
      'Quiet Ride / Silent Mode Preference',
      'High-Speed In-Cabin USB Fast Charger',
      'Spacious Boot for 3 Large Suitcases',
    ],
    popularRoutes: ['Airport & Corporate Parks', 'Business Client Meetings', 'Dinner & Event Travel'],
    sampleVehicles: ['Honda City Hybrid', 'Maruti Suzuki Dzire Prime', 'Hyundai Aura SX'],
  },
  {
    id: 'SmartSUV',
    displayName: 'SmartSUV Guard',
    tier: 'Prime SUV / Sentinel',
    categoryGroup: 'premium',
    icon: Car,
    emoji: '🚙',
    baseFare: 85,
    perKmRate: 20,
    capacity: 6,
    luggage: '4+ Large Bags (90 kg)',
    fuelType: '⛽ Petrol / Diesel',
    etaMin: 7,
    badge: 'AI Cabin Sentinel',
    badgeTone: 'bg-purple-50 text-purple-700 border-purple-200',
    tagline: 'Spacious 6-seater · Extra trunk room & live dashcam',
    description: 'Grand 6-passenger SUV engineered for group excursions, airport heavy baggage, and long highway journeys equipped with dual AI cabin dashcams.',
    comfortOptions: {
      acAvailable: true,
      quietMode: true,
      luggageAssistance: true,
      womenDriver: true,
    },
    safetyPerks: [
      '6 Full Adult Passenger Seats',
      'Dual Dashcam AI Cabin Sentinel',
      'Heavy Luggage Boot & Roof Carrier',
      'Highway High-Stability Chassis',
    ],
    popularRoutes: ['SVPI Airport Family Transfers', 'Outstation Highway Trips', 'Wedding & Group Events'],
    sampleVehicles: ['Toyota Innova Crysta', 'Mahindra XUV700 AX7', 'Kia Carens Luxury'],
  },
];

export default function VehicleCategoriesModal({
  isOpen,
  onClose,
  selectedCar,
  onSelectCar,
  estimatedDistanceKm = 10,
  ridePreferences = {},
  onUpdatePreferences,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'daily' | 'premium'
  const [detailedCategory, setDetailedCategory] = useState(
    CATEGORIES_DATA.find((c) => c.id === selectedCar) || CATEGORIES_DATA[2]
  );
  const [localPrefs, setLocalPrefs] = useState({
    acPreference: ridePreferences.acPreference || 'Standard (23°C)',
    quietRide: ridePreferences.quietRide || false,
    luggageAssistance: ridePreferences.luggageAssistance || false,
    womenDriverPreference: ridePreferences.womenDriverPreference || false,
  });

  useEffect(() => {
    if (selectedCar) {
      const found = CATEGORIES_DATA.find((c) => c.id === selectedCar);
      if (found) setDetailedCategory(found);
    }
  }, [selectedCar]);

  if (!isOpen) return null;

  const filteredCategories = CATEGORIES_DATA.filter((cat) => {
    if (activeTab === 'all') return true;
    return cat.categoryGroup === activeTab;
  });

  const handleSelectAndApply = (carId) => {
    onSelectCar(carId);
    if (onUpdatePreferences) {
      onUpdatePreferences(localPrefs);
    }
    onClose();
  };

  const calculateCategoryFare = (base, perKm) => {
    const dist = Math.max(1, estimatedDistanceKm || 10);
    return Math.round(base + dist * perKm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <span className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Fleet Fleet Tiers &amp; Comfort Matrix
              </span>
              <h2 className="text-2xl font-black tracking-tight">Smart Cab Vehicle Categories</h2>
            </div>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl">
            Choose the vehicle tier matching your commute, comfort preference, and group size. Every category is backed by 24/7 AI GPS Sentinel and Emergency 112 Shield.
          </p>

          {/* Group Filter Tabs */}
          <div className="flex items-center space-x-2 mt-5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              All Categories (5)
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                activeTab === 'daily'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ⚡ Daily Commute (3)
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                activeTab === 'premium'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              👑 Prime &amp; Sentinel (2)
            </button>
          </div>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 max-h-[68vh] overflow-y-auto">
          
          {/* Left Column: Category Selector Cards */}
          <div className="md:col-span-5 p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase px-1">
              <span>Select Category</span>
              <span>Est. {estimatedDistanceKm ? `${estimatedDistanceKm.toFixed(1)} km` : '10 km'}</span>
            </div>

            {filteredCategories.map((cat) => {
              const isSelected = detailedCategory.id === cat.id;
              const isCurrentRideCar = selectedCar === cat.id;
              const Icon = cat.icon;
              const fare = calculateCategoryFare(cat.baseFare, cat.perKmRate);

              return (
                <div
                  key={cat.id}
                  onClick={() => setDetailedCategory(cat)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border-2 flex items-center justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl text-xl flex items-center justify-center ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                    }`}>
                      {cat.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {cat.displayName}
                        </span>
                        {isCurrentRideCar && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {cat.tagline}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        <span>👤 {cat.capacity}</span>
                        <span>•</span>
                        <span>{cat.fuelType}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">~{cat.etaMin} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      ₹{fare}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      ₹{cat.perKmRate}/km
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep-Dive Specs, Safety Perks & Ride Customizer */}
          <div className="md:col-span-7 p-6 space-y-6 bg-white dark:bg-slate-900">
            
            {/* Category Header Card */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{detailedCategory.emoji}</span>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {detailedCategory.displayName}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {detailedCategory.tier}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {detailedCategory.description}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${detailedCategory.badgeTone}`}>
                    {detailedCategory.badge}
                  </span>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Capacity</div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    👤 {detailedCategory.capacity} Rider{detailedCategory.capacity > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Luggage Space</div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {detailedCategory.luggage}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Base Rate</div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    ₹{detailedCategory.baseFare} + ₹{detailedCategory.perKmRate}/km
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Fuel &amp; Green Tier</div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {detailedCategory.fuelType}
                  </div>
                </div>
              </div>
            </div>

            {/* Safety & Sentinel Features */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Category Safety &amp; Sentinel Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detailedCategory.safetyPerks.map((perk, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="font-medium">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ride Comfort & Preferences Configurator */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-500" />
                Customize Ride Preferences for {detailedCategory.displayName}
              </h4>

              {/* AC Preference (if supported) */}
              {detailedCategory.comfortOptions.acAvailable ? (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    ❄️ In-Cabin AC Preference:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Chilled (20°C)', 'Standard (23°C)', 'Eco / Fresh Air'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setLocalPrefs({ ...localPrefs, acPreference: mode })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition ${
                          localPrefs.acPreference === mode
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-slate-400" />
                  Natural open-air cross ventilation active for {detailedCategory.displayName}.
                </div>
              )}

              {/* Quiet Mode & Luggage Assistance Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPrefs.quietRide}
                    onChange={(e) => setLocalPrefs({ ...localPrefs, quietRide: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                      Quiet Ride Mode
                    </div>
                    <div className="text-[10px] text-slate-400">Silent commute, no driver chat</div>
                  </div>
                </label>

                <label className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPrefs.luggageAssistance}
                    onChange={(e) => setLocalPrefs({ ...localPrefs, luggageAssistance: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      Luggage Help
                    </div>
                    <div className="text-[10px] text-slate-400">Driver trunk loading assistance</div>
                  </div>
                </label>
              </div>

              {/* Women Driver Partner Priority */}
              {detailedCategory.comfortOptions.womenDriver && (
                <label className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPrefs.womenDriverPreference}
                    onChange={(e) => setLocalPrefs({ ...localPrefs, womenDriverPreference: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-400 w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      SmartCab Women Sentinel Priority
                    </div>
                    <div className="text-[10px] text-purple-700 dark:text-purple-400">
                      Prioritize verified female driver partners or top-rated Diamond safety guardians
                    </div>
                  </div>
                </label>
              )}
            </div>

            {/* Popular Vehicle Models & Routes */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>🚗 Typical Vehicles: <strong>{detailedCategory.sampleVehicles.join(', ')}</strong></span>
            </div>

            {/* Select & Apply Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSelectAndApply(detailedCategory.id)}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-slate-950 font-black text-sm transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Select {detailedCategory.displayName} (₹{calculateCategoryFare(detailedCategory.baseFare, detailedCategory.perKmRate)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
