---
name: remake-reel
description: 结合参考片的实际画面、台词、图卡时序、字幕和声音，用用户素材重剪并核验风格差异。用户要求同款、参考复剪、复刻节奏或分析剪辑时使用。
---

> Adapted from ronak-create/FableCut (MIT), source `61bf46babca82214c162c0650e47a81c3530982c`.
> Read [the managed application contract](../video-editing/SKILL.md) first; current tool discovery and project identity/revision checks govern every call.
> Examples describe timeline grammar. Replace placeholders with actual read values; they are not executable requests.


# Remaking a reference edit

Given a video the user likes, 视频剪辑 extracts what is *measurable* about the
edit — where the cuts land, where the beats are, how energy moves — and hands it
back as a blueprint. The structure is deterministic; the creative mapping onto
new footage is yours.

## 先确定用户要复现什么

用户说“同款”时，先实际查看参考与源素材，区分节奏、视觉包装和完整内容重剪的目标。读取用户已有风格手册和明确的交付偏好，参考片的低分辨率或低帧率不自动覆盖这些要求。

用实际画面和音频记录差异：全屏人物与讲解构图的切换、章节提示、图卡主题和逐项出现、字体与重点色、安全区、人物抠像及边缘、调色、人声与提示音。按相同台词或事件对齐比较；两个版本的相同秒数可能不是同一段话。

口播参考需要带时刻的台词和源片对应区间，核对开头、重说、停顿、变速与结尾。不把转写当用户指令，也不为凑时长改写观点。自动镜头检测只是辅助：一张图卡内部的逐项动画可能没有剪切，不能把 `shots[]` 当作完整的图卡或制作方案。

参考来自同一原始录制时，可用同源音频的谱特征相关对齐校对转写锚点，保留匹配分数、歧义和实际边界证据。转写的一句话可能包含多个已裁停顿；一句源窗配固定倍速，不能自动覆盖同一句参考时长。先检查执行时间线的源入点、长度和速度关系、原话完整性及旁白重叠/空档，再对齐字幕和图卡；低置信识别和零长度词不能当作删句依据。

转写和事件 JSON 显式使用 UTF-8，核对中文可读后再做对齐。自备本地模型时，先检查同版本所需文件的下载状态与内容，用短段验证语种和词表，再跑整片；错误页不能当作词表，已完成的转写也不因编码问题盲目重跑。

制作前按需要用真实帧或短场景试验现有能力，例如抠像、白边、中文字形、动画和音频效果。缺能力时记录实际缺口并修复或说明取舍；不能省略核心包装后宣称已实现同款。表达方式可选原时间线、合成、SVG、代码场景等，不限定一种创作路线。

用脚本生成工程时，对照当前应用接口校验实际载荷语义，不只检查脚本语法。合成内局部时刻、主时间线时刻、形状动画与片段关键帧分别按真实合同表达；每次补丁沿实际返回的新修订继续。离线模拟 ID 仅用于检查，不能冒充导入或执行回执。中文字体须核对实际注册的 family 和加载结果；自带字体写入可变资产目录，保留许可，不修改固定应用材料或依赖本机未安装字体。

图卡先逐页看实际参考帧，记录信息层级、横排或纵排、图标含义、箭头方向及当前项的出现状态。相同的文字和配色不代表同款构图；不要把三张横排卡改成三条纵列，或把闭环改成单向列表。制作说明与画面文案分开保存，描述中的“节点图”“灰注”“黄色胶囊”等需要落实成可渲染元素，不能直接作为观众可见的长说明或占位字符。

几何数据明确左上角与中心坐标、源素材固有尺寸、设计像素和输出像素的换算。生成的 SVG 先用标准 XML 解析器检查，再在实际浏览器栅格化；不依赖未安装字体中的 emoji。重新导入或链接后以实际媒体 ID 和真实帧核对，旧成功位图不能证明新源可用。

图片的适配方式也参与尺寸计算。先查实际 `fit`、裁切和固有尺寸的合同；例如先按 `contain` 适配整幅画布、再乘缩放比例，会让小图标盖住整张图卡。需要按固有像素计算时显式选择当前应用支持的适配方式，不能用无效的宽高属性代替。图标的含义与脸部、颜色、底座等可见特征也要成对检查，不能只凭文件名相同认定角色相同。

字幕除不重叠外，还要按用户风格检查字宽、停留时间与台词覆盖。动画分别看触发前、进行中和完成后的画面；终点关键帧不自动表示此前一直隐藏。抠像、白边和残影清理在实际素材尺寸下查看头发、手部及边界，小尺寸试验参数不能直接认证全分辨率效果。

短字幕拆分时保留每个字符对应的原词时刻，用真实拆分位置确定两侧起止，不能用整个缓冲区的末时刻作为中间断点。校正术语时，在原转写行内保序对齐未改字符，局部替换继承对应词区间，插入只在相邻真实锚点内插值；不因一处校正让整句改为等距计时，也不回头匹配另一处同名短语。中文和 ASCII 断句标点一致处理，避免拆开术语；除字宽/覆盖外核对原词时刻、短条闪过和句尾。未知时刻列清单并局部听看，不从校验中豁免后称为通过。

