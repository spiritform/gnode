import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

const EXT_NAME = "gnode.core";
const GNODE_TYPE = "GNODE";
const HIDDEN_POS = [-100000, -100000];
const BODY_W = 460;
const INPUTS_COL_W = 200;
const PREVIEW_COL_W = 200;
const SEPARATOR_W = 8;
const DEFAULT_SIZE = [BODY_W, 320];
const CARD_MIN_HEIGHT = 220;
const SECTION_COLORS = ["#6ee7c7", "#f0a668", "#a08cff", "#7ec4ff", "#ffb86c"];
// use LiteGraph / ComfyUI's built-in node color palette so a wrapped GNODE
// looks native (same colors the "Colors" submenu on any node offers).
// each entry is { color, bgcolor } matching LGraphCanvas.node_colors.
const FALLBACK_NODE_COLORS = {
  red:       { color: "#322",    bgcolor: "#533"    },
  brown:     { color: "#332922", bgcolor: "#593930" },
  green:     { color: "#232",    bgcolor: "#353"    },
  blue:      { color: "#223",    bgcolor: "#335"    },
  pale_blue: { color: "#2a363b", bgcolor: "#3f5159" },
  cyan:      { color: "#233",    bgcolor: "#355"    },
  purple:    { color: "#323",    bgcolor: "#535"    },
  yellow:    { color: "#432",    bgcolor: "#653"    },
};
function pickRandomNodeColor() {
  const palette = (typeof LGraphCanvas !== "undefined" && LGraphCanvas.node_colors)
    || FALLBACK_NODE_COLORS;
  const keys = Object.keys(palette).filter(k => k !== "black");
  const entry = palette[keys[Math.floor(Math.random() * keys.length)]];
  return { color: entry.color, bgcolor: entry.bgcolor };
}

/* ---------- styles ---------- */

