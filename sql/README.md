# Banco de dados

`schema.sql` cria o banco `doamais`, as tabelas (`perfis`, `usuarios`, `categorias`, `doacoes`, `reservas`) e os dados iniciais (perfis e categorias).

```bash
mysql -u root -p < sql/schema.sql
```

O administrador é criado depois, com `npm run seed:admin` (na pasta `backend`). Diagrama em `docs/modelo-banco.md`.
