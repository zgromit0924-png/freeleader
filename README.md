# FreeLeader

FreeLeader 是一个面向课程小组作业的响应式 Web 产品：先生成完整交付大纲，再按成员人数拆成可认领、可验收的工作包；成员提交后，系统按大纲保留全文整合，并记录来源、版本和待确认事项。

## 已实现流程

- 负责人创建项目并填写老师要求、成员和截止时间
- 生成 8 章级完整大纲与详细任务卡
- 自动分配、手动指定或成员自主认领
- 成员通过公开私密链接查看任务、粘贴正文或上传 Word/PDF/Markdown/文本
- 按验收标准预审并保留提交版本
- 负责人通过私密链接生成、保存并导出全文整合稿
- Cloudflare D1 保存项目、成员、任务、提交、反馈、整合稿和审计记录

## 本地运行

需要 Node.js 22.13+ 与 pnpm。

```bash
pnpm install
pnpm dev
```

## 构建与部署

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm exec wrangler deploy --config wrangler.jsonc
```

部署前需要在 Cloudflare 创建 D1 数据库并更新 `wrangler.jsonc`。若绑定 R2 为 `FILES`，上传的原始附件也会被长期保存；没有 R2 时仍会即时解析文件并把正文、文件指纹和元数据写入 D1。

## AI 配置

不提供模型密钥时，产品使用内置的确定性生成和检查规则，方便零配置验证完整流程。配置 Worker secret `OPENAI_API_KEY` 后，任务规划和预审会调用模型，并在失败时自动回退到确定性规则。

## 线上演示

[https://freeleader.freeleader-team.workers.dev](https://freeleader.freeleader-team.workers.dev)

