import { contentDisposition, safeOriginalName } from './attachment-filename';

describe('attachment filename handling', () => {
  it('removes paths and control characters from stored names', () => {
    expect(safeOriginalName('../folder\\bad\u0000name.txt')).toBe('badname.txt');
    expect(safeOriginalName('   ')).toBe('attachment');
  });

  it('repairs UTF-8 multipart filenames exposed as Latin-1', () => {
    expect(safeOriginalName('rÃ©sumÃ©.txt')).toBe('résumé.txt');
  });

  it('creates safe ASCII and RFC 5987 content-disposition names', () => {
    const value = contentDisposition('résumé "final".pdf');
    expect(value).toContain('filename="r_sum_ _final_.pdf"');
    expect(value).toContain("filename*=UTF-8''r%C3%A9sum%C3%A9%20%22final%22.pdf");
    expect(value).not.toContain('\r');
    expect(value).not.toContain('\n');
  });
});
