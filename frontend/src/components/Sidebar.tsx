import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface MenuItem {
  label: string
  path: string
  icon?: React.ReactNode
}

interface SidebarProps {
  items: MenuItem[]
  isOpen?: boolean
  onClose?: () => void
  onA11yClick?: () => void // Новая пропса
  isA11yEnabled?: boolean // Новая пропса
}

const Sidebar: React.FC<SidebarProps> = ({ items, isOpen = true, onClose, onA11yClick, isA11yEnabled }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
    navigate(path)
    if (window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }

  return (
    <>
      <aside className={`
         bg-white border-r border-gray-200
         lg:static left-0 top-0 z-50 w-[72px]
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
         xl:w-[280px] lg:w-[256px] md:w-[200px] sm:w-[72px]
         flex flex-col justify-between pb-4
      `}>

        <nav className="flex flex-col pt-[12px] gap-[4px]">
          {items.map((item, index) => {
            const isActive = location.pathname === item.path
            
            return (
              <div
                key={index}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center cursor-pointer transition-all duration-200
                  ${isActive 
                    ? 'bg-[#ECFDF5] text-[#047857] border-r-[4px] border-[#047857]' 
                    : 'text-[#64748B] hover:bg-gray-50 hover:text-[#047857] border-transparent'
                  }
                  ml-[8px] mr-[8px] p-[12px]
                  ${isActive ? 'border-r-[4px]' : 'border-r-[4px] border-transparent'}
                `}
              >
                {item.icon && (
                  <span className="flex-shrink-0">
                    {React.cloneElement(item.icon as React.ReactElement, {
                      width: "18",
                      height: "18"
                    })}
                  </span>
                )}
                <span className="hidden text-[14px] font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden transition-opacity duration-200 xl:block lg:block md:block sm:hidden ml-[12px]">
                  {item.label}
                </span>
              </div>
            )
          })}
        </nav>

        {/* КНОПКА ДЛЯ СЛАБОВИДЯЩИХ ВНИЗУ САЙДБАРА */}
        {onA11yClick && (
          <div className="mt-auto px-2">
            <button
              onClick={onA11yClick}
              className={`
                w-full flex items-center justify-center p-3 rounded-md transition-colors
                ${isA11yEnabled ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
              title="Версия для слабовидящих"
              aria-label="Версия для слабовидящих"
            >
              {/* Иконка глаза */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span className="hidden xl:block lg:block md:block sm:hidden ml-2 text-xs font-bold uppercase">
                Для слабовидящих
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar