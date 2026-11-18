# Doa+ — Gestão de Doações de Alimentos

Sistema web que conecta **doadores de alimentos** (mercados, padarias, restaurantes e pessoas físicas) a **instituições que atendem pessoas em situação de vulnerabilidade** (bancos de alimentos, abrigos, ONGs, cozinhas comunitárias).

> Projeto Web — desenvolvido em 4 entregas progressivas neste único repositório.
> Autor: _seu nome aqui_
> **Situação atual: Entrega 4 — Projeto completo.**

---

## 1. O problema

### Contexto
No Brasil, toneladas de alimentos próprios para consumo são descartadas todos os dias por comércios e residências, seja por proximidade da validade, excesso de produção ou erros de estoque. Ao mesmo tempo, muitas famílias e instituições sociais enfrentam dificuldade para ter acesso a alimentos.

### Onde está a falha
Existem doadores dispostos a doar e instituições precisando receber, mas falta um canal organizado que os conecte. Hoje isso costuma acontecer por:
- grupos de WhatsApp e redes sociais, sem controle, histórico ou padronização;
- contatos pessoais, que dependem de conhecer a pessoa certa;
- planilhas e anotações soltas, sujeitas a perda e erro.

Como consequência: alimentos estragam antes de chegar a quem precisa, doações são duplicadas ou perdidas, e não há registro confiável do que foi doado.

### Público afetado
- **Doadores** que não sabem a quem doar nem como organizar a doação.
- **Instituições beneficiárias** que não sabem o que está disponível e perdem oportunidades.
- **Famílias atendidas**, que sofrem com a falta de alimentos.

### Justificativa
Um sistema web que centralize ofertas e reservas de doações, com controle de validade e de status, reduz o desperdício, agiliza o contato entre as partes e gera histórico confiável.

## 2. Proposta de solução

Uma plataforma em que doadores **publicam** alimentos disponíveis, instituições **consultam e reservam**, e administradores **moderam** o sistema.

### Objetivos
- Reduzir o desperdício de alimentos próprios para consumo.
- Facilitar o encontro entre doadores e instituições.
- Registrar o histórico das doações com segurança.
- Garantir que cada perfil acesse apenas o que lhe cabe.

### Principais funcionalidades previstas
- Cadastro e login de usuários, com senha protegida.
- Autenticação com JWT e controle de acesso por perfil.
- CRUD completo de **doações** (entidade principal).
- Categorias de alimentos (perecível, não perecível, bebidas etc.).
- Reserva de doações por instituições.
- Filtros por categoria, status e validade.
- Painel com resumo (doações ativas, reservadas e concluídas).
- Aprovação de cadastros de instituições pelo administrador.
- Cancelamento de doações (por exemplo, quando o alimento estraga), liberando a reserva.
- Contato (telefone) liberado entre doador e instituição **somente depois da reserva**, para combinar a retirada com privacidade.

### Regras de negócio previstas
- Doação com data de validade vencida não pode ser publicada nem reservada.
- Uma doação só pode ser reservada por **uma** instituição por vez.
- Somente o doador dono da doação pode editá-la ou excluí-la, e apenas se ainda estiver `disponivel`.
- Instituições só podem reservar após aprovação do administrador.
- Status da doação: `disponivel` → `reservada` → `concluida` (ou `cancelada`).
- O telefone do doador só é exibido à instituição que reservou (e vice-versa).
- Quantidade informada deve ser maior que zero.

## 3. Tipos de usuário e ações

| Perfil | Ações previstas |
|---|---|
| **Doador** | Cadastrar-se; publicar, editar e excluir suas doações; acompanhar reservas; marcar doação como concluída. |
| **Instituição** | Cadastrar-se (sujeito a aprovação); listar e filtrar doações; reservar e cancelar reservas; consultar histórico. |
| **Administrador** | Aprovar/bloquear usuários; gerenciar categorias; consultar e moderar todas as doações; ver relatórios gerais. |

## 4. Fluxo básico de funcionamento

1. O usuário se cadastra escolhendo o perfil (doador ou instituição).
2. O administrador aprova o cadastro de instituições.
3. O usuário faz login e recebe um token JWT.
4. O **doador** publica uma doação (alimento, quantidade, validade, local de retirada).
5. A **instituição** consulta as doações disponíveis e reserva a desejada.
6. A doação passa a `reservada` e deixa de aparecer como disponível.
7. Após a retirada, o doador marca como `concluida`, formando o histórico.

```
Cadastro → Login (JWT) → Doador publica → Instituição reserva → Retirada → Concluída
                                   ↑ Admin aprova instituições e modera
```

## 5. Tecnologias

