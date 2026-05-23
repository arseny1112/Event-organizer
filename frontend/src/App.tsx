import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AuthPage      from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage  from './pages/CalendarPage'
import DocumentsPage from './pages/DocumentsPage'
import ProfilePage   from './pages/ProfilePage'
import SettingsPage  from './pages/SettingsPage'
import Header        from './components/Header'
import Sidebar       from './components/Sidebar'
import ProfileEditPage from './pages/ProfileEditPage'
import AdminRoute from './components/AdminRoute'
import { getRole } from './api/clients'

// --- ТИПЫ И ЛОГИКА ДОСТУПНОСТИ ---

type ColorScheme = 'default' | 'black-white' | 'white-black' | 'blue-beige';
type FontSize = 'normal' | 'large' | 'xlarge';

interface A11yState {
  isEnabled: boolean;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  imagesEnabled: boolean;
}

const defaultA11y: A11yState = {
  isEnabled: false,
  colorScheme: 'default',
  fontSize: 'normal',
  imagesEnabled: true,
};

function useA11y() {
  const [state, setState] = useState<A11yState>(() => {
    const saved = localStorage.getItem('a11y-settings');
    return saved ? JSON.parse(saved) : defaultA11y;
  });

  useEffect(() => {
    localStorage.setItem('a11y-settings', JSON.stringify(state));
    
    // Применяем классы к body
    const b = document.body;
    b.classList.remove(
      'a11y-mode', 'a11y-black-white', 'a11y-white-black', 'a11y-blue-beige',
      'a11y-font-large', 'a11y-font-xlarge', 'a11y-no-images'
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

  const toggle = () => setState(p => ({ ...p, isEnabled: !p.isEnabled }));
  const setColor = (c: ColorScheme) => setState(p => ({ ...p, colorScheme: c, isEnabled: true }));
  const setSize = (s: FontSize) => setState(p => ({ ...p, fontSize: s, isEnabled: true }));
  const toggleImages = () => setState(p => ({ ...p, imagesEnabled: !p.imagesEnabled }));

  return { state, toggle, setColor, setSize, toggleImages };
}

// --- КОМПОНЕНТ ПАНЕЛИ НАСТРОЕК (Появляется сверху) ---

const A11yPanel = ({ 
  state, onClose, onColor, onSize, onImg 
}: {
  state: A11yState;
  onClose: () => void;
  onColor: (c: ColorScheme) => void;
  onSize: (s: FontSize) => void;
  onImg: () => void;
}) => (
  <div className="a11y-panel fixed top-0 left-0 right-0 z-[9999] p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
    <div className="font-bold text-lg uppercase">Настройки для слабовидящих</div>
    <div className="flex flex-wrap items-center gap-4">
      
      {/* Шрифт */}
      <div className="flex gap-2">
        <button onClick={() => onSize('normal')} className={`w-8 h-8 border border-black ${state.fontSize === 'normal' ? 'bg-black text-white' : ''}`}>A</button>
        <button onClick={() => onSize('large')} className={`w-10 h-10 border border-black text-lg ${state.fontSize === 'large' ? 'bg-black text-white' : ''}`}>A</button>
        <button onClick={() => onSize('xlarge')} className={`w-12 h-12 border border-black text-xl ${state.fontSize === 'xlarge' ? 'bg-black text-white' : ''}`}>A</button>
      </div>

      {/* Цвет */}
      <div className="flex gap-2">
        <button onClick={() => onColor('black-white')} className="w-8 h-8 bg-white border border-black" title="Черным по белому" />
        <button onClick={() => onColor('white-black')} className="w-8 h-8 bg-black border border-white" title="Белым по черному" />
        <button onClick={() => onColor('blue-beige')} className="w-8 h-8 bg-[#9DD1FF] border border-[#000055]" title="Синим по голубому" />
      </div>

      {/* Картинки */}
      <button onClick={onImg} className="px-3 py-1 border border-black hover:bg-gray-100">
        {state.imagesEnabled ? 'Скрыть картинки' : 'Показать картинки'}
      </button>

      {/* Выход */}
      <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white border border-red-800 hover:bg-red-700">
        Обычная версия
      </button>
    </div>
  </div>
);

// --- ОСНОВНОЙ APP ---

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/auth" replace />
}

export default function App() {
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('token')
  const role = getRole()
  
  // Хук доступности
  const { state: a11y, toggle: toggleA11y, setColor, setSize, toggleImages } = useA11y();

  const [searchQuery, setSearchQuery] = useState('')

  // Меню с добавленной кнопкой "Глаз" в конце (или можно вынести в отдельный рендер в Sidebar)
  // Но лучше передать пропсы в Sidebar, чтобы он отрисовал кнопку внизу.
  // Для простоты сейчас добавим кнопку прямо в Sidebar через пропсы, если доработаешь Sidebar.
  // А пока - оставим кнопку в Header или добавим сюда.
  
  // Доработаем Sidebar ниже, а пока передадим ему дополнительные пропсы
  
  const menuItems = [
    { 
      icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7.5 4.5V0H13.5V4.5H7.5ZM0 7.5V0H6V7.5H0ZM7.5 13.5V6H13.5V13.5H7.5ZM0 13.5V9H6V13.5H0ZM1.5 6H4.5V1.5H1.5V6ZM9 12H12V7.5H9V12ZM9 3H12V1.5H9V3ZM1.5 12H4.5V10.5H1.5V12Z" fill="#64748B"/></svg>, 
      label: 'РАБОЧИЙ СТОЛ', path: '/' 
    },
    ...(role === 'admin' ? [{ 
      icon: <svg width="14" height="15" viewBox="0 0 14 15" fill="none"><path d="M1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V3C0 2.5875 0.146875 2.23438 0.440625 1.94062C0.734375 1.64687 1.0875 1.5 1.5 1.5H2.25V0H3.75V1.5H9.75V0H11.25V1.5H12C12.4125 1.5 12.7656 1.64687 13.0594 1.94062C13.3531 2.23438 13.5 2.5875 13.5 3V13.5C13.5 13.9125 13.3531 14.2656 13.0594 14.5594C12.7656 14.8531 12.4125 15 12 15H1.5ZM1.5 13.5H12V6H1.5V13.5ZM1.5 4.5H12V3H1.5V4.5Z" fill="#64748B"/></svg>,
      label: 'КАЛЕНДАРЬ', path: '/calendar' 
    }] : []),
    { 
      icon: <svg width="12" height="15" viewBox="0 0 12 15" fill="none"><path d="M3 12H9V10.5H3V12ZM3 9H9V7.5H3V9ZM1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H7.5L12 4.5V13.5C12 13.9125 11.8531 14.2656 11.5594 14.5594C11.2656 14.8531 10.9125 15 10.5 15H1.5ZM6.75 5.25V1.5H1.5V13.5H10.5V5.25H6.75Z" fill="#64748B"/></svg>,
      label: 'ДОКУМЕНТЫ', path: '/documents' 
    },
    { 
      icon: <svg width="16" height="15" viewBox="0 0 16 15" fill="none"><path d="M5.475 15L5.175 12.6C5.0125 12.5375 4.85938 12.4625 4.71562 12.375C4.57187 12.2875 4.43125 12.1938 4.29375 12.0938L2.0625 13.0312L0 9.46875L1.93125 8.00625C1.91875 7.91875 1.9125 7.83438 1.9125 7.75313V7.5V7.24687C1.9125 7.16562 1.91875 7.08125 1.93125 6.99375L0 5.53125L2.0625 1.96875L4.29375 2.90625C4.43125 2.80625 4.575 2.7125 4.725 2.625C4.875 2.5375 5.025 2.4625 5.175 2.4L5.475 0H9.6L9.9 2.4C10.0625 2.4625 10.2156 2.5375 10.3594 2.625C10.5031 2.7125 10.6438 2.80625 10.7812 2.90625L13.0125 1.96875L15.075 5.53125L13.1438 6.99375C13.1562 7.08125 13.1625 7.16562 13.1625 7.24687V7.5V7.75313C13.1625 7.83438 13.15 7.91875 13.125 8.00625L15.0562 9.46875L12.9937 13.0312L10.7812 12.0938C10.6438 12.1938 10.5 12.2875 10.35 12.375C10.2 12.4625 10.05 12.5375 9.9 12.6L9.6 15H5.475ZM7.575 10.125C8.3 10.125 8.91875 9.86875 9.43125 9.35625C9.94375 8.84375 10.2 8.225 10.2 7.5C10.2 6.775 9.94375 6.15625 9.43125 5.64375C8.91875 5.13125 8.3 4.875 7.575 4.875C6.8375 4.875 6.21562 5.13125 5.70937 5.64375C5.20312 6.15625 4.95 6.775 4.95 7.5C4.95 8.225 5.20312 8.84375 5.70937 9.35625C6.21562 9.86875 6.8375 10.125 7.575 10.125Z" fill="#64748B"/></svg>,
      label: 'НАСТРОЙКИ', path: '/settings' 
    },
  ]

  const handleProfileClick = () => navigate('/profile')
  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  }

  useEffect(() => {
    // Проверка роли при загрузке
    const token = localStorage.getItem('token');
    if (token) {
       fetch('/event_organizer/backend/profile/index.php', {
         headers: { 'Authorization': `Bearer ${token}` }
       })
       .then(r => r.ok ? r.json() : null)
       .then(data => { if (data?.role) localStorage.setItem('role', data.role) })
       .catch(() => {});
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF]">
      
      {/* Панель настроек (видна только если режим включен) */}
      {a11y.isEnabled && (
        <A11yPanel 
          state={a11y}
          onClose={toggleA11y}
          onColor={setColor}
          onSize={setSize}
          onImg={toggleImages}
        />
      )}


{isAuthenticated && (
  <Header
    onSearch={setSearchQuery}
    onNotificationsClick={() => {}}
    onHelpClick={() => {}}
    onProfileClick={handleProfileClick}
    onLogout={handleLogout}
    onA11yClick={toggleA11y} // <-- ДОБАВИТЬ ЭТУ СТРОКУ
  />
)}
      
      <div className="flex flex-1">
        {isAuthenticated && (
          <Sidebar 
            items={menuItems} 
            // Передаем функцию включения режима в Sidebar
            onA11yClick={toggleA11y}
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