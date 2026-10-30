---
name: edit-video
description: 使用视频剪辑应用组接素材、修剪、字幕、调色、转场、关键帧、变速、音频和导出。用户要求剪辑、打开或修改影片时使用。
---

> Adapted from ronak-create/FableCut (MIT), source `61bf46babca82214c162c0650e47a81c3530982c`.
> Read [the managed application contract](../video-editing/SKILL.md) first; current tool discovery and project identity/revision checks govern every call.
> Examples describe timeline grammar. Replace placeholders with actual read values; they are not executable requests.


# Editing video with 视频剪辑

视频剪辑 is a browser video editor whose entire timeline is one JSON document.
You edit video by patching that document; the open editor UI reloads saved
project updates so the user can review the timeline as you work.

## Start with the installed application

Read the [managed application contract](../video-editing/SKILL.md) before a session.
Use only its installed, authorized current-generation service. `fablecut_status`
queries that service; it does not start another server. Read a small relevant
`fablecut_docs` section when needed. Re-read project identity and revision before
writing; supply `projectId` / `baseRevision` where the current tool Schema requires.

## Making edits

**Prefer `fablecut_patch_project`.** It sends only what changes, re-reads the
latest document internally. The managed adapter also checks the expected
project identity and revision; read and merge conflicts rather than retry blindly. Batch related changes into one call; ops apply in
order and bump the revision once.

```
fablecut_patch_project {projectId:"<current projectId>", baseRevision:<read revision>, ops:[
  {op:"updateClip", id:"c_v2", set:{props:{filterPreset:"teal-orange"}}}
]}
```

Use `fablecut_get_project {compact:true}` to plan — it's roughly 10× smaller
than the full JSON. Fetch the full document only when you need exact keyframes.

`fablecut_set_project` replaces the whole document and is conflict-checked: if
the user edited in the UI since your last read, it refuses rather than
overwriting. On conflict, re-read, re-apply your change, and call it again.

## Getting footage in

`fablecut_import_media` copies a local file into the project and registers it
with its details read from the file: duration, resolution, frame rate, codecs,
audio channels and size. The compact view's MEDIA lines show them for every
file (plus tags, favorites and `uses:N`), so read them there instead of shelling
out to ffprobe. The managed application prepares ffprobe; if probing fails, do not invent
duration or resolution. Check that a field is present before relying on it. To organize the bin, use `updateMedia` (favorite, tags, folder)
and `setCollection`.

A file marked `OFFLINE` in the compact view or `fablecut_status` is missing
from `media/`: find it, put it back under `media/` and `relinkMedia` it —
its clips keep their timing. `replaceMedia` swaps in a different file.

Proxies (`fablecut_proxy`) only make the preview smoother; export, frames and
scopes always use the originals. Make them only when the user asks.

`fablecut_projects` lists the user's projects and opens, creates or duplicates
them; every other tool works on the open one (`./project.json`). Switch, archive
or delete only when the user asks — opening another project changes what they
see — and re-read the project after a switch.

Before a big or risky change (restructuring the edit, a remake, a new look on
every shot), save a version with `fablecut_versions {action:"save", name, note}`
so the user has a named point to go back to; when they are happy with a cut,
save one too. `{action:"diff", version}` tells you (and them) what changed since.
Restore a version only when the user asks.

