# 🚀 Guia de Deploy no GitHub

## Passos para publicar no GitHub

### 1. Criar repositório no GitHub
1. Acesse https://github.com/new
2. Nome do repositório: `github-infographic` (ou outro nome)
3. Deixe **público** ou **privado** (sua escolha)
4. **NÃO** inicialize com README (já temos um)
5. Clique em **Create repository**

### 2. Conectar repositório local ao GitHub

Após criar o repositório, execute:

```bash
# Adicionar remote (substitua SEU_USERNAME pelo seu usuário)
git remote add origin https://github.com/SEU_USERNAME/github-infographic.git

# Renomear branch para main (padrão do GitHub)
git branch -M main

# Fazer push
git push -u origin main
```

### 3. Ativar GitHub Actions

As Actions já estão configuradas! Após o push:

1. Vá em **Settings** → **Actions** → **General**
2. Em "Workflow permissions", selecione:
   - ✅ **Read and write permissions**
3. Salve as alterações

### 4. Configurar GitHub Pages (Opcional)

Para visualizar o HTML online:

1. Vá em **Settings** → **Pages**
2. Em "Source", selecione **Deploy from a branch**
3. Branch: **main**, Folder: **/ (root)**
4. Clique em **Save**

Após alguns minutos, seu infográfico estará disponível em:
```
https://SEU_USERNAME.github.io/github-infographic/infografico_github_dinamico.html
```

## 🔄 Execução Manual

Para executar o workflow manualmente antes da próxima segunda-feira:

1. Vá em **Actions**
2. Selecione "Atualizar Infográfico GitHub"
3. Clique em **Run workflow** → **Run workflow**

## ⏰ Agendamento

O workflow está configurado para rodar:
- **Automaticamente**: Toda segunda-feira às 8h UTC (5h BRT)
- **Manualmente**: Quando você quiser via interface do GitHub

## 🔧 Ajustar Frequência

Para alterar a frequência, edite `.github/workflows/update-infographic.yml`:

```yaml
schedule:
  # Diário às 8h UTC
  - cron: '0 8 * * *'
  
  # A cada 6 horas
  - cron: '0 */6 * * *'
  
  # Toda segunda às 8h UTC (atual)
  - cron: '0 8 * * 1'
```

## 📝 Formato Cron

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Dia da semana (0-6, 0=Domingo)
│ │ │ └───── Mês (1-12)
│ │ └─────── Dia do mês (1-31)
│ └───────── Hora (0-23)
└─────────── Minuto (0-59)
```

## 🎯 Pronto!

Agora seu infográfico será atualizado automaticamente toda semana! 🎉
