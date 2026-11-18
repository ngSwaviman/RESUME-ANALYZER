import { statusTone } from '../utils/format';

export default function Badge({ status, children, className = '' }) {
  const label = children || status;
  return (
    <span className={`chip capitalize ${statusTone(status)} ${className}`}>{String(label).replace('-', ' ')}</span>
  );
}
