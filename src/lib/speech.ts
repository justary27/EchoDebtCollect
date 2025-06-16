import { RemoteParticipant } from 'livekit-client';

export async function startSpeechRecognition(
  stream: MediaStream,
  onTranscript: (text: string) => void,
  participant: RemoteParticipant
) {
  const socket = new WebSocket('ws://localhost:3001');
  let audioContext: AudioContext | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let isRecording = false;

  socket.addEventListener('open', async () => {
    console.log('[Cartesia VAD] Connected to WebSocket server');

    try {
      const originalTrack = stream.getAudioTracks()[0];
      audioContext = new AudioContext({ sampleRate: 16000 });

      // Load and register the audio worklet
      await audioContext.audioWorklet.addModule('/vad-processor.js');

      sourceNode = audioContext.createMediaStreamSource(new MediaStream([originalTrack]));
      workletNode = new AudioWorkletNode(audioContext, 'vad-processor');

      // Connect the nodes
      sourceNode.connect(workletNode);
      workletNode.connect(audioContext.destination); // Optional: can be replaced with dummy destination

      // Handle data from the processor
      workletNode.port.onmessage = (event) => {
        if (isRecording && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      participant.on('isSpeakingChanged', (speaking: boolean) => {
        console.log('[Cartesia VAD] Speaking state changed:', speaking);

        if (speaking && !isRecording) {
          console.log('[Cartesia VAD] 🟢 Start streaming');
          isRecording = true;
        } else if (!speaking && isRecording) {
          console.log('[Cartesia VAD] 🔴 Stop streaming');
          isRecording = false;
        }
      });

      socket.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          const { transcript, isFinal } = data;

          if (transcript && isFinal) {
            onTranscript(transcript);
          }
        } catch (error) {
          console.error('[Cartesia VAD] Failed to parse:', error);
        }
      };

      socket.onclose = () => {
        console.log('[Cartesia VAD] WebSocket closed');
        isRecording = false;
        workletNode?.disconnect();
        sourceNode?.disconnect();
        audioContext?.close();
      };
    } catch (err) {
      console.error('[Cartesia VAD] Initialization failed:', err);
    }
  });

  return {
    stop: () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      isRecording = false;
      workletNode?.disconnect();
      sourceNode?.disconnect();
      audioContext?.close();
    },
  };
}
