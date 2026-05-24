import React, { useState, useEffect } from 'react'
import { deleteEvent, getEvents, updateEvent } from '../api/clients'
import type { Event } from '../api/types'
import CalendarWidget from '../components/CalendarWidget'

interface EditFormState {
  title: string
  description: string
  location: string
  category_id: number
  start_datetime: string
}

const DashboardPage: React.FC<{ searchQuery?: string }> = ({ searchQuery = '' }) => {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedCategories, setSelectedCategories] = useState({
    meeting: true,
    negotiation: true,
    conference: true,
    training: true,
  })

  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate())
  const [viewAllEvents, setViewAllEvents] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    title: '',
    description: '',
    location: '',
    category_id: 1,
    start_datetime: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const toggleCategory = (category: keyof typeof selectedCategories) => {
    setSelectedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getEvents()
      setEvents(response.data)
    }  finally {
      setIsLoading(false)
    }
  }

  const handleOpenEdit = (event: Event) => {
    setEditingEventId(event.id)
    
    // Просто берем строку из события. 
    // Предполагаем, что с бэкенда приходит строка вида "2026-05-24 14:00:00"
    // Нам нужно превратить её в формат инпута "2026-05-24T14:00"
    
    // Заменяем пробел на T и обрезаем секунды, если они есть
    let rawDate = event.start_datetime;
    if (!rawDate) return;

    // Если формат "YYYY-MM-DD HH:mm:ss", меняем пробел на T
    let formattedForInput = rawDate.replace(' ', 'T').slice(0, 16);
    
    setEditForm({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      category_id: event.category_id,
      start_datetime: formattedForInput
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id: number) => {
      if (!window.confirm('Удалить этот документ?')) return
      try {
        await deleteEvent(id)
        await loadEvents()
      } catch (err) {
        setError('Ошибка удаления')
      }
    }

  const handleCloseEdit = () => {
    setIsEditModalOpen(false)
    setEditingEventId(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'category_id' ? Number(value) : value
    }))
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEventId) return

    setIsSaving(true)
    try {
      // editForm.start_datetime сейчас имеет вид "2026-05-24T14:00"
      // Нам нужно отправить на бэкэнд "2026-05-24 14:00:00"
      
      const localDateTimeString = editForm.start_datetime.replace('T', ' ') + ':00';

      // Вычисляем конец события (+1 час) вручную, чтобы не лезть в объекты Date и не ловить сдвиги
      // Парсим дату обратно в объект только для математики, но форматировать будем вручную
      const tempDate = new Date(editForm.start_datetime);
      tempDate.setHours(tempDate.getHours() + 1);
      
      const pad = (n: number) => n.toString().padStart(2, '0');
      const endDateTimeString = 
        `${tempDate.getFullYear()}-${pad(tempDate.getMonth() + 1)}-${pad(tempDate.getDate())} ` +
        `${pad(tempDate.getHours())}:${pad(tempDate.getMinutes())}:00`;

      const payload = {
        title: editForm.title,
        description: editForm.description,
        location: editForm.location,
        category_id: editForm.category_id,
        start_datetime: localDateTimeString, // Отправляем чистую строку
        end_datetime: endDateTimeString,     // Отправляем чистую строку
      }

      await updateEvent(editingEventId, payload)

      // Перезагружаем список, чтобы увидеть изменения
      await loadEvents()

      handleCloseEdit()
    } catch (err: any) {
      console.error('Ошибка сохранения:', err)
      alert('Произошла ошибка при сохранении.')
    } finally {
      setIsSaving(false)
    }
  }

  const categoryMap: Record<number, keyof typeof selectedCategories> = {
    1: 'meeting',
    2: 'negotiation',
    3: 'conference',
    4: 'training'
  }

  const filteredEvents = events.filter(event => {
    const categoryKey = categoryMap[event.category_id]
    const categoryMatch = categoryKey ? selectedCategories[categoryKey] : false
    const q = searchQuery.trim().toLowerCase()
    const searchMatch = q === '' ||
      event.title.toLowerCase().includes(q) ||
      (event.description?.toLowerCase().includes(q) ?? false) ||
      (event.location?.toLowerCase().includes(q) ?? false)
    return categoryMatch && searchMatch
  })

  const displayEvents = filteredEvents.filter(event => {
    if (searchQuery.trim() !== '') return true 
    const eventDate = new Date(event.start_datetime)
    if (!viewAllEvents) {
      return eventDate.getDate() === selectedDate && 
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear()
    }
    return true
  }).sort((a, b) => {
    return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  })

  const getHeaderTitle = () => {
    if (searchQuery.trim() !== '') return `${searchQuery}`
    if (viewAllEvents) return 'Все события'
    
    const selectedDateTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const isPastDate = selectedDateTime < todayStart
    
    return isPastDate ? 'Прошедшие события' : 'Предстоящие события'
  }

  const categoriesConfig = [
    { 
      id: 'meeting' as const, 
      svg: (
        <svg width="10" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="8" height="8" rx="4" fill="#015FAF"/>
        </svg>
      ),
      label: 'Совещание', 
      color: '#015FAF', 
      dbId: 1 
    },
    { 
      id: 'negotiation' as const, 
      svg: (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="12" height="12" rx="6" fill="#05591D"/>
        </svg>
      ),
      label: 'Встреча (переговоры)', 
      color: '#05591D', 
      dbId: 2 
    },
    { 
      id: 'conference' as const, 
      svg: (
        <svg width="10" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="8" height="8" rx="4" fill="#5F4900"/>
        </svg>
      ),
      label: 'Конференция', 
      color: '#5F4900', 
      dbId: 3 
    },
    { 
      id: 'training' as const, 
      svg: (
        <svg width="10" height="10" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="8" height="8" rx="4" fill="#EFC13A"/>
        </svg>
      ),
      label: 'Обучение', 
      color: '#EFC13A', 
      dbId: 4 
    },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date() 
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: date.toLocaleString('ru-RU', { month: 'short' }).toUpperCase(),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      isPast: date < now
    }
  }

  const getCategoryConfig = (categoryId: number) => {
    return categoriesConfig.find(c => c.dbId === categoryId) || categoriesConfig[0]
  }

  const getCategoryBg = (categoryId: number) => {
    const color = getCategoryConfig(categoryId).color
    if (color === '#015FAF') return '#6CAAFF33'
    if (color === '#EFC13A') return '#FFDF9366'
    if (color === '#5F4900') return '#5F49001A'
    if (color === '#05591D') return '#05591D1A'
    return '#EFF4FF'
  }

  const handleViewAll = () => {
    setViewAllEvents(true)
    setSelectedDate(today.getDate())
    setCurrentDate(new Date())
  }

  return (
    <div className="min-h-screen p-[24px] relative">
      <div className="max-w-[1200px] mx-auto">
        
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-[#0B1C30] mb-[4px]">Рабочий стол</h1>
          <p className="text-[16px] text-[#5F4900] leading-relaxed">
            Обзор расписания и предстоящих мероприятий.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-[#FFFFFF] border-[1px] border-[#C0C9BB] rounded-[15px] p-[16px]">
              <h2 className="text-[20px] font-bold text-[#0B1C30] mb-4">Категории</h2>
              
              <div className="space-y-3">
                {categoriesConfig.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories[cat.id]}
                        onChange={() => toggleCategory(cat.id)}
                        className="w-5 h-5 border-2 border-[#05591D] rounded-[4px] appearance-none checked:bg-[#05591D] checked:border-[#05591D] transition-colors"
                      />
                      {selectedCategories[cat.id] && (
                        <svg className="absolute w-3 h-3 text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="w-4 h-4 flex-shrink-0 ">
                      {cat.svg}
                    </div>
                    <span className="text-[14px] text-[#0B1C30] group-hover:text-[#015FAF] transition-colors">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <CalendarWidget
              selectedDate={viewAllEvents ? undefined : new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate)}
              onDateSelect={(date) => {
                setViewAllEvents(false)
                setSelectedDate(date.getDate())
                setCurrentDate(date)
              }}
              showEvents={true}
              events={filteredEvents}
              categoryFilter={Object.fromEntries(
                Object.entries(selectedCategories).map(([key, enabled]) => {
                  const dbId = Object.entries(categoryMap).find(([, v]) => v === key)?.[0]
                  return [Number(dbId), enabled]
                })
              )}
            />

          </div>

          <div className="lg:col-span-8">
            <div className="bg-white border-2 border-[#EFF4FF] rounded-[16px] overflow-hidden">
              
              <div className="flex items-center justify-between px-6 py-4 bg-[#EFF4FF] border-b-2 border-[#EFF4FF]">
                <h2 className="text-[24px] font-bold text-[#0B1C30]">
                  {getHeaderTitle()}
                </h2>
                <button 
                  onClick={handleViewAll}
                  className="text-[14px] font-medium text-[#05591D] hover:text-[#015FAF] transition-colors"
                >
                  Смотреть все
                </button>
              </div>

              {isLoading && <div className="p-12 text-center text-[#5F4900]">Загрузка...</div>}
              {error && <div className="p-12 text-center text-red-600">{error}</div>}
              
              {!isLoading && !error && displayEvents.length === 0 && (
                <div className="p-12 text-center text-[#5F4900]">
                  {viewAllEvents ? 'Нет событий в выбранных категориях.' : 'На этот день событий нет.'}
                </div>
              )}

              {!isLoading && !error && displayEvents.length > 0 && (
                <div className="divide-y divide-[#EFF4FF]">
                  {displayEvents.map((event) => {
                    const { day, month, time, isPast } = formatDate(event.start_datetime)
                    const category = getCategoryConfig(event.category_id)
                    const bg = getCategoryBg(event.category_id)
                    const categoryName = event.category_name || category.label

                    return (
                      <div key={event.id} className={`p-6 transition-colors ${isPast ? 'bg-[#F8F9FA]' : 'hover:bg-[#EFF4FF]'}`}>
                        <div className="flex gap-6">
                          
                          <div className="flex-shrink-0  text-center">
                            <div className={`text-[32px] font-bold leading-none ${isPast ? 'text-[#94A3B8]' : 'text-[#05591D]'}`}>
                              {day}
                            </div>
                            <div className="text-[12px] font-medium text-[#5F4900] mt-1">{month}</div>
                            <div className={`text-[14px] mt-1 ${isPast ? 'text-[#94A3B8]' : 'text-[#5F4900]'}`}>{time}</div>
                            {isPast && <div className="text-[10px] text-[#94A3B8] mt-1 uppercase font-medium tracking-wider">Прошло</div>}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        <div className="px-3 flex py-1 gap-[8px] items-center rounded-[8px] text-[14px] font-bold" style={{ backgroundColor: bg, color: category.color }}>
                                        <div className="w-[8px] h-[8px] flex-shrink-0">
                                            {category.svg}
                                        </div>
                                        <div>
                                            {categoryName}
                                        </div>
                                        </div>

                                        {event.location && (
                                        <div className="flex items-center gap-1 text-[14px] text-[#5F4900] min-w-0">
                                            {event.location === 'Zoom' ? (
                                            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1.16667 9.33333C0.845833 9.33333 0.571181 9.2191 0.342708 8.99063C0.114236 8.76215 0 8.4875 0 8.16667V1.16667C0 0.845833 0.114236 0.571181 0.342708 0.342708C0.571181 0.114236 0.845833 0 1.16667 0H8.16667C8.4875 0 8.76215 0.114236 8.99063 0.342708C9.2191 0.571181 9.33333 0.845833 9.33333 1.16667V3.79167L11.6667 1.45833V7.875L9.33333 5.54167V8.16667C9.33333 8.4875 9.2191 8.76215 8.99063 8.99063C8.76215 9.2191 8.4875 9.33333 8.16667 9.33333H1.16667ZM1.16667 8.16667H8.16667V1.16667H1.16667V8.16667ZM1.16667 8.16667V1.16667V8.16667Z" fill="#40493E"/>
                                            </svg>
                                            ) : (
                                            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.66667 5.83333C4.9875 5.83333 5.26215 5.7191 5.49062 5.49062C5.7191 5.26215 5.83333 4.9875 5.83333 4.66667C5.83333 4.34583 5.7191 4.07118 5.49062 3.84271C5.26215 3.61424 4.9875 3.5 4.66667 3.5C4.34583 3.5 4.07118 3.61424 3.84271 3.84271C3.61424 4.07118 3.5 4.34583 3.5 4.66667C3.5 4.9875 3.61424 5.26215 3.84271 5.49062C4.07118 5.7191 4.34583 5.83333 4.66667 5.83333ZM4.66667 10.1208C5.85278 9.03194 6.73264 8.04271 7.30625 7.15312C7.87986 6.26354 8.16667 5.47361 8.16667 4.78333C8.16667 3.72361 7.82882 2.8559 7.15312 2.18021C6.47743 1.50451 5.64861 1.16667 4.66667 1.16667C3.68472 1.16667 2.8559 1.50451 2.18021 2.18021C1.50451 2.8559 1.16667 3.72361 1.16667 4.78333C1.16667 5.47361 1.45347 6.26354 2.02708 7.15312C2.60069 8.04271 3.48056 9.03194 4.66667 10.1208ZM4.66667 11.6667C3.10139 10.3347 1.93229 9.09757 1.15937 7.95521C0.386458 6.81285 0 5.75556 0 4.78333C0 3.325 0.469097 2.16319 1.40729 1.29792C2.34549 0.432639 3.43194 0 4.66667 0C5.90139 0 6.98785 0.432639 7.92604 1.29792C8.86424 2.16319 9.33333 3.325 9.33333 4.78333C9.33333 5.75556 8.94688 6.81285 8.17396 7.95521C7.40104 9.09757 6.23194 10.3347 4.66667 11.6667Z" fill="#40493E"/>
                                            </svg>
                                            )}
                                            <span className="truncate">{event.location}</span>
                                        </div>
                                        )}
                                    </div>

                                    <h3 className={`text-[18px] font-regular mb-1 truncate ${isPast ? 'text-[#94A3B8] line-through' : 'text-[#0B1C30]'}`}>
                                    {event.title}
                                    </h3>
                                    
                                    {event.description && (
                                    <p className="text-[14px] text-[#5F4900] font-regular leading-relaxed line-clamp-2">{event.description}</p>
                                    )}
                                </div>
                                
                                {!isPast && (
                                   <>
                                    <button
                                      onClick={() => handleDelete(event.id)}
                                      className="p-2 text-[#94A3B8] hover:text-red-600 transition-colors"
                                      title="Удалить событие"
                                      >
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      <line x1="10" y1="11" x2="10" y2="17"></line>
                                      <line x1="14" y1="11" x2="14" y2="17"></line>
                                      </svg>
                                      </button>

                                    <button 
                                        onClick={() => handleOpenEdit(event)}
                                        className="ml-4 p-2 text-[#94A3B8] hover:text-[#015FAF] transition-colors"
                                        title="Редактировать событие"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    </>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/50 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md overflow-hidden border border-[#EFF4FF]">
            
            <div className="px-6 py-4 border-b border-[#EFF4FF] flex justify-between items-center bg-[#EFF4FF]">
              <h3 className="text-[20px] font-bold text-[#0B1C30]">Редактирование события</h3>
              <button onClick={handleCloseEdit} className="text-[#94A3B8] hover:text-[#0B1C30] transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-[14px] font-medium text-[#0B1C30] mb-1">Название</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={editForm.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#C0C9BB] rounded-[8px] focus:outline-none focus:border-[#015FAF] focus:ring-1 focus:ring-[#015FAF] text-[#0B1C30]"
                  placeholder="Введите название события"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-medium text-[#0B1C30] mb-1">Категория</label>
                  <select
                    name="category_id"
                    value={editForm.category_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#C0C9BB] rounded-[8px] focus:outline-none focus:border-[#015FAF] bg-white text-[#0B1C30]"
                  >
                    {categoriesConfig.map(cat => (
                      <option key={cat.dbId} value={cat.dbId}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-[#0B1C30] mb-1">Дата и время</label>
                  <input
                    type="datetime-local"
                    name="start_datetime"
                    required
                    value={editForm.start_datetime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#C0C9BB] rounded-[8px] focus:outline-none focus:border-[#015FAF] text-[#0B1C30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#0B1C30] mb-1">Место проведения</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#C0C9BB] rounded-[8px] focus:outline-none focus:border-[#015FAF] text-[#0B1C30]"
                  placeholder="Например: Переговорная 1 или Zoom"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#0B1C30] mb-1">Описание</label>
                <textarea
                  name="description"
                  rows={3}
                  value={editForm.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#C0C9BB] rounded-[8px] focus:outline-none focus:border-[#015FAF] text-[#0B1C30] resize-none"
                  placeholder="Дополнительная информация..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 text-[14px] font-medium text-[#5F4900] hover:bg-[#EFF4FF] rounded-[8px] transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-[14px] font-medium text-white bg-[#05591D] hover:bg-[#044a18] rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default DashboardPage