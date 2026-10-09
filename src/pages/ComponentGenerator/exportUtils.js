import { toBlob, toCanvas } from 'html-to-image';
import { downloadBlob, copyBlobToClipboard } from '../../utils/downloadUtils';

/**
 * Downloads a DOM element as a high-resolution PNG.
 */
export async function downloadComponentPng(element, filename = 'component.png') {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const targetWidth = Math.max(1000, rect.width * 2);
  const scale = targetWidth / rect.width;

  const blob = await toBlob(element, {
    pixelRatio: scale,
    backgroundColor: 'transparent'
  });

  if (blob) {
    downloadBlob(blob, filename);
  }
}

/**
 * Copies the DOM element as PNG to the user's system clipboard.
 */
export async function copyComponentImage(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const targetWidth = Math.max(1000, rect.width * 2);
  const scale = targetWidth / rect.width;

  const blob = await toBlob(element, {
    pixelRatio: scale,
    backgroundColor: 'transparent'
  });

  if (blob) {
    return await copyBlobToClipboard(blob);
  }
  return false;
}

/**
 * Downloads raw SVG markup as a .svg file.
 */
export function downloadSvgFile(svgString, filename = 'component.svg') {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Renders the component to canvas and packages it into a high-DPI PDF document.
 */
export async function downloadComponentPdf(element, filename = 'component.pdf') {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);

  const originalTransform = element.style.transform;
  element.style.transform = 'none';

  const canvas = await toCanvas(element, {
    pixelRatio: 4, // 300+ DPI high resolution vector quality
    backgroundColor: 'transparent'
  });

  element.style.transform = originalTransform;

  const jpegUrl = canvas.toDataURL('image/jpeg', 0.95);
  const base64Data = jpegUrl.split(',')[1];
  const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  const pdfHeader = `%PDF-1.4\n`;
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources 4 0 R /Contents 5 0 R >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /ProcSet [/PDF /ImageC /ImageI] /XObject << /Im1 6 0 R >> >>\nendobj\n`;
  
  const streamContent = `q\n${w} 0 0 ${h} 0 0 cm\n/Im1 Do\nQ\n`;
  const obj5 = `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`;

  const obj6Header = `6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`;
  const obj6Footer = `\nendstream\nendobj\n`;

  let offset = pdfHeader.length;
  const offsets = [0];
  offsets.push(offset); offset += obj1.length;
  offsets.push(offset); offset += obj2.length;
  offsets.push(offset); offset += obj3.length;
  offsets.push(offset); offset += obj4.length;
  offsets.push(offset); offset += obj5.length;
  offsets.push(offset);

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(pdfHeader + obj1 + obj2 + obj3 + obj4 + obj5 + obj6Header);
  const footerBytes = encoder.encode(obj6Footer);

  offset += headerBytes.length + imgBytes.length + footerBytes.length;

  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;

  const xrefBytes = encoder.encode(xref + trailer);
  const totalLength = headerBytes.length + imgBytes.length + footerBytes.length + xrefBytes.length;
  const pdfBuffer = new Uint8Array(totalLength);
  
  pdfBuffer.set(headerBytes, 0);
  pdfBuffer.set(imgBytes, headerBytes.length);
  pdfBuffer.set(footerBytes, headerBytes.length + imgBytes.length);
  pdfBuffer.set(xrefBytes, headerBytes.length + imgBytes.length + footerBytes.length);

  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  downloadBlob(blob, filename);
}
