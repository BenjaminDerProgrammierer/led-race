# LED Race - Docker Deployment Guide

## Quick Start

1. **Copy environment template and configure**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your MQTT broker credentials and SSL domains.

2. **Build and start the containers**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - HTTPS: `https://your-domain-or-ip`
   - HTTP (redirects to HTTPS): `http://your-domain-or-ip`

## Environment Variables

- `MQTT_BROKER_URL`: MQTT broker connection string (e.g., `mqtt://192.168.1.100:1883`)
- `MQTT_USERNAME`: MQTT authentication username
- `MQTT_PASSWORD`: MQTT authentication password
- `SSL_DOMAINS`: Comma-separated domains/IPs for SSL certificate (e.g., `led-race.local,192.168.1.50`)

## Architecture

- **Next.js App**: Runs on port 3000 (internal)
- **Nginx**: Reverse proxy with SSL termination on ports 80/443 (external)
- **SSL Certificates**: Auto-generated self-signed certificates with SAN support

## Container Management

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build
```

## Proxmox VM Recommended Specs

- **vCPUs**: 2
- **RAM**: 2GB
- **Disk**: 20GB

## SSL Certificate

The SSL certificate is automatically generated on first startup with Subject Alternative Names (SAN) for all domains/IPs specified in `SSL_DOMAINS`. The certificate is valid for 365 days.

To regenerate the certificate:
```bash
docker-compose down
rm -rf nginx/certs/*
docker-compose up -d
```

## Troubleshooting

- **Check container status**: `docker-compose ps`
- **View app logs**: `docker-compose logs nextjs`
- **View nginx logs**: `docker-compose logs nginx`
- **Test MQTT connection**: Verify external MQTT broker is accessible from container network
