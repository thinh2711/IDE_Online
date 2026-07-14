import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';

// App chỉ giữ provider và điểm khai báo page hiện tại.
// Khi thêm React Router, phần Routes sẽ nằm tại đây.
export function App() {
  return (
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );
}
