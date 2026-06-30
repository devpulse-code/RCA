# RCA/README.md

# Digital Data Management (DDM)

DDM is a secure, multi‑container file‑management service built for the RCA platform.
It provides passcode‑based user access, admin‑managed file libraries (local + Terabox proxy),
AI‑assisted file finding and Q&A, fuzzy search, announcements, and a hardened admin panel.

## Architecture Overview

The system runs as a Docker Compose stack with six services:

| Service         | Role                                               |
| --------------- | -------------------------------------------------- |
| **Nginx**       | Reverse proxy, TLS termination, static frontend    |
| **Backend**     | FastAPI application (Python) – all business logic  |
| **PostgreSQL**  | Relational database (users, files, logs, settings) |
| **Redis**       | Session store, rate limiting, lockout tracking     |
| **Meilisearch** | Fuzzy full‑text search engine                      |
| **Tika**        | Apache Tika – text extraction from documents       |

Two Docker networks isolate external and internal traffic:

- `frontend` – Nginx and backend only
- `backend` – backend, PostgreSQL, Redis, Meilisearch, Tika (internal, no outside access)

All persistent data is stored in named Docker volumes.

## Prerequisites

- **Docker Engine** ≥ 24.0 and **Docker Compose** ≥ 2.20
- (Optional) `openssl` or `python` to generate secrets

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repo-url> && cd RCA
   ```
