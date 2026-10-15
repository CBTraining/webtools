import { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  Bars3BottomLeftIcon,
  HashtagIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/solid';
import { FONT_FAMILIES, FONT_SIZES, STARTER_TEMPLATES } from './textStudioConstants';

export default function WordpadToolbar({
  editorMode,
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

  const pillBtn = (active = false) => ({
    padding: '0.28rem 0.5rem',
    fontSize: '0.76rem',
    background: active ? 'var(--accent-transparent)' : 'var(--bg-primary)',
    border: `1px solid ${active ? 'var(--accent-color)' : 'var(--border-color)'}`,
    color: active ? 'var(--accent-color)' : 'var(--text-primary)',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    fontWeight: 500,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    outline: 'none',
    boxShadow: 'none'
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
    minWidth: '210px',
    padding: '0.35rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.12rem'
  };

  const dropdownItemStyle = {
    justifyContent: 'flex-start',
    border: 'none',
    background: 'transparent',
    padding: '0.38rem 0.6rem',
    fontSize: '0.79rem',
    textAlign: 'left',
    width: '100%',
    borderRadius: '5px'
  };

  const divider = <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', flexShrink: 0 }} />;

  return (
    <div
      ref={menuContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        background: 'var(--bg-tertiary)',
        padding: '0.5rem 0.65rem',
        borderRadius: 'var(--border-radius-sm)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Single Compact Main Ribbon Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', flexWrap: 'wrap' }}>
        {/* Font Family */}
        <select
          className="input-field"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          style={{ padding: '0.24rem 0.4rem', fontSize: '0.76rem', width: '138px' }}
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
          style={{ padding: '0.24rem 0.35rem', fontSize: '0.76rem', width: '64px' }}
          title="Font Size"
        >
          {FONT_SIZES.map(sz => (
            <option key={sz} value={sz}>{sz}px</option>
          ))}
        </select>

        {/* Line Spacing */}
        <select
          className="input-field"
          value={lineHeight}
          onChange={(e) => setLineHeight(Number(e.target.value))}
          style={{ padding: '0.24rem 0.35rem', fontSize: '0.76rem', width: '62px' }}
          title="Line Spacing"
        >
          <option value={1.25}>1.2x</option>
          <option value={1.5}>1.5x</option>
          <option value={1.75}>1.8x</option>
          <option value={2.0}>2.0x</option>
        </select>

        {divider}

        {/* View Toggles */}
        <button
          type="button"
          style={pillBtn(wordWrap)}
          onClick={() => setWordWrap(!wordWrap)}
          title="Toggle Word Wrap"
        >
          <Bars3BottomLeftIcon style={{ width: 13, height: 13 }} />
          Wrap
        </button>

        {editorMode === 'plain' && (
          <button
            type="button"
            style={pillBtn(showLineNumbers)}
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            title="Toggle Line Numbers"
          >
            <HashtagIcon style={{ width: 13, height: 13 }} />
            Lines
          </button>
        )}

        <button
          type="button"
          style={pillBtn(paperView)}
          onClick={() => setPaperView(!paperView)}
          title="Toggle Centered Document Sheet View"
        >
          <DocumentDuplicateIcon style={{ width: 13, height: 13 }} />
          Sheet
        </button>

        {divider}

        {/* Format & Beautify Menu */}
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            type="button"
            style={{
              ...pillBtn(false),
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: 'none'
            }}
            onClick={() => onFormatJson(2)}
            title="Format / Prettify JSON (2 spaces)"
          >
            <SparklesIcon style={{ width: 13, height: 13, color: 'var(--accent-color)' }} />
            Format JSON
          </button>
          <button
            type="button"
            style={{
              ...pillBtn(openMenu === 'beautify'),
              padding: '0.28rem 0.35rem',
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0
            }}
            onClick={() => toggleMenu('beautify')}
            title="More Code Formatters (Minify JSON, HTML, CSS, JS)"
          >
            <ChevronDownIcon style={{ width: 11, height: 11 }} />
          </button>
          {openMenu === 'beautify' && (
            <div className="animate-menu-in" style={dropdownPanelStyle}>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onFormatJson(2); setOpenMenu(null); }}>
                Format JSON (2 spaces)
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onFormatJson(4); setOpenMenu(null); }}>
                Format JSON (4 spaces)
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onMinifyJson(); setOpenMenu(null); }}>
                Minify JSON (Single line)
              </button>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.2rem 0' }} />
              <button className="btn" style={dropdownItemStyle} onClick={() => { onBeautifyCode('html'); setOpenMenu(null); }}>
                Beautify HTML / XML
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onBeautifyCode('css'); setOpenMenu(null); }}>
                Beautify CSS
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onBeautifyCode('js'); setOpenMenu(null); }}>
                Beautify JavaScript / TS
              </button>
            </div>
          )}
        </div>

        {/* Text & Line Tools Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            style={pillBtn(openMenu === 'transform')}
            onClick={() => toggleMenu('transform')}
          >
            Text Tools
            <ChevronDownIcon style={{ width: 11, height: 11 }} />
          </button>
          {openMenu === 'transform' && (
            <div className="animate-menu-in" style={{ ...dropdownPanelStyle, minWidth: '220px', maxHeight: '340px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.2rem 0.6rem', letterSpacing: '0.5px' }}>
                Quick Actions
              </div>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onInsertTimestamp(); setOpenMenu(null); }}>
                🕒 Insert Time & Date
              </button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onPrint(); setOpenMenu(null); }}>
                🖨️ Print Document...
              </button>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.2rem 0' }} />
              <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.2rem 0.6rem', letterSpacing: '0.5px' }}>
                Case Conversion
              </div>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('uppercase'); setOpenMenu(null); }}>UPPERCASE</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('lowercase'); setOpenMenu(null); }}>lowercase</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('titlecase'); setOpenMenu(null); }}>Title Case</button>
              <button className="btn" style={dropdownItemStyle} onClick={() => { onTransformText('sentencecase'); setOpenMenu(null); }}>Sentence case</button>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.2rem 0' }} />
              <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.2rem 0.6rem', letterSpacing: '0.5px' }}>
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
              <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.2rem 0.6rem', letterSpacing: '0.5px' }}>
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
            style={pillBtn(openMenu === 'templates')}
            onClick={() => toggleMenu('templates')}
          >
            Templates
            <ChevronDownIcon style={{ width: 11, height: 11 }} />
          </button>
          {openMenu === 'templates' && (
            <div className="animate-menu-in" style={dropdownPanelStyle}>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textTransform: 'uppercase', padding: '0.2rem 0.6rem', letterSpacing: '0.5px' }}>
                Load Boilerplate
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

        {/* Find & Replace Toggle pushed to right */}
        <button
          type="button"
          style={{ ...pillBtn(showFindReplace), marginLeft: 'auto' }}
          onClick={() => setShowFindReplace(!showFindReplace)}
          title="Find & Replace (Ctrl+F)"
        >
          <MagnifyingGlassIcon style={{ width: 13, height: 13 }} />
          Find
        </button>
      </div>

      {/* Conditional Row 2: Rich Text Formatting Bar (Only shown when in WordPad Rich Text mode) */}
      {editorMode === 'rich' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            flexWrap: 'wrap',
            paddingTop: '0.4rem',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <select
            className="input-field"
            defaultValue="P"
            onChange={(e) => onExecRichCommand('formatBlock', e.target.value)}
            style={{ padding: '0.22rem 0.4rem', fontSize: '0.75rem', width: '110px' }}
            title="Paragraph Style"
          >
            <option value="P">Normal Text</option>
            <option value="H1">Heading 1</option>
            <option value="H2">Heading 2</option>
            <option value="H3">Heading 3</option>
            <option value="BLOCKQUOTE">Quote Block</option>
            <option value="PRE">Code Block</option>
          </select>

          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('bold')} title="Bold (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('italic')} title="Italic (Ctrl+I)">
            <em>I</em>
          </button>
          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('underline')} title="Underline (Ctrl+U)">
            <u>U</u>
          </button>
          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('strikeThrough')} title="Strikethrough">
            <s>S</s>
          </button>

          {divider}

          <label style={{ ...pillBtn(), gap: '0.2rem', padding: '0.18rem 0.4rem' }} title="Text Color">
            <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>A</span>
            <input
              type="color"
              defaultValue="#40e0d0"
              onChange={(e) => onExecRichCommand('foreColor', e.target.value)}
              style={{ width: 16, height: 16, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
            />
          </label>

          <label style={{ ...pillBtn(), gap: '0.2rem', padding: '0.18rem 0.4rem' }} title="Highlight Color">
            <span style={{ fontSize: '0.7rem' }}>🖍️</span>
            <input
              type="color"
              defaultValue="#facc15"
              onChange={(e) => onExecRichCommand('hiliteColor', e.target.value)}
              style={{ width: 16, height: 16, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
            />
          </label>

          {divider}

          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('justifyLeft')} title="Align Left">⇤</button>
          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('justifyCenter')} title="Align Center">⇔</button>
          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('justifyRight')} title="Align Right">⇥</button>

          {divider}

          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('insertUnorderedList')} title="Bullet List">• List</button>
          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('insertOrderedList')} title="Numbered List">1. List</button>
          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('insertHorizontalRule')} title="Insert Divider">―</button>
          <button type="button" style={pillBtn()} onClick={() => onExecRichCommand('removeFormat')} title="Clear Formatting">Clear</button>
        </div>
      )}
    </div>
  );
}
