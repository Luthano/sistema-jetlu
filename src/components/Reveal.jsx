import { useReveal } from '../hooks/useReveal'

function Reveal({ children, className = '', delay = 0, as: Tag = 'div', style, ...rest }) {
  const { ref, visible } = useReveal()

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{
        ...(delay ? { '--reveal-delay': `${delay}ms` } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default Reveal
