import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../api/auth';

const AuthContext = createContext(null);

// Provider lưu token/user ở cấp app để Header, Dashboard hoặc Debugger đều dùng chung được.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Khi refresh trang, thử khôi phục profile từ token đã lưu.
    if (token) {
      loadProfile(token).catch(() => {});
    }
  }, []);

  async function signIn({ username, password }) {
    setStatus('loading');
    setMessage('');

    try {
      const data = await loginUser({ username: username.trim(), password });

      localStorage.setItem('auth_token', data.accessToken);
      setToken(data.accessToken);
      await loadProfile(data.accessToken);
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setStatus('idle');
    }
  }

  async function signUp({ fullName, username, password }) {
    setStatus('loading');
    setMessage('');

    try {
      const data = await registerUser({
        fullName,
        username: username.trim(),
        password,
      });

      // Đăng ký chỉ tạo tài khoản; user chỉ được xem là authenticated sau khi đăng nhập có token.
      setMessage('Account created. You can sign in now.');
      return data.user;
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setStatus('idle');
    }
  }

  async function loadProfile(currentToken = token) {
    if (!currentToken) {
      setMessage('Sign in first to load your profile.');
      return null;
    }

    setStatus('loading');
    setMessage('');

    try {
      // /api/me là nguồn dữ liệu chính xác cho session lấy từ DB.
      const data = await getCurrentUser(currentToken);
      setUser(data.user);
      setMessage('Profile loaded.');
      return data.user;
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setStatus('idle');
    }
  }

  function clearMessage() {
    setMessage('');
  }

  function signOut() {
    localStorage.removeItem('auth_token');
    setToken('');
    setUser(null);
    setMessage('');
  }

  function reportMessage(nextMessage) {
    setMessage(nextMessage);
  }

  const value = useMemo(
    () => ({
      clearMessage,
      isAuthenticated: Boolean(user),
      loadProfile,
      message,
      signIn,
      signOut,
      signUp,
      status,
      token,
      user,
      reportMessage,
    }),
    [message, status, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
