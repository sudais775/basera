#!/usr/bin/env python3
"""Generate Sudais Waheed's updated CV (two-page, sidebar layout)."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Sudais_Waheed_CV.pdf")
PHOTO_SRC = os.path.join(HERE, "img-001.jpg")
PHOTO_CROP = os.path.join(HERE, "photo_crop.jpg")

W, H = A4  # 595 x 842

# palette
SIDEBAR_BG = HexColor("#F3F2F0")
DARK = HexColor("#3B3B3B")
GRAY = HexColor("#8A8A85")
TEXT = HexColor("#4A4A4A")
DOT_ON = HexColor("#5A5A5A")
DOT_OFF = HexColor("#C9C8C4")
LINE = HexColor("#3B3B3B")

SB_X0, SB_X1 = 35, 235          # sidebar rect
SB_PAD = 14                     # inner padding
SB_CX = (SB_X0 + SB_X1) / 2
R_X0, R_X1 = 262, 560           # right column

# --- crop photo to head-and-shoulders square ---
img = Image.open(PHOTO_SRC)
w, h = img.size  # 717 x 1077
box = (150, 15, 590, 455)
img.crop(box).save(PHOTO_CROP, quality=92)


def spaced(c, x, y, text, font, size, color, tracking=1.6, center=None):
    c.setFont(font, size)
    c.setFillColor(color)
    t = c.beginText()
    if center is not None:
        width = c.stringWidth(text, font, size) + tracking * (len(text) - 1)
        x = center - width / 2
    t.setTextOrigin(x, y)
    t.setCharSpace(tracking)
    t.textOut(text)
    t.setCharSpace(0)  # Tc persists in the content stream; reset it
    c.drawText(t)


def wrap(c, text, font, size, maxw):
    words = text.split()
    lines, cur = [], ""
    for wd in words:
        trial = (cur + " " + wd).strip()
        if c.stringWidth(trial, font, size) <= maxw:
            cur = trial
        else:
            lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def side_heading(c, y, text):
    spaced(c, SB_X0 + SB_PAD, y, text, "Helvetica-Bold", 11, DARK, tracking=2)
    c.setStrokeColor(DARK)
    c.setLineWidth(0.8)
    c.line(SB_X0 + SB_PAD, y - 5, SB_X1 - SB_PAD, y - 5)
    return y - 5


def right_heading(c, y, text):
    spaced(c, R_X0, y, text, "Helvetica-Bold", 15, DARK, tracking=2.5)
    c.setStrokeColor(DARK)
    c.setLineWidth(1)
    c.line(R_X0, y - 8, R_X0 + 175, y - 8)
    return y - 8


def dots(c, x, y, filled, total=8):
    for i in range(total):
        c.setFillColor(DOT_ON if i < filled else DOT_OFF)
        c.circle(x + i * 11.5, y, 2.6, stroke=0, fill=1)


def skill(c, y, name, level):
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(DARK)
    c.drawString(SB_X0 + SB_PAD, y, name)
    dots(c, SB_X0 + SB_PAD + 3, y - 8.5, level)
    return y - 26


def job(c, y, company, role, duration, bullets):
    c.setFont("Helvetica-Bold", 11.5)
    c.setFillColor(DARK)
    c.drawString(R_X0, y, company)
    y -= 17
    c.setFont("Helvetica-Oblique", 11.5)
    c.setFillColor(GRAY)
    c.drawString(R_X0, y, role)
    dw = c.stringWidth(duration, "Helvetica-Bold", 8) + 0.8 * (len(duration) - 1)
    spaced(c, R_X1 - dw, y + 0.5, duration, "Helvetica-Bold", 8, DARK, tracking=0.8)
    y -= 16
    c.setFillColor(TEXT)
    for b in bullets:
        lines = wrap(c, b, "Helvetica", 9.5, R_X1 - R_X0 - 14)
        c.setFillColor(DARK)
        c.circle(R_X0 + 4, y + 3, 1.3, stroke=0, fill=1)
        c.setFillColor(TEXT)
        c.setFont("Helvetica", 9.5)
        for ln in lines:
            c.drawString(R_X0 + 12, y, ln)
            y -= 12.5
    return y - 14


def edu(c, y, line1, line2, inst, when):
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(DARK)
    c.drawString(R_X0, y, line1)
    y -= 15
    c.drawString(R_X0, y, line2)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawRightString(R_X1, y + 1, when)
    y -= 17
    c.setFont("Helvetica-Bold", 11.5)
    c.setFillColor(GRAY)
    c.drawString(R_X0, y, inst)
    return y - 26


c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Sudais Waheed — CV")
c.setAuthor("Sudais Waheed")

# ============ PAGE 1 ============
c.setFillColor(SIDEBAR_BG)
c.rect(SB_X0, 0, SB_X1 - SB_X0, H - 28, stroke=0, fill=1)

# photo with white ring
pc_y = H - 130
c.setFillColor(HexColor("#FFFFFF"))
c.circle(SB_CX, pc_y, 72, stroke=0, fill=1)
c.saveState()
p = c.beginPath()
p.circle(SB_CX, pc_y, 65)
c.clipPath(p, stroke=0)
c.drawImage(PHOTO_CROP, SB_CX - 65, pc_y - 65, 130, 130)
c.restoreState()

y = pc_y - 100
c.setFont("Helvetica-Bold", 19)
c.setFillColor(DARK)
c.drawCentredString(SB_CX, y, "Sudais Waheed")
y -= 20
spaced(c, 0, y, "VIDEO EDITOR  |  FREELANCER", "Helvetica", 8.5, GRAY,
       tracking=1.4, center=SB_CX)

# contact
y -= 34
contact = [
    ("pin", "Mozang, Lahore"),
    ("mail", "Sudaiswaheed775@gmail.com"),
    ("phone", "0305 1711772"),
]
for icon, txt in contact:
    ix, iy = SB_X0 + SB_PAD + 4, y + 3
    c.setStrokeColor(DARK)
    c.setLineWidth(1)
    if icon == "pin":
        c.circle(ix, iy + 1.5, 3, stroke=1, fill=0)
        c.line(ix - 2.1, iy - 0.6, ix, iy - 4.5)
        c.line(ix + 2.1, iy - 0.6, ix, iy - 4.5)
    elif icon == "mail":
        c.rect(ix - 4, iy - 3, 8, 6, stroke=1, fill=0)
        c.line(ix - 4, iy + 3, ix, iy - 0.5)
        c.line(ix + 4, iy + 3, ix, iy - 0.5)
    elif icon == "phone":
        c.roundRect(ix - 2.5, iy - 4, 5, 8, 1, stroke=1, fill=0)
        c.setFillColor(DARK)
        c.circle(ix, iy - 2.8, 0.5, stroke=0, fill=1)
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT)
    c.drawString(SB_X0 + SB_PAD + 16, y, txt)
    y -= 22

# profile
y -= 12
y = side_heading(c, y, "PROFILE")
y -= 16
profile = ("Qualified and professional video editor with 5+ years of "
           "experience across TV networks and digital media companies. "
           "Founder of MediaFed and an established freelancer — Top Rated "
           "on Upwork and Level 2 Seller on Fiverr. Strong creative and "
           "analytical skills, and a team player with an eye for detail.")
c.setFont("Helvetica", 9)
c.setFillColor(TEXT)
for ln in wrap(c, profile, "Helvetica", 9, SB_X1 - SB_X0 - 2 * SB_PAD):
    c.drawString(SB_X0 + SB_PAD, y, ln)
    y -= 12.5

# achievements
y -= 14
y = side_heading(c, y, "ACHIEVEMENTS")
y -= 18
achievements = [
    ("Top Rated Freelancer", "Upwork"),
    ("Level 2 Seller", "Fiverr"),
    ("Founder & Owner", "MediaFed"),
]
for title, org in achievements:
    # star badge
    sx, sy = SB_X0 + SB_PAD + 4, y + 2
    c.setFillColor(DARK)
    import math
    pts = []
    for i in range(10):
        ang = math.pi / 2 + i * math.pi / 5
        r = 4.2 if i % 2 == 0 else 1.8
        pts.append((sx + r * math.cos(ang), sy + r * math.sin(ang)))
    pth = c.beginPath()
    pth.moveTo(*pts[0])
    for pt in pts[1:]:
        pth.lineTo(*pt)
    pth.close()
    c.drawPath(pth, stroke=0, fill=1)
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(DARK)
    c.drawString(SB_X0 + SB_PAD + 14, y, title)
    y -= 12
    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(GRAY)
    c.drawString(SB_X0 + SB_PAD + 14, y, org)
    y -= 17

# skills page 1
y -= 8
y = side_heading(c, y, "SKILLS")
y -= 18
for name, lvl in [("Adobe Premiere Pro", 7), ("Adobe Photoshop", 6),
                  ("Adobe After Effects", 6), ("English Speaking", 6)]:
    y = skill(c, y, name, lvl)

# ---- right column page 1 ----
y = right_heading(c, H - 78, "WORK EXPERIENCE")
y -= 34
y = job(c, y, "MEDIAFED", "Founder & Owner", "ONGOING", [
    "Founded and own MediaFed, a digital media company providing video "
    "editing and content production services.",
    "Oversee creative production, client projects, and day-to-day business "
    "operations.",
])
y = job(c, y, "SOOPERCHEF", "Food Videography", "EIGHT MONTHS", [
    "Worked as a project manager for food videography content.",
    "Collaborated with a highly creative team in a fast-paced production "
    "environment.",
])
y = job(c, y, "SAB TV", "Entertainment Channel", "SIX MONTHS", [
    "Worked as a senior video editor.",
    "Managed and edited all media content for TV shows.",
])
y = job(c, y, "LEO TELEVISION NETWORK", "Medicine Company", "1 YEAR", [
    "Worked on marketing campaigns.",
    "Handled multiple digital accounts.",
])
y = job(c, y, "CHANNEL FIVE", "Mainstream Media", "2 YEARS", [
    "Worked as an NLE editor for news and programs.",
    "Handled multiple tasks at the same time.",
])
y = job(c, y, "TUM NEWS", "Mainstream Media", "1 YEAR", [
    "Worked as a news NLE editor.",
    "Prepared headlines and bulletin data.",
])

c.showPage()

# ============ PAGE 2 ============
c.setFillColor(SIDEBAR_BG)
c.rect(SB_X0, 28, SB_X1 - SB_X0, H - 56, stroke=0, fill=1)

y = H - 78
y = side_heading(c, y, "SKILLS")
y -= 18
for name, lvl in [("Communication", 6), ("Quick Learner", 6),
                  ("Management Skills", 6), ("Problem Solving", 6)]:
    y = skill(c, y, name, lvl)

y -= 14
y = side_heading(c, y, "LANGUAGES")
y -= 20
for lang, lvl in [("Urdu", "Native"), ("English", "Fluent"),
                  ("Punjabi", "Native")]:
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(DARK)
    c.drawString(SB_X0 + SB_PAD, y, lang)
    y -= 11
    c.setFont("Helvetica", 8)
    c.setFillColor(TEXT)
    c.drawString(SB_X0 + SB_PAD, y, lvl)
    y -= 17

# ---- right column page 2 ----
y = right_heading(c, H - 78, "WORK EXPERIENCE")
y -= 34
y = job(c, y, "HOTLINE TV", "Social Media", "1 YEAR", [
    "Worked as a social media manager.",
    "Handled multiple social media platforms at once.",
])

y -= 6
y = right_heading(c, y, "EDUCATION HISTORY")
y -= 36
y = edu(c, y, "Matriculation in", "Science", "MC High School", "2016 - 2018")
y = edu(c, y, "BA in", "Arts", "Punjab University", "2018 - 2020")
y = edu(c, y, "Master in", "English Literature", "Punjab University",
        "PART ONE")

y -= 6
y = right_heading(c, y, "SHORT COURSES")
y -= 36
y = edu(c, y, "Spoken", "English Course", "Horizon Institute of IELTS",
        "2018")
y = edu(c, y, "Cooking &", "Baking Course", "COTHM College", "2019")

c.showPage()
c.save()
print("wrote", OUT)
