// Toggle preview để chuyển giữa trạng thái đăng nhập và đăng ký.
export function PreviewTabs({ isLogin, onModeChange }) {
  return (
    <div className="preview-tabs" aria-label="Preview auth page">
      <button className={isLogin ? 'active' : ''} type="button" onClick={() => onModeChange('login')}>
        Sign In
      </button>
      <button className={!isLogin ? 'active' : ''} type="button" onClick={() => onModeChange('register')}>
        Sign Up
      </button>
    </div>
  );
}
