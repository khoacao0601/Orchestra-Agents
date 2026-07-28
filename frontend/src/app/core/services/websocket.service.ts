import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Article, Topology, LogEntry } from '../models/news.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket!: WebSocket;

  public articles$ = new BehaviorSubject<Article[]>([]);
  public topology$ = new BehaviorSubject<Topology | null>(null);
  public logs$ = new BehaviorSubject<LogEntry[]>([]);
  public agentStates$ = new BehaviorSubject<{ [key: string]: string }>({});
  public pipelineStatus$ = new BehaviorSubject<string>('idle');
  public isConnected$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host.includes(':4200') ? 'localhost:3006' : window.location.host;
    const wsUrl = `${protocol}//${host}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('[Angular WebSocket] Connected to backend server.');
      this.isConnected$.next(true);
      this.addLog('system-log', 'Connected to LangGraph Orchestra Server.');
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (err) {
        console.error('[Angular WebSocket] Error parsing message:', err);
      }
    };

    this.socket.onclose = () => {
      this.isConnected$.next(false);
      this.addLog('error', 'Disconnected from server. Reconnecting in 3s...');
      setTimeout(() => this.initWebSocket(), 3000);
    };
  }

  private handleMessage(data: any): void {
    if (data.type === 'system_status') {
      if (data.payload?.latestArticles) {
        this.articles$.next(data.payload.latestArticles);
      }
      if (data.payload?.topology) {
        this.topology$.next(data.payload.topology);
      }
    }

    if (data.type === 'agent_log') {
      const log = data.payload;
      this.addLog(log.status || 'info', `[${log.agentName || 'AGENT'}] ${log.message}`);
    }

    if (data.type === 'agent_state_update') {
      const { agentId, status } = data.payload;
      const currentStates = this.agentStates$.getValue();
      this.agentStates$.next({ ...currentStates, [agentId]: status });
    }

    if (data.type === 'news_pipeline_started') {
      this.pipelineStatus$.next('running');
      this.addLog('thinking', `🚀 DISPATCHING PIPELINE: "${data.payload.topic}" [Category: ${data.payload.category}]`);
    }

    if (data.type === 'news_published') {
      if (data.payload?.articles) {
        this.articles$.next(data.payload.articles);
      }
    }

    if (data.type === 'news_pipeline_completed') {
      this.pipelineStatus$.next('completed');
      this.addLog('completed', `🎉 PIPELINE COMPLETED! ${data.payload.totalArticles} verified stories published.`);
    }

    if (data.type === 'news_pipeline_error') {
      this.pipelineStatus$.next('error');
      this.addLog('error', `❌ PIPELINE ERROR: ${data.payload}`);
    }

    if (data.type === 'topology_updated') {
      this.topology$.next(data.payload);
    }
  }

  public dispatchNewsPipeline(topic: string, category: string, region: string, language: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'start_news_pipeline',
        payload: { topic, category, region, language }
      }));
    }
  }

  public updateTopology(topology: Topology): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'update_topology',
        payload: topology
      }));
    }
  }

  private addLog(type: string, message: string): void {
    const time = new Date().toLocaleTimeString();
    const currentLogs = this.logs$.getValue();
    const newEntry: LogEntry = { type, message, timestamp: time };
    this.logs$.next([...currentLogs, newEntry]);
  }
}
