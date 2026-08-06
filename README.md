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
tools/            # sumber kartu Luna Trade terang (dirender jadi PNG)
```

Screenshot produk punya dua varian, `-dark` dan `-light`. Yang gelap jadi default;
yang terang muncul saat hover lewat crossfade (`.theme-swap` di `css/modern.css`),
dan dipagari `@media (hover: hover)` supaya di perangkat sentuh tetap gelap. Kedua
varian harus sama ukuran dan tata letaknya — kalau tidak, pergantiannya bergeser.

## Menjalankan
Buka lewat server lokal (disarankan, bukan double-click `file://`):

```bash
python3 -m http.server 8080
# lalu buka http://localhost:8080/
```

## Deploy
Situs disajikan langsung dari git checkout oleh nginx di EC2 — tanpa build step.

```bash
./deploy.sh
```

Script akan push ke GitHub, menyinkronkan checkout di server, lalu memverifikasi
hasilnya lewat HTTP. Berhenti dengan error kalau working tree kotor, bukan di
branch `main`, atau situs live tidak cocok dengan file lokal.

| | |
|---|---|
| Host | EC2 Ubuntu `18.136.57.118` (ap-southeast-1), alias SSH `forex-alertd` |
| Web server | nginx, server block `default`, docroot `/var/www/html` (owner `www-data`) |
| Domain | `domudame.com` + `www`, TLS via Certbot |

## Catatan
- Font via Google Fonts (Space Grotesk + Inter), ikon pakai inline SVG — tidak ada
  dependency Bootstrap/jQuery/Font Awesome.
- Form kontak memakai `mailto:` (membuka aplikasi email). Untuk kirim langsung tanpa
  buka email, sambungkan `action` form ke layanan seperti Formspree/Web3Forms.
- Seluruh animasi otomatis nonaktif bila browser mengaktifkan `prefers-reduced-motion`.
