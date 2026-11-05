import React, { useState, useEffect } from 'react';

// TypeScript interface for snapshots
interface Snapshot {
  id: number;
  timestamp: string;
  temp: string;
  pressure: string;
  status: 'Normal' | 'Warning';
}

export default function HistoricalData() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  // Simulated live snapshots feed
  useEffect(() => {
    const interval = setInterval(() => {
      const newSnapshot: Snapshot = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        temp: (20 + Math.random() * 5).toFixed(2),
        pressure: (100 + Math.random() * 10).toFixed(2),
        status: Math.random() > 0.1 ? 'Normal' : 'Warning',
      };

      setSnapshots((prev) => [newSnapshot, ...prev].slice(0, 50));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full border rounded-lg shadow-sm bg-white overflow-hidden my-4">
      {/* Expandable Header / Tab Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-left font-semibold flex justify-between items-center border-b transition-colors text-gray-800"
      >
        <span>Historical Data Table View ({snapshots.length} Snapshots)</span>
        <span>{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
      </button>

      {/* Expandable Scrolling Container */}
      {isOpen && (
        <div className="max-h-64 overflow-y-auto border-t border-gray-200">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 sticky top-0 border-b text-gray-700">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Temperature (°C)</th>
                <th className="p-3">Pressure (kPa)</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    Waiting for data snapshots...
                  </td>
                </tr>
              ) : (
                snapshots.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50 text-gray-800">
                    <td className="p-3 font-mono text-gray-600">{row.timestamp}</td>
                    <td className="p-3">{row.temp}</td>
                    <td className="p-3">{row.pressure}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.status === 'Normal'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}