- **Front-end:** HTML, CSS e JavaScript puro (manipulação do DOM + Fetch API)
- **Back-end:** Node.js e Express
- **Banco de dados:** MySQL (driver `mysql2`)
- **Autenticação:** JWT (`jsonwebtoken`) e hash de senha (`bcryptjs`)
- **Testes:** runner nativo do Node (`node:test`)
- **Versionamento:** Git e GitHub

## 6. Estrutura do projeto

```
doamais/
├── backend/
│   ├── src/
│   │   ├── routes/         # Define os endpoints e as permissões de cada rota
│   │   ├── controllers/    # Regras de negócio, validações e respostas
│   │   ├── middlewares/    # Autenticação (JWT), autorização por perfil e erros
│   │   ├── database/       # Conexão com o MySQL, seed do admin e dados de demonstração
│   │   ├── app.js          # Configuração do Express
│   │   └── server.js       # Inicialização do servidor
│   ├── tests/              # Testes automatizados da API
│   ├── .env.example        # Modelo das variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── css/style.css
│   ├── js/                 # api.js (Fetch e sessão), dashboard.js, doacoes.js
│   └── pages/              # index, cadastro, login, dashboard, doacoes, 404
├── sql/
│   └── schema.sql          # Script do banco de dados
├── docs/                   # Modelo do banco e roteiro de testes
├── .gitignore
└── README.md
```

**Arquitetura em camadas:** `routes` recebem a requisição e aplicam os middlewares → `controllers` validam e executam a regra de negócio → `database` executa o SQL. O front-end conversa com a API apenas por Fetch (JSON).

## 7. Banco de dados

Tabelas: `perfis`, `usuarios`, `categorias`, `doacoes` e `reservas`, com chaves primárias, chaves estrangeiras, `UNIQUE` e `CHECK`. Diagrama e decisões de modelagem em [`docs/modelo-banco.md`](docs/modelo-banco.md). Script completo em [`sql/schema.sql`](sql/schema.sql).

## 8. Autenticação e controle de acesso

- **Senhas:** nunca salvas em texto puro; armazenadas como hash bcrypt (10 rounds).
- **Login:** valida email e senha e devolve um token JWT (expira em 2h) com `id` e `perfil`. A mensagem de erro é a mesma para email ou senha incorretos.
- **`authMiddleware`:** valida o token do header `Authorization: Bearer <token>` e confere no banco se o usuário continua `ativo` (um usuário bloqueado perde o acesso imediatamente, mesmo com token válido).
- **`roleMiddleware`:** `permitir('admin')` restringe rotas por perfil.
- **Cadastro público:** só cria `doador` (ativo) ou `instituicao` (pendente até aprovação do admin). O perfil `admin` não pode ser criado pelo cadastro.
- **Propriedade dos dados:** além do perfil, cada controller confere se o registro pertence ao usuário (ex.: um doador só edita as suas doações).

