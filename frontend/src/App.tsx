import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

// Импорты страниц
import AuthPage      from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage  from './pages/CalendarPage'
import DocumentsPage from './pages/DocumentsPage'
import ProfilePage   from './pages/ProfilePage'
import SettingsPage  from './pages/SettingsPage'
import ProfileEditPage from './pages/ProfileEditPage'

// Импорты компонентов
import Header        from './components/Header'
import Sidebar       from './components/Sidebar'
import AdminRoute    from './components/AdminRoute'

// Импорты API
import { getRole } from './api/clients'

// --- ТИПЫ И ЛОГИКА ДОСТУПНОСТИ (A11Y) ---

type ColorScheme = 'default' | 'black-white' | 'white-black' | 'blue-beige';
type FontSize = 'normal' | 'large' | 'xlarge';

interface A11yState {
  isEnabled: boolean; // Включен ли режим вообще (применены ли стили)
  colorScheme: ColorScheme;
  fontSize: FontSize;
  imagesEnabled: boolean;
  soundEnabled: boolean;
}

const defaultA11y: A11yState = {
  isEnabled: false,
  colorScheme: 'default',
  fontSize: 'normal',
  imagesEnabled: true,
  soundEnabled: false,
};

function useA11y() {
  const [state, setState] = useState<A11yState>(() => {
    try {
      const saved = localStorage.getItem('a11y-settings');
      return saved ? JSON.parse(saved) : defaultA11y;
    } catch {
      return defaultA11y;
    }
  });

  useEffect(() => {
    localStorage.setItem('a11y-settings', JSON.stringify(state));
    
    // Применяем классы к body ТОЛЬКО если isEnabled === true
    const b = document.body;
    b.classList.remove(
      'a11y-mode', 
      'a11y-black-white', 
      'a11y-white-black', 
      'a11y-blue-beige',
      'a11y-font-large', 
      'a11y-font-xlarge', 
      'a11y-no-images'
    );

    if (!state.isEnabled) return;

    b.classList.add('a11y-mode');
    if (state.colorScheme === 'black-white') b.classList.add('a11y-black-white');
    if (state.colorScheme === 'white-black') b.classList.add('a11y-white-black');
    if (state.colorScheme === 'blue-beige') b.classList.add('a11y-blue-beige');
    if (state.fontSize === 'large') b.classList.add('a11y-font-large');
    if (state.fontSize === 'xlarge') b.classList.add('a11y-font-xlarge');
    if (!state.imagesEnabled) b.classList.add('a11y-no-images');

  }, [state]);

  // Включить/Выключить режим полностью
  const toggleMode = () => setState(p => ({ ...p, isEnabled: !p.isEnabled }));
  
  // Изменить конкретную настройку (автоматически включает режим, если был выключен)
  const setColor = (c: ColorScheme) => setState(p => ({ ...p, colorScheme: c, isEnabled: true }));
  const setSize = (s: FontSize) => setState(p => ({ ...p, fontSize: s, isEnabled: true }));
  const toggleImages = () => setState(p => ({ ...p, imagesEnabled: !p.imagesEnabled, isEnabled: true }));
  const toggleSound = () => setState(p => ({ ...p, soundEnabled: !p.soundEnabled, isEnabled: true }));

  // Сбросить всё к заводским
  const resetDefaults = () => {
    setState(defaultA11y);
  };

  return { state, toggleMode, setColor, setSize, toggleImages, toggleSound, resetDefaults };
}

// --- ФУНКЦИЯ ОЗВУЧИВАНИЯ (TTS) ---

let currentUtterance: SpeechSynthesisUtterance | null = null;

const speakText = (text: string) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 1.0;
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

// --- КОМПОНЕНТ ПАНЕЛИ НАСТРОЕК ---

