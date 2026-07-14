import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Một object form dùng chung cho cả chế độ đăng nhập và đăng ký.
const initialForm = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

// Quản lý state UI auth, cập nhật form, gọi API và dữ liệu session preview.
export function useAuthPreview() {
  const { clearMessage, message, reportMessage, signIn, signUp, status, user } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);

  const isLogin = mode === 'login';

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    try {
      if (!isLogin && form.password !== form.confirmPassword) {
        reportMessage('Passwords do not match.');
        return;
      }

      // Đăng nhập sẽ lưu token, sau đó tải ngay profile được bảo vệ.
      if (isLogin) {
        await signIn({
          username: form.username.trim(),
          password: form.password,
        });
      } else {
        // Đăng ký tạo tài khoản; sau đó user đăng nhập bằng username đã chọn.
        await signUp({
          fullName: form.fullName,
          username: form.username.trim(),
          password: form.password,
        });

        setMode('login');
      }
    } catch (error) {
      // AuthContext đã lưu message lỗi, hook chỉ giữ submit không làm crash UI.
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    clearMessage();
  }

  return {
    changeMode,
    form,
    handleSubmit,
    isLogin,
    message,
    status,
    updateField,
    user,
  };
}
