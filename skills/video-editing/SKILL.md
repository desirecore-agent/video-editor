---
name: video-editing
description: 连接已安装的“视频剪辑”应用，核对受管实例身份、工程版本、MCP 接入和导出任务。打开应用、接续工程、处理并行修改、导出或定位服务问题时使用。
---

# 使用受管视频剪辑应用

这是应用接入方法；具体创作可选 GUI、MCP、代码场景或其他适合工具。应用复用 FableCut 的时间线与合成器，现有 MCP 工具保留 `fablecut_` 前缀以保持兼容。前缀不表示应启动或下载上游独立服务。

## 安装与身份

通过 DesireCore 现有应用管理入口安装和启动“视频剪辑”。只使用平台返回的实际材料根、数据根、端口与当前运行代际；没有实例时通过原受管流程准备，不猜端口，不直接运行 `server.js`、上游 MCP 入口或 `npx fablecut`。

本包不安装 MCP 服务器、不包含凭据或额外工具授权。应用与 Agent 关联只是入口偏好。平台完成授权后，针对新 Agent 配置独立 MCP 连接，并发现当前工具列表；连接与调用必须指向同一材料根、数据根及当前代际。重启或升级后重新核对身份。

薄包装器只调用已安装应用的领域 CLI，不自动下载或启动服务：

```bash
node skills/video-editing/scripts/video-editing.mjs --app-root <平台返回的材料根> --locate
node skills/video-editing/scripts/video-editing.mjs --app-root <平台返回的材料根> -- status --runtime-file <当前连接快照.json>
```

也可使用 `VIDEO_EDITING_ROOT` 指定材料根。`identity` 和 `mcp` 使用相同 `--runtime-file`；MCP 只附着已有服务。快照取自本次真实应用响应，包含 `schemaVersion:1`、`dataDir`、`port`、`instanceId`、`scopeId`、`runtimeGeneration`、`releaseDigest`，不含 proof、token 或 Provider。它是连接提示，不是平台授权。应用 CLI 逐次比对 `/api/desirecore/instance` 和 `/api/desirecore/runtime-identity`，拒绝旧代际；禁止手写或复用历史身份值冒充实际响应。

先看已安装 CLI 的帮助及状态；状态查询不等于启动成功。CLI/MCP 不可用时保留诊断，按已有生命周期恢复，不换成独立上游实例。

## 工程并行修改

先读取 `fablecut_status` 和 `fablecut_get_project {compact:true}`，核实当前 `projectId` 与 `revision`。在本适配中，状态只查询现有受管服务，不能自动启动第二个 owner。

`patch_project`、`set_project` 等提交以已读的工程身份和 `baseRevision` 为前提；以实际发现的输入 Schema 为准。典型提交形状：

```text
fablecut_patch_project {projectId:"<已读工程>", baseRevision:42, ops:[
  {op:"updateClip", id:"<实际片段>", set:{props:{filterPreset:"teal-orange"}}}
]}
```

不要用示例值调用。409 或版本冲突后读取最新工程，比较人工修改，再决定合并；不盲目重放。其他修改工具也可能内部读取最新工程，返回事实优先于旧技能的“总是安全合并”描述。切换工程后重新读身份和版本。尊重锁定，不以直接文件写入绕过 owner 或冲突检查。

## 预览与导出

读取当前应用的 `fablecut_docs` 小节，使用原编辑器工具。导出前让已保存的工程版本与目标一致；Fast、队列与 MCP 使用原导出任务，保留 job ID 并查询该任务。

导出快照覆盖提交时声明并解析的本地媒体；动态字体、动态路径与网络资源没有因此得到完整封闭。需要稳定成片时先把依赖物化并核对，或报告无法封闭的部分。代理只改善预览，不能冒充导出输入。

超时表示结果未知：先查原 job，不重复提交。取消请求、job 终态、编码器退出和迟到 begin 的清理分别核实。重启后读取持久回执，明确重试后才重跑，不自动续跑。

成功交付核对实际文件路径、大小、SHA、时长、分辨率、帧率、画面来源和声道/音量；先读取应用回执，再按任务需要用独立探测与播放验证。不得用另一个渲染工具生成文件替代应用导出证明。

## 创作技能

- [剪辑、声音和调色](../edit-video/SKILL.md)
- [形状、父子关系、合成、关键帧和模板](../motion-graphics/SKILL.md)
- [参考片结构分析与重剪](../remake-reel/SKILL.md)

三项技能保留上游方法；实际调用以前述身份、版本和已发现的当前工具契约为准。
