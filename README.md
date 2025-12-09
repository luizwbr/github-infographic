# 🔥 Infográfico GitHub - Repositórios em Alta

Infográfico interativo que mostra os repositórios e desenvolvedores mais populares do GitHub, com foco especial no Brasil.

## 📊 O que mostra

O infográfico possui 4 abas:

1. **📈 Em Alta** - Repositórios em alta globalmente (última semana)
2. **🚀 Em Alta BR** - Repositórios em alta no Brasil (última semana)
3. **🇧🇷 Repos Brasil** - Top repositórios brasileiros de todos os tempos
4. **👥 Devs Brasil** - Top desenvolvedores brasileiros com mais seguidores

## 🤖 Atualização Automática

O infográfico é atualizado automaticamente **toda segunda-feira às 8h UTC** (5h BRT) via GitHub Actions.

O workflow:
- ✅ Executa o script `script.js` que busca dados da API do GitHub
- ✅ Gera o arquivo HTML atualizado
- ✅ **Publica diretamente no GitHub Pages** (sem fazer commits no repositório)

**Vantagens:**
- Repositório limpo, sem commits automáticos
- Deploy automático no GitHub Pages
- Histórico de deploys rastreável

Você também pode executar manualmente:
1. Vá em **Actions** no GitHub
2. Selecione "Atualizar Infográfico GitHub"
3. Clique em **Run workflow**

📍 **Acesse o infográfico em:** `https://seu-usuario.github.io/github-infographic/`

## 🚀 Executar Localmente

```bash
# Executar o script
node script.js

# Abrir o HTML gerado
start infografico_github_dinamico.html
```

## 📋 Requisitos

- Node.js 20+
- Acesso à internet (para API do GitHub)

## 🔧 Tecnologias

- Node.js (HTTPS nativo)
- GitHub API v3
- HTML5 + CSS3 + JavaScript Vanilla
- GitHub Actions

## 📄 Estrutura

```
.
├── .github/
│   └── workflows/
│       └── update-infographic.yml  # Workflow de atualização automática
├── script.js                        # Script principal
├── package.json                     # Metadados do projeto
├── infografico_github_dinamico.html # HTML gerado (atualizado automaticamente)
└── README.md                        # Este arquivo
```

## 📝 Licença

MIT
