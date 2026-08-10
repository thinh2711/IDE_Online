import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { SubmissionDetailPage } from './pages/SubmissionDetailPage';
import { SubmissionHistoryPage } from './pages/SubmissionHistoryPage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [view, setView] = useState('dashboard');

  const openDashboard = () => {
    setActiveQuestion(null);
    setActiveSubmissionId(null);
    setView('dashboard');
  };

  const openChallenges = () => {
    setActiveQuestion(null);
    setActiveSubmissionId(null);
    setView('admin');
  };

  const openSubmissionHistory = () => {
    setActiveQuestion(null);
    setActiveSubmissionId(null);
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
        onOpenSubmissionHistory={openSubmissionHistory}
      />
    );
  }

  if (activeSubmissionId) {
    return (
      <SubmissionDetailPage
        id={activeSubmissionId}
        onBackToDashboard={openDashboard}
        onBackToHistory={openSubmissionHistory}
        onOpenEditor={setActiveQuestion}
      />
    );
  }

  if (view === 'submissions') {
    return (
      <SubmissionHistoryPage
        onBackToDashboard={openDashboard}
        onOpenProblems={openChallenges}
        onOpenSubmissionDetail={setActiveSubmissionId}
      />
    );
  }

  if (view === 'admin') {
    return (
      <QuestionBankPage
        onBackToDashboard={openDashboard}
        onOpenEditor={setActiveQuestion}
        onOpenSubmissionHistory={openSubmissionHistory}
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
