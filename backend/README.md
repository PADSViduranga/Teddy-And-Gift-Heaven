
## How to run (first time)

### 1. Tools
Java 17, Node.js 18+, MySQL 8, Git.

### 2. Database (run once on your own computer)
Open MySQL as root (`sudo mysql` or `mysql -u root -p`) and run:

```sql
CREATE DATABASE teddy_gift_heaven CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'tgh_migrate'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL PRIVILEGES ON teddy_gift_heaven.* TO 'tgh_migrate'@'localhost';

CREATE USER 'tgh_app'@'localhost' IDENTIFIED BY 'choose-another-password';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON teddy_gift_heaven.* TO 'tgh_app'@'localhost';

FLUSH PRIVILEGES;
```

### 3. Backend
Create `backend/src/main/resources/application-local.properties` (it is ignored by Git, never commit it):

```properties
spring.datasource.password=<password of tgh_app>
spring.flyway.password=<password of tgh_migrate>
```

Then run:

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Check `http://localhost:8080/api/health` shows `{"status":"ok"}`.

### 4. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the address Vite prints. The landing page should show "Backend status: ok".

### 5. Your branch
```bash
git checkout feature/<your-module>
git pull origin develop
```
Work only on your own branch and open pull requests into `develop`.

### Database scripts
Every table, trigger, procedure and view is a Flyway migration in `backend/src/main/resources/db/migration`. Each member uses their own version range (Member 1 `V1xx`, Member 2 `V2xx`, and so on up to `V10xx`). Never edit a migration after it is merged. Fix mistakes with a new version.
