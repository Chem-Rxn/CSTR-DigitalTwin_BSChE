import React from 'react';

// Data structure matching simulation snapshots
interface ExportData {
  timestamp: string;
  temp: string;
  pressure: string;
  status: string;
}

interface CSVExportButtonProps {
  data?: ExportData[];
}

export default function CSVExportButton({ data }: CSVExportButtonProps) {
  const handleExport = () => {
    // Simulated session history data if no dynamic props are passed
    const exportItems: ExportData[] = data && data.length > 0 ? data : [
      { timestamp: new Date().toLocaleTimeString(), temp: '22.45', pressure: '101.32', status: 'Normal' },
      { timestamp: new Date().toLocaleTimeString(), temp: '23.10', pressure: '102.05', status: 'Normal' },
      { timestamp: new Date().toLocaleTimeString(), temp: '25.80', pressure: '105.40', status: 'Warning' },
    ];

    // Prepare CSV header and content
    const headers = ['Timestamp', 'Temperature (C)', 'Pressure (kPa)', 'Status'];
    const rows = exportItems.map((item) => [
      item.timestamp,
      item.temp,
      item.pressure,
      item.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Trigger standard browser file download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSTR_Simulation_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
    >
      <svg
        className="w-4 h-4 fill-current"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
      </svg>
      Export Session CSV
    </button>
  );
}