export default function Spinner({ label = 'Loading…' }) {
  return <span className="status" role="status" aria-live="polite"><span className="dot" aria-hidden="true" />{label}</span>;
}
