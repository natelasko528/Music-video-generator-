import { expect, test } from '@playwright/test';
import type { ProjectState } from '../../src/types';
import {
    detectSafetyCategory,
    generateSafeReferenceImage,
    generateStoryboard,
    sanitizePrompt,
    setApiKey,
    setClientFactory,
} from '../../src/api/client';

test.describe('api/client safety + planner utilities', () => {
    test.afterEach(() => {
        setClientFactory(null);
        setApiKey(null);
    });

    test('detectSafetyCategory maps error strings to categories', () => {
        expect(detectSafetyCategory('violence block')).toBe('violence');
        expect(detectSafetyCategory('weapon detected')).toBe('violence');
        expect(detectSafetyCategory('drug related content')).toBe('substance');
        expect(detectSafetyCategory('explicit nudity')).toBe('explicit');
        expect(detectSafetyCategory('money laundering')).toBe('money');
        expect(detectSafetyCategory('random failure')).toBe('general');
    });

    test('generateStoryboard uses audio length to size scenes and includes safety guardrails', async () => {
        const calls: any[] = [];
        const state: ProjectState = {
            audioDuration: 12.4,
            clipLength: 5,
            aspectRatio: '16:9',
            lyrics: 'sample lyrics',
            scenes: [],
            styleImageBase64: '',
            styleImageMime: '',
            transitionType: 'cut',
        };

        setApiKey('test-key');
        setClientFactory(() => ({
            models: {
                generateContent: async (payload: any) => {
                    calls.push(payload);
                    return {
                        text: JSON.stringify({
                            scenes: [
                                { id: 'scene-0', startTime: 0, endTime: 5, description: 'intro', visualPrompt: 'vp' },
                            ],
                        }),
                    };
                },
                generateImages: async () => {
                    throw new Error('not used');
                },
                generateVideos: async () => {
                    throw new Error('not used');
                },
            },
            operations: {
                getVideosOperation: async (args: any) => args,
            },
        }));

        const result = await generateStoryboard(state);
        expect(result.scenes).toHaveLength(1);
        expect(result.scenes[0].id).toBe('scene-0');

        const systemInstruction: string = calls[0].config?.systemInstruction ?? '';
        expect(systemInstruction).toContain('12 seconds long');
        expect(systemInstruction).toContain('exactly 3 sequential scenes');
        expect(systemInstruction).toContain('NO money');
        expect(systemInstruction).toContain('NO weapons');
    });

    test('sanitizePrompt returns rewritten prompt from mocked client', async () => {
        setApiKey('test-key');
        setClientFactory(() => ({
            models: {
                generateContent: async () => ({ text: 'rewritten safe prompt' }),
                generateImages: async () => {
                    throw new Error('not used');
                },
                generateVideos: async () => {
                    throw new Error('not used');
                },
            },
            operations: {
                getVideosOperation: async (args: any) => args,
            },
        }));

        const sanitized = await sanitizePrompt('original risky prompt');
        expect(sanitized).toBe('rewritten safe prompt');
    });

    test('generateSafeReferenceImage returns null when image is missing', async () => {
        setApiKey('test-key');
        setClientFactory(() => ({
            models: {
                generateContent: async () => ({ text: '' }),
                generateImages: async () => ({}),
                generateVideos: async () => ({}),
            },
            operations: {
                getVideosOperation: async (args: any) => args,
            },
        }));

        const image = await generateSafeReferenceImage('prompt', '16:9');
        expect(image).toBeNull();
    });

    test('generateSafeReferenceImage returns base64 payload when provided', async () => {
        setApiKey('test-key');
        setClientFactory(() => ({
            models: {
                generateContent: async () => ({ text: '' }),
                generateImages: async () => ({
                    generatedImages: [
                        {
                            image: { imageBytes: 'abc123' },
                        },
                    ],
                }),
                generateVideos: async () => ({}),
            },
            operations: {
                getVideosOperation: async (args: any) => args,
            },
        }));

        const image = await generateSafeReferenceImage('prompt', '9:16');
        expect(image).not.toBeNull();
        expect(image?.base64).toBe('abc123');
        expect(image?.mime).toBe('image/png');
    });
});

