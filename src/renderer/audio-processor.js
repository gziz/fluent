/**
 * AudioWorklet processor for low-latency audio capture
 * Buffers audio samples and sends them to the main thread for processing
 */
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Buffer 100ms of audio at 48kHz (will be resampled to 24kHz)
    this.bufferSize = 4800;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    // Take first channel (mono)
    const channelData = input[0];

    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];

      if (this.bufferIndex >= this.bufferSize) {
        // Send buffer to main thread
        this.port.postMessage({
          type: "audio",
          samples: this.buffer.slice(0),
        });
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