const A11yPanel = ({ 
  state, 
  onClosePanel, // Просто скрыть панель
  onDisableMode, // Выключить режим полностью
  onColor, onSize, onImg, onSound, onReset 
}: {
  state: A11yState;
  onClosePanel: () => void;
  onDisableMode: () => void;
  onColor: (c: ColorScheme) => void;
  onSize: (s: FontSize) => void;
  onImg: () => void;
  onSound: () => void;
  onReset: () => void;
}) => (
  <div className="w-full bg-white border-b-2 border-gray-300 p-4 shadow-sm animate-slide-down z-50 relative">
    <div className="container mx-auto flex flex-col gap-6">
      
      {/* Верхний ряд: Быстрые настройки */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-700">
          
          {/* Шрифт */}
          <div className="flex items-center gap-2">
            <span>Шрифт:</span>
            <button onClick={() => onSize('normal')} className={`w-8 h-8 border border-gray-400 flex items-center justify-center hover:bg-gray-100 ${state.fontSize === 'normal' ? 'bg-gray-200 font-bold ring-2 ring-[#047857]' : ''}`}>A</button>
            <button onClick={() => onSize('large')} className={`w-10 h-10 border border-gray-400 flex items-center justify-center text-lg hover:bg-gray-100 ${state.fontSize === 'large' ? 'bg-gray-200 font-bold ring-2 ring-[#047857]' : ''}`}>A</button>
            <button onClick={() => onSize('xlarge')} className={`w-12 h-12 border border-gray-400 flex items-center justify-center text-xl hover:bg-gray-100 ${state.fontSize === 'xlarge' ? 'bg-gray-200 font-bold ring-2 ring-[#047857]' : ''}`}>A</button>
          </div>

          {/* Цвет */}
          <div className="flex items-center gap-2">
            <span>Цвет:</span>
            <button onClick={() => onColor('black-white')} className={`w-8 h-8 bg-white border border-black ${state.colorScheme === 'black-white' ? 'ring-2 ring-[#047857] ring-offset-1' : ''}`} title="Черным по белому" />
            <button onClick={() => onColor('white-black')} className={`w-8 h-8 bg-black border border-white ${state.colorScheme === 'white-black' ? 'ring-2 ring-[#047857] ring-offset-1' : ''}`} title="Белым по черному" />
            <button onClick={() => onColor('blue-beige')} className={`w-8 h-8 bg-[#9DD1FF] border border-[#000055] ${state.colorScheme === 'blue-beige' ? 'ring-2 ring-[#047857] ring-offset-1' : ''}`} title="Синим по голубому" />
          </div>

          {/* Изображения */}
          <div className="flex items-center gap-2">
             <span>Изображения:</span>
             <button onClick={onImg} className="px-3 py-1 border border-gray-400 rounded hover:bg-gray-100 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {state.imagesEnabled ? 'Вкл' : 'Выкл'}
             </button>
          </div>

          {/* Звук */}
          <div className="flex items-center gap-2">
             <span>Звук:</span>
             <button onClick={onSound} className={`px-3 py-1 border border-gray-400 rounded hover:bg-gray-100 flex items-center gap-2 ${state.soundEnabled ? 'bg-green-50 border-green-500 text-green-700' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                {state.soundEnabled ? 'Вкл' : 'Выкл'}
             </button>
          </div>

        </div>

        {/* Кнопка "Обычная версия" - ВЫКЛЮЧАЕТ РЕЖИМ ПОЛНОСТЬЮ */}
        <button 
          onClick={onDisableMode} 
          className="flex items-center gap-2 px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-gray-700 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Обычная версия
        </button>
      </div>

      {/* Нижний ряд: Доп настройки и Сброс */}
      <div className="flex justify-end flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
           {/* Кнопка сброса */}
           <button 
             onClick={onReset}
             className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
           >
             Параметры по умолчанию
           </button>
           
           {/* Кнопка "Закрыть панель" - СКРЫВАЕТ ПАНЕЛЬ, НО ОСТАВЛЯЕТ НАСТРОЙКИ */}
           <button 
             onClick={onClosePanel}
             className="px-6 py-2 bg-[#047857] text-white border border-[#047857] rounded hover:bg-[#059669] text-sm font-bold shadow-sm transition-colors"
           >
             Закрыть панель
           </button>
        </div>
      </div>

    </div>
  </div>
);

// --- ЗАЩИЩЕННЫЙ РОУТ ---

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/auth" replace />
}

// --- ОСНОВНОЙ КОМПОНЕНТ APP ---

export default function App() {
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('token')
  const role = getRole()
  
  // Хук доступности
  const { state: a11y, toggleMode, setColor, setSize, toggleImages, toggleSound, resetDefaults } = useA11y();

  // Состояние видимости панели (отдельно от режима)
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('')

  const lastSpokenText = useRef<string>('');

  // Эффект для озвучивания
  useEffect(() => {
    if (!a11y.soundEnabled) {
      window.speechSynthesis.cancel();
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('h1, h2, h3, h4, button, a, .speak-on-hover')) {
        const textToSpeak = target.innerText || target.getAttribute('aria-label');
        if (textToSpeak && textToSpeak !== lastSpokenText.current) {
          lastSpokenText.current = textToSpeak;
          speakText(textToSpeak);
        }
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => document.removeEventListener('mouseover', handleMouseOver);
  }, [a11y.soundEnabled]);

  // Обработчик клика по кнопке "Глаз"
  const handleEyeClick = () => {
    if (!a11y.isEnabled) {
      // Если режим выключен, включаем его и открываем панель
      toggleMode();
      setIsPanelOpen(true);
    } else {
      // Если режим уже включен, просто переключаем видимость панели
      setIsPanelOpen(!isPanelOpen);
    }
  };

  // Меню навигации
  const menuItems = [
    { 
      icon: (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7.5 4.5V0H13.5V4.5H7.5ZM0 7.5V0H6V7.5H0ZM7.5 13.5V6H13.5V13.5H7.5ZM0 13.5V9H6V13.5H0ZM1.5 6H4.5V1.5H1.5V6ZM9 12H12V7.5H9V12ZM9 3H12V1.5H9V3ZM1.5 12H4.5V10.5H1.5V12Z" fill="#64748B"/></svg>), 
      label: 'РАБОЧИЙ СТОЛ', path: '/' 
    },
    ...(role === 'admin' ? [{ 
      icon: (<svg width="14" height="15" viewBox="0 0 14 15" fill="none"><path d="M1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V3C0 2.5875 0.146875 2.23438 0.440625 1.94062C0.734375 1.64687 1.0875 1.5 1.5 1.5H2.25V0H3.75V1.5H9.75V0H11.25V1.5H12C12.4125 1.5 12.7656 1.64687 13.0594 1.94062C13.3531 2.23438 13.5 2.5875 13.5 3V13.5C13.5 13.9125 13.3531 14.2656 13.0594 14.5594C12.7656 14.8531 12.4125 15 12 15H1.5ZM1.5 13.5H12V6H1.5V13.5ZM1.5 4.5H12V3H1.5V4.5Z" fill="#64748B"/></svg>),
      label: 'КАЛЕНДАРЬ', path: '/calendar' 
    }] : []),
    { 
      icon: (<svg width="12" height="15" viewBox="0 0 12 15" fill="none"><path d="M3 12H9V10.5H3V12ZM3 9H9V7.5H3V9ZM1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H7.5L12 4.5V13.5C12 13.9125 11.8531 14.2656 11.5594 14.5594C11.2656 14.8531 10.9125 15 10.5 15H1.5ZM6.75 5.25V1.5H1.5V13.5H10.5V5.25H6.75Z" fill="#64748B"/></svg>),
      label: 'ДОКУМЕНТЫ', path: '/documents' 
    },
    { 
      icon: (<svg width="16" height="15" viewBox="0 0 16 15" fill="none"><path d="M5.475 15L5.175 12.6C5.0125 12.5375 4.85938 12.4625 4.71562 12.375C4.57187 12.2875 4.43125 12.1938 4.29375 12.0938L2.0625 13.0312L0 9.46875L1.93125 8.00625C1.91875 7.91875 1.9125 7.83438 1.9125 7.75313V7.5V7.24687C1.9125 7.16562 1.91875 7.08125 1.93125 6.99375L0 5.53125L2.0625 1.96875L4.29375 2.90625C4.43125 2.80625 4.575 2.7125 4.725 2.625C4.875 2.5375 5.025 2.4625 5.175 2.4L5.475 0H9.6L9.9 2.4C10.0625 2.4625 10.2156 2.5375 10.3594 2.625C10.5031 2.7125 10.6438 2.80625 10.7812 2.90625L13.0125 1.96875L15.075 5.53125L13.1438 6.99375C13.1562 7.08125 13.1625 7.16562 13.1625 7.24687V7.5V7.75313C13.1625 7.83438 13.15 7.91875 13.125 8.00625L15.0562 9.46875L12.9937 13.0312L10.7812 12.0938C10.6438 12.1938 10.5 12.2875 10.35 12.375C10.2 12.4625 10.05 12.5375 9.9 12.6L9.6 15H5.475ZM7.575 10.125C8.3 10.125 8.91875 9.86875 9.43125 9.35625C9.94375 8.84375 10.2 8.225 10.2 7.5C10.2 6.775 9.94375 6.15625 9.43125 5.64375C8.91875 5.13125 8.3 4.875 7.575 4.875C6.8375 4.875 6.21562 5.13125 5.70937 5.64375C5.20312 6.15625 4.95 6.775 4.95 7.5C4.95 8.225 5.20312 8.84375 5.70937 9.35625C6.21562 9.86875 6.8375 10.125 7.575 10.125Z" fill="#64748B"/></svg>),
      label: 'НАСТРОЙКИ', path: '/settings' 
    },
  ]

  const handleProfileClick = () => navigate('/profile')
  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('/event_organizer/backend/profile/index.php', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.role) localStorage.setItem('role', data.role) })
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF]">
      
      {/* Панель настроек (Показывается только если isPanelOpen === true) */}
      {isPanelOpen && (
        <A11yPanel 
          state={a11y}
          onClosePanel={() => setIsPanelOpen(false)} // Просто скрываем
          onDisableMode={() => {
            toggleMode(); // Выключаем режим (сбрасываем стили)
            setIsPanelOpen(false); // Скрываем панель
          }}
          onColor={setColor}
          onSize={setSize}
          onImg={toggleImages}
          onSound={toggleSound}
          onReset={resetDefaults}
        />
      )}

      {/* Хедер */}
      {isAuthenticated && (
        <Header
          onSearch={setSearchQuery}
          onNotificationsClick={() => {}}
          onHelpClick={() => {}}
          onProfileClick={handleProfileClick}
          onLogout={handleLogout}
          onA11yClick={handleEyeClick} // Используем новую логику
        />
      )}
      
      {/* Основной контент */}
      <div className="flex flex-1">
        {isAuthenticated && (
          <Sidebar 
            items={menuItems} 
            onA11yClick={handleEyeClick} // Используем новую логику
            isA11yEnabled={a11y.isEnabled}
          />
        )}
        
        <main className="flex-1 bg-[#F8F9FF] overflow-auto" id="main-content">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<PrivateRoute><DashboardPage searchQuery={searchQuery} /></PrivateRoute>} />
            <Route path="/calendar" element={<AdminRoute><CalendarPage /></AdminRoute>} />
            <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
            <Route path="/profile/edit" element={<PrivateRoute><ProfileEditPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}