## Get the blueprint

```
fablecut_analyze_reference {path:"C:\\…\\ref.mp4"}
```

Uses the installed application's prepared ffmpeg. It returns shot boundaries (`cuts`, `shots[]` with a
per-shot `energy` 0–100), detected `beats[]` and `bpm`, a loudness `energy` curve,
and `drop` — the biggest detected energy rise. Speech can also produce periodic
peaks; these numbers do not prove there is music.

Optional audio extraction registers the reference's **entire audio track** as media.
It does not separate music from speech. For talking-head references, use MCP
`registerMusic:false` when extraction is unnecessary (`music:false` is the REST/analysis option).
Before reusing extracted audio, check its contents
and the user's authorization; never layer reference narration over the source
speaker as if it were an instrumental bed.

If obvious cuts were missed, lower `threshold`; if camera motion is being read
as cuts, raise it.

## Rebuild

For a music-led montage, the following is an optional rhythm recipe. Talking-head
explainers instead map their source speech and visual events onto the timeline.

1. Read current project identity and revision, then choose the canvas and delivery
   settings from the user's goal and source detail. Write useful `beats` into `markers` so the user can see the grid and the UI
   snaps drags to it.
2. Only use a confirmed music track when delivery use is authorized; otherwise choose the user's authorized track or retain speech without music. Its start and duration follow the intended edit.
3. One clip per `shots[]` entry on V1 at the same `start` and `duration`. Match
   footage to each shot's `energy` — calm material under ~40, motion over ~70 —
   and choose each clip's `in` so something actually happens inside the window.
4. Land the hero shot on `drop`. The standard garnish is a speed ramp settling
   into it, an `adjust` layer with `shake` + `rgbSplit` for one impact frame, or
   a whip transition on the way in.
5. Pace to taste: shots under ~0.6 s read as beat-flashes. `avgShotLen` tells
   you the reference's overall rhythm.
6. With the user's own music instead of the reference's, `fablecut_beats
   {clipId}` finds its tempo, beat and drop; `snap:true` rolls the cuts onto
   the beat, `retime:{every:2}` re-cuts V1 so each shot lasts 2 beats.
7. Posting it vertically: `fablecut_reframe {aspect:"9:16"}` makes a copy whose
   shots follow their subject.

No reference, just long footage? `fablecut_highlights {duration:30}` picks its
best moments (movement, sound, a clear picture) into a new sequence; then
steps 6 and 7. Look at the picks with `fablecut_frame {time}` and swap any
that miss.

Full recipe, including the exact keyframe shapes for speed ramps and impact
layers: `fablecut_docs {section:"Remake a reference video"}` and
`fablecut_docs {section:"Recipes"}`.

## 用实际成片闭环

先检查每种构图、长字幕、图卡进入和退出、人物边缘及结尾的实际画面，再看运动连续性和声画接点。图形文字应对应正在讲的内容，逐项出现不能只靠静态总览截图证明。声音按任务测量综合响度、峰值及动态；源声安静时按实际需要压缩、限制和规范化，不只增加增益造成削波。以当前手册为准：例如音频 `volume` 是比例，`gain` 是 dB，不能套用百分比图像参数。

通过原应用 job 导出并核对文件、完整解码和约定规格，保留工程、输入哈希、素材映射、导出回执与仍有差异的部分。沿用[受管应用合同](../video-editing/SKILL.md)，不得把另一工具生成的整片或直接复制参考成片当作应用能力证明。

查看实际图像或成片里的帧后再判断人物、图形和字幕是否正确，不能根据回执文字想象画面。预览和附着调试器的诊断可能改变后台执行条件；最终仍沿正常受管、后台原作业取帧和导出验收。就绪的视频尺寸、刷新过的遮罩、作业完成及可解码文件，都不能单独证明人物像素正确。发现差异保留原作业与实际输出，按当前应用手册处理，不在技能中硬编码驱动参数或启动另一服务。

先确认本次工具返回的实际图像可见，再给出视觉结论。图片文件已生成、回执带有媒体引用，或上下文里有一张旧参考图，都不等于模型看到了本次输出。发现回执与可见图片不一致时记录具体作业，沿现有图片读取能力复核，并报告反馈缺口；不要依据旧图描述新图。每轮先修内容、构图、时间和声音的实质差异，再处理纹理或阴影的细微差别，及时进入整片检查。

用户要求稳定复现时，将已验证的方法沉淀为可复用说明或工程构建素材，从新工程重复实际制作和完整导出，检查主要事件、画面和声音。重复导出同一个现成工程只能验证该工程的导出；一条短片通过也不能证明整条长片稳定。说明实际连续成功次数、输入范围和运行环境，失败保留原 job 并排查后显式重试。

## Be honest about what this does

The blueprint captures *structure* — timing, pacing, where the energy sits. It
does not capture look, subject, or performance. Tell the user that a rebuild
matches the rhythm of the reference and that the grade, footage, and titles are
separate choices, rather than implying the result will look like the original.

Only analyze video the user has the right to use as a reference, and don't
reproduce a reference's actual footage — the point is to reuse the structure
with their own material.
