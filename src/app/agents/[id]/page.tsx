'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Agent } from '@/types/agent';
import Link from 'next/link';

export default function AgentDetailsPage() {
  const params = useParams();
  const agentId = params?.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;

    fetch(`/api/agents/${agentId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        setAgent(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching agent:', err);
        setLoading(false);
      });
  }, [agentId]);

  if (loading) return <p className="p-12 text-gray-500">Loading agent details...</p>;

  if (!agent) return <p className="p-12 text-red-500">Agent not found.</p>;

  return (
    <div className="p-8">
      <Link
        href="/"
        className="inline-block mb-6 text-sm text-white/70 hover:text-white transition"
      >
        &larr; Back
      </Link>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <h1 className="text-2xl font-bold mb-2">{agent.name}</h1>
          <p className="font-semibold text-white/60 mb-1">{agent.scenario}</p>
        </div>
        <div className="text-sm text-white/80 mb-6 space-x-2">
          <span className='text-sm'>Score:</span>
          <span className='text-2xl'>{agent.score}/100</span>
        </div>
      </div>

      <h2 className='text-xl font-bold mb-2'>Actions</h2>

      <div className='flex space-x-4'>
        <Link
          href={`${agentId}/talk`}
          className="inline-block bg-white/30 hover:bg-white/20 text-white px-5 py-2 rounded-md text-sm font-medium transition"
        >
          Talk now
        </Link>

        <Link
          href={`${agentId}/call`}
          className="inline-block bg-white/30 hover:bg-white/20 text-white px-5 py-2 rounded-md text-sm font-medium transition"
        >
          Call a number
        </Link>

        <Link
          href={`${agentId}/test`}
          className="inline-block bg-white/30 hover:bg-white/20 text-white px-5 py-2 rounded-md text-sm font-medium transition"
        >
          Self correct with Auto testing
        </Link>
      </div>

    </div>
  );
}
