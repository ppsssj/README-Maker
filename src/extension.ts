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
    webviewPanel.webview.options = {
      enableScripts: true
    };

    webviewPanel.webview.html = getEditorHtml(webviewPanel.webview);

    const syncState = {
      lastAppliedText: document.getText(),
      lastSentText: ""
    };

    const updateWebview = (force = false): void => {
      const text = document.getText();
      if (!force && syncState.lastSentText === text) {
        return;
      }

      syncState.lastSentText = text;

      void webviewPanel.webview.postMessage({
        type: "setDocument",
        fileName: path.basename(document.uri.fsPath),
        blocks: parseMarkdown(text)
      });
    };

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() !== document.uri.toString()) {
        return;
      }

      const nextText = event.document.getText();
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
        if (nextText === document.getText()) {
          return;
        }

        syncState.lastAppliedText = nextText;
        syncState.lastSentText = nextText;
        await replaceDocument(document, nextText);
        return;
      }

      if (message.type === "openSource") {
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
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

function isEditorMessage(value: unknown): value is {
  type: string;
  blocks?: unknown[];
} {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

function isReadmeBlock(value: unknown): value is ReadmeBlock {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const block = value as Partial<ReadmeBlock>;
  return typeof block.id === "string" && typeof block.type === "string";
}
