// components/Header.tsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onSearch?: (query: string) => void
  onNotificationsClick?: () => void
  onHelpClick?: () => void
  onProfileClick?: () => void
  onLogout?: () => void
}

const Header: React.FC<HeaderProps> = ({
  
  onSearch,
  onNotificationsClick,
  onProfileClick,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
    if (query.length > 1) {
      navigate(`/?search=${encodeURIComponent(query)}`)
    }
  }
  return (
    <header className="flex items-center justify-between w-full h-[70px] sm:h-[75px] md:h-[80px] bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 shrink-0">
      
      <Link className="flex items-center gap-2 sm:gap-3 md:gap-4" to={'/'}>
        <div className="flex flex-col min-w-0">
          <h1 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-[#047857] leading-tight truncate">
            Меню
          </h1>
          <span className="text-[9px] sm:text-[10px] md:text-[12px] font-medium text-[#64748B] uppercase tracking-wide">
            ГКУ РБ ИТ
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
        
        <div className={`${isMobileSearchOpen ? 'flex' : 'hidden'} sm:flex absolute sm:relative left-0 right-0 top-[70px] sm:top-0 bg-white sm:bg-transparent px-3 sm:px-0 py-2 sm:py-0 border-b sm:border-0 border-gray-200 z-40`}>
          <div className="relative w-full sm:w-auto max-w-[600px] mx-auto sm:mx-0">
            <input
              type="text"
              placeholder="Поиск мероприятий..."
              autoFocus={isMobileSearchOpen}
              onChange={handleSearch}
              onBlur={() => {
                setTimeout(() => setIsMobileSearchOpen(false), 200)
              }}
              className="w-full h-[40px] sm:h-[42px] sm:w-[280px] md:h-[48px] pl-[36px] sm:pl-[44px] pr-10 sm:pr-4 bg-[#F8FAFC] border border-gray-300 
                       text-[14px] text-[#C0C9BB] placeholder-gray-400
                       focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#ECFDF5]
                       transition-all rounded-lg sm:rounded-none"
            />
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.45 13.5L7.725 8.775C7.35 9.075 6.91875 9.3125 6.43125 9.4875C5.94375 9.6625 5.425 9.75 4.875 9.75C3.5125 9.75 2.35938 9.27813 1.41562 8.33438C0.471875 7.39063 0 6.2375 0 4.875C0 3.5125 0.471875 2.35938 1.41562 1.41562C2.35938 0.471875 3.5125 0 4.875 0C6.2375 0 7.39063 0.471875 8.33438 1.41562C9.27813 2.35938 9.75 3.5125 9.75 4.875C9.75 5.425 9.6625 5.94375 9.4875 6.43125C9.3125 6.91875 9.075 7.35 8.775 7.725L13.5 12.45L12.45 13.5ZM4.875 8.25C5.8125 8.25 6.60938 7.92188 7.26562 7.26562C7.92188 6.60938 8.25 5.8125 8.25 4.875C8.25 3.9375 7.92188 3.14062 7.26562 2.48438C6.60938 1.82812 5.8125 1.5 4.875 1.5C3.9375 1.5 3.14062 1.82812 2.48438 2.48438C1.82812 3.14062 1.5 3.9375 1.5 4.875C1.5 5.8125 1.82812 6.60938 2.48438 7.26562C3.14062 7.92188 3.9375 8.25 4.875 8.25Z" fill="#707A6D"/>
              </svg>
            </div>
            <button 
              onClick={() => setIsMobileSearchOpen(false)}
              className="sm:hidden absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <button 
          onClick={() => setIsMobileSearchOpen(true)}
          className={`sm:hidden p-2 text-[#047857] hover:bg-[#ECFDF5] rounded-lg transition-colors ${isMobileSearchOpen ? 'hidden' : 'block'}`}
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.45 13.5L7.725 8.775C7.35 9.075 6.91875 9.3125 6.43125 9.4875C5.94375 9.6625 5.425 9.75 4.875 9.75C3.5125 9.75 2.35938 9.27813 1.41562 8.33438C0.471875 7.39063 0 6.2375 0 4.875C0 3.5125 0.471875 2.35938 1.41562 1.41562C2.35938 0.471875 3.5125 0 4.875 0C6.2375 0 7.39063 0.471875 8.33438 1.41562C9.27813 2.35938 9.75 3.5125 9.75 4.875C9.75 5.425 9.6625 5.94375 9.4875 6.43125C9.3125 6.91875 9.075 7.35 8.775 7.725L13.5 12.45L12.45 13.5ZM4.875 8.25C5.8125 8.25 6.60938 7.92188 7.26562 7.26562C7.92188 6.60938 8.25 5.8125 8.25 4.875C8.25 3.9375 7.92188 3.14062 7.26562 2.48438C6.60938 1.82812 5.8125 1.5 4.875 1.5C3.9375 1.5 3.14062 1.82812 2.48438 2.48438C1.82812 3.14062 1.5 3.9375 1.5 4.875C1.5 5.8125 1.82812 6.60938 2.48438 7.26562C3.14062 7.92188 3.9375 8.25 4.875 8.25Z" fill="#065F46"/>
          </svg>
        </button>

        <div className={`flex items-center gap-0.5 sm:gap-1 ${isMobileSearchOpen ? 'sm:flex' : 'flex'}`}>
          
          <Link to='/settings'>
            <button
              onClick={onNotificationsClick}
              className="p-1.5 sm:p-2 md:p-3 text-[#047857] hover:bg-[#ECFDF5] rounded-lg transition-colors"
              title="Уведомления"
            >
              <svg width="14" height="14" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 17V15H2V8C2 6.61667 2.41667 5.3875 3.25 4.3125C4.08333 3.2375 5.16667 2.53333 6.5 2.2V1.5C6.5 1.08333 6.64583 0.729167 6.9375 0.4375C7.22917 0.145833 7.58333 0 8 0C8.41667 0 8.77083 0.145833 9.0625 0.4375C9.35417 0.729167 9.5 1.08333 9.5 1.5V2.2C10.8333 2.53333 11.9167 3.2375 12.75 4.3125C13.5833 5.3875 14 6.61667 14 8V15H16V17H0ZM8 20C7.45 20 6.97917 19.8042 6.5875 19.4125C6.19583 19.0208 6 18.55 6 18H10C10 18.55 9.80417 19.0208 9.4125 19.4125C9.02083 19.8042 8.55 20 8 20ZM4 15H12V8C12 6.9 11.6083 5.95833 10.825 5.175C10.0417 4.39167 9.1 4 8 4C6.9 4 5.95833 4.39167 5.175 5.175C4.39167 5.95833 4 6.9 4 8V15Z" fill="#065F46"/>
              </svg>
            </button>
          </Link>

          <div>
            <button
              onClick={onProfileClick}
              className="p-1.5 sm:p-2 md:p-3 text-[#047857] hover:bg-[#ECFDF5] rounded-lg transition-colors flex items-center gap-1 sm:gap-2"
              title="Профиль"
            >
              <svg width="14" height="14" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 2C8.34315 2 7 3.34315 7 5C7 6.65685 8.34315 8 10 8C11.6569 8 13 6.65685 13 5C13 3.34315 11.6569 2 10 2ZM5 5C5 2.23858 7.23858 0 10 0C12.7614 0 15 2.23858 15 5C15 7.76142 12.7614 10 10 10C7.23858 10 5 7.76142 5 5ZM3.77844 13.15C5.77388 12.2555 8.184 12 10 12C11.816 12 14.2261 12.2555 16.2216 13.15C18.2529 14.0606 20 15.722 20 18.5V19.5C20 20.8546 18.9048 22 17.5183 22H2.48169C1.09519 22 0 20.8546 0 19.5V18.5C0 15.722 1.74705 14.0606 3.77844 13.15ZM4.59656 14.975C3.00295 15.6894 2 16.778 2 18.5V19.5C2 19.7821 2.23155 20 2.48169 20H17.5183C17.7684 20 18 19.7821 18 19.5V18.5C18 16.778 16.9971 15.6894 15.4034 14.975C13.7739 14.2445 11.684 14 10 14C8.316 14 6.22612 14.2445 4.59656 14.975Z" fill="#065F46"/>
              </svg>
              <span className="text-[12px] sm:text-[13px] md:text-[14px] font-medium text-[#047857] whitespace-nowrap">
                {localStorage.getItem('name') || 'Профиль'}
              </span>
            </button>

          </div>

        </div>
      </div>
    </header>
  )
}

export default Header