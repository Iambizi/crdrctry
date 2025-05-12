import { useState } from 'react';
import styles from './VerificationCard.module.scss';

type UpdateType = 'Designer' | 'Brand' | 'Acquisition';
type Status = 'pending' | 'verified' | 'rejected';

interface Difference {
  field: string;
  original: string;
  modified: string;
}

interface VerificationCardProps {
  type: UpdateType;
  title: string;
  differences: Difference[];
  confidenceScore: number;
  source: string;
  evidence: string;
  timestamp: string;
  status?: Status;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function VerificationCard({
  type,
  title,
  differences,
  confidenceScore,
  source,
  evidence,
  timestamp,
  status = 'pending',
  onApprove,
  onReject,
}: VerificationCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getConfidenceLevel = (score: number) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsLoading(true);
    try {
      await onApprove();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsLoading(true);
    try {
      await onReject();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3>{type} Update</h3>
          <div className={styles.timestamp}>{timestamp}</div>
        </div>
        <div className={`${styles.badge} ${styles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <div className={styles.section}>
        <h4>Title</h4>
        <div>{title}</div>
      </div>

      <div className={styles.section}>
        <h4>Differences</h4>
        <table className={styles.diffTable}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Original</th>
              <th>Modified</th>
            </tr>
          </thead>
          <tbody>
            {differences.map((diff) => (
              <tr key={diff.field}>
                <td>{diff.field}</td>
                <td>{diff.original}</td>
                <td className={styles.modified}>{diff.modified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.section}>
        <h4>Confidence Score</h4>
        <div className={styles.confidenceScore}>
          <div className={`${styles.score} ${styles[getConfidenceLevel(confidenceScore)]}`}>
            {confidenceScore}%
          </div>
          <div className={styles.source}>
            Source: <a href={source} target="_blank" rel="noopener noreferrer">{source}</a>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Evidence</h4>
        <div className={styles.evidence}>{evidence}</div>
      </div>

      {status === 'pending' && (
        <div className={styles.actions}>
          <button
            className={styles.reject}
            onClick={handleReject}
            disabled={isLoading}
          >
            Reject
          </button>
          <button
            className={styles.approve}
            onClick={handleApprove}
            disabled={isLoading}
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
