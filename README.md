# Infra FO — Pendataan Infrastruktur Fiber Optik

Aplikasi web untuk pendataan infrastruktur fiber optik **per daerah/wilayah**. Setiap daerah memiliki inventaris perangkat (OLT, tiang, ODP, ODC, JB, kabel ADSS), dan setiap perubahan (penambahan, maintenance, koreksi) tercatat dengan tanggal — total selalu sinkron otomatis.

## Fitur

- **Dashboard** — ringkasan total OLT/ODP/ODC/JB/tiang/kabel, grafik per wilayah, aktivitas bulanan
- **Data Daerah** — daftar wilayah + detail inventaris lengkap
- **Input / Update** — form input daerah baru atau update existing (penambahan ODP/ODC/JB, maintenance, dll.)
- **Riwayat** — histori transaksi dengan before/after total per item
- **Laporan** — laporan per wilayah, cetak/PDF, export CSV

## Form Inventaris

| Kategori | Item |
|----------|------|
| Perangkat Aktif | OLT C300, C320, HSGQ GPON 8/4 Port |
| Tiang | 7 Meter, 9 Meter |
| ODP | 24, 16, 8 |
| ODC | 576, 144, 96, 48 |
| JB | 48, 24, 12 |
| Kabel ADSS | ADSS 96/48/24/12 CORE, Figure-8 12/6 CORE |

## Requirements

- Node.js **18+** (disarankan 20 LTS)
- npm 9+

## Development (lokal)

```bash
git clone https://github.com/thiends-88/infrasturktu-FO.git
cd infrasturktu-FO
# pilih branch yang berisi aplikasi (jika main masih kosong):
# git checkout arena/01a0b368-infrasturktu-fo
# atau merge ke main terlebih dahulu

npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Data disimpan di `data/db.json` (JSON file storage, siap pakai tanpa database).

---

## Deploy ke Server Lokal (Proxmox / LXC / VM)

Panduan singkat menjalankan aplikasi di server on-premise (Proxmox CT/VM Ubuntu).

### 1. Siapkan container / VM

Contoh LXC Ubuntu 22.04/24.04 di Proxmox:

- RAM: minimal **1 GB** (disarankan 2 GB)
- Disk: **10 GB+**
- Network: IP statis di LAN (mis. `192.168.1.50`)

### 2. Install Node.js di server

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl git build-essential

# Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v   # harus v20.x
npm -v
```

### 3. Clone & build

```bash
sudo mkdir -p /opt/apps
sudo chown $USER:$USER /opt/apps
cd /opt/apps

git clone https://github.com/thiends-88/infrasturktu-FO.git
cd infrasturktu-FO

# Pastikan branch berisi aplikasi
git fetch origin
git checkout arena/01a0b368-infrasturktu-fo
# Setelah branch digabung ke main, cukup:
# git checkout main && git pull

npm install
npm run build
```

### 4. Jalankan production

```bash
# Test manual dulu
npm run start
# Aplikasi listen di 0.0.0.0:3000
```

Akses dari PC LAN: `http://IP-SERVER:3000`

### 5. Jalankan sebagai service (systemd) — biar auto-start

Buat file `/etc/systemd/system/infra-fo.service`:

```ini
[Unit]
Description=Infra FO - Pendataan Infrastruktur Fiber Optik
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/apps/infrasturktu-FO
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

# Pastikan folder data bisa ditulis
# (user service harus punya akses write ke data/db.json)

[Install]
WantedBy=multi-user.target
```

Lalu:

```bash
# Beri kepemilikan ke user service
sudo chown -R www-data:www-data /opt/apps/infrasturktu-FO

sudo systemctl daemon-reload
sudo systemctl enable --now infra-fo
sudo systemctl status infra-fo

# Log
journalctl -u infra-fo -f
```

### 6. (Opsional) Reverse proxy Nginx + domain lokal

```bash
sudo apt install -y nginx
```

File `/etc/nginx/sites-available/infra-fo`:

```nginx
server {
    listen 80;
    server_name infra-fo.local;   # atau IP / hostname LAN

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/infra-fo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Buka firewall bila perlu:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp   # jika akses langsung tanpa nginx
```

### 7. Backup data

File penting: **`data/db.json`** (semua data daerah + transaksi).

```bash
# Backup manual
cp /opt/apps/infrasturktu-FO/data/db.json ~/backup-infra-fo-$(date +%F).json

# Cron harian (contoh jam 02:00)
# 0 2 * * * cp /opt/apps/infrasturktu-FO/data/db.json /opt/backup/infra-fo-$(date +\%F).json
```

### 8. Update aplikasi dari GitHub

```bash
cd /opt/apps/infrasturktu-FO
sudo systemctl stop infra-fo
git pull
npm install
npm run build
sudo systemctl start infra-fo
```

> **Catatan:** `data/db.json` ikut di repo sebagai seed demo. Di production, backup dulu sebelum `git pull` jika file ini ikut berubah di remote. Idealnya setelah go-live, data production tidak di-overwrite dari git.

---

## Scripts

| Command | Keterangan |
|---------|------------|
| `npm run dev` | Development server (0.0.0.0:3000) |
| `npm run build` | Build production |
| `npm run start` | Jalankan production build |
| `npm run lint` | ESLint |

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Lucide Icons
- Storage: JSON file (`data/db.json`)
