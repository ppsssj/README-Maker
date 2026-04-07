import * as path from "path";
import * as vscode from "vscode";
import { generateMarkdown, parseMarkdown, ReadmeBlock } from "./markdown";
import { getEditorHtml } from "./webview";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("readmeMaker.openWysiwyg", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "markdown") {
        void vscode.window.showWarningMessage("Readme Maker: open a Markdown file first.");
        return;
      }

      await vscode.commands.executeCommand(
        "vscode.openWith",
        editor.document.uri,
        ReadmeWysiwygEditorProvider.viewType,
        vscode.ViewColumn.Beside
      );
    })
  );

  context.subscriptions.push(ReadmeWysiwygEditorProvider.register(context));
}

export function deactivate(): void {}

class ReadmeWysiwygEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "readmeMaker.wysiwygReadme";

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ReadmeWysiwygEditorProvider();

    return vscode.window.registerCustomEditorProvider(ReadmeWysiwygEditorProvider.viewType, provider, {
      webviewOptions: {
        retainContextWhenHidden: true
      },
      supportsMultipleEditorsPerDocument: false
    });
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    const resourceRoot = vscode.workspace.getWorkspaceFolder(document.uri)?.uri ?? vscode.Uri.file(path.dirname(document.uri.fsPath));
    const extensionRoot = vscode.Uri.file(path.resolve(__dirname, ".."));
    const logoUri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(extensionRoot, "assets", "logo3.png")).toString();

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [resourceRoot, extensionRoot]
    };

    webviewPanel.webview.html = getEditorHtml(webviewPanel.webview, logoUri);

    const syncState = {
      lastAppliedText: normalizeText(document.getText()),
      lastSentText: ""
    };

    const updateWebview = (force = false): void => {
      const text = document.getText();
      const normalizedText = normalizeText(text);
      if (!force && syncState.lastSentText === normalizedText) {
        return;
      }

      syncState.lastAppliedText = normalizedText;
      syncState.lastSentText = normalizedText;

      void webviewPanel.webview.postMessage({
        type: "setDocument",
        fileName: path.basename(document.uri.fsPath),
        blocks: withPreviewUrls(parseMarkdown(text), document, webviewPanel.webview)
      });
    };

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() !== document.uri.toString()) {
        return;
      }

      const nextText = normalizeText(event.document.getText());
      if (nextText === syncState.lastAppliedText) {
        syncState.lastSentText = nextText;
        return;
      }

      updateWebview(true);
    });

    const messageSubscription = webviewPanel.webview.onDidReceiveMessage(async (message: unknown) => {
      if (!isEditorMessage(message)) {
        return;
      }

      if (message.type === "ready") {
        updateWebview(true);
        return;
      }

      if (message.type === "copyMarkdown") {
        const text = document.getText();
        await vscode.env.clipboard.writeText(text);
        void vscode.window.setStatusBarMessage("Readme Maker: Markdown copied.", 2000);
        return;
      }

      if (message.type === "applyBlocks") {
        const nextText = generateMarkdown((message.blocks ?? []).filter(isReadmeBlock));
        const normalizedNextText = normalizeText(nextText);
        if (normalizedNextText === normalizeText(document.getText())) {
          return;
        }

        const documentText = applyDocumentEol(nextText, document);
        const normalizedDocumentText = normalizeText(documentText);

        syncState.lastAppliedText = normalizedDocumentText;
        syncState.lastSentText = normalizedDocumentText;
        await replaceDocument(document, documentText);
        return;
      }

      if (message.type === "importImageFile") {
        if (!isImageImportMessage(message)) {
          return;
        }

        try {
          const imageAsset = await importImageAsset(document, message.fileName, message.dataUrl);
          await webviewPanel.webview.postMessage({
            type: "imageImported",
            blockId: message.blockId,
            url: imageAsset.markdownPath,
            previewUrl: webviewPanel.webview.asWebviewUri(imageAsset.fileUri).toString()
          });
          void vscode.window.setStatusBarMessage(`Readme Maker: Imported ${path.basename(imageAsset.fileUri.fsPath)}.`, 2000);
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Unknown error";
          void vscode.window.showErrorMessage(`Readme Maker: failed to import image. ${detail}`);
        }
        return;
      }

      if (message.type === "openSource") {
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        return;
      }

      if (message.type === "openPreview") {
        await vscode.commands.executeCommand("markdown.showPreviewToSide", document.uri);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      messageSubscription.dispose();
    });

    updateWebview(true);
  }
}

