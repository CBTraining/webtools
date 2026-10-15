import { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  PrinterIcon,
  Bars3BottomLeftIcon,
  HashtagIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/solid';
import { FONT_FAMILIES, FONT_SIZES, STARTER_TEMPLATES } from './textStudioConstants';

export default function WordpadToolbar({
  editorMode,
  onModeChange,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  wordWrap,
  setWordWrap,
  showLineNumbers,
  setShowLineNumbers,
  paperView,
  setPaperView,
  showFindReplace,
  setShowFindReplace,
  onFormatJson,
  onMinifyJson,
  onBeautifyCode,
  onTransformText,
  onApplyTemplate,
  onInsertTimestamp,
  onExecRichCommand,
  onPrint
}) {
  const [openMenu, setOpenMenu] = useState(null); // 'transform' | 'templates' | 'beautify' | null
  const menuContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenu && menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  const toggleMenu = (name) => {
    setOpenMenu(prev => (prev === name ? null : name));
  };

  const ribbonBtnStyle = (active = false) => ({
    padding: '0.32rem 0.55rem',
    fontSize: '0.78rem',
    background: active ? 'var(--accent-transparent)' : 'var(--bg-primary)',
    border: `1px solid ${active ? 'var(--accent-color)' : 'var(--border-color)'}`,
    color: active ? 'var(--accent-color)' : 'var(--text-primary)',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    cursor: 'pointer',
    fontWeight: active ? 600 : 500,
    lineHeight: 1.2
  });

  const dropdownPanelStyle = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    zIndex: 1000,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-sm)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.65)',
    minWidth: '215px',
    padding: '0.4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem'
  };

  const dropdownItemStyle = {
    justifyContent: 'flex-start',
    border: 'none',
    background: 'transparent',
    padding: '0.4rem 0.65rem',
    fontSize: '0.8rem',
    textAlign: 'left',
    width: '100%',
    borderRadius: '5px'
  };

  return (
    <div
      ref={menuContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
        background: 'var(--bg-tertiary)',
        padding: '0.65rem 0.85rem',
        borderRadius: 'var(--border-radius-sm)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Row 1: Mode Switcher, Font Family, Font Size, View Options, Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* Mode Switcher Pill */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-primary)',
            padding: '2px',
            borderRadius: '7px',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            className={`btn ${editorMode === 'plain' ? 'btn-primary' : ''}`}
            onClick={() => onModeChange('plain')}
            style={{
              padding: '0.28rem 0.6rem',
              fontSize: '0.76rem',
              borderRadius: '5px',
              background: editorMode === 'plain' ? undefined : 'transparent'
            }}
            title="Plain Text, JSON, Batch & Code Editor"
          >
            <CodeBracketIcon style={{ width: 14, height: 14 }} />
            Text & Code
          </button>
          <button
            type="button"
            className={`btn ${editorMode === 'rich' ? 'btn-primary' : ''}`}
            onClick={() => onModeChange('rich')}
            style={{
              padding: '0.28rem 0.6rem',
              fontSize: '0.76rem',
              borderRadius: '5px',
              background: editorMode === 'rich' ? undefined : 'transparent'
            }}
            title="WordPad Rich Text Document Mode"
          >
            <DocumentTextIcon style={{ width: 14, height: 14 }} />
            WordPad Rich Text
          </button>
        </div>

        <div style={{ width: '1px', height: '22px', background: 'var(--border-color)' }} />

        {/* Font Family */}
        <select
          className="input-field"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          style={{ padding: '0.28rem 0.5rem', fontSize: '0.78rem', width: 'auto', minWidth: '155px' }}
          title="Font Family"
        >
          {FONT_FAMILIES.map(f => (
            <option key={f.id} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Font Size */}
        <select
          className="input-field"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          style={{ padding: '0.28rem 0.45rem', fontSize: '0.78rem', width: '74px' }}
          title="Font Size"
        >
          {FONT_SIZES.map(sz => (
            <option key={sz} value={sz}>{sz} px</option>
          ))}
        </select>

        {/* Line Spacing */}
        <select
          className="input-field"
          value={lineHeight}
          onChange={(e) => setLineHeight(Number(e.target.value))}
          style={{ padding: '0.28rem 0.45rem', fontSize: '0.78rem', width: '82px' }}
          title="Line Spacing"
        >
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={1.75}>1.75x</option>
          <option value={2.0}>2.0x</option>
        </select>

        <div style={{ width: '1px', height: '22px', background: 'var(--border-color)' }} />

        {/* View Toggles */}
        <button
          type="button"
          style={ribbonBtnStyle(wordWrap)}
          onClick={() => setWordWrap(!wordWrap)}
          title="Toggle Word Wrap"
        >
          <Bars3BottomLeftIcon style={{ width: 14, height: 14 }} />
          Wrap
        </button>

        {editorMode === 'plain' && (
          <button
            type="button"
            style={ribbonBtnStyle(showLineNumbers)}
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            title="Toggle Line Numbers Gutter"
          >
            <HashtagIcon style={{ width: 14, height: 14 }} />
            Lines
          </button>
        )}

        <button
          type="button"
          style={ribbonBtnStyle(paperView)}
          onClick={() => setPaperView(!paperView)}
          title="Toggle Centered WordPad Document Sheet View"
        >
          <DocumentDuplicateIcon style={{ width: 14, height: 14 }} />
          Page View
        </button>

        {/* Right-aligned Find & Timestamp & Print */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={ribbonBtnStyle(showFindReplace)}
            onClick={() => setShowFindReplace(!showFindReplace)}
            title="Find & Replace (Ctrl+F)"
          >
            <MagnifyingGlassIcon style={{ width: 14, height: 14 }} />
            Find / Replace
          </button>

          <button
            type="button"
            style={ribbonBtnStyle(false)}
            onClick={onInsertTimestamp}
            title="Insert Current Date & Time"
          >
            <ClockIcon style={{ width: 14, height: 14 }} />
            Time/Date
          </button>

          <button
            type="button"
            style={ribbonBtnStyle(false)}
            onClick={onPrint}
            title="Print Document"
          >
            <PrinterIcon style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Row 2: Rich Text Formatting OR Code/JSON/Text Utilities */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexWrap: 'wrap',
          paddingTop: '0.45rem',
          borderTop: '1px solid var(--border-color)'
        }}
      >
        {editorMode === 'rich' && (
          <>
            <select
              className="input-field"
              defaultValue="P"
              onChange={(e) => onExecRichCommand('formatBlock', e.target.value)}
              style={{ padding: '0.24rem 0.45rem', fontSize: '0.76rem', width: '115px' }}
              title="Paragraph Style"
            >
              <option value="P">Normal Text</option>
              <option value="H1">Heading 1</option>
              <option value="H2">Heading 2</option>
              <option value="H3">Heading 3</option>
              <option value="BLOCKQUOTE">Quote Block</option>
              <option value="PRE">Code Block</option>
            </select>

            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('bold')} title="Bold (Ctrl+B)">
              <strong>B</strong>
            </button>
            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('italic')} title="Italic (Ctrl+I)">
              <em>I</em>
            </button>
            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('underline')} title="Underline (Ctrl+U)">
              <u>U</u>
            </button>
            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('strikeThrough')} title="Strikethrough">
              <s>S</s>
            </button>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

            <label
              style={{ ...ribbonBtnStyle(), gap: '0.25rem', padding: '0.2rem 0.45rem' }}
              title="Text Color"
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>A</span>
              <input
                type="color"
                defaultValue="#40e0d0"
                onChange={(e) => onExecRichCommand('foreColor', e.target.value)}
                style={{ width: 18, height: 18, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
              />
            </label>

            <label
              style={{ ...ribbonBtnStyle(), gap: '0.25rem', padding: '0.2rem 0.45rem' }}
              title="Highlight Color"
            >
              <span style={{ fontSize: '0.72rem' }}>🖍️</span>
              <input
                type="color"
                defaultValue="#facc15"
                onChange={(e) => onExecRichCommand('hiliteColor', e.target.value)}
                style={{ width: 18, height: 18, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
              />
            </label>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('justifyLeft')} title="Align Left">
              ⇤ Left
            </button>
            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('justifyCenter')} title="Align Center">
              ⇔ Center
            </button>
            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('justifyRight')} title="Align Right">
              ⇥ Right
            </button>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('insertUnorderedList')} title="Bullet List">
              • List
            </button>
            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('insertOrderedList')} title="Numbered List">
              1. List
            </button>
            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('insertHorizontalRule')} title="Insert Divider Line">
              ― Rule
            </button>
            <button type="button" style={ribbonBtnStyle()} onClick={() => onExecRichCommand('removeFormat')} title="Clear Formatting">
              Clear Format
            </button>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
          </>
        )}

        {/* JSON & Code Formatting Buttons */}
        <button
          type="button"
          style={ribbonBtnStyle(false)}
          onClick={() => onFormatJson(2)}
          title="Format / Prettify JSON (2-space indent)"
        >
          <SparklesIcon style={{ width: 14, height: 14, color: 'var(--accent-color)' }} />
          Format JSON
        </button>

        <button
          type="button"
          style={ribbonBtnStyle(false)}
          onClick={onMinifyJson}
          title="Minify JSON to a single line"
        >
          Minify JSON
        </button>

        {/* Beautify Code Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={ribbonBtnStyle(openMenu === 'beautify')}
            onClick={() => toggleMenu('beautify')}
          >
            Beautify Code
            <ChevronDownIcon style={{ width: 12, height: 12 }} />
          </button>
          {openMenu === 'beautify' && (
            <div className="animate-menu-in" style={dropdownPanelStyle}>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onFormatJson(2); setOpenMenu(null); }}>
                JSON (2 spaces)
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onFormatJson(4); setOpenMenu(null); }}>
                JSON (4 spaces)
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onBeautifyCode('html'); setOpenMenu(null); }}>
                HTML / XML Beautify
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onBeautifyCode('css'); setOpenMenu(null); }}>
                CSS Stylesheet Beautify
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onBeautifyCode('js'); setOpenMenu(null); }}>
                JavaScript / TypeScript Beautify
              </button>
            </div>
          )}
        </div>

        {/* Text Tools Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={ribbonBtnStyle(openMenu === 'transform')}
            onClick={() => toggleMenu('transform')}
          >
            Text & Line Tools
            <ChevronDownIcon style={{ width: 12, height: 12 }} />
          </button>
          {openMenu === 'transform' && (
            <div className="animate-menu-in" style={{ ...dropdownPanelStyle, minWidth: '235px', maxHeight: '340px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.25rem 0.6rem', letterSpacing: '0.5px' }}>
                Case Conversion
              </div>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('uppercase'); setOpenMenu(null); }}>UPPERCASE</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('lowercase'); setOpenMenu(null); }}>lowercase</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('titlecase'); setOpenMenu(null); }}>Title Case</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('sentencecase'); setOpenMenu(null); }}>Sentence case</button>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.2rem 0' }} />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.25rem 0.6rem', letterSpacing: '0.5px' }}>
                Line Operations
              </div>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('sort-asc'); setOpenMenu(null); }}>Sort Lines (A → Z)</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('sort-desc'); setOpenMenu(null); }}>Sort Lines (Z → A)</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('dedupe-lines'); setOpenMenu(null); }}>Remove Duplicate Lines</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('remove-empty-lines'); setOpenMenu(null); }}>Remove Blank Lines</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('trim-lines'); setOpenMenu(null); }}>Trim Line Whitespace</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('number-lines'); setOpenMenu(null); }}>Add Line Numbers (1. 2. 3.)</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('reverse-lines'); setOpenMenu(null); }}>Reverse Line Order</button>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.2rem 0' }} />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.25rem 0.6rem', letterSpacing: '0.5px' }}>
                Encoding & Escaping
              </div>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('base64-encode'); setOpenMenu(null); }}>Base64 Encode</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('base64-decode'); setOpenMenu(null); }}>Base64 Decode</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('url-encode'); setOpenMenu(null); }}>URL Encode</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('url-decode'); setOpenMenu(null); }}>URL Decode</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('json-escape'); setOpenMenu(null); }}>JSON String Escape</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('json-unescape'); setOpenMenu(null); }}>JSON String Unescape</button>
            </div>
          )}
        </div>

        {/* Starter Templates Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={ribbonBtnStyle(openMenu === 'templates')}
            onClick={() => toggleMenu('templates')}
          >
            Insert Template
            <ChevronDownIcon style={{ width: 12, height: 12 }} />
          </button>
          {openMenu === 'templates' && (
            <div className="animate-menu-in" style={dropdownPanelStyle}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.25rem 0.6rem', letterSpacing: '0.5px' }}>
                Starter Boilerplates
              </div>
              {STARTER_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  className="btn"
                  style={dropdownItemStyle}
                  onClick={() => {
                    onApplyTemplate(tpl);
                    setOpenMenu(null);
                  }}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
