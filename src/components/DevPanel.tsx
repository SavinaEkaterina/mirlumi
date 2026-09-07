import React from 'react';
import { TrialData, SessionStats, GamePhase, RuleMapping, SequenceTrialData, ActiveView } from '../types';
import { Game3DebugData } from './ColorWorldGame';
import { calculateSessionStats } from '../utils/neuroLogic';

interface DevPanelProps {
  activeView?: ActiveView;
  sequenceTrials?: SequenceTrialData[];
  game3Debug?: Game3DebugData | null;
  trials: TrialData[];
  currentPhase: GamePhase;
  currentRule: RuleMapping;
  level3Attempts: number;
  level3Correct: number;
  level3Completed: boolean;
  recoveryMode: boolean;
  recoveryAttempts: number;
  recoveryCorrect: number;
  hintUsed: boolean;
  onForceRuleSwitch: () => void;
  onForceLevel: (level: number) => void;
  onSimulateResponse: (correct: boolean, isRuleSwitchError?: boolean, selfCorrect?: boolean) => void;
  onClearLogs: () => void;
  onOpenGallery?: () => void;
  onClose: () => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({
  activeView = 'TRAFFIC_LIGHT',
  sequenceTrials = [],
  game3Debug = null,
  trials,
  currentPhase,
  currentRule,
  level3Attempts,
  level3Correct,
  level3Completed,
  recoveryMode,
  recoveryAttempts,
  recoveryCorrect,
  hintUsed,
  onForceRuleSwitch,
  onForceLevel,
  onSimulateResponse,
  onClearLogs,
  onOpenGallery,
  onClose,
}) => {
  const stats: SessionStats = calculateSessionStats(trials);

  const handleExportJSON = () => {
    const exportData = activeView === 'COLOR_SEQUENCE' ? sequenceTrials : trials;
    const filename = activeView === 'COLOR_SEQUENCE' ? 'color_sequence' : 'traffic_light';
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `neuro_${filename}_session_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-4 sm:p-6 rounded-3xl shadow-2xl border-2 border-slate-700 my-4 max-w-4xl mx-auto font-mono text-xs sm:text-sm">
      {/* Dev Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛠️</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-amber-400">
              Внутренний экран разработчика (Debug / Developer)
            </h2>
            <p className="text-slate-400 text-xs font-sans">
              Тестирование методики, переключения правил и выгрузка метрик
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenGallery && (
            <button
              onClick={onOpenGallery}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg border border-indigo-500 cursor-pointer flex items-center gap-1.5"
              title="Открыть Библиотеку Assets"
            >
              <span>🖼️</span>
              <span className="hidden sm:inline">Галерея Ассетов</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-600 cursor-pointer"
          >
            ✖ Свернуть
          </button>
        </div>
      </div>

      {/* Primary Session Metrics Box (From Spec Section 15) */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 mb-5">
        <h3 className="text-amber-300 font-bold mb-3 text-sm uppercase tracking-wider font-sans">
          📊 Метрики текущей сессии
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">Попыток (Total)</div>
            <div className="text-xl font-bold text-white">{stats.totalTrials}</div>
          </div>
          <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800">
            <div className="text-emerald-300 text-xs">Правильных</div>
            <div className="text-xl font-bold text-emerald-400">{stats.correctAnswers}</div>
          </div>
          <div className="bg-rose-950/60 p-2.5 rounded-xl border border-rose-800">
            <div className="text-rose-300 text-xs">Ошибок (всего)</div>
            <div className="text-xl font-bold text-rose-400">{stats.colorErrors + stats.ruleSwitchErrors}</div>
          </div>
          <div className="bg-amber-950/60 p-2.5 rounded-xl border border-amber-800">
            <div className="text-amber-300 text-xs">Ошибок смены правила</div>
            <div className="text-xl font-bold text-amber-400">{stats.ruleSwitchErrors}</div>
          </div>
          <div className="bg-blue-950/60 p-2.5 rounded-xl border border-blue-800">
            <div className="text-blue-300 text-xs">Подсказок (Hints)</div>
            <div className="text-xl font-bold text-blue-400">{stats.hintsUsed}</div>
          </div>
          <div className="bg-teal-950/60 p-2.5 rounded-xl border border-teal-800">
            <div className="text-teal-300 text-xs">Самокоррекций</div>
            <div className="text-xl font-bold text-teal-400">{stats.selfCorrections}</div>
          </div>
          <div className="bg-purple-950/60 p-2.5 rounded-xl border border-purple-800">
            <div className="text-purple-300 text-xs">Текущий уровень</div>
            <div className="text-xl font-bold text-purple-300">{stats.currentLevel}</div>
          </div>
          <div className="bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-800">
            <div className="text-indigo-300 text-xs">Макс. уровень</div>
            <div className="text-xl font-bold text-indigo-300">{stats.maxLevelAchieved}</div>
          </div>
        </div>
      </div>

      {/* Level 3 & Recovery Debug Metrics Block */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-indigo-700/80 mb-5">
        <h3 className="text-indigo-300 font-bold mb-3 text-sm uppercase tracking-wider font-sans flex items-center justify-between">
          <span>🔍 Debug: Метрики Уровня 3 и Восстановления</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${level3Completed ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
            level3Completed = {level3Completed ? 'TRUE' : 'FALSE'}
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">level3Attempts</div>
            <div className="text-xl font-bold text-sky-300">{level3Attempts}</div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">level3Correct</div>
            <div className="text-xl font-bold text-emerald-400">{level3Correct}</div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">level3Completed</div>
            <div className={`text-lg font-extrabold ${level3Completed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {level3Completed ? 'true' : 'false'}
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">hintUsed</div>
            <div className={`text-lg font-extrabold ${hintUsed ? 'text-amber-300' : 'text-slate-400'}`}>
              {hintUsed ? 'true' : 'false'}
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">recoveryMode</div>
            <div className={`text-lg font-extrabold ${recoveryMode ? 'text-amber-400' : 'text-slate-400'}`}>
              {recoveryMode ? 'true' : 'false'}
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">recoveryAttempts</div>
            <div className="text-xl font-bold text-amber-300">{recoveryAttempts}</div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">recoveryCorrect</div>
            <div className="text-xl font-bold text-emerald-400">{recoveryCorrect}</div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-xs">Критерий L3</div>
            <div className="text-xs font-bold text-indigo-300 mt-1">≥ 4/6 (или 4/5 в вост.)</div>
          </div>
        </div>
      </div>

      {/* Developer Control Panel & Test Simulator */}
      <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 mb-5 font-sans">
        <h3 className="text-amber-300 font-bold mb-2.5 text-sm uppercase tracking-wider">
          ⚙️ Управление тестом & Симулятор
        </h3>

        <div className="flex flex-wrap gap-2.5 mb-3">
          <button
            onClick={onForceRuleSwitch}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer text-xs flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>Принудительно сломать светофор (Смена правила)</span>
          </button>

          <button
            onClick={() => onForceLevel(1)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            Уровень 1 (Прямое)
          </button>
          <button
            onClick={() => onForceLevel(2)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            Уровень 2 (Инверсия)
          </button>
          <button
            onClick={() => onForceLevel(3)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs cursor-pointer"
          >
            Уровень 3 (3 цвета)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-700 pt-3">
          <span className="text-slate-400 text-xs font-semibold mr-1">Симулятор попытки:</span>
          <button
            onClick={() => onSimulateResponse(true, false, false)}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            + Верный ответ
          </button>
          <button
            onClick={() => onSimulateResponse(true, false, true)}
            className="bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            + Самокоррекция
          </button>
          <button
            onClick={() => onSimulateResponse(false, true, false)}
            className="bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            + Ошибка смены правила
          </button>
          <button
            onClick={() => onSimulateResponse(false, false, false)}
            className="bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            + Цвет. ошибка
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleExportJSON}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
            >
              📥 Экспорт JSON
            </button>
            <button
              onClick={onClearLogs}
              className="bg-slate-700 hover:bg-rose-800 text-slate-200 hover:text-white font-bold px-2.5 py-1.5 rounded-lg text-xs cursor-pointer"
            >
              🗑 Сброс
            </button>
          </div>
        </div>
      </div>

      {/* Trial Logs Table */}
      {activeView === 'COLOR_SEQUENCE' ? (
        <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 overflow-x-auto">
          <h3 className="text-indigo-400 font-bold mb-2 text-xs uppercase tracking-wider font-sans">
            🌈 Журнал «Луми потерял цвета» ({sequenceTrials.length})
          </h3>
          {sequenceTrials.length === 0 ? (
            <p className="text-slate-500 italic py-2 text-center text-xs">Попыток пока нет</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1 px-2">#</th>
                  <th className="py-1 px-2">Стимул</th>
                  <th className="py-1 px-2">Ответ</th>
                  <th className="py-1 px-2">Результат</th>
                  <th className="py-1 px-2">Совпадений</th>
                  <th className="py-1 px-2">1-я ошибка</th>
                  <th className="py-1 px-2">Ошибка порядка</th>
                  <th className="py-1 px-2">Время</th>
                  <th className="py-1 px-2">Ур.</th>
                </tr>
              </thead>
              <tbody>
                {sequenceTrials.slice(-15).reverse().map((t) => (
                  <tr key={t.id} className="border-b border-slate-900 hover:bg-slate-900/60">
                    <td className="py-1.5 px-2 text-slate-500">{t.trialNumber}</td>
                    <td className="py-1.5 px-2 font-bold text-indigo-300">
                      {t.stimulusSequence.join(' → ')}
                    </td>
                    <td className="py-1.5 px-2 text-slate-200">
                      {t.childSequence.length > 0 ? t.childSequence.join(' → ') : '-'}
                    </td>
                    <td className="py-1.5 px-2 font-bold">
                      {t.correct ? (
                        <span className="text-emerald-400">✓ Да</span>
                      ) : (
                        <span className="text-rose-400">✗ Нет</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-slate-300">{t.matchedPositions} / {t.sequenceLength}</td>
                    <td className="py-1.5 px-2 text-slate-400">{t.firstErrorPosition ? `Поз. ${t.firstErrorPosition}` : '-'}</td>
                    <td className="py-1.5 px-2">
                      {t.orderError ? (
                        <span className="bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                          order_error
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-slate-400">{t.responseTimeMs} мс</td>
                    <td className="py-1.5 px-2 text-slate-400">{t.difficultyLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 overflow-x-auto">
          <h3 className="text-slate-400 font-bold mb-2 text-xs uppercase tracking-wider font-sans">
            📜 Журнал попыток «Сломанный светофор» ({trials.length})
          </h3>
          {trials.length === 0 ? (
            <p className="text-slate-500 italic py-2 text-center text-xs">Попыток пока нет</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1 px-2">#</th>
                  <th className="py-1 px-2">Стимул</th>
                  <th className="py-1 px-2">Ожидалось</th>
                  <th className="py-1 px-2">Ответ</th>
                  <th className="py-1 px-2">Результат</th>
                  <th className="py-1 px-2">Время</th>
                  <th className="py-1 px-2">Метки</th>
                  <th className="py-1 px-2">Ур.</th>
                </tr>
              </thead>
              <tbody>
                {trials.slice(-15).reverse().map((t) => (
                  <tr key={t.id} className="border-b border-slate-900 hover:bg-slate-900/60">
                    <td className="py-1.5 px-2 text-slate-500">{t.trialNumber}</td>
                    <td className="py-1.5 px-2 font-bold">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${
                          t.stimulusColor === 'green'
                            ? 'bg-emerald-400'
                            : t.stimulusColor === 'red'
                            ? 'bg-red-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      {t.stimulusColor}
                    </td>
                    <td className="py-1.5 px-2 text-slate-300">{t.expectedAction}</td>
                    <td className="py-1.5 px-2 text-slate-300">{t.childAction || '-'}</td>
                    <td className="py-1.5 px-2 font-bold">
                      {t.correct ? (
                        <span className="text-emerald-400">✓ Да</span>
                      ) : (
                        <span className="text-rose-400">✗ Нет</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-slate-400">{t.responseTimeMs} мс</td>
                    <td className="py-1.5 px-2 flex flex-wrap gap-1">
                      {t.ruleSwitchError && (
                        <span className="bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                          rule_switch_error
                        </span>
                      )}
                      {t.selfCorrection && (
                        <span className="bg-teal-900 text-teal-200 px-1.5 py-0.5 rounded text-[10px]">
                          self_correction
                        </span>
                      )}
                      {t.hintUsed && (
                        <span className="bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded text-[10px]">
                          hint_used
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-slate-400">{t.difficultyLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Game #3: Color World Debug Metrics Block */}
      {(activeView === 'COLOR_WORLD' || game3Debug) && (
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-teal-800 mt-4">
          <h3 className="text-teal-300 font-bold mb-3 text-xs uppercase tracking-wider font-sans flex items-center justify-between">
            <span>🎨 Debug: Игра #3 «Цветной мир»</span>
            <span className="text-[10px] bg-teal-900 text-teal-200 px-2 py-0.5 rounded-full font-mono">
              World {game3Debug?.game3CurrentWorld || 1} | Stage {game3Debug?.game3CurrentStage || '1.1'}
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Текущая задача</div>
              <div className="text-teal-200 font-bold truncate">{game3Debug?.game3CurrentTask || '-'}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Попыток / Верно / Ошибок</div>
              <div className="font-bold">
                <span className="text-sky-300">{game3Debug?.game3Attempts || 0}</span> /{' '}
                <span className="text-emerald-400">{game3Debug?.game3Correct || 0}</span> /{' '}
                <span className="text-rose-400">{game3Debug?.game3Errors || 0}</span>
              </div>
            </div>
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Время отклика</div>
              <div className="text-amber-300 font-bold">{game3Debug?.game3ResponseTimeMs || 0} мс</div>
            </div>
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Адаптация / Упрощение</div>
              <div className="text-indigo-300 font-bold">
                L{game3Debug?.game3AdaptationLevel || 1} | {game3Debug?.game3SimplificationUsed ? 'ДА' : 'НЕТ'}
              </div>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Синий цвет представлен</div>
              <div className={game3Debug?.game3BlueIntroduced ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {game3Debug?.game3BlueIntroduced ? '✓ Введен' : '✗ Нет'}
              </div>
            </div>
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Синий цвет опознан</div>
              <div className={game3Debug?.game3BlueRecognized ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {game3Debug?.game3BlueRecognized ? '✓ Опознан' : '✗ Нет'}
              </div>
            </div>
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Урожай / Доставка</div>
              <div className={game3Debug?.game3DeliveryCompleted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {game3Debug?.game3DeliveryCompleted ? '✓ Доставлен' : game3Debug?.game3FruitStageCompleted ? 'Собран' : 'В процессе'}
              </div>
            </div>
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-[10px]">Дом построен</div>
              <div className={game3Debug?.game3HouseCompleted ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {game3Debug?.game3HouseCompleted ? '✓ Построен 🎉' : 'В процессе'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
