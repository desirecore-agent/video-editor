# 在 DesireCore 使用 Shotcraft 镜头库

用户指定使用 video-shotcraft、需要选镜头、标题强调、卡片逐项组装、转场、运镜或音效时按需读取。它提供可追溯的创作参考；实际工程仍使用[受管视频剪辑合同](../../../video-editing/SKILL.md)和当前应用能力。用户选择 DesireCore 后，不启动上游工作台或另一套渲染服务，不安装上游 Skill 为额外常驻指令。

本包固定 [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) 的 `075b548c2405a07b77129eb448b0b504fc60dea3`：124 张卡、150 个样式，卡片原文、demo 和共享组件源码、选材工具与审查清单。源码保留原始字节及 Apache-2.0 许可，[SOURCE.json](SOURCE.json)逐文件记录 SHA；不携带画廊视频、BGM、产品截图、依赖或用户素材。原始 [SKILL](upstream/SKILL.original.md)只供理解来源，执行时以用户要求和当前平台合同为准。

## 找到准确配方

在本技能目录运行下面的只读检索；路径按实际安装位置替换。检索不联网、不修改工程、不启动应用：

```bash
node scripts/shotcraft.mjs find "纸卡 标题"
node scripts/shotcraft.mjs find "转场" --category transition
node scripts/shotcraft.mjs show marker-underline-title marker-underline-title
```

先在 [catalog.json](catalog.json) 查用途、能量、卡名及准确 `style-key`，再读取返回的卡片原文和它定位的准确 demo TSX。名称相近不等于同一变体。`demos: []` 表示导入器没能定位 demo，必须从原文及固定上游树核实，不能编造实现或声称复现。动态样片未随包分发；需要核对运动时读取上游对应样片或用户参考，无法取得就标为无法验证。

每卡初始 `nativeStatus: reference-only`。这代表资料可用，**不代表这 150 种样式均已在视频剪辑中运行成功**。一次原生短片通过只证明对应实现、应用版本、素材和输出规格；在工作目录保存该证据，不回写成全库支持保证。

## 将运动语法变成当前应用的数据

| 参考能力 | DesireCore 中的落点 | 适配和验证 |
| --- | --- | --- |
| 文字、下划线、描边、强调色 | text、shape/path、trimEnd、关键帧 | 实际中文字形、字宽、路径长度；高亮随文字落位，不能变成加载条 |
| 字卡、字段组装、标题降为标签 | comp、parent/null、独立文字及形状 | 区分入场、稳定阅读、选中和替换；共享几何与时刻，旧内容退场后不再复活 |
| 进度、数据和列表 | shape、text、局部关键帧 | 进度有真实含义；小件错峰和跨组停留按叙事安排，不一律匀速点名 |
| 平面转场、聚焦和揭示 | 当前应用已支持的 mask、clip/shape keys、comp | 查实际合同；不能用近似转场名称代替准确样式，不能漏掉进行中画面 |
| PageCam、FlatPanel3D、着色器、真 3D | 原始 demo 与共享组件仅供参考 | 上游依赖 Remotion/three 等；先核应用是否有等价能力。缺少就记录差异，不能直接宣称原生支持 |
| 镜头编排和最终审查 | 工作目录的分镜、视觉状态矩阵及成片报告 | 复用原 Task/Plan 和工程，不增加另一套平台业务状态机 |

上游很多 demo 用 30fps、1920 横屏。先把帧数除以源 fps 得到秒，再乘目标 fps 验证帧位置；不要把 10 帧直接搬到 60fps。坐标按真实画布、安全区及文本重新排版，局部秒数、源视频入点和比例遮罩不随像素倍率放大。输出规格仍来自用户要求，竖屏 4K60 不能被 demo 默认值覆盖。

具体例子：

- [marker-underline-title](upstream/references/shots/typography/marker-underline-title.md)：读取准确 demo 的下划线曲线与时序，保留固定随机种子；10f@30 是约 0.333 秒。把标题、下划线和阅读停留分别记录；不凭文件名画一条普通矩形冒充该样式。
- [paper-title-card](upstream/references/shots/typography/paper-title-card.md)：词级错峰、单个重点词、下划线与退出留白一起适配。中文按语义组和字宽重排，不能照搬英文逐词坐标，也不能用标题装饰覆盖口播正文。
- [product-card-progressive-assemble](upstream/references/shots/ui-entrance/product-card-progressive-assemble.md)：先字段骨架，再内容落位，强调高亮晚于文字，最终留稳定阅读。口播解释卡只借适合的分组和动作，不能凭空添加“原价→现价”或产品功能。

这三个是已阅读源码的适配入口，不是本包已完成的三个原生效果预设。实际复刻仍须对应工程和文件证据。

## 声音来源和动作同步

先读 [sound-design](upstream/references/sound-design.md) 与 [sfx-sourcing](upstream/references/sfx-sourcing.md)。保留用户指定原声和音源；无 BGM 的口播不用强加音乐或拍点。参考片音轨可能含旁白，不能当纯音乐叠进成片。

复用上游标准库工具（Python 3.9+）；Windows 显式使用 UTF-8。按实际授权的工作目录填写输出路径：

```bash
python -X utf8 references/shotcraft/upstream/assets/scripts/sfx-source.py search "dry paper slide" --max-duration 1 --limit 5 --output <候选清单.json>
python -X utf8 references/shotcraft/upstream/assets/scripts/sfx-source.py analyze <实际音频文件> --output <分析.json>
```

候选搜索只返回素材页/试听入口；选择后再按工具帮助执行 `get` 并正常导入应用。每个实际素材保留素材页、作者、确切许可 URL/版本、预览或原文件标记、哈希及所需署名；未知许可和 BY-NC 不能视作可发布素材。代码 Apache-2.0 不覆盖音频。离线分析需要可用 FFmpeg/ffprobe，10ms RMS 与样本峰值不是 LUFS、真峰或试听结论。

声音对齐分别记录素材自身峰值滞后和实际输出音轨偏移。上游 Remotion/AAC 的补偿常数不能套到当前应用。用户片无 BGM 时只交付所需版本，不为满足上游产品片模板额外混音；输出仍检查整 mix、接点、原话和用户要求的响度。

## 真实画面与成片检查

制作前按需读 [pipeline](upstream/references/pipeline.md)、[aesthetic-rules](upstream/references/aesthetic-rules.md) 和 [final-review](upstream/references/final-review.md)。工具、创作模式和素材已明确时直接沿用，不反复询问默认宣传片模式。

每张解释卡按**实际视觉事件**检查触发前、进行中、稳定态和换页后。语音词锚、整页边界、标题出现和按钮出现是不同事实，不机械共用一个时刻。最终状态漂亮不能证明按钮没有提前两秒出现；给新事件补采，退场时避免淡出规则重新点亮已隐藏的旧层。

在目标手机实际显示尺寸看整幅成片帧，分别检查外框、文字墨迹、对比度、字幕、人物头发/手部边缘及安全区。不要把横屏“字号占画高”的例值直接套到竖屏，也不只按源 `fontSize` 判断可读性。原生连续片检查短暂残影、出场动作、阅读停留和声音同步；整片还要完整解码、开头/结尾、各图卡显示状态、实际恢复帧及最终附件核验。短片、工程截图和性能夹具不能替代真实全长文件。

候选成片存在后，按上游要求请**未参与制作、干净上下文的独立审查 Agent**终检。提供实际 MP4、帧号/关键帧、用户目标、参考片、选定卡/style-key/准确 demo、分镜与声音/素材记录；不给制作辩解或预期结论。缺少输入标为无法验证，保留必须修复项和建议项。报告通过只覆盖实际检查范围，不自动证明另一新工程可重复或所有平台可用。