const CSS = `
/* thin, dark scrollbars anywhere inside the card (and the DOM-widget scroller
   comfy puts our card into). */
.gnode-card,
.gnode-card * {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
}
.gnode-card ::-webkit-scrollbar,
.gnode-card::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.gnode-card ::-webkit-scrollbar-track,
.gnode-card::-webkit-scrollbar-track {
  background: transparent;
}
.gnode-card ::-webkit-scrollbar-thumb,
.gnode-card::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.16);
  border-radius: 5px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.gnode-card ::-webkit-scrollbar-thumb:hover,
.gnode-card::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.28);
  background-clip: padding-box;
}

.gnode-card {
  --card: #14141a;
  --card-2: #191921;
  --line: rgba(255,255,255,0.06);
  --line-strong: rgba(255,255,255,0.10);
  --text: #e8e8ee;
  --muted: #7a7a86;
  --muted-2: #52525c;
  --accent: #a08cff;
  --danger: #ff6b6b;
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
  font-size: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4);
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.gnode-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: grab;
  user-select: none;
}
.gnode-head:active { cursor: grabbing; }
.gnode-head button,
.gnode-head [contenteditable="true"] { cursor: default; }
.gnode-head [contenteditable="true"] { cursor: text; }
.gnode-brand {
  font-size: 13px;
  letter-spacing: 0.14em;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}
.gnode-name {
  color: var(--muted);
  outline: none;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: text;
  transition: 0.15s;
  min-width: 60px;
  font-size: 12px;
}
.gnode-name:hover { background: rgba(255,255,255,0.04); color: var(--text); }
.gnode-name:focus {
  background: rgba(160,140,255,0.08);
  color: var(--text);
  box-shadow: inset 0 0 0 1px rgba(160,140,255,0.35);
}
.gnode-spacer { flex: 1; }
.gnode-btn {
  padding: 5px 10px;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.10em;
  cursor: pointer;
  transition: 0.15s;
  font-family: inherit;
}
.gnode-btn:hover { color: var(--text); border-color: var(--line-strong); }
.gnode-btn.primary {
  background: var(--text);
  color: #0b0b0f;
  border-color: var(--text);
  font-weight: 700;
}
.gnode-btn.primary:hover { background: #fff; }

.gnode-card-content {
  display: flex;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  /* scroll vertically when the user shrinks the node below content height */
  overflow-y: auto;
  overflow-x: hidden;
}
/* body: fills when no side cols; fixed to --body-w when either side col opens */
.gnode-body {
  flex: 1 1 auto;
  min-width: 0;
  padding: 4px 0;
  overflow-x: hidden;
  /* size to intrinsic content height, don't stretch to card height —
     otherwise scrollHeight reports the flex-stretched size and the
     grow-observer feedback-loops the node taller each frame */
  align-self: flex-start;
}
.gnode-card.with-inputs .gnode-body,
.gnode-card.with-previews .gnode-body {
  /* start at --body-w but allow growing when the user drags the node wider,
     so extra card-content width absorbs into the body (sections widen) */
  flex: 1 1 var(--body-w, 460px);
}

/* previews column: hidden by default; grows to fill extra width when open */
.gnode-previews-col {
  flex: 0 0 0;
  min-width: 0;
  overflow: hidden;
  transition: flex-basis 0.28s cubic-bezier(.4,.2,.2,1);
}
.gnode-card.with-previews .gnode-previews-col {
  flex: 1 1 var(--pw, 200px);
  min-width: 140px;
  border-left: 1px solid var(--line);
  background: rgba(255,255,255,0.008);
}

/* inputs column (left, auto-shown when an input node is wrapped) */
.gnode-inputs-col {
  flex: 0 0 0;
  min-width: 0;
  overflow: hidden;
  transition: flex-basis 0.28s cubic-bezier(.4,.2,.2,1);
}
.gnode-card.with-inputs .gnode-inputs-col {
  flex: 0 0 var(--iw, 200px);
  min-width: 140px;
  max-width: 320px;
  border-right: 1px solid var(--line);
  background: rgba(255,255,255,0.008);
}
.gnode-inputs-inner {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gnode-input-card { display: flex; flex-direction: column; gap: 6px; }
.gnode-input-card-head,
.gnode-col-label {
  font-size: 10px;
  letter-spacing: 0.22em;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  padding: 2px 0 4px;
}
.gnode-col-label { padding: 4px 4px 8px; }
.gnode-input-thumb {
  aspect-ratio: 1;
  background: var(--card-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.gnode-input-thumb:hover { border-color: var(--line-strong); }
.gnode-input-thumb.drop-hover {
  border-color: var(--accent);
  background: rgba(160,140,255,0.06);
}
.gnode-input-thumb img {
  width: 100%; height: 100%; object-fit: contain;
  display: block;
}
.gnode-input-thumb .badge {
  position: absolute;
  top: 6px; left: 6px;
  font-size: 8px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.5);
  border-radius: 3px;
  color: var(--muted);
  z-index: 1;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}
.gnode-input-thumb .empty {
  color: var(--muted-2);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.gnode-input-combo {
  width: 100%;
  padding: 5px 8px;
  background: var(--card-2);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%237a7a86' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.gnode-card.dragging .gnode-previews-col { transition: none; }
.gnode-card.dragging { user-select: none; }

/* draggable separators */
.gnode-resize-handle,
.gnode-inputs-handle {
  width: 6px;
  flex-shrink: 0;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.15s;
  align-self: stretch;
  display: none;
}
.gnode-card.with-previews .gnode-resize-handle { display: block; }
.gnode-card.with-inputs .gnode-inputs-handle { display: block; }
.gnode-resize-handle:hover,
.gnode-inputs-handle:hover,
.gnode-card.dragging .gnode-resize-handle,
.gnode-card.dragging-inputs .gnode-inputs-handle {
  background: linear-gradient(to right,
    transparent 0%,
    rgba(160,140,255,0.15) 30%,
    rgba(160,140,255,0.55) 100%);
}
.gnode-previews-inner {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.gnode-thumb {
  position: relative;
  aspect-ratio: 1;
  background: var(--card-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  display: grid;
  place-items: center;
  color: var(--muted-2);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  /* keep thumb reasonable when the preview col is dragged very wide —
     otherwise aspect-ratio:1 makes it taller than the card and it clips */
  max-width: 260px;
}
.gnode-thumb img {
  width: 100%; height: 100%; object-fit: contain;
  display: block;
}
.gnode-thumb .badge {
  position: absolute;
  top: 6px; left: 6px;
  font-size: 8px;
  letter-spacing: 0.14em;
  color: var(--muted);
  background: rgba(0,0,0,0.5);
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
  z-index: 1;
}
.gnode-section {
  padding: 14px 20px 20px;
  border-bottom: 1px solid var(--line);
  min-width: 0;
}
.gnode-section:last-child { border-bottom: none; }

/* preview row: unlike widget rows, no grid — thumb spans the full section
   width. controls (× + drag) overlay the top-left corner of the thumb;
   the section badge sits top-right. */
.gnode-row.is-preview {
  display: block;
  padding: 0;
  position: relative;
}
.gnode-row.is-preview .k { display: none; }
.gnode-row.is-preview .v { width: 100%; }
.gnode-row .gnode-thumb {
  max-width: none;
}
.gnode-row.is-preview .gnode-thumb .badge { display: none; }
/* preview rows: override widget-row grid placement — put both controls
   inside a small overlay pill in the thumb's top-left corner, hover-reveal */
.gnode-row.is-preview .gnode-row-hide,
.gnode-row.is-preview .gnode-row-drag {
  position: absolute;
  top: 8px;
  z-index: 2;
  width: 14px; height: 14px;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  border-radius: 3px;
  color: var(--text);
  opacity: 0;
  transition: opacity 0.12s;
}
.gnode-row.is-preview .gnode-row-hide { left: 8px; }
.gnode-row.is-preview .gnode-row-drag { left: 26px; }
.gnode-row.is-preview:hover .gnode-row-hide,
.gnode-row.is-preview:hover .gnode-row-drag { opacity: 0.9; }
.gnode-row.is-preview .gnode-row-hide:hover,
.gnode-row.is-preview .gnode-row-drag:hover { opacity: 1; }
.gnode-row.is-preview .gnode-row-hide svg { width: 7px; height: 7px; }
.gnode-row.is-preview .gnode-row-drag svg { width: 7px; height: 10px; }
/* prevent native image drag inside preview thumbs — otherwise it competes
   with the row's draggable=true and swallows clicks on the hide button */
.gnode-row .gnode-thumb img {
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

/* horizontal layout: sections sit side-by-side */
.gnode-card.horizontal .gnode-body {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  /* in horizontal, let body stretch to full card height so section border-rights
     reach the bottom. measureNatural computes section-intrinsic height instead
     of body.scrollHeight (which would report the stretched height and loop). */
  align-self: stretch;
}
.gnode-card.horizontal .gnode-section {
  flex: 1 1 0;
  min-width: 0;
  border-bottom: none;
  border-right: 1px solid var(--line);
}
.gnode-card.horizontal .gnode-section:last-child { border-right: none; }
.gnode-section-head {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 10px;
  position: relative;
  /* fixed height so sections with/without a hidden-chip line up */
  min-height: 22px;
}
.gnode-section-actions { margin-left: auto; }
.gnode-section-hidden-btn {
  font-size: 8px;
  letter-spacing: 0.16em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--muted);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--line);
  padding: 3px 8px;
  border-radius: 3px;
  white-space: nowrap;
  cursor: pointer;
  transition: 0.12s;
  font-family: inherit;
}
.gnode-section-hidden-btn:hover {
  color: var(--text);
  border-color: var(--line-strong);
  background: rgba(255,255,255,0.06);
}
.gnode-section-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  max-width: 320px;
  max-height: 260px;
  overflow-y: auto;
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.5);
  padding: 6px;
  z-index: 20;
  display: none;
}
.gnode-section-popover.open { display: block; }
.gnode-section-popover .item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  gap: 8px;
}
.gnode-section-popover .item:hover { background: rgba(255,255,255,0.04); }
.gnode-section-popover .item .plus {
  width: 14px; height: 14px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--muted-2);
  font-size: 13px;
  line-height: 1;
  transition: color 0.12s;
}
.gnode-section-popover .item:hover .plus { color: var(--accent); }
.gnode-section-popover .item .name {
  font-size: 11px;
  color: var(--text);
}
.gnode-section-popover .item .src {
  font-size: 9px;
  color: var(--muted-2);
  margin-left: 4px;
}
.gnode-section-label {
  font-size: 10px;
  letter-spacing: 0.22em;
  font-weight: 700;
  color: var(--muted);
}
.gnode-section-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--muted-2);
  margin-right: 10px;
  display: inline-block;
  vertical-align: middle;
  transition: box-shadow 0.15s;
}
.gnode-section-dot.executing {
  animation: gnode-dot-pulse 0.9s ease-in-out infinite;
}
@keyframes gnode-dot-pulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.55);
    filter: brightness(1.6);
  }
}

/* stacked cell layout: label on top, value full-width below. controls sit
   OUTSIDE the row's content column, floating in the section's left gutter
   (via negative absolute) so the value box aligns with preview rows. */
.gnode-row {
  display: block;
  padding: 2px 0;
  margin-bottom: 10px;
  position: relative;
}
.gnode-row .k { display: block; }
.gnode-row .v { display: block; position: relative; margin-top: 4px; }
.gnode-row .gnode-row-hide,
.gnode-row .gnode-row-drag {
  position: absolute;
  left: -16px;
  opacity: 0;
  transition: opacity 0.12s;
}
.gnode-row .gnode-row-hide { top: 0; }
.gnode-row .gnode-row-drag { top: 22px; }
.gnode-row:hover .gnode-row-hide,
.gnode-row:hover .gnode-row-drag { opacity: 0.7; }
.gnode-row .gnode-row-hide:hover,
.gnode-row .gnode-row-drag:hover { opacity: 1; }
.gnode-row-drag {
  width: 12px;
  height: 18px;
  cursor: grab;
  opacity: 0.28;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
  display: grid;
  place-items: center;
  color: var(--muted);
  border-radius: 3px;
  user-select: none;
}
.gnode-row-drag svg { width: 8px; height: 18px; pointer-events: none; }
.gnode-row:hover .gnode-row-drag { opacity: 0.75; }
.gnode-row-drag:hover { color: var(--text); background: rgba(255,255,255,0.05); }
/* dragged row stays in place (dimmed) so neighbors never shift. an overlay
   indicator on the target row shows where the drop will land. */
.gnode-row.dragging {
  opacity: 0.28;
  background: rgba(160,140,255,0.06);
  border-radius: 5px;
  pointer-events: none;
}
.gnode-row.drop-before { box-shadow: inset 0 3px 0 0 var(--accent); }
.gnode-row.drop-after  { box-shadow: inset 0 -3px 0 0 var(--accent); }
.gnode-row .k {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  word-break: break-word;
}

.gnode-input, .gnode-select, .gnode-textarea {
  width: 100%;
  padding: 5px 8px;
  background: var(--card-2);
  border: 1px solid var(--line);
  border-radius: 5px;
  color: var(--text);
  font: inherit;
  font-size: 11px;
  outline: none;
  transition: 0.15s;
  box-sizing: border-box;
  font-family: inherit;
}
.gnode-textarea {
  resize: vertical;
  min-height: 40px;
  line-height: 1.45;
}
.gnode-input:hover, .gnode-select:hover, .gnode-textarea:hover { border-color: var(--line-strong); }
.gnode-input:focus, .gnode-select:focus, .gnode-textarea:focus {
  border-color: rgba(160,140,255,0.35);
  background: #1d1d25;
}
.gnode-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%237a7a86' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' d='M1 1l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 22px;
  cursor: pointer;
}

/* draggable value box replaces the classic slider: click + drag horizontally
   to scrub, dbl-click to type an exact value. background fill visualizes
   the position in [min, max]. shift = fine, ctrl = coarse. */
.gnode-slider-box {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  background: var(--card-2);
  border: 1px solid var(--line);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  text-align: center;
  cursor: ew-resize;
  user-select: none;
  overflow: hidden;
  outline: none;
  transition: border-color 0.12s, background 0.12s;
}
.gnode-slider-box::before {
  content: "";
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: var(--pct, 0%);
  background: var(--accent-color, var(--accent));
  opacity: 0.22;
  pointer-events: none;
  transition: width 0.05s linear;
}
.gnode-slider-box > .val {
  position: relative;
  z-index: 1;
}
.gnode-slider-box:hover,
.gnode-slider-box.dragging { border-color: var(--line-strong); }
.gnode-slider-box.dragging { background: rgba(255,255,255,0.02); }
/* when replaced with an input for typing */
input.gnode-slider-box {
  cursor: text;
  text-align: center;
}

.gnode-check {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px;
  color: var(--muted);
  cursor: pointer;
  user-select: none;
}

.gnode-empty {
  padding: 30px 20px;
  text-align: center;
  color: var(--muted-2);
  font-size: 11px;
  font-style: italic;
}

/* row hide button (left side, hover-visible, in the controls flex) */
.gnode-row-hide {
  width: 14px; height: 14px;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: var(--muted-2);
  cursor: pointer;
  padding: 0;
  opacity: 0;
  transition: 0.12s;
  flex: 0 0 auto;
}
.gnode-row-hide svg { width: 8px; height: 8px; }
.gnode-row:hover .gnode-row-hide { opacity: 0.55; }
.gnode-row-hide:hover {
  opacity: 1 !important;
  color: var(--danger);
  background: rgba(255,107,107,0.10);
}

/* gear popover (hidden widgets) */
.gnode-popover-anchor { position: relative; display: inline-flex; }
.gnode-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  max-width: 280px;
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4);
  padding: 6px;
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px) scale(0.98);
  transform-origin: top right;
  transition: opacity 0.15s, transform 0.15s;
}
.gnode-popover.open {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}
.gnode-popover-head {
  padding: 4px 6px 6px;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
  margin-bottom: 4px;
}
.gnode-popover-body {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gnode-popover-empty {
  padding: 12px 8px;
  text-align: center;
  color: var(--muted-2);
  font-size: 11px;
  font-style: italic;
}
.gnode-hidden-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.12s;
}
.gnode-hidden-item:hover { background: rgba(160,140,255,0.08); }
.gnode-hidden-item .label { font-size: 11px; color: var(--text); }
.gnode-hidden-item .src {
  font-size: 9px;
  letter-spacing: 0.10em;
  color: var(--muted);
  margin-left: 6px;
}
.gnode-hidden-item .restore {
  color: var(--accent);
  font-size: 9px;
  letter-spacing: 0.10em;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(160,140,255,0.10);
}

.gnode-icon-btn {
  width: 26px; height: 26px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  padding: 0;
  transition: 0.15s;
  font-family: inherit;
}
.gnode-icon-btn:hover { color: var(--text); border-color: var(--line-strong); }
.gnode-icon-btn.on {
  color: var(--accent);
  border-color: rgba(160,140,255,0.35);
  background: rgba(160,140,255,0.10);
}
.gnode-icon-btn svg { width: 13px; height: 13px; }
`;

