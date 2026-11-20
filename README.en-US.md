# Video Editor Agent / 视频剪辑师

![Video Editor avatar](assets/avatar.png)

An independent DesireCore Agent content source for [视频剪辑 / video-editing](https://github.com/desirecore-agent/video-editing). It handles editing, pacing, sound, grading, reference remakes, original motion graphics and output review while preserving an editable timeline and compositions. Existing 视频创作 / 视频导演 remain independent.

[中文](README.md) · [Usage](USAGE.md) · [Provenance](NOTICE)

This repository distributes a clean seed, layered persona/principles, plain Markdown standing instructions, four skills, and a thin locator for the installed application's CLI. It contains no chat runtime, model runtime, user settings or video assets; the avatar image is self-contained.

## Profile

- **Role**: video post-production editor, shaping existing footage into a clear, well-paced film with coordinated sound and picture.
- **Strengths**: asset organization, timeline editing, reference remakes, grading, audio mixing, captions and original motion.
- **Collaboration**: inspect footage before judging it; align with a director's intent and storyboard while preserving approved shots and parameters.
- **Delivery**: an editable project, actual export, and checks of sound synchronization, picture and receipts.
- **Author and source**: desirecore-agent; FableCut MIT skill provenance and adaptations are documented in [NOTICE](NOTICE).

## Install

Install 视频剪辑 through DesireCore's governed application flow. Install this Agent from a reviewed source SHA using the marketplace or official import flow. A public repository or ZIP alone does not prove listing, installation or native acceptance.

```bash
node scripts/package-seed.mjs --output <new-file.zip>
```

The deterministic packager includes only explicitly named source files (including the portrait, shot references and provenance) under `video-editor/`, rejects symlinks, and refuses to overwrite an existing output. Never package a PoC export or an entire working directory. Use the actual platform import result as the local Agent ID; `agent.json.id` is a fresh source UUID.

Agent 0.1.2 requires video-editing 0.1.7 or later for the connection handoff helpers and persistent keyword colours. Verify support in the current material’s CLI help and manual before use.

Application association is an entry preference. Tool, file, MCP, model, credential and lifecycle authority remain subject to platform governance. The seed configures no servers or privileged tools. See [usage](USAGE.md) for connecting the same current-generation instance.

## Contents

- `video-editing`: managed application discovery, identity, revisions, MCP and export receipts.
- `edit-video`: cuts, sound, captions, grading, transitions, speed changes and export.
- `motion-graphics`: shapes, parenting, motion paths, compositions, templates and keyframes; on-demand lookup of 124 Shotcraft cards / 150 styles, exact demo source and the SFX sourcing helper.
- `remake-reel`: compare reference visuals, speech, graphic timing and sound; rebuild with the user's footage and repeat from new projects.

The latter three reuse FableCut's MIT skills. Original files, fixed commit and hashes are preserved in the [source record](skills/video-editing/references/upstream/SOURCE.json). Timeline/tool grammar is retained; managed lifecycle, project revision and receipt guidance are adapted. The compatible `fablecut_` tool prefix does not require an independent upstream server.

The [Shotcraft adaptation guide](skills/motion-graphics/references/shotcraft/README.md) covers fixed provenance, frame-rate/coordinate conversion, native capability limits, audio licenses and independent final review. References and source ship in the seed without Gallery media, dependencies or another renderer. The 150 styles are reference vocabulary, not a claim that every style has passed native validation.

Smart defaults express `flagship` strength with `tool_use` and `vision`. No Provider, exact model or Provider ceiling is selected. A real Run determines its route; tier is not a budget limit. The [bundled original transparent portrait](assets/README.md) uses `generationPolicy: manual`, with a deterministic character fallback and no generation request during installation.

## Validate and publish

```bash
node --test tests/*.test.mjs
node scripts/validate.mjs --desirecore-root <reviewed-current-DesireCore-checkout>
```

Public Node 22 CI checks content, the CLI locator and the ZIP allowlist without accessing the private platform. The second command separately loads that checkout's live `agentSeedConfigSchema` and `parseSkillMarkdown`, reporting its actual SHA. Content CI does not prove platform validation, persistent creation, MCP, GUI, export or any OS acceptance.

Publish source through a reviewed branch PR with current-head CI. Marketplace metadata must separately pin a reviewed source SHA. Prior platform or head evidence does not establish current success.

## License

Original content: [MIT](LICENSE). Shotcraft references and tools: [Apache-2.0](licenses/VideoShotcraft-Apache-2.0.txt); audio requires per-asset licensing. Full attribution: [NOTICE](NOTICE). Upstream skills: Copyright (c) 2026 ronak-create. See the complete [FableCut MIT license](licenses/FableCut-MIT.txt).
