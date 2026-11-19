export default function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded-xl ${className}`} style={style} />;
}