function injectStyles() {
  if (document.getElementById("gnode-styles")) return;
  const s = document.createElement("style");
  s.id = "gnode-styles";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ---------- helpers ---------- */

function getSelectedNodes() {
  return Object.values(app.canvas.selected_nodes || {});
}

function boundingBoxOf(nodes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.pos[0]);
    minY = Math.min(minY, n.pos[1]);
    maxX = Math.max(maxX, n.pos[0] + (n.size?.[0] || 200));
    maxY = Math.max(maxY, n.pos[1] + (n.size?.[1] || 100));
  }
  return { minX, minY, maxX, maxY };
}

function hideNodes(nodes, savedPositions) {
  for (const n of nodes) {
    savedPositions[n.id] = [n.pos[0], n.pos[1]];
    n.pos = [...HIDDEN_POS];
  }
}

function restoreNodePositions(savedPositions) {
  for (const [id, pos] of Object.entries(savedPositions || {})) {
    const n = app.graph.getNodeById(parseInt(id, 10));
    if (n) n.pos = [...pos];
  }
}

/* ---------- group inference & handling ---------- */

function nodeInGroupBBox(node, group) {
  const [nx, ny] = node.pos;
  const nw = node.size?.[0] || 200;
  const nh = node.size?.[1] || 100;
  const [gx, gy] = group.pos || [0, 0];
  const gw = group.size?.[0] || 400;
  const gh = group.size?.[1] || 300;
  const cx = nx + nw / 2;
  const cy = ny + nh / 2;
  return cx >= gx && cx <= gx + gw && cy >= gy && cy <= gy + gh;
}

// resolve the right groups array (naming differs across LiteGraph versions in Comfy)
function getGroupsArray() {
  const g = app.graph;
  if (Array.isArray(g._groups)) return g._groups;
  if (Array.isArray(g.groups)) return g.groups;
  return [];
}

// grab groups whose bbox contains any wrapped node, remove them from the graph
function grabAndRemoveGroups(wrappedNodes) {
  const groups = getGroupsArray();
  const snapshot = groups.slice();
  const grabbed = [];
  for (const g of snapshot) {
    const insideIds = wrappedNodes.filter(n => nodeInGroupBBox(n, g)).map(n => n.id);
    if (insideIds.length === 0) continue;
    grabbed.push({
      title: g.title || "",
      color: g.color || null,
      pos: g.pos ? [...g.pos] : [0, 0],
      size: g.size ? [...g.size] : [400, 200],
      font_size: g.font_size || null,
      node_ids: insideIds,
    });
    const idx = groups.indexOf(g);
    if (idx >= 0) groups.splice(idx, 1);
  }
  return grabbed;
}

function restoreGroups(savedGroups) {
  if (!Array.isArray(savedGroups)) return;
  const groups = getGroupsArray();
  for (const sg of savedGroups) {
    // dedupe: if a group with the same title + position already exists, skip
    const dup = groups.find(g =>
      (g.title || "") === (sg.title || "") &&
      Math.abs((g.pos?.[0] || 0) - (sg.pos?.[0] || 0)) < 1 &&
      Math.abs((g.pos?.[1] || 0) - (sg.pos?.[1] || 0)) < 1
    );
    if (dup) continue;
    try {
      const g = new LiteGraph.LGraphGroup();
      if (sg.title) g.title = sg.title;
      if (sg.color) g.color = sg.color;
      if (sg.pos) g.pos = [...sg.pos];
      if (sg.size) g.size = [...sg.size];
      if (sg.font_size) g.font_size = sg.font_size;
      groups.push(g);
    } catch (err) {
      console.warn("[GNODE] group restore failed:", err);
    }
  }
}

// build sections from grabbed groups + a Misc section for ungrouped wrapped nodes
function inferSections(wrappedNodes, grabbedGroups) {
  const sections = [];
  const assigned = new Set();
  let colorIdx = 0;

  for (const g of grabbedGroups) {
    const nodes = g.node_ids
      .map(id => wrappedNodes.find(n => n.id === id))
      .filter(Boolean);
    if (nodes.length === 0) continue;
    sections.push({
      title: g.title || `Section ${sections.length + 1}`,
      color: g.color || SECTION_COLORS[colorIdx++ % SECTION_COLORS.length],
      node_ids: nodes.map(n => n.id),
    });
    nodes.forEach(n => assigned.add(n.id));
  }

  const ungrouped = wrappedNodes.filter(n => !assigned.has(n.id));
  // only spawn the fallback section if the ungrouped nodes actually have
  // renderable widgets — no point showing an empty "no exposed widgets" bucket
  const hasVisibleWidget = n =>
    Array.isArray(n.widgets) &&
    n.widgets.some(w => w && w.type !== "converted-widget");
  if (ungrouped.length > 0 && ungrouped.some(hasVisibleWidget)) {
    sections.push({
      title: sections.length === 0 ? "Widgets" : "Misc",
      color: SECTION_COLORS[colorIdx % SECTION_COLORS.length],
      node_ids: ungrouped.map(n => n.id),
    });
  }
  return sections;
}

/* ---------- widget row rendering ---------- */

function renderWidgetRow(node, widget) {
  const row = document.createElement("div");
  row.className = "gnode-row";
  const label = widget.label || widget.name || "widget";
  row.innerHTML = `<div class="k">${escapeHtml(label)}</div><div class="v"></div>`;
  const v = row.querySelector(".v");

  const type = (widget.type || "").toLowerCase();
  const commit = val => {
    widget.value = val;
    if (typeof widget.callback === "function") {
      try { widget.callback(val, app.canvas, node); } catch {}
    }
    node.setDirtyCanvas?.(true, true);
  };

  if (type === "combo") {
    const values = widget.options?.values || [];
    const sel = document.createElement("select");
    sel.className = "gnode-select";
    for (const opt of values) {
      const o = document.createElement("option");
      o.value = String(opt);
      o.textContent = String(opt);
      if (opt === widget.value) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener("change", () => commit(sel.value));
    v.appendChild(sel);
  } else if (type === "number" || type === "slider") {
    const min = widget.options?.min ?? 0;
    let max = widget.options?.max ?? 100;
    let step = widget.options?.step ?? 1;
    // some widgets ship absurd max caps (KSampler steps=10000, cfg=100).
    // pin common ones to sensible ceilings so the drag range feels real.
    // user can still type a higher value via dbl-click if they really want.
    const MAX_OVERRIDES = { steps: 50, cfg: 20 };
    if (MAX_OVERRIDES[widget.name] !== undefined) {
      max = Math.min(max, MAX_OVERRIDES[widget.name]);
    }
    // some widgets have oversized step (e.g. steps=10 -> jumps by 10s). pin
    // to a sensible tick so the scrub feels granular.
    const STEP_OVERRIDES = { steps: 1, cfg: 0.1, denoise: 0.01 };
    if (STEP_OVERRIDES[widget.name] !== undefined) {
      step = STEP_OVERRIDES[widget.name];
    }
    const bounded = isFinite(min) && isFinite(max) && (max - min) < 1e9;
    if (bounded) {
      const box = document.createElement("div");
      box.className = "gnode-slider-box";
      box.tabIndex = 0;
      const label = document.createElement("span");
      label.className = "val";
      box.appendChild(label);
      let current = Number(widget.value);
      const decimals = step < 1 ? Math.min(4, String(step).split(".")[1]?.length || 2) : 0;
      const format = n => decimals > 0 ? Number(n).toFixed(decimals) : String(Math.round(n));
      const clamp = n => Math.max(min, Math.min(max, n));
      const snap = n => (step > 0 ? Math.round(n / step) * step : n);
      const paint = () => {
        const pct = ((current - min) / (max - min)) * 100;
        box.style.setProperty("--pct", pct + "%");
        label.textContent = format(current);
      };
      paint();
      // drag-to-scrub with pointer capture
      let dragging = false, startX = 0, startVal = 0, moved = false;
      box.addEventListener("pointerdown", e => {
        if (e.button !== 0) return;
        e.stopPropagation();
        dragging = true; moved = false;
        startX = e.clientX; startVal = current;
        try { box.setPointerCapture(e.pointerId); } catch {}
        box.classList.add("dragging");
      });
      box.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 2) moved = true;
        // soft scrub: full range covers ~400 pixels regardless of scale so
        // small widgets (denoise 0..1) and big ones (steps 0..50) all feel
        // predictable. snap resolves to the widget's step. shift = 0.1x fine,
        // ctrl = 10x coarse.
        const speed = e.shiftKey ? 0.1 : (e.ctrlKey ? 10 : 1);
        const perPixel = (max - min) / 400;
        const delta = dx * perPixel * speed;
        const next = snap(clamp(startVal + delta));
        if (next !== current) { current = next; paint(); commit(current); }
      });
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        try { box.releasePointerCapture(e.pointerId); } catch {}
        box.classList.remove("dragging");
      };
      box.addEventListener("pointerup", endDrag);
      box.addEventListener("pointercancel", endDrag);
      // dbl-click swaps in a text input for exact entry
      box.addEventListener("dblclick", e => {
        if (moved) return;
        e.stopPropagation();
        const input = document.createElement("input");
        input.type = "text";
        input.className = "gnode-slider-box";
        input.value = format(current);
        box.replaceWith(input);
        input.focus(); input.select();
        const done = keep => {
          if (keep) {
            const n = parseFloat(input.value);
            if (!isNaN(n)) { current = snap(clamp(n)); commit(current); }
          }
          input.replaceWith(box);
          paint();
        };
        input.addEventListener("blur", () => done(true));
        input.addEventListener("keydown", ev => {
          if (ev.key === "Enter") { ev.preventDefault(); done(true); }
          else if (ev.key === "Escape") { ev.preventDefault(); done(false); }
        });
      });
      v.appendChild(box);
    } else {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "gnode-input";
      inp.value = widget.value ?? "";
      inp.addEventListener("change", () => commit(parseFloat(inp.value)));
      v.appendChild(inp);
    }
  } else if (type === "toggle" || type === "boolean") {
    const label = document.createElement("label");
    label.className = "gnode-check";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!widget.value;
    cb.addEventListener("change", () => commit(cb.checked));
    label.appendChild(cb);
    v.appendChild(label);
  } else if (type === "text" || type === "string" || type === "customtext" || type === "textarea") {
    const ta = document.createElement("textarea");
    ta.className = "gnode-textarea";
    ta.value = widget.value ?? "";
    ta.rows = 1;
    const autoResize = () => {
      ta.style.height = "auto";
      ta.style.height = (ta.scrollHeight + 2) + "px";
    };
    ta.addEventListener("input", () => { commit(ta.value); autoResize(); });
    v.appendChild(ta);
    // measure after the element is in the DOM
    requestAnimationFrame(() => requestAnimationFrame(autoResize));
  } else {
    // fallback: read-only text
    const span = document.createElement("input");
    span.className = "gnode-input";
    span.value = widget.value == null ? "" : String(widget.value);
    span.addEventListener("change", () => commit(span.value));
    v.appendChild(span);
  }
  return row;
}

