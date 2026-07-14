import { Icon } from './Icon';

// Input có label tái sử dụng, kèm icon bên trái và style dùng chung.
export function Field({ autoComplete, icon, label, name, onChange, placeholder, type = 'text', value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-shell">
        <Icon name={icon} />
        <input
          autoComplete={autoComplete}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required
          type={type}
          value={value}
        />
      </span>
    </label>
  );
}
