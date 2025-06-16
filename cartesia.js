// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WebSocket = require('ws');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CartesiaClient } = require('@cartesia/cartesia-js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

const server = http.createServer();
const wss = new WebSocket.Server({ server });

console.log('🔑 Cartesia API Key:', process.env.CARTESIA_API_KEY ? 'Set' : 'MISSING!');

wss.on('connection', async (ws) => {
  console.log('🔌 Client connected');

  const cartesiaClient = new CartesiaClient({
    apiKey: process.env.CARTESIA_API_KEY,
  });

  const sttWs = cartesiaClient.stt.websocket({
    model: 'ink-whisper',
    language: 'en',
    encoding: 'pcm_s16le',
    sampleRate: 16000,
  });

  let lastAudioTime = Date.now();

  sttWs.onMessage((result) => {
    console.log('📩 Cartesia result:', result);

    if (result.type === 'transcript') {
      const transcript = result.text;
      const isFinal = result.isFinal;

      console.log(`[📝 ${isFinal ? 'FINAL' : 'INTERIM'}] ${transcript}`);
      ws.send(JSON.stringify({ transcript, isFinal }));
    } else if (result.type === 'flush_done') {
      console.log('🧼 Flush completed. Sending done command.');
      sttWs.done().catch(console.error);
    } else if (result.type === 'done') {
      console.log('✅ Transcription session completed.');
    } else if (result.type === 'error') {
      console.error('💥 Cartesia error:', result.message);
      ws.send(JSON.stringify({ error: result.message }));
    }
  });

  ws.on('message', async (message) => {
    lastAudioTime = Date.now();
    console.log('📨 [VAD] Audio chunk received:', message.length, 'bytes');
    try {
      await sttWs.send(message);
      console.log('✅ Sent chunk to Cartesia STT');
    } catch (err) {
      console.error('❌ Error sending chunk to Cartesia:', err);
    }
  });

  // Monitor gaps in audio for VAD
  const gapMonitor = setInterval(() => {
    const timeSinceLastAudio = Date.now() - lastAudioTime;
    if (timeSinceLastAudio > 2000) {
      console.log('🔇 No audio for', timeSinceLastAudio, 'ms');
    }
  }, 1000);

  ws.on('close', async () => {
    console.log('🔌 Client disconnected');
    clearInterval(gapMonitor);
    try {
      await sttWs.finalize();
      await sttWs.disconnect();
    } catch (err) {
      console.error('❌ Error closing Cartesia STT:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err);
    clearInterval(gapMonitor);
  });
});

server.listen(3001, () => {
  console.log('✅ Cartesia STT server running on port 3001');
});
