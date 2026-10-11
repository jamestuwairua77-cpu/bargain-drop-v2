// XLSX/XLS text extraction for the Architect Console Pages Function.
//
// An .xlsx is a ZIP archive of XML parts. We use the vendored fflate library
// (no node deps, Workers-compatible) to inflate the archive, then parse
// xl/sharedStrings.xml and xl/worksheets/sheet*.xml into a readable TSV.
// .xls (legacy binary BIFF) is NOT supported by this lightweight parser — we
// fall back to an honest note (full BIFF parsing is out of scope).

import { unzipSync } from '../../vendor/fflate.js';

const XML_ENTITIES = [
  [/&lt;/g, '<'], [/&gt;/g, '>'], [/&quot;/g, '"'], [/&apos;/g, "'"], [/&amp;/g, '&'],
];
function decodeEntities(s) {
  for (const [re, rep] of XML_ENTITIES) s = s.replace(re, rep);
  return s;
}

function parseSharedStrings(xml) {
  const out = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    const runs = [];
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm;
    while ((tm = tRe.exec(m[1]))) runs.push(decodeEntities(tm[1]));
    out.push(runs.join(''));
  }
  return out;
}

// Real implementation (clean, single pass):
export function extractXlsx(bytes) {
  let files;
  try {
    files = unzipSync(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  } catch (e) {
    return { ok: false, error: 'not a valid ZIP/XLSX archive: ' + e.message };
  }

  // sharedStrings
  let sharedStrings = [];
  const sst = files['xl/sharedStrings.xml'];
  if (sst) sharedStrings = parseSharedStrings(new TextDecoder().decode(sst));

  // workbook → sheet names (ordered by r:id, but sheet order in file list is enough)
  const sheetNames = [];
  const wb = files['xl/workbook.xml'];
  if (wb) {
    const wbXml = new TextDecoder().decode(wb);
    const sRe = /<sheet[^>]*name="([^"]*)"[^>]*\/?>/g;
    let m;
    while ((m = sRe.exec(wbXml))) sheetNames.push(m[1]);
  }

  // sheet files, sorted numerically
  const sheetFiles = Object.keys(files)
    .filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt((a.match(/sheet(\d+)/) || [])[1], 10);
      const nb = parseInt((b.match(/sheet(\d+)/) || [])[1], 10);
      return na - nb;
    });

  if (sheetFiles.length === 0) return { ok: false, error: 'no worksheets found in XLSX' };

  let out = '';
  for (let i = 0; i < sheetFiles.length; i++) {
    const xml = new TextDecoder().decode(files[sheetFiles[i]]);
    const label = sheetNames[i] || ('Sheet' + (i + 1));
    out += `### Sheet: ${label}\n`;

    const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
    let rm;
    let rowCount = 0;
    while ((rm = rowRe.exec(xml))) {
      const rowXml = rm[1];
      const cellRe = /<c\b[^>]*>([\s\S]*?)<\/c>/g;
      let cm;
      const cellVals = [];
      while ((cm = cellRe.exec(rowXml))) {
        let val = '';
        const tag = cm[0];
        let t = 'n';
        const tm = tag.match(/\bt="([^"]*)"/);
        if (tm) t = tm[1];
        const body = cm[1];
        if (t === 's') {
          const vm = body.match(/<v>([\s\S]*?)<\/v>/);
          if (vm) val = sharedStrings[parseInt(vm[1], 10)] ?? '';
        } else if (t === 'inlineStr') {
          const ism = body.match(/<t[^>]*>([\s\S]*?)<\/t>/);
          if (ism) val = decodeEntities(ism[1]);
        } else if (t === 'b') {
          const vm = body.match(/<v>([\s\S]*?)<\/v>/);
          val = vm ? (vm[1] === '1' ? 'TRUE' : 'FALSE') : '';
        } else {
          const vm = body.match(/<v>([\s\S]*?)<\/v>/);
          if (vm) val = vm[1];
        }
        // CSV-quote cells containing tab/newline/quote
        if (/[\t\n"]/.test(val)) val = '"' + val.replace(/"/g, '""') + '"';
        cellVals.push(val);
      }
      // skip fully-empty rows
      if (cellVals.some(v => v !== '')) {
        out += cellVals.join('\t') + '\n';
        rowCount++;
      }
    }
    if (rowCount === 0) out += '(empty sheet)\n';
    out += '\n';
  }

  return { ok: true, text: out.trim() };
}
