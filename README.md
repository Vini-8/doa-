# Doa+ — Gestão de Doações de Alimentos

Sistema web que conecta **doadores de alimentos** (mercados, padarias, restaurantes e pessoas físicas) a **instituições que atendem pessoas em situação de vulnerabilidade** (bancos de alimentos, abrigos, ONGs, cozinhas comunitárias).

> Projeto Web — desenvolvido em 4 entregas progressivas neste único repositório.
> **Situação atual: Entrega 2 — Banco de dados e autenticação.**

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

### Regras de negócio previstas
- Doação com data de validade vencida não pode ser publicada nem reservada.
- Uma doação só pode ser reservada por **uma** instituição por vez.
- Somente o doador dono da doação pode editá-la ou excluí-la, e apenas se ainda estiver `disponivel`.
- Instituições só podem reservar após aprovação do administrador.
- Status da doação: `disponivel` → `reservada` → `concluida` (ou `cancelada`).
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

- **Front-end:** HTML, CSS e JavaScript (DOM + Fetch)
- **Back-end:** Node.js e Express
- **Banco de dados:** MySQL (driver `mysql2`)
- **Autenticação:** JWT (`jsonwebtoken`) e criptografia de senha (`bcryptjs`)
- **Versionamento:** Git e GitHub

## 6. Estrutura do projeto

```
doamais/
├── backend/
│   ├── src/
│   │   ├── routes/         # Define os endpoints
│   │   ├── controllers/    # Regras de negócio e respostas
│   │   ├── middlewares/    # Autenticação, autorização e erros
│   │   ├── database/       # Conexão com o MySQL e seed do admin
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── css/
│   ├── js/                 # api.js: Fetch e sessão
│   └── pages/              # index, cadastro, login, dashboard
├── sql/
│   └── schema.sql          # Script do banco
├── docs/                   # Modelo do banco e testes da API
├── .gitignore
└── README.md
```

## 7. Banco de dados

Tabelas: `perfis`, `usuarios`, `categorias`, `doacoes` e `reservas`, com chaves primárias, chaves estrangeiras, `UNIQUE` e `CHECK`. Diagrama e decisões de modelagem em [`docs/modelo-banco.md`](docs/modelo-banco.md). Script completo em [`sql/schema.sql`](sql/schema.sql).

## 8. Autenticação e controle de acesso

- **Senhas:** nunca salvas em texto puro; armazenadas como hash bcrypt (10 rounds).
- **Login:** valida email e senha e devolve um token JWT (expira em 2h) com `id` e `perfil`.
- **`authMiddleware`:** valida o token do header `Authorization: Bearer <token>` e confere no banco se o usuário continua `ativo` (um usuário bloqueado perde o acesso imediatamente, mesmo com token válido).
- **`roleMiddleware`:** `permitir('admin')` restringe rotas por perfil, sempre verificado na API.
- **Cadastro público:** só cria `doador` (ativo) ou `instituicao` (pendente até aprovação do admin). O perfil `admin` não pode ser criado pelo cadastro.

## 9. Rotas da API (Entrega 2)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/auth/cadastro` | Público | Cadastra doador ou instituição |
| POST | `/api/auth/login` | Público | Autentica e retorna o token JWT |
| GET | `/api/auth/me` | Autenticado | Dados do usuário logado |
| GET | `/api/usuarios` | Admin | Lista usuários (filtros `?status=` e `?perfil=`) |
| PATCH | `/api/usuarios/:id/status` | Admin | Aprova, bloqueia ou reativa um usuário |

## 10. Como executar

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

# 5. Iniciar o servidor
npm start
```

Acesse **http://localhost:3000**. O próprio Express serve o front-end.

## 11. Testes

Cenários de teste com `curl` e checklist de resultados em [`docs/testes-api.md`](docs/testes-api.md).

## 12. Cronograma das entregas

| Entrega | Foco | Status |
|---|---|---|
| 1 | Problema, proposta e estrutura inicial | ✅ Concluída |
| 2 | Banco de dados, autenticação e JWT | ✅ Atual |
| 3 | CRUD, integração e permissões | ⏳ Prevista |
| 4 | Projeto completo, documentação e apresentação | ⏳ Prevista |
