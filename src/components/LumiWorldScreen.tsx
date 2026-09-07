import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LumiCharacter } from './LumiCharacter';
import { stopLumiVoice } from '../utils/voiceManager';

type GameId =
  | 'TRAFFIC_LIGHT'
  | 'COLOR_SEQUENCE'
  | 'COLOR_WORLD'
  | 'COLOR_HIDDEN'
  | 'SPOT_DIFF'
  | 'COLOR_TRAIL'
  | 'ROBOT_MISTAKE'
  | 'COLOR_OR_SHAPE'
  | 'COLOR_DANCE'
  | 'ASSOCIATION_WORD'
  | 'COLOR_CODE'
  | 'ODD_ONE_OUT'
  | 'ASSET_GALLERY';

interface LumiWorldScreenProps {
  onSelectGame: (game: GameId) => void;
}

interface GameCardConfig {
  id: GameId;
  icon: string;
  title: string;
  description: string;
  tags: string[];
  badge?: string;
}

export const LumiWorldScreen: React.FC<LumiWorldScreenProps> = ({
  onSelectGame,
}) => {
  // Prevent accidental tap-through / ghost-clicks immediately upon mounting
  const [canInteract, setCanInteract] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanInteract(true);
    }, 350);
    return () => {
      clearTimeout(timer);
      stopLumiVoice();
    };
  }, []);

  const handleGameSelection = (game: GameId) => {
    if (!canInteract) return;
    stopLumiVoice();
    onSelectGame(game);
  };
const withBaseUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
  const games: GameCardConfig[] = [
    {
      id: 'TRAFFIC_LIGHT',
      icon: withBaseUrl('/lumi/icon/icon_traffic_light.png'),
      title: 'Сломанный светофор',
      description: 'Помоги машинкам проехать! Помни правила, когда светофор ломается.',
      tags: ['Торможение', 'Переключение'],
    },
    {
      id: 'COLOR_SEQUENCE',
      icon: withBaseUrl('/lumi/icon/icon_color_sequence.png'),
      title: 'Луми потерял цвета',
      description: 'Запомни цвета и помоги Луми вернуть их в правильном порядке!',
      tags: ['Рабочая память', 'Последовательность'],
    },
    {
      id: 'COLOR_WORLD',
     icon: withBaseUrl('/lumi/icon/icon_color_world.png'),
      title: 'Цветной мир',
      description: 'Собирай цвета, помогай Луми собрать урожай и построить свой цветной дом!',
      tags: ['«Я собираю»', '«Я помогаю»', '«Я создаю»'],
    },
    {
      id: 'COLOR_HIDDEN',
      icon: withBaseUrl('/lumi/icon/icon_color_hidden.png'),
      title: 'Цвет спрятался',
      description: 'Найди все предметы заданного цвета! Развивай зрительное внимание вместе с Луми.',
      tags: ['Зрительное внимание', 'Выделение признака'],
    },
    {
      id: 'SPOT_DIFF',
      icon: withBaseUrl('/lumi/icon/icon_spot_diff.png'),
      title: 'Что изменилось?',
      description: 'Запомни предметы на картинке и найди, что пропало или изменилось!',
      tags: ['Зрительная память', 'Сравнение'],
    },
    {
      id: 'COLOR_TRAIL',
      icon: withBaseUrl('/lumi/icon/icon_color_trail.png'),
      title: 'Цветной след',
      description: 'Запомни порядок цветных точек и повтори их след шаг за шагом!',
      tags: ['Рабочая память', 'Последовательность', 'Пространство'],
    },
    {
      id: 'ROBOT_MISTAKE',
      icon: withBaseUrl('/lumi/icon/icon_robot_mistake.png'),
      title: 'Робот ошибается',
      description: 'Слушай робота и сравнивай с картинкой! Не верь роботу на слово — проверь его ответ.',
      tags: ['Контроль ответа', 'Зрительное внимание', 'Сравнение'],
    },
    {
      id: 'COLOR_OR_SHAPE',
      icon: withBaseUrl('/lumi/icon/icon_color_code.png'),
      title: 'Цвет или форма?',
      description: 'Ищи предметы по цвету или форме, а на 3-м уровне слушай сигнал!',
      tags: ['Переключение', 'Слуховой сигнал', 'Удержание правила'],
    },
    {
      id: 'COLOR_DANCE',
      icon: withBaseUrl('/lumi/icon/icon_color_dance.png'),
      title: 'Цветовой танец',
      description: 'Выполняй движения по цветам: хлопок, топот или приседание!',
      tags: ['Сенсомоторика', 'Рабочая память', 'Контроль'],
    },
    {
      id: 'ASSOCIATION_WORD',
     icon: withBaseUrl('/lumi/icon/icon_association.png'),
      title: 'Ассоциация → слово',
      description: 'Учимся связывать предметы и цвета: от картинки к цвету и обратно!',
      tags: ['Речевое обозначение', 'Ассоциация', 'Признак'],
    },
    {
      id: 'COLOR_CODE',
      icon: withBaseUrl('/lumi/icon/icon_home.png'),
      title: 'Луми ищет цвет',
      description: 'Помоги Луми найти потерянные цвета в её домике!',
      tags: ['Домик Луми', 'Зрительный поиск', 'Классификация'],
      badge: 'НОВАЯ',
    },
    {
      id: 'ODD_ONE_OUT',
      icon: withBaseUrl('/lumi/icon/icon_odd_one_out.png'),
      title: 'Что лишнее?',
      description: 'Найди предмет, который не относится к группе, и объясни почему!',
      tags: ['Классификация', 'Обобщение', 'Речь'],
      badge: 'НОВАЯ',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 flex flex-col items-center box-border">
      {/* Top Welcome Banner */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-5 sm:mb-6 w-full max-w-2xl"
      >
        <div className="inline-block bg-amber-400 text-amber-950 px-5 py-1.5 rounded-full font-black text-base sm:text-xl shadow-sm border border-amber-500/50 mb-3">
          ✨ МИР ЛУМИ ✨
        </div>

        {/* Character with friendly message */}
        <div className="w-full">
          <LumiCharacter
            state="happy"
            message="Привет! Давай поиграем! Выбери игру ниже 👇"
          />
        </div>
      </motion.div>

      {/* Game Cards Grid: 1 column on mobile, 2 columns on tablet/desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full max-w-3xl">
        {games.map((game) => {
          return (
            <motion.div
              key={game.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between items-center text-center relative border transition-all duration-200 bg-white/95 backdrop-blur-xs border-stone-200/90 hover:border-amber-300 hover:shadow-md"
            >
              {/* Optional Subtle Badge */}
              {game.badge ? (
                <div className="absolute top-3.5 right-3.5 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200/80">
                  {game.badge}
                </div>
              ) : null}

              {/* Card Body: Icon -> Title -> Description -> Competencies */}
              <div className="w-full flex flex-col items-center mt-1 mb-4">
                {/* 1. Icon Container */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center p-2 mb-3 shadow-xs transition-all bg-amber-50/90 border border-amber-200/70 shrink-0 overflow-hidden">
                  <img
                    src={game.icon}
                    alt={game.title}
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </div>

                {/* 2. Game Title */}
                <h2 className="font-black text-xl sm:text-2xl text-stone-900 mb-1.5 leading-snug">
                  {game.title}
                </h2>

                {/* 3. Short Description */}
                <p className="text-stone-600 font-medium text-xs sm:text-sm leading-relaxed max-w-xs mb-3">
                  {game.description}
                </p>

                {/* 4. Competency Tags */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {game.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-stone-100 text-stone-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border border-stone-200/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 5. Action Button */}
              <button
                onClick={() => handleGameSelection(game.id)}
                className="w-full mt-auto bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base sm:text-lg py-3 sm:py-3.5 rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide"
              >
                <span>ИГРАТЬ</span>
                <span className="text-lg">➔</span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
