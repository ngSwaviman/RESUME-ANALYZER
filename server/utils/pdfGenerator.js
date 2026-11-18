/**
 * Demo resume PDF writer.
 *
 * Used only by the seed script and the NLP check to produce realistic sample
 * resumes. `pdfkit` is a devDependency - production uploads are parsed with
 * pdf.js (see services/pdfService.js) and never generated here.
 */
const PDFDocument = require('pdfkit');

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 56;

/**
 * @param {string[]} lines plain text lines. First line is the name (large heading),
 *                        short ALL-CAPS lines become section headings.
 * @returns {Promise<Buffer>} PDF bytes
 */
const buildResumePdf = (lines = []) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        info: { Title: lines[0] || 'Resume', Creator: 'Resume Analyzer demo data' },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const contentWidth = A4_WIDTH - MARGIN * 2;

      lines.forEach((rawLine, index) => {
        const line = String(rawLine || '').replace(/\t/g, '  ');

        if (!line.trim()) {
          doc.moveDown(0.45);
          return;
        }

        if (index === 0) {
          doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text(line, { width: contentWidth });
          doc.moveDown(0.25);
          return;
        }

        const isHeading = /^[A-Z][A-Z0-9 &/,'-]{2,40}$/.test(line.trim());
        if (isHeading) {
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').fontSize(10.8).fillColor('#1d4ed8').text(line, { width: contentWidth });
          doc.moveDown(0.15);
          return;
        }

        doc.font('Helvetica').fontSize(9.8).fillColor('#1f2937').text(line, { width: contentWidth, lineGap: 1.5 });
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });

module.exports = { buildResumePdf, A4_HEIGHT };
