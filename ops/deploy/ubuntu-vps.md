# Ubuntu VPS Deploy

## Topology
- Nginx reverse proxy
- Next.js web app on `127.0.0.1:3000`
- Fastify API on `127.0.0.1:4000`
- PostgreSQL + PostGIS
- systemd for the API, web process, and scheduled workers

## 1. Install system packages
```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib postgis git build-essential curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. Clone the repository
```bash
sudo mkdir -p /opt/investor-intel
sudo chown "$USER":"$USER" /opt/investor-intel
cd /opt/investor-intel
git clone <repo-url> .
npm install
```

## 3. Create the database
```bash
sudo -u postgres createuser --superuser investor_intel || true
sudo -u postgres createdb -O investor_intel investor_intel || true
cp .env.example .env
```

Set `DATABASE_URL` in `.env`, then run:

```bash
psql "$DATABASE_URL" -f ops/db/bootstrap.sql
npm run db:push
```

## 4. Configure admin auth and runtime env
Generate the password hash:

```bash
npm run admin:hash-password -- 'replace-with-strong-password'
```

Copy `.env` to the systemd env file path:

```bash
sudo mkdir -p /etc/investor-intel
sudo cp .env /etc/investor-intel/investor-intel.env
sudo chown root:www-data /etc/investor-intel/investor-intel.env
sudo chmod 640 /etc/investor-intel/investor-intel.env
```

Recommended production env values:
- `NODE_ENV=production`
- `API_BASE_URL=http://127.0.0.1:4000`
- `NEXT_PUBLIC_API_BASE_URL=https://intel.example.com`
- `CORS_ORIGIN=https://intel.example.com`
- `SESSION_SECRET=<strong-random-secret>`

## 5. Build and start services
Build the web app once per deploy:

```bash
npm run build
```

Install systemd unit files:

```bash
sudo cp ops/systemd/investor-intel-*.service /etc/systemd/system/
sudo cp ops/systemd/investor-intel-*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now investor-intel-api.service
sudo systemctl enable --now investor-intel-web.service
sudo systemctl enable --now investor-intel-fast-refresh.timer
sudo systemctl enable --now investor-intel-hourly-ingest.timer
sudo systemctl enable --now investor-intel-brief.timer
sudo systemctl enable --now investor-intel-healthcheck.timer
sudo systemctl enable --now investor-intel-cleanup.timer
```

## 6. Configure Nginx
Copy the sample config and adjust the hostname:

```bash
sudo cp ops/nginx/investor-intel.conf /etc/nginx/sites-available/investor-intel
sudo ln -s /etc/nginx/sites-available/investor-intel /etc/nginx/sites-enabled/investor-intel
sudo nginx -t
sudo systemctl reload nginx
```

Then add TLS with Certbot or your preferred ACME flow.

## 7. Operational checks
Useful commands:

```bash
curl http://127.0.0.1:4000/health
systemctl status investor-intel-api.service
systemctl status investor-intel-web.service
systemctl list-timers 'investor-intel-*'
journalctl -u investor-intel-api.service -f
```

## 8. Deployment notes
- The API currently runs through `tsx` instead of emitted JS. This is a deliberate v1 tradeoff to keep the TypeScript workspace simple while the shared packages remain source-first.
- The worker timers are intentionally boring. If ingest volume grows, move to a queue after operational pain is clear.
- The current Nginx split proxies `/api`, `/health`, and `/og` to the API and everything else to the web app.
