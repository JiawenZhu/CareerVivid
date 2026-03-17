import { PDFDocument } from 'pdf-lib';

/**
 * Removes specified pages from a PDF buffer.
 * @param pdfBuffer The PDF data as an ArrayBuffer or Uint8Array.
 * @param pageIndices Array of 0-based page indices to remove.
 * @returns Promise resolving to a Uint8Array of the modified PDF.
 */
export async function removePdfPages(
  pdfBuffer: ArrayBuffer | Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  
  // Sort indices in descending order to avoid issues when removing multiple pages
  const indicesToRemove = [...pageIndices].sort((a, b) => b - a);
  
  for (const index of indicesToRemove) {
    if (index >= 0 && index < pdfDoc.getPageCount()) {
      pdfDoc.removePage(index);
    }
  }
  
  return await pdfDoc.save();
}

/**
 * Checks if a PDF buffer is potentially valid.
 */
export function isValidPdf(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  // PDF magic number: %PDF (0x25 0x50 0x44 0x46)
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
