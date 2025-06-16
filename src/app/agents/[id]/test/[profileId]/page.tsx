'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DebtAgent, DebtorAgent, JudgeAgent } from '@/lib/agents';
import type { Agent } from '@/types/agent';
import type { DebtProfile } from '@/types/debtProfile';


interface MessageEntry {
  speaker: string;
  message: string;
}

export default function TestSessionRunner() {
  const params = useParams();
  const agentId = params?.id as string;
  const profileId = params?.profileId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [profile, setProfile] = useState<DebtProfile | null>(null);
  const [history, setHistory] = useState<MessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const currentSpeakerRef = useRef<'debt_agent' | 'debtor'>('debt_agent');
  const sessionEndedRef = useRef(false);
  const runningRef = useRef(false);
  const turnInProgressRef = useRef(false);
  const historyRef = useRef<MessageEntry[]>([]);

  // Keep historyRef in sync with latest state
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (!agentId || !profileId) return;

    const fetchAll = async () => {
      const [agentRes, profileRes] = await Promise.all([
        fetch(`/api/agents/${agentId}`),
        fetch(`/api/agents/${agentId}/profiles/${profileId}`),
      ]);

      if (!agentRes.ok || !profileRes.ok) {
        setLoading(false);
        return;
      }

      setAgent(await agentRes.json());
      setProfile(await profileRes.json());
      setLoading(false);
    };

    fetchAll();
  }, [agentId, profileId]);

  const runJudge = useCallback(async (conversation: string, basePrompt: string) => {
    const judgePrompt = JudgeAgent.systemPrompt({
      currentPrompt: basePrompt,
      conversation,
    });

    try {
      const judgeRes = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: judgePrompt, parse: true }),
      });

      const parsed = await judgeRes.json();
      const newScore = parsed?.score ?? 0;
      const newInstructions = parsed?.additionalInstructions?.trim();

      // Fetch current agent data to access the existing systemPrompt
      const currentAgentRes = await fetch(`/api/agents/${agentId}`);
      const currentAgent = await currentAgentRes.json();
      const currentPrompt: string = currentAgent?.systemPrompt ?? '';

      // Append the new instructions into the existing prompt
      const updatedPrompt = currentPrompt.replace(
        /⸻\s*Additional instructions\s*([\s\S]*?)⸻/,
        (_, oldInstructions: string) => {
          const combined = `${oldInstructions.trim()}\n${newInstructions || ''}`.trim();
          return `⸻\nAdditional instructions\n${combined}\n⸻`;
        }
      );

      // Update the agent with new score and updated prompt
      await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: newScore,
          systemPrompt: updatedPrompt,
        }),
      }); 
    } catch (err) {
      console.error('Failed to parse judge output:', err);
    }
  }, [agentId]);

  useEffect(() => {
    if (!agent || !profile || done || runningRef.current) return;

    currentSpeakerRef.current = 'debt_agent';
    sessionEndedRef.current = false;
    runningRef.current = true;

    const basePrompt = agent.systemPrompt;

    const runTurn = async () => {
      if (sessionEndedRef.current || turnInProgressRef.current) return;

      turnInProgressRef.current = true;

      const conversation = historyRef.current
        .map((msg) => `${msg.speaker}: ${msg.message}`)
        .join('\n');

      const prompt =
        currentSpeakerRef.current === 'debt_agent'
          ? DebtAgent.systemPrompt({ basePrompt, profile, history: conversation })
          : DebtorAgent.systemPrompt({...profile, history: conversation});

      try {
        const res = await fetch('/api/gemini-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, parse: false }),
        });

        const output = await res.text();
        const speakerName =
          currentSpeakerRef.current === 'debt_agent' ? agent.name : profile.name;

        const messageEntry = { speaker: speakerName, message: output };

        // Add to state and ref
        setHistory((prev) => {
          const updated = [...prev, messageEntry];
          historyRef.current = updated; // sync
          return updated;
        });

        if (output.includes('$$$')) {
          sessionEndedRef.current = true;
          setDone(true);

          const fullConversation = [...historyRef.current]
            .map((msg) => `${msg.speaker}: ${msg.message}`)
            .join('\n');

          await runJudge(fullConversation, basePrompt);
        } else {
          currentSpeakerRef.current =
            currentSpeakerRef.current === 'debt_agent' ? 'debtor' : 'debt_agent';
          setTimeout(() => {
            turnInProgressRef.current = false;
            runTurn();
          }, 10000); // UX wait time
        }
      } catch (error) {
        console.error('Error in runTurn:', error);
        sessionEndedRef.current = true;
        setDone(true);
      }
    };

    runTurn();

    return () => {
      runningRef.current = false;
      sessionEndedRef.current = true;
    };
  }, [agent, profile, agentId, done, runJudge]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simulated Test Session</h1>

      <div className="mb-4 text-white/80">
        <p>
          Agent: <strong>{agent?.name}</strong>
        </p>
        <p>
          Debtor: <strong>{profile?.name}</strong> ({profile?.amount})
        </p>
        <p className="text-sm opacity-70">{profile?.context}</p>
      </div>

      <div className="bg-white/5 rounded-lg p-4 space-y-4 min-h-[300px]">
        {history.map((entry, idx) => {
          const isAgent = entry.speaker === agent?.name;

          return (
            <div
              key={idx}
              className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-xl whitespace-pre-wrap ${
                  isAgent
                    ? 'bg-blue-600 text-white rounded-bl-none'
                    : 'bg-green-600 text-white rounded-br-none'
                }`}
              >
                <div className="font-bold mb-1">{entry.speaker}</div>
                <div>{entry.message}</div>
              </div>
            </div>
          );
        })}
      </div>

      {done && (
        <p className="mt-4 text-green-400 font-medium">
          ✅ Test complete. Agent evaluated and updated.
        </p>
      )}
    </div>
  );
}
