# Teddy and Gift Heaven

CS304.3 Advanced Database Management Systems – Final Project (NSBM Green University)

Online gift shop with order, stock, packing, delivery and supplier management.

## Stack
- Backend: Spring Boot (Java 25), Maven, Spring Security + JWT, Flyway
- Frontend: React (Vite)
- Database: MySQL 8

## Structure
- `backend/` – Spring Boot API, one package per module; migrations in `src/main/resources/db/migration`
- `frontend/` – React app, one folder per module under `src/modules/`
- `database/` – backup scripts and demo queries
- `docs/` – team contract, data dictionary, SQL coverage, reports

## Branching rules
- `main` – launch only
- `develop` – integration; all pull requests go here
- `feature/<module>` – one branch per member
- Never push directly to `main` or `develop`
