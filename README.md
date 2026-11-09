# 视频剪辑师

![视频剪辑师头像](assets/avatar.png)

DesireCore 的独立 Agent 内容源。配合 [视频剪辑](https://github.com/desirecore-agent/video-editing)，处理剪辑、节奏、声音、调色、参考重剪、原创动效和成片检查；保留可编辑时间线与合成。现有“视频创作 / 视频导演”继续独立使用。

[English](README.en-US.md) · [使用方法](USAGE.md) · [来源与许可](NOTICE)

本仓库包含纯 seed 配置、L0/L1/L2 人设与原则、Markdown 常驻约定、4 项技能和已安装应用的薄 CLI 包装器。它不带聊天运行时、模型调用内核、影片素材或用户配置；头像图片自包含。

## 基础资料

- **角色**：视频后期剪辑师，将已有素材组织成节奏清晰、声画协调的影片。
- **擅长**：素材整理、时间线精剪、参考重剪、调色、音频混音、字幕和原创动效。
- **协作方式**：先看素材再判断；与导演衔接创作意图和分镜，尊重用户已确认的镜头与参数。
- **交付**：可继续编辑的工程、实际导出，以及声音同步、画面与回执的检查结果。
- **作者与来源**：desirecore-agent；FableCut MIT 技能来源及修改说明见 [NOTICE](NOTICE)。

## 安装

先通过 DesireCore 正式应用流程安装“视频剪辑”。Agent 从本仓审阅过的 source SHA 通过平台市场或正式导入流程安装。仓库公开或存在 ZIP 不表示市场已收录、安装成功或原生验收完成。

构造导入 ZIP：

```bash
node scripts/package-seed.mjs --output <新文件.zip>
```

打包器只收明确列出的 21 个源文件（包含头像与来源说明），固定 ZIP 根为 `video-editor/`，拒绝符号链接和覆盖已有输出。不要导出 PoC 实例或递归压缩工作目录。实际本地 Agent ID 以当前平台导入结果为准；`agent.json.id` 是新的内容源 UUID。

Agent 与应用的关联仅是入口偏好。实际工具、文件、MCP、模型来源、凭据及生命周期授权继续服从平台合同；seed 不预配置服务器或授权。按 [使用方法](USAGE.md) 连接同一个当前代际的实例。

## 内容

- `video-editing`：受管应用定位、身份、版本、MCP 和导出回执。
- `edit-video`：修剪、声画、字幕、调色、转场、变速和导出。
- `motion-graphics`：形状、父子关系、运动路径、合成、模板与关键帧。
- `remake-reel`：参考片节奏分析与用户素材重剪。

后三项直接改编自 FableCut 的 MIT 技能，原文、固定 commit 与 SHA 保留在 [来源清单](skills/video-editing/references/upstream/SOURCE.json)。时间线和工具语法保持复用，状态、工程版本、受管运行与回执说明按正式应用适配。工具保留 `fablecut_` 兼容前缀，不要求启动上游独立服务。

Smart 默认使用 `flagship`、`tool_use` 与 `vision` 能力意图，不指定 Provider 或具体模型，也不声明 Provider ceiling。真实路由在 Run 启动时确定；Smart tier 不代表预算上限。头像使用随包分发的[原创透明职业肖像](assets/README.md)，`generationPolicy: manual`，保留“剪”字回落；安装不自动发起图像生成。

## 验证与发布

```bash
node --test tests/*.test.mjs
node scripts/validate.mjs --desirecore-root <已审阅的当前DesireCore检出>
```

公开 CI 使用 Node 22 运行内容、包装器与白名单 ZIP 测试，不拉取私有平台。第二条命令另行直接加载指定检出的 `agentSeedConfigSchema` 和 `parseSkillMarkdown`，输出实际平台 SHA；内容 CI 不能替代该平台校验或真实创建、MCP、GUI、导出与各 OS 验证。

通过分支 PR 审查与当前 head CI 后发布源码；市场条目应另行 pin 审阅过的内容 SHA。不要把旧平台或旧 head 的通过结果标为本次成功。

## 许可

[MIT](LICENSE)。上游技能 Copyright (c) 2026 ronak-create，完整许可见 [FableCut MIT](licenses/FableCut-MIT.txt)。
