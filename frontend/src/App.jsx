import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { QuestionBankPage } from './pages/QuestionBankPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [view, setView] = useState('dashboard');

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (activeQuestion) {
    return <EditorPage question={activeQuestion} onBack={() => setActiveQuestion(null)} />;
  }

  if (view === 'admin') {
    return (
      <QuestionBankPage
        onBackToDashboard={() => setView('dashboard')}
        onOpenEditor={setActiveQuestion}
      />
    );
  }

  return (
    <DashboardPage
      onManageProblems={() => setView('admin')}
      onOpenEditor={setActiveQuestion}
    />
  );
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
