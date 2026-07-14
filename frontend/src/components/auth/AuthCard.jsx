import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';

// Card form auth, tự đổi field/action theo chế độ đang chọn.
export function AuthCard({ form, isLogin, message, onChange, onModeChange, onSubmit, status }) {
  return (
    <section className="auth-card" aria-label={isLogin ? 'Sign in form' : 'Sign up form'}>
      <div className="card-header">
        <h2>{isLogin ? 'Welcome' : 'Create an account'}</h2>
        <p>{isLogin ? 'Enter your details to sign in' : 'Enter your details to get started'}</p>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        {/* Đăng ký thu thập dữ liệu profile trước các field auth dùng chung. */}
        {!isLogin && (
          <>
            <Field
              autoComplete="name"
              icon="user"
              label="Full Name"
              name="fullName"
              onChange={onChange}
              placeholder="Jane Doe"
              value={form.fullName}
            />

            <Field
              autoComplete="username"
              icon="user"
              label="Username"
              name="username"
              onChange={onChange}
              placeholder="janedoe"
              value={form.username}
            />
          </>
        )}

        {/* Đăng nhập dùng username vì backend xác thực bằng username. */}
        {isLogin ? (
          <Field
            autoComplete="username"
            icon="user"
            label="Username"
            name="username"
            onChange={onChange}
            placeholder="janedoe"
            value={form.username}
          />
        ) : (
          <Field
            autoComplete="email"
            icon="mail"
            label="Email address"
            name="email"
            onChange={onChange}
            placeholder="name@example.com"
            type="email"
            value={form.email}
          />
        )}

        <Field
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          icon="lock"
          label="Password"
          name="password"
          onChange={onChange}
          placeholder="••••••••"
          type="password"
          value={form.password}
        />

        {isLogin ? (
          <a className="forgot-link" href="#forgot">
            Forgot password?
          </a>
        ) : (
          <Field
            autoComplete="new-password"
            icon="lock"
            label="Confirm Password"
            name="confirmPassword"
            onChange={onChange}
            placeholder="••••••••"
            type="password"
            value={form.confirmPassword}
          />
        )}

        <button className="primary-button" type="submit" disabled={status === 'loading'}>
          <span>{status === 'loading' ? 'Working...' : isLogin ? 'Sign In' : 'Create Account'}</span>
          <Icon name="arrowRight" />
        </button>
      </form>

      {isLogin && (
        <>
          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>
          <button className="github-button" type="button">
            <Icon name="github" />
            <span>GitHub</span>
          </button>
        </>
      )}

      {message && <p className="message">{message}</p>}

      <p className="card-footer">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button type="button" onClick={() => onModeChange(isLogin ? 'register' : 'login')}>
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </section>
  );
}
