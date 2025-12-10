// Generate a minimal valid WAV file for testing
const fs = require('fs');
const path = require('path');

function createWavFile(durationSeconds = 5, sampleRate = 44100, numChannels = 2, bitsPerSample = 16) {
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const numSamples = sampleRate * durationSeconds;
    const dataSize = numSamples * blockAlign;
    const fileSize = 36 + dataSize;

    const buffer = Buffer.alloc(44 + dataSize);
    let offset = 0;

    // RIFF header
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;

    // fmt sub-chunk
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size for PCM
    buffer.writeUInt16LE(1, offset); offset += 2;  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(byteRate, offset); offset += 4;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

    // data sub-chunk
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;

    // Generate a simple sine wave for audio data
    const frequency = 440; // A4 note
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Create a gentle fade-in and fade-out
        const fadeLen = sampleRate * 0.1; // 0.1 second fade
        let amplitude = 0.3;
        if (i < fadeLen) {
            amplitude *= i / fadeLen;
        } else if (i > numSamples - fadeLen) {
            amplitude *= (numSamples - i) / fadeLen;
        }
        
        const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude * 32767;
        const intSample = Math.max(-32768, Math.min(32767, Math.round(sample)));
        
        // Write to both channels
        for (let ch = 0; ch < numChannels; ch++) {
            buffer.writeInt16LE(intSample, offset);
            offset += 2;
        }
    }

    return buffer;
}

// Create a 5-second test audio file
const wavBuffer = createWavFile(5);
const outputPath = path.join(__dirname, 'sample-audio.wav');
fs.writeFileSync(outputPath, wavBuffer);

console.log(`Created test audio file: ${outputPath}`);
console.log(`File size: ${wavBuffer.length} bytes`);
