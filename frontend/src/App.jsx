import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { QuestionBankPage } from './pages/QuestionBankPage';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <QuestionBankPage />;
}

// App chỉ giữ provider và điểm khai báo page hiện tại.
// Khi thêm React Router, phần Routes sẽ nằm tại đây.
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
