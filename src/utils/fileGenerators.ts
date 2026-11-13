import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { StudioFile } from '../types/pulgi';
import { sanitizeFileName } from './pulgiLogic';

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function generatePdfBlob(title: string, content: string): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, margin, 64);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(content, maxWidth) as string[];
  let y = 96;
  for (const line of lines) {
    if (y > pageHeight - 54) {
      doc.addPage();
      y = 54;
    }
    doc.text(line, margin, y);
    y += 16;
  }

  return doc.output('blob');
}

export async function generateDocxBlob(title: string, content: string): Promise<Blob> {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  const paragraphs = [title, '', ...content.split(/\r?\n/)]
    .map((line, i) => {
      const text = xmlEscape(line);
      if (i === 0) {
        return `<w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
      }
      return `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
    })
    .join('');

  zip.folder('word')?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}<w:sectPr/></w:body>
</w:document>`
  );

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function colLetter(colIdx: number): string {
  let s = '';
  let n = colIdx + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export async function generateXlsxBlob(content: string): Promise<Blob> {
  const zip = new JSZip();
  const rows = content
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((line) => line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, '')));

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
  );
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );
  zip.folder('xl')?.file(
    'workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="PulgiSheet" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
  );
  zip.folder('xl/_rels')?.file(
    'workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
  );

  const sheetRows = rows
    .map((cells, rIdx) => {
      const cellsXml = cells
        .map((val, cIdx) => {
          const ref = `${colLetter(cIdx)}${rIdx + 1}`;
          const num = Number(val);
          if (val !== '' && !Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(val)) {
            return `<c r="${ref}"><v>${num}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(val)}</t></is></c>`;
        })
        .join('');
      return `<row r="${rIdx + 1}">${cellsXml}</row>`;
    })
    .join('');

  zip.folder('xl/worksheets')?.file(
    'sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`
  );

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export async function generatePptxBlob(title: string, content: string): Promise<Blob> {
  const zip = new JSZip();
  const blocks = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const slides = blocks.length > 0 ? blocks : [content || title];

  const slideOverrides = slides
    .map(
      (_, i) =>
        `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join('');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-officedocument.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slideOverrides}
</Types>`
  );

  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  const sldIdLst = slides
    .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`)
    .join('');
  const presRels = slides
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
    )
    .join('');

  zip.folder('ppt')?.file(
    'presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldSz cx="9144000" cy="5143500"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:sldIdLst>${sldIdLst}</p:sldIdLst>
</p:presentation>`
  );
  zip.folder('ppt/_rels')?.file(
    'presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${presRels}</Relationships>`
  );

  slides.forEach((slideText, i) => {
    const lines = slideText.split(/\r?\n/);
    const heading = i === 0 ? title : lines[0] || `Slide ${i + 1}`;
    const body = i === 0 ? lines.join(' — ') : lines.slice(1).join('\n') || lines[0];

    zip.folder('ppt/slides')?.file(
      `slide${i + 1}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="450000"/><a:ext cx="7900000" cy="900000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="2800" b="1"/><a:t>${xmlEscape(heading)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Body"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="600000" y="1500000"/><a:ext cx="7900000" cy="3000000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1800"/><a:t>${xmlEscape(body)}</a:t></a:r></a:p></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
    );
  });

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

export async function downloadStudioFile(file: Pick<StudioFile, 'name' | 'format' | 'content' | 'binaryBase64' | 'mimeType'>) {
  const fmt = file.format.toLowerCase();
  const filename = sanitizeFileName(file.name, fmt);

  if (file.binaryBase64) {
    const bin = atob(file.binaryBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    triggerBlobDownload(new Blob([bytes], { type: file.mimeType || 'application/octet-stream' }), filename);
    return;
  }

  if (fmt === 'pdf') {
    const blob = await generatePdfBlob(file.name, file.content);
    triggerBlobDownload(blob, filename);
    return;
  }
  if (fmt === 'docx') {
    const blob = await generateDocxBlob(file.name, file.content);
    triggerBlobDownload(blob, filename);
    return;
  }
  if (fmt === 'xlsx') {
    const blob = await generateXlsxBlob(file.content);
    triggerBlobDownload(blob, filename);
    return;
  }
  if (fmt === 'pptx') {
    const blob = await generatePptxBlob(file.name, file.content);
    triggerBlobDownload(blob, filename);
    return;
  }
  if (fmt === 'zip') {
    const zip = new JSZip();
    zip.file('conteudo.txt', file.content);
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerBlobDownload(blob, filename);
    return;
  }

  const mimeMap: Record<string, string> = {
    txt: 'text/plain;charset=utf-8',
    md: 'text/markdown;charset=utf-8',
    json: 'application/json;charset=utf-8',
    csv: 'text/csv;charset=utf-8',
    html: 'text/html;charset=utf-8',
    css: 'text/css;charset=utf-8',
    js: 'application/javascript;charset=utf-8',
    py: 'text/x-python;charset=utf-8',
    svg: 'image/svg+xml;charset=utf-8',
  };
  triggerBlobDownload(new Blob([file.content], { type: mimeMap[fmt] || 'text/plain;charset=utf-8' }), filename);
}

export async function downloadFilesAsZip(zipName: string, files: { name: string; content: string }[]) {
  const zip = new JSZip();
  files.forEach((f) => {
    zip.file(f.name, f.content);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(blob, sanitizeFileName(zipName, 'zip'));
}
