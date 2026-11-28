# Setup guide

Follow this once on your own machine and you'll have the same environment as everyone else.
It takes about 30 minutes. If a step fails, post the exact error in the group chat.

## 1. Install the tools

| Tool | Version | Check with |
|---|---|---|
| Java (JDK) | 25 or newer | `java -version` |
| Node.js | 18 or newer | `node -v` |
| MySQL server and client | 8.4 | `mysql --version` |
| Git | any recent | `git --version` |

Maven doesn't need installing: the project has its own `./mvnw`.

On Fedora, start MySQL with `sudo systemctl enable --now mysqld`. On Windows, use the MySQL
installer and run the commands below in Git Bash.

## 2. Get the code

    git clone https://github.com/PADSViduranga/Teddy-And-Gift-Heaven.git teddy-and-gift-heaven
    cd teddy-and-gift-heaven
    git checkout feature/<your-module>
    git pull origin develop

## 3. Create the database (as MySQL root)

Run `mysql -u root -p`, then:

    CREATE DATABASE teddy_and_gift_heaven CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    CREATE USER 'tagh_migrate'@'localhost' IDENTIFIED BY '<pick a password>';
    GRANT ALL PRIVILEGES ON teddy_and_gift_heaven.* TO 'tagh_migrate'@'localhost';

    CREATE USER 'tagh_app'@'localhost' IDENTIFIED BY '<pick another password>';
    GRANT SELECT ON teddy_and_gift_heaven.* TO 'tagh_app'@'localhost';

    SET PERSIST log_bin_trust_function_creators = 1;
    SET PERSIST event_scheduler = ON;
    FLUSH PRIVILEGES;
    EXIT;

The `log_bin_trust_function_creators` line lets `tagh_migrate` create triggers, functions and
procedures while binary logging is on. Skip it and your first trigger or procedure fails with
`ERROR 1419 ... binary logging is enabled`. The `event_scheduler` line is needed for scheduled
events (expiring unpaid orders).

## 4. Your local passwords

Create `backend/src/main/resources/application-local.properties` (it's in `.gitignore`):

    spring.datasource.password=<tagh_app password>
    spring.flyway.password=<tagh_migrate password>
    app.jwt.secret=<a securely generated secret of at least 32 bytes>

Create `frontend/.env` with this line:

    VITE_API_URL=http://localhost:8080/api

Never commit either file. Check `git status` before every commit.

## 5. Run it

Backend, in one terminal:

    cd backend
    ./mvnw spring-boot:run -Dspring-boot.run.profiles=local

The first start downloads libraries and takes a few minutes. Flyway then builds every table,
trigger and procedure. Wait for `Started BackendApplication`, then open
http://localhost:8080/api/health, which should show `{"status":"ok"}`.

After Flyway finishes, run the following as a MySQL administrator from the repository root.
This replaces the initial schema-wide read grant with the runtime permissions and creates the
read-only packing database account. Save its generated password securely.

    mysql -u root -p
    SOURCE database/security/runtime-grants.sql;
    SHOW GRANTS FOR 'tagh_app'@'localhost';
    SHOW GRANTS FOR 'tagh_packer'@'localhost' USING 'tagh_packing_read';

Frontend, in a second terminal:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173 and you should see the landing page.

Use `/register` to create a customer account and `/login` to sign in. Existing staff need a
valid BCrypt password hash and their assigned database role to use `/staff/login`.
`/admin/login` accepts owners. Development rows generated with placeholder hashes need an
administrator-provisioned password before they can sign in.

### Data access

| Role | Access in the implemented app |
|---|---|
| Customer | Storefront selling prices, own account |
| Owner | Pricing, reports, audit, backups, inventory |
| Order staff | Product selling prices for order handling, payment queue totals, stock losses |
| Inventory manager | Inventory, supplier prices on low-stock alerts, stock valuation and losses |
| Packer | Packing queue, packaging quantities, stock loss entry and history |
| Driver | Own assigned deliveries and performance, with recipient name and city on the dashboard |

The current report schema calculates revenue and inventory valuation. It has no profit column.
Packing views omit monetary fields, payment records and recipient details. The direct MySQL packing
account can read those views only. In the web app, Spring Security enforces the account role against
the shared runtime connection. The runtime SQL grants exclude recipient street addresses and
database DDL. Keep the Flyway account separate from the application account.

## 6. Editor tips

- VS Code: disable the **SQL Server (mssql)** extension for this workspace (Extensions, the arrow next
  to Disable, then Disable (Workspace)). It reads our MySQL as Microsoft SQL and shows false errors.
- To browse the database, use MySQL Workbench, or the SQLTools extension with the MySQL driver
  (host localhost, port 3306, user tagh_migrate).

## 7. When something goes wrong

| You see | It means |
|---|---|
| `Access denied for user 'tagh_app'` | The password in `application-local.properties` is wrong, or you forgot `-Dspring-boot.run.profiles=local` |
| `Migration checksum mismatch` | Someone edited a migration after it ran. Never edit merged migrations. Ask the lead before resetting your database |
| `ERROR 1419 ... binary logging` | Run the `log_bin_trust_function_creators` line from step 3 as root |
| `Port 8080 was already in use` | The backend is already running in another terminal. Stop it with Ctrl+C, or run `sudo fuser -k 8080/tcp` |
| `Could not resolve host: github.com` | Your internet connection, not the project. Try again later |
| Red errors in `.sql` files in VS Code | The mssql extension, see step 6 |

## 8. Backups (optional for most members)

Member 3's backup and recovery setup is in `database/backup/README.md`. You only need it if you
want to test restoring on your own machine.
