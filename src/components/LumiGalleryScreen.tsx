import React, { useState } from 'react';
import {
  LUMI_ASSET_REGISTRY,
  LumiAssetCategory,
  LumiAssetSize,
  ASSETS_NEEDING_CLEANUP,
} from '../visualSystem/LumiAssetRegistry';
import { LumiAsset } from './LumiAsset';

interface LumiGalleryScreenProps {
  onBack: () => void;
}

export const LumiGalleryScreen: React.FC<LumiGalleryScreenProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<LumiAssetSize>('medium');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'shapes', label: 'Фигуры' },
    { id: 'objects', label: 'Объекты' },
    { id: 'food', label: 'Еда' },
    { id: 'transport', label: 'Транспорт' },
    { id: 'nature', label: 'Природа' },
    { id: 'special', label: 'Специальные' },
  ];

  // Group assets by base type to display color variants side-by-side
  const filteredAssets = LUMI_ASSET_REGISTRY.filter((asset) => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group by object type
  const groupedTypes = Array.from(new Set(filteredAssets.map((a) => a.type)));

  const totalAssetsCount = LUMI_ASSET_REGISTRY.length;
  const coloredAssetsCount = LUMI_ASSET_REGISTRY.filter(
    (a) => a.color === 'red' || a.color === 'blue' || a.color === 'yellow' || a.color === 'green' || a.color === 'brown'
  ).length;
  const singleColorAssetsCount = totalAssetsCount - coloredAssetsCount;

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 flex flex-col gap-4 box-border text-slate-800">
      {/* Top Header Bar */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-md border border-amber-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs sm:text-sm border border-amber-300 transition-all cursor-pointer active:scale-95"
          >
            ← Назад
          </button>
          <div>
            <h1 className="font-black text-amber-950 text-base sm:text-xl">
              🎨 Библиотека Мира Луми (Dev Gallery)
            </h1>
            <p className="text-xs text-amber-800 font-medium">
              Всего assets: {totalAssetsCount} (Цветных: {coloredAssetsCount}, Одноцветных: {singleColorAssetsCount})
            </p>
          </div>
        </div>

        {/* Size Selector */}
        <div className="flex items-center gap-1.5 bg-amber-50 p-1 rounded-xl border border-amber-200">
          <span className="text-xs font-bold text-amber-900 px-1">Размер:</span>
          {(['small', 'medium', 'large'] as LumiAssetSize[]).map((sz) => (
            <button
              key={sz}
              onClick={() => setSelectedSize(sz)}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold capitalize cursor-pointer transition-all ${
                selectedSize === sz
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-amber-900 hover:bg-amber-100'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters & Search */}
      <div className="w-full bg-white/90 backdrop-blur-xs rounded-2xl p-3 shadow-xs border border-amber-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Поиск по имени или ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-amber-300 text-xs sm:text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-56"
        />
      </div>

      {/* Needs Cleanup Warning Banner (Rule #7) */}
      {ASSETS_NEEDING_CLEANUP.length > 0 && (
        <div className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 text-xs text-amber-900">
          <span className="font-black">⚠️ Требуют очистки фона (assets needing cleanup):</span>{' '}
          {ASSETS_NEEDING_CLEANUP.join(', ')}
        </div>
      )}

      {/* Main Asset Grid */}
      <div className="w-full flex flex-col gap-4">
        {groupedTypes.map((type) => {
          const variants = filteredAssets.filter((a) => a.type === type);
          if (variants.length === 0) return null;

          const first = variants[0];

          return (
            <div
              key={type}
              className="w-full bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base text-slate-900">
                    {first.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase">
                    {first.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">type: {type}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {variants.length} вариаци{variants.length === 1 ? 'я' : 'и'}
                </span>
              </div>

              {/* Color Variants Side by Side */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl p-2 min-w-[100px] sm:min-w-[120px] transition-all hover:border-indigo-300 hover:shadow-xs"
                  >
                    <LumiAsset asset={variant} size={selectedSize} />
                    <span className="text-xs font-black text-slate-700 capitalize mt-1">
                      {variant.color}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono text-center truncate max-w-[110px]">
                      {variant.id}
                    </span>
                    {variant.filePath && (
                      <span className="text-[9px] text-indigo-600 font-mono text-center truncate max-w-[120px] mt-0.5" title={variant.filePath}>
                        {variant.filePath}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
