import type { FeishuCard } from '../types/feishu.js';
import type { Skill } from '../types/skill.js';

function renderSceneList(skill: Skill): string {
  return skill.scenes.map((scene) => `- ${scene}`).join('\n');
}

function renderRelatedSkills(skill: Skill): string {
  return skill.relatedSkills.length > 0 ? skill.relatedSkills.join(' / ') : '暂无';
}

function renderLinkList(skill: Skill): string {
  return skill.links.map((link) => `- ${link.label}: ${link.url}`).join('\n');
}

function renderCardLinks(skill: Skill): string {
  return skill.links.map((link) => `- [${link.label}](${link.url})`).join('\n');
}

export function renderDailySkillPreview(skill: Skill): string {
  return [
    `🧠 今日精选 Skill：${skill.title}`,
    '',
    '适合场景：',
    renderSceneList(skill),
    '',
    '推荐用法：',
    skill.example,
    '',
    '为什么推荐：',
    skill.whyRecommended,
    '',
    '使用入口：',
    renderLinkList(skill),
    '',
    '关联技能：',
    renderRelatedSkills(skill),
  ].join('\n');
}

export function renderDailySkillCard(skill: Skill, title: string): FeishuCard {
  return {
    config: {
      wide_screen_mode: true,
      enable_forward: true,
    },
    header: {
      template: 'indigo',
      title: {
        tag: 'plain_text',
        content: title,
      },
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${skill.title}**\n${skill.description}`,
        },
      },
      {
        tag: 'div',
        fields: [
          {
            is_short: false,
            text: {
              tag: 'lark_md',
              content: `**适合场景**\n${skill.scenes.map((scene) => `• ${scene}`).join('\n')}`,
            },
          },
        ],
      },
      {
        tag: 'hr',
      },
      {
        tag: 'div',
        fields: [
          {
            is_short: false,
            text: {
              tag: 'lark_md',
              content: `**推荐用法**\n\`${skill.example}\``,
            },
          },
          {
            is_short: false,
            text: {
              tag: 'lark_md',
              content: `**为什么推荐**\n${skill.whyRecommended}`,
            },
          },
        ],
      },
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: {
              tag: 'lark_md',
              content: `**难度**\n${skill.difficulty}`,
            },
          },
          {
            is_short: true,
            text: {
              tag: 'lark_md',
              content: `**关联技能**\n${renderRelatedSkills(skill)}`,
            },
          },
        ],
      },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**使用入口**\n${renderCardLinks(skill)}`,
        },
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: 'daily-skill-pusher · 每天一个值得学的 skill',
          },
        ],
      },
    ],
  };
}
