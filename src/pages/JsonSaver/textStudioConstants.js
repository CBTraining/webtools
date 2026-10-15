/**
 * Constants, export presets, starter templates, and text manipulation utilities
 * for the WordPad & Text Studio tool.
 */

export const EXPORT_FORMATS = [
  { ext: 'txt', label: '.txt — Plain Text', mime: 'text/plain;charset=utf-8', defaultEol: 'CRLF', category: 'Document' },
  { ext: 'json', label: '.json — JSON Data', mime: 'application/json;charset=utf-8', defaultEol: 'LF', category: 'Data & Config' },
  { ext: 'bat', label: '.bat — Windows Batch Script', mime: 'application/x-bat;charset=utf-8', defaultEol: 'CRLF', category: 'Scripts' },
  { ext: 'cmd', label: '.cmd — Windows Command Script', mime: 'application/cmd;charset=utf-8', defaultEol: 'CRLF', category: 'Scripts' },
  { ext: 'ps1', label: '.ps1 — PowerShell Script', mime: 'text/plain;charset=utf-8', defaultEol: 'CRLF', category: 'Scripts' },
  { ext: 'sh', label: '.sh — Shell / Bash Script', mime: 'application/x-sh;charset=utf-8', defaultEol: 'LF', category: 'Scripts' },
  { ext: 'md', label: '.md — Markdown Document', mime: 'text/markdown;charset=utf-8', defaultEol: 'LF', category: 'Document' },
  { ext: 'rtf', label: '.rtf — Rich Text Format (WordPad)', mime: 'application/rtf', defaultEol: 'CRLF', category: 'Document' },
  { ext: 'doc', label: '.doc — Word Document (HTML)', mime: 'application/msword;charset=utf-8', defaultEol: 'CRLF', category: 'Document' },
  { ext: 'html', label: '.html — HTML Document', mime: 'text/html;charset=utf-8', defaultEol: 'LF', category: 'Web & Code' },
  { ext: 'css', label: '.css — CSS Stylesheet', mime: 'text/css;charset=utf-8', defaultEol: 'LF', category: 'Web & Code' },
  { ext: 'js', label: '.js — JavaScript File', mime: 'text/javascript;charset=utf-8', defaultEol: 'LF', category: 'Web & Code' },
  { ext: 'py', label: '.py — Python Script', mime: 'text/x-python;charset=utf-8', defaultEol: 'LF', category: 'Scripts' },
  { ext: 'csv', label: '.csv — CSV Spreadsheet', mime: 'text/csv;charset=utf-8', defaultEol: 'CRLF', category: 'Data & Config' },
  { ext: 'xml', label: '.xml — XML Document', mime: 'application/xml;charset=utf-8', defaultEol: 'LF', category: 'Data & Config' },
  { ext: 'yaml', label: '.yaml — YAML Config', mime: 'text/yaml;charset=utf-8', defaultEol: 'LF', category: 'Data & Config' },
  { ext: 'ini', label: '.ini — Configuration File', mime: 'text/plain;charset=utf-8', defaultEol: 'CRLF', category: 'Data & Config' },
  { ext: 'reg', label: '.reg — Windows Registry File', mime: 'text/plain;charset=utf-8', defaultEol: 'CRLF', category: 'Scripts' },
  { ext: 'sql', label: '.sql — SQL Query Script', mime: 'application/sql;charset=utf-8', defaultEol: 'LF', category: 'Data & Config' },
  { ext: 'log', label: '.log — Log File', mime: 'text/plain;charset=utf-8', defaultEol: 'CRLF', category: 'Document' },
  { ext: 'custom', label: 'Custom Extension (.ext)...', mime: 'text/plain;charset=utf-8', defaultEol: 'CRLF', category: 'Custom' }
];

export const QUICK_EXPORT_EXTS = ['txt', 'json', 'bat', 'ps1', 'md', 'rtf', 'csv', 'html'];

export const FONT_FAMILIES = [
  { id: 'sans', label: 'Ubuntu / Sans-Serif', value: "'Ubuntu', 'Segoe UI', system-ui, -apple-system, sans-serif" },
  { id: 'mono', label: 'Consolas / Monospace', value: "'Fira Code', 'Consolas', 'Courier New', monospace" },
  { id: 'serif', label: 'Georgia / Serif', value: "'Georgia', 'Times New Roman', serif" },
  { id: 'calibri', label: 'Calibri / Modern', value: "'Calibri', 'Candara', 'Segoe UI', sans-serif" },
  { id: 'courier', label: 'Courier Classic', value: "'Courier New', Courier, monospace" }
];

export const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 24, 28];

export const STARTER_TEMPLATES = [
  {
    id: 'bat',
    label: 'Windows Batch (.bat)',
    ext: 'bat',
    filename: 'script',
    content: `@echo off
title My Batch Utility
echo ==========================================
echo Running Batch Script...
echo ==========================================
echo.

:: Add your commands below
echo Current Directory: %cd%
echo Current Date/Time: %date% %time%

echo.
echo Done!
pause
`
  },
  {
    id: 'ps1',
    label: 'PowerShell (.ps1)',
    ext: 'ps1',
    filename: 'script',
    content: `# PowerShell Automation Script
$ErrorActionPreference = "Stop"

Write-Host "Starting script execution..." -ForegroundColor Cyan

# Example variables and loop
$items = @("Item 1", "Item 2", "Item 3")
foreach ($item in $items) {
    Write-Host "Processing: $item" -ForegroundColor Green
}

Write-Host "Completed successfully!" -ForegroundColor Cyan
`
  },
  {
    id: 'json',
    label: 'JSON Config (.json)',
    ext: 'json',
    filename: 'config',
    content: `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "Configuration file created in WebTools WordPad",
  "settings": {
    "theme": "dark",
    "autoSave": true,
    "maxRetries": 3
  },
  "tags": ["webtools", "config", "json"]
}`
  },
  {
    id: 'md',
    label: 'Markdown Note (.md)',
    ext: 'md',
    filename: 'notes',
    content: `# Project Notes

## Overview
Write your documentation, checklists, or structured notes here.

## Todo List
- [x] Outline project goals
- [ ] Draft implementation details
- [ ] Export document

## Code Snippet
\`\`\`json
{
  "status": "ready"
}
\`\`\`
`
  },
  {
    id: 'reg',
    label: 'Registry Tweak (.reg)',
    ext: 'reg',
    filename: 'tweak',
    content: `Windows Registry Editor Version 5.00

; Example Registry Entry
[HKEY_CURRENT_USER\\Software\\MyApplication]
"Enabled"=dword:00000001
"InstallPath"="C:\\\\Program Files\\\\MyApplication"
`
  },
  {
    id: 'html',
    label: 'HTML5 Starter (.html)',
    ext: 'html',
    filename: 'index',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>Created with WebTools WordPad.</p>
</body>
</html>
`
  }
];

/**
 * Normalizes line endings to CRLF (\r\n) or LF (\n).
 */
export function applyLineEndings(text, eol = 'CRLF') {
  const normalized = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return eol === 'CRLF' ? normalized.replace(/\n/g, '\r\n') : normalized;
}

/**
 * Converts plain text into a valid Rich Text Format (.rtf) document string.
 */
export function convertTextToRtf(text) {
  const normalized = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const escaped = normalized
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .split('\n')
    .map(line => {
      // Escape non-ASCII characters as RTF unicode sequences
      let out = '';
      for (let i = 0; i < line.length; i++) {
        const code = line.charCodeAt(i);
        if (code > 127) {
          out += `\\u${code}?`;
        } else {
          out += line[i];
        }
      }
      return out;
    })
    .join('\\par\r\n');

  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}{\\f1 Consolas;}}\r\n\\f0\\fs24 ${escaped}\\par\r\n}`;
}

/**
 * Wraps rich HTML or plain text into a Word-compatible .doc HTML file.
 */
export function convertToWordDocHtml(text, isRichHtml = false, htmlContent = '') {
  const body = isRichHtml && htmlContent
    ? htmlContent
    : `<pre style="font-family: Calibri, sans-serif; font-size: 11pt; white-space: pre-wrap;">${(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</pre>`;

  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Document</title></head>
<body style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5;">
${body}
</body>
</html>`;
}

/**
 * Applies common text transformations for the WordPad Text Tools menu.
 */
export function transformText(text, action) {
  if (!text) return text;

  switch (action) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'titlecase':
      return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case 'sentencecase':
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    case 'sort-asc':
      return text.split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join('\n');
    case 'sort-desc':
      return text.split(/\r?\n/).sort((a, b) => b.localeCompare(a)).join('\n');
    case 'dedupe-lines': {
      const seen = new Set();
      return text.split(/\r?\n/).filter(line => {
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      }).join('\n');
    }
    case 'remove-empty-lines':
      return text.split(/\r?\n/).filter(line => line.trim().length > 0).join('\n');
    case 'trim-lines':
      return text.split(/\r?\n/).map(line => line.trim()).join('\n');
    case 'number-lines':
      return text.split(/\r?\n/).map((line, i) => `${i + 1}. ${line}`).join('\n');
    case 'reverse-lines':
      return text.split(/\r?\n/).reverse().join('\n');
    case 'base64-encode':
      try {
        return btoa(unescape(encodeURIComponent(text)));
      } catch {
        return text;
      }
    case 'base64-decode':
      try {
        return decodeURIComponent(escape(atob(text.trim())));
      } catch {
        return text;
      }
    case 'url-encode':
      return encodeURIComponent(text);
    case 'url-decode':
      try {
        return decodeURIComponent(text);
      } catch {
        return text;
      }
    case 'json-escape':
      return JSON.stringify(text).slice(1, -1);
    case 'json-unescape':
      try {
        return JSON.parse(`"${text}"`);
      } catch {
        return text;
      }
    default:
      return text;
  }
}
