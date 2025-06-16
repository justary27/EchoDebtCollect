'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateAgentPage() {
  const [name, setName] = useState('');
  const [scenario, setScenario] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !scenario.trim()) {
      setError('Both fields are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scenario }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create agent');
      }

      router.push('/');
    } catch (err: { message?: string } | unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8">
      <Link
        href="/"
        className="inline-block mb-6 text-sm text-white/70 hover:text-white transition"
      >
        &larr; Back
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Create a New Voice Agent</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-white-700">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., TeleBot"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white-700">Scenario</label>
          <input
            type="text"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="mt-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Telecom unpaid bills"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="mt-4 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Agent'}
        </button>
      </form>
    </div>
  );
}
