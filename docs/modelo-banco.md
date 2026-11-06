# Modelo do banco de dados

Script completo: [`sql/schema.sql`](../sql/schema.sql)

## Diagrama (relacionamentos)

```mermaid
erDiagram
    PERFIS ||--o{ USUARIOS : "possui"
    USUARIOS ||--o{ DOACOES : "publica (doador)"
    CATEGORIAS ||--o{ DOACOES : "classifica"
    DOACOES ||--o| RESERVAS : "pode ter"
    USUARIOS ||--o{ RESERVAS : "reserva (instituição)"

    PERFIS { int id PK
             varchar nome UK }
    USUARIOS { int id PK
               varchar nome
               varchar email UK
               varchar senha_hash
               varchar telefone
               int perfil_id FK
               enum status }
    CATEGORIAS { int id PK
                 varchar nome UK }
    DOACOES { int id PK
              varchar titulo
              decimal quantidade
              date data_validade
              enum status
              int doador_id FK
              int categoria_id FK }
    RESERVAS { int id PK
               int doacao_id FK_UK
               int instituicao_id FK }
```

## Tabelas

| Tabela | Função | Chaves estrangeiras |
|---|---|---|
| `perfis` | Níveis de acesso: admin, doador, instituicao | — |
| `usuarios` | Contas do sistema (senha salva como hash bcrypt) | `perfil_id → perfis.id` |
| `categorias` | Tipos de alimento | — |
| `doacoes` | Alimentos oferecidos (CRUD na Entrega 3) | `doador_id → usuarios.id`, `categoria_id → categorias.id` |
| `reservas` | Reserva de uma doação por uma instituição | `doacao_id → doacoes.id`, `instituicao_id → usuarios.id` |

## Decisões de modelagem

- `reservas.doacao_id` é `UNIQUE`: o próprio banco garante que uma doação tenha no máximo uma reserva.
- `doacoes.quantidade` tem `CHECK (quantidade > 0)`, reforçando a regra de negócio no banco.
- `usuarios.status` (`pendente`, `ativo`, `bloqueado`) permite aprovar instituições e bloquear contas sem apagar dados.
