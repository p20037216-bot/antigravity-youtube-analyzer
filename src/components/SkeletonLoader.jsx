export default function SkeletonLoader() {
  return (
    <div className="skeleton-container">
      <div className="skeleton-card">
        <div className="skeleton-thumb" />
        <div className="skeleton-line wide" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line narrow" />
      </div>
      <div className="skeleton-grades">
        <div className="skeleton-grade-card" />
        <div className="skeleton-grade-card" />
        <div className="skeleton-grade-card" />
      </div>
    </div>
  )
}