/* ---------- card DOM ---------- */

function isWidgetHidden(node, widget, hiddenList) {
  return hiddenList.some(h => h.node_id == node.id && h.widget_name === widget.name);
}

function buildCard(node) {
  const el = document.createElement("div");
  el.className = "gnode-card";

  const gnodeName = node.properties.gnode_name || "Untitled";

  el.innerHTML = `
    <div class="gnode-head">
      <span class="gnode-brand">GNODE</span>
      <span class="gnode-name" contenteditable="true" spellcheck="false">${escapeHtml(gnodeName)}</span>
      <span class="gnode-spacer"></span>
      <button class="gnode-icon-btn" data-act="layout" title="Switch layout (vertical / horizontal)">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
          <rect x="2" y="3" width="5" height="10" rx="1"/>
          <rect x="9" y="3" width="5" height="10" rx="1"/>
        </svg>
      </button>
      <button class="gnode-icon-btn" data-act="preview" title="Show previews">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1.5 8 C 3 4, 5.5 2.5, 8 2.5 C 10.5 2.5, 13 4, 14.5 8 C 13 12, 10.5 13.5, 8 13.5 C 5.5 13.5, 3 12, 1.5 8 Z"/>
          <circle cx="8" cy="8" r="2.2"/>
        </svg>
      </button>
      <button class="gnode-btn" data-act="expand">EXPAND</button>
      <button class="gnode-btn primary" data-act="run">▶ RUN</button>
    </div>
    <div class="gnode-card-content">
      <div class="gnode-inputs-col">
        <div class="gnode-inputs-inner"></div>
      </div>
      <div class="gnode-inputs-handle" title="Drag to resize inputs"></div>
      <div class="gnode-body"></div>
      <div class="gnode-resize-handle" title="Drag to resize previews"></div>
      <div class="gnode-previews-col">
        <div class="gnode-previews-inner"></div>
      </div>
    </div>
  `;

  const body = el.querySelector(".gnode-body");
  // click anywhere outside a section popover closes it
  el.addEventListener("click", e => {
    if (e.target.closest(".gnode-section-hidden-btn")) return;
    if (e.target.closest(".gnode-section-popover")) return;
    body.querySelectorAll(".gnode-section-popover.open")
      .forEach(p => p.classList.remove("open"));
  });

  function ensureHiddenArray() {
    if (!Array.isArray(node.properties.hidden_widgets)) {
      node.properties.hidden_widgets = [];
    }
    return node.properties.hidden_widgets;
  }

  function hideWidget(nodeId, widgetName) {
    const arr = ensureHiddenArray();
    if (!arr.some(h => h.node_id == nodeId && h.widget_name === widgetName)) {
      arr.push({ node_id: nodeId, widget_name: widgetName });
    }
    renderBody();
    renderPopover();
    node._gnodeSnapToFit?.();
  }

  function restoreWidget(nodeId, widgetName) {
    const arr = ensureHiddenArray();
    const idx = arr.findIndex(h => h.node_id == nodeId && h.widget_name === widgetName);
    if (idx >= 0) arr.splice(idx, 1);
    renderBody();
    renderPopover();
    node._gnodeSnapToFit?.();
  }

  function isPreviewNode(w) {
    if (!w || INPUT_TYPES.has(w.type)) return false;
    const t = String(w.type || "").toLowerCase();
    return t.includes("preview") || t.includes("saveimage") || "imgs" in w;
  }

  // widgets we don't want as rows: converted-to-socket, comfy-internal ($$…),
  // and button-typed widgets (e.g. LoadImage's "choose file to upload").
  function isRenderableWidget(w) {
    if (!w || !w.name) return false;
    if (w.type === "converted-widget") return false;
    if (w.type === "button") return false;
    if (String(w.name).startsWith("$$")) return false;
    return true;
  }

  function getSectionOrder(section) {
    const order = [];
    if (Array.isArray(section.widget_order) && section.widget_order.length > 0) {
      // strip any previously-saved keys that point at now-filtered widgets
      // (older GNODEs may have $$canvas-image-preview etc. baked into the order)
      for (const key of section.widget_order) {
        const sep = key.indexOf("\u001f");
        if (sep < 0) continue;
        const wName = key.slice(sep + 1);
        if (wName.startsWith("$$")) continue;
        order.push(key);
      }
      // migrate: re-append any renderable widget/preview keys that exist on
      // wrapped nodes but aren't in the saved order (e.g. hidden rows get
      // dropped by commitDomOrder during a drag and would otherwise be orphaned).
      for (const nodeId of section.node_ids || []) {
        const wrapped = app.graph.getNodeById(nodeId);
        if (!wrapped) continue;
        if (Array.isArray(wrapped.widgets)) {
          for (const w of wrapped.widgets) {
            if (!isRenderableWidget(w)) continue;
            const key = `${nodeId}\u001f${w.name}`;
            if (!order.includes(key)) order.push(key);
          }
        }
        if (isPreviewNode(wrapped)) {
          const pKey = `${nodeId}\u001f__preview__`;
          if (!order.includes(pKey)) order.unshift(pKey);
        }
      }
      return order;
    }
    // fresh order: previews first (top of section), then widget rows
    for (const nodeId of section.node_ids || []) {
      const wrapped = app.graph.getNodeById(nodeId);
      if (isPreviewNode(wrapped)) {
        order.push(`${nodeId}\u001f__preview__`);
      }
    }
    for (const nodeId of section.node_ids || []) {
      const wrapped = app.graph.getNodeById(nodeId);
      if (!wrapped || !Array.isArray(wrapped.widgets)) continue;
      for (const w of wrapped.widgets) {
        if (!isRenderableWidget(w)) continue;
        order.push(`${nodeId}\u001f${w.name}`);
      }
    }
    return order;
  }

  let draggedRow = null;
  let dropTarget = null;   // the row the cursor is over
  let dropPos = null;      // "before" | "after"
  function setDropTarget(row, pos) {
    if (dropTarget === row && dropPos === pos) return;
    if (dropTarget) dropTarget.classList.remove("drop-before", "drop-after");
    dropTarget = row;
    dropPos = pos;
    if (row) row.classList.add(pos === "before" ? "drop-before" : "drop-after");
  }
  function clearDropTarget() { setDropTarget(null, null); }

  function commitDomOrder() {
    const sections = node.properties.sections || [];
    const sectionEls = body.querySelectorAll(".gnode-section");
    sectionEls.forEach((secEl, sIdx) => {
      const sec = sections[sIdx];
      if (!sec) return;
      const order = [];
      secEl.querySelectorAll(".gnode-row").forEach(r => {
        if (r.dataset.rowKey) order.push(r.dataset.rowKey);
      });
      sec.widget_order = order;
    });
  }

  function reorderWidget(srcKey, tgtKey, tgtSectionIdx, insertAfter) {
    const sections = node.properties.sections || [];
    if (sections.length === 0) return;
    // snapshot every section's widget_order so we have a stable baseline to mutate across boundaries
    for (const sec of sections) {
      if (!Array.isArray(sec.widget_order) || sec.widget_order.length === 0) {
        sec.widget_order = getSectionOrder(sec);
      }
    }
    // remove src from wherever it currently lives
    for (const sec of sections) {
      const i = sec.widget_order.indexOf(srcKey);
      if (i >= 0) sec.widget_order.splice(i, 1);
    }
    // insert into target section
    const tgt = sections[tgtSectionIdx];
    if (!tgt) return;
    let ti = tgt.widget_order.indexOf(tgtKey);
    if (ti < 0) {
      tgt.widget_order.push(srcKey);
    } else {
      if (insertAfter) ti++;
      tgt.widget_order.splice(ti, 0, srcKey);
    }
    renderBody();
  }

  function renderBody() {
    body.innerHTML = "";
    const sections = node.properties.sections || [];
    const hidden = ensureHiddenArray();

    if (sections.length === 0) {
      body.innerHTML = `<div class="gnode-empty">No wrapped nodes</div>`;
      return;
    }

    sections.forEach((s, sIdx) => {
      const sec = document.createElement("div");
      sec.className = "gnode-section";
      sec.style.setProperty("--accent-color", s.color);
      // hidden widgets in this section only
      const sectionHidden = hidden.filter(h =>
        (s.node_ids || []).some(id => id == h.node_id)
      );
      const hiddenBtn = sectionHidden.length > 0
        ? `<div class="gnode-section-actions">
             <button class="gnode-section-hidden-btn" type="button">+ ${sectionHidden.length} hidden</button>
             <div class="gnode-section-popover" data-role="section-popover"></div>
           </div>`
        : "";
      sec.innerHTML = `
        <div class="gnode-section-head">
          <span class="gnode-section-label" style="color:${s.color}">
            <span class="gnode-section-dot" style="background:${s.color}; box-shadow:0 0 8px ${s.color}"></span>
            ${escapeHtml(s.title.toUpperCase())}
          </span>
          ${hiddenBtn}
        </div>
      `;

      // wire the per-section hidden-widgets popover
      if (sectionHidden.length > 0) {
        const btn = sec.querySelector(".gnode-section-hidden-btn");
        const pop = sec.querySelector('[data-role="section-popover"]');
        for (const h of sectionHidden) {
          const wrapped = app.graph.getNodeById(Number(h.node_id));
          const nodeLabel = wrapped?.title || wrapped?.type || "";
          const isPreview = h.widget_name === "__preview__";
          const displayName = isPreview ? "preview" : h.widget_name;
          const item = document.createElement("div");
          item.className = "item";
          item.innerHTML = `
            <span class="plus">+</span>
            <div>
              <span class="name">${escapeHtml(displayName)}</span>
              <span class="src">${escapeHtml(nodeLabel)}</span>
            </div>
          `;
          item.addEventListener("click", () => {
            restoreWidget(h.node_id, h.widget_name);
          });
          pop.appendChild(item);
        }
        btn.addEventListener("click", e => {
          e.stopPropagation();
          // close others
          body.querySelectorAll(".gnode-section-popover.open")
            .forEach(p => { if (p !== pop) p.classList.remove("open"); });
          pop.classList.toggle("open");
        });
      }


      // dropping onto empty section area (below the last row) targets the
      // last visible row with "after" so the drop lands at the end of the section
      sec.addEventListener("dragover", e => {
        if (!draggedRow) return;
        if (e.target.closest(".gnode-row")) return; // row handler takes over
        e.preventDefault();
        const visibleRows = [...sec.querySelectorAll(".gnode-row")]
          .filter(r => r !== draggedRow);
        if (visibleRows.length > 0) {
          setDropTarget(visibleRows[visibleRows.length - 1], "after");
        } else {
          clearDropTarget();
        }
      });
      sec.addEventListener("drop", e => { e.preventDefault(); });

      let anyRows = false;
      const order = getSectionOrder(s);
      for (const key of order) {
        const sep = key.indexOf("\u001f");
        if (sep < 0) continue;
        const nodeId = parseInt(key.slice(0, sep), 10);
        const widgetName = key.slice(sep + 1);
        const wrapped = app.graph.getNodeById(nodeId);
        if (!wrapped) continue;

        let row, hideName;
        if (widgetName === "__preview__") {
          if (!isPreviewNode(wrapped)) continue;
          if (hidden.some(h => h.node_id == nodeId && h.widget_name === "__preview__")) continue;
          row = document.createElement("div");
          row.className = "gnode-row is-preview";
          const badge = shortSectionLabel(s.title) || "preview";
          row.innerHTML = `
            <div class="k">${escapeHtml(badge.toLowerCase())}</div>
            <div class="v">
              <div class="gnode-thumb" data-preview-node-id="${wrapped.id}">
                <span>preview</span>
              </div>
            </div>
          `;
          hideName = "__preview__";
        } else {
          if (!wrapped.widgets) continue;
          const w = wrapped.widgets.find(x => x.name === widgetName);
          if (!isRenderableWidget(w)) continue;
          if (isWidgetHidden(wrapped, w, hidden)) continue;
          if (skippedInBody.has(`${wrapped.id}\u001f${w.name}`)) continue;
          row = renderWidgetRow(wrapped, w);
          hideName = w.name;
        }

        row.style.setProperty("--accent-color", s.color);
        const sliderTrack = row.querySelector(".gnode-slider-box");
        if (sliderTrack) sliderTrack.style.setProperty("--accent-color", s.color);
        row.dataset.rowKey = key;
        row.dataset.sectionIdx = String(sIdx);

        // controls placed directly in the row grid (no wrapper) — hide aligns
        // with the label (row 1), drag with the value box (row 2)
        const hideBtn = document.createElement("button");
        hideBtn.className = "gnode-row-hide";
        hideBtn.innerHTML = `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 5 L8 5"/></svg>`;
        // stop mousedown from reaching the row so the row's draggable=true (set
        // by the drag-handle) doesn't swallow the click on tall preview rows
        hideBtn.addEventListener("mousedown", e => e.stopPropagation());
        hideBtn.addEventListener("click", e => {
          e.stopPropagation();
          hideWidget(nodeId, hideName);
        });

        const dragHandle = document.createElement("div");
        dragHandle.className = "gnode-row-drag";
        dragHandle.innerHTML = `<svg viewBox="0 0 8 18" fill="currentColor">
          <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
          <circle cx="2" cy="7" r="1"/><circle cx="6" cy="7" r="1"/>
          <circle cx="2" cy="12" r="1"/><circle cx="6" cy="12" r="1"/>
          <circle cx="2" cy="17" r="1"/><circle cx="6" cy="17" r="1"/>
        </svg>`;

        row.appendChild(hideBtn);
        row.appendChild(dragHandle);

        // drag-to-reorder: nothing shifts during the drag. the dragged row
        // dims in place; an inset accent line on the row under the cursor
        // shows where the drop will land. actual reorder happens on drop.
        dragHandle.addEventListener("mousedown", () => { row.draggable = true; });
        row.addEventListener("dragstart", e => {
          draggedRow = row;
          e.dataTransfer.setData("text/plain", row.dataset.rowKey);
          e.dataTransfer.effectAllowed = "move";
          requestAnimationFrame(() => row.classList.add("dragging"));
        });
        row.addEventListener("dragend", () => {
          row.classList.remove("dragging");
          row.draggable = false;
          // perform the actual move based on the tracked drop target
          if (dropTarget && dropTarget !== row) {
            const parent = dropTarget.parentNode;
            if (dropPos === "before") parent.insertBefore(row, dropTarget);
            else parent.insertBefore(row, dropTarget.nextSibling);
          }
          clearDropTarget();
          draggedRow = null;
          commitDomOrder();
        });
        row.addEventListener("dragover", e => {
          if (!draggedRow || draggedRow === row) { e.preventDefault(); return; }
          e.preventDefault();
          const rect = row.getBoundingClientRect();
          const above = (e.clientY - rect.top) < rect.height / 2;
          setDropTarget(row, above ? "before" : "after");
        });
        row.addEventListener("drop", e => { e.preventDefault(); });

        sec.appendChild(row);
        anyRows = true;
      }

      if (!anyRows) {
        const em = document.createElement("div");
        em.className = "gnode-empty";
        em.style.padding = "8px 0";
        em.textContent = "no exposed widgets";
        sec.appendChild(em);
      }
      body.appendChild(sec);
    });
  }

  // per-section hidden-widgets popovers are built inside renderBody now;
  // this is a no-op kept so existing callers (hide/restore/rebuild) still work.
  function renderPopover() {}

  // inputs column: auto-shown when wrapped set contains input nodes (LoadImage, etc.)
  const INPUT_TYPES = new Set([
    "LoadImage", "LoadImageMask", "LoadVideo",
    "VHS_LoadVideo", "VHS_LoadImages", "LoadAudio",
  ]);
  const inputsInner = el.querySelector(".gnode-inputs-inner");
  const skippedInBody = new Set();

  function collectInputNodes() {
    const out = [];
    for (const id of node.properties.wrapped_ids || []) {
      const w = app.graph.getNodeById(id);
      if (!w) continue;
      if (INPUT_TYPES.has(w.type)) out.push(w);
    }
    return out;
  }

  function computeRequiredWidth() {
    // body width can be widened for horizontal layout — read the CSS var
    let w = parseInt(el.style.getPropertyValue("--body-w")) || BODY_W;
    if (el.classList.contains("with-inputs")) {
      const iw = parseInt(el.style.getPropertyValue("--iw")) || INPUTS_COL_W;
      w += iw + SEPARATOR_W;
    }
    if (el.classList.contains("with-previews")) {
      const pw = parseInt(el.style.getPropertyValue("--pw")) || PREVIEW_COL_W;
      w += pw + SEPARATOR_W;
    }
    return w;
  }
  function syncNodeWidth(force = false) {
    const w = computeRequiredWidth();
    if (force || node.size[0] < w) {
      node.size[0] = w;
      node.setDirtyCanvas?.(true, true);
    }
  }
  // expose so onResize can snap corner-drag back to the required width and
  // the card stays contained inside the LiteGraph node body.
  node._gnodeRequiredWidth = computeRequiredWidth;

  function renderInputs() {
    if (!inputsInner) return;
    const inputs = collectInputNodes();
    skippedInBody.clear();
    const wasOpen = el.classList.contains("with-inputs");
    if (inputs.length === 0) {
      el.classList.remove("with-inputs");
      inputsInner.innerHTML = "";
      if (wasOpen) syncNodeWidth();
      return;
    }
    el.classList.add("with-inputs");
    if (!wasOpen) syncNodeWidth();
    inputsInner.innerHTML = "";
    for (const w_node of inputs) {
      const card = document.createElement("div");
      card.className = "gnode-input-card";
      const header = (w_node.title || w_node.type || "input")
        .replace(/([a-z])([A-Z])/g, "$1 $2")   // "LoadImage" -> "Load Image"
        .toUpperCase();
      // file combo (usually named "image"/"video"/"file")
      const fileWidget = w_node.widgets?.find(x =>
        x && x.type === "combo" &&
        (x.name === "image" || x.name === "file" || x.name === "video" || x.name === "audio")
      );
      // prefer node.imgs (post-exec preview), else synthesize a /view URL from the
      // widget value so the thumb updates the moment a file is picked/uploaded
      const latestImg = Array.isArray(w_node.imgs) && w_node.imgs.length > 0
        ? w_node.imgs[w_node.imgs.length - 1]
        : null;
      let imgSrc = latestImg?.src || "";
      if (!imgSrc && fileWidget?.name === "image" && fileWidget.value) {
        const raw = String(fileWidget.value);
        const slash = raw.lastIndexOf("/");
        const sub = slash >= 0 ? raw.slice(0, slash) : "";
        const name = slash >= 0 ? raw.slice(slash + 1) : raw;
        imgSrc = api.apiURL(
          `/view?filename=${encodeURIComponent(name)}&type=input&subfolder=${encodeURIComponent(sub)}`
        );
      }
      card.innerHTML = `
        <div class="gnode-input-card-head">${escapeHtml(header)}</div>
        <div class="gnode-input-thumb" title="Double-click or drop an image">
          ${imgSrc ? `<img src="${escapeHtml(imgSrc)}"/>` : `<span class="empty">double-click or drop</span>`}
        </div>
      `;

      // double-click to open file picker, drag-drop to load, on the thumb (image inputs only)
      const thumbEl = card.querySelector(".gnode-input-thumb");
      const canUpload = fileWidget && fileWidget.name === "image";
      if (canUpload) {
        const doUpload = async (file) => {
          if (!file || !file.type?.startsWith("image/")) return;
          try {
            const fd = new FormData();
            fd.append("image", file, file.name);
            fd.append("type", "input");
            fd.append("overwrite", "true");
            const res = await api.fetchApi("/upload/image", { method: "POST", body: fd });
            if (!res.ok) throw new Error(`upload ${res.status}`);
            const data = await res.json();
            // ComfyUI returns filename in data.name; include subfolder prefix if present
            const filename = data.subfolder ? `${data.subfolder}/${data.name}` : data.name;
            const values = fileWidget.options?.values || [];
            if (!values.includes(filename)) values.push(filename);
            fileWidget.value = filename;
            fileWidget.callback?.(filename, app.canvas, w_node);
            w_node.setDirtyCanvas?.(true, true);
            setTimeout(renderInputs, 200);
          } catch (err) {
            console.error("[GNODE] image upload failed:", err);
          }
        };
        thumbEl.addEventListener("dblclick", e => {
          e.preventDefault();
          e.stopPropagation();
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.addEventListener("change", () => doUpload(input.files?.[0]));
          input.click();
        });
        thumbEl.addEventListener("dragover", e => {
          if (!e.dataTransfer?.types.includes("Files")) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "copy";
          thumbEl.classList.add("drop-hover");
        });
        thumbEl.addEventListener("dragleave", () => thumbEl.classList.remove("drop-hover"));
        thumbEl.addEventListener("drop", e => {
          e.preventDefault();
          e.stopPropagation();
          thumbEl.classList.remove("drop-hover");
          const file = e.dataTransfer?.files?.[0];
          if (file) doUpload(file);
        });
      } else {
        thumbEl.style.cursor = "default";
      }
      // when an input node lives in the left column, hide ALL of its widgets from the body
      // (LoadImage has extra custom widgets like `choose file to upload` and `$$canvas-image-preview`
      // that render badly and don't belong in the params section anyway)
      for (const w of (w_node.widgets || [])) {
        if (w?.name) skippedInBody.add(`${w_node.id}\u001f${w.name}`);
      }
      if (fileWidget) {
        const sel = document.createElement("select");
        sel.className = "gnode-input-combo";
        for (const opt of (fileWidget.options?.values || [])) {
          const o = document.createElement("option");
          o.value = String(opt);
          o.textContent = String(opt);
          if (opt === fileWidget.value) o.selected = true;
          sel.appendChild(o);
        }
        sel.addEventListener("change", () => {
          fileWidget.value = sel.value;
          fileWidget.callback?.(sel.value, app.canvas, w_node);
          w_node.setDirtyCanvas?.(true, true);
          setTimeout(renderInputs, 120);
        });
        card.appendChild(sel);
      }
      inputsInner.appendChild(card);
    }
    renderBody();
  }
  node._gnodeRenderInputs = renderInputs;

  // preview column: render + toggle
  const previewsInner = el.querySelector(".gnode-previews-inner");
  const previewBtn = el.querySelector('[data-act="preview"]');
  let previewPoll = null;

  function shortSectionLabel(title) {
    if (!title) return "";
    // "SD1.5 / SDXL T2I" -> "T2I"; "Krea2Turbo I2I" -> "I2I"
    const m = String(title).match(/\b(T2I|I2I|OUT|OUTPUT|IN|INPUT)\b/i);
    if (m) return m[1].toUpperCase();
    const parts = String(title).split(/\s+/);
    return (parts[parts.length - 1] || title).toUpperCase();
  }

  function collectPreviewSlots() {
    const sections = node.properties.sections || [];
    const out = [];
    for (const id of node.properties.wrapped_ids || []) {
      const w = app.graph.getNodeById(id);
      if (!w) continue;
      // don't double-list input nodes (they already have their own left-column card)
      if (INPUT_TYPES.has(w.type)) continue;
      const type = String(w.type || "").toLowerCase();
      const looksLikePreview =
        type.includes("preview") ||
        type.includes("saveimage") ||
        "imgs" in w;
      if (!looksLikePreview) continue;

      const sec = sections.find(s => Array.isArray(s.node_ids) && s.node_ids.includes(id));
      // primary source: app.nodeOutputs (raw execution result, populated for all
      // executed nodes regardless of visibility — w.imgs only fills reliably for
      // on-screen preview nodes, which ours aren't since we hide them at HIDDEN_POS)
      const outputImages = app.nodeOutputs?.[id]?.images;
      let imgSrc = "";
      if (Array.isArray(outputImages) && outputImages.length > 0) {
        const im = outputImages[outputImages.length - 1];
        imgSrc = api.apiURL(
          `/view?filename=${encodeURIComponent(im.filename)}` +
          `&subfolder=${encodeURIComponent(im.subfolder || "")}` +
          `&type=${encodeURIComponent(im.type || "output")}`
        );
      } else if (Array.isArray(w.imgs) && w.imgs.length > 0) {
        imgSrc = w.imgs[w.imgs.length - 1].src;
      }
      out.push({
        node_id: id,
        badge: shortSectionLabel(sec?.title) || String(w.title || w.type || "preview"),
        color: sec?.color || "#7a7a86",
        img: imgSrc ? { src: imgSrc } : null,
      });
    }
    return out;
  }

  function renderPreviews() {
    const slots = collectPreviewSlots();

    // always update inline preview thumbs living in the section rows
    const inlineByNodeId = new Map();
    body.querySelectorAll(".gnode-thumb[data-preview-node-id]").forEach(t => {
      inlineByNodeId.set(t.dataset.previewNodeId, t);
    });
    for (const p of slots) {
      const thumb = inlineByNodeId.get(String(p.node_id));
      if (!thumb) continue;
      thumb.innerHTML = `<div class="badge" style="color:${p.color}">${escapeHtml(p.badge)}</div>`;
      if (p.img?.src) {
        const img = document.createElement("img");
        img.src = p.img.src;
        thumb.appendChild(img);
      } else {
        const placeholder = document.createElement("span");
        placeholder.textContent = "preview";
        thumb.appendChild(placeholder);
      }
    }

    if (!previewsInner) return;
    // use the same .gnode-input-card structure as the LOAD IMAGE side so
    // label→thumb spacing matches exactly (head padding + card gap identical)
    if (slots.length === 0) {
      previewsInner.innerHTML = `
        <div class="gnode-input-card">
          <div class="gnode-input-card-head">PREVIEW</div>
          <div class="gnode-empty" style="padding:16px 0">no preview nodes wrapped</div>
        </div>`;
      return;
    }
    previewsInner.innerHTML = `
      <div class="gnode-input-card">
        <div class="gnode-input-card-head">PREVIEW</div>
      </div>`;
    const card = previewsInner.querySelector(".gnode-input-card");
    for (const p of slots) {
      const thumb = document.createElement("div");
      thumb.className = "gnode-thumb";
      thumb.innerHTML = `<div class="badge" style="color:${p.color}">${escapeHtml(p.badge)}</div>`;
      if (p.img?.src) {
        const img = document.createElement("img");
        img.src = p.img.src;
        thumb.appendChild(img);
      } else {
        const placeholder = document.createElement("span");
        placeholder.textContent = "preview";
        thumb.appendChild(placeholder);
      }
      card.appendChild(thumb);
    }
  }

  function startPreviewPolling() {
    if (previewPoll) return;
    previewPoll = setInterval(renderPreviews, 600);
  }
  function stopPreviewPolling() {
    if (previewPoll) { clearInterval(previewPoll); previewPoll = null; }
  }
  node._gnodeStopPreviewPolling = stopPreviewPolling;

  // pulse the section-dot of whichever wrapped section is currently executing.
  // comfy emits "executing" events with detail.node (nodeId string) or null (done).
  function sectionIdxForNodeId(id) {
    const sections = node.properties.sections || [];
    return sections.findIndex(s => Array.isArray(s.node_ids) && s.node_ids.includes(id));
  }
  function markExecuting(nodeId) {
    body.querySelectorAll(".gnode-section-dot.executing")
      .forEach(d => d.classList.remove("executing"));
    if (nodeId == null) return;
    const idx = sectionIdxForNodeId(Number(nodeId));
    if (idx < 0) return;
    const secEl = body.querySelectorAll(".gnode-section")[idx];
    secEl?.querySelector(".gnode-section-dot")?.classList.add("executing");
  }
  const onExecuting = ({ detail }) => markExecuting(detail);
  api.addEventListener("executing", onExecuting);
  const prevRemove = node.onRemoved;
  node.onRemoved = function () {
    api.removeEventListener("executing", onExecuting);
    prevRemove?.call(this);
  };

  // layout toggle (vertical <-> horizontal) — only meaningful with 2+ sections
  const layoutBtn = el.querySelector('[data-act="layout"]');
  const sectionCount = (node.properties.sections || []).length;
  if (sectionCount < 2) {
    layoutBtn.style.display = "none";
    // force vertical if only one section
    if (node.properties.layout === "horizontal") node.properties.layout = "vertical";
  }
  function applyLayout(mode) {
    const horizontal = mode === "horizontal" && sectionCount >= 2;
    el.classList.toggle("horizontal", horizontal);
    layoutBtn.classList.toggle("on", horizontal);
    layoutBtn.title = horizontal ? "Switch to vertical layout" : "Switch to horizontal layout";
    // widen body itself for horizontal so each section has room; leave the side
    // columns (inputs / previews) at their own widths — computeRequiredWidth sums them.
    const bodyW = horizontal ? Math.max(BODY_W, sectionCount * 380) : BODY_W;
    el.style.setProperty("--body-w", `${bodyW}px`);
    syncNodeWidth(true);
  }
  // restore saved layout on init
  if (node.properties.layout === "horizontal") applyLayout("horizontal");
  layoutBtn.addEventListener("click", () => {
    const next = node.properties.layout === "horizontal" ? "vertical" : "horizontal";
    node.properties.layout = next;
    applyLayout(next);
  });

  previewBtn.addEventListener("click", () => {
    const on = el.classList.toggle("with-previews");
    previewBtn.classList.toggle("on", on);
    previewBtn.title = on ? "Hide previews" : "Show previews";
    syncNodeWidth(true);   // set node width to exactly fit the new configuration
    if (on) {
      renderPreviews();
      startPreviewPolling();
    } else {
      stopPreviewPolling();
    }
  });


  // draggable right separator: adjusts previews col width via --pw
  const resizeHandle = el.querySelector(".gnode-resize-handle");
  resizeHandle.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    if (!el.classList.contains("with-previews")) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = app.canvas;
    const scale = canvas.ds?.scale || 1;
    const startX = e.clientX;
    const startPW = parseInt(el.style.getPropertyValue("--pw")) || PREVIEW_COL_W;
    el.classList.add("dragging");
    const onMove = ev => {
      const dx = (ev.clientX - startX) / scale;
      const next = Math.max(140, startPW + dx);
      el.style.setProperty("--pw", next + "px");
      syncNodeWidth(true);
    };
    const onUp = () => {
      el.classList.remove("dragging");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  // draggable left separator: adjusts inputs col width via --iw
  const inputsHandle = el.querySelector(".gnode-inputs-handle");
  inputsHandle.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    if (!el.classList.contains("with-inputs")) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = app.canvas;
    const scale = canvas.ds?.scale || 1;
    const startX = e.clientX;
    const startIW = parseInt(el.style.getPropertyValue("--iw")) || INPUTS_COL_W;
    el.classList.add("dragging-inputs");
    const onMove = ev => {
      const dx = (ev.clientX - startX) / scale;
      const next = Math.max(140, Math.min(320, startIW + dx));
      el.style.setProperty("--iw", next + "px");
      syncNodeWidth(true);
    };
    const onUp = () => {
      el.classList.remove("dragging-inputs");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  el.querySelector('[data-act="expand"]').addEventListener("click", () => expandGNode(node));
  el.querySelector('[data-act="run"]').addEventListener("click", () => {
    app.queuePrompt(0, 1);
    // refresh previews + input thumbs shortly after run
    if (el.classList.contains("with-previews")) renderPreviews();
    setTimeout(renderInputs, 200);
  });

  const nameEl = el.querySelector(".gnode-name");
  nameEl.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); nameEl.blur(); }
  });
  nameEl.addEventListener("blur", () => {
    node.properties.gnode_name = nameEl.textContent.trim() || "Untitled";
  });

  // drag by header (skip if the click lands on a button or the editable name)
  const head = el.querySelector(".gnode-head");
  head.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    if (e.target.closest("button, [contenteditable='true']")) return;
    e.preventDefault();
    const canvas = app.canvas;
    const scale = canvas.ds?.scale || 1;
    const startX = e.clientX, startY = e.clientY;
    const startPos = [node.pos[0], node.pos[1]];
    const onMove = ev => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      node.pos[0] = startPos[0] + dx;
      node.pos[1] = startPos[1] + dy;
      canvas.setDirty(true, true);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  // expose a rebuild hook so external actions (e.g., Send to GNODE) can refresh the card
  node._gnodeRebuildAll = () => {
    renderInputs();
    renderBody();
    renderPopover();
  };

  // initial render — must come AFTER every closure-referenced const above (temporal dead zone)
  renderInputs();
  renderBody();
  renderPopover();

  // inline preview rows live in the sections by default — start polling so their
  // thumbs update after each run. side col is separate (opt-in via the eye button).
  if (collectPreviewSlots().length > 0) {
    renderPreviews();
    startPreviewPolling();
  }

  return el;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ---------- wrap flow ---------- */

