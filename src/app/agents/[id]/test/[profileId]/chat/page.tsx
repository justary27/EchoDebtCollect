'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { JudgeAgent, DebtAgent } from '@/lib/agents';
import type { Agent } from '@/types/agent';
import type { DebtProfile } from '@/types/debtProfile';

interface MessageEntry {
  speaker: string;
  message: string;
}

export default function TestMessageRunner() {
  const params = useParams();
  const agentId = params?.id as string;
  const profileId = params?.profileId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [profile, setProfile] = useState<DebtProfile | null>(null);
  const [history, setHistory] = useState<MessageEntry[]>([]);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const sessionEndedRef = useRef(false);
  const historyRef = useRef<MessageEntry[]>([]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const startBotConversation = useCallback(async (agentToUse: Agent, profileToUse: DebtProfile) => {
    const prompt = DebtAgent.systemPrompt({
      basePrompt: agentToUse.systemPrompt,
      profile: profileToUse,
      history: '',
    });

    try {
      const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, parse: false }),
      });

      const reply = await res.text();

      const agentReply: MessageEntry = {
        speaker: agentToUse.name,
        message: reply,
      };

      setHistory([agentReply]);
      historyRef.current = [agentReply];

      if (reply.includes('$$$')) {
        sessionEndedRef.current = true;
        setDone(true);
        await runJudge(reply, agentToUse.systemPrompt);
      }
    } catch (err) {
      console.error('Initial bot message failed:', err);
    }
  }, [agentId]);

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

      const agentData = await agentRes.json();
      const profileData = await profileRes.json();

      setAgent(agentData);
      setProfile(profileData);
      setLoading(false);

      await startBotConversation(agentData, profileData);
    };

    fetchAll();
  }, [agentId, profileId, startBotConversation]);

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

      const currentAgentRes = await fetch(`/api/agents/${agentId}`);
      const currentAgent = await currentAgentRes.json();
      const currentPrompt: string = currentAgent?.systemPrompt ?? '';

      const updatedPrompt = currentPrompt.replace(
        /⸻\s*Additional instructions\s*([\s\S]*?)⸻/,
        (_, oldInstructions: string) => {
          const combined = `${oldInstructions.trim()}\n${newInstructions || ''}`.trim();
          return `⸻\nAdditional instructions\n${combined}\n⸻`;
        }
      );

      await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: newScore,
          systemPrompt: updatedPrompt,
        }),
      });
    } catch (err) {
      console.error('Judge update failed:', err);
    }
  }, [agentId]);

  const handleSubmit = async () => {
    if (!input.trim() || !agent || !profile || sessionEndedRef.current) return;

    const userMessage: MessageEntry = {
      speaker: 'You',
      message: input.trim(),
    };

    const newHistory = [...historyRef.current, userMessage];
    setHistory(newHistory);
    setInput('');
    historyRef.current = newHistory;

    const conversation = newHistory.map((msg) => `${msg.speaker}: ${msg.message}`).join('\n');

    const prompt = DebtAgent.systemPrompt({
      basePrompt: agent.systemPrompt,
      profile,
      history: conversation,
    });

    try {
      const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, parse: false }),
      });

      const reply = await res.text();

      const agentReply: MessageEntry = {
        speaker: agent.name,
        message: reply,
      };

      const updatedHistory = [...historyRef.current, agentReply];
      setHistory(updatedHistory);
      historyRef.current = updatedHistory;

      if (reply.includes('$$$')) {
        sessionEndedRef.current = true;
        setDone(true);
        await runJudge(conversation, agent.systemPrompt);
      }
    } catch (err) {
      console.error('Agent response failed:', err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Freeform Message Test</h1>

      <div className="mb-4 text-white/80">
        <p>Agent: <strong>{agent?.name}</strong></p>
        <p>Debtor: <strong>{profile?.name}</strong> ({profile?.amount})</p>
        <p className="text-sm opacity-70">{profile?.context}</p>
      </div>

      <div className="bg-white/5 rounded-lg p-4 space-y-4 min-h-[300px]">
        {history.map((entry, idx) => {
          const isAgent = entry.speaker === agent?.name;
          return (
            <div key={idx} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
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

      {!done && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 px-4 py-2 rounded bg-gray-800 text-white"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-600 px-4 py-2 rounded text-white"
          >
            Send
          </button>
        </div>
      )}

      {done && (
        <p className="mt-4 text-green-400 font-medium">
          ✅ Session complete. Agent evaluated and updated.
        </p>
      )}
    </div>
  );
}
