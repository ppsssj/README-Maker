
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
    let compositionDepth = 0;
    let pendingSyncAfterComposition = false;
    let pendingImageBlockId = "";

    const pageContent = document.getElementById("pageContent");
    const fileNameEl = document.getElementById("fileName");
    const toolbeltEl = document.getElementById("toolbelt");
    const revealZoneEl = document.getElementById("revealZone");
    const toolbarShellEl = document.getElementById("toolbarShell");
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
      if (type === "code") return { id: createId(), type, language: "bash", code: "npm install\nnpm run compile" };
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
      if (visible) {
        document.body.classList.add("toolbar-visible");
        return;
      }

      hideToolbarTimer = window.setTimeout(() => {
        document.body.classList.remove("toolbar-visible");
      }, 140);
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
      const preview = previewSource
        ? '<div class="image-preview"><img src="' + escapeHtml(previewSource) + '" alt="' + escapeHtml(block.alt || "") + '" /></div>'
        : '';

      return '<div>' +
        '<div class="image-source">' +
          '<button class="mini" data-action="pickImageFile" data-block-id="' + escapeHtml(block.id) + '">Choose image</button>' +
          '<div class="image-drop" data-role="imageDrop" data-block-id="' + escapeHtml(block.id) + '">Drop an image file here</div>' +
        '</div>' +
        '<div class="stack">' +
          '<label class="field">Alt text<input data-field="alt" data-index="' + index + '" value="' + escapeHtml(block.alt || "") + '" /></label>' +
          '<label class="field" style="flex:1;">Image URL or path<input data-field="url" data-index="' + index + '" value="' + escapeHtml(block.url || "") + '" placeholder="https://... or ./assets/image.png" /></label>' +
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
    toolbarShellEl.addEventListener("mouseenter", () => setToolbarVisible(true));
    toolbarShellEl.addEventListener("mouseleave", () => setToolbarVisible(false));
    document.addEventListener("mousemove", (event) => {
      if (event.clientY <= 16) {
        setToolbarVisible(true);
      }
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

        setField(index, "text", target.innerText.replace(/\n{3,}/g, "\n\n"));
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

      return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(file.name || "");
    }

    render();
    vscode.postMessage({ type: "ready" });
  