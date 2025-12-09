// API Mocks for testing

export const mockStoryboardResponse = {
    scenes: [
        {
            id: "scene-0",
            startTime: 0,
            endTime: 5,
            description: "Opening scene with urban backdrop",
            visualPrompt: "Cinematic opening shot of urban cityscape at golden hour, shot on 35mm, anamorphic lens, dramatic lighting"
        },
        {
            id: "scene-1",
            startTime: 5,
            endTime: 10,
            description: "Artist performance scene",
            visualPrompt: "Hip-hop artist performing on stage, dynamic camera movement, stage lighting, crowd in background"
        }
    ]
};

export const mockVideoOperation = {
    name: "operations/test-operation-123",
    done: true,
    response: {
        generatedVideos: [
            {
                video: {
                    uri: "https://storage.googleapis.com/test-video.mp4"
                }
            }
        ]
    }
};

export function createMockAudioFile(): File {
    // Create a minimal mock audio file for testing
    const blob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
    return new File([blob], 'test-audio.mp3', { type: 'audio/mpeg' });
}

