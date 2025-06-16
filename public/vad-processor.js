// vad-processor.js
class VADProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleBuffer = [];
    this.targetSamples = 800; // 50ms at 16kHz
  }

  process(inputs) {
    const input = inputs[0][0]; // mono input

    if (!input) return true;

    this.sampleBuffer.push(...input);

    while (this.sampleBuffer.length >= this.targetSamples) {
      const chunk = this.sampleBuffer.splice(0, this.targetSamples);

      // Convert to Int16 PCM
      const buffer = new ArrayBuffer(chunk.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < chunk.length; i++) {
        let sample = chunk[i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      }

      this.port.postMessage(buffer, [buffer]); // Transfer the buffer to main thread
    }

    return true;
  }
}

registerProcessor('vad-processor', VADProcessor);
