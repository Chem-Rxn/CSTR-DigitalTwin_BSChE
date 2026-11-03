// src/App.tsx
import { useEffect } from 'react';
import Dashboard from '@/components/ui/Dashboard';
import { startEngine } from '@/engine/bridge';

export default function App() {
  useEffect(() => startEngine(), []);
  return <Dashboard />;
}
