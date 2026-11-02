# 使用视频剪辑师

1. 通过平台安装并启动“视频剪辑”，保留实际返回的材料根、数据根、实例和运行代际。
2. 经正式导入或市场安装此 Agent，读取实际本地 ID。不要覆盖旧视频导演或 PoC，应用关联的 `contextPermissions` 保持空数组。
3. 通过平台已有 MCP 管理入口为新 Agent 建立独立连接，使用已安装应用提供的领域命令与当前代际参数；不从本包复制测试端口或密钥。发现工具后核实它与 GUI 同属一个实例。
4. 提供素材和目标。Agent 可使用 GUI、MCP、代码场景及其他适合工具；没有强制的制作步骤或预设版式。

定位领域 CLI：

```bash
node skills/video-editing/scripts/video-editing.mjs --app-root <实际材料根> --locate
node skills/video-editing/scripts/video-editing.mjs --app-root <实际材料根> -- status --runtime-file <当前连接快照.json>
```

也可设置 `VIDEO_EDITING_ROOT`。连接快照由当前真实应用响应保存，形状为 `schemaVersion:1`、`dataDir`、`port`、`instanceId`、`scopeId`、`runtimeGeneration`、`releaseDigest`；不含 proof、token 或 Provider。所有值取本次安装的实际响应，不能用产品 UUID 或历史端口猜测。快照只是连接提示，不能替代平台授权或执行 owner。

同一 CLI 的 `identity --runtime-file <快照>` 核身份；`mcp --runtime-file <快照>` 启动仅附着现有服务的 stdio MCP。通过平台 MCP 管理配置此命令；不要直接运行上游 `mcp-server.js`。CLI 每次核 `/api/desirecore/instance`、`/api/desirecore/runtime-identity` 的数据根、端口和本代字段，旧代际必须失败。

包装器自身不自动启动服务或下载软件；当前应用 CLI 负责核对其运行身份。平台重启或应用升级后重新读取当前代际，再配置/调用。

工程写入前读取 `projectId` 和 `revision`，按当前工具 Schema 提交 `baseRevision`。冲突后读取并合并人工编辑。开启其他工程或序列会改变用户视图，按任务意图操作并说明变化。

导出使用应用原任务。保留 job ID，等待或查询原回执；超时不自动重提。提交时只快照声明并解析的本地媒体，动态字体、网络及运行时构造依赖仍需另行物化或说明。输出成功需核实际文件与画面/声音，不能以预览代替。

默认无具体 Provider/model、MCP、compute credentials 或新工具授权。Smart 是强度与能力意图，实际来源由平台在 Run 前确定；测试路由或付费媒体必须按相应授权处理。Agent 自动头像生成已禁用；若通过 ManageAgent 新建，调用方仍须显式传 `avatarGeneration.enabled=false`。

本仓源码校验与平台严格 Schema/skill 校验见 [README](README.md)。实际安装、关联、当前代际 MCP、GUI、导出和各操作系统仍需分别验收。
