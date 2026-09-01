import { strFromU8, unzipSync } from 'fflate';

export function extractSubmissionText(bytes: ArrayBuffer, extension: string): string {
  if (extension === 'txt' || extension === 'md') return new TextDecoder().decode(bytes).trim().slice(0, 80_000);
  if (extension !== 'docx') return '';
  try {
    const archive = unzipSync(new Uint8Array(bytes));
    const paths = Object.keys(archive).filter((path) => /^word\/(document|footnotes|endnotes|header\d+|footer\d+)\.xml$/.test(path));
    return paths.map((path) => xmlToText(strFromU8(archive[path]))).filter(Boolean).join('\n\n').trim().slice(0, 80_000);
  } catch {
    return '';
  }
}

function xmlToText(xml: string): string {
  return xml
    .replace(/<w:tab\s*\/>/g, '\t')
    .replace(/<w:(?:br|cr)\s*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
