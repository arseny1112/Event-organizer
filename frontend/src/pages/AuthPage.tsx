import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, saveAuth } from '../api/clients';

interface RegistrationData {
  email: string;
  login: string;
  password: string;
  confirmPassword: string;
}

// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [regData, setRegData] = useState<RegistrationData>({
    email: '',
    login: '',
    password: '',
    confirmPassword: '',
  });

  // Обработка возврата от VK
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace('#', ''));

    // Возврат с токеном (старый flow)
    if (params.get('token')) {
      saveAuth({
        token: params.get('token')!,
        name: params.get('name')!,
        email: '',
        role: params.get('role') || 'user',
      });
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/');
      return;
    }

    // Возврат от VK с code (PKCE flow)
    if (params.get('vk_code')) {
      const code = params.get('vk_code')!
      const codeVerifier = localStorage.getItem('vk_code_verifier') || ''
      const deviceId = params.get('device_id') || localStorage.getItem('vk_device_id') || ''
      
      window.history.replaceState(null, '', window.location.pathname)
      handleVKExchange(code, codeVerifier, deviceId)
    }
  }, [navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await login({ email, password });
      saveAuth(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа. Проверьте логин и пароль.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (regData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await register({
        name: regData.login,
        email: regData.email,
        password: regData.password,
      });
      
      console.log('=== FULL RESPONSE ===', response);
      console.log('=== RESPONSE DATA ===', response.data);
      
      // Axios возвращает { data: {...} }, поэтому берём response.data
      saveAuth(response.data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации. Возможно, пользователь уже существует.');
    } finally {
      setIsLoading(false);
    }
  };

  // Обмен code на токен через бэкенд
  const handleVKExchange = async (code: string, codeVerifier: string, deviceId: string) => {
        setIsLoading(true)
    setError(null)
    try {
      const deviceId = localStorage.getItem('vk_device_id') || ''
      const response = await fetch('/event_organizer/backend/auth/vk-exchange.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier: codeVerifier, device_id: deviceId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка входа через ВК')
      saveAuth(data)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Ошибка входа через ВКонтакте.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVKLogin = async () => {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = Math.random().toString(36).substring(2)
    
    // device_id — просто уникальный идентификатор устройства
    const deviceId = crypto.randomUUID()
  
    localStorage.setItem('vk_code_verifier', codeVerifier)
    localStorage.setItem('vk_device_id', deviceId)
    localStorage.setItem('vk_state', state)
  
    const clientId = '54526807'
    const redirectUri = encodeURIComponent('http://localhost/event_organizer/backend/auth/vk-callback.php')
  
    window.location.href = `https://id.vk.com/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=email&device_id=${deviceId}`
  }

  const handleRegChange = (field: keyof RegistrationData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRegData(prev => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null);
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-[440px] border-[1px] border-[#C6FFA6] bg-[#F5F2F2] rounded-[50px] shadow-sm p-[32px]">
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center justify-center w-12 h-12 bg-[#E5EEFF] rounded-xl">
            <svg width="19" height="24" viewBox="0 0 19 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.33333 12.8333C10.4611 12.8333 11.4236 12.4347 12.2208 11.6375C13.0181 10.8403 13.4167 9.87778 13.4167 8.75C13.4167 7.62222 13.0181 6.65972 12.2208 5.8625C11.4236 5.06528 10.4611 4.66667 9.33333 4.66667C8.20555 4.66667 7.24306 5.06528 6.44583 5.8625C5.64861 6.65972 5.25 7.62222 5.25 8.75C5.25 9.87778 5.64861 10.8403 6.44583 11.6375C7.24306 12.4347 8.20555 12.8333 9.33333 12.8333ZM9.33333 23.3333C6.49444 22.6139 4.22917 21.0583 2.5375 18.6667C0.845833 16.275 0 13.5917 0 10.6167V3.5L9.33333 0L18.6667 3.5V10.6167C18.6667 13.5917 17.8208 16.275 16.1292 18.6667C14.4375 21.0583 12.1722 22.6139 9.33333 23.3333ZM9.33333 20.8833C10.4806 20.5139 11.4965 19.9354 12.3813 19.1479C13.266 18.3604 14.0389 17.4708 14.7 16.4792C13.8639 16.0514 12.9937 15.7257 12.0896 15.5021C11.1854 15.2785 10.2667 15.1667 9.33333 15.1667C8.4 15.1667 7.48125 15.2785 6.57708 15.5021C5.67292 15.7257 4.80278 16.0514 3.96667 16.4792C4.62778 17.4708 5.40069 18.3604 6.28542 19.1479C7.17014 19.9354 8.18611 20.5139 9.33333 20.8833Z" fill="#05591D"/>
            </svg>
          </div>
          <h1 className="text-[#0B1C30] text-[24px] font-bold mb-[12px]">
            {isLogin ? 'Авторизация' : 'Регистрация'}
          </h1>
          <p className="text-[#40493E] text-[14px] text-center">
            ГКУ РБ Информационные<br /> технологии
          </p>
        </div>

        {error && (
          <div className="mb-4 mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLogin && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col mt-6">
            <div className="flex flex-col gap-[4px] mb-[16px]">
              <label className="text-[#40493E] text-[12px] font-bold uppercase tracking-wide">
                Логин
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите логин"
                disabled={isLoading}
                className="w-full px-[12px] py-[14px] border-[1px] border-[#C0C9BB] rounded-[15px] text-[#047857] placeholder-[#64748B] outline-none focus:border-[#047857] transition-colors disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-[4px] mb-[24px]">
              <label className="text-[#40493E] text-[12px] font-bold uppercase tracking-wide">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="*********"
                disabled={isLoading}
                className="w-full px-[12px] py-[14px] border-[1px] border-[#C0C9BB] rounded-[15px] text-[#047857] placeholder-[#64748B] outline-none focus:border-[#047857] transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer text-[16px] w-full py-[14px] bg-[#287233] text-white rounded-[15px] font-semibold hover:bg-[#047857]/90 transition-colors flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <span className="animate-pulse">Загрузка...</span> : <>Войти <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.1458 7.5H0V5.83333H10.1458L5.47917 1.16667L6.66667 0L13.3333 6.66667L6.66667 13.3333L5.47917 12.1667L10.1458 7.5Z" fill="#F5F2F2"/></svg></>}
            </button>
          </form>
        )}

        {!isLogin && (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col mt-6">
            <div className="flex flex-col gap-[4px] mb-[12px]">
              <label className="text-[#40493E] text-[12px] font-bold uppercase tracking-wide">Email</label>
              <input type="email" value={regData.email} onChange={handleRegChange('email')} placeholder="Введите email" disabled={isLoading}
                className="w-full px-[12px] py-[14px] border-[1px] border-[#C0C9BB] rounded-[15px] text-[#047857] placeholder-[#64748B] outline-none focus:border-[#047857] transition-colors disabled:opacity-50" />
            </div>
            <div className="flex flex-col gap-[4px] mb-[12px]">
              <label className="text-[#40493E] text-[12px] font-bold uppercase tracking-wide">Логин</label>
              <input type="text" value={regData.login} onChange={handleRegChange('login')} placeholder="Придумайте логин" disabled={isLoading}
                className="w-full px-[12px] py-[14px] border-[1px] border-[#C0C9BB] rounded-[15px] text-[#047857] placeholder-[#64748B] outline-none focus:border-[#047857] transition-colors disabled:opacity-50" />
            </div>
            <div className="flex flex-col gap-[4px] mb-[12px]">
              <label className="text-[#40493E] text-[12px] font-bold uppercase tracking-wide">Пароль</label>
              <input type="password" value={regData.password} onChange={handleRegChange('password')} placeholder="Придумайте пароль" disabled={isLoading}
                className="w-full px-[12px] py-[14px] border-[1px] border-[#C0C9BB] rounded-[15px] text-[#047857] placeholder-[#64748B] outline-none focus:border-[#047857] transition-colors disabled:opacity-50" />
            </div>
            <div className="flex flex-col gap-[4px] mb-[24px]">
              <label className="text-[#40493E] text-[12px] font-bold uppercase tracking-wide">Подтверждение пароля</label>
              <input type="password" value={regData.confirmPassword} onChange={handleRegChange('confirmPassword')} placeholder="Повторите пароль" disabled={isLoading}
                className="w-full px-[12px] py-[14px] border-[1px] border-[#C0C9BB] rounded-[15px] text-[#047857] placeholder-[#64748B] outline-none focus:border-[#047857] transition-colors disabled:opacity-50" />
            </div>
            <button type="submit" disabled={isLoading}
              className="cursor-pointer text-[16px] w-full py-[14px] bg-[#287233] text-white rounded-[15px] font-semibold hover:bg-[#047857]/90 transition-colors flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <span className="animate-pulse">Загрузка...</span> : <>Зарегистрироваться <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.1458 7.5H0V5.83333H10.1458L5.47917 1.16667L6.66667 0L13.3333 6.66667L6.66667 13.3333L5.47917 12.1667L10.1458 7.5Z" fill="#F5F2F2"/></svg></>}
            </button>
          </form>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-[#D3E4FE]"></div>
          <span className="text-[#64748B] text-xs uppercase">или</span>
          <div className="flex-1 h-[1px] bg-[#D3E4FE]"></div>
        </div>

        <button
          onClick={handleVKLogin}
          disabled={isLoading}
          className="w-full py-[12px] bg-[#0077FF] text-white rounded-[15px] font-semibold hover:bg-[#0066DD] transition-colors flex items-center justify-center gap-[8px] disabled:opacity-50"
        >
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.2344 1.46484C19.3844 0.964844 19.3844 0.614844 18.8844 0.614844H16.4844C15.9844 0.614844 15.7844 0.914844 15.6344 1.26484C15.6344 1.26484 13.3344 6.76484 10.8844 9.26484C10.3844 9.71484 10.1344 9.86484 9.88438 9.86484C9.73438 9.86484 9.48438 9.71484 9.48438 9.26484V1.46484C9.48438 0.814844 9.28438 0.614844 8.78438 0.614844H4.88438C4.53438 0.614844 4.38438 0.914844 4.38438 1.11484C4.38438 1.56484 6.48438 4.16484 6.48438 7.86484C6.48438 9.91484 5.33438 10.4648 4.98438 10.4648C4.38438 10.4648 2.38438 8.81484 0.984375 6.86484C0.534375 6.36484 0.334375 6.11484 0.084375 6.11484C-0.215625 6.11484 -0.415625 6.26484 -0.415625 6.71484V11.3648C-0.415625 12.0148 -0.115625 12.3648 0.784375 12.3648H4.88438C5.88438 12.3648 6.68438 11.9148 7.68438 10.4648C8.88438 8.76484 10.3844 6.36484 10.3844 6.36484C10.3844 6.36484 11.8844 8.76484 13.0844 10.4648C13.9844 11.7648 14.6844 12.3648 15.6844 12.3648H19.2344C19.7344 12.3648 19.9844 12.0648 19.9844 11.5648V6.71484C19.9844 6.11484 19.7844 5.86484 19.4844 5.86484C19.2344 5.86484 19.0344 6.11484 18.5844 6.86484C18.0844 7.61484 16.8844 9.26484 15.3844 9.26484C14.8844 9.26484 14.6344 8.81484 14.6344 8.36484C14.6344 7.36484 15.8844 4.86484 17.8844 1.96484C18.3844 1.21484 18.8844 0.964844 19.2344 1.46484Z" fill="white"/>
          </svg>
          Войти через ВКонтакте
        </button>

        <div className="mt-[17px] border-t border-[#D3E4FE] text-center pt-4">
          {isLogin ? (
            <>
              <p className="text-[#64748B] text-sm">Нет учетной записи?</p>
              <button onClick={() => setIsLogin(false)} className="text-[#015FAF] cursor-pointer font-semibold text-sm mt-1 hover:underline">
                Регистрация нового пользователя
              </button>
            </>
          ) : (
            <>
              <p className="text-[#64748B] text-sm">Уже есть учетная запись?</p>
              <button onClick={() => setIsLogin(true)} className="text-[#015FAF] cursor-pointer font-semibold text-sm mt-1 hover:underline">
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;