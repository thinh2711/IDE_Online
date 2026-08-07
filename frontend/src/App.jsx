import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { SubmissionHistoryPage } from './pages/SubmissionHistoryPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [view, setView] = useState('dashboard');

  const openDashboard = () => {
    setActiveQuestion(null);
    setView('dashboard');
  };

  const openChallenges = () => {
    setActiveQuestion(null);
    setView('admin');
  };

  const openSubmissionHistory = () => {
    setActiveQuestion(null);
    setView('submissions');
  };

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (activeQuestion) {
    return (
      <EditorPage
        question={activeQuestion}
        onBack={() => setActiveQuestion(null)}
        onBackToDashboard={openDashboard}
        onOpenChallenges={openChallenges}
        onOpenSubmissionHistory={openSubmissionHistory}
      />
    );
  }

  if (view === 'submissions') {
    return <SubmissionHistoryPage onBackToDashboard={openDashboard} />;
  }

  if (view === 'admin') {
    return (
      <QuestionBankPage
        onBackToDashboard={openDashboard}
        onOpenEditor={setActiveQuestion}
      />
    );
  }

  return (
    <DashboardPage
      onManageProblems={openChallenges}
      onOpenEditor={setActiveQuestion}
      onOpenSubmissionHistory={openSubmissionHistory}
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
