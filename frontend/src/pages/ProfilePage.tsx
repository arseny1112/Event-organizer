import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, getRole, logout } from '../api/clients';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin: string;
  timezone: string;
}

interface EventStats {
  totalEvents: number;
  weekEvents: number;
  completedEvents: number;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const role = getRole();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    weekEvents: 0,
    completedEvents: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
  
        const { data } = await getProfile()
  
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const timezoneCity = timezone.split('/')[1]?.replace(/_/g, ' ')
  
        setUser({
          id: 0,
          name: data.name,
          email: data.email,
          role: data.role ?? 'user',
          department: data.department ?? '—',
          lastLogin: data.last_login
            ? new Date(data.last_login).toLocaleString('ru-RU')
            : '—',
          timezone: timezoneCity || 'Неизвестно',
        })
  
        setStats({
          totalEvents: data.stats?.total ?? 0,
          weekEvents: data.stats?.future ?? 0,
          completedEvents: data.stats?.past ?? 0,
        })
  
      } catch (err) {
        setError('Ошибка загрузки данных')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleLogout = () => {
    logout()
    window.location.href = '/auth'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] p-4 sm:p-6 md:p-[24px] flex items-center justify-center">
        <div className="text-[#0B1C30] text-[14px] sm:text-[16px]">Загрузка профиля...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] p-4 sm:p-6 md:p-[24px] flex items-center justify-center">
        <div className="text-[#BA1A1A] text-[14px] sm:text-[16px] text-center">
          {error || 'Ошибка загрузки данных'}
          <button 
            onClick={() => window.location.reload()}
            className="block mt-4 text-[#015FAF] underline text-[13px] sm:text-[14px]"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] p-4 sm:p-6 md:p-[24px]">
      <h1 className="text-2xl sm:text-[28px] md:text-[32px] font-bold text-[#0B1C30] mb-4 sm:mb-6 md:mb-[24px]">
        Профиль пользователя
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-[20px]">
        
        <div className="w-full lg:w-[300px] flex flex-col gap-4 sm:gap-5 md:gap-[20px] flex-shrink-0">
          
          <div className="flex items-center justify-center py-4 sm:py-[20px]">
            <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] bg-[#B0B0B0] rounded-full flex items-center justify-center shadow-md">
              <svg width="50" height="50" sm-width="60" sm-height="60" md-width="80" md-height="80" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>

          <div
            className="bg-white rounded-[15px] p-4 sm:p-5 md:p-[24px] text-center"
            style={{ border: '1px solid #C0C9BB' }}
          >
            <div className="text-xl sm:text-[20px] md:text-[24px] font-bold text-[#0B1C30] mb-1 sm:mb-2 md:mb-[8px] leading-tight break-words">
              {localStorage.getItem('name')}
            </div>
            <div className="text-[12px] sm:text-[13px] md:text-[14px] text-[#666666] mb-3 sm:mb-4 md:mb-[16px] break-all px-1">
              {user.email}
            </div>
            <div className="inline-block bg-[#A7F5A7] text-[#0B1C30] px-4 sm:px-5 md:px-[24px] py-1.5 sm:py-[6px] rounded-[20px] text-[12px] sm:text-[13px] md:text-[14px] font-semibold mb-4 sm:mb-5 md:mb-[24px]">
              {user.role.toUpperCase()}
            </div>
            <button 
              onClick={handleEditProfile}
              className="w-full py-2.5 sm:py-3 md:py-[12px] px-3 sm:px-4 md:px-[16px] bg-transparent border-2 border-[#015FAF] text-[#015FAF] rounded-[10px] text-[13px] sm:text-[14px] md:text-[15px] font-semibold hover:bg-[#015FAF] hover:text-white transition-all"
            >
              Редактировать профиль
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 sm:gap-5 md:gap-[20px]">
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-[24px] overflow-x-auto pb-2">
            {role === 'admin' && (
              <div
                className="bg-white rounded-[12px] p-4 sm:p-[20px] flex flex-col justify-between flex-shrink-0 sm:w-[198px] h-[120px] sm:h-[130px]"
                style={{ border: '1px solid #C0C9BB' }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#0B1C30] uppercase tracking-wider">
                    ВСЕГО СОЗДАНО
                  </span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M9 15H11V11H15V9H11V5H9V9H5V11H9V15ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="#05591D"/>
                  </svg>
                </div>
                <div className="text-3xl sm:text-[36px] md:text-[40px] font-bold text-[#0B1C30] leading-none">
                  {stats.totalEvents}
                </div>
                <div className="text-[11px] sm:text-[12px] text-[#A0A0A0]">
                  мероприятий
                </div>
              </div>
            )}

            <div
              className="bg-white rounded-[12px] p-4 sm:p-[20px] flex flex-col justify-between flex-shrink-0 sm:w-[198px] h-[120px] sm:h-[130px]"
              style={{ border: '1px solid #C0C9BB' }}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#0B1C30] uppercase tracking-wider">
                  ЗАПЛАНИРОВАНО
                </span>
                <svg width="16" height="18" sm-width="20" sm-height="22" viewBox="0 0 20 22" fill="none" className="flex-shrink-0">
                  <path d="M14 20V18H18V8H4V12H2V4C2 3.45 2.19583 2.97917 2.5875 2.5875C2.97917 2.19583 3.45 2 4 2H5V0H7V2H15V0H17V2H18C18.55 2 19.0208 2.19583 19.4125 2.5875C19.8042 2.97917 20 3.45 20 4V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H14ZM7 22L5.6 20.6L8.175 18H0V16H8.175L5.6 13.4L7 12L12 17L7 22ZM4 6H18V4H4V6ZM4 6V4V6Z" fill="#015FAF"/>
                </svg>
              </div>
              <div className="text-3xl sm:text-[36px] md:text-[40px] font-bold text-[#0B1C30] leading-none">
                {stats.weekEvents}
              </div>
              <div className="text-[11px] sm:text-[12px] text-[#A0A0A0]">
                на этой неделе
              </div>
            </div>

            <div
              className="bg-white rounded-[12px] p-4 sm:p-[20px] flex flex-col justify-between flex-shrink-0 sm:w-[198px] h-[120px] sm:h-[130px]"
              style={{ border: '1px solid #C0C9BB' }}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#0B1C30] uppercase tracking-wider">
                  ПРОШЛО
                </span>
                <svg width="14" height="14" sm-width="18" sm-height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
                  <path d="M9 18C6.7 18 4.69583 17.2375 2.9875 15.7125C1.27917 14.1875 0.3 12.2833 0.05 10H2.1C2.33333 11.7333 3.10417 13.1667 4.4125 14.3C5.72083 15.4333 7.25 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H6V7H0V1H2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM11.8 13.2L8 9.4V4H10V8.6L13.2 11.8L11.8 13.2Z" fill="#7D6000"/>
                </svg>
              </div>
              <div className="text-3xl sm:text-[36px] md:text-[40px] font-bold text-[#0B1C30] leading-none">
                {stats.completedEvents}
              </div>
              <div className="text-[11px] sm:text-[12px] text-[#A0A0A0]">
                успешно завершено
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-[12px] p-4 sm:p-6 md:p-[32px]"
            style={{ border: '1px solid #C0C9BB' }}
          >
            <h2 
              className="text-lg sm:text-[20px] md:text-[22px] font-bold text-[#0B1C30] mb-3 sm:mb-4 md:mb-[16px] pb-3 sm:pb-[12px]" 
              style={{ borderBottom: '1px solid #C0C9BB' }}
            >
              Информация о системе
            </h2>

            <div>
              <div className="flex justify-between items-center py-2.5 sm:py-3 md:py-[12px]" style={{ borderBottom: '1px solid #E8ECE6' }}>
                <span className="text-[13px] sm:text-[14px] md:text-[15px] text-[#666666]">Роль в системе</span>
                <span className="text-[13px] sm:text-[14px] md:text-[15px] font-semibold text-[#0B1C30] text-right ml-2 break-all">
                  {user.role}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 sm:py-3 md:py-[12px]" style={{ borderBottom: '1px solid #E8ECE6' }}>
                <span className="text-[13px] sm:text-[14px] md:text-[15px] text-[#666666]">Подразделение</span>
                <span className="text-[13px] sm:text-[14px] md:text-[15px] font-semibold text-[#0B1C30] text-right ml-2 break-all">
                  {user.department || '—'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 sm:py-3 md:py-[12px]" style={{ borderBottom: '1px solid #E8ECE6' }}>
                <span className="text-[13px] sm:text-[14px] md:text-[15px] text-[#666666]">Последний вход</span>
                <span className="text-[12px] sm:text-[13px] md:text-[15px] font-semibold text-[#0B1C30] text-right ml-2 break-all">
                  {user.lastLogin}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 sm:py-3 md:py-[12px]">
                <span className="text-[13px] sm:text-[14px] md:text-[15px] text-[#666666]">Часовой пояс</span>
                <span className="text-[13px] sm:text-[14px] md:text-[15px] font-semibold text-[#0B1C30] text-right ml-2">
                  {user.timezone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 md:mt-[32px]">
        <button 
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 sm:gap-2.5 md:gap-[10px] py-3 sm:py-3.5 md:py-[14px] px-5 sm:px-6 md:px-[28px] bg-[#BA1A1A] text-white rounded-[12px] text-[14px] sm:text-[15px] md:text-[16px] font-semibold hover:bg-[#930f0f] transition-all w-full sm:w-auto"
        >
          <svg width="16" height="16" sm-width="18" sm-height="18" md-width="20" md-height="20" viewBox="0 0 24 24" fill="white">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
          Выйти
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;