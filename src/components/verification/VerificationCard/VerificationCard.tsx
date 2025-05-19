'use client';

import React, { useState } from 'react';
import { SmartEntryEditor } from '../SmartEntryEditor/SmartEntryEditor';
import toast from 'react-hot-toast';
import styles from './VerificationCard.module.scss';

type UpdateType = 'Designer' | 'Brand' | 'Acquisition';
type Status = 'pending' | 'verified' | 'rejected';

interface Difference {
  field: string;
  original: string;
  modified: string;
}

interface VerificationCardProps {
  id: string;
  type: UpdateType;
  title: string;
  timestamp: string;
  status: Status;
  differences: Difference[];
  confidenceScore: number;
  source: string;
  evidence: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function VerificationCard({
  id,
  type,
  title,
  timestamp,
  status,
  differences,
  confidenceScore,
  source,
  evidence,
  selected,
  onSelect,
  onApprove,
  onReject,
}: VerificationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      toast.success('Update approved successfully');
    } catch (error) {
      toast.error(`Failed to approve update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsLoading(true);
    try {
      await onReject();
      toast.success('Update rejected');
    } catch (error) {
      toast.error(`Failed to reject update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (updatedData: { name: string; nationality?: string; is_active?: boolean }) => {
    setIsLoading(true);
    try {
      // TODO: Implement save logic
      console.log('Saving:', updatedData);
      toast.success('Changes saved successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <SmartEntryEditor
        data={{
          name: title,
          nationality: differences.find(d => d.field === 'nationality')?.modified || '',
          is_active: differences.find(d => d.field === 'is_active')?.modified === 'true'
        }}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div 
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect?.(id)}
    >
      <div className={styles.header}>
        <div>
          <h3>{type} Update</h3>
          <div className={styles.title}>{title}</div>
          <div className={styles.timestamp}>{timestamp}</div>
        </div>
        <div className={`${styles.badge} ${styles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <div className={styles.compareSection}>
        <div>
          <h4>Original Data</h4>
          <pre className={styles.codeBlock}>
            {JSON.stringify({
              name: differences.find(d => d.field === 'name')?.original || '',
              nationality: differences.find(d => d.field === 'nationality')?.original || '',
              is_active: differences.find(d => d.field === 'is_active')?.original || '',
            }, null, 2)}
          </pre>
        </div>
        <div>
          <h4>Proposed Changes</h4>
          <pre className={styles.codeBlock}>
            {JSON.stringify({
              name: differences.find(d => d.field === 'name')?.modified || '',
              nationality: differences.find(d => d.field === 'nationality')?.modified || '',
              is_active: differences.find(d => d.field === 'is_active')?.modified || '',
            }, null, 2)}
          </pre>
        </div>
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
              <tr 
                key={diff.field} 
                className={diff.original !== diff.modified ? styles.changed : ''}
              >
                <td>{diff.field}</td>
                <td>{diff.original}</td>
                <td className={diff.original !== diff.modified ? styles.modified : ''}>
                  {diff.modified}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.section}>
        <h4>Confidence Score</h4>
        <div className={styles.confidenceScore}>
          <div 
            className={`${styles.scoreBar} ${styles[getConfidenceLevel(confidenceScore)]}`}
            title={`${getConfidenceLevel(confidenceScore).toUpperCase()} confidence: ${confidenceScore}%`}
          >
            <div 
              className={styles.scoreProgress} 
              style={{ width: `${confidenceScore}%` }}
              role="progressbar"
              aria-valuenow={confidenceScore}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {confidenceScore}%
            </div>
          </div>
          <div className={styles.confidenceLabel}>
            {getConfidenceLevel(confidenceScore) === 'high' && 'High confidence: Quick approval recommended'}
            {getConfidenceLevel(confidenceScore) === 'medium' && 'Medium confidence: Review changes carefully'}
            {getConfidenceLevel(confidenceScore) === 'low' && 'Low confidence: Needs thorough verification'}
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
            onClick={handleEdit}
            className={`${styles.button} ${styles.edit}`}
          >
            Edit
          </button>
          <button
            onClick={handleReject}
            className={`${styles.button} ${styles.reject}`}
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            className={`${styles.button} ${styles.approve}`}
            disabled={isLoading}
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
