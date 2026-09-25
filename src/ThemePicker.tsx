import { THEMES, type Theme } from './lib/theme'

type Props = {
  theme: Theme
  onChange: (theme: Theme) => void
}

export function ThemePicker({ theme, onChange }: Props) {
  return (
    <section className="theme-picker">
      <span className="theme-label">
        Thème <span className="theme-name">{theme.name}</span>
      </span>
      <div className="swatches" role="radiogroup" aria-label="Thème de couleurs">
        {THEMES.map((t) => (
          <button
            key={t.id}
            role="radio"
            aria-checked={t.id === theme.id}
            aria-label={t.name}
            title={t.name}
            className="swatch"
            style={{
              background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
              borderColor: t.border,
            }}
            onClick={() => onChange(t)}
          />
        ))}
      </div>
    </section>
  )
}
