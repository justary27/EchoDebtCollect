'use client';

import {
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
  LiveKitRoom,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useState } from 'react';
import { joinAgentToRoom } from '@/lib/agentClient';

export default function CallPage() {
  const [number, setNumber] = useState('');
  const [status, setStatus] = useState('');
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  async function handleCall() {
    setStatus('Dialing...');

    const numberToCall = number || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

    const res = await fetch('/api/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: numberToCall }),
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus('Error: ' + err.message);
      return;
    }

    const { roomName, token } = await res.json();
    setRoomToken(token);
    setRoomName(roomName);
    setStatus(`Connected to room ${roomName}`);

    // Agent joins with separate token
    const agentRes = await fetch(`/api/agents/quickstart-id/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName }),
    });

    const agentData = await agentRes.json();

    await joinAgentToRoom({
    token: agentData.token,
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL!,
    name: agentData.name || 'Agent',
    onTrackSubscribed: (track, publication, participant) => {
      if (track.kind === 'audio') {
        // const audioTrack = track;
        // const mediaStream = new MediaStream([audioTrack.mediaStreamTrack]);
        console.log(`[Agent] Subscribed to audio from ${participant.identity}`);
        // startSpeechRecognition(mediaStream);
      }
    },
    onParticipantConnected: (participant) => {
      console.log(`[Agent] New participant: ${participant.identity}`);
    },
  });
  }

  return (
    <div className="p-4">
      {!roomToken && (
        <>
          <h1 className="text-xl font-bold mb-4">Call a US Number</h1>
          <input
            type="tel"
            placeholder="+1XXXXXXXXXX"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="p-2 border rounded w-full mb-4"
          />
          <button
            onClick={handleCall}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Call
          </button>
          <p className="mt-4 text-gray-700">{status}</p>
        </>
      )}

      {roomToken && roomName && (
        <LiveKitRoom
          token={roomToken}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={true}
          data-lk-theme="default"
          style={{ height: '50vh' }}
        >
          <RoomAudioRenderer />
          <ParticipantList />
          <ControlBar />
        </LiveKitRoom>
      )}
    </div>
  );
}

function ParticipantList() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}