A project can hold several sequences (timelines sharing its media): the compact
view lists them under SEQUENCES, and every op works on the open one. For "a
vertical version" or "a 15 s cut-down", add one with `{op:"addSequence", name,
from:"open", width?, height?}` and edit it with `{op:"inSequence", sequence,
ops:[…]}` — the user's editor stays on what they are watching. Open one
(`openSequence`) only when they ask, or to export it.

For "a 30 s reel from this footage", `fablecut_highlights {duration:30}` picks
the best moments into a new sequence (it opens it); look at them with
`fablecut_frame` before building on them.

For a vertical (or square) version of a finished edit, `fablecut_reframe
{aspect:"9:16"}` does the copy for you: a new sequence on that canvas whose
full-frame shots follow their subject with ordinary position keys. It opens
the copy, so the user's editor switches to it; say so. To build a copy without
switching their view, use `addSequence` + `inSequence` as above instead. It
leaves titles, picture-in-picture and clips placed by hand alone and lists
them: look at those with `fablecut_frame` on the new canvas and move them.

## Things that trip people up

- Cut, ripple, trim and insert with the `fablecut_patch_project` edit ops
  (`split`, `rippleDelete`, `extract`, `insert`, `rippleTrim`, `roll`,
  `slip`, `slide`, `crossfade`) instead of recomputing `start` / `in` by
  hand — they keep linked audio stems in sync and respect the user's locks.
- Video and audio clips must satisfy `in + duration×speed ≤ media.duration`.
- Crossfades are same-track overlap plus `transitionIn: {type:"fade"}` on the
  later clip — not a separate object.
- **Speech:** read it before you cut it. `fablecut_transcribe {clipIds:[…the speech clips]}`
  returns their words as timed lines (with no clipIds a music bed is transcribed
  too); `find:"the line"` locates it and `cut:true` extracts it with the pause after it. `fablecut_silence {cut:true}` tightens
  the pauses. Whisper leaves out most "um"s, so don't hunt fillers by text.
  Lock the music lane before either cut. Caption it last:
  `fablecut_captions {style:"highlight", clipIds:[…the speech clips]}` (or subtitle,
  karaoke, pop), then look at a frame mid-sentence.
- Choose a coherent type system that suits the footage and language; `fablecut_docs {section:"Text"}`
  lists the built-in title styles.
- **Grade** with the `setGrade` patch op (`props.grade`: exposure, temp / tint,
  lift / gamma / gain / offset wheels, tone bands, contrast, saturation, tone
  curves and hue curves; `setGradeLayer` for a secondary on one colour or one
  area — check its matte with `fablecut_scopes {matte:{clip, layer}}`) and
  check every grade with `fablecut_scopes` — median luma near 0.35–0.5, no
  clipped whites, cast strength under ~0.03 on neutral scenes.
  `fablecut_docs {section:"Color"}` has the keys and how to read the numbers.
- **Motion graphics** (shape layers, draw-ons, lower thirds, nulls,
  parenting, anchor points, motion paths, compositions, animation presets and
  templates) have their own skill, `motion-graphics`, and manual sections
  ("Shapes, nulls and parenting", "Compositions (nested sequences)" and
  "Presets and templates" under `{section:"schema"}`). For a quick lower third
  or a title that slides in, `addTemplate` and `applyPreset` are one op each.
- **Export** with `fablecut_export` — the editor's own Fast export, in the
  current application's original headless export owner. It uses the installed application's prepared ffmpeg and original export job.
  Read that job's receipt for its actual result; a timeout is unknown, not failure. For a platform, pass its preset
  (`preset:"youtube"`, `"youtube-shorts"`, `"instagram-reels"`, `"tiktok"`,
  `"x"`, `"linkedin"`, `"broadcast"`, `"web"`, `"archive"`) and adjust with
  `delivery:{…}` (fps, codec, bitrate, file name, metadata); a 16:9 timeline
  exported to a vertical preset is cropped from the middle unless the project
  has an export frame, so say so, set one, or make a reframed copy first
  (`fablecut_reframe`). `fablecut_encode_profiles` lists
  the presets. Several files at once (a master, a YouTube cut, a reel, a
  square…): `outputs:[{preset:"master"}, {preset:"youtube"}, …]` renders the
  timeline once per frame rate and encodes every file from it; `setProject {outputs:[…]}`
  saves the list with the project and `outputs:true` exports it.
  `delivery:{audio:{loudness:-14}}` normalizes the mix (−23 for broadcast);
  the reply checks each file — read it and tell the user about any ⚠ line.
