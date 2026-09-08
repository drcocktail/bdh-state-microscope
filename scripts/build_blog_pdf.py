#!/usr/bin/env python3
"""Build the submission blog PDF from docs/BLOG.md with a stable layout."""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "BLOG.md"
OUTPUT = ROOT / "output" / "pdf" / "dataforge-latent-reasoning-blog.pdf"

INK = colors.HexColor("#171814")
MUTED = colors.HexColor("#69695f")
PAPER = colors.HexColor("#F3EFE6")
ACID = colors.HexColor("#D7F35F")
VIOLET = colors.HexColor("#7657E8")
LINE = colors.HexColor("#CBC3B3")


def inline_markup(text: str) -> str:
    """Escape Markdown text and support links plus bold spans."""
    escaped = html.escape(text)
    escaped = re.sub(
        r"\[([^]]+)\]\((https?://[^)]+)\)",
        r'<link href="\2" color="#5B3FD1"><u>\1</u></link>',
        escaped,
    )
    escaped = re.sub(
        r'(?<!href=")(https?://[^\s<]+)',
        r'<link href="\1" color="#5B3FD1"><u>\1</u></link>',
        escaped,
    )
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    return escaped


def body_word_count(markdown: str) -> int:
    body = markdown.split("## References", 1)[0]
    body = re.sub(r"https?://\S+", "", body)
    body = re.sub(r"[#*_>`\[\]()]", " ", body)
    return len(re.findall(r"\b[\w'-]+\b", body))


def page_chrome(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(22 * mm, height - 17 * mm, width - 22 * mm, height - 17 * mm)
    canvas.setFont("Helvetica-Bold", 7.4)
    canvas.setFillColor(INK)
    canvas.drawString(22 * mm, height - 13.2 * mm, "STATE MICROSCOPE / DATAFORGE 2026")
    canvas.setFont("Helvetica", 7.2)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 22 * mm, height - 13.2 * mm, "PATHWAY TRACK BLOG")
    canvas.line(22 * mm, 15 * mm, width - 22 * mm, 15 * mm)
    canvas.drawString(22 * mm, 10.5 * mm, "Observability Constraints in Latent Reasoning Systems")
    canvas.drawRightString(width - 22 * mm, 10.5 * mm, f"{doc.page:02d}")
    canvas.restoreState()


def build_story(markdown: str):
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Times-Roman",
        fontSize=31,
        leading=32,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=12 * mm,
    )
    deck = ParagraphStyle(
        "Deck",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=15,
        textColor=INK,
        backColor=ACID,
        borderPadding=(9, 10, 9, 10),
        spaceAfter=9 * mm,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Times-Roman",
        fontSize=10.7,
        leading=15.4,
        textColor=INK,
        spaceAfter=4.3 * mm,
        allowWidows=0,
        allowOrphans=0,
    )
    heading = ParagraphStyle(
        "Heading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=INK,
        spaceBefore=5 * mm,
        spaceAfter=3.5 * mm,
        keepWithNext=1,
    )
    meta = ParagraphStyle(
        "Meta",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.6,
        leading=10,
        textColor=VIOLET,
        spaceAfter=4 * mm,
    )
    reference = ParagraphStyle(
        "Reference",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=11.2,
        textColor=MUTED,
        leftIndent=4 * mm,
        firstLineIndent=-4 * mm,
        spaceAfter=2.5 * mm,
    )

    story = []
    paragraphs = [part.strip() for part in markdown.split("\n\n") if part.strip()]
    in_references = False
    for part in paragraphs:
        if part.startswith("# "):
            story.append(Spacer(1, 8 * mm))
            story.append(Paragraph(inline_markup(part[2:]), title))
        elif part.startswith("## "):
            label = part[3:]
            in_references = label == "References"
            story.append(Paragraph(inline_markup(label), heading))
        elif part.startswith("**Blog topic"):
            story.append(Paragraph(inline_markup(part), meta))
        elif part.startswith("**Central claim:"):
            story.append(Paragraph(inline_markup(part), deck))
        elif in_references and re.match(r"\d+\. ", part):
            story.append(Paragraph(inline_markup(part), reference))
        else:
            story.append(Paragraph(inline_markup(part.replace("\n", " ")), body))
    return story


def main() -> None:
    markdown = SOURCE.read_text(encoding="utf-8")
    count = body_word_count(markdown)
    if not 600 <= count <= 800:
        raise SystemExit(f"Blog body must contain 600-800 words; found {count}.")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
        topMargin=22 * mm,
        bottomMargin=21 * mm,
        title="Reasoning Without a Transcript Is Not Reasoning Without Evidence",
        author="BDH State Microscope contributors",
        subject="DataForge 2026 Pathway Track Blog",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        width - doc.leftMargin - doc.rightMargin,
        height - doc.topMargin - doc.bottomMargin,
        id="body",
        showBoundary=0,
    )
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_chrome)])
    doc.build(build_story(markdown))
    print(f"Wrote {OUTPUT} ({count} body words)")


if __name__ == "__main__":
    main()
