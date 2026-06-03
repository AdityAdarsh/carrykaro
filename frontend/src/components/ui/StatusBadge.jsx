const STATUS_COLORS = {
  open:       'var(--green)',
  requested:  'var(--saffron)',
  accepted:   'var(--green)',
  in_transit: 'var(--saffron)',
  completed:  'var(--ink-light)',
  declined:   '#CC3333',
}

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || 'var(--ink-light)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block',
        animation: ['open','accepted'].includes(status) ? 'pulse 2s infinite' : 'none' }} />
      {status.replace('_', ' ')}
    </span>
  )
}
