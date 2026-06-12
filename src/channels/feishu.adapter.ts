import type { FeishuChannelConfig } from '../types/app-config.js';
import type { FeishuCard, FeishuWebhookBody, FeishuWebhookSuccessResponse } from '../types/feishu.js';
import { createFeishuSignature } from '../utils/crypto.js';
import { ensureKeyword } from '../utils/feishu.js';
import type { PushAdapter, PushPayload, PushResult } from './base.adapter.js';

function getFeishuBusinessError(responseBody: unknown): string | undefined {
  if (!responseBody || typeof responseBody !== 'object') {
    return undefined;
  }

  const body = responseBody as FeishuWebhookSuccessResponse;
  const code = body.code ?? body.StatusCode;
  if (code === 0 || code === undefined) {
    return undefined;
  }

  return body.msg ?? body.StatusMessage ?? `Feishu webhook business code: ${String(code)}`;
}

function withRequiredKeyword(card: FeishuCard, requiredKeyword?: string): FeishuCard {
  if (!requiredKeyword) {
    return card;
  }

  return {
    ...card,
    header: {
      ...card.header,
      title: {
        ...card.header.title,
        content: ensureKeyword(card.header.title.content, requiredKeyword),
      },
    },
  };
}

export class FeishuAdapter implements PushAdapter {
  readonly channelName = 'feishu';

  constructor(private readonly config: FeishuChannelConfig) {}

  async send(payload: PushPayload): Promise<PushResult> {
    const body: FeishuWebhookBody = {
      msg_type: 'interactive',
      card: withRequiredKeyword(payload.feishuCard, this.config.requiredKeyword),
    };

    if (this.config.botSecret) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      body.timestamp = timestamp;
      body.sign = createFeishuSignature(timestamp, this.config.botSecret);
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });

      const responseBody = await response.json().catch(() => null);
      const businessError = getFeishuBusinessError(responseBody);

      if (!response.ok || businessError) {
        return {
          success: false,
          channel: this.channelName,
          statusCode: response.status,
          responseBody,
          errorMessage:
            businessError ?? `Feishu webhook request failed with status ${response.status}.`,
        };
      }

      return {
        success: true,
        channel: this.channelName,
        statusCode: response.status,
        responseBody,
      };
    } catch (error) {
      return {
        success: false,
        channel: this.channelName,
        errorMessage: error instanceof Error ? error.message : 'Unknown Feishu webhook error.',
      };
    }
  }
}
