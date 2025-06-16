'use client';

import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
} from '@livekit/components-react';
import { Room, Track, RemoteTrack, RemoteTrackPublication, RemoteParticipant } from 'livekit-client';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { joinAgentToRoom } from '@/lib/agentClient';
import { startSpeechRecognition } from '@/lib/speech';

export default function Page() {
  const room = 'quickstart-room';
  const name = 'quickstart-user';
  const params = useParams();
  const agentId = params?.id as string;
  const router = useRouter();

  const [roomInstance] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }));

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const resp = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: name,
            roomName: room,
          }),
        });

        const data = await resp.json();
        if (!mounted) return;

        if (data.token) {
          setToken(data.token);
          await roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token);

          roomInstance.on('disconnected', () => {
            router.push(`/agents/${agentId}`);
          });

          const resp = await fetch(`/api/agents/${agentId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName: room }),
          });

          const res = await resp.json();

          await joinAgentToRoom({
            token: res.token,
            url: process.env.NEXT_PUBLIC_LIVEKIT_URL!,
            name: res.name,
            onTrackSubscribed: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
              if (track.kind === 'audio') {
                const audioTrack = track;
                const mediaStream = new MediaStream([audioTrack.mediaStreamTrack]);
                console.log(`[Agent] Subscribed to audio from ${participant.identity}`);
                startSpeechRecognition(
                  mediaStream, (transcript) => console.log(`[Agent] Transcript: ${transcript}`), participant);
              }
            },
            onParticipantConnected: (participant: RemoteParticipant) => {
              console.log(`[Agent] Participant connected: ${participant.identity}`);
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      mounted = false;
      roomInstance.disconnect();
    };
  }, [agentId, roomInstance, router]);

  if (!token) {
    return <div className="p-4">Getting token...</div>;
  }

  return (
    <RoomContext.Provider value={roomInstance}>
      <div
        data-lk-theme="default"
        className="flex flex-col h-[50vh] overflow-hidden"
      >
        <div className="flex-1 overflow-hidden">
          <MyVideoConference />
        </div>
        <RoomAudioRenderer />
        <ControlBar />
      </div>
    </RoomContext.Provider>
  );
}

function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}
