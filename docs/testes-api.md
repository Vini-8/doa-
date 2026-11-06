# Testes da API (Entrega 2)

Com o servidor rodando em `http://localhost:3000`. Resultados esperados entre parênteses.

```bash
# 1. Cadastro de doador (201)
curl -X POST localhost:3000/api/auth/cadastro -H "Content-Type: application/json" \
  -d '{"nome":"Padaria Sol","email":"sol@teste.com","senha":"123456","perfil":"doador"}'

# 2. Cadastro de instituição - fica pendente (201, status "pendente")
curl -X POST localhost:3000/api/auth/cadastro -H "Content-Type: application/json" \
  -d '{"nome":"ONG Esperanca","email":"ong@teste.com","senha":"123456","perfil":"instituicao"}'

# 3. Tentar criar admin pelo cadastro (400)
curl -X POST localhost:3000/api/auth/cadastro -H "Content-Type: application/json" \
  -d '{"nome":"X","email":"x@teste.com","senha":"123456","perfil":"admin"}'

# 4. Login de instituição pendente (403)
curl -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ong@teste.com","senha":"123456"}'

# 5. Login do doador (200, retorna token)
curl -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"sol@teste.com","senha":"123456"}'

# 6. Rota protegida sem token (401) e com token (200)
curl localhost:3000/api/auth/me
curl localhost:3000/api/auth/me -H "Authorization: Bearer SEU_TOKEN"

# 7. Doador tentando listar usuários (403)
curl localhost:3000/api/usuarios -H "Authorization: Bearer TOKEN_DO_DOADOR"

# 8. Admin lista pendentes (200) e aprova (200)
curl "localhost:3000/api/usuarios?status=pendente" -H "Authorization: Bearer TOKEN_ADMIN"
curl -X PATCH localhost:3000/api/usuarios/3/status -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" -d '{"status":"ativo"}'
```

## Checklist validado

| # | Cenário | Resultado |
|---|---|---|
| 1 | Cadastro de doador | 201 |
| 2 | Cadastro de instituição (pendente) | 201 |
| 3 | Email duplicado | 409 |
| 4 | Cadastro com perfil admin | 400 |
| 5 | Senha com menos de 6 caracteres | 400 |
| 6 | Login de instituição pendente | 403 |
| 7 | Login com senha errada | 401 |
| 8 | `/me` com token válido | 200 |
| 9 | `/me` sem token | 401 |
| 10 | `/me` com token inválido | 401 |
| 11 | Doador acessando rota de admin | 403 |
| 12 | Admin lista usuários pendentes | 200 |
| 13 | Admin aprova instituição | 200 |
| 14 | Login da instituição aprovada | 200 + token |
| 15 | Admin bloqueia usuário | 200 |
| 16 | Token de usuário bloqueado | 403 |
| 17 | Login de usuário bloqueado | 403 |
| 18 | Senha armazenada como hash bcrypt | confirmado |
| 19 | Rota inexistente | 404 |
