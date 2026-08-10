import { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { ReviewerSessionPage } from './pages/ReviewerSessionPage';
import { SubmissionDetailPage } from './pages/SubmissionDetailPage';
import { SubmissionHistoryPage } from './pages/SubmissionHistoryPage';
import { UserManagementPage } from './pages/UserManagementPage';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [activeCodingSession, setActiveCodingSession] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [reviewJoinCode, setReviewJoinCode] = useState('');
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    if (!isAuthenticated) return;

    setActiveQuestion(null);
    setActiveCodingSession(null);
    setActiveSubmissionId(null);
    setReviewJoinCode('');
    setView('dashboard');
  }, [isAuthenticated, user?.id, user?.role]);

  const openDashboard = () => {
    setActiveQuestion(null);
    setActiveCodingSession(null);
    setActiveSubmissionId(null);
    setView('dashboard');
  };

  const openChallenges = () => {
    setActiveQuestion(null);
    setActiveCodingSession(null);
    setActiveSubmissionId(null);
    setView('admin');
  };

  const openSubmissionHistory = () => {
    setActiveQuestion(null);
    setActiveCodingSession(null);
    setActiveSubmissionId(null);
    setView('submissions');
  };

  const openUsers = () => {
    setActiveQuestion(null);
    setActiveCodingSession(null);
    setActiveSubmissionId(null);
    setView('users');
  };

  const openEditor = (question, session = null) => {
    setActiveCodingSession(session);
    setActiveQuestion(question);
    setActiveSubmissionId(null);
  };

  const openReviewSession = (joinCode = '') => {
    setActiveQuestion(null);
    setActiveCodingSession(null);
    setActiveSubmissionId(null);
    setReviewJoinCode(joinCode);
    setView('reviewSession');
  };

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (activeQuestion) {
    return (
      <EditorPage
        question={activeQuestion}
        session={activeCodingSession}
        onBack={() => {
          setActiveQuestion(null);
          setActiveCodingSession(null);
        }}
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
        onOpenEditor={openEditor}
      />
    );
  }

  if (view === 'reviewSession') {
    return (
      <ReviewerSessionPage
        initialJoinCode={reviewJoinCode}
        onBackToDashboard={openDashboard}
      />
    );
  }

  if (view === 'submissions') {
    return (
      <SubmissionHistoryPage
        onBackToDashboard={openDashboard}
        onOpenUsers={openUsers}
        onOpenProblems={openChallenges}
        onOpenSubmissionDetail={setActiveSubmissionId}
      />
    );
  }

  if (view === 'admin') {
    return (
      <QuestionBankPage
        onBackToDashboard={openDashboard}
        onOpenEditor={openEditor}
        onOpenSubmissionHistory={openSubmissionHistory}
        onOpenUsers={openUsers}
      />
    );
  }

  if (view === 'users') {
    return (
      <UserManagementPage
        onBackToDashboard={openDashboard}
        onManageProblems={openChallenges}
        onOpenSubmissionHistory={openSubmissionHistory}
      />
    );
  }

  return (
    <DashboardPage
      onManageProblems={openChallenges}
      onOpenEditor={openEditor}
      onOpenReviewSession={openReviewSession}
      onOpenSubmissionHistory={openSubmissionHistory}
      onOpenUsers={openUsers}
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
