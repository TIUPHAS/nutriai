# 🥗 NutriAI

Plataforma de nutrição com inteligência artificial — planos alimentares personalizados, calculadora de TMB e chatbot nutricional.

---

## Estrutura do projeto

```
nutriai_projeto/
├── backend/              # API FastAPI (Python)
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
├── frontend/             # Interface HTML estática
│   ├── config.js         # ⚙️  URL da API — edite aqui após o deploy
│   ├── index.html
│   ├── login.html
│   ├── cadastro.html
│   ├── dashboard.html
│   ├── calculadora.html
│   ├── chat.html
│   ├── plano.html
│   └── diario.html
├── render.yaml           # configuração automática do Render
├── .gitignore
└── README.md
```

---

## Rodando localmente

### Pré-requisitos
- Python 3.11+
- Uma conta [Groq](https://console.groq.com) para obter a GROQ_API_KEY (gratuito)

### 1. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/nutriai.git
cd nutriai
```

### 2. Configure o backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# ou: .venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env
```

Abra o `.env` e preencha:
```
SECRET_KEY=qualquer_string_longa
GROQ_API_KEY=sua_chave_da_groq
DATABASE_URL=                    # deixe vazio para usar SQLite local
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

### 3. Inicie o backend
```bash
uvicorn main:app --reload
# API em: http://localhost:8000/docs
```

### 4. Abra o frontend
Abra `frontend/index.html` com a extensão **Live Server** do VS Code (porta 5500).

---

## Deploy no GitHub + Render (passo a passo completo)

### PASSO 1 — Criar o repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login.
2. Clique em **New repository** (botão verde, canto superior direito).
3. Preencha:
   - **Repository name:** `nutriai`
   - **Visibility:** Public
   - Deixe todos os outros campos em branco (já temos README e .gitignore)
4. Clique em **Create repository**.

---

### PASSO 2 — Enviar o código para o GitHub

No terminal, dentro da pasta `nutriai_projeto/`:

```bash
git init
git add .
git commit -m "chore: projeto inicial NutriAI"
git remote add origin https://github.com/SEU_USUARIO/nutriai.git
git branch -M main
git push -u origin main
```

Acesse `https://github.com/SEU_USUARIO/nutriai` para confirmar que os arquivos chegaram.

---

### PASSO 3 — Criar conta no Render

1. Acesse [render.com](https://render.com) e crie uma conta gratuita.
2. Conecte sua conta do **GitHub** quando solicitado.

---

### PASSO 4 — Criar o banco de dados PostgreSQL

1. No painel do Render: **New +** → **PostgreSQL**
2. Nome: `nutriai-db` | Plano: **Free**
3. Clique em **Create Database** e aguarde ficar **Available**.
4. Copie o valor de **Internal Database URL** — usaremos no próximo passo.

---

### PASSO 5 — Deploy do Backend (FastAPI)

1. No Render: **New +** → **Web Service**
2. Escolha o repositório `nutriai`
3. Preencha:
   - **Name:** `nutriai-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
4. Em **Advanced**, adicione as variáveis de ambiente:

   | Key | Value |
   |-----|-------|
   | SECRET_KEY | String longa e aleatória (gere em https://generate-secret.vercel.app/64) |
   | GROQ_API_KEY | Sua chave da Groq |
   | DATABASE_URL | Internal Database URL copiada no Passo 4 |
   | ALLOWED_ORIGINS | `http://localhost:5500` (atualizaremos depois) |

5. Clique em **Create Web Service** e aguarde o deploy (2–5 min).
6. Anote a URL gerada: `https://nutriai-backend.onrender.com`

---

### PASSO 6 — Deploy do Frontend (HTML estático)

1. No Render: **New +** → **Static Site**
2. Escolha o repositório `nutriai`
3. Preencha:
   - **Name:** `nutriai-frontend`
   - **Publish Directory:** `frontend`
4. Clique em **Create Static Site** e aguarde.
5. Anote a URL: `https://nutriai-frontend.onrender.com`

---

### PASSO 7 — Conectar frontend ao backend

#### 7a. Edite `frontend/config.js`
```js
// Substitua pela URL real do seu backend:
const API_BASE = "https://nutriai-backend.onrender.com";
```

#### 7b. Atualize o CORS no Render
No serviço `nutriai-backend` → **Environment**, altere:

| Key | Value |
|-----|-------|
| ALLOWED_ORIGINS | `https://nutriai-frontend.onrender.com,http://localhost:5500` |

#### 7c. Envie para o GitHub
```bash
git add frontend/config.js
git commit -m "config: URL da API apontando para o Render"
git push
```

O Render detecta o push e refaz o deploy automaticamente.

---

### PASSO 8 — Testar

Acesse `https://nutriai-frontend.onrender.com` em qualquer dispositivo e faça login.

> **Atenção:** No plano gratuito o servidor "dorme" após 15 min sem uso. A primeira requisição pode demorar ~30 segundos para acordar. Isso é normal.

---

## Atualizando o projeto dia a dia

```bash
# Faça suas alterações nos arquivos, depois:
git add .
git commit -m "feat: descrição do que mudou"
git push
```

O Render atualiza o site automaticamente a cada push — sem precisar fazer nada manualmente.

---

## Variáveis de ambiente

| Variável | Local | Descrição |
|----------|-------|-----------|
| SECRET_KEY | Render → Backend | Chave JWT para autenticação |
| GROQ_API_KEY | Render → Backend | Chave da API Groq (chatbot) |
| DATABASE_URL | Render → Backend | URL do PostgreSQL |
| ALLOWED_ORIGINS | Render → Backend | URLs permitidas pelo CORS |

---

## Tecnologias

- **Backend:** FastAPI · SQLAlchemy · PostgreSQL
- **Chatbot:** Groq API (LLaMA)
- **Frontend:** HTML · CSS · JavaScript puro
- **Hospedagem:** GitHub · Render
