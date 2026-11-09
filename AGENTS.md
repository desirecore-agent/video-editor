# 视频剪辑师源码维护

本仓库是新的可分发 Agent 内容源；实际 AgentFS 由平台 ManageAgent 或正式导入流程创建。不得直接写持久 AgentFS、Bash 伪装 Renderer，或从 PoC/用户实例导出打包。

- persona/principles 使用精确 `## L0`、`## L1`、`## L2`；L2 章节保留稳定 `prompt-section` ID、描述和 on_demand 模式。常驻约定放 instructions，操作方法放 skills。
- agent.json 使用当前 agent-seed Schema 与纯 Smart profile，不固定 Provider/model，不携带 Provider ceiling、MCP 配置、凭据或新工具授权；头像使用随包 PNG 与 manual 策略，保留字符回落，安装不触发生图。
- 视频剪辑应用在独立仓库。包装器只定位并调用已安装的领域 CLI，不自动启动服务、不下载上游产品。
- 保留 MIT 许可、NOTICE、原始技能与固定来源。原始参考不是运行说明，不能把旧自动启动步骤带回正式技能。
- 打包只走 scripts/package-seed.mjs 的明确文件清单，不递归打包 runtime、用户、偏好、工作目录、审批、记忆或密钥。
- 只维护 AGENTS.md，不创建 CLAUDE.md、CLAUDE.local.md 或 .claude/CLAUDE.md。不要改旧视频导演/视频创作或用户配置。

验证：`node --test tests/*.test.mjs`；`node scripts/validate.mjs --desirecore-root <已审阅的当前平台检出>`。平台 Schema 与 skill parser 从该检出直接加载，不复制私有 Schema。
