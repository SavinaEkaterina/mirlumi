import React from 'react';
import { AgeGroup, GameSettings, ActiveView } from '../types';
import { AGE_CONFIGS } from '../utils/neuroLogic';

interface HeaderBarProps {
  settings: GameSettings;
  activeView?: ActiveView;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetSession: () => void;
  onReturnToLumiWorld?: () => void;
  onOpenGallery?: () => void;
  currentPhaseText: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  settings,
  activeView = 'TRAFFIC_LIGHT',
  onUpdateSettings,
  onResetSession,
  onReturnToLumiWorld,
  onOpenGallery,
  currentPhaseText,
}) => {
  const getHeaderTitle = () => {
    if (activeView === 'LUMI_WORLD') return 'Мир Луми';
    if (activeView === 'COLOR_SEQUENCE') return 'Луми потерял цвета';
    if (activeView === 'COLOR_WORLD') return 'Цветной мир';
    if (activeView === 'COLOR_HIDDEN') return 'Цвет спрятался';
    if (activeView === 'SPOT_DIFF') return 'Что изменилось?';
    if (activeView === 'COLOR_TRAIL') return 'Цветной след';
    if (activeView === 'ROBOT_MISTAKE') return 'Робот ошибается';
    if (activeView === 'COLOR_OR_SHAPE') return 'Цвет или форма?';
    if (activeView === 'COLOR_DANCE') return 'Цветной танец';
    if (activeView === 'ASSOCIATION_WORD') return 'Словесные ассоциации';
    if (activeView === 'COLOR_CODE') return 'Цветовой код памяти';
    if (activeView === 'ODD_ONE_OUT') return 'Найди лишнее';
    if (activeView === 'ASSET_GALLERY') return 'Библиотека assets';
    return 'Сломанный светофор';
  };

  const getHeaderEmoji = () => {
    if (activeView === 'LUMI_WORLD') return '✨';
    if (activeView === 'COLOR_SEQUENCE') return '🌈';
    if (activeView === 'COLOR_WORLD') return '🎨';
    if (activeView === 'COLOR_HIDDEN') return '🔍';
    if (activeView === 'SPOT_DIFF') return '👁️';
    if (activeView === 'COLOR_TRAIL') return '🐾';
    if (activeView === 'ROBOT_MISTAKE') return '🤖';
    if (activeView === 'COLOR_OR_SHAPE') return '🔷';
    if (activeView === 'COLOR_DANCE') return '💃';
    if (activeView === 'ASSOCIATION_WORD') return '💡';
    if (activeView === 'COLOR_CODE') return '🧩';
    if (activeView === 'ODD_ONE_OUT') return '🔍';
    if (activeView === 'ASSET_GALLERY') return '🖼️';
    return '🚥';
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-amber-200/80 shadow-xs py-2 px-3 sm:px-6 flex items-center justify-between gap-2 z-30 select-none box-border">
      {/* Title & Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-400 border border-amber-500 flex items-center justify-center font-bold text-amber-950 text-sm sm:text-base shadow-xs shrink-0">
          {getHeaderEmoji()}
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-amber-950 text-xs sm:text-base md:text-lg leading-tight whitespace-normal sm:truncate">
            {getHeaderTitle()}
          </h1>
          <p className="text-amber-800 text-[11px] sm:text-xs font-medium hidden sm:block">
            {activeView === 'LUMI_WORLD' ? 'Выбери игру' : currentPhaseText}
          </p>
        </div>
      </div>

      {/* Controls: Lumi World Button, Age Group, Sound, Developer Mode */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 shrink-0">
        {activeView !== 'LUMI_WORLD' && onReturnToLumiWorld && (
          <button
            onClick={onReturnToLumiWorld}
            className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-amber-950 font-extrabold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 border border-amber-500 min-h-[36px]"
            title="Вернуться в Мир Луми"
          >
            <span>🌍</span>
            <span className="hidden sm:inline">Мир Луми</span>
          </button>
        )}

        {/* Dev Asset Gallery Button */}
        {onOpenGallery && settings.developerMode && (
          <button
            onClick={onOpenGallery}
            className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 border border-indigo-600 min-h-[36px]"
            title="Открыть Библиотеку Assets"
          >
            <span>🖼️</span>
            <span className="hidden sm:inline">Assets</span>
          </button>
        )}

        {/* Age Group Selector */}
        <select
          value={settings.ageGroup}
          onChange={(e) => onUpdateSettings({ ageGroup: e.target.value as AgeGroup })}
          className="bg-white border border-amber-300 text-amber-950 font-bold text-xs sm:text-sm rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs min-h-[36px]"
          title="Возрастная группа"
        >
          {Object.entries(AGE_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>
              👶 {config.label}
            </option>
          ))}
        </select>

        {/* Sound Toggle */}
        <button
          onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center border transition-all cursor-pointer min-h-[36px] min-w-[36px] active:scale-95 ${
            settings.soundEnabled
              ? 'bg-amber-200 border-amber-300 text-amber-950 hover:bg-amber-300'
              : 'bg-stone-200 border-stone-300 text-stone-600 hover:bg-stone-300'
          }`}
          title="Включить / выключить звук"
        >
          <span>{settings.soundEnabled ? '🔊' : '🔇'}</span>
        </button>

        {/* Reset Session */}
        {activeView === 'TRAFFIC_LIGHT' && (
          <button
            onClick={onResetSession}
            className="bg-white border border-amber-300 hover:bg-amber-50 active:scale-95 text-amber-900 font-bold text-xs sm:text-sm px-2.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer min-h-[36px]"
            title="Заново"
          >
            🔄
          </button>
        )}

        {/* Hidden / Dev Toggle Button */}
        <button
          onClick={() => onUpdateSettings({ developerMode: !settings.developerMode })}
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 border transition-all cursor-pointer min-h-[36px] active:scale-95 ${
            settings.developerMode
              ? 'bg-purple-600 border-purple-700 text-white shadow-xs'
              : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50'
          }`}
          title="Панель разработчика"
        >
          <span>🛠️</span>
          <span className="hidden md:inline">{settings.developerMode ? 'DEV ON' : 'DEV'}</span>
        </button>
      </div>
    </header>
  );
};
