interface ExportData {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  status: string;
  confidenceScore: number;
  source: string;
  differences: {
    field: string;
    original: string;
    modified: string;
  }[];
}

export const exportToCSV = (data: ExportData[], filename: string = 'verification-data.csv') => {
  // Define CSV headers
  const headers = [
    'ID',
    'Type',
    'Title',
    'Timestamp',
    'Status',
    'Confidence Score',
    'Source',
    'Changes'
  ];

  // Transform data to CSV rows
  const rows = data.map(item => {
    const changes = item.differences
      .map(d => `${d.field}: ${d.original} → ${d.modified}`)
      .join('; ');

    return [
      item.id,
      item.type,
      item.title,
      item.timestamp,
      item.status,
      item.confidenceScore.toString(),
      item.source,
      changes
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        // Escape quotes and wrap in quotes if contains comma or newline
        cell.includes(',') || cell.includes('\n') || cell.includes('"') 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
