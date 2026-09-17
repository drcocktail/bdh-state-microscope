"""Read-back gate, not visual QA: the committed PDF must contain the current essay."""
from pathlib import Path
import re
import unicodedata
from pypdf import PdfReader

markdown = Path("content/blog/reasoning-without-a-transcript.md").read_text()
body, references = markdown.split("---", 2)[2].split("## References", 1)
reader = PdfReader("public/blog/reasoning-without-a-transcript-v2.pdf")
text = "\n".join(page.extract_text() for page in reader.pages)

def normalize(value):
    # Ignore layout whitespace and reference numbering, not substantive words.
    value = re.sub(r"\[\d+\]", "", value)
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", value))

expected = normalize(re.sub(r"^## ", "", body, flags=re.MULTILINE))
assert expected in normalize(text), "v2 PDF essay diverges from canonical Markdown"
for reference in re.split(r"\n\s*\n", references.strip()):
    # The page renders reference URLs as PDF annotations rather than visible text.
    visible = re.sub(r"https://\S+", "", reference)
    assert normalize(visible) in normalize(text), "v2 PDF reference diverges"
uris = [str(a.get_object().get("/A", {}).get("/URI", ""))
        for page in reader.pages for a in page.get("/Annots", [])]
assert all(url in uris for url in re.findall(r"https://\S+", references)), "PDF reference link mismatch"
assert reader.trailer["/Root"].get("/MarkInfo"), "v2 PDF is not tagged"
assert not any(0xE000 <= ord(c) <= 0xF8FF for c in text), "Unextractable private glyph"
print(f"Canonical PDF body and all references verified by read-back: {len(reader.pages)} pages")
