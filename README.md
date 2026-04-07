<p align="center">
  <img src="./assets/logo3.png" alt="Readme Maker logo" width="220" />
</p>

# Readme Maker

A VS Code extension for editing `README.md` files through a Markdown Preview-like WYSIWYG workflow inside VS Code.

## Overview

**Readme Maker** is a VS Code extension designed to make README writing easier for developers who do not want to manually write Markdown syntax line by line.

Instead of relying on raw Markdown editing, the extension aims to provide a visual workflow based on the familiar VS Code Markdown Preview experience. The current direction is a preview-first editor where the README is shown in a Markdown Preview-like layout, while lightweight editing tools can be revealed from the top and applied directly to the document.

The goal is simple: reduce Markdown friction and help users build clearer, more polished project documentation faster.

## Why Readme Maker

Writing a good README is important, but the editing experience is often inefficient.

Common issues include:

- Repeatedly switching between source and preview
- Manually remembering Markdown syntax
- Difficulty organizing sections cleanly
- Slower iteration when writing project introductions, features, usage guides, and screenshots

Readme Maker addresses this by focusing on a more visual, preview-first authoring flow.

## Core Idea

The extension is built around a **Markdown Preview-like WYSIWYG README workflow**.

Users work with README sections such as:

- Title
- Paragraph
- List
- Checklist
- Code block
- Image
- Divider

The document stays synchronized with the underlying Markdown file while the editor presents a more direct visual editing surface.

The target experience is close to VS Code's default Markdown Preview, with an additional hidden top toolbar for drag-based editing actions.

## Planned Features

- Markdown Preview-like WYSIWYG editing
- Hidden top toolbar with visual editing tools
- Markdown synchronization back to the source file
- Drag-based section insertion
- Support for headings, paragraphs, lists, checklists, images, code blocks, and dividers
- GitHub-compatible Markdown output

## Target Use Cases

- Project README writing
- Portfolio repository documentation
- Hackathon and capstone project summaries
- Quick documentation drafting inside VS Code
- Developers who want a more visual Markdown workflow

## Vision

Readme Maker is not just another Markdown preview tool.

It is intended to become a practical README authoring experience for developers who want the convenience of visual editing without losing Markdown compatibility.

## Roadmap

### Current MVP
- Custom Markdown editor opened from `Ctrl+Shift+V`
- Preview-like editing canvas
- Hidden top toolbar with drag-in section tools
- Title, paragraph, list, checklist, code block, image, divider
- Markdown source synchronization

### Next
- Closer parity with the default VS Code Markdown Preview layout
- Inline formatting tools such as bold, links, and inline code
- Drag-and-drop block rearrangement
- Table support
- Badge/link helper tools

### Future
- Marketplace-ready polished UX
- README starter kits
- Portfolio/project documentation presets
- Better GitHub publishing workflow support

## Positioning

**Readme Maker** is a VS Code extension that helps developers edit README documents through a visual, preview-first workflow instead of manual Markdown-first editing.

## Current Status

The project is currently in an experimental prototype stage.

- `Ctrl+Shift+V` opens the custom WYSIWYG editor for Markdown files
- The main canvas is being aligned to the default VS Code Markdown Preview style
- A hidden top toolbar appears on hover and exposes drag-based editing tools
- The edited content stays synchronized with the underlying `.md` document

## Development

1. Install dependencies
   - `npm install`
2. Compile the extension
   - `npm run compile`
3. Run the extension in VS Code
   - Open this folder in VS Code
   - Press `F5` to launch an Extension Development Host
4. Open a Markdown file such as `README.md`
5. Launch the WYSIWYG view
   - Press `Ctrl+Shift+V`
   - Or run `Readme Maker: Open WYSIWYG Preview`

The current MVP opens the Markdown document itself in a custom WYSIWYG editor and keeps the `.md` source synchronized.

## License

MIT
