'use client';

import VerificationDashboard from '@/components/verification/VerificationDashboard';

// Sample data - replace with actual data fetching
const sampleData = {
  stats: {
    pending: 2,
    verified: 0,
    rejected: 0,
  },
  updates: [
    {
      id: '1',
      type: 'Designer' as const,
      title: 'Designer Update',
      differences: [
        {
          field: 'nationality',
          original: 'Italian',
          modified: 'French',
        },
        {
          field: 'is_active',
          original: 'true',
          modified: 'true',
        },
      ],
      confidenceScore: 87,
      source: 'www.vogue.com',
      evidence: 'According to Vogue\'s latest article, John Doe is actually French, not Italian as previously recorded.',
      timestamp: 'less than a minute ago',
      status: 'pending' as const,
    },
    {
      id: '2',
      type: 'Acquisition' as const,
      title: 'Brand Acquisition',
      differences: [
        {
          field: 'name',
          original: 'Luxury Brand',
          modified: 'Luxury Brand',
        },
        {
          field: 'founded_year',
          original: '1990',
          modified: '1990',
        },
        {
          field: 'parent_company',
          original: 'Not present',
          modified: 'Luxury Group',
        },
      ],
      confidenceScore: 95,
      source: 'www.businessoffashion.com',
      evidence: 'Business of Fashion reports that Luxury Brand has been acquired by Luxury Group.',
      timestamp: 'less than a minute ago',
      status: 'pending' as const,
    },
  ],
};

export default function DashboardPage() {
  const handleApprove = async (id: string) => {
    // Implement approval logic
    console.log('Approving update:', id);
  };

  const handleReject = async (id: string) => {
    // Implement rejection logic
    console.log('Rejecting update:', id);
  };

  return (
    <VerificationDashboard
      stats={sampleData.stats}
      updates={sampleData.updates}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
