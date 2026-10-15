import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import beautify from 'js-beautify';
import {
  DocumentTextIcon,
  CodeBracketIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FolderOpenIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  TrashIcon
} from '@heroicons/react/24/solid';
import { isValidLottie } from '../utils/lottieSamples';
import { downloadBlob } from '../utils/downloadUtils';
import { formatBytes } from '../utils/formatters';
import LottiePreview from './JsonSaver/LottiePreview';
import LottieGifExportCard from './JsonSaver/LottieGifExportCard';
import WordpadToolbar from './JsonSaver/WordpadToolbar';
import ExportBar from './JsonSaver/ExportBar';
import {
  EXPORT_FORMATS,
  FONT_FAMILIES,
  applyLineEndings,
  convertTextToRtf,
  convertToWordDocHtml,
  transformText
} from './JsonSaver/textStudioConstants';

const STORAGE_KEY = 'webtools-wordpad-tabs-v1';

function createNewDoc(index = 1, overrides = {}) {
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fileName: `document-${index}`,
    ext: 'txt',
    customExt: '',
    lineEnding: 'CRLF',
    text: '',
    richHtml: '',
    editorMode: 'plain', // 'plain' | 'rich'
    ...overrides
  };
}

function inferExtFromFilename(name = '') {
  if (!name || !name.includes('.')) return null;
  const ext = name.split('.').pop().toLowerCase().trim();
  if (!ext) return null;
  const known = EXPORT_FORMATS.find(f => f.ext === ext && f.ext !== 'custom');
  return {
    baseName: name.slice(0, name.lastIndexOf('.')) || 'document',
    ext: known ? known.ext : 'custom',
    customExt: known ? '' : ext,
    defaultEol: known ? known.defaultEol : 'CRLF'
  };
}

export default function JsonSaver() {
  const location = useLocation();

  // Load persisted tabs from localStorage
  const [docs, setDocs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [createNewDoc(1)];
  });

  const [activeDocId, setActiveDocId] = useState(() => docs[docs.length - 1]?.id);
  const lastConsumedStateRef = useRef(null);

  // Handle incoming text/files from navigation state (e.g. Global Drag & Drop or Send To Text Editor)
  useEffect(() => {
    const incomingText = location.state?.jsonText ?? location.state?.text;
    const incomingFileName = location.state?.fileName;
    if (typeof incomingText === 'string' && incomingText.length > 0) {
      const stateSignature = `${incomingFileName || ''}::${incomingText.length}::${incomingText.slice(0, 64)}`;
      if (lastConsumedStateRef.current === stateSignature) return;
      lastConsumedStateRef.current = stateSignature;

      const inferred = incomingFileName ? inferExtFromFilename(incomingFileName) : null;
      const isJsonLikely = incomingText.trim().startsWith('{') || incomingText.trim().startsWith('[');
      setDocs(prev => {
        const newDoc = createNewDoc(prev.length + 1, {
          fileName: inferred?.baseName || (isJsonLikely ? 'data' : 'imported-text'),
          ext: inferred?.ext || (isJsonLikely ? 'json' : 'txt'),
          customExt: inferred?.customExt || '',
          lineEnding: inferred?.defaultEol || (isJsonLikely ? 'LF' : 'CRLF'),
          text: incomingText,
          editorMode: 'plain'
        });
        setActiveDocId(newDoc.id);
        if (prev.length === 1 && !prev[0].text.trim()) {
          return [newDoc];
        }
        return [...prev, newDoc];
      });
    }
  }, [location.state]);

  // Editor appearance settings
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[1].value); // Default monospace/clean
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [paperView, setPaperView] = useState(false);
  const [validateJsonOnSave, setValidateJsonOnSave] = useState(true);

  // Status & notifications
  const [error, setError] = useState(null);
  const [statusToast, setStatusToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });

  // Find & Replace bar state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  // Lottie preview state
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [isPlaying, setIsPlaying] = useState(true);

  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const richEditorRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeDoc = useMemo(() => {
    return docs.find(d => d.id === activeDocId) || docs[0];
  }, [docs, activeDocId]);

  // Persist docs to localStorage (debounced to keep typing fast on large documents)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
      } catch {
        // ignore quota errors
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [docs]);

  const updateActiveDoc = useCallback((patch) => {
    setDocs(prev =>
      prev.map(doc => (doc.id === activeDoc.id ? { ...doc, ...patch } : doc))
    );
  }, [activeDoc.id]);

  // Sync rich editor HTML when switching tabs or modes
  useEffect(() => {
    if (activeDoc.editorMode === 'rich' && richEditorRef.current) {
      const targetHtml = activeDoc.richHtml || (activeDoc.text || '').replace(/\n/g, '<br/>');
      if (richEditorRef.current.innerHTML !== targetHtml) {
        richEditorRef.current.innerHTML = targetHtml;
      }
    }
  }, [activeDoc.id, activeDoc.editorMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const showSuccessMessage = useCallback((msg) => {
    setStatusToast(msg);
    setError(null);
    setTimeout(() => setStatusToast(null), 3200);
  }, []);

  // Parse JSON / Lottie detection
  const { parsedJson, jsonValid, parsedLottieData } = useMemo(() => {
    const raw = (activeDoc.text || '').trim();
    if (!raw || (!raw.startsWith('{') && !raw.startsWith('['))) {
      return { parsedJson: null, jsonValid: false, parsedLottieData: null };
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        parsedJson: parsed,
        jsonValid: true,
        parsedLottieData: isValidLottie(parsed) ? parsed : null
      };
    } catch {
      return { parsedJson: null, jsonValid: false, parsedLottieData: null };
    }
  }, [activeDoc.text]);

  const currentTab = parsedLottieData ? activeTab : 'editor';

  // Document statistics
  const stats = useMemo(() => {
    const text = activeDoc.text || '';
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r?\n/).length : 1;
    const bytes = new Blob([text]).size;
    return { chars, charsNoSpaces, words, lines, bytes };
  }, [activeDoc.text]);

  // Line numbers array for gutter
  const lineCount = stats.lines;

  // Handle cursor position in plain textarea
  const updateCursorMetrics = (targetEl) => {
    const el = targetEl?.selectionStart !== undefined ? targetEl : textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart || 0;
    const sourceText = typeof el.value === 'string' ? el.value : (activeDoc?.text || '');
    const before = sourceText.slice(0, pos);
    const linesBefore = before.split(/\r?\n/);
    setCursorPos({
      ln: linesBefore.length,
      col: linesBefore[linesBefore.length - 1].length + 1
    });
  };

  // Handle mode switching between Plain Text and Rich WordPad
  const handleModeChange = (nextMode) => {
    if (nextMode === activeDoc.editorMode) return;
    if (nextMode === 'rich') {
      const escapedHtml = (activeDoc.text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
      updateActiveDoc({
        editorMode: 'rich',
        richHtml: activeDoc.richHtml || escapedHtml
      });
      setFontFamily(FONT_FAMILIES[0].value);
      setPaperView(true);
    } else {
      const plainFromRich = richEditorRef.current
        ? richEditorRef.current.innerText
        : activeDoc.text;
      updateActiveDoc({
        editorMode: 'plain',
        text: plainFromRich
      });
    }
  };

  // Execute rich text command
  const handleExecRichCommand = (command, value = null) => {
    if (!richEditorRef.current) return;
    richEditorRef.current.focus();
    document.execCommand(command, false, value);
    updateActiveDoc({
      richHtml: richEditorRef.current.innerHTML,
      text: richEditorRef.current.innerText
    });
  };

  // JSON Format / Minify / Code Beautify
  const handleFormatJson = (indent = 2) => {
    const raw = activeDoc.text || '';
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      const formatted = JSON.stringify(parsed, null, indent);
      updateActiveDoc({ text: formatted, ext: 'json' });
      showSuccessMessage(`Formatted valid JSON (${indent}-space indent)`);
    } catch (e) {
      setError(`Invalid JSON syntax: ${e.message}`);
    }
  };

  const handleMinifyJson = () => {
    const raw = activeDoc.text || '';
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      const minified = JSON.stringify(parsed);
      updateActiveDoc({ text: minified, ext: 'json' });
      showSuccessMessage('Minified JSON to single line');
    } catch (e) {
      setError(`Invalid JSON syntax: ${e.message}`);
    }
  };

  const handleBeautifyCode = (lang) => {
    const raw = activeDoc.text || '';
    if (!raw.trim()) return;
    try {
      let formatted = raw;
      if (lang === 'html') {
        formatted = beautify.html(raw, { indent_size: 2, wrap_line_length: 0 });
      } else if (lang === 'css') {
        formatted = beautify.css(raw, { indent_size: 2 });
      } else if (lang === 'js') {
        formatted = beautify.js(raw, { indent_size: 2 });
      }
      updateActiveDoc({ text: formatted });
      showSuccessMessage(`Beautified ${lang.toUpperCase()} code`);
    } catch (e) {
      setError(`Beautify error: ${e.message}`);
    }
  };

  // Text transformations
  const handleTransformText = (action) => {
    const current = activeDoc.text || '';
    if (!current) return;
    const next = transformText(current, action);
    updateActiveDoc({ text: next });
    if (activeDoc.editorMode === 'rich' && richEditorRef.current) {
      const html = next.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
      richEditorRef.current.innerHTML = html;
      updateActiveDoc({ text: next, richHtml: html });
    }
    showSuccessMessage('Applied text transformation');
  };

  // Starter templates
  const handleApplyTemplate = (tpl) => {
    const fmt = EXPORT_FORMATS.find(f => f.ext === tpl.ext);
    updateActiveDoc({
      fileName: tpl.filename,
      ext: tpl.ext,
      lineEnding: fmt ? fmt.defaultEol : 'CRLF',
      text: tpl.content,
      editorMode: 'plain'
    });
    showSuccessMessage(`Loaded ${tpl.label} template`);
  };

  // Insert timestamp at cursor
  const handleInsertTimestamp = () => {
    const stamp = new Date().toLocaleString();
    if (activeDoc.editorMode === 'rich' && richEditorRef.current) {
      richEditorRef.current.focus();
      document.execCommand('insertText', false, stamp);
      updateActiveDoc({
        richHtml: richEditorRef.current.innerHTML,
        text: richEditorRef.current.innerText
      });
      return;
    }

    const el = textareaRef.current;
    const current = activeDoc.text || '';
    if (el) {
      const start = el.selectionStart ?? current.length;
      const end = el.selectionEnd ?? current.length;
      const updated = current.slice(0, start) + stamp + current.slice(end);
      updateActiveDoc({ text: updated });
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + stamp.length, start + stamp.length);
      }, 0);
    } else {
      updateActiveDoc({ text: current + stamp });
    }
  };

  // Print document
  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (!printWin) return;
    const content = activeDoc.editorMode === 'rich' && activeDoc.richHtml
      ? activeDoc.richHtml
      : `<pre style="font-family: ${fontFamily}; font-size: ${fontSize}px; white-space: pre-wrap;">${(activeDoc.text || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</pre>`;
    printWin.document.write(`<!DOCTYPE html><html><head><title>${activeDoc.fileName || 'Document'}</title></head><body style="font-family: sans-serif; padding: 2rem;">${content}</body></html>`);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  };

  // File Name & Extension syncing
  const handleFileNameChange = (val) => {
    // If user types an explicit known extension like "setup.bat" or "data.json", sync the format dropdown automatically
    const match = val.match(/^(.+)\.([a-zA-Z0-9]{1,6})$/);
    if (match) {
      const base = match[1];
      const typedExt = match[2].toLowerCase();
      const known = EXPORT_FORMATS.find(f => f.ext === typedExt && f.ext !== 'custom');
      if (known) {
        updateActiveDoc({
          fileName: base,
          ext: known.ext,
          lineEnding: known.defaultEol
        });
        return;
      }
    }
    updateActiveDoc({ fileName: val });
  };

  const handleExtChange = (nextExt) => {
    const fmt = EXPORT_FORMATS.find(f => f.ext === nextExt);
    updateActiveDoc({
      ext: nextExt,
      lineEnding: fmt ? fmt.defaultEol : activeDoc.lineEnding
    });
    setError(null);
  };

  // Core Save / Export function
  const handleSave = useCallback((overrideExt = null) => {
    const targetExt = overrideExt || (activeDoc.ext === 'custom'
      ? (activeDoc.customExt.replace(/^\.+/, '') || 'txt')
      : activeDoc.ext);

    const rawText = activeDoc.text || '';
    const fmtMeta = EXPORT_FORMATS.find(f => f.ext === targetExt) || EXPORT_FORMATS[0];
    const targetEol = overrideExt ? (fmtMeta.defaultEol || activeDoc.lineEnding) : activeDoc.lineEnding;

    // Optional JSON validation when exporting .json
    if (targetExt === 'json' && validateJsonOnSave) {
      if (!rawText.trim()) {
        setError('Document is empty. Add JSON content or uncheck "Validate JSON".');
        return;
      }
      try {
        JSON.parse(rawText);
      } catch (e) {
        setError(`Invalid JSON syntax: ${e.message}. Fix syntax or uncheck "Validate JSON" to save anyway.`);
        return;
      }
    }

    setError(null);

    let outputString;
    let mimeType = fmtMeta.mime || 'text/plain;charset=utf-8';

    if (targetExt === 'rtf') {
      outputString = convertTextToRtf(rawText);
      mimeType = 'application/rtf';
    } else if (targetExt === 'doc') {
      outputString = convertToWordDocHtml(rawText, activeDoc.editorMode === 'rich', activeDoc.richHtml);
      mimeType = 'application/msword;charset=utf-8';
    } else {
      outputString = applyLineEndings(rawText, targetEol);
    }

    const cleanBase = (activeDoc.fileName || 'document').replace(/\.[^/.]+$/, '').trim() || 'document';
    const downloadName = `${cleanBase}.${targetExt}`;
    const blob = new Blob([outputString], { type: mimeType });

    downloadBlob(blob, downloadName, {
      categoryLabel: `Exported .${targetExt.toUpperCase()} (${cleanBase})`
    });

    showSuccessMessage(`Saved ${downloadName} (${formatBytes(blob.size)})`);
  }, [activeDoc, validateJsonOnSave, showSuccessMessage]);

  const handleQuickExportExt = (ext, immediateDownload = false) => {
    handleExtChange(ext);
    if (immediateDownload) {
      handleSave(ext);
    }
  };

  // Ctrl+S / Cmd+S and Ctrl+F shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindReplace(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  // Open local file into editor
  const handleFileLoaded = async (file) => {
    if (!file) return;
    if (
      file.type.startsWith('image/') ||
      file.type.startsWith('video/') ||
      file.type.startsWith('audio/') ||
      /\.(png|jpe?g|gif|webp|bmp|ico|mp4|mov|avi|webm|mkv|pdf|pptx|docx|xlsx|zip)$/i.test(file.name)
    ) {
      return;
    }
    try {
      const text = await file.text();
      const inferred = inferExtFromFilename(file.name);
      const hasCurrentEmpty = !activeDoc.text.trim();

      if (hasCurrentEmpty) {
        updateActiveDoc({
          fileName: inferred?.baseName || file.name,
          ext: inferred?.ext || 'txt',
          customExt: inferred?.customExt || '',
          lineEnding: text.includes('\r\n') ? 'CRLF' : (inferred?.defaultEol || 'LF'),
          text,
          editorMode: 'plain'
        });
      } else {
        const newDoc = createNewDoc(docs.length + 1, {
          fileName: inferred?.baseName || file.name,
          ext: inferred?.ext || 'txt',
          customExt: inferred?.customExt || '',
          lineEnding: text.includes('\r\n') ? 'CRLF' : (inferred?.defaultEol || 'LF'),
          text,
          editorMode: 'plain'
        });
        setDocs(prev => [...prev, newDoc]);
        setActiveDocId(newDoc.id);
      }
      showSuccessMessage(`Opened ${file.name}`);
    } catch (err) {
      setError(`Could not read file: ${err.message}`);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeDoc.text || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  // Find & Replace actions
  const matchCount = useMemo(() => {
    if (!findQuery) return 0;
    const text = activeDoc.text || '';
    const flags = matchCase ? 'g' : 'gi';
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = text.match(new RegExp(escaped, flags));
    return matches ? matches.length : 0;
  }, [activeDoc.text, findQuery, matchCase]);

  const applyReplacedText = (next) => {
    if (activeDoc.editorMode === 'rich' && richEditorRef.current) {
      const html = next
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
      richEditorRef.current.innerHTML = html;
      updateActiveDoc({ text: next, richHtml: html });
    } else {
      updateActiveDoc({ text: next });
    }
  };

  const handleReplaceOne = () => {
    if (!findQuery) return;
    const text = activeDoc.text || '';
    const flags = matchCase ? '' : 'i';
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const next = text.replace(new RegExp(escaped, flags), replaceQuery);
    applyReplacedText(next);
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const text = activeDoc.text || '';
    const flags = matchCase ? 'g' : 'gi';
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const next = text.replace(new RegExp(escaped, flags), replaceQuery);
    applyReplacedText(next);
    showSuccessMessage(`Replaced ${matchCount} occurrence(s)`);
  };

  // Tab management
  const handleAddTab = () => {
    const newDoc = createNewDoc(docs.length + 1);
    setDocs(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setError(null);
  };

  const handleCloseTab = (e, id) => {
    e.stopPropagation();
    if (docs.length <= 1) {
      const fresh = createNewDoc(1);
      setDocs([fresh]);
      setActiveDocId(fresh.id);
      return;
    }
    const nextDocs = docs.filter(d => d.id !== id);
    setDocs(nextDocs);
    if (activeDocId === id) {
      setActiveDocId(nextDocs[nextDocs.length - 1].id);
    }
  };

  // Support Tab key indentation inside plain textarea
  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = activeDoc.text || '';
      const next = val.substring(0, start) + '  ' + val.substring(end);
      updateActiveDoc({ text: next });
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + 2;
        updateCursorMetrics();
      }, 0);
    }
  };

  const effectiveExtLabel = activeDoc.ext === 'custom'
    ? (activeDoc.customExt.replace(/^\.+/, '') || 'txt')
    : activeDoc.ext;

  return (
    <div
      className="animate-fade-in"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        if (e.dataTransfer?.files?.length > 0) {
          e.preventDefault();
          handleFileLoaded(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileLoaded(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '0.35rem' }}>
        <DocumentTextIcon style={{ width: 32, height: 32, color: 'var(--accent-color)' }} />
        <h1>Text Editor</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.92rem' }}>
        All-in-one rich & plain text pad, JSON formatter, and script writer. Export directly to <code>.txt</code>, <code>.json</code>, <code>.bat</code>, <code>.ps1</code>, <code>.md</code>, <code>.rtf</code>, and any custom file format.
      </p>

      {/* Lottie Animation Detection Banner */}
      {parsedLottieData && (
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            padding: '0.7rem 1.15rem',
            background: 'var(--accent-transparent)',
            borderColor: 'var(--accent-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ animation: 'pulse 2s infinite', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Lottie Animation JSON detected in active document!
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              type="button"
              className={`btn ${currentTab === 'editor' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('editor')}
              style={{ padding: '0.32rem 0.75rem', fontSize: '0.82rem' }}
            >
              Document Editor
            </button>
            <button
              type="button"
              className={`btn ${currentTab === 'preview' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('preview')}
              style={{ padding: '0.32rem 0.75rem', fontSize: '0.82rem' }}
            >
              Animation Preview & GIF Export
            </button>
          </div>
        </div>
      )}

      {currentTab === 'preview' && parsedLottieData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--accent-color)' }}>Lottie Animation Preview</h3>
            <LottiePreview
              animationData={parsedLottieData}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
            />
          </div>
          <LottieGifExportCard parsedLottieData={parsedLottieData} />
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', overflow: 'visible' }}>
          {/* Top Header Bar: Document Tabs on Left + File Actions & Mode Switcher on Right */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexWrap: 'wrap',
              paddingBottom: '0.45rem',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            {/* Left: Tabs + New Tab Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', minWidth: 0 }}>
              {docs.map((doc) => {
                const isActive = doc.id === activeDoc.id;
                const tabExt = doc.ext === 'custom' ? (doc.customExt.replace(/^\.+/, '') || 'txt') : doc.ext;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setActiveDocId(doc.id);
                      setError(null);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? 'var(--accent-transparent)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isActive ? 'var(--accent-color)' : 'var(--border-color)'}`,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{doc.fileName || 'untitled'}.{tabExt}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(e, doc.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 2,
                        borderRadius: '4px'
                      }}
                      title="Close Tab"
                    >
                      <XMarkIcon style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                className="btn"
                onClick={handleAddTab}
                style={{
                  padding: '0.3rem 0.55rem',
                  fontSize: '0.76rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  whiteSpace: 'nowrap'
                }}
                title="New Document Tab"
              >
                <PlusIcon style={{ width: 13, height: 13 }} />
                New
              </button>
            </div>

            {/* Right: Feedback Pill + Open/Copy/Clear + Editor Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
              {error && (
                <span style={{ color: 'var(--danger-color)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', fontWeight: 500 }}>
                  <ExclamationCircleIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
                  {error}
                </span>
              )}
              {statusToast && !error && (
                <span style={{ color: 'var(--success-color)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', fontWeight: 500 }}>
                  <CheckIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
                  {statusToast}
                </span>
              )}

              <button
                type="button"
                className="btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '0.26rem 0.55rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                title="Open local text, JSON, batch, or script file"
              >
                <FolderOpenIcon style={{ width: 14, height: 14, color: 'var(--accent-color)' }} />
                Open
              </button>

              <button
                type="button"
                className="btn"
                onClick={handleCopy}
                style={{ padding: '0.26rem 0.55rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                title="Copy document content to clipboard"
              >
                {copied ? (
                  <>
                    <ClipboardDocumentCheckIcon style={{ width: 14, height: 14, color: 'var(--success-color)' }} />
                    Copied
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon style={{ width: 14, height: 14 }} />
                    Copy
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  updateActiveDoc({ text: '', richHtml: '' });
                  if (richEditorRef.current) richEditorRef.current.innerHTML = '';
                  setError(null);
                }}
                style={{ padding: '0.26rem 0.55rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--danger-color)' }}
                title="Clear current document content"
              >
                <TrashIcon style={{ width: 13, height: 13 }} />
                Clear
              </button>

              {/* Compact Mode Switcher Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--bg-primary)',
                  padding: '2px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  gap: '2px'
                }}
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleModeChange('plain')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.22rem 0.55rem',
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    borderRadius: '4px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    background: activeDoc.editorMode === 'plain' ? 'var(--accent-gradient)' : 'transparent',
                    color: activeDoc.editorMode === 'plain' ? '#fff' : 'var(--text-secondary)'
                  }}
                  title="Plain Text, JSON, Batch & Code Editor"
                >
                  <CodeBracketIcon style={{ width: 13, height: 13 }} />
                  Code
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleModeChange('rich')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.22rem 0.55rem',
                    fontSize: '0.74rem',
                    fontWeight: 500,
                    borderRadius: '4px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    background: activeDoc.editorMode === 'rich' ? 'var(--accent-gradient)' : 'transparent',
                    color: activeDoc.editorMode === 'rich' ? '#fff' : 'var(--text-secondary)'
                  }}
                  title="WordPad Rich Text Document Mode"
                >
                  <DocumentTextIcon style={{ width: 13, height: 13 }} />
                  Rich Text
                </button>
              </div>
            </div>
          </div>

          {/* WordPad Ribbon Toolbar */}
          <WordpadToolbar
            editorMode={activeDoc.editorMode}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            lineHeight={lineHeight}
            setLineHeight={setLineHeight}
            wordWrap={wordWrap}
            setWordWrap={setWordWrap}
            showLineNumbers={showLineNumbers}
            setShowLineNumbers={setShowLineNumbers}
            paperView={paperView}
            setPaperView={setPaperView}
            showFindReplace={showFindReplace}
            setShowFindReplace={setShowFindReplace}
            onFormatJson={handleFormatJson}
            onMinifyJson={handleMinifyJson}
            onBeautifyCode={handleBeautifyCode}
            onTransformText={handleTransformText}
            onApplyTemplate={handleApplyTemplate}
            onInsertTimestamp={handleInsertTimestamp}
            onExecRichCommand={handleExecRichCommand}
            onPrint={handlePrint}
          />

          {/* Collapsible Find & Replace Bar */}
          {showFindReplace && (
            <div
              className="animate-pop-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                background: 'var(--bg-tertiary)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--accent-color)'
              }}
            >
              <MagnifyingGlassIcon style={{ width: 15, height: 15, color: 'var(--accent-color)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Find text..."
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                style={{ padding: '0.28rem 0.5rem', fontSize: '0.8rem', width: '165px' }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                style={{ padding: '0.28rem 0.5rem', fontSize: '0.8rem', width: '165px' }}
              />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  style={{ width: 13, height: 13 }}
                />
                Match case
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {findQuery ? `${matchCount} match${matchCount === 1 ? '' : 'es'}` : ''}
              </span>
              <button
                type="button"
                className="btn"
                onClick={handleReplaceOne}
                disabled={!findQuery || matchCount === 0}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.76rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              >
                Replace
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReplaceAll}
                disabled={!findQuery || matchCount === 0}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.76rem' }}
              >
                Replace All
              </button>
              <button
                type="button"
                onClick={() => setShowFindReplace(false)}
                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Close Find & Replace"
              >
                <XMarkIcon style={{ width: 17, height: 17 }} />
              </button>
            </div>
          )}

          {/* Main Editor Surface */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              background: paperView ? 'var(--bg-tertiary)' : 'transparent',
              padding: paperView ? '1.1rem' : 0,
              borderRadius: 'var(--border-radius-sm)',
              border: paperView ? '1px solid var(--border-color)' : 'none'
            }}
          >
            {activeDoc.editorMode === 'rich' ? (
              /* WordPad Rich Text Surface */
              <div
                ref={richEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  updateActiveDoc({
                    richHtml: e.currentTarget.innerHTML,
                    text: e.currentTarget.innerText
                  });
                  setError(null);
                }}
                style={{
                  width: paperView ? 'min(100%, 820px)' : '100%',
                  minHeight: '420px',
                  maxHeight: '68vh',
                  overflowY: 'auto',
                  background: paperView ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  boxShadow: paperView ? '0 8px 28px rgba(0,0,0,0.35)' : 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: paperView ? '2rem 2.5rem' : '1rem 1.25rem',
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                  overflowWrap: wordWrap ? 'break-word' : 'normal'
                }}
              />
            ) : (
              /* Plain Text / Code / Script Editor with Optional Line Numbers Gutter */
              <div
                style={{
                  display: 'flex',
                  width: paperView ? 'min(100%, 840px)' : '100%',
                  minHeight: '420px',
                  maxHeight: '68vh',
                  background: paperView ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  boxShadow: paperView ? '0 8px 28px rgba(0,0,0,0.35)' : 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  overflow: 'hidden'
                }}
              >
                {showLineNumbers && (
                  <div
                    ref={gutterRef}
                    aria-hidden="true"
                    style={{
                      padding: paperView ? '1.5rem 0.65rem' : '0.85rem 0.6rem',
                      background: 'var(--bg-tertiary)',
                      borderRight: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      opacity: 0.65,
                      fontFamily: "'Fira Code', 'Consolas', monospace",
                      fontSize: `${fontSize}px`,
                      lineHeight,
                      textAlign: 'right',
                      userSelect: 'none',
                      minWidth: '42px',
                      overflow: 'hidden'
                    }}
                  >
                    {Array.from({ length: Math.min(lineCount, 5000) }, (_, i) => (
                      <div key={i + 1}>{i + 1}</div>
                    ))}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={activeDoc.text}
                  onChange={(e) => {
                    updateActiveDoc({ text: e.target.value });
                    setError(null);
                    updateCursorMetrics(e.currentTarget);
                  }}
                  onClick={(e) => updateCursorMetrics(e.currentTarget)}
                  onKeyUp={(e) => updateCursorMetrics(e.currentTarget)}
                  onKeyDown={handleTextareaKeyDown}
                  onScroll={(e) => {
                    if (gutterRef.current) {
                      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                    }
                  }}
                  placeholder="Type or paste notes, JSON data, Windows .bat scripts, Markdown, or drop any text file here..."
                  spellCheck={activeDoc.ext === 'txt' || activeDoc.ext === 'md'}
                  style={{
                    flex: 1,
                    width: '100%',
                    minHeight: '420px',
                    padding: paperView ? '1.5rem 2rem' : '0.85rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontFamily,
                    fontSize: `${fontSize}px`,
                    lineHeight,
                    outline: 'none',
                    resize: 'vertical',
                    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                    overflowX: wordWrap ? 'hidden' : 'auto',
                    tabSize: 2
                  }}
                />
              </div>
            )}
          </div>

          {/* Export & File Controls Bar */}
          <ExportBar
            fileName={activeDoc.fileName}
            onFileNameChange={handleFileNameChange}
            selectedExt={activeDoc.ext}
            onExtChange={handleExtChange}
            customExt={activeDoc.customExt}
            onCustomExtChange={(val) => updateActiveDoc({ customExt: val })}
            lineEnding={activeDoc.lineEnding}
            onLineEndingChange={(val) => updateActiveDoc({ lineEnding: val })}
            validateJsonOnSave={validateJsonOnSave}
            setValidateJsonOnSave={setValidateJsonOnSave}
            onSave={() => handleSave()}
            onQuickExportExt={handleQuickExportExt}
            parsedLottieData={parsedLottieData}
            onConvertToGifClick={() => setActiveTab('preview')}
          />

          {/* WordPad Status Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.6rem',
              padding: '0.35rem 0.7rem',
              background: 'var(--bg-primary)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '0.73rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <span><strong>Ln</strong> {cursorPos.ln}, <strong>Col</strong> {cursorPos.col}</span>
              <span><strong>Lines:</strong> {stats.lines.toLocaleString()}</span>
              <span><strong>Words:</strong> {stats.words.toLocaleString()}</span>
              <span><strong>Chars:</strong> {stats.chars.toLocaleString()}</span>
              <span><strong>Size:</strong> {formatBytes(stats.bytes)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {jsonValid && (
                <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                  ● Valid JSON {Array.isArray(parsedJson) ? `(${parsedJson.length} items)` : `(${Object.keys(parsedJson || {}).length} keys)`}
                </span>
              )}
              <span><strong>Mode:</strong> {activeDoc.editorMode === 'rich' ? 'Rich Text' : 'Code / Text'}</span>
              <span><strong>Target:</strong> .{effectiveExtLabel.toUpperCase()}</span>
              <span><strong>EOL:</strong> {activeDoc.lineEnding}</span>
              <span>UTF-8</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
