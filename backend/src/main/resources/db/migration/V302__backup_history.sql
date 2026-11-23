-- V302 (Member 3): history of backups, shown on page 13 (Backup and restore)
-- Concepts: CHECK, ENUM, DEFAULT, index; written to by a least-privilege backup user

CREATE TABLE backup_history (
  backup_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  file_name    VARCHAR(255) NOT NULL,
  size_bytes   BIGINT       NULL,
  binlog_file  VARCHAR(64)  NULL,
  binlog_pos   BIGINT       NULL,
  method       ENUM('SCHEDULED','MANUAL') NOT NULL DEFAULT 'MANUAL',
  status       ENUM('SUCCESS','FAILED')   NOT NULL,
  started_at   DATETIME     NOT NULL,
  finished_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note         VARCHAR(255) NULL,
  CONSTRAINT ck_backup_size  CHECK (size_bytes IS NULL OR size_bytes >= 0),
  CONSTRAINT ck_backup_times CHECK (finished_at >= started_at)
) ENGINE=InnoDB;

CREATE INDEX idx_backup_started ON backup_history(started_at);
