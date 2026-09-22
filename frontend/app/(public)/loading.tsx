export default function PublicLoading() {
  return <div className="container public-loading" role="status" aria-label="Cargando">
    <div className="skeleton public-loading-hero" />
    <div className="product-grid">{Array.from({ length: 4 }, (_, index) => <div className="skeleton public-loading-card" key={index} />)}</div>
  </div>;
}
