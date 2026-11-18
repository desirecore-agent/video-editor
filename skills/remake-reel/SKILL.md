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

制作前按需要用真实帧或短场景试验现有能力，例如抠像、白边、中文字形、动画和音频效果。缺能力时记录实际缺口并修复或说明取舍；不能省略核心包装后宣称已实现同款。表达方式可选原时间线、合成、SVG、代码场景等，不限定一种创作路线。

## Get the blueprint

```
fablecut_analyze_reference {path:"C:\\…\\ref.mp4"}
```

Uses the installed application's prepared ffmpeg. It returns shot boundaries (`cuts`, `shots[]` with a
per-shot `energy` 0–100), detected `beats[]` and `bpm`, a loudness `energy` curve,
and `drop` — the biggest detected energy rise. Speech can also produce periodic
peaks; these numbers do not prove there is music.

Optional audio extraction registers the reference's **entire audio track** as media.
It does not separate music from speech. For talking-head references, use `music:false`
when extraction is unnecessary. Before reusing extracted audio, check its contents
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

用户要求稳定复现时，将已验证的方法沉淀为可复用说明或工程构建素材，从新工程重复实际制作和完整导出，检查主要事件、画面和声音。重复导出同一个现成工程只能验证该工程的导出；一条短片通过也不能证明整条长片稳定。说明实际连续成功次数、输入范围和运行环境，失败保留原 job 并排查后显式重试。

## Be honest about what this does

The blueprint captures *structure* — timing, pacing, where the energy sits. It
does not capture look, subject, or performance. Tell the user that a rebuild
matches the rhythm of the reference and that the grade, footage, and titles are
separate choices, rather than implying the result will look like the original.

Only analyze video the user has the right to use as a reference, and don't
reproduce a reference's actual footage — the point is to reuse the structure
with their own material.
