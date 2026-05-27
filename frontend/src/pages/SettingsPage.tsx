import React, { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '../api/clients'

const VK_GROUP_ID = '238638283'
const VK_DIALOG_URL = `https://vk.com/im?sel=-${VK_GROUP_ID}&message=Привязать уведомления`

const SettingsPage: React.FC = () => {
  const [vkEnabled, setVkEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showVkModal, setShowVkModal] = useState(false)
  
  const [isA11yMode, setIsA11yMode] = useState(false)

  useEffect(() => {
    loadSettings()
    
    const checkA11y = () => {
      const saved = localStorage.getItem('a11y-settings')
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          setIsA11yMode(!!settings.isEnabled)
        } catch {
          setIsA11yMode(false)
        }
      } else {
        setIsA11yMode(document.body.classList.contains('a11y-mode'))
      }
    }

    checkA11y()
    window.addEventListener('storage', checkA11y)
    
    const observer = new MutationObserver(checkA11y)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => {
      window.removeEventListener('storage', checkA11y)
      observer.disconnect()
    }
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await getSettings()
      const settings = response.data
      
      setVkEnabled(!!settings.vk_notify)
      setEmailEnabled(!!settings.email_notify)
      setEmail(localStorage.getItem('email') || '')
    } catch (err) {
      console.error('Load settings error:', err)
      setVkEnabled(false)
      setEmailEnabled(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVkToggle = async () => {
    if (!vkEnabled) {
      setShowVkModal(true)
    } else {
      setVkEnabled(false)
      setIsSaving(true)
      try {
        await updateSettings({
          vk_notify: false,
          vk_id: null,
          notify_day_before: true,
          notify_hour_before: true,
          email_notify: emailEnabled,
          email: email,
        })
      } catch (err) {
        console.error('VK disable error:', err)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleVkModalConfirm = async () => {
    setVkEnabled(true)
    setShowVkModal(false)
    window.open(VK_DIALOG_URL, '_blank')
  
    setIsSaving(true)
    try {
      await updateSettings({
        vk_notify: true,
        notify_day_before: true,
        notify_hour_before: true,
        email_notify: emailEnabled,
        email: email,
        vk_id: null,
      })
    } catch (err) {
      console.error('VK save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings({
        vk_notify: vkEnabled,
        notify_day_before: true,
        notify_hour_before: true,
        email_notify: emailEnabled,
        email: email,
        vk_id: null,
      })
      if (email) {
        localStorage.setItem('email', email)
      }
      alert('Настройки сохранены!')
    } catch (err) {
      console.error('Save error:', err)
      alert('Ошибка при сохранении')
    } finally {
      setIsSaving(false)
    }
  }

  const getToggleStyle = (isEnabled: boolean) => {
    if (isA11yMode) {
      return {
        bg: isEnabled ? '#000000' : '#FFFFFF',
        border: '#000000',
        knob: isEnabled ? '#FFFFFF' : '#000000',
        borderWidth: '2px'
      }
    }
    
    return {
      bg: isEnabled ? '#05591D' : '#E2E8F0', 
      border: isEnabled ? '#05591D' : '#CBD5E1',
      knob: isEnabled ? '#FFFFFF' : '#0B1C30', 
      borderWidth: '0px'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-[#5F4900] text-sm sm:text-base">Загрузка настроек...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] p-4 sm:p-6 md:p-8">
      {/* Модалка VK */}
      {showVkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="bg-white rounded-[20px] shadow-xl p-6 sm:p-8 max-w-[420px] w-full mx-2 sm:mx-4">
            
            {/* Иконка */}
            <div className="flex justify-center mb-4 sm:mb-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#E8F0FE] rounded-full flex items-center justify-center">
                <svg width="28" height="28" sm-width="32" sm-height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#0077FF"/>
                  <path d="M16.5 8.5H14.5C14.5 8.5 14 10.5 13 11.5C12 12.5 11.5 12 11.5 12V8.5H9.5V15.5H11.5V13.5C11.5 13.5 12 13.5 13 14.5C14 15.5 14.5 15.5 14.5 15.5H16.5C16.5 15.5 15.5 14.5 14.5 13.5C13.5 12.5 13.5 12.5 13.5 12.5C13.5 12.5 14 12 15 11C16 10 16.5 8.5 16.5 8.5Z" fill="white"/>
                </svg>
              </div>
            </div>

            <h2 className="text-xl sm:text-[22px] font-bold text-[#0B1C30] text-center mb-2">
              Привязка уведомлений VK
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[#5F4900] text-center mb-5 sm:mb-6 leading-relaxed">
              Чтобы получать уведомления о мероприятиях в VK, нужно написать нашему сообществу одно сообщение — это займёт 10 секунд.
            </p>

            {/* Кнопки */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowVkModal(false)}
                className="flex-1 py-2.5 sm:py-3 border border-[#C0C9BB] rounded-[12px] text-[13px] sm:text-[14px] font-medium text-[#5F4900] hover:bg-[#F5F5F5] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleVkModalConfirm}
                className="flex-1 py-2.5 sm:py-3 bg-[#0077FF] hover:bg-[#0066DD] text-white rounded-[12px] text-[13px] sm:text-[14px] font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <svg width="14" height="14" sm-width="16" sm-height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="hidden sm:inline">Написать сообществу</span>
                <span className="sm:hidden">Написать</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-[32px] font-bold text-[#0B1C30] mb-1 sm:mb-2">
            Настройки оповещений
          </h1>
          <p className="text-[14px] sm:text-[16px] text-[#5F4900] leading-relaxed">
            Управляйте каналами получения системных уведомлений и напоминаний.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-[#C0C9BB] rounded-[15px] p-4 sm:p-6 mb-4 sm:mb-[17px]">

          {/* VK Notifications Section */}
          <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-[#E2E8F0]">
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" sm-width="32" sm-height="32" viewBox="0 0 32 32"><title>Vk SVG Icon</title><path fill="#052df5" d="M20.911 0h-9.823C2.124 0-.001 2.125-.001 11.089v9.823c0 8.964 2.125 11.089 11.089 11.089h9.823C29.875 32.001 32 29.876 32 20.912v-9.823C32 2.125 29.854 0 20.911 0m4.922 22.828H23.51c-.88 0-1.151-.698-2.734-2.302c-1.375-1.333-1.984-1.51-2.323-1.51c-.479 0-.615.135-.615.792v2.099c0 .563-.177.901-1.667.901c-2.464 0-5.198-1.49-7.115-4.266c-2.891-4.068-3.682-7.115-3.682-7.745c0-.339.135-.656.786-.656h2.328c.589 0 .813.271 1.042.901c1.151 3.323 3.068 6.234 3.859 6.234c.292 0 .427-.135.427-.88v-3.432c-.089-1.583-.922-1.719-.922-2.281c0-.271.224-.542.583-.542h3.661c.495 0 .677.271.677.854v4.63c0 .5.224.677.359.677c.292 0 .542-.177 1.083-.719c1.672-1.875 2.87-4.766 2.87-4.766c.156-.339.427-.656 1.016-.656h2.328c.698 0 .854.359.698.859c-.292 1.354-3.141 5.375-3.141 5.375c-.245.406-.339.583 0 1.036c.25.339 1.063 1.042 1.604 1.672c.995 1.13 1.76 2.078 1.964 2.734c.229.651-.109.99-.766.99z"/></svg>
                </div>
                <h2 className="text-base sm:text-[18px] font-bold text-[#0B1C30] leading-tight">
                  Получать напоминания в VK
                </h2>
              </div>

              {/* ТОГЛ VK С ПОДДЕРЖКОЙ A11Y */}
              {/* ТОГЛ VK С ПОДДЕРЖКОЙ A11Y */}
            {(() => {
              const styles = getToggleStyle(vkEnabled);
              return (
                <button
                  onClick={handleVkToggle}
                  // ДОБАВЛЕН КЛАСС a11y-toggle-vk
                  className={`flex items-center w-11 h-5.5 sm:w-12 sm:h-6 rounded-full p-0.5 sm:p-1 transition-colors duration-200 flex-shrink-0 a11y-toggle-vk ${vkEnabled ? 'active-toggle' : ''}`}
                  style={{
                    backgroundColor: styles.bg,
                    borderColor: styles.border,
                    borderWidth: styles.borderWidth,
                  }}
                  aria-label={vkEnabled ? "Выключить уведомления VK" : "Включить уведомления VK"}
                >
                  <div 
                    style={{ backgroundColor: styles.knob }}
                    // ДОБАВЛЕН КЛАСС a11y-toggle-knob для управления шариком
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-md transform transition-transform duration-200 a11y-toggle-knob ${
                      vkEnabled ? 'translate-x-6 sm:translate-x-6' : 'translate-x-0'
                    }`} 
                  />
                </button>
              );
            })()}
            </div>

            <p className="text-[13px] sm:text-[14px] text-[#5F4900] mb-3 sm:mb-4 leading-relaxed">
              Привяжите ваш аккаунт ВКонтакте для получения оперативных пуш-уведомлений о задачах и совещаниях.
            </p>

            {/* Если VK включён — показываем статус */}
            {vkEnabled && (
              <div className="flex items-center justify-between p-2.5 sm:p-3 bg-[#E8F5E9] rounded-[8px] border border-[#A5D6A7] gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[14px] text-[#05591D] font-medium">
                  <svg width="14" height="14" sm-width="16" sm-height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="hidden sm:inline">VK уведомления включены</span>
                  <span className="sm:hidden">VK включены</span>
                </div>
                <a
                  href={VK_DIALOG_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] sm:text-[12px] text-[#0077FF] hover:underline whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Открыть диалог</span>
                  <span className="sm:hidden">Открыть</span>
                </a>
              </div>
            )}
          </div>

          {/* Email Notifications Section */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#015FAF] rounded flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="8" sm-width="14" sm-height="10" viewBox="0 0 14 10" fill="white">
                    <path d="M14 0H0C0 0 0 0 0 0V10C0 10 0 10 0 10H14C14 10 14 10 14 10V0C14 0 14 0 14 0ZM12 2L7 6L2 2H12ZM2 8V4L7 8L12 4V8H2Z"/>
                  </svg>
                </div>
                <h2 className="text-base sm:text-[18px] font-bold text-[#0B1C30] leading-tight">
                  Получать напоминания на email
                </h2>
              </div>

              {/* ТОГЛ EMAIL С ПОДДЕРЖКОЙ A11Y */}
             {/* ТОГЛ EMAIL С ПОДДЕРЖКОЙ A11Y */}
              {(() => {
                const styles = getToggleStyle(emailEnabled);
                return (
                  <button
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    // ДОБАВЛЕН КЛАСС a11y-toggle-email
                    className={`flex items-center w-11 h-5.5 sm:w-12 sm:h-6 rounded-full p-0.5 sm:p-1 transition-colors duration-200 flex-shrink-0 a11y-toggle-email ${emailEnabled ? 'active-toggle' : ''}`}
                    style={{
                      backgroundColor: styles.bg,
                      borderColor: styles.border,
                      borderWidth: styles.borderWidth,
                    }}
                    aria-label="Переключить напоминания на email"
                  >
                    <div 
                      style={{ backgroundColor: styles.knob }}
                      // ДОБАВЛЕН КЛАСС a11y-toggle-knob
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-md transform transition-transform duration-200 a11y-toggle-knob ${
                        emailEnabled ? 'translate-x-6 sm:translate-x-6' : 'translate-x-0'
                      }`} 
                    />
                  </button>
                );
              })()}   
            </div>

            <p className="text-[13px] sm:text-[14px] text-[#5F4900] mb-3 sm:mb-4 leading-relaxed">
              Официальные дайджесты и приглашения будут дублироваться на рабочую почту.
            </p>

            <div>
              <label className="text-[11px] sm:text-[12px] font-semibold text-[#40493E] uppercase tracking-wider block mb-1.5 sm:mb-2">
                РАБОЧИЙ EMAIL
              </label>
              <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#707A6D]">
                  <svg width="16" height="16" sm-width="18" sm-height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder='i.ivanov@it.bashkortostan.ru'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!emailEnabled}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 placeholder:text-[#707A6D] py-2.5 sm:py-3 bg-[#F0F4FF] border border-[#C0C9BB] rounded-[8px] text-[14px] sm:text-[16px] text-[#0B1C30] focus:outline-none focus:border-[#015FAF] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] sm:text-[12px] text-[#5F4900] mt-2 sm:mt-3 leading-relaxed">
                Для изменения почты обратитесь в службу поддержки.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex w-full  justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full sm:w-[342px] justify-center items-center gap-1.5 sm:gap-2 px-5 sm:px-[24px] py-2.5 sm:py-[12px] bg-[#05591D] hover:bg-[#034a18] text-white rounded-[15px] font-medium text-[12px] uppercase tracking-wide transition-colors disabled:opacity-50"
          >
            <svg width="12" height="12" sm-width="14" sm-height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 3V12C13.5 12.4125 13.3531 12.7656 13.0594 13.0594C12.7656 13.3531 12.4125 13.5 12 13.5H1.5C1.0875 13.5 0.734375 13.3531 0.440625 13.0594C0.146875 12.7656 0 12.4125 0 12V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H10.5L13.5 3ZM12 3.6375L9.8625 1.5H1.5V12H12V3.6375ZM6.75 11.25C7.375 11.25 7.90625 11.0312 8.34375 10.5938C8.78125 10.1562 9 9.625 9 9C9 8.375 8.78125 7.84375 8.34375 7.40625C7.90625 6.96875 7.375 6.75 6.75 6.75C6.125 6.75 5.59375 6.96875 5.15625 7.40625C4.71875 7.84375 4.5 8.375 4.5 9C4.5 9.625 4.71875 10.1562 5.15625 10.5938C5.59375 11.0312 6.125 11.25 6.75 11.25ZM2.25 5.25H9V2.25H2.25V5.25ZM1.5 3.6375V12V1.5V3.6375Z" fill="#A6F4A6"/>
            </svg>
            <span className="hidden sm:inline">{isSaving ? 'Сохранение...' : 'Сохранить настройки оповещений'}</span>
            <span className="sm:hidden">{isSaving ? '...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage