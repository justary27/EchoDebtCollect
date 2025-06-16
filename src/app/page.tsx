'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Agent } from '@/types/agent';

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => {
        setAgents(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching agents:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-4 text-gray-500">Loading...</p>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Agents</h1>
        <Link
          href="/agents/create"
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-1 rounded-lg text-sm font-medium transition font-semibold"
        >
          + Create
        </Link>
      </div>

      {agents.length === 0 ? (
        <p className="text-white">No agents found.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border rounded-xl shadow-md transition flex flex-col gap-2 cursor-pointer hover:shadow-lg hover:bg-white/10"
              onClick={() => router.push(`agents/${agent.id}`)}
            >
              <div className="">
                <div className="w-full h-20 text-3xl rounded-t-xl border bg-white text-black inline-flex items-center justify-center">{agent.name[0].toUpperCase()}</div>
                <div className='p-3 flex justify-between items-center'>
                  <div>
                    <h2 className="text-lg font-semibold">{agent.name}</h2>
                    <p className="text-white/70 text-sm">{agent.scenario}</p>
                  </div>
                  <div>{new Date(agent.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}
