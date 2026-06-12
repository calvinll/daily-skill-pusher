export function isFeishuPlaceholderWebhook(webhookUrl: string): boolean {
  return webhookUrl.includes('/hook/replace-me');
}

export function ensureKeyword(content: string, requiredKeyword?: string): string {
  if (!requiredKeyword) {
    return content;
  }

  if (content.includes(requiredKeyword)) {
    return content;
  }

  return `[${requiredKeyword}]\n${content}`;
}
