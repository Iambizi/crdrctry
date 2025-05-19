'use client';

import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import styles from './VerificationDashboard.module.scss';
import VerificationCard from '../VerificationCard/VerificationCard';

type Status = 'pending' | 'verified' | 'rejected';

interface TabItem {
  label: string;
  value: Status;
  count: number;
}

interface Stats {
  pending: number;
  verified: number;
  rejected: number;
}

interface Update {
  id: string;
  type: 'Designer' | 'Brand' | 'Acquisition';
  title: string;
  differences: Array<{
    field: string;
    original: string;
    modified: string;
  }>;
  confidenceScore: number;
  source: string;
  evidence: string;
  timestamp: string;
  status: Status;
}

interface VerificationDashboardProps {
  stats: Stats;
  updates: Update[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export default function VerificationDashboard({
  stats,
  updates,
  onApprove,
  onReject,
}: VerificationDashboardProps) {
  const [activeTab, setActiveTab] = useState<Status>('pending');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const tabs: TabItem[] = [
    { label: 'Pending', value: 'pending', count: stats.pending },
    { label: 'Verified', value: 'verified', count: stats.verified },
    { label: 'Rejected', value: 'rejected', count: stats.rejected },
  ];

  const filteredUpdates = updates.filter((update) => update.status === activeTab);

  const handleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    // TODO: Implement batch approve logic
    console.log('Approving:', selectedItems);
    setSelectedItems([]);
  };

  const handleBatchReject = () => {
    // TODO: Implement batch reject logic
    console.log('Rejecting:', selectedItems);
    setSelectedItems([]);
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#15803d',
            },
          },
          error: {
            style: {
              background: '#b91c1c',
            },
          },
        }}
      />
      <div className={styles.container}>
      {selectedItems.length > 0 && (
        <div className={styles.batchActions}>
          <span>{selectedItems.length} items selected</span>
          <div className={styles.buttons}>
            <button
              onClick={handleBatchReject}
              className={`${styles.button} ${styles.reject}`}
            >
              Reject Selected
            </button>
            <button
              onClick={handleBatchApprove}
              className={`${styles.button} ${styles.approve}`}
            >
              Approve Selected
            </button>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Verification Dashboard</h1>
          <p>Review and verify AI suggested updates</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.button}>Export</button>
          <button className={`${styles.button} ${styles.primary}`}>View All</button>
        </div>
      </div>

      <div className={styles.stats}>
        {tabs.map((tab) => (
          <div key={tab.value} className={styles.statCard}>
            <h3>{tab.label}</h3>
            <div className={`${styles.count} ${styles[tab.value]}`}>{tab.count}</div>
            <p>
              {tab.value === 'pending'
                ? 'Awaiting verification'
                : tab.value === 'verified'
                ? 'Approved updates'
                : 'Denied updates'}
            </p>
          </div>
        ))}
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filteredUpdates.length > 0 ? (
          filteredUpdates.map((update) => (
            <VerificationCard
              key={update.id}
              {...update}
              selected={selectedItems.includes(update.id)}
              onSelect={handleSelect}
              onApprove={() => onApprove(update.id)}
              onReject={() => onReject(update.id)}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <h3>No {activeTab} updates</h3>
            <p>
              {activeTab === 'pending'
                ? 'All caught up! No updates waiting for verification.'
                : `No ${activeTab} updates found.`}
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
