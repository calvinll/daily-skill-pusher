export type SelectionConfig = {
  daysToAvoidRepeat: number;
  avoidSameCategoryDays: number;
  dailyCount: number;
};

export type FeishuChannelConfig = {
  enabled: boolean;
  webhookUrl: string;
  botSecret?: string;
  requiredKeyword?: string;
};

export type AppConfig = {
  app: {
    env: 'development' | 'production' | 'test';
    timezone: string;
    dataDir: string;
  };
  scheduler: {
    enabled: boolean;
    cronExpression: string;
  };
  selection: SelectionConfig;
  channels: {
    feishu: FeishuChannelConfig;
  };
};
