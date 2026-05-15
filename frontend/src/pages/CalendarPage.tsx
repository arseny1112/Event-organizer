import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent, getSettings, updateSettings } from '../api/clients'
import CalendarWidget from '../components/CalendarWidget'

const VK_GROUP_ID = '238638283'
const VK_DIALOG_URL = `https://vk.com/im?sel=-${VK_GROUP_ID}&message=Привязать уведомления`
const VK_COMMAND_TEXT = 'Привязать уведомления'

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined)
  
  // 🔥 Состояние для показа/скрытия календаря
  const [showCalendar, setShowCalendar] = useState(false)
  const dateFieldRef = useRef<HTMLDivElement>(null)

  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  // В начале компонента, после других useState
  const [now, setNow] = useState<Date>(new Date());

  // Обновляем "текущее время" каждую минуту, чтобы валидация была актуальной
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // 🔥 Закрытие календаря при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFieldRef.current && !dateFieldRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  // Форматируем отображаемое значение
  const displayValue = useMemo(() => {
    if (!dateValue && !timeValue) return '';
    const datePart = dateValue || 'mm/dd/yyyy';
    const timePart = timeValue ? timeValue.replace(':', '--') + ' --' : '--:-- --';
    return `${datePart}, ${timePart}`;
  }, [dateValue, timeValue]);

  // Скрытые инпуты для реального выбора
  const hiddenDateRef = useRef<HTMLInputElement>(null);
  const hiddenTimeRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (!dateValue) {
      hiddenDateRef.current?.showPicker?.();
    } else if (!timeValue) {
      hiddenTimeRef.current?.showPicker?.();
    }
  };

  // Форма события
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    category: '',
    location: '',
    description: '',
  })

  useEffect(() => {
    if (formData.date) {
      const [y, m, d] = formData.date.split('-').map(Number)
      setSelectedCalendarDate(new Date(y, m - 1, d))
    }
  }, [formData.date])
  
  // 🔥 Проверка: выбрано ли время в прошлом
  const isPastEvent = useMemo(() => {
    if (!formData.date || !formData.time) return false;
    
    // Парсим выбранную дату и время
    const [year, month, day] = formData.date.split('-').map(Number);
    const [hours, minutes] = formData.time.split(':').map(Number);
    
    const selected = new Date(year, month - 1, day, hours, minutes);
    return selected < now;
  }, [formData.date, formData.time, now]);

  // 🔥 Настройки уведомлений (синхронизируются с сервером)
  const [vkEnabled, setVkEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [email, setEmail] = useState('')
  const [showVkModal, setShowVkModal] = useState(false)

  // 🔥 Загружаем настройки при монтировании
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await getSettings()
      const settings = response.data
      
      setVkEnabled(!!settings.vk_notify)
      setEmailEnabled(!!settings.email_notify)
      
      // Email берём из настроек ИЛИ из localStorage (если в БД пусто)
      const savedEmail = settings.email || localStorage.getItem('email') || ''
      setEmail(savedEmail)
    } catch (err) {
      console.error('Load settings error:', err)
      // Fallback: берём из localStorage
      setEmail(localStorage.getItem('email') || '')
    }
  }

  // 🔥 Сохраняем настройки уведомлений (отдельная функция)
  const saveNotificationSettings = async () => {
    try {
      setIsSavingSettings(true)
      await updateSettings({
        vk_notify: vkEnabled,
        email_notify: emailEnabled,
        email: email,
        notify_day_before: true,
        notify_hour_before: true,
        vk_id: null, // Не меняем vk_id здесь
      })
      // Сохраняем email локально для быстрого доступа
      if (email) {
        localStorage.setItem('email', email)
      }
    } catch (err) {
      console.error('Save notification settings error:', err)
      setError('Не удалось сохранить настройки уведомлений')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleVkToggle = async () => {
    if (!vkEnabled) {
      setShowVkModal(true)
    } else {
      setVkEnabled(false)
  
      try {
        setIsSavingSettings(true)
  
        await updateSettings({
          vk_notify: false,
          email_notify: emailEnabled,
          email: email,
          notify_day_before: true,
          notify_hour_before: true,
          vk_id: null,
        })
      } catch (err) {
        console.error('VK disable error:', err)
      } finally {
        setIsSavingSettings(false)
      }
    }
  }

  // 🔥 Подтверждение привязки VK
  const handleVkModalConfirm = async () => {
    setVkEnabled(true)
    setShowVkModal(false)
  
    window.open(VK_DIALOG_URL, '_blank')
  
    try {
      setIsSavingSettings(true)
  
      await updateSettings({
        vk_notify: true,
        email_notify: emailEnabled,
        email: email,
        notify_day_before: true,
        notify_hour_before: true,
        vk_id: null,
      })
    } catch (err) {
      console.error('VK save error:', err)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const copyVkCommand = async () => {
    try {
      await navigator.clipboard.writeText(VK_COMMAND_TEXT)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
  
    if (!formData.title || !formData.date || !formData.time) {
      setError('Заполните название, дату и время')
      setIsLoading(false)
      return
    }
  
    // 🔥 Блокируем создание события в прошлом
    if (isPastEvent) {
      setError('Нельзя создать событие на прошедшее время')
      setIsLoading(false)
      return
    }
  
    try {
      const startDatetime = `${formData.date} ${formData.time}:00`
      
      await createEvent({
        title: formData.title,
        start_datetime: startDatetime,
        end_datetime: startDatetime,
        category_id: formData.category ? Number(formData.category) : 1,
        description: formData.description,
        location: formData.location,
      })
  
      await saveNotificationSettings()
      
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при создании события')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-[24px]">
      <div>
        
        {/* Header Section */}
        <div className="mb-[32px]">
          <a href="/calendar" className="flex items-center gap-2 text-[#05591D] text-sm font-medium mb-[12px] hover:underline cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Назад к календарю
          </a>
          <h1 className="text-[32px] font-bold text-[#0B1C30]">
            Создание события
          </h1>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form Fields */}
          <div className="max-h-[483px] lg:col-span-8 bg-white p-[24px] rounded-[15px] shadow-sm border border-[#C0C9BB]">
            <form onSubmit={handleSubmit} className="gap-[24px] flex flex-col">
              
              {/* Event Name */}
              <div>
                <label className="block text-xs font-semibold text-[#40493E] uppercase tracking-wider mb-3">
                  Название события
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Введите название..."
                  className="w-full text-[16px] placeholder-[#C0C9BB] border-b-[1px] border-[#C0C9BB] focus:border-[#05591D] outline-none pb-2 transition-colors bg-transparent"
                />
              </div>

              {/* Date & Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-[#40493E] uppercase tracking-wider mb-3">
                    Дата и время
                  </label>
                  
                  {/* 🔥 Контейнер для поля даты с рефом */}
                  <div ref={dateFieldRef} className="relative">
                    <div className="flex gap-3 border-b-[1px] border-[#C0C9BB]">
                      {/* Иконка календаря + поле даты */}
                      <div 
                        className="relative flex items-center focus-within:border-[#05591D] transition-colors w-32 cursor-pointer"
                        onClick={() => setShowCalendar(true)}
                      >
                        <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V0H5V2H13V0H15V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6ZM2 6V4V6Z" fill="#C0C9BB"/>
                        </svg>

                        <input
                          name="date"
                          type="text"
                          value={formData.date || ''}
                          readOnly
                          placeholder="mm/dd/yyyy"
                          className="w-full ml-[15px] text-[16px] text-[#0B1C30] py-2 outline-none bg-transparent cursor-pointer"
                          onClick={() => setShowCalendar(true)}
                        />
                      </div>

                      {/* Поле времени */}
                      <div 
                        className="relative flex items-center focus-within:border-[#05591D] transition-colors w-32 cursor-pointer"
                        onClick={(e) => {
                          const input = (e.currentTarget.querySelector('input') as HTMLInputElement);
                          if (input) {
                            input.showPicker?.();
                            input.focus();
                          }
                        }}
                      >
                        <input
                          name="time"
                          type="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          className="w-full text-[16px] text-[#0B1C30] py-2 outline-none bg-transparent [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                        />
                      </div>
                    </div>

                    {/* 🔥 КАЛЕНДАРЬ-ПОПАП (появляется при showCalendar=true) */}
                    {showCalendar && (
                      <div className="absolute top-[-126px] w-full left-0 mt-2 z-50 shadow-xl">
                        <CalendarWidget
                          selectedDate={selectedCalendarDate}
                          onDateSelect={(date) => {
                            // Форматируем в YYYY-MM-DD для input type="date"
                            const yyyy = date.getFullYear()
                            const mm = String(date.getMonth() + 1).padStart(2, '0')
                            const dd = String(date.getDate()).padStart(2, '0')
                            setFormData(prev => ({ ...prev, date: `${dd}/${mm}/${yyyy}` }))
                            setShowCalendar(false) // Закрываем после выбора
                          }}
                          showEvents={false}  // 🔥 Без индикаторов событий
                          minDate={new Date()} // 🔥 Блокируем прошедшие даты
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#40493E] uppercase tracking-wider mb-3">
                    Категория
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full text-[16px] text-[#0B1C30] border-b-[1px] border-[#C0C9BB] focus:border-[#05591D] outline-none pb-2 transition-colors bg-transparent appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Выберите категорию</option>
                      <option value="1">Совещание</option>
                      <option value="2">Встреча (переговоры)</option>
                      <option value="3">Конференция</option>
                      <option value="4">Обучение</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C0C9BB] pointer-events-none">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-[#40493E] uppercase tracking-wider mb-3">
                  Место проведения
                </label>
                <div className="relative flex items-center border-b-[1px] border-[#C0C9BB] focus-within:border-[#05591D] transition-colors">
                  <svg className="flex-shrink-0 mr-3 text-[#C0C9BB]" width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="currentColor"/>
                  </svg>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Укажите кабинет, адрес или ссылку..."
                    className="w-full text-[16px] text-[#0B1C30] placeholder-[#C0C9BB] py-2 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#40493E] uppercase tracking-wider mb-3">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Добавьте детали события..."
                  rows={4}
                  className="w-full text-[16px] max-h-[122px] text-[#0B1C30] placeholder-[#C0C9BB] border-2 border-[#E2E8F0] rounded-[12px] focus:border-[#05591D] outline-none p-4 transition-colors resize-none"
                />
              </div>

            </form>
          </div>

          {/* Right Column: Notifications & Actions */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 🔥 Notifications Card (как в SettingsPage) */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-[#C0C9BB]">
              <h3 className="text-[20px] font-bold text-[#0B1C30] mb-4">
                Напоминания
              </h3>
              
              <div className="bg-[#E8F0FE] py-[3px] px-[12px] mb-6 border-l-2 border-[#015FAF]">
                <p className="text-[14px] text-[#0B1C30] leading-relaxed">
                  Автоматически будут отправлены уведомления за 1 день и за 1 час до начала события
                </p>
              </div>

              {/* VK Toggle */}
              <div className="flex items-center justify-between mb-[12px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[#015FAF] flex items-center justify-center text-[#015FAF]">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 6.70833C0 5.31944 0.309028 4.04514 0.927083 2.88542C1.54514 1.72569 2.375 0.763889 3.41667 0L4.39583 1.33333C3.5625 1.94444 2.89931 2.71528 2.40625 3.64583C1.91319 4.57639 1.66667 5.59722 1.66667 6.70833H0ZM15 6.70833C15 5.59722 14.7535 4.57639 14.2604 3.64583C13.7674 2.71528 13.1042 1.94444 12.2708 1.33333L13.25 0C14.2917 0.763889 15.1215 1.72569 15.7396 2.88542C16.3576 4.04514 16.6667 5.31944 16.6667 6.70833H15ZM1.66667 14.2083V12.5417H3.33333V6.70833C3.33333 5.55556 3.68056 4.53125 4.375 3.63542C5.06944 2.73958 5.97222 2.15278 7.08333 1.875V1.29167C7.08333 0.944444 7.20486 0.649306 7.44792 0.40625C7.69097 0.163194 7.98611 0.0416667 8.33333 0.0416667C8.68056 0.0416667 8.97569 0.163194 9.21875 0.40625C9.46181 0.649306 9.58333 0.944444 9.58333 1.29167V1.875C10.6944 2.15278 11.5972 2.73958 12.2917 3.63542C12.9861 4.53125 13.3333 5.55556 13.3333 6.70833V12.5417H15V14.2083H1.66667ZM8.33333 16.7083C7.875 16.7083 7.48264 16.5451 7.15625 16.2188C6.82986 15.8924 6.66667 15.5 6.66667 15.0417H10C10 15.5 9.83681 15.8924 9.51042 16.2188C9.18403 16.5451 8.79167 16.7083 8.33333 16.7083ZM5 12.5417H11.6667V6.70833C11.6667 5.79167 11.3403 5.00694 10.6875 4.35417C10.0347 3.70139 9.25 3.375 8.33333 3.375C7.41667 3.375 6.63194 3.70139 5.97917 4.35417C5.32639 5.00694 5 5.79167 5 6.70833V12.5417Z" fill="#0077FF"/>
                    </svg>
                  </div>
                  <span className="text-[14px] font-medium text-[#0B1C30]">VK</span>
                </div>
                
                <button 
                  onClick={handleVkToggle}
                  disabled={isSavingSettings}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    vkEnabled ? 'bg-[#05591D]' : 'bg-[#CBD5E1]'
                  } ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    vkEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* Email Toggle + Input */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-[#015FAF] flex items-center justify-center text-[#015FAF]">
                    <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.66667 13.3333C1.20833 13.3333 0.815972 13.1701 0.489583 12.8438C0.163194 12.5174 0 12.125 0 11.6667V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H15C15.4583 0 15.8507 0.163194 16.1771 0.489583C16.5035 0.815972 16.6667 1.20833 16.6667 1.66667V11.6667C16.6667 12.125 16.5035 12.5174 16.1771 12.8438C15.8507 13.1701 15.4583 13.3333 15 13.3333H1.66667ZM8.33333 7.5L1.66667 3.33333V11.6667H15V3.33333L8.33333 7.5ZM8.33333 5.83333L15 1.66667H1.66667L8.33333 5.83333ZM1.66667 3.33333V1.66667V3.33333V11.6667V3.33333Z" fill="#015FAF"/>
                    </svg>
                  </div>
                  <span className="text-[14px] font-medium text-[#0B1C30]">Email</span>
                </div>
                
                <button 
                  onClick={() => {
                    const newValue = !emailEnabled
                    setEmailEnabled(newValue)
                    // Если включаем — сразу сохраняем, если выключаем — тоже
                    setTimeout(() => saveNotificationSettings(), 0)
                  }}
                  disabled={isSavingSettings}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    emailEnabled ? 'bg-[#05591D]' : 'bg-[#CBD5E1]'
                  } ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                    emailEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* 🔥 Email Input (только если включено) */}
              {emailEnabled && (
                <div className="mt-2">
                  <label className="text-[12px] font-semibold text-[#40493E] uppercase tracking-wider block mb-2">
                    РАБОЧИЙ EMAIL
                  </label>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C0C9BB]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-12 pr-4 py-3 bg-[#F0F4FF] border border-[#C0C9BB] rounded-[8px] text-[16px] text-[#0B1C30] focus:outline-none focus:border-[#015FAF] transition-colors"
                    />
                  </div>

                  <p className="text-[11px] text-[#5F4900] mt-2">
                    На этот адрес будут приходить напоминания о событиях
                  </p>

                  <button
                    type="button"
                    onClick={saveNotificationSettings}
                    disabled={isSavingSettings}
                    className="mt-4 w-full py-3 bg-[#05591D] hover:bg-[#034a18] text-white rounded-[10px] text-[14px] font-medium transition-colors disabled:opacity-50"
                  >
                    {isSavingSettings ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 rounded-[15px] bg-white p-[24px] border border-[#C0C9BB]">
              <button 
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || isSavingSettings || isPastEvent}  // ← добавлено isPastEvent
                className="max-h-[48px] w-full py-[12px] bg-[#05591D] hover:bg-[#034a18] text-white rounded-[14px] font-medium text-[16px] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="30" strokeDashoffset="30">
                        <animate attributeName="stroke-dashoffset" values="30;0" dur="1s" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Создание...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Создать событие
                  </>
                )}
              </button>

              <button 
                type="button"
                onClick={() => navigate('/')}
                disabled={isLoading}
                className="max-h-[41px] w-full py-[12px] bg-white border border-[#EF4444] text-[#EF4444] hover:bg-red-50 rounded-[14px] font-medium text-[16px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 15C2.04167 15 1.64931 14.8368 1.32292 14.5104C0.996528 14.184 0.833333 13.7917 0.833333 13.3333V2.5H0V0.833333H4.16667V0H9.16667V0.833333H13.3333V2.5H12.5V13.3333C12.5 13.7917 12.3368 14.184 12.0104 14.5104C11.684 14.8368 11.2917 15 10.8333 15H2.5ZM10.8333 2.5H2.5V13.3333H10.8333V2.5ZM4.16667 11.6667H5.83333V4.16667H4.16667V11.6667ZM7.5 11.6667H9.16667V4.16667H7.5V11.6667ZM2.5 2.5V13.3333V2.5Z" fill="#BA1A1A"/>
                </svg>
                Удалить
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 🔥 VK Modal (как в SettingsPage) */}
      {showVkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[20px] shadow-xl p-8 max-w-[420px] w-full mx-4">
            
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-[#E8F0FE] rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#0077FF"/>
                  <path d="M16.5 8.5H14.5C14.5 8.5 14 10.5 13 11.5C12 12.5 11.5 12 11.5 12V8.5H9.5V15.5H11.5V13.5C11.5 13.5 12 13.5 13 14.5C14 15.5 14.5 15.5 14.5 15.5H16.5C16.5 15.5 15.5 14.5 14.5 13.5C13.5 12.5 13.5 12.5 13.5 12.5C13.5 12.5 14 12 15 11C16 10 16.5 8.5 16.5 8.5Z" fill="white"/>
                </svg>
              </div>
            </div>

            <h2 className="text-[22px] font-bold text-[#0B1C30] text-center mb-2">
              Привязка уведомлений VK
            </h2>
            <p className="text-[14px] text-[#5F4900] text-center mb-6 leading-relaxed">
              Чтобы получать уведомления о мероприятиях в VK, нужно написать нашему сообществу одно сообщение — это займёт 10 секунд.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0077FF] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                <p className="text-[14px] text-[#0B1C30]">Нажмите кнопку ниже — откроется диалог с сообществом</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0077FF] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-[14px] text-[#0B1C30] mb-2">Отправьте сообщение:</p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1.5 bg-[#F0F4FF] rounded-[6px] text-[13px] font-mono text-[#015FAF] border border-[#C0C9BB]">
                      {VK_COMMAND_TEXT}
                    </code>
                    <button
                      onClick={copyVkCommand}
                      className="p-1.5 text-[#5F4900] hover:text-[#015FAF] transition-colors"
                      title="Скопировать"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#05591D] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                <p className="text-[14px] text-[#0B1C30]">Готово — уведомления будут приходить в VK</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowVkModal(false)}
                className="flex-1 py-3 border border-[#C0C9BB] rounded-[12px] text-[14px] font-medium text-[#5F4900] hover:bg-[#F5F5F5] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleVkModalConfirm}
                className="flex-1 py-3 bg-[#0077FF] hover:bg-[#0066DD] text-white rounded-[12px] text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Написать сообществу
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateEventPage