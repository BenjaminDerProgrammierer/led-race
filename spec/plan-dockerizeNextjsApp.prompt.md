# Plan: Dockerize LED Race with nginx SSL Reverse Proxy

Multi-container Docker setup with Next.js app, nginx reverse proxy with auto-generated self-signed SSL certificates for multiple domains/IPs, optimized for Proxmox deployment connecting to external MQTT broker.

1. **Create multi-stage `Dockerfile`** for Next.js app using Node LTS Alpine, enabling standalone output, keeping `--turbopack` flag, and running as non-root user on port 3000

2. **Create `docker-compose.yml`** orchestrating nginx and Next.js containers with shared network, volume for SSL certificates, health checks, restart policies, and ports 80/443 exposed on host

3. **Create `nginx/nginx.conf`** with SSL termination on 443, HTTP→HTTPS redirect on 80, SSE-optimized proxy settings (proxy_buffering off, proxy_read_timeout 300s), security headers, and reverse proxy to Next.js container

4. **Create `nginx/generate-ssl.sh`** script reading domain list from environment variable, generating self-signed certificate with Subject Alternative Names (SAN) for all domains/IPs, 365-day validity, auto-runs on container startup

5. **Create `nginx/entrypoint.sh`** wrapper script that executes SSL generation script before starting nginx, ensuring certificates exist before nginx tries to load them

6. **Create `.dockerignore`** excluding `node_modules/`, `.next/`, `.git/`, test files, and `nginx/certs/` directory to optimize build context transfer

7. **Update `next.config.ts`** adding `output: 'standalone'` for optimized containerized builds while preserving existing Giphy image domain configurations

8. **Create `.env.example`** documenting `MQTT_BROKER_URL` (with IP format example), `MQTT_USERNAME`, `MQTT_PASSWORD`, and `SSL_DOMAINS` (comma-separated list of domains/IPs for certificate generation)
