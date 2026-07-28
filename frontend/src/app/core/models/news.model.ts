export interface Article {
  id: string;
  title: string;
  tldr: string;
  snippet: string;
  category: string;
  categoryLabel: string;
  region: string;
  location: { country: string; city: string; lat: number; lng: number };
  impactLevel: string;
  confidenceScore: number;
  factCheckRating: string;
  source: string;
  publishedAt: string;
  keyTakeaways: string[];
  expertAnalysis: string;
  tags: string[];
  cardColor: string;
  cardIcon: string;
}

export interface AgentNode {
  id: string;
  name: string;
  type: string;
  avatar: string;
  x: number;
  y: number;
  active: boolean;
  status: string;
  color: string;
}

export interface AgentConnection {
  from: string;
  to: string;
}

export interface Topology {
  nodes: AgentNode[];
  connections: AgentConnection[];
}

export interface LogEntry {
  type: string;
  agentId?: string;
  agentName?: string;
  message: string;
  timestamp: string;
}

export interface SvgPathInfo {
  pathD: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}
