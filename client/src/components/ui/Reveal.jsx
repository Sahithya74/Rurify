import useReveal from '../../hooks/useReveal';

const VARIANT_CLASS = {
  up: 'reveal',
  scale: 'reveal-scale',
  left: 'reveal-left',
  right: 'reveal-right',
};

export default function Reveal({ as: Tag = 'div', variant = 'up', delay, className = '', children, ...props }) {
  const ref = useReveal();
  const stagger = delay ? `stagger-${delay}` : '';
  return (
    <Tag ref={ref} className={`${VARIANT_CLASS[variant]} ${stagger} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
