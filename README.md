# DomuLabs — Modern Company Profile

Single-page company profile statis (HTML + CSS modern + vanilla JS, tanpa framework).
Gaya **dark premium tech**: latar gelap, aksen gradient biru–ungu–cyan, glassmorphism,
animasi scroll-reveal, count-up, cursor spotlight, 3D tilt, dan filter portfolio beranimasi.

## Struktur
```
index.html        # markup semua section
css/modern.css    # design system + styling + animasi
js/modern.js      # interaksi vanilla (no dependency)
img/              # logo + thumbnail & gambar portfolio
```

## Menjalankan
Buka lewat server lokal (disarankan, bukan double-click `file://`):

```bash
python3 -m http.server 8080
# lalu buka http://localhost:8080/
```

## Catatan
- Font via Google Fonts (Space Grotesk + Inter), ikon pakai inline SVG — tidak ada
  dependency Bootstrap/jQuery/Font Awesome.
- Form kontak memakai `mailto:` (membuka aplikasi email). Untuk kirim langsung tanpa
  buka email, sambungkan `action` form ke layanan seperti Formspree/Web3Forms.
- Seluruh animasi otomatis nonaktif bila browser mengaktifkan `prefers-reduced-motion`.
