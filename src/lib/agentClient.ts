import { Room, RemoteTrack, RemoteTrackPublication, RemoteParticipant } from 'livekit-client';

type JoinAgentOptions = {
  token: string;
  url: string;
  name?: string;
  onTrackSubscribed?: (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => void;
  onParticipantConnected?: (participant: RemoteParticipant) => void;
};

export async function joinAgentToRoom({
  token,
  url,
  name = 'Agent',
  onTrackSubscribed,
  onParticipantConnected,
}: JoinAgentOptions): Promise<Room> {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  await room.connect(url, token);
  console.log(`[Agent: ${name}] Joined room`);

  room.on('trackSubscribed', (track, publication, participant) => {
    if (onTrackSubscribed) {
      onTrackSubscribed(track, publication, participant);
    }
  });

  room.on('participantConnected', (participant) => {
    if (onParticipantConnected) {
      onParticipantConnected(participant);
    }
  });

  return room;
}
