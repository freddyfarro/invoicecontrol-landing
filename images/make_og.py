# Genera og-preview.jpg (1200x630) para Open Graph / Twitter Card.
# Uso: python make_og.py  (requiere Pillow)
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#0f172a")
d = ImageDraw.Draw(img)

# Degradado vertical sutil 0f172a -> 16213e
top = (15, 23, 42)
bottom = (22, 33, 62)
for y in range(H):
    t = y / H
    c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
    d.line([(0, y), (W, y)], fill=c)

# Glow azul difuso detrás de la tarjeta
glow = Image.new("RGB", (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([700, 60, 1250, 560], fill=(37, 99, 235))
glow = glow.filter(ImageFilter.GaussianBlur(160))
img = Image.blend(img, glow, 0.25)
d = ImageDraw.Draw(img)

F = r"C:\Windows\Fonts"
f_logo = ImageFont.truetype(F + r"\segoeuib.ttf", 44)
f_head = ImageFont.truetype(F + r"\segoeuib.ttf", 64)
f_sub = ImageFont.truetype(F + r"\segoeui.ttf", 30)
f_pill = ImageFont.truetype(F + r"\seguisb.ttf", 26)
f_card_t = ImageFont.truetype(F + r"\seguisb.ttf", 24)
f_card_s = ImageFont.truetype(F + r"\segoeui.ttf", 20)

LX = 80  # margen izquierdo

# ── Logo: cuadrado azul con check + wordmark ─────────────────────────────────
d.rounded_rectangle([LX, 92, LX + 56, 148], radius=14, fill=(37, 99, 235))
d.line([(LX + 14, 122), (LX + 25, 133), (LX + 43, 109)], fill="white", width=6, joint="curve")
d.text((LX + 72, 94), "InvoiceControl", font=f_logo, fill=(255, 255, 255))

# ── Headline ──────────────────────────────────────────────────────────────────
d.text((LX, 215), "Tus facturas de gastos,", font=f_head, fill=(255, 255, 255))
d.text((LX, 295), "organizadas solas.", font=f_head, fill=(96, 165, 250))

# ── Subtítulo ─────────────────────────────────────────────────────────────────
d.text((LX, 405), "La IA detecta las facturas en tu correo, extrae los datos", font=f_sub, fill=(203, 213, 225))
d.text((LX, 447), "y te entrega el Excel listo para tu contable.", font=f_sub, fill=(203, 213, 225))

# ── Pill con dominio ──────────────────────────────────────────────────────────
pill_text = "getinvoicecontrol.com"
tw = d.textlength(pill_text, font=f_pill)
d.rounded_rectangle([LX, 525, LX + tw + 48, 577], radius=26, outline=(96, 165, 250), width=2)
d.text((LX + 24, 536), pill_text, font=f_pill, fill=(147, 197, 253))

# ── Tarjeta mock de factura a la derecha ─────────────────────────────────────
cx, cy, cw, ch = 810, 150, 320, 360
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle([cx + 8, cy + 14, cx + cw + 8, cy + ch + 14], radius=22, fill=(0, 0, 0, 110))
shadow = shadow.filter(ImageFilter.GaussianBlur(18))
img.paste(shadow, (0, 0), shadow)
d = ImageDraw.Draw(img)
d.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=22, fill=(255, 255, 255))

# Cabecera de la tarjeta
d.text((cx + 28, cy + 26), "Factura detectada", font=f_card_t, fill=(17, 24, 39))
d.rounded_rectangle([cx + 28, cy + 64, cx + 122, cy + 92], radius=14, fill=(209, 250, 229))
d.line([(cx + 44, cy + 78), (cx + 50, cy + 84), (cx + 60, cy + 70)], fill=(5, 150, 105), width=3, joint="curve")
d.text((cx + 70, cy + 67), "IA", font=f_card_s, fill=(5, 150, 105))

# Líneas de datos extraídos
rows = [("Proveedor", "Telefónica S.A."), ("Fecha", "02/06/2026"), ("Base", "82,64 €"), ("IVA 21%", "17,36 €")]
yy = cy + 122
for label, value in rows:
    d.text((cx + 28, yy), label, font=f_card_s, fill=(107, 114, 128))
    vw = d.textlength(value, font=f_card_s)
    d.text((cx + cw - 28 - vw, yy), value, font=f_card_s, fill=(17, 24, 39))
    yy += 42

# Total destacado
d.line([(cx + 28, yy + 4), (cx + cw - 28, yy + 4)], fill=(229, 231, 235), width=2)
d.text((cx + 28, yy + 22), "Total", font=f_card_t, fill=(17, 24, 39))
total = "100,00 €"
tw2 = d.textlength(total, font=f_card_t)
d.text((cx + cw - 28 - tw2, yy + 22), total, font=f_card_t, fill=(37, 99, 235))

img.save(r"og-preview.jpg", quality=92)
print("OK og-preview.jpg")
