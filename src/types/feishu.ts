export type FeishuTextTag = 'plain_text' | 'lark_md';

export type FeishuCardText = {
  tag: FeishuTextTag;
  content: string;
};

export type FeishuCardElement =
  | {
      tag: 'div';
      text?: FeishuCardText;
      fields?: Array<{
        is_short: boolean;
        text: FeishuCardText;
      }>;
    }
  | {
      tag: 'hr';
    }
  | {
      tag: 'note';
      elements: Array<{
        tag: 'plain_text';
        content: string;
      }>;
    };

export type FeishuCard = {
  config?: {
    wide_screen_mode?: boolean;
    enable_forward?: boolean;
  };
  header: {
    template?: 'blue' | 'cyan' | 'green' | 'grey' | 'indigo' | 'orange' | 'purple' | 'red' | 'violet' | 'wathet' | 'yellow';
    title: {
      tag: 'plain_text';
      content: string;
    };
  };
  elements: FeishuCardElement[];
};

export type FeishuWebhookBody =
  | {
      msg_type: 'text';
      content: {
        text: string;
      };
      timestamp?: string;
      sign?: string;
    }
  | {
      msg_type: 'interactive';
      card: FeishuCard;
      timestamp?: string;
      sign?: string;
    };

export type FeishuWebhookSuccessResponse = {
  code?: number;
  msg?: string;
  StatusCode?: number;
  StatusMessage?: string;
  data?: unknown;
};
