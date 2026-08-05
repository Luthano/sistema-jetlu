import { useReveal } from '../hooks/useReveal'

function Reveal({ children, className = '', delay = 0, as: Tag = 'div', style }) {
  const { ref, visible } = useReveal()

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{
        ...(delay ? { '--reveal-delay': `${delay}ms` } : {}),
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

export default Reveal
