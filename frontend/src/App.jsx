import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { EditorPage } from './pages/EditorPage';
import { QuestionBankPage } from './pages/QuestionBankPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeQuestion, setActiveQuestion] = useState(null);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (activeQuestion) {
    return <EditorPage question={activeQuestion} onBack={() => setActiveQuestion(null)} />;
  }

  return <QuestionBankPage onOpenEditor={setActiveQuestion} />;
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
