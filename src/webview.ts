import * as vscode from "vscode";

export function getEditorHtml(webview: vscode.Webview, logoUri: string): string {
  const nonce = createNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Readme Maker WYSIWYG</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: var(--vscode-editor-background);
      --bg-soft: var(--vscode-editor-background);
      --paper: var(--vscode-editor-background);
      --panel: color-mix(in srgb, var(--vscode-sideBar-background) 58%, var(--vscode-editor-background) 42%);
      --ink: var(--vscode-editor-foreground);
      --muted: var(--vscode-descriptionForeground, var(--vscode-editor-foreground));
      --line: color-mix(in srgb, var(--vscode-editor-foreground) 14%, transparent);
      --line-strong: color-mix(in srgb, var(--vscode-editor-foreground) 24%, transparent);
      --accent: var(--vscode-focusBorder, var(--vscode-textLink-foreground));
      --accent-soft: color-mix(in srgb, var(--accent) 12%, transparent);
      --shadow: none;
      --font-ui: var(--vscode-font-family, "Segoe UI", "Malgun Gothic", sans-serif);
      --font-doc: var(--vscode-font-family, "Segoe UI", "Malgun Gothic", sans-serif);
      --font-code: var(--vscode-editor-font-family, "Cascadia Code", "Consolas", monospace);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      font-family: var(--font-ui);
      background: var(--bg);
    }

    button, input, textarea, select {
      font: inherit;
    }

    .app {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr;
    }

    .reveal-zone {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      z-index: 50;
    }

    .editor-dock {
      position: fixed;
      top: 10px;
      right: 16px;
      z-index: 55;
      pointer-events: auto;
    }

    .editor-handle {
      appearance: none;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 6px 10px;
      background: color-mix(in srgb, var(--panel) 88%, var(--bg) 12%);
      color: var(--ink);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      box-shadow: 0 8px 18px color-mix(in srgb, black 14%, transparent);
      transition: border-color 120ms ease, background 120ms ease, color 120ms ease, transform 120ms ease;
    }

    .editor-handle:hover,
    .editor-handle:focus-visible,
    body.toolbar-pinned .editor-handle,
    body.toolbar-visible .editor-handle {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--vscode-toolbar-hoverBackground, color-mix(in srgb, var(--panel) 68%, var(--bg) 32%));
      transform: translateY(-1px);
    }

    .editor-handle svg {
      width: 14px;
      height: 14px;
      stroke: currentColor;
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .editor-handle-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .toolbar-shell {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 40;
      height: 0;
      overflow: visible;
      pointer-events: none;
    }

    .toolbar-frame {
      padding: 6px 14px 0;
      opacity: 0;
      transform: translateY(calc(-100% + 6px));
      transition: transform 180ms ease, opacity 180ms ease;
      backdrop-filter: blur(16px);
      background: linear-gradient(180deg, color-mix(in srgb, var(--bg) 90%, transparent), transparent);
      pointer-events: none;
    }

    body.toolbar-visible .toolbar-frame,
    body.toolbar-pinned .toolbar-frame,
    .toolbar-shell:hover .toolbar-frame {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .toolbar {
      max-width: 1320px;
      margin: 0 auto;
      padding: 7px 10px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--panel);
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .brand-mark {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
    }

    .brand-mark img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }

    .brand-copy {
      min-width: 0;
    }

    .brand-copy strong,
    .brand-copy span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .brand-copy strong {
      font-size: 13px;
    }

    .brand-copy span {
      color: var(--muted);
      font-size: 11px;
    }

    .toolbelt {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px;
      min-width: 0;
    }

    .tool {
      appearance: none;
      width: 32px;
      height: 32px;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 0;
      background: color-mix(in srgb, var(--panel) 82%, var(--bg) 18%);
      color: var(--ink);
      display: inline-grid;
      place-items: center;
      cursor: grab;
      transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
      user-select: none;
    }

    .tool:hover {
      transform: translateY(-1px);
      border-color: var(--accent);
      background: var(--vscode-toolbar-hoverBackground, color-mix(in srgb, var(--panel) 68%, var(--bg) 32%));
      color: var(--accent);
    }

    .tool:active {
      cursor: grabbing;
    }

    .tool svg,
    .icon-btn svg {
      width: 16px;
      height: 16px;
      stroke: currentColor;
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .toolbar-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .btn,
    .icon-btn {
      appearance: none;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: color-mix(in srgb, var(--panel) 82%, var(--bg) 18%);
      color: var(--ink);
      cursor: pointer;
    }

    .btn:hover,
    .icon-btn:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--vscode-toolbar-hoverBackground, color-mix(in srgb, var(--panel) 68%, var(--bg) 32%));
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-grid;
      place-items: center;
    }

    .icon-btn.active {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-soft);
    }

    .workspace {
      padding: 0;
    }

    .stage {
      max-width: none;
      margin: 0;
    }

    .page {
      min-height: 100vh;
      padding: 1em 26px calc(100vh - 22px);
      background: var(--paper);
      transition: padding-top 180ms ease;
    }

    body.toolbar-pinned .page {
      padding-top: calc(1em + 64px);
    }

    .page,
    .page input,
    .page textarea,
    .page select {
      font-family: var(--markdown-font-family, -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif);
      font-size: var(--markdown-font-size, 14px);
      line-height: var(--markdown-line-height, 22px);
      word-wrap: break-word;
    }

    .dropzone {
      margin: 2px 0;
      padding: 0;
      min-height: 8px;
      border-radius: 12px;
      border: 1px dashed transparent;
      transition: border-color 120ms ease, background 120ms ease, transform 120ms ease;
    }

    .dropzone::before {
      content: "Drop tool here";
      display: none;
      text-align: center;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: transparent;
      transition: color 120ms ease;
    }

    .dropzone.active {
      min-height: 28px;
      padding: 7px 0;
      background: var(--accent-soft);
      border-color: color-mix(in srgb, var(--accent) 42%, transparent);
      transform: scaleY(1.02);
    }

    .dropzone.active::before {
      display: block;
      color: var(--accent);
    }

    .block {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas: "body actions";
      align-items: start;
      column-gap: 8px;
      margin: 0;
      border-radius: 4px;
      transition: background 120ms ease, box-shadow 120ms ease;
    }

    .block:hover,
    .block:focus-within {
      background: color-mix(in srgb, var(--accent) 5%, transparent);
      box-shadow: inset 3px 0 0 color-mix(in srgb, var(--accent) 38%, transparent);
    }

    .block-body {
      grid-area: body;
      padding: 0 8px;
      min-width: 0;
    }

    .block-actions {
      grid-area: actions;
      display: flex;
      gap: 6px;
      align-self: start;
      padding: 8px 8px 0 0;
      opacity: 0;
      pointer-events: none;
      transition: opacity 120ms ease;
    }

    .block:hover .block-actions,
    .block:focus-within .block-actions {
      opacity: 1;
      pointer-events: auto;
    }

    .mini-action {
      appearance: none;
      border: 1px solid var(--line);
      border-radius: 999px;
      width: 30px;
      height: 30px;
      padding: 0;
      background: color-mix(in srgb, var(--panel) 82%, var(--bg) 18%);
      color: var(--ink);
      cursor: pointer;
      display: inline-grid;
      place-items: center;
    }

    .mini-action:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--vscode-toolbar-hoverBackground, color-mix(in srgb, var(--panel) 68%, var(--bg) 32%));
    }

    .mini-action svg {
      width: 14px;
      height: 14px;
      stroke: currentColor;
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .mini {
      appearance: none;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 4px 10px;
      background: color-mix(in srgb, var(--panel) 82%, var(--bg) 18%);
      color: var(--muted);
      cursor: pointer;
      font-size: 12px;
      line-height: 1.4;
      white-space: nowrap;
      justify-self: start;
    }

    .mini:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--vscode-toolbar-hoverBackground, color-mix(in srgb, var(--panel) 68%, var(--bg) 32%));
    }

    .editable {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: inherit;
      font-family: var(--font-doc);
      white-space: pre-wrap;
    }

    .editable[data-placeholder]:empty::before {
      content: attr(data-placeholder);
      color: var(--muted);
      opacity: 0.72;
    }

    .heading-wrap {
      position: relative;
      padding-right: 120px;
    }

    .heading-level {
      position: absolute;
      top: 2px;
      right: 0;
      width: 64px;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 4px 8px;
      background: color-mix(in srgb, var(--paper) 88%, var(--bg) 12%);
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-4px);
      transition: opacity 120ms ease, transform 120ms ease;
    }

    .heading-wrap:hover .heading-level,
    .heading-wrap:focus-within .heading-level,
    .block:focus-within .heading-level {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .heading {
      font-weight: 600;
      line-height: 1.25;
    }

    .heading.level-1 { font-size: 2em; margin: 0; padding-bottom: 0.3em; border-bottom: 1px solid var(--line); }
    .heading.level-2 { font-size: 1.5em; margin: 0; padding-bottom: 0.3em; border-bottom: 1px solid var(--line); }
    .heading.level-3 { font-size: 1.25em; margin: 0; }
    .heading.level-4,
    .heading.level-5,
    .heading.level-6 { font-size: 1em; margin: 0; }

    .paragraph {
      min-height: 34px;
      font-size: 14px;
      line-height: 22px;
      margin: 0;
    }

    .list,
    .checklist {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin: 0 0 0.7em;
    }

    .list .mini,
    .checklist .mini {
      opacity: 0;
      pointer-events: none;
      transform: translateY(-2px);
      transition: opacity 120ms ease, transform 120ms ease;
    }

    .list-row:hover .mini,
    .list-row:focus-within .mini,
    .check-row:hover .mini,
    .check-row:focus-within .mini,
    .list:hover > .mini,
    .list:focus-within > .mini,
    .checklist:hover > .mini,
    .checklist:focus-within > .mini,
    .block:focus-within .list .mini,
    .block:focus-within .checklist .mini {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .list-row,
    .check-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
    }

    .bullet {
      width: 20px;
      text-align: center;
      color: inherit;
      font-size: 16px;
      line-height: 22px;
    }

    .line-input {
      width: 100%;
      padding: 2px 0;
      border: none;
      outline: none;
      background: transparent;
      color: inherit;
      font-family: var(--font-doc);
      font-size: 14px;
      line-height: 22px;
    }

    .line-input::placeholder {
      color: var(--muted);
      opacity: 0.72;
    }

    .check-row input[type="checkbox"] {
      width: 16px;
      height: 16px;
      margin-top: 4px;
      accent-color: var(--accent);
    }

    .stack {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 12px;
    }

    .code-meta {
      max-height: 0;
      margin-bottom: 0;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: max-height 160ms ease, margin-bottom 160ms ease, opacity 120ms ease;
    }

    .code-shell:hover .code-meta,
    .code-shell:focus-within .code-meta,
    .block:focus-within .code-meta {
      max-height: 80px;
      margin-bottom: 12px;
      opacity: 1;
      pointer-events: auto;
    }

    .field {
      min-width: 160px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .field input,
    .field textarea {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px 12px;
      background: color-mix(in srgb, var(--paper) 84%, var(--bg) 16%);
      color: var(--ink);
      outline: none;
    }

    .image-source {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin: 0 0 12px;
    }

    .image-controls {
      max-height: 0;
      margin-bottom: 0;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: max-height 160ms ease, margin-bottom 160ms ease, opacity 120ms ease;
    }

    .image-shell:hover .image-controls,
    .image-shell:focus-within .image-controls,
    .image-shell.empty .image-controls,
    .block:focus-within .image-controls {
      max-height: 180px;
      margin-bottom: 12px;
      opacity: 1;
      pointer-events: auto;
    }

    .image-drop {
      flex: 1 1 220px;
      min-height: 42px;
      border: 1px dashed var(--line);
      border-radius: 12px;
      padding: 10px 14px;
      color: var(--muted);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
    }

    .image-drop.active {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--accent);
    }

    .code-editor {
      width: 100%;
      min-height: 160px;
      border: 1px solid var(--line);
      border-radius: 3px;
      padding: 16px;
      background: var(--vscode-textCodeBlock-background, color-mix(in srgb, var(--bg) 82%, black 18%));
      color: var(--ink);
      font-family: var(--font-code);
      font-size: 14px;
      line-height: 1.6;
      resize: vertical;
      outline: none;
    }

    .image-preview {
      margin-top: 8px;
      overflow: hidden;
      border-radius: 0;
      border: none;
      background: transparent;
    }

    .image-preview img {
      display: block;
      width: 100%;
      height: auto;
    }

    .divider {
      margin: 10px 0;
      border: none;
      border-top: 1px solid var(--line-strong);
    }

    .empty-state {
      padding: 58px 18px;
      text-align: center;
      color: var(--muted);
      border: 1px dashed var(--line);
      border-radius: 4px;
      background: color-mix(in srgb, var(--paper) 78%, transparent);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 980px) {
      .toolbar {
        grid-template-columns: 1fr;
      }

      .toolbelt,
      .toolbar-actions {
        justify-content: flex-start;
      }

      .page {
        padding: 1em 16px calc(100vh - 22px);
      }

      .heading-wrap {
        padding-right: 0;
      }

      .heading-level {
        position: static;
        margin-bottom: 10px;
      }

      .block {
        grid-template-columns: minmax(0, 1fr);
        grid-template-areas:
          "actions"
          "body";
      }

      .block-actions {
        justify-self: end;
        padding: 8px 8px 0 8px;
      }
    }
  </style>
</head>
<body>
  <div class="reveal-zone" id="revealZone"></div>
  <div class="editor-dock" id="editorDock">
    <button class="editor-handle" id="editorHandle" title="Open editor toolbar">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M7 12h10"/><path d="M10 17h4"/><path d="m15 4 5 5"/><path d="m14 5 5 5"/></svg>
      <span class="editor-handle-label">editor</span>
    </button>
  </div>
  <div class="app">
    <header class="toolbar-shell" id="toolbarShell">
      <div class="toolbar-frame">
        <div class="toolbar">
          <div class="brand">
            <div class="brand-mark">
              <img src="${logoUri}" alt="Readme Maker logo" />
            </div>
            <div class="brand-copy">
              <strong>Readme Maker</strong>
              <span id="fileName">README.md</span>
            </div>
          </div>
          <div class="toolbelt" id="toolbelt"></div>
          <div class="toolbar-actions">
            <button class="icon-btn" id="pinButton" title="Pin editor toolbar">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6"/><path d="M10 4v5l-3 4h10l-3-4V4"/><path d="M12 13v7"/></svg>
              <span class="sr-only">Pin editor toolbar</span>
            </button>
            <button class="icon-btn" id="previewButton" title="Open VS Code Markdown preview">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span class="sr-only">Open VS Code Markdown preview</span>
            </button>
            <button class="icon-btn" id="sourceButton" title="Open source view">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h10"/><path d="M8 12h10"/><path d="M8 18h10"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/></svg>
              <span class="sr-only">Open source view</span>
            </button>
            <button class="icon-btn" id="copyButton" title="Copy Markdown">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M5 15V7a2 2 0 0 1 2-2h8"/></svg>
              <span class="sr-only">Copy Markdown</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="workspace">
      <div class="stage">
        <section class="page">
          <input id="imageFileInput" class="sr-only" type="file" accept="image/*" />
          <div id="pageContent"></div>
        </section>
      </div>
    </main>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const savedState = vscode.getState() || {};
    const labels = {
      title: "Heading",
      paragraph: "Paragraph",
      list: "List",
      checklist: "Checklist",
      code: "Code",
      image: "Image",
      divider: "Divider"
    };
    const toolTypes = ["title", "paragraph", "list", "checklist", "code", "image", "divider"];

    let fileName = typeof savedState.fileName === "string" ? savedState.fileName : "README.md";
    let blocks = Array.isArray(savedState.blocks) ? normalizeBlocks(savedState.blocks) : [];
    let syncTimer = undefined;
    let draggingToolType = "";
    let hideToolbarTimer = undefined;
    let toolbarPinned = false;
    let compositionDepth = 0;
    let pendingSyncAfterComposition = false;
    let pendingImageBlockId = "";

    const pageContent = document.getElementById("pageContent");
    const fileNameEl = document.getElementById("fileName");
    const toolbeltEl = document.getElementById("toolbelt");
    const revealZoneEl = document.getElementById("revealZone");
    const toolbarShellEl = document.getElementById("toolbarShell");
    const editorDockEl = document.getElementById("editorDock");
    const editorHandleEl = document.getElementById("editorHandle");
    const pinButtonEl = document.getElementById("pinButton");
    const imageFileInputEl = document.getElementById("imageFileInput");

    function createId() {
      return "block-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    }

    function normalizeBlocks(rawBlocks) {
      return rawBlocks.map((block, index) => ({
        id: typeof block.id === "string" ? block.id : "block-" + index,
        type: typeof block.type === "string" ? block.type : "paragraph",
        text: typeof block.text === "string" ? block.text : "",
        level: Number(block.level) || 1,
        language: typeof block.language === "string" ? block.language : "",
        code: typeof block.code === "string" ? block.code : "",
        alt: typeof block.alt === "string" ? block.alt : "",
        url: typeof block.url === "string" ? block.url : "",
        previewUrl: typeof block.previewUrl === "string" ? block.previewUrl : "",
        items: Array.isArray(block.items) ? block.items.map((item) => String(item)) : [],
        checklistItems: Array.isArray(block.checklistItems)
          ? block.checklistItems.map((item) => ({
              checked: !!item.checked,
              text: String(item.text || "")
            }))
          : []
      }));
    }

    function iconSvg(type) {
      const icons = {
        title: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14"/><path d="M12 6v12"/><path d="M8 18h8"/></svg>',
        paragraph: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h9"/></svg>',
        list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7h10"/><path d="M9 12h10"/><path d="M9 17h10"/><path d="M5 7h.01"/><path d="M5 12h.01"/><path d="M5 17h.01"/></svg>',
        checklist: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="4" height="4" rx="1"/><rect x="4" y="15" width="4" height="4" rx="1"/><path d="M12 7h8"/><path d="M12 17h8"/><path d="m5 17 1.2 1.2L8.5 16"/></svg>',
        code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 7-4 5 4 5"/><path d="m16 7 4 5-4 5"/><path d="m13 4-2 16"/></svg>',
        image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 13 2.5-2.5L16 16"/><circle cx="9" cy="9" r="1.2"/></svg>',
        divider: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16"/><path d="M4 8h3"/><path d="M17 8h3"/><path d="M4 16h3"/><path d="M17 16h3"/></svg>'
      };
      return icons[type] || icons.paragraph;
    }

    function actionIconSvg(action) {
      const icons = {
        moveUp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
        moveDown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
        deleteBlock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 7V5h6v2"/><path d="M6 7l1 12h10l1-12"/></svg>'
      };
      return icons[action] || "";
    }

    function renderActionButton(action, index, label) {
      return '<button class="mini-action" data-action="' + action + '" data-index="' + index + '" title="' + label + '">' +
        actionIconSvg(action) +
        '<span class="sr-only">' + label + '</span>' +
      '</button>';
    }

    function newBlock(type) {
      if (type === "title") return { id: createId(), type, level: 1, text: "Project Title" };
      if (type === "paragraph") return { id: createId(), type, text: "Write the section directly on the preview canvas." };
      if (type === "list") return { id: createId(), type, items: ["First point", "Second point"] };
      if (type === "checklist") return { id: createId(), type, checklistItems: [{ checked: false, text: "Next task" }] };
      if (type === "code") return { id: createId(), type, language: "bash", code: "npm install\\nnpm run compile" };
      if (type === "image") return { id: createId(), type, alt: "Screenshot", url: "" };
      return { id: createId(), type: "divider" };
    }

    function saveState() {
      vscode.setState({ fileName, blocks });
    }

    function queueSync() {
      saveState();
      window.clearTimeout(syncTimer);
      if (compositionDepth > 0) {
        pendingSyncAfterComposition = true;
        return;
      }

      pendingSyncAfterComposition = false;
      syncTimer = window.setTimeout(() => {
        vscode.postMessage({ type: "applyBlocks", blocks });
      }, 120);
    }

    function isTextEditingTarget(target) {
      return target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.dataset.role === "textContent");
    }

    function setToolbarVisible(visible) {
      window.clearTimeout(hideToolbarTimer);
      if (toolbarPinned) {
        document.body.classList.add("toolbar-pinned");
        document.body.classList.add("toolbar-visible");
        return;
      }

      document.body.classList.remove("toolbar-pinned");
      if (visible) {
        document.body.classList.add("toolbar-visible");
        return;
      }

      hideToolbarTimer = window.setTimeout(() => {
        document.body.classList.remove("toolbar-visible");
      }, 140);
    }

    function syncToolbarPinnedUi() {
      document.body.classList.toggle("toolbar-pinned", toolbarPinned);
      pinButtonEl.classList.toggle("active", toolbarPinned);
      pinButtonEl.setAttribute("aria-pressed", toolbarPinned ? "true" : "false");
      pinButtonEl.title = toolbarPinned ? "Unpin editor toolbar" : "Pin editor toolbar";
      setToolbarVisible(toolbarPinned);
    }

    function insertBlock(index, type) {
      const next = [...blocks];
      next.splice(index, 0, newBlock(type));
      blocks = next;
      render();
      queueSync();
    }

    function deleteBlock(index) {
      blocks = blocks.filter((_, currentIndex) => currentIndex !== index);
      render();
      queueSync();
    }

    function moveBlock(index, delta) {
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= blocks.length) {
        return;
      }

      const next = [...blocks];
      const selected = next[index];
      next.splice(index, 1);
      next.splice(nextIndex, 0, selected);
      blocks = next;
      render();
      queueSync();
    }

    function setField(index, field, value) {
      blocks[index] = { ...blocks[index], [field]: value };
      queueSync();
    }

    function setListItem(index, itemIndex, value) {
      const items = [...(blocks[index].items || [])];
      items[itemIndex] = value;
      blocks[index] = { ...blocks[index], items };
      queueSync();
    }

    function setChecklistItem(index, itemIndex, patch) {
      const items = [...(blocks[index].checklistItems || [])];
      items[itemIndex] = { ...items[itemIndex], ...patch };
      blocks[index] = { ...blocks[index], checklistItems: items };
      queueSync();
    }

    function getBlockIndexById(blockId) {
      return blocks.findIndex((block) => block.id === blockId);
    }

    function setImageSource(blockId, url, previewUrl) {
      const index = getBlockIndexById(blockId);
      if (index < 0 || blocks[index].type !== "image") {
        return;
      }

      blocks[index] = {
        ...blocks[index],
        url,
        previewUrl: previewUrl || url
      };
      render();
      queueSync();
    }

    function addRowItem(index) {
      const block = blocks[index];
      if (block.type === "list") {
        blocks[index] = { ...block, items: [...(block.items || []), "New item"] };
      }
      if (block.type === "checklist") {
        blocks[index] = { ...block, checklistItems: [...(block.checklistItems || []), { checked: false, text: "New task" }] };
      }
      render();
      queueSync();
    }

    function removeRowItem(index, itemIndex) {
      const block = blocks[index];
      if (block.type === "list") {
        blocks[index] = { ...block, items: (block.items || []).filter((_, currentIndex) => currentIndex !== itemIndex) };
      }
      if (block.type === "checklist") {
        blocks[index] = { ...block, checklistItems: (block.checklistItems || []).filter((_, currentIndex) => currentIndex !== itemIndex) };
      }
      render();
      queueSync();
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function renderTools() {
      toolbeltEl.innerHTML = toolTypes.map((type) => {
        return '<button class="tool" draggable="true" data-tool-type="' + type + '" title="' + labels[type] + '">' +
          iconSvg(type) +
          '<span class="sr-only">' + labels[type] + '</span>' +
        '</button>';
      }).join("");
    }

    function renderDropzone(index) {
      return '<div class="dropzone" data-index="' + index + '"></div>';
    }

    function renderList(block, index) {
      const rows = (block.items || []).map((item, itemIndex) => {
        return '<div class="list-row">' +
          '<div class="bullet">&bull;</div>' +
          '<input class="line-input" data-role="listText" data-index="' + index + '" data-item-index="' + itemIndex + '" value="' + escapeHtml(item) + '" placeholder="List item" />' +
          '<button class="mini" data-action="removeItem" data-index="' + index + '" data-item-index="' + itemIndex + '">Delete</button>' +
        '</div>';
      }).join("");

      return '<div class="list">' + rows + '<button class="mini" data-action="addItem" data-index="' + index + '">Add item</button></div>';
    }

    function renderChecklist(block, index) {
      const rows = (block.checklistItems || []).map((item, itemIndex) => {
        return '<div class="check-row">' +
          '<input type="checkbox" data-role="checkToggle" data-index="' + index + '" data-item-index="' + itemIndex + '" ' + (item.checked ? "checked" : "") + ' />' +
          '<input class="line-input" data-role="checkText" data-index="' + index + '" data-item-index="' + itemIndex + '" value="' + escapeHtml(item.text) + '" placeholder="Checklist item" />' +
          '<button class="mini" data-action="removeItem" data-index="' + index + '" data-item-index="' + itemIndex + '">Delete</button>' +
        '</div>';
      }).join("");

      return '<div class="checklist">' + rows + '<button class="mini" data-action="addItem" data-index="' + index + '">Add item</button></div>';
    }

    function renderCode(block, index) {
      return '<div class="code-shell">' +
        '<div class="stack code-meta">' +
          '<label class="field">Language<input data-field="language" data-index="' + index + '" value="' + escapeHtml(block.language || "") + '" placeholder="bash" /></label>' +
        '</div>' +
        '<textarea class="code-editor" data-field="code" data-index="' + index + '" placeholder="Code block">' + escapeHtml(block.code || "") + '</textarea>' +
      '</div>';
    }

    function renderImage(block, index) {
      const previewSource = block.previewUrl || block.url;
      const shellClass = previewSource ? "image-shell" : "image-shell empty";
      const preview = previewSource
        ? '<div class="image-preview"><img src="' + escapeHtml(previewSource) + '" alt="' + escapeHtml(block.alt || "") + '" /></div>'
        : '';

      return '<div class="' + shellClass + '">' +
        '<div class="image-controls">' +
          '<div class="image-source">' +
            '<button class="mini" data-action="pickImageFile" data-block-id="' + escapeHtml(block.id) + '">Choose image</button>' +
            '<div class="image-drop" data-role="imageDrop" data-block-id="' + escapeHtml(block.id) + '">Drop an image file here</div>' +
          '</div>' +
          '<div class="stack">' +
            '<label class="field">Alt text<input data-field="alt" data-index="' + index + '" value="' + escapeHtml(block.alt || "") + '" /></label>' +
            '<label class="field" style="flex:1;">Image URL or path<input data-field="url" data-index="' + index + '" value="' + escapeHtml(block.url || "") + '" placeholder="https://... or ./assets/image.png" /></label>' +
          '</div>' +
        '</div>' +
        preview +
      '</div>';
    }

    function renderBlock(block, index) {
      const actions = '<div class="block-actions">' +
        renderActionButton("moveUp", index, "Move block up") +
        renderActionButton("moveDown", index, "Move block down") +
        renderActionButton("deleteBlock", index, "Delete block") +
      '</div>';

      if (block.type === "title") {
        const level = Math.max(1, Math.min(6, Number(block.level) || 1));
        return '<article class="block">' + actions +
          '<div class="block-body">' +
            '<div class="heading-wrap">' +
              '<select class="heading-level" data-field="level" data-index="' + index + '">' +
                [1, 2, 3, 4].map((value) => '<option value="' + value + '" ' + (value === level ? "selected" : "") + '>H' + value + '</option>').join("") +
              '</select>' +
              '<div class="editable heading level-' + level + '" contenteditable="true" spellcheck="false" data-role="textContent" data-index="' + index + '" data-placeholder="Heading">' + escapeHtml(block.text || "") + '</div>' +
            '</div>' +
          '</div>' +
        '</article>';
      }

      if (block.type === "paragraph") {
        return '<article class="block">' + actions +
          '<div class="block-body">' +
            '<div class="editable paragraph" contenteditable="true" spellcheck="true" data-role="textContent" data-index="' + index + '" data-placeholder="Write a paragraph...">' + escapeHtml(block.text || "") + '</div>' +
          '</div>' +
        '</article>';
      }

      if (block.type === "list") {
        return '<article class="block">' + actions + '<div class="block-body">' + renderList(block, index) + '</div></article>';
      }

      if (block.type === "checklist") {
        return '<article class="block">' + actions + '<div class="block-body">' + renderChecklist(block, index) + '</div></article>';
      }

      if (block.type === "code") {
        return '<article class="block">' + actions + '<div class="block-body">' + renderCode(block, index) + '</div></article>';
      }

      if (block.type === "image") {
        return '<article class="block">' + actions + '<div class="block-body">' + renderImage(block, index) + '</div></article>';
      }

      return '<article class="block">' + actions + '<div class="block-body"><hr class="divider" /></div></article>';
    }

    function render() {
      fileNameEl.textContent = fileName;
      renderTools();

      if (!blocks.length) {
        pageContent.innerHTML = renderDropzone(0) + '<div class="empty-state">The canvas is empty. Drag a tool from the top bar and drop it here.</div>' + renderDropzone(0);
        return;
      }

      pageContent.innerHTML = blocks.map((block, index) => {
        return renderDropzone(index) + renderBlock(block, index);
      }).join("") + renderDropzone(blocks.length);
    }

    function clearDropStates() {
      document.querySelectorAll(".dropzone.active").forEach((node) => node.classList.remove("active"));
    }

    window.addEventListener("message", (event) => {
      const message = event.data;
      if (!message) {
        return;
      }

      if (message.type === "imageImported") {
        if (typeof message.blockId === "string" && typeof message.url === "string") {
          setImageSource(message.blockId, message.url, typeof message.previewUrl === "string" ? message.previewUrl : message.url);
        }
        return;
      }

      if (message.type !== "setDocument") {
        return;
      }

      fileName = typeof message.fileName === "string" ? message.fileName : fileName;
      blocks = normalizeBlocks(Array.isArray(message.blocks) ? message.blocks : []);
      saveState();
      render();
    });

    revealZoneEl.addEventListener("mouseenter", () => setToolbarVisible(true));
    editorDockEl.addEventListener("mouseenter", () => setToolbarVisible(true));
    editorDockEl.addEventListener("focusin", () => setToolbarVisible(true));
    editorDockEl.addEventListener("mouseleave", () => setToolbarVisible(false));
    toolbarShellEl.addEventListener("mouseenter", () => setToolbarVisible(true));
    toolbarShellEl.addEventListener("mouseleave", () => setToolbarVisible(false));
    document.addEventListener("mousemove", (event) => {
      if (event.clientY <= 16) {
        setToolbarVisible(true);
      }
    });
    editorHandleEl.addEventListener("focus", () => setToolbarVisible(true));
    pinButtonEl.addEventListener("click", () => {
      toolbarPinned = !toolbarPinned;
      syncToolbarPinnedUi();
    });

    document.body.addEventListener("dragstart", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const tool = target.closest("[data-tool-type]");
      if (!(tool instanceof HTMLElement)) {
        return;
      }

      const toolType = tool.dataset.toolType;
      if (!toolType) {
        return;
      }

      draggingToolType = toolType;
      setToolbarVisible(true);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/plain", toolType);
      }
    });

    document.body.addEventListener("dragend", () => {
      draggingToolType = "";
      clearDropStates();
      setToolbarVisible(false);
    });

    document.body.addEventListener("dragover", (event) => {
      const zone = event.target instanceof Element ? event.target.closest(".dropzone") : null;
      if (!zone || !draggingToolType) {
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    });

    document.body.addEventListener("dragenter", (event) => {
      const zone = event.target instanceof Element ? event.target.closest(".dropzone") : null;
      if (!(zone instanceof HTMLElement) || !draggingToolType) {
        return;
      }

      clearDropStates();
      zone.classList.add("active");
    });

    document.body.addEventListener("dragleave", (event) => {
      const zone = event.target instanceof Element ? event.target.closest(".dropzone") : null;
      if (!(zone instanceof HTMLElement)) {
        return;
      }

      if (!zone.contains(event.relatedTarget)) {
        zone.classList.remove("active");
      }
    });

    document.body.addEventListener("dragover", (event) => {
      const imageDrop = event.target instanceof Element ? event.target.closest('[data-role="imageDrop"]') : null;
      if (!(imageDrop instanceof HTMLElement) || !event.dataTransfer?.files?.length) {
        return;
      }

      event.preventDefault();
      imageDrop.classList.add("active");
    });

    document.body.addEventListener("dragleave", (event) => {
      const imageDrop = event.target instanceof Element ? event.target.closest('[data-role="imageDrop"]') : null;
      if (!(imageDrop instanceof HTMLElement)) {
        return;
      }

      if (!imageDrop.contains(event.relatedTarget)) {
        imageDrop.classList.remove("active");
      }
    });

    document.body.addEventListener("drop", (event) => {
      const imageDrop = event.target instanceof Element ? event.target.closest('[data-role="imageDrop"]') : null;
      if (imageDrop instanceof HTMLElement && event.dataTransfer?.files?.length) {
        event.preventDefault();
        imageDrop.classList.remove("active");
        const file = event.dataTransfer.files[0];
        const blockId = imageDrop.dataset.blockId;
        if (file && blockId) {
          void importImageFile(blockId, file);
        }
        return;
      }

      const zone = event.target instanceof Element ? event.target.closest(".dropzone") : null;
      if (!(zone instanceof HTMLElement) || !draggingToolType) {
        return;
      }

      event.preventDefault();
      const index = Number(zone.dataset.index);
      clearDropStates();
      insertBlock(Number.isNaN(index) ? blocks.length : index, draggingToolType);
      draggingToolType = "";
      setToolbarVisible(false);
    });

    document.body.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const actionTarget = target.closest("[data-action]");
      if (!(actionTarget instanceof HTMLElement)) {
        return;
      }

      const action = actionTarget.dataset.action;
      if (!action) {
        return;
      }

      if (action === "pickImageFile") {
        const blockId = actionTarget.dataset.blockId;
        if (!blockId || !(imageFileInputEl instanceof HTMLInputElement)) {
          return;
        }

        pendingImageBlockId = blockId;
        imageFileInputEl.value = "";
        imageFileInputEl.click();
        return;
      }

      const index = Number(actionTarget.dataset.index);
      if (Number.isNaN(index)) {
        return;
      }

      if (action === "deleteBlock") {
        deleteBlock(index);
        return;
      }

      if (action === "moveUp") {
        moveBlock(index, -1);
        return;
      }

      if (action === "moveDown") {
        moveBlock(index, 1);
        return;
      }

      if (action === "addItem") {
        addRowItem(index);
        return;
      }

      if (action === "removeItem") {
        removeRowItem(index, Number(actionTarget.dataset.itemIndex));
      }
    });

    document.body.addEventListener("compositionstart", (event) => {
      if (!isTextEditingTarget(event.target)) {
        return;
      }

      compositionDepth += 1;
    });

    document.body.addEventListener("compositionend", (event) => {
      if (!isTextEditingTarget(event.target)) {
        return;
      }

      compositionDepth = Math.max(0, compositionDepth - 1);
      if (compositionDepth === 0 && pendingSyncAfterComposition) {
        queueSync();
      }
    });

    document.body.addEventListener("input", (event) => {
      const target = event.target;

      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        const index = Number(target.dataset.index);
        if (Number.isNaN(index)) {
          return;
        }

        const field = target.dataset.field;
        if (field) {
          const value = target instanceof HTMLSelectElement ? Number(target.value) : target.value;
          if (field === "url") {
            blocks[index] = { ...blocks[index], [field]: value, previewUrl: "" };
            queueSync();
          } else {
            setField(index, field, value);
          }
          if (field === "level") {
            render();
          }
          return;
        }

        const itemIndex = Number(target.dataset.itemIndex);
        if (Number.isNaN(itemIndex)) {
          return;
        }

        if (target.dataset.role === "listText") {
          setListItem(index, itemIndex, target.value);
          return;
        }

        if (target.dataset.role === "checkText") {
          setChecklistItem(index, itemIndex, { text: target.value });
          return;
        }

        if (target.dataset.role === "checkToggle" && target instanceof HTMLInputElement) {
          setChecklistItem(index, itemIndex, { checked: target.checked });
        }
      }

      if (target instanceof HTMLElement && target.dataset.role === "textContent") {
        const index = Number(target.dataset.index);
        if (Number.isNaN(index)) {
          return;
        }

        setField(index, "text", target.innerText.replace(/\\n{3,}/g, "\\n\\n"));
      }
    });

    document.getElementById("copyButton").addEventListener("click", () => {
      vscode.postMessage({ type: "copyMarkdown" });
    });

    document.getElementById("sourceButton").addEventListener("click", () => {
      vscode.postMessage({ type: "openSource" });
    });

    document.getElementById("previewButton").addEventListener("click", () => {
      vscode.postMessage({ type: "openPreview" });
    });

    imageFileInputEl.addEventListener("change", () => {
      if (!(imageFileInputEl instanceof HTMLInputElement) || !imageFileInputEl.files?.length || !pendingImageBlockId) {
        return;
      }

      const file = imageFileInputEl.files[0];
      void importImageFile(pendingImageBlockId, file);
      pendingImageBlockId = "";
      imageFileInputEl.value = "";
    });

    async function importImageFile(blockId, file) {
      if (!file || !isImageFile(file)) {
        return;
      }

      const dataUrl = await readFileAsDataUrl(file);
      vscode.postMessage({
        type: "importImageFile",
        blockId,
        fileName: file.name || "image",
        dataUrl
      });
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });
    }

    function isImageFile(file) {
      if (typeof file.type === "string" && file.type.startsWith("image/")) {
        return true;
      }

      return /\\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(file.name || "");
    }

    syncToolbarPinnedUi();
    render();
    vscode.postMessage({ type: "ready" });
  </script>
</body>
</html>`;
}

function createNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";

  for (let index = 0; index < 32; index += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return value;
}
