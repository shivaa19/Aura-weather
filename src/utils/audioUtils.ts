/**
 * Audio processing utilities for Gemini Live API (16kHz PCM input, 24kHz PCM output)
 */

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToFloat32Array(base64: string): Float32Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

let outputAudioCtx: AudioContext | null = null;
let nextStartTime = 0;

export function playPcmChunk(base64Pcm: string) {
  try {
    if (!outputAudioCtx || outputAudioCtx.state === 'closed') {
      outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      nextStartTime = outputAudioCtx.currentTime;
    }

    if (outputAudioCtx.state === 'suspended') {
      outputAudioCtx.resume();
    }

    const float32Data = base64ToFloat32Array(base64Pcm);
    const audioBuffer = outputAudioCtx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = outputAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioCtx.destination);

    const currentTime = outputAudioCtx.currentTime;
    if (nextStartTime < currentTime) {
      nextStartTime = currentTime;
    }

    source.start(nextStartTime);
    nextStartTime += audioBuffer.duration;
  } catch (e) {
    console.error('Error playing PCM chunk:', e);
  }
}

export function resetAudioOutput() {
  if (outputAudioCtx) {
    try {
      outputAudioCtx.close();
    } catch (e) {}
    outputAudioCtx = null;
    nextStartTime = 0;
  }
}