## 9. Rotas da API

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/cadastro` | Público | Cadastra doador ou instituição |
| POST | `/api/auth/login` | Público | Autentica e retorna o token JWT |
| GET | `/api/auth/me` | Logado | Dados do usuário logado |
| GET | `/api/usuarios` | Admin | Lista usuários (filtros `?status=` e `?perfil=`) |
| PATCH | `/api/usuarios/:id/status` | Admin | Aprova, bloqueia ou reativa um usuário |
| GET | `/api/categorias` | Logado | Lista categorias |
| POST / PUT / DELETE | `/api/categorias[/:id]` | Admin | Gerencia categorias (não exclui categoria em uso) |
| **POST** | `/api/doacoes` | Doador | **Create** — cadastra doação |
| **GET** | `/api/doacoes` | Logado | **Read** — lista (filtros `?busca=`, `?categoria_id=`, `?status=`), já filtrada por perfil |
| **GET** | `/api/doacoes/:id` | Logado | **Read** — detalhe da doação |
| **PUT** | `/api/doacoes/:id` | Doador (dono) | **Update** — só enquanto `disponivel` |
| **DELETE** | `/api/doacoes/:id` | Doador (dono) ou Admin | **Delete** — doador só se `disponivel`; admin modera qualquer uma |
| POST | `/api/doacoes/:id/reserva` | Instituição | Reserva a doação |
| DELETE | `/api/doacoes/:id/reserva` | Instituição (dona da reserva) | Cancela a reserva |
| PATCH | `/api/doacoes/:id/concluir` | Doador (dono) | Conclui doação reservada |
| PATCH | `/api/doacoes/:id/cancelar` | Doador (dono) ou Admin | Cancela doação disponível ou reservada |
| GET | `/api/doacoes/resumo` | Logado | Totais por status (conforme o perfil) |

### Permissões por perfil (verificadas na API)

| Ação | Doador | Instituição | Admin |
|---|:-:|:-:|:-:|
| Cadastrar doação | ✅ | ❌ | ❌ |
| Ver doações | só as suas | disponíveis e as que reservou | todas |
| Editar doação | só as suas | ❌ | ❌ |
| Excluir doação | só as suas (disponíveis) | ❌ | ✅ (moderação) |
| Cancelar doação | só as suas | ❌ | ✅ |
| Reservar / cancelar reserva | ❌ | ✅ | ❌ |
| Concluir doação | só as suas | ❌ | ❌ |
| Gerenciar usuários e categorias | ❌ | ❌ | ✅ |

> Os botões também são escondidos no front-end, mas isso é só conveniência: cada rota confere o token, o perfil e a propriedade do registro.

### Regras de negócio implementadas

- Alimento com validade vencida não pode ser cadastrado nem reservado, e doações vencidas deixam de aparecer para as instituições.
- Quantidade deve ser maior que zero; título, categoria, unidade, local e data (AAAA-MM-DD) são validados no back-end.
- Uma doação só pode ter **uma** reserva por vez: a reserva usa transação com `SELECT ... FOR UPDATE`, então duas instituições não reservam a mesma doação ao mesmo tempo.
- Instituições só acessam o sistema depois de aprovadas pelo administrador.
- Fluxo de status: `disponivel` → `reservada` → `concluida`; `cancelada` a partir de disponível ou reservada. Cancelar a reserva devolve a doação para `disponivel`.
- Doação reservada não pode ser editada nem excluída pelo doador (apenas concluída ou cancelada).
- Telefones só são enviados pela API a quem participa da reserva (e ao admin).

## 10. Tratamento de erros

- **API:** respostas JSON padronizadas `{ "erro": "mensagem" }` com códigos adequados: 400 (validação), 401 (sem token ou token inválido), 403 (sem permissão), 404 (não encontrado), 409 (conflito de regra de negócio) e 500 (erro interno, sem expor detalhes). JSON malformado e IDs inválidos também são tratados.
- **Front-end:** mensagens da API são exibidas ao usuário; servidor fora do ar mostra aviso claro; sessão expirada ou conta bloqueada redireciona ao login com aviso; páginas inexistentes mostram a tela 404.

## 11. Como instalar e executar

**Pré-requisitos:** Node.js 18+ e MySQL 8+.

```bash
# 1. Clonar e instalar
git clone <url-do-repositorio>
cd doamais/backend
npm install

# 2. Criar o banco
mysql -u root -p < ../sql/schema.sql

# 3. Configurar variáveis (copie e edite com seus dados)
cp .env.example .env

# 4. Criar o usuário administrador (usa ADMIN_* do .env)
npm run seed:admin

# 5. (Opcional) Dados de demonstração
npm run seed:demo

# 6. Iniciar o servidor
npm start
```

Acesse **http://localhost:3000**. O próprio Express serve o front-end.

### Contas de demonstração (após `npm run seed:demo`)

| Perfil | Email | Senha |
|---|---|---|
| Admin | valor de `ADMIN_EMAIL` no `.env` | valor de `ADMIN_SENHA` |
| Doador | `doador@demo.com` / `mercado@demo.com` | `demo123` |
| Instituição | `instituicao@demo.com` / `abrigo@demo.com` | `demo123` |

> Use as contas de demonstração apenas em ambiente de desenvolvimento.

## 12. Como testar

**Testes automatizados** (com o servidor rodando e o admin criado):

```bash
cd backend
npm test
```

Cobrem autenticação, validações, CRUD, permissões, reservas concorrentes, contatos, cancelamento, bloqueio de usuário e tratamento de erros. Os testes criam usuários com emails únicos, então podem ser repetidos sem limpar o banco.

**Roteiro manual** (sugestão para demonstração):
1. Cadastre uma instituição em `/pages/cadastro.html` e tente entrar (fica pendente).
2. Entre como admin e aprove a instituição no painel.
3. Entre como doador, publique uma doação e veja que ela aparece só para você e para as instituições.
4. Entre como instituição, reserve a doação e veja o contato do doador.
5. Volte ao doador: veja o contato da instituição e marque como concluída (ou cancele).
6. Tente, via `curl` ou Postman, acessar uma rota de outro perfil e confira o 403.

Comandos `curl` e o checklist completo em [`docs/testes-api.md`](docs/testes-api.md).

## 13. Melhorias futuras

- Notificações por email quando uma doação é reservada.
- Paginação nas listagens e relatórios para o administrador.
- Upload de fotos dos alimentos.
- Limite de tentativas de login e renovação de token.
- Deploy em servidor com HTTPS.

## 14. Cronograma das entregas

| Entrega | Foco | Status |
|---|---|---|
| 1 | Problema, proposta e estrutura inicial | ✅ Concluída |
| 2 | Banco de dados, autenticação e JWT | ✅ Concluída |
| 3 | CRUD, integração e permissões | ✅ Concluída |
| 4 | Projeto completo, documentação e apresentação | ✅ Atual |
