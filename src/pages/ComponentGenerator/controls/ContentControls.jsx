export default function ContentControls({
  showText,
  setShowText,
  fontFamily,
  setFontFamily,
  cardTitle,
  setCardTitle,
  cardTitleSize,
  setCardTitleSize,
  cardTitleColor,
  setCardTitleColor,
  cardSubtitle,
  setCardSubtitle,
  cardSubtitleSize,
  setCardSubtitleSize,
  cardSubtitleColor,
  setCardSubtitleColor,
  iconLink,
  setIconLink
}) {
  return (
    <div className="control-group" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <input type="checkbox" checked={showText} onChange={e => setShowText(e.target.checked)} style={{ accentColor: 'var(--primary-color)' }} />
        <label style={{ fontWeight: 'bold' }}>Enable Text</label>
      </div>
      <div style={{ opacity: showText ? 1 : 0.5, pointerEvents: showText ? 'auto' : 'none', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label>Font</label>
          <select className="input-field" value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={{ padding: '2px 8px', fontSize: '0.8rem', width: 'auto' }}>
            <option value="system-ui, -apple-system, sans-serif">System Sans</option>
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Roboto', sans-serif">Roboto</option>
            <option value="'Playfair Display', serif">Playfair Display</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label>Title</label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.7rem', opacity: 0.7 }}>Size:</label>
              <input type="number" step="0.1" value={cardTitleSize} onChange={e => setCardTitleSize(Number(e.target.value))} style={{ width: '45px', padding: '0 4px', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px' }} title="Font Size (rem)" />
              <label style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '4px' }}>Color:</label>
              <input type="color" value={cardTitleColor} onChange={e => setCardTitleColor(e.target.value)} style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} title="Text Color" />
            </div>
          </div>
          <input type="text" className="input-field" value={cardTitle} onChange={e => setCardTitle(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label>Subtitle</label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.7rem', opacity: 0.7 }}>Size:</label>
              <input type="number" step="0.1" value={cardSubtitleSize} onChange={e => setCardSubtitleSize(Number(e.target.value))} style={{ width: '45px', padding: '0 4px', fontSize: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px' }} title="Font Size (rem)" />
              <label style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '4px' }}>Color:</label>
              <input type="color" value={cardSubtitleColor} onChange={e => setCardSubtitleColor(e.target.value)} style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} title="Text Color" />
            </div>
          </div>
          <input type="text" className="input-field" value={cardSubtitle} onChange={e => setCardSubtitle(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Click Link URL (Optional)</label>
          <input type="url" className="input-field" placeholder="https://..." value={iconLink} onChange={e => setIconLink(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
