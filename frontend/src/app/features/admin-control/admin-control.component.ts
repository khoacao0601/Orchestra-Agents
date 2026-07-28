import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WebSocketService } from '../../core/services/websocket.service';
import { AgentNode, LogEntry, SvgPathInfo } from '../../core/models/news.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-control',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-control.component.html',
  styleUrls: ['./admin-control.component.css']
})
export class AdminControlComponent implements OnInit, OnDestroy {
  public topicInput = 'Global Economy, International Relations & Climate Trends';
  public categorySelect = 'all';
  public regionSelect = 'Global';
  public langSelect = 'en';
  public activeTab: 'logs' | 'agents' = 'logs';

  public isConnected = signal<boolean>(false);
  public nodes = signal<AgentNode[]>([]);
  public connections: { from: string; to: string }[] = [];
  public agentStates = signal<{ [key: string]: string }>({});
  public logs = signal<LogEntry[]>([]);
  public svgPaths = signal<SvgPathInfo[]>([]);

  private draggedNode: AgentNode | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private subs: Subscription[] = [];

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    this.subs.push(
      this.wsService.isConnected$.subscribe(c => this.isConnected.set(c)),

      this.wsService.topology$.subscribe(top => {
        if (top) {
          this.nodes.set(top.nodes);
          this.connections = top.connections;
          this.computeSvgPaths();
        } else {
          this.initDefaultTopology();
        }
      }),

      this.wsService.agentStates$.subscribe(states => {
        this.agentStates.set(states);
        this.computeSvgPaths();
      }),

      this.wsService.logs$.subscribe(l => this.logs.set(l))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private initDefaultTopology(): void {
    const defaultNodes: AgentNode[] = [
      { id: 'web_scout', name: 'Web Scout Agent', type: 'Scout', avatar: '🌐', x: 50, y: 180, active: true, status: 'idle', color: '#3b82f6' },
      { id: 'region_filter', name: 'Region Filter Agent', type: 'Filter', avatar: '📍', x: 260, y: 180, active: true, status: 'idle', color: '#10b981' },
      { id: 'topic_economy', name: 'Economy Specialist', type: 'Domain', avatar: '📊', x: 480, y: 60, active: true, status: 'idle', color: '#f59e0b' },
      { id: 'topic_politics', name: 'Politics Specialist', type: 'Domain', avatar: '🏛️', x: 480, y: 180, active: true, status: 'idle', color: '#8b5cf6' },
      { id: 'topic_weather', name: 'Weather Specialist', type: 'Domain', avatar: '🌤️', x: 480, y: 300, active: true, status: 'idle', color: '#06b6d4' },
      { id: 'translator', name: 'Translator Agent', type: 'Localization', avatar: '🔤', x: 700, y: 180, active: true, status: 'idle', color: '#ec4899' },
      { id: 'journalist_publisher', name: 'Journalist & Publisher', type: 'Publisher', avatar: '📰', x: 920, y: 180, active: true, status: 'idle', color: '#f43f5e' }
    ];

    this.connections = [
      { from: 'web_scout', to: 'region_filter' },
      { from: 'region_filter', to: 'topic_economy' },
      { from: 'region_filter', to: 'topic_politics' },
      { from: 'region_filter', to: 'topic_weather' },
      { from: 'topic_economy', to: 'translator' },
      { from: 'topic_politics', to: 'translator' },
      { from: 'topic_weather', to: 'translator' },
      { from: 'translator', to: 'journalist_publisher' }
    ];

    this.nodes.set(defaultNodes);
    this.computeSvgPaths();
  }

  public runPipeline(): void {
    if (!this.topicInput.trim()) return;
    this.wsService.dispatchNewsPipeline(this.topicInput, this.categorySelect, this.regionSelect, this.langSelect);
  }

  public resetPositions(): void {
    this.initDefaultTopology();
    this.saveTopology();
  }

  public addAgent(): void {
    const name = prompt('Enter new Agent name to add to Orchestra:', 'Custom Analyst Agent');
    if (name) {
      const id = `agent_${Date.now()}`;
      const newAgent: AgentNode = {
        id,
        name,
        type: 'Custom',
        avatar: '🤖',
        x: 480,
        y: 420,
        active: true,
        status: 'idle',
        color: '#a855f7'
      };

      const updatedNodes = [...this.nodes(), newAgent];
      this.connections.push({ from: 'region_filter', to: id });
      this.connections.push({ from: id, to: 'translator' });
      this.nodes.set(updatedNodes);
      this.computeSvgPaths();
      this.saveTopology();
    }
  }

  public onMouseDown(event: MouseEvent, node: AgentNode): void {
    this.draggedNode = node;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.draggedNode) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    let x = event.clientX - rect.left - this.dragOffsetX;
    let y = event.clientY - rect.top - this.dragOffsetY;

    x = Math.max(10, Math.min(x, target.clientWidth - 200));
    y = Math.max(10, Math.min(y, target.clientHeight - 90));

    this.draggedNode.x = x;
    this.draggedNode.y = y;
    this.nodes.set([...this.nodes()]);
    this.computeSvgPaths();
  }

  public onMouseUp(): void {
    if (this.draggedNode) {
      this.draggedNode = null;
      this.saveTopology();
    }
  }

  private saveTopology(): void {
    this.wsService.updateTopology({
      nodes: this.nodes(),
      connections: this.connections
    });
  }

  public getNodeStatus(agentId: string): string {
    return this.agentStates()[agentId] || 'idle';
  }

  public getStatusText(status: string): string {
    switch (status) {
      case 'thinking': return 'Thinking / Processing...';
      case 'completed': return 'Ready / Active';
      case 'error': return 'Error';
      default: return 'Idle';
    }
  }

  public getStatusColor(status: string): string {
    switch (status) {
      case 'thinking': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#94a3b8';
    }
  }

  private computeSvgPaths(): void {
    const nodeList = this.nodes();
    const states = this.agentStates();
    const paths: SvgPathInfo[] = [];

    const nodeWidth = 190;
    const nodeHeight = 80;

    this.connections.forEach(conn => {
      const fromNode = nodeList.find(n => n.id === conn.from);
      const toNode = nodeList.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        const x1 = fromNode.x + nodeWidth;
        const y1 = fromNode.y + nodeHeight / 2;
        const x2 = toNode.x;
        const y2 = toNode.y + nodeHeight / 2;

        const dx = Math.abs(x2 - x1) * 0.5;
        const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        const status = states[fromNode.id] || 'idle';
        const isActive = status === 'thinking' || status === 'completed';
        const strokeColor = isActive ? '#10b981' : (fromNode.color || '#6366f1');

        paths.push({
          pathD,
          strokeColor,
          strokeWidth: isActive ? 4 : 2.5,
          opacity: isActive ? 1 : 0.6
        });
      }
    });

    this.svgPaths.set(paths);
  }
}
