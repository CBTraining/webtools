export default function RefineTab({
  edgeInset,
  setEdgeInset,
  defringe,
  setDefringe,
  edgeFeather,
  setEdgeFeather
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Edge Inset / Erode */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>📐 Edge Inset / Erode</span>
            <span style={{ color: edgeInset !== 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{edgeInset}px</span>
          </div>
          <input 
            type="range" 
            min="-4" 
            max="4" 
            step="0.5"
            value={edgeInset} 
            onChange={(e) => setEdgeInset(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Contract inward (-px) to instantly eliminate edge halos.
          </div>
        </div>

        {/* De-Fringe / Anti-Halo */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>✨ De-Fringe (De-Spill)</span>
            <span style={{ color: defringe > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{defringe}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={defringe} 
            onChange={(e) => setDefringe(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Removes background color bleed & light bounce from hair.
          </div>
        </div>

        {/* Edge Feather */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>🪶 Edge Softness / Feather</span>
            <span style={{ color: edgeFeather > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{edgeFeather}px</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="8" 
            step="0.5"
            value={edgeFeather} 
            onChange={(e) => setEdgeFeather(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Smooths pixelated cut lines for natural transition.
          </div>
        </div>
      </div>
    </div>
  );
}
