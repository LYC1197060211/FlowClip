from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs" / "FlowClip-使用说明.md"
OUT = ROOT / "output" / "pdf" / "FlowClip_User_Guide.pdf"
ICON = ROOT / "build" / "icon.png"

FONT_REGULAR = Path(r"C:\Windows\Fonts\NotoSansSC-VF.ttf")


class AccentRule(Flowable):
    def __init__(self, width: float, color: colors.Color, thickness: float = 2.0):
        super().__init__()
        self.width = width
        self.height = thickness
        self.color = color
        self.thickness = thickness

    def draw(self) -> None:
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)


def register_fonts() -> tuple[str, str]:
    regular = "NotoSansSC"
    bold = "NotoSansSCBold"
    pdfmetrics.registerFont(TTFont(regular, str(FONT_REGULAR)))
    pdfmetrics.registerFont(TTFont(bold, str(FONT_REGULAR)))
    pdfmetrics.registerFontFamily(regular, normal=regular, bold=bold)
    return regular, bold


def inline_markup(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r"`([^`]+)`", r'<font color="#0f766e">\1</font>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return text


def make_styles(font: str, bold: str):
    base = getSampleStyleSheet()
    accent = colors.HexColor("#0f766e")
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName=bold,
            fontSize=28,
            leading=34,
            textColor=colors.HexColor("#111827"),
            alignment=TA_CENTER,
            wordWrap="CJK",
            spaceAfter=8,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle",
            fontName=font,
            fontSize=12,
            leading=18,
            textColor=colors.HexColor("#4b5563"),
            alignment=TA_CENTER,
            wordWrap="CJK",
        ),
        "h1": ParagraphStyle(
            "h1",
            fontName=bold,
            fontSize=20,
            leading=27,
            textColor=colors.HexColor("#111827"),
            wordWrap="CJK",
            spaceBefore=8,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "h2",
            fontName=bold,
            fontSize=14,
            leading=20,
            textColor=colors.HexColor("#0f766e"),
            wordWrap="CJK",
            spaceBefore=12,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            fontName=bold,
            fontSize=11.5,
            leading=17,
            textColor=colors.HexColor("#111827"),
            wordWrap="CJK",
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            fontName=font,
            fontSize=9.5,
            leading=15,
            textColor=colors.HexColor("#1f2937"),
            alignment=TA_LEFT,
            wordWrap="CJK",
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            fontName=font,
            fontSize=9.3,
            leading=14.5,
            textColor=colors.HexColor("#1f2937"),
            leftIndent=11,
            firstLineIndent=-7,
            bulletIndent=0,
            wordWrap="CJK",
            spaceAfter=3,
        ),
        "note": ParagraphStyle(
            "note",
            fontName=font,
            fontSize=8.6,
            leading=13,
            textColor=colors.HexColor("#4b5563"),
            wordWrap="CJK",
        ),
        "toc": ParagraphStyle(
            "toc",
            fontName=font,
            fontSize=9.5,
            leading=16,
            textColor=colors.HexColor("#1f2937"),
            wordWrap="CJK",
        ),
        "accent": accent,
    }


def build_story(md: str, styles) -> list:
    story: list = []

    if ICON.exists():
        img = Image(str(ICON), width=36 * mm, height=36 * mm)
        img.hAlign = "CENTER"
        story.extend([Spacer(1, 30 * mm), img, Spacer(1, 8 * mm)])

    story.append(Paragraph("FlowClip 使用说明", styles["cover_title"]))
    story.append(Paragraph("剪贴板、快捷短语、翻译与语音转写一体化桌面效率工具", styles["cover_subtitle"]))
    story.append(Spacer(1, 8 * mm))
    story.append(AccentRule(92 * mm, styles["accent"], 2.2))
    story.append(Spacer(1, 10 * mm))

    cards = Table(
        [
            [
                Paragraph("<b>快速找回</b><br/>自动保存剪贴板历史", styles["note"]),
                Paragraph("<b>快速输出</b><br/>短语和翻译一键复制", styles["note"]),
                Paragraph("<b>快速记录</b><br/>语音转写并支持术语润色", styles["note"]),
            ]
        ],
        colWidths=[50 * mm, 50 * mm, 50 * mm],
    )
    cards.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ecfeff")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#99f6e4")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ccfbf1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(cards)
    story.append(PageBreak())

    headings = [line[3:].strip() for line in md.splitlines() if line.startswith("## ")]
    story.append(Paragraph("目录", styles["h1"]))
    for title in headings:
        story.append(Paragraph(inline_markup(title), styles["toc"]))
    story.append(PageBreak())

    for raw in md.splitlines():
        line = raw.strip()
        if not line:
            story.append(Spacer(1, 2.2 * mm))
            continue
        if line.startswith("# "):
            continue
        if line.startswith("## "):
            story.append(KeepTogether([Paragraph(inline_markup(line[3:]), styles["h1"])]))
            continue
        if line.startswith("### "):
            story.append(Paragraph(inline_markup(line[4:]), styles["h2"]))
            continue
        if line.startswith("- "):
            story.append(Paragraph(inline_markup(line[2:]), styles["bullet"], bulletText="•"))
            continue
        if re.match(r"^\d+\.\s+", line):
            story.append(Paragraph(inline_markup(line), styles["body"]))
            continue
        story.append(Paragraph(inline_markup(line), styles["body"]))

    return story


def draw_page(canvas, doc) -> None:
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(colors.HexColor("#ccfbf1"))
    canvas.setLineWidth(0.8)
    canvas.line(doc.leftMargin, height - 14 * mm, width - doc.rightMargin, height - 14 * mm)
    canvas.setFillColor(colors.HexColor("#0f766e"))
    canvas.setFont("NotoSansSC", 8)
    canvas.drawString(doc.leftMargin, height - 11 * mm, "FlowClip 用户手册")
    canvas.setFillColor(colors.HexColor("#6b7280"))
    canvas.drawRightString(width - doc.rightMargin, 10 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


def main() -> None:
    font, bold = register_fonts()
    styles = make_styles(font, bold)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    md = DOC.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title="FlowClip 使用说明",
        author="FlowClip",
    )
    doc.build(build_story(md, styles), onFirstPage=draw_page, onLaterPages=draw_page)
    print(OUT)


if __name__ == "__main__":
    main()
