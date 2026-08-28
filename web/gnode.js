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

/* ---------- styles ---------- */

const CSS = `
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
  overflow: hidden;
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
  flex: 0 0 var(--body-w, 460px);
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
  padding: 12px 16px 14px;
  border-bottom: 1px solid var(--line);
  min-width: 0;
}
.gnode-section:last-child { border-bottom: none; }

/* horizontal layout: sections sit side-by-side */
.gnode-card.horizontal .gnode-body {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}
.gnode-card.horizontal .gnode-section {
  flex: 1 1 0;
  min-width: 0;
  border-bottom: none;
  border-right: 1px solid var(--line);
}
.gnode-card.horizontal .gnode-section:last-child { border-right: none; }
.gnode-section-head {
  display: flex; align-items: center;
  margin-bottom: 10px;
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
}

.gnode-row {
  display: grid;
  grid-template-columns: 34px 100px 1fr;
  align-items: center;
  gap: 12px;
  min-height: 24px;
  margin-bottom: 8px;
  position: relative;
}
.gnode-row-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-start;
}
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
.gnode-row-drag svg { width: 8px; height: 14px; pointer-events: none; }
.gnode-row:hover .gnode-row-drag { opacity: 0.75; }
.gnode-row-drag:hover { color: var(--text); background: rgba(255,255,255,0.05); }
.gnode-row.dragging {
  opacity: 0.25;
  background: rgba(160,140,255,0.06);
  border-radius: 5px;
}
.gnode-row.dragging .gnode-row-drag { cursor: grabbing; opacity: 1; }
.gnode-row { transition: transform 0.15s ease; }
.gnode-row .k {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.02em;
  word-break: break-word;
}
.gnode-row .v { position: relative; }

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

.gnode-slider-wrap {
  display: grid;
  grid-template-columns: 1fr 40px;
  align-items: center;
  gap: 8px;
}
.gnode-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  background: linear-gradient(to right, var(--accent-color, var(--accent)) 0%, var(--accent-color, var(--accent)) var(--pct, 50%), rgba(255,255,255,0.08) var(--pct, 50%));
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.gnode-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.4);
}
.gnode-slider-val {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 10px;
  color: var(--muted);
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
  if (ungrouped.length > 0) {
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
    const max = widget.options?.max ?? 100;
    const step = widget.options?.step ?? 1;
    // sliders for bounded ranges, plain input for open ranges
    const bounded = isFinite(min) && isFinite(max) && (max - min) < 1e9;
    if (bounded) {
      const wrap = document.createElement("div");
      wrap.className = "gnode-slider-wrap";
      const sl = document.createElement("input");
      sl.type = "range";
      sl.className = "gnode-slider";
      sl.min = min; sl.max = max; sl.step = step;
      sl.value = widget.value;
      const val = document.createElement("div");
      val.className = "gnode-slider-val";
      const paint = () => {
        const pct = ((sl.value - min) / (max - min)) * 100;
        sl.style.setProperty("--pct", pct + "%");
        val.textContent = step < 1 ? Number(sl.value).toFixed(2) : sl.value;
      };
      sl.addEventListener("input", () => { paint(); commit(parseFloat(sl.value)); });
      paint();
      wrap.appendChild(sl); wrap.appendChild(val);
      v.appendChild(wrap);
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
  return hiddenList.some(h => h.node_id === node.id && h.widget_name === widget.name);
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
      <div class="gnode-popover-anchor">
        <button class="gnode-icon-btn" data-act="settings" title="Hidden widgets">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="2"/>
            <path d="M8 1 L8 3 M8 13 L8 15 M1 8 L3 8 M13 8 L15 8 M3 3 L4.5 4.5 M11.5 11.5 L13 13 M3 13 L4.5 11.5 M11.5 4.5 L13 3"/>
          </svg>
        </button>
        <div class="gnode-popover" data-role="popover">
          <div class="gnode-popover-head">Hidden widgets</div>
          <div class="gnode-popover-body"></div>
        </div>
      </div>
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
  const popover = el.querySelector('[data-role="popover"]');
  const popoverBody = popover.querySelector(".gnode-popover-body");
  const settingsBtn = el.querySelector('[data-act="settings"]');

  function ensureHiddenArray() {
    if (!Array.isArray(node.properties.hidden_widgets)) {
      node.properties.hidden_widgets = [];
    }
    return node.properties.hidden_widgets;
  }

  function hideWidget(nodeId, widgetName) {
    const arr = ensureHiddenArray();
    if (!arr.some(h => h.node_id === nodeId && h.widget_name === widgetName)) {
      arr.push({ node_id: nodeId, widget_name: widgetName });
    }
    renderBody();
    renderPopover();
    node._gnodeSnapToFit?.();
  }

  function restoreWidget(nodeId, widgetName) {
    const arr = ensureHiddenArray();
    const idx = arr.findIndex(h => h.node_id === nodeId && h.widget_name === widgetName);
    if (idx >= 0) arr.splice(idx, 1);
    renderBody();
    renderPopover();
    node._gnodeSnapToFit?.();
  }

  function getSectionOrder(section) {
    if (Array.isArray(section.widget_order) && section.widget_order.length > 0) {
      return section.widget_order.slice();
    }
    const order = [];
    for (const nodeId of section.node_ids || []) {
      const wrapped = app.graph.getNodeById(nodeId);
      if (!wrapped?.widgets) continue;
      for (const w of wrapped.widgets) {
        if (!w || w.type === "converted-widget") continue;
        order.push(`${nodeId}\u001f${w.name}`);
      }
    }
    return order;
  }

  let draggedRow = null;

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
      sec.innerHTML = `
        <div class="gnode-section-head">
          <span class="gnode-section-label" style="color:${s.color}">
            <span class="gnode-section-dot" style="background:${s.color}; box-shadow:0 0 8px ${s.color}"></span>
            ${escapeHtml(s.title.toUpperCase())}
          </span>
        </div>
      `;

      // dropping onto empty section area or the header inserts at the top
      sec.addEventListener("dragover", e => {
        if (!draggedRow) return;
        // let row-level handlers take precedence
        if (e.target.closest(".gnode-row")) return;
        e.preventDefault();
        // find first row in this section that isn't the dragged row
        const firstRow = [...sec.querySelectorAll(".gnode-row")]
          .find(r => r !== draggedRow);
        if (firstRow) {
          sec.insertBefore(draggedRow, firstRow);
        } else {
          sec.appendChild(draggedRow);
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
        if (!wrapped?.widgets) continue;
        const w = wrapped.widgets.find(x => x.name === widgetName);
        if (!w || w.type === "converted-widget") continue;
        if (isWidgetHidden(wrapped, w, hidden)) continue;
        if (skippedInBody.has(`${wrapped.id}\u001f${w.name}`)) continue;

        const row = renderWidgetRow(wrapped, w);
        row.style.setProperty("--accent-color", s.color);
        const sliderTrack = row.querySelector(".gnode-slider");
        if (sliderTrack) sliderTrack.style.setProperty("--accent-color", s.color);
        row.dataset.rowKey = key;
        row.dataset.sectionIdx = String(sIdx);

        // controls: hide button + drag handle, prepended into the first grid column
        const controls = document.createElement("div");
        controls.className = "gnode-row-controls";

        const hideBtn = document.createElement("button");
        hideBtn.className = "gnode-row-hide";
        hideBtn.title = "Hide from card";
        hideBtn.innerHTML = `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 5 L8 5"/></svg>`;
        hideBtn.addEventListener("click", e => {
          e.stopPropagation();
          hideWidget(wrapped.id, w.name);
        });

        const dragHandle = document.createElement("div");
        dragHandle.className = "gnode-row-drag";
        dragHandle.title = "Drag to reorder";
        dragHandle.innerHTML = `<svg viewBox="0 0 8 14" fill="currentColor">
          <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
          <circle cx="2" cy="7" r="1"/><circle cx="6" cy="7" r="1"/>
          <circle cx="2" cy="12" r="1"/><circle cx="6" cy="12" r="1"/>
        </svg>`;

        controls.appendChild(hideBtn);
        controls.appendChild(dragHandle);
        row.insertBefore(controls, row.firstChild);

        // drag-to-reorder with LIVE dom shifting so the target row visibly makes room
        dragHandle.addEventListener("mousedown", () => { row.draggable = true; });
        row.addEventListener("dragstart", e => {
          draggedRow = row;
          row.classList.add("dragging");
          e.dataTransfer.setData("text/plain", row.dataset.rowKey);
          e.dataTransfer.effectAllowed = "move";
        });
        row.addEventListener("dragend", () => {
          row.classList.remove("dragging");
          row.draggable = false;
          draggedRow = null;
          commitDomOrder();
        });
        row.addEventListener("dragover", e => {
          if (!draggedRow || draggedRow === row) { e.preventDefault(); return; }
          e.preventDefault();
          const rect = row.getBoundingClientRect();
          const above = (e.clientY - rect.top) < rect.height / 2;
          const parent = row.parentNode;
          if (above) parent.insertBefore(draggedRow, row);
          else parent.insertBefore(draggedRow, row.nextSibling);
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

  function renderPopover() {
    popoverBody.innerHTML = "";
    const hidden = ensureHiddenArray();
    if (hidden.length === 0) {
      popoverBody.innerHTML = `<div class="gnode-popover-empty">Nothing hidden</div>`;
      return;
    }
    const sections = node.properties.sections || [];
    for (const h of hidden) {
      const wrapped = app.graph.getNodeById(h.node_id);
      const sec = sections.find(s => s.node_ids?.includes(h.node_id));
      const srcTitle = sec?.title || wrapped?.title || wrapped?.type || "";
      const item = document.createElement("div");
      item.className = "gnode-hidden-item";
      item.innerHTML = `
        <div>
          <span class="label">${escapeHtml(h.widget_name)}</span>
          <span class="src">${escapeHtml(srcTitle)}</span>
        </div>
        <span class="restore">+ show</span>
      `;
      item.addEventListener("click", () => restoreWidget(h.node_id, h.widget_name));
      popoverBody.appendChild(item);
    }
  }

  settingsBtn.addEventListener("click", e => {
    e.stopPropagation();
    const open = popover.classList.toggle("open");
    settingsBtn.classList.toggle("on", open);
  });
  document.addEventListener("click", e => {
    if (!popover.contains(e.target) && !settingsBtn.contains(e.target)) {
      popover.classList.remove("open");
      settingsBtn.classList.remove("on");
    }
  });

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
    let w = BODY_W;
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
      const latestImg = Array.isArray(w.imgs) && w.imgs.length > 0
        ? w.imgs[w.imgs.length - 1]
        : null;
      out.push({
        node_id: id,
        badge: shortSectionLabel(sec?.title) || String(w.title || w.type || "preview"),
        color: sec?.color || "#7a7a86",
        img: latestImg,
      });
    }
    return out;
  }

  function renderPreviews() {
    if (!previewsInner) return;
    const slots = collectPreviewSlots();
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
    // widen the node for horizontal layout so each section has room
    const targetW = horizontal
      ? Math.max(DEFAULT_SIZE[0], sectionCount * 380)
      : DEFAULT_SIZE[0];
    node.size[0] = targetW + (el.classList.contains("with-previews") ? 216 : 0);
    node.setDirtyCanvas?.(true, true);
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

  // auto-open previews column if the wrap includes any preview/save nodes
  if (collectPreviewSlots().length > 0) {
    el.classList.add("with-previews");
    previewBtn.classList.add("on");
    previewBtn.title = "Hide previews";
    syncNodeWidth();
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
            const card = buildCard(this);
            // auto-size the node to fit the card content
            const head = card.querySelector(".gnode-head");
            const body = card.querySelector(".gnode-body");
            const measureNatural = () => {
              const bodyH = body?.scrollHeight || 0;
              return Math.max(CARD_MIN_HEIGHT, (head?.offsetHeight || 0) + bodyH + 4);
            };
            this.addDOMWidget("gnode_card", "gnode_card", card, {
              serialize: false,
              hideOnZoom: false,
              getMinHeight: () => measureNatural(),
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

            // observe body only. body is align-self:flex-start so its size == content
            // (not the flex-stretched card height), so this fires only when content actually
            // changes (row added, textarea grew/shrunk) — not on user corner-drag.
            // snap-to-fit in both directions so shrinking the textarea also collapses the node.
            const snapOnContentChange = () => {
              const target = measureNatural();
              if (Math.abs((this.size?.[1] || 0) - target) > 1) {
                this.size[1] = target;
                this.setDirtyCanvas?.(true, true);
              }
            };
            const ro = new ResizeObserver(snapOnContentChange);
            if (body) ro.observe(body);
            this._gnodeResizeObserver = ro;

            this.setDirtyCanvas?.(true, true);
          } catch (err) {
            console.error("[GNODE] card mount failed:", err);
          }
        });
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

function sendNodesToGNode(sourceNodes, gnode) {
  const props = gnode.properties;
  props.wrapped_ids = Array.isArray(props.wrapped_ids) ? props.wrapped_ids : [];
  props.saved_positions = props.saved_positions || {};
  props.sections = Array.isArray(props.sections) ? props.sections : [];

  // find or create the Misc section
  let misc = props.sections.find(s => s.title === "Misc");
  if (!misc) {
    misc = { title: "Misc", color: "#7a7a86", node_ids: [] };
    props.sections.push(misc);
  }

  for (const src of sourceNodes) {
    if (src.type === GNODE_TYPE) continue;
    if (!props.wrapped_ids.includes(src.id)) props.wrapped_ids.push(src.id);
    if (!props.saved_positions[src.id]) {
      props.saved_positions[src.id] = [src.pos[0], src.pos[1]];
    }
    src.pos = [...HIDDEN_POS];
    if (!misc.node_ids.includes(src.id)) misc.node_ids.push(src.id);
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

  if (gnodes.length === 1) {
    const g = gnodes[0];
    const gname = g.properties?.gnode_name || "Untitled";
    opts.unshift(null);
    opts.unshift({
      content: `◆ Send to GNODE · ${gname}`,
      callback: () => sendNodesToGNode(sources, g),
    });
  } else {
    opts.unshift(null);
    opts.unshift({
      content: label,
      has_submenu: true,
      submenu: {
        options: gnodes.map(g => ({
          content: g.properties?.gnode_name || "Untitled",
          callback: () => sendNodesToGNode(sources, g),
        })),
      },
    });
  }
}
