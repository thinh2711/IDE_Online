import { AuthCard } from '../components/auth/AuthCard';
import { PreviewTabs } from '../components/auth/PreviewTabs';
import { SessionDebugger } from '../components/auth/SessionDebugger';
import { HeaderLogo } from '../components/layout/HeaderLogo';
import { useAuthPreview } from '../hooks/useAuthPreview';

// Page auth chịu trách nhiệm lắp ráp layout đăng nhập/đăng ký.
export function AuthPage() {
  const {
    changeMode,
    form,
    handleSubmit,
    isLogin,
    message,
    status,
    updateField,
    user,
  } = useAuthPreview();

  return (
    <main className="app-shell">
      <HeaderLogo />

      <PreviewTabs isLogin={isLogin} onModeChange={changeMode} />

      <AuthCard
        form={form}
        isLogin={isLogin}
        message={message}
        onChange={updateField}
        onModeChange={changeMode}
        onSubmit={handleSubmit}
        status={status}
      />

      <SessionDebugger user={user} />
    </main>
  );
}
