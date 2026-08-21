import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from './websocket.service';
import { Article, Topology } from '../models/news.model';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockWebSocketInstance: any;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; }
    };
    vi.stubGlobal('localStorage', mockLocalStorage);

    vi.stubGlobal('window', {
      location: {
        protocol: 'http:',
        host: 'localhost:3006'
      }
    });

    class MockWebSocket {
      static OPEN = 1;
      static CLOSED = 3;
      send = vi.fn();
      close = vi.fn();
      readyState = 1; // WebSocket.OPEN
      onopen: any = null;
      onmessage: any = null;
      onclose: any = null;
      onerror: any = null;

      constructor() {
        mockWebSocketInstance = this;
      }
    }

    vi.stubGlobal('WebSocket', MockWebSocket);

    service = new WebSocketService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should be created and initialize default RxJS streams', () => {
    expect(service).toBeTruthy();
    expect(service.articles$.getValue()).toEqual([]);
    expect(service.topology$.getValue()).toBeNull();
    expect(service.pipelineStatus$.getValue()).toBe('idle');
  });

  it('should handle onopen event and set isConnected$ to true', () => {
    mockWebSocketInstance.onopen();
    expect(service.isConnected$.getValue()).toBe(true);
    expect(service.logs$.getValue().some(l => l.message.includes('Connected'))).toBe(true);
  });

  it('should handle system_status WebSocket message and update articles$ and topology$', () => {
    const mockArticles: Article[] = [
      {
        id: 'art-1',
        title: 'Global Chip Pact',
        tldr: 'Summary',
        snippet: 'Snippet',
        category: 'economy',
        categoryLabel: 'Economy',
        region: 'Asia-Pacific',
        location: { country: 'Japan', city: 'Tokyo', lat: 35.67, lng: 139.65 },
        impactLevel: 'Critical',
        confidenceScore: 95,
        factCheckRating: 'Verified',
        source: 'Reuters',
        publishedAt: '2026-08-10T12:00:00Z',
        keyTakeaways: ['Pact signed'],
        expertAnalysis: 'Strong signals',
        tags: ['Tech'],
        cardColor: '#f59e0b',
        cardIcon: '📊'
      }
    ];

    const mockTopology: Topology = {
      nodes: [{ id: 'web_scout', label: 'Web Scout', status: 'idle' }],
      edges: []
    };

    mockWebSocketInstance.onmessage({
      data: JSON.stringify({
        type: 'system_status',
        payload: { latestArticles: mockArticles, topology: mockTopology }
      })
    });

    expect(service.articles$.getValue()).toHaveLength(1);
    expect(service.articles$.getValue()[0].title).toBe('Global Chip Pact');
    expect(service.topology$.getValue()).toEqual(mockTopology);
  });

  it('should handle agent_state_update message and update agentStates$', () => {
    mockWebSocketInstance.onmessage({
      data: JSON.stringify({
        type: 'agent_state_update',
        payload: { agentId: 'web_scout', status: 'thinking' }
      })
    });

    expect(service.agentStates$.getValue()).toEqual({ web_scout: 'thinking' });
  });

  it('should update pipelineStatus$ on news_pipeline_started, completed, and error messages', () => {
    mockWebSocketInstance.onmessage({
      data: JSON.stringify({
        type: 'news_pipeline_started',
        payload: { topic: 'Global Energy', category: 'all' }
      })
    });
    expect(service.pipelineStatus$.getValue()).toBe('running');

    mockWebSocketInstance.onmessage({
      data: JSON.stringify({
        type: 'news_pipeline_completed',
        payload: { totalArticles: 5 }
      })
    });
    expect(service.pipelineStatus$.getValue()).toBe('completed');

    mockWebSocketInstance.onmessage({
      data: JSON.stringify({
        type: 'news_pipeline_error',
        payload: 'Timeout error'
      })
    });
    expect(service.pipelineStatus$.getValue()).toBe('error');
  });

  it('should add a comment to an article and persist to localStorage', () => {
    const articleId = 'art-100';
    const comment = service.addComment(articleId, 'Alice', 'Great coverage!');

    expect(comment.articleId).toBe(articleId);
    expect(comment.userName).toBe('Alice');
    expect(comment.commentText).toBe('Great coverage!');

    const stored = store['worldpulse_comments'];
    expect(stored).toContain('Great coverage!');
  });

  it('should like a comment and increment likesCount', () => {
    const articleId = 'art-100';
    const comment = service.addComment(articleId, 'Bob', 'Fascinating insight.');

    service.likeComment(articleId, comment.id);

    const stored = JSON.parse(store['worldpulse_comments'] || '{}');
    const updatedCmt = stored[articleId].find((c: any) => c.id === comment.id);
    expect(updatedCmt.likesCount).toBe(1);
  });

  it('should send start_news_pipeline payload via WebSocket when dispatchNewsPipeline is called', () => {
    service.dispatchNewsPipeline('Semiconductors', 'economy', 'Asia-Pacific', 'en');

    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'start_news_pipeline',
      payload: {
        topic: 'Semiconductors',
        category: 'economy',
        region: 'Asia-Pacific',
        language: 'en'
      }
    }));
  });
});