async function replaceDocument(document: vscode.TextDocument, text: string): Promise<void> {
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, getDocumentRange(document), text);
  await vscode.workspace.applyEdit(edit);
}

function getDocumentRange(document: vscode.TextDocument): vscode.Range {
  const lastLine = Math.max(document.lineCount - 1, 0);
  const lastCharacter = document.lineCount > 0 ? document.lineAt(lastLine).text.length : 0;
  return new vscode.Range(0, 0, lastLine, lastCharacter);
}

function withPreviewUrls(
  blocks: ReadmeBlock[],
  document: vscode.TextDocument,
  webview: vscode.Webview
): ReadmeBlock[] {
  return blocks.map((block) => {
    if (block.type !== "image") {
      return block;
    }

    const previewUrl = resolvePreviewUrl(block.url, document, webview);
    return previewUrl ? { ...block, previewUrl } : block;
  });
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function applyDocumentEol(text: string, document: vscode.TextDocument): string {
  if (document.eol === vscode.EndOfLine.CRLF) {
    return text.replace(/\n/g, "\r\n");
  }

  return normalizeText(text);
}

function resolvePreviewUrl(
  imageUrl: string | undefined,
  document: vscode.TextDocument,
  webview: vscode.Webview
): string | undefined {
  const value = (imageUrl ?? "").trim();
  if (!value) {
    return undefined;
  }

  if (/^(https?:|data:)/i.test(value)) {
    return value;
  }

  if (/^file:/i.test(value)) {
    return webview.asWebviewUri(vscode.Uri.parse(value)).toString();
  }

  const filePath = path.isAbsolute(value)
    ? value
    : path.resolve(path.dirname(document.uri.fsPath), value);

  return webview.asWebviewUri(vscode.Uri.file(filePath)).toString();
}

async function importImageAsset(
  document: vscode.TextDocument,
  fileName: string,
  dataUrl: string
): Promise<{ fileUri: vscode.Uri; markdownPath: string }> {
  const targetDirectory = vscode.Uri.joinPath(vscode.Uri.file(path.dirname(document.uri.fsPath)), "assets");
  await vscode.workspace.fs.createDirectory(targetDirectory);

  const extension = getImageExtension(fileName, dataUrl);
  const baseName = sanitizeFileName(path.basename(fileName, path.extname(fileName)) || "image");
  const fileUri = await getUniqueFileUri(targetDirectory, baseName, extension);
  await vscode.workspace.fs.writeFile(fileUri, decodeDataUrl(dataUrl));

  return {
    fileUri,
    markdownPath: path.relative(path.dirname(document.uri.fsPath), fileUri.fsPath).replace(/\\/g, "/")
  };
}

function getImageExtension(fileName: string, dataUrl: string): string {
  const existingExtension = path.extname(fileName).toLowerCase();
  if (existingExtension) {
    return existingExtension;
  }

  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/i);
  const mime = mimeMatch?.[1].toLowerCase() ?? "";
  if (mime === "image/jpeg") {
    return ".jpg";
  }
  if (mime === "image/svg+xml") {
    return ".svg";
  }
  if (mime.startsWith("image/")) {
    return "." + mime.slice("image/".length);
  }

  return ".png";
}

function sanitizeFileName(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "image";
}

async function getUniqueFileUri(directory: vscode.Uri, baseName: string, extension: string): Promise<vscode.Uri> {
  let index = 0;

  while (true) {
    const suffix = index === 0 ? "" : `-${index}`;
    const candidate = vscode.Uri.joinPath(directory, `${baseName}${suffix}${extension}`);
    try {
      await vscode.workspace.fs.stat(candidate);
      index += 1;
    } catch {
      return candidate;
    }
  }
}

function decodeDataUrl(dataUrl: string): Uint8Array {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/i);
  if (!match) {
    throw new Error("Invalid image payload.");
  }

  return Uint8Array.from(Buffer.from(match[1], "base64"));
}

function isEditorMessage(value: unknown): value is {
  type: string;
  blocks?: unknown[];
} {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

function isImageImportMessage(value: unknown): value is {
  type: "importImageFile";
  blockId: string;
  fileName: string;
  dataUrl: string;
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as {
    type?: unknown;
    blockId?: unknown;
    fileName?: unknown;
    dataUrl?: unknown;
  };

  return message.type === "importImageFile" &&
    typeof message.blockId === "string" &&
    typeof message.fileName === "string" &&
    typeof message.dataUrl === "string";
}

function isReadmeBlock(value: unknown): value is ReadmeBlock {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const block = value as Partial<ReadmeBlock>;
  return typeof block.id === "string" && typeof block.type === "string";
}
