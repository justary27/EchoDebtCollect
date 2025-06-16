'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DebtProfile } from '@/types/debtProfile';
import Link from 'next/link';

export default function AgentTestPage() {
  const params = useParams();
  const agentId = params?.id as string;

  const [profiles, setProfiles] = useState<DebtProfile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;

    fetch(`/api/agents/${agentId}/profiles`)
      .then((res) => res.json())
      .then((data) => {
        setProfiles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch debt profiles:', err);
        setLoading(false);
      });
  }, [agentId]);

  const router = useRouter();

    const handleStartTest = () => {
    if (selectedIndex === null) return;
    const selected = profiles[selectedIndex];
    router.push(`/agents/${agentId}/test/${selected.id}`);
    };

  if (loading) return <p className="p-12 text-gray-500">Loading debt profiles...</p>;

  return (
    <div className="p-8">
      <Link href={`/agents/${agentId}`} className="text-sm text-white/60 hover:text-white">
        &larr; Back to Agent
      </Link>

      <h1 className="text-2xl font-bold mb-4 mt-4">Select a Debt Profile</h1>

      {profiles.length === 0 && (
        <p className="text-white/70">No debt profiles found for this agent.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {profiles.map((profile, index) => (
          <div
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`border rounded-lg p-4 cursor-pointer transition ${
              selectedIndex === index
                ? 'bg-white/10 border-white'
                : 'bg-white/5 border-white/20 hover:bg-white/10'
            }`}
          >
            <h2 className="text-lg font-bold mb-1">{profile.name}</h2>
            <p className="text-white/80 text-sm mb-1">Amount: {profile.amount}</p>
            <p className="text-white/60 text-xs">{profile.context}</p>
          </div>
        ))}
      </div>

      <button
        disabled={selectedIndex === null}
        onClick={handleStartTest}
        className={`mt-6 px-6 py-2 rounded-md text-sm font-medium transition ${
          selectedIndex === null
            ? 'bg-white/20 text-white/40 cursor-not-allowed'
            : 'bg-white/30 hover:bg-white/20 text-white'
        }`}
      >
        Start Test Session
      </button>
    </div>
  );
}