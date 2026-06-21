import Icon from './Icon'

export default function EmptyState({ icon = 'shelf', title, subtitle }) {
  return (
    <div className="rs-empty">
      <div className="rs-empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <p className="rs-empty-title">{title}</p>
      {subtitle && <p className="rs-empty-subtitle">{subtitle}</p>}
    </div>
  )
}
