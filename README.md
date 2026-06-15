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

> 本地默认仍然是 `FEISHU_ENABLED=false`，所以本地执行不会自动发消息；GitHub Actions 可以单独开启真实推送。

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

当前采用“本地保守、云端启用”的策略：

```env
FEISHU_ENABLED=false
```

这表示：
- 本地默认不会真的发飞书消息
- `preview`、内容生成、选择逻辑仍然可以正常使用
- GitHub Actions 工作流里会单独设置 `FEISHU_ENABLED=true`，用于每天自动推送

如果你希望本地也默认发消息，再把 `.env` 里的 `FEISHU_ENABLED` 改回 `true` 即可。

## 当前选择逻辑

当前不是“从本地手工维护的 skill 列表里挑”，而是：
1. 先从 Claude Code 官方文档来源发现可用 skills
2. 再叠加本地补充信息
3. 最后按推荐规则做精选

## 当前推荐策略

当前推荐不是只按一个总分硬排，而是综合使用：

- 官方 / bundled skill 优先级
- 高频提效 / 配置工作流 / 官方高价值 / 学习路径 等主题
- 最近推送历史与主题轮换
- related skills 跟进推荐
- 难度平滑（更偏向 easy / medium）
- 重复窗口与分类避让

## GitHub Actions 每天自动推送

项目仍保留工作流文件：

- `.github/workflows/daily-push.yml`

GitHub Actions 工作流现在会单独设置 `FEISHU_ENABLED=true`，因此会按计划进行真实机器人推送；本地仍然保持默认关闭。

你需要在 GitHub 仓库里正确配置这些 Secrets / Variables：
- `FEISHU_WEBHOOK_URL`
- `FEISHU_BOT_SECRET`（如果启用了签名校验）
- `FEISHU_REQUIRED_KEYWORD`（如果启用了关键词校验）
- `APP_TIMEZONE`（建议填 `Asia/Shanghai`）

## 注意

- 如果官方来源页面结构未来发生变化，解析逻辑也需要一起更新。
- GitHub Actions 的 cron 使用 UTC，当前 `5 1 * * *` 对应北京时间 09:05。

## 后续扩展

- 更多推送渠道
- SQLite 持久化
- 个性化推荐
