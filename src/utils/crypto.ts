import { createHmac } from 'node:crypto';

export function createFeishuSignature(timestamp: string, secret: string): string {
  const stringToSign = `${timestamp}\n${secret}`;
  return createHmac('sha256', stringToSign).update('').digest('base64');
}
