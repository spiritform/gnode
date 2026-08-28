# GNODE

A frontend-only ComfyUI extension that collapses a cluster of nodes into a single clean card in-place of the cluster. Cleaner than subgraphs — no nesting, no black box — your underlying graph is unchanged.

Select any set of nodes, right-click → **Wrap in GNODE**, and get one grouped card exposing just the parameters and previews you care about. Restore the original layout any time with **EXPAND**.

## Install

**Comfy Registry** (recommended)
```bash
comfy node install gnode
```

**ComfyUI Manager**: search for `gnode`.

**Manual**
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/spiritform/gnode
```

Restart ComfyUI. No dependencies, frontend-only.

## Usage

- **Wrap**: select 2+ nodes → right-click → `◆ Wrap in GNODE`. LiteGraph groups become section headers automatically; ungrouped nodes fall into a Misc section.
- **Expand**: click **EXPAND** on the card to restore original positions and groups.
- **Send to GNODE**: right-click any loose node → `◆ Send to GNODE ▸ <section>` (existing sections + `+ new section…`).
- **Hide / restore parameters**: hover a row and click the `×`. Restore from the per-section `+ N hidden` popover.
- **Reorder**: drag any row (including preview rows) up or down within or across sections.
- **Preview column**: click the eye icon in the header to show a right-side thumb column for all preview nodes.
- **Horizontal / vertical**: toggle with the columns icon (available for wraps with 2+ sections).
- **Load Image inputs**: double-click the thumb or drag-drop an image file to upload directly into the underlying `LoadImage` node.
- **Slider scrub**: click-drag horizontally on a value box. `Shift` = fine (0.1×), `Ctrl` = coarse (10×). Double-click to type.

## Features

- Two-way widget mirroring (combos, sliders, textareas, toggles, checkboxes)
- Preview rows update after each run via `app.nodeOutputs`
- Executing pulse: the active section's dot pulses while its nodes are running
- Random Comfy-native accent color per GNODE (persists across reloads)
- Per-section resize handles for input / preview / body widths
- Everything auto-fits by default; drag the corner for a custom size

## License

MIT
