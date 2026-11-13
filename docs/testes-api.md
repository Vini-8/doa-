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

---

# Testes da Entrega 3 (CRUD, permissões e regras de negócio)

Substitua `$TOKEN_*` pelos tokens retornados no login de cada perfil.

```bash
# CREATE - doador cadastra (201)
curl -X POST localhost:3000/api/doacoes -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_DOADOR" \
  -d '{"titulo":"Pães do dia","quantidade":20,"unidade":"un","data_validade":"2027-01-10","local_retirada":"Rua A, 100","categoria_id":2}'

# READ - lista com filtros (200)
curl "localhost:3000/api/doacoes?busca=Pães&status=disponivel" -H "Authorization: Bearer $TOKEN_INSTITUICAO"

# UPDATE - dono edita (200)
curl -X PUT localhost:3000/api/doacoes/1 -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_DOADOR" -d '{ ...campos atualizados... }'

# Reserva (201), cancelamento (200), conclusão (200)
curl -X POST   localhost:3000/api/doacoes/1/reserva   -H "Authorization: Bearer $TOKEN_INSTITUICAO"
curl -X DELETE localhost:3000/api/doacoes/1/reserva   -H "Authorization: Bearer $TOKEN_INSTITUICAO"
curl -X PATCH  localhost:3000/api/doacoes/1/concluir  -H "Authorization: Bearer $TOKEN_DOADOR"

# DELETE (200)
curl -X DELETE localhost:3000/api/doacoes/1 -H "Authorization: Bearer $TOKEN_DOADOR"
```

## Checklist validado (46 cenários, com 2 doadores, 2 instituições e 1 admin)

| Grupo | Cenário | Resultado |
|---|---|---|
| Categorias | Instituição lista | 200 |
| | Doador tenta criar categoria | 403 |
| | Admin cria categoria / nome duplicado | 201 / 409 |
| | Excluir categoria em uso | 409 |
| Create | Doador cadastra doação | 201 |
| | Instituição ou admin tentam cadastrar | 403 |
| | Sem token | 401 |
| | Validade vencida / quantidade 0 / categoria inexistente / data em formato errado / JSON malformado | 400 |
| Read | Doador vê só as suas; instituição vê só disponíveis; admin vê todas | confirmado |
| | Filtro por busca de título | confirmado |
| | Doador acessa doação de outro doador | 404 |
| | ID não numérico | 400 |
| Update | Dono edita doação disponível | 200 |
| | Outro doador / instituição editam | 403 |
| | Dados inválidos | 400 |
| | Dono edita doação reservada | 409 |
| Reserva | Doador tenta reservar | 403 |
| | Instituição A reserva | 201 |
| | Instituição B tenta reservar a mesma | 409 |
| | Instituição B não enxerga a doação reservada pela A | 404 |
| | Instituição B cancela reserva da A | 403 |
| | Instituição A cancela; B reserva em seguida | 200 / 201 |
| | Reservar doação vencida | 409 |
| | Doação vencida some da lista da instituição | confirmado |
| Concluir | Outro doador conclui | 403 |
| | Dono conclui / conclui de novo | 200 / 409 |
| Resumo | Totais por status conforme o perfil | confirmado |
| Delete | Dono exclui doação reservada | 409 |
| | Outro doador / instituição excluem | 403 |
| | Admin exclui qualquer doação (moderação) | 200 |
| | Dono exclui doação disponível | 200 |
| | Excluir ID inexistente | 404 |
| Servidor | Erros 500 no log durante os testes | 0 |