function wrapSelection() {
  const selected = getSelectedNodes().filter(n => n.type !== GNODE_TYPE);
  console.log("[GNODE] wrapSelection: selection count =", selected.length);
  if (selected.length < 2) {
    console.warn("[GNODE] select 2+ nodes to wrap.");
    return;
  }

  try {
    const bbox = boundingBoxOf(selected);
    const grabbedGroups = grabAndRemoveGroups(selected);
    const sections = inferSections(selected, grabbedGroups);
    console.log("[GNODE] wrapping", selected.length, "nodes,", grabbedGroups.length, "groups, sections:", sections);

    const savedPositions = {};
    hideNodes(selected, savedPositions);

    const gnode = LiteGraph.createNode(GNODE_TYPE);
    if (!gnode) {
      console.error("[GNODE] LiteGraph.createNode returned null — restoring selection.");
      restoreNodePositions(savedPositions);
      restoreGroups(grabbedGroups);
      return;
    }
    gnode.pos = [bbox.minX, bbox.minY];
    gnode.size = [...DEFAULT_SIZE];
    gnode.properties.wrapped_ids = selected.map(n => n.id);
    gnode.properties.saved_positions = savedPositions;
    gnode.properties.saved_groups = grabbedGroups;
    gnode.properties.sections = sections;
    gnode.properties.gnode_name = "Untitled";
    // pick a random accent color so each GNODE is visually distinguishable
    const c = pickRandomNodeColor();
    gnode.properties.node_color = c;
    gnode.color = c.color;
    gnode.bgcolor = c.bgcolor;
    // horizontal layout is the default when there are enough sections to arrange
    if (sections.length >= 2) gnode.properties.layout = "horizontal";
    app.graph.add(gnode);

    app.canvas.selectNodes([gnode]);
    app.canvas.setDirty(true, true);
    console.log("[GNODE] wrap complete. GNODE at", gnode.pos);
  } catch (err) {
    console.error("[GNODE] wrapSelection failed:", err);
  }
}

