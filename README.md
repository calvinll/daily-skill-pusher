# daily-skill-pusher

一个用于每天精选并推送 skill 的 TypeScript CLI 工具。

## 功能

- 从 Claude Code 官方文档来源发现技能/命令
- 按规则选择今日精选 skill
- 生成统一格式的推荐文案
- 推送到飞书机器人 webhook
- 支持更好看的飞书卡片消息
- 支持预览、手动推送、定时调度、配置校验
- 支持 GitHub Actions 每天自动推送

## 环境要求

- Node.js 20+
- pnpm（推荐）或 npm

## 安装

```bash
pnpm install
```

## 配置

```bash
cp .env.example .env
```

配置项说明：

- `APP_TIMEZONE`：本地时区，默认 `Asia/Shanghai`
- `CRON_EXPRESSION`：本地 `npm run schedule` 使用的 cron 表达式，默认 `5 9 * * *`
- `SCHEDULER_ENABLED`：是否启用本地常驻调度，默认 `true`
- `FEISHU_ENABLED`：是否允许机器人真实推送，默认 `false`
- `FEISHU_WEBHOOK_URL`：飞书机器人 webhook 地址
- `FEISHU_BOT_SECRET`：可选；如果机器人开启了“签名校验”，这里填写 secret
- `FEISHU_REQUIRED_KEYWORD`：可选；如果机器人开启了“关键词校验”，程序会自动把关键词补到卡片标题
- `DATA_DIR`：数据目录，默认 `./data`
- `DAYS_TO_AVOID_REPEAT`：避免重复推送天数
- `AVOID_SAME_CATEGORY_DAYS`：避免相同分类重复天数
- `DAILY_COUNT`：每天推送数量，MVP 固定为 1

## 数据文件

- `data/skills.json`：本地补充信息/推荐权重，不是官方 source of truth
- `data/push-history.json`：推送历史

## 官方来源

当前实现优先从这些官方来源发现 skills：

- `https://code.claude.com/docs/en/commands.md`
- `https://code.claude.com/docs/en/skills.md`

项目会把官方来源解析成内部 skill 数据，再叠加本地的补充字段（例如推荐理由、示例、场景）。

## 命令

```bash
pnpm preview
pnpm push
pnpm push -- --dry-run
pnpm schedule
pnpm validate
pnpm build
pnpm test
```

### 预览今日推荐

```bash
pnpm preview
```

### 手动推送一次

```bash
pnpm push
```

如果你使用的是 npm：

```bash
npm run push
```

> 当前默认 `FEISHU_ENABLED=false`，所以真实机器人推送已暂停；执行时会直接提示已禁用，不会发消息。

### 干跑，不实际发送

```bash
pnpm push -- --dry-run
```

### 启动本地定时调度

```bash
pnpm schedule
```

> 说明：这个命令需要你的本地进程持续运行，更适合开发调试。真正的每日自动推送建议使用 GitHub Actions。

### 校验配置与数据

```bash
pnpm validate
```

`validate` 会检查本地配置，并尝试从 Claude Code 官方来源拉取技能列表。

## 机器人推送状态

目前机器人推送已暂停，默认通过：

```env
FEISHU_ENABLED=false
```

这意味着：
- `npm run push` 不会真的发飞书消息
- GitHub Actions 也不会进行真实机器人推送
- `preview`、内容生成、选择逻辑仍然可以正常使用

如果以后要恢复，只需要把 `FEISHU_ENABLED` 改回 `true`。

## 当前选择逻辑

当前不是“从本地手工维护的 skill 列表里挑”，而是：
1. 先从 Claude Code 官方文档来源发现可用 skills
2. 再叠加本地补充信息
3. 最后按推荐规则做精选

## GitHub Actions 每天自动推送

项目仍保留工作流文件：

- `.github/workflows/daily-push.yml`

但当前已通过 `FEISHU_ENABLED=false` 暂停真实机器人推送，所以 workflow 暂时不会再对飞书发消息。

如果以后要恢复自动推送，再把该变量改回 `true` 即可。

## 注意

如果官方来源页面结构未来发生变化，解析逻辑也需要一起更新。

## 后续扩展

- 更多推送渠道
- SQLite 持久化
- 个性化推荐
