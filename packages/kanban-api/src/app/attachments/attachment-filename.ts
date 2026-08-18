export function safeOriginalName(originalName: string): string {
  const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
  const normalized = decoded.includes('\uFFFD') ? originalName : decoded;
  const leaf = normalized.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (leaf || 'attachment').slice(0, 255);
}

export function contentDisposition(originalName: string): string {
  const fallback = originalName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'attachment';
  const encoded = encodeURIComponent(originalName).replace(/['()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
