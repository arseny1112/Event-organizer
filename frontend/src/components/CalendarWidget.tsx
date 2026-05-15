// src/components/CalendarWidget.tsx
import React, { useState, useMemo, useEffect } from 'react'
import type { Event } from '../api/types'

export interface CalendarWidgetProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  showEvents?: boolean
  events?: Event[]
  minDate?: Date
  categoryFilter?: Record<number, boolean>
  className?: string
}

const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const categoriesConfig = [
  { dbId: 1, color: '#015FAF', svg: <rect width="8" height="8" rx="4" fill="#015FAF"/> },
  { dbId: 2, color: '#05591D', svg: <rect width="12" height="12" rx="6" fill="#05591D"/> },
  { dbId: 3, color: '#5F4900', svg: <rect width="8" height="8" rx="4" fill="#5F4900"/> },
  { dbId: 4, color: '#EFC13A', svg: <rect width="8" height="8" rx="4" fill="#EFC13A"/> },
]

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate,
  onDateSelect,
  showEvents = true,
  events = [],
  minDate,
  categoryFilter,
  className = '',
}) => {
  const today = new Date()
  
  // 🔥 Инициализируем currentDate корректно
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    }
    return new Date()
  })

  // 🔥 Синхронизируем месяц только если selectedDate изменилась и валидна
  useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
  }, [selectedDate])

  const isDateDisabled = (date: Date) => {
    if (!minDate) return false
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    return d < min
  }

  const generateCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // 🔥 Проверка на валидность даты
    if (isNaN(year) || isNaN(month)) {
      return []
    }
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const firstDayOfWeek = firstDayOfMonth.getDay() || 7
    
    const days: Array<{
      date: Date
      isCurrentMonth: boolean
      eventColors: string[]
      isSelected: boolean
      isToday: boolean
      isDisabled: boolean
    }> = []

    // Дни предыдущего месяца
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const day = prevMonthLastDay - i + 1
      const date = new Date(year, month - 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        eventColors: [],
        isSelected: false,
        isToday: false,
        isDisabled: true,
      })
    }

    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = selectedDate ? date.toDateString() === selectedDate.toDateString() : false
      const isDisabled = isDateDisabled(date)

      // Собираем цвета событий для этого дня
      const dayEvents = showEvents ? events.filter(event => {
        const eventDate = new Date(event.start_datetime)
        const categoryAllowed = categoryFilter 
          ? (categoryFilter[event.category_id] ?? false)
          : true
        return categoryAllowed &&
               eventDate.getDate() === day && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year
      }) : []
      
      const eventColors = Array.from(new Set(dayEvents.map(e => {
        const cat = categoriesConfig.find(c => c.dbId === e.category_id)
        return cat?.color
      }).filter(Boolean))) as string[]

      days.push({ date, isCurrentMonth: true, eventColors, isSelected, isToday, isDisabled })
    }

    // Дни следующего месяца (добиваем до 6 рядов)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        eventColors: [],
        isSelected: false,
        isToday: false,
        isDisabled: true,
      })
    }

    return days
  }, [currentDate, selectedDate, events, showEvents, categoryFilter, minDate, today])

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDayClick = (date: Date) => {
    if (isDateDisabled(date) || !onDateSelect) return
    onDateSelect(date)
  }

  return (
    <div className={`bg-[#FFFFFF] border-[1px] border-[#C0C9BB] rounded-[15px] p-[16px] ${className}`}>
      {/* Header */}
      <div className="flex items-center border-b-[1px] border-[#C0C9BB] pb-[8px] justify-between mb-4">
        <h2 className="text-[20px] font-bold text-[#0B1C30]">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth} 
            className="w-6 h-6 flex items-center justify-center text-[#5F4900] hover:text-[#015FAF] transition-colors disabled:opacity-30"
            disabled={minDate && currentDate <= new Date(minDate.getFullYear(), minDate.getMonth(), 1)}
          >
            ‹
          </button>
          <button 
            onClick={nextMonth} 
            className="w-6 h-6 flex items-center justify-center text-[#5F4900] hover:text-[#015FAF] transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-[12px] font-medium text-[#94A3B8] py-1">{day}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {generateCalendarDays.map((dayObj, index) => {
          const hasEvents = dayObj.eventColors.length > 0
          const isClickable = dayObj.isCurrentMonth && !dayObj.isDisabled && !!onDateSelect

          return (
            <div 
              key={index}
              onClick={() => isClickable && handleDayClick(dayObj.date)}
              className={`
                relative flex flex-col items-center justify-center py-1 rounded-lg transition-all
                ${dayObj.isSelected 
                  ? 'bg-[#6CAAFF33] border-[1px] border-[#015FAF] font-semibold' 
                  : dayObj.isToday
                  ? 'bg-[#EFF4FF] border-[1.5px] border-[#015FAF] font-semibold'
                  : isClickable
                  ? 'hover:bg-[#EFF4FF] border-[1px] border-transparent cursor-pointer'
                  : 'border-[1px] border-transparent'
                }
                ${!dayObj.isCurrentMonth ? 'text-[#C0C9BB]' : 'text-[#0B1C30]'}
                ${dayObj.isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
              `}
              style={{ 
                minHeight: '0',
                height: 'calc((250px - 6px) / 6)'
              }}
              title={dayObj.isDisabled ? 'Дата недоступна для выбора' : undefined}
            >
              <span className="text-[14px] leading-none">{dayObj.date.getDate()}</span>
              
              {/* Индикаторы событий — только если showEvents=true */}
              {showEvents && hasEvents && (
                <div className="flex gap-1 mt-1">
                  {dayObj.eventColors.slice(0, 3).map((color, idx) => (
                    <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarWidget