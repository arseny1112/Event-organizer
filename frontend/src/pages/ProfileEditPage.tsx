import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, updateProfile } from '../api/clients'

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    timezone: '',
  })

  const [roleDisplay, setRoleDisplay] = useState('Пользователь')

  useEffect(() => {
    loadProfile()
  }, [])
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timezoneCity = timezone.split('/')[1]?.replace(/_/g, ' ')

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const { data } = await getProfile()
      
      setFormData({
        name: localStorage.getItem('name') || '',
        email: data.email || '',
        department: data.department || '',
        timezone: timezoneCity || '',
      })

      const role = data.role || 'user'
      setRoleDisplay(role === 'admin' ? 'Главный администратор' : 'Пользователь')

    } catch (err) {
      console.error('Load profile error:', err)
      setError('Не удалось загрузить данные профиля')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Заполните ФИО и Email')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        timezone: formData.timezone,
      })
      navigate('/profile')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при сохранении')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/profile')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center">
        <div className="text-[#0B1C30]">Загрузка данных...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] p-4 sm:p-6 md:p-[24px]">
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-[#0B1C30] mb-6">
          Редактирование профиля
        </h1>

        <div className="bg-white rounded-[15px] p-6 sm:p-8 border border-[#C0C9BB]">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Левая колонка */}
            <div className="w-full lg:w-[300px] flex-shrink-0 flex flex-col items-center text-center">
              <div className="w-[120px] h-[120px] bg-[#B0B0B0] rounded-full flex items-center justify-center mb-4 shadow-md">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>

              <h2 className="text-[20px] font-bold text-[#0B1C30] mb-1">
                {formData.name}
              </h2>
              <p className="text-[14px] text-[#64748B] mb-6">
                {roleDisplay}
              </p>

              <div className="w-full bg-[#F0F4FF] rounded-[12px] p-4 text-left text-[14px] text-[#40493E]">
                <div className="mb-2">Учетная запись создана: 13.05.2026</div>
                <div>Последний вход: Сегодня, 09:21</div>
              </div>
            </div>

            {/* Правая колонка - форма */}
            <div className="flex-1 space-y-6">
              
              <div>
                <label className="block text-[14px] font-medium text-[#40493E] mb-2">ФИО</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-4 py-3 border border-[#C0C9BB] rounded-[12px] text-[15px] text-[#0B1C30] placeholder-[#94A3B8] focus:outline-none focus:border-[#015FAF] focus:ring-2 focus:ring-[#ECFDF5]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[14px] font-medium text-[#40493E] mb-2">Подразделение</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Отдел разработки"
                    className="w-full px-4 py-3 border border-[#C0C9BB] rounded-[12px] text-[15px] text-[#0B1C30] placeholder-[#94A3B8] focus:outline-none focus:border-[#015FAF] focus:ring-2 focus:ring-[#ECFDF5]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#40493E] mb-2">Роль</label>
                  <input
                    type="text"
                    value={roleDisplay}
                    disabled
                    className="w-full px-4 py-3 border border-[#C0C9BB] rounded-[12px] text-[15px] text-[#94A3B8] bg-[#F8FAFC] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[14px] font-medium text-[#40493E] mb-2">Email (рабочий)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@domain.ru"
                    className="w-full px-4 py-3 border border-[#C0C9BB] rounded-[12px] text-[15px] text-[#0B1C30] placeholder-[#94A3B8] focus:outline-none focus:border-[#015FAF] focus:ring-2 focus:ring-[#ECFDF5]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#40493E] mb-2">Часовой пояс</label>
                  <input
                    type="text"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    placeholder="Europe/Moscow"
                    className="w-full px-4 py-3 border border-[#C0C9BB] rounded-[12px] text-[15px] text-[#0B1C30] placeholder-[#94A3B8] focus:outline-none focus:border-[#015FAF] focus:ring-2 focus:ring-[#ECFDF5]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-[#E8ECE6]">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-8 py-3 border-2 border-[#015FAF] text-[#015FAF] rounded-[12px] text-[15px] font-semibold hover:bg-[#F0F4FF] transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-[#287233] text-white rounded-[12px] text-[15px] font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить изменения'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileEditPage