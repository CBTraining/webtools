export const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #f0f4f8;
      color: #333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    h1 { color: #0284c7; }
    .card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, World!</h1>
    <p>This is a live HTML preview tool.</p>
  </div>
</body>
</html>`;

export function preparePreviewHtml(rawHtml) {
  let previewHtml = rawHtml || '';
  const antiDarkMeta = '<meta name="color-scheme" content="only light"><meta name="darkreader-lock"><style>html, body { background-color: #ffffff; color: #000000; }</style>';
  
  if (previewHtml.includes('<head>')) {
    return previewHtml.replace('<head>', '<head>' + antiDarkMeta);
  } else if (previewHtml.toLowerCase().includes('<html>')) {
    return previewHtml.replace(/<html[^>]*>/i, (match) => match + '<head>' + antiDarkMeta + '</head>');
  } else {
    return '<head>' + antiDarkMeta + '</head>' + previewHtml;
  }
}
