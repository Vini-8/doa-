-- =====================================================
-- Doa+ - Script do banco de dados (Entrega 2)
-- Execute com:  mysql -u root -p < sql/schema.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS doamais
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE doamais;

-- Perfis de acesso -----------------------------------
CREATE TABLE IF NOT EXISTS perfis (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Usuários -------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  telefone   VARCHAR(20),
  perfil_id  INT NOT NULL,
  status     ENUM('pendente','ativo','bloqueado') NOT NULL DEFAULT 'ativo',
  criado_em  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_perfil
    FOREIGN KEY (perfil_id) REFERENCES perfis(id)
) ENGINE=InnoDB;

-- Categorias de alimentos ----------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Doações (entidade principal) -----------------------
CREATE TABLE IF NOT EXISTS doacoes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  titulo         VARCHAR(120) NOT NULL,
  descricao      TEXT,
  quantidade     DECIMAL(10,2) NOT NULL,
  unidade        VARCHAR(20) NOT NULL DEFAULT 'un',
  data_validade  DATE NOT NULL,
  local_retirada VARCHAR(200) NOT NULL,
  status         ENUM('disponivel','reservada','concluida','cancelada')
                 NOT NULL DEFAULT 'disponivel',
  doador_id      INT NOT NULL,
  categoria_id   INT NOT NULL,
  criado_em      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doacoes_doador
    FOREIGN KEY (doador_id) REFERENCES usuarios(id),
  CONSTRAINT fk_doacoes_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  CONSTRAINT chk_doacoes_quantidade CHECK (quantidade > 0)
) ENGINE=InnoDB;

-- Reservas (uma doação só pode ter uma reserva) ------
CREATE TABLE IF NOT EXISTS reservas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  doacao_id       INT NOT NULL UNIQUE,
  instituicao_id  INT NOT NULL,
  reservado_em    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservas_doacao
    FOREIGN KEY (doacao_id) REFERENCES doacoes(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservas_instituicao
    FOREIGN KEY (instituicao_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- Dados iniciais -------------------------------------
INSERT IGNORE INTO perfis (nome) VALUES ('admin'), ('doador'), ('instituicao');

INSERT IGNORE INTO categorias (nome) VALUES
  ('Frutas e verduras'),
  ('Pães e massas'),
  ('Enlatados e não perecíveis'),
  ('Laticínios'),
  ('Carnes e ovos'),
  ('Bebidas'),
  ('Outros');

-- O usuário administrador é criado com: npm run seed:admin