function expandGNode(gnode) {
  // onRemoved handles restoration — don't double-restore here.
  app.graph.remove(gnode);
  app.canvas.setDirty(true, true);
}

/* ---------- extension registration ---------- */

app.registerExtension({
  name: EXT_NAME,

  async setup() {
    injectStyles();

    const origCanvasMenu = LGraphCanvas.prototype.getCanvasMenuOptions;
    LGraphCanvas.prototype.getCanvasMenuOptions = function () {
      const opts = origCanvasMenu.apply(this, arguments) || [];
      addWrapMenuItem(opts, this);
      return opts;
    };

    const origNodeMenu = LGraphCanvas.prototype.getNodeMenuOptions;
    LGraphCanvas.prototype.getNodeMenuOptions = function (node) {
      const opts = origNodeMenu.apply(this, arguments) || [];
      addWrapMenuItem(opts, this);
      addSendToGNodeMenuItem(opts, this, node);
      return opts;
    };
  },

  async registerCustomNodes() {
    class GNodeContainer extends LiteGraph.LGraphNode {
      constructor(title) {
        super(title || "GNODE");
        this.isVirtualNode = true;
        this.serialize_widgets = false;
        this.title = "GNODE";
        // NOTE: title_mode is a getter on the instance in current ComfyUI LiteGraph — see prototype override below.
        // keep default bgcolor so the node is visible even if the DOM widget fails to mount
        this.size = [...DEFAULT_SIZE];
        this.properties = {
          wrapped_ids: [],
          saved_positions: {},
          saved_groups: [],
          sections: [],
          gnode_name: "Untitled",
        };

        queueMicrotask(() => {
          try {
            // restore (or seed) the accent color so reloaded GNODEs keep theirs
            if (!this.properties.node_color || typeof this.properties.node_color === "string") {
              this.properties.node_color = pickRandomNodeColor();
            }
            this.color = this.properties.node_color.color;
            this.bgcolor = this.properties.node_color.bgcolor;
            const card = buildCard(this);
            // auto-size the node to fit the card content
            const head = card.querySelector(".gnode-head");
            const body = card.querySelector(".gnode-body");
            const measureNatural = () => {
              if (!body) return CARD_MIN_HEIGHT;
              let bodyH;
              if (card.classList.contains("horizontal")) {
                // horizontal: body is stretch-sized, so scrollHeight lies. sum
                // each section's intrinsic children (padding + head + rows +
                // margins between them) and take the tallest section as the
                // natural body height.
                let max = 0;
                for (const sec of body.querySelectorAll(".gnode-section")) {
                  const cs = getComputedStyle(sec);
                  let h = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
                  for (const child of sec.children) {
                    const ccs = getComputedStyle(child);
                    h += child.offsetHeight
                       + (parseFloat(ccs.marginTop) || 0)
                       + (parseFloat(ccs.marginBottom) || 0);
                  }
                  if (h > max) max = h;
                }
                bodyH = max || body.scrollHeight;
              } else {
                // vertical: body is align-self:flex-start -> scrollHeight = content
                bodyH = body.scrollHeight;
              }
              // section padding-bottom already handles bottom breathing room
              return Math.max(CARD_MIN_HEIGHT, (head?.offsetHeight || 0) + bodyH + 4);
            };
            // expose so onResize can cap max height / snap min at natural
            this._gnodeMeasureNatural = measureNatural;
            this.addDOMWidget("gnode_card", "gnode_card", card, {
              serialize: false,
              hideOnZoom: false,
              // low floor so the user can drag corner to make the card shorter;
              // card-content has overflow-y:auto so overflow scrolls
              getMinHeight: () => CARD_MIN_HEIGHT,
            });
            // initial fit: snap to natural once, then let the user drag freely
            const snapToFit = () => {
              const target = measureNatural();
              this.size[1] = target;
              this.setDirtyCanvas?.(true, true);
            };
            requestAnimationFrame(() => requestAnimationFrame(snapToFit));
            // expose so content-mutating actions (hide row, restore row, reorder, layout flip)
            // can request an exact re-fit after their render settles
            this._gnodeSnapToFit = () =>
              requestAnimationFrame(() => requestAnimationFrame(snapToFit));

            // observe body: only auto-resize when the natural (content) height
            // actually changes — never fight the user's corner-drag. we track
            // prevNatural so a user shrinking the card in horizontal (which
            // also shrinks the stretch-body) doesn't get auto-grown back.
            let prevNatural = 0;
            const onBodyResize = () => {
              const target = measureNatural();
              const grew = target > prevNatural + 0.5;
              const shrunk = target < prevNatural - 0.5;
              prevNatural = target;
              const current = this.size?.[1] || 0;
              if (grew && current < target) {
                this.size[1] = target;
                this.setDirtyCanvas?.(true, true);
              } else if (shrunk && current > target) {
                // content shrunk (row hidden, textarea shrunk) -> collapse to fit
                this.size[1] = target;
                this.setDirtyCanvas?.(true, true);
              }
            };
            const ro = new ResizeObserver(onBodyResize);
            if (body) ro.observe(body);
            this._gnodeResizeObserver = ro;

            this.setDirtyCanvas?.(true, true);
          } catch (err) {
            console.error("[GNODE] card mount failed:", err);
          }
        });
      }

      // LiteGraph fires this after any corner-drag.
      //   width : enforce a minimum (content's required width) but let the
      //           user grow it — extra space is absorbed by body / preview col
      //           via flex-grow so no dead colored area appears.
      //   height: cap at natural (no growing past content) and allow shrinking
      //           — .gnode-card-content has overflow-y:auto to scroll then.
      onResize(size) {
        if (typeof this._gnodeRequiredWidth === "function") {
          const w = this._gnodeRequiredWidth();
          if (size[0] < w) size[0] = w;
        }
        if (typeof this._gnodeMeasureNatural === "function") {
          const nat = this._gnodeMeasureNatural();
          if (size[1] > nat) size[1] = nat;
        }
        this.setDirtyCanvas?.(true, true);
      }

      onRemoved() {
        if (this._gnodeCleanedUp) return;
        this._gnodeCleanedUp = true;
        try {
          this._gnodeResizeObserver?.disconnect();
          this._gnodeStopPreviewPolling?.();
          restoreNodePositions(this.properties?.saved_positions || {});
          restoreGroups(this.properties?.saved_groups || []);
        } catch (err) {
          console.warn("[GNODE] cleanup on remove failed:", err);
        }
      }
    }
    GNodeContainer.title = "GNODE";
    GNodeContainer.category = "GNODE";

    // override title_mode on the prototype (instance property is a getter — direct assignment throws)
    if (LiteGraph.NO_TITLE !== undefined) {
      try {
        Object.defineProperty(GNodeContainer.prototype, "title_mode", {
          value: LiteGraph.NO_TITLE,
          writable: true,
          configurable: true,
        });
      } catch (err) {
        console.warn("[GNODE] could not override title_mode:", err);
      }
    }

    LiteGraph.registerNodeType(GNODE_TYPE, GNodeContainer);
  },
});

