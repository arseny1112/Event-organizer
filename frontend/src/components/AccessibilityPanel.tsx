import { Eye } from 'lucide-react'; // Или любая другая иконка
import { useAccessibility } from '../hooks/useAccessibility';

export const AccessibilityPanel = () => {
  const { state, toggleMode, setColorScheme, setFontSize, toggleImages } = useAccessibility();

  if (!state.isEnabled) {
    return (
      <button
        onClick={toggleMode}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition"
        aria-label="Включить версию для слабовидящих"
      >
        <Eye size={20} />
        <span className="hidden sm:inline">Версия для слабовидящих</span>
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-white border-b-2 border-black p-4 shadow-lg">
      <div className="container mx-auto flex flex-wrap gap-4 items-center justify-between">
        <div className="font-bold text-lg">Настройки для слабовидящих</div>
        
        <div className="flex flex-wrap gap-4">
          {/* Размер шрифта */}
          <div className="flex gap-2">
            <button onClick={() => setFontSize('normal')} className={`px-2 py-1 border ${state.fontSize === 'normal' ? 'bg-black text-white' : ''}`}>A</button>
            <button onClick={() => setFontSize('large')} className={`px-2 py-1 border text-lg ${state.fontSize === 'large' ? 'bg-black text-white' : ''}`}>A</button>
            <button onClick={() => setFontSize('xlarge')} className={`px-2 py-1 border text-xl ${state.fontSize === 'xlarge' ? 'bg-black text-white' : ''}`}>A</button>
          </div>

          {/* Цветовая схема */}
          <div className="flex gap-2">
            <button onClick={() => setColorScheme('black-white')} className="w-8 h-8 bg-white border border-black" title="Черным по белому" />
            <button onClick={() => setColorScheme('white-black')} className="w-8 h-8 bg-black border border-white" title="Белым по черному" />
            <button onClick={() => setColorScheme('blue-beige')} className="w-8 h-8 bg-[#9dd1ff] border border-[#000055]" title="Синим по голубому" />
          </div>

          {/* Изображения */}
          <button onClick={toggleImages} className="px-3 py-1 border border-black hover:bg-gray-100">
            {state.imagesEnabled ? 'Скрыть изображения' : 'Показать изображения'}
          </button>

          {/* Выкл */}
          <button onClick={toggleMode} className="px-3 py-1 bg-red-600 text-white hover:bg-red-700">
            Обычная версия
          </button>
        </div>
      </div>
    </div>
  );
};