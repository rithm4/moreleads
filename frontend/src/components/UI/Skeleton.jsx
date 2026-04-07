export function Skeleton({ width, height = '16px', radius = '6px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: width || '100%', height, borderRadius: radius }}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="skeleton-card">
      <Skeleton height="18px" width="60%" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} height="13px" width={i === lines - 2 ? '40%' : '90%'} />
      ))}
    </div>
  );
}