function addWrapMenuItem(opts, canvas) {
  const selected = Object.values(canvas.selected_nodes || {})
    .filter(n => n.type !== GNODE_TYPE);
  if (selected.length < 2) return;
  opts.unshift(null);
  opts.unshift({
    content: "◆ Wrap in GNODE",
    callback: () => wrapSelection(),
  });
}

function listGNodes() {
  const nodes = app.graph._nodes || app.graph.nodes || [];
  return nodes.filter(n => n.type === GNODE_TYPE);
}

function sendNodesToGNode(sourceNodes, gnode, targetSection) {
  const props = gnode.properties;
  props.wrapped_ids = Array.isArray(props.wrapped_ids) ? props.wrapped_ids : [];
  props.saved_positions = props.saved_positions || {};
  props.sections = Array.isArray(props.sections) ? props.sections : [];

  // resolve target section: caller passes an existing section object, a title
  // to create/find (e.g. "Misc" or a new name), or nothing (default -> Misc).
  let section;
  if (targetSection && typeof targetSection === "object") {
    section = targetSection;
  } else {
    const title = (typeof targetSection === "string" && targetSection.trim()) || "Misc";
    section = props.sections.find(s => s.title === title);
    if (!section) {
      const color = title === "Misc"
        ? "#7a7a86"
        : SECTION_COLORS[props.sections.length % SECTION_COLORS.length];
      section = { title, color, node_ids: [] };
      props.sections.push(section);
    }
  }

  for (const src of sourceNodes) {
    if (src.type === GNODE_TYPE) continue;
    if (!props.wrapped_ids.includes(src.id)) props.wrapped_ids.push(src.id);
    if (!props.saved_positions[src.id]) {
      props.saved_positions[src.id] = [src.pos[0], src.pos[1]];
    }
    src.pos = [...HIDDEN_POS];
    if (!Array.isArray(section.node_ids)) section.node_ids = [];
    if (!section.node_ids.includes(src.id)) section.node_ids.push(src.id);
    // if this section had a frozen widget_order (from wrap/drag), append the
    // new node's widgets so they actually render
    if (Array.isArray(section.widget_order) && Array.isArray(src.widgets)) {
      for (const w of src.widgets) {
        if (!w || w.type === "converted-widget") continue;
        const key = `${src.id}\u001f${w.name}`;
        if (!section.widget_order.includes(key)) section.widget_order.push(key);
      }
    }
  }

  // ask the target GNODE to rebuild its card
  gnode._gnodeRebuildAll?.();
  app.canvas.setDirty(true, true);
}

