// components/Sidebar.tsx
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
}

const Sidebar: React.FC<SidebarProps> = ({ items, isOpen = true, onClose }) => {
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
      {/* Сайдбар */}
      <aside className={`
         bg-white border-r border-gray-200
         lg:static left-0 top-0 z-50 w-[72px]
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
         xl:w-[280px] lg:w-[256px] md:w-[200px] sm:w-[72px]
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
      </aside>
    </>
  )
}

export default Sidebar