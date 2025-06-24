'use client'

import { useEffect, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/health`);
        const data = await response.json();
        setStatus(data.status);
      } catch (error) {
        setStatus('error');
        console.error('Failed to fetch health status:', error);
      }
    };

    fetchHealthStatus();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">LawFirm OS</h1>
        <div className="text-xl">
          <p>Backend Status: <span className={status === 'ok' ? 'text-green-600' : 'text-red-600'}>{status}</span></p>
        </div>
      </div>
    </main>
  );
}
