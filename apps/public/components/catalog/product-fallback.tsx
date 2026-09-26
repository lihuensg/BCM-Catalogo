export function ProductFallback({ label = 'BCM' }: { label?: string }) {
  const text = label.trim().slice(0, 3).toUpperCase() || 'BCM';
  return <span className="product-fallback" aria-hidden="true">
    <span className="product-fallback-orb">{text}</span>
    <span className="product-fallback-caption">BCM SELECT</span>
  </span>;
}
