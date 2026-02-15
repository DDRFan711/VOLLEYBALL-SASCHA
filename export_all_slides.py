import re
from pathlib import Path
import fitz  # PyMuPDF

base = Path(r"C:\Users\Administrator\Desktop\PP Sascha")
out_dir = base / "assets" / "images" / "improve_slides"
out_dir.mkdir(parents=True, exist_ok=True)

pat = re.compile(r"^Yellow Modern Volleyball Strategy Presentation \((\d+)\)\.pdf$", re.IGNORECASE)

def pdf_to_png(pdf_path: Path, out_png: Path, zoom=2.4):
    doc = fitz.open(str(pdf_path))
    page = doc.load_page(0)
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=True)
    pix.save(str(out_png))
    doc.close()

pdfs = []
for p in base.glob("*.pdf"):
    m = pat.match(p.name)
    if m:
        n = int(m.group(1))
        pdfs.append((n, p))

pdfs.sort(key=lambda x: x[0])

if not pdfs:
    print("No matching PDFs found.")
    raise SystemExit(1)

for n, pdf_path in pdfs:
    out_png = out_dir / f"slide{n:02d}.png"
    print(f"Exporting {pdf_path.name} -> {out_png}")
    pdf_to_png(pdf_path, out_png)

print("\nDONE! Slides exported to:")
print(out_dir)
