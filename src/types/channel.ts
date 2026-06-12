import type { FeishuCard } from './feishu.js';

export type PushPayload = {
  title: string;
  previewText: string;
  feishuCard: FeishuCard;
};

export type PushResult = {
  success: boolean;
  channel: string;
  statusCode?: number;
  responseBody?: unknown;
  errorMessage?: string;
};

export interface PushAdapter {
  readonly channelName: string;
  send(payload: PushPayload): Promise<PushResult>;
}