function addSendToGNodeMenuItem(opts, canvas, node) {
  const gnodes = listGNodes();
  if (gnodes.length === 0) return;

  // if this menu was opened on a node, use canvas selection if it includes the node, else just this node
  let sources = Object.values(canvas.selected_nodes || {}).filter(n => n.type !== GNODE_TYPE);
  if (node && !sources.includes(node)) sources = [node];
  if (sources.length === 0) return;

  const label = sources.length === 1
    ? `◆ Send to GNODE`
    : `◆ Send ${sources.length} nodes to GNODE`;

  // build submenu of sections for a target GNODE (existing sections + "+ New section...")
  const buildSectionSubmenu = (g) => {
    const secs = Array.isArray(g.properties?.sections) ? g.properties.sections : [];
    const options = secs.map(s => ({
      content: s.title || "Section",
      callback: () => sendNodesToGNode(sources, g, s),
    }));
    if (options.length > 0) options.push(null);
    options.push({
      content: "+ New section…",
      callback: () => {
        const name = window.prompt("New section name:", "New");
        const trimmed = (name || "").trim();
        if (!trimmed) return;
        sendNodesToGNode(sources, g, trimmed);
      },
    });
    return { options };
  };

  if (gnodes.length === 1) {
    const g = gnodes[0];
    const gname = g.properties?.gnode_name || "Untitled";
    const secs = Array.isArray(g.properties?.sections) ? g.properties.sections : [];
    opts.unshift(null);
    if (secs.length <= 1) {
      // single section (or none): drop straight into it / create Misc
      opts.unshift({
        content: `◆ Send to GNODE · ${gname}`,
        callback: () => sendNodesToGNode(sources, g, secs[0]),
      });
    } else {
      opts.unshift({
        content: `◆ Send to GNODE · ${gname}`,
        has_submenu: true,
        submenu: buildSectionSubmenu(g),
      });
    }
  } else {
    opts.unshift(null);
    opts.unshift({
      content: label,
      has_submenu: true,
      submenu: {
        options: gnodes.map(g => ({
          content: g.properties?.gnode_name || "Untitled",
          has_submenu: true,
          submenu: buildSectionSubmenu(g),
        })),
      },
    });
  }
}
