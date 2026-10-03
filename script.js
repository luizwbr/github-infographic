const https = require('https');
const fs = require('fs');
const path = require('path');

// Busca os repositórios mais populares criados recentemente (proxy para "trending")
async function buscarRepositoriosPopulares() {
    return new Promise((resolve, reject) => {
        // Data de 7 dias atrás
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 14);
        const dataFormatada = dataLimite.toISOString().split('T')[0];

        // Busca repos criados na última semana ordenados por stars
        const query = `created:>${dataFormatada}`;
        const url = `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=25`;

        const options = {
            hostname: 'api.github.com',
            path: url,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js-GitHub-Trending-Script',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        https.get(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    if (result.items) {
                        const repos = result.items.map(repo => ({
                            autor: repo.owner.login,
                            nome: repo.name,
                            nomeCompleto: repo.full_name,
                            url: repo.html_url,
                            descricao: repo.description || 'Sem descrição',
                            linguagem: repo.language || 'Não informada',
                            stars: repo.stargazers_count.toLocaleString('pt-BR'),
                            forks: repo.forks_count.toLocaleString('pt-BR'),
                            watchers: repo.watchers_count.toLocaleString('pt-BR'),
                            issues: repo.open_issues_count,
                            criadoEm: new Date(repo.created_at).toLocaleDateString('pt-BR')
                        }));
                        resolve(repos);
                    } else {
                        reject(new Error('Erro na resposta da API: ' + (result.message || 'Formato inválido')));
                    }
                } catch (error) {
                    reject(new Error('Erro ao processar resposta: ' + error.message));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Busca repositórios de desenvolvedores brasileiros com mais stars
async function buscarRepositoriosBrasileiros() {
    return new Promise((resolve, reject) => {
        // Busca repos de devs brasileiros ordenados por stars
        const query = `topic:Brazil`;
        const url = `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=25`;

        const options = {
            hostname: 'api.github.com',
            path: url,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js-GitHub-Trending-Script',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        https.get(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    if (result.items) {
                        const repos = result.items.map(repo => ({
                            autor: repo.owner.login,
                            nome: repo.name,
                            nomeCompleto: repo.full_name,
                            url: repo.html_url,
                            descricao: repo.description || 'Sem descrição',
                            // descricao: 'Sem descrição',
                            linguagem: repo.language || 'Não informada',
                            stars: repo.stargazers_count.toLocaleString('pt-BR'),
                            forks: repo.forks_count.toLocaleString('pt-BR'),
                            watchers: repo.watchers_count.toLocaleString('pt-BR'),
                            issues: repo.open_issues_count,
                            criadoEm: new Date(repo.created_at).toLocaleDateString('pt-BR')
                        }));
                        resolve(repos);
                    } else {
                        reject(new Error('Erro na resposta da API: ' + (result.message || 'Formato inválido')));
                    }
                } catch (error) {
                    reject(new Error('Erro ao processar resposta: ' + error.message));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Busca desenvolvedores brasileiros com mais seguidores
async function buscarDesenvolvedoresBrasileiros() {
    // Primeiro busca a lista de usuários brasileiros
    const users = await new Promise((resolve, reject) => {
        const query = 'location:Brazil';
        const url = `/search/users?q=${encodeURIComponent(query)}&sort=followers&order=desc&per_page=25`;

        const options = {
            hostname: 'api.github.com',
            path: url,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js-GitHub-Trending-Script',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        https.get(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    if (result.items) {
                        resolve(result.items);
                    } else {
                        reject(new Error('Erro na resposta da API: ' + (result.message || 'Formato inválido')));
                    }
                } catch (error) {
                    reject(new Error('Erro ao processar resposta: ' + error.message));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });

    // Agora busca os detalhes de cada usuário para obter o número de seguidores
    const devs = [];
    for (const user of users) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        
        try {
            const details = await new Promise((resolve, reject) => {
                const options = {
                    hostname: 'api.github.com',
                    path: `/users/${user.login}`,
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Node.js-GitHub-Trending-Script',
                        'Accept': 'application/vnd.github.v3+json'
                        }
                    };

                https.get(options, (res) => {
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (error) {
                            reject(error);
                        }
                    });
                }).on('error', (err) => {
                    reject(err);
                });
            });

            devs.push({
                login: details.login,
                nome: details.name || details.login,
                url: details.html_url,
                avatar: details.avatar_url,
                bio: details.bio || 'Sem bio',
                seguidores: details.followers || 0,
                tipo: details.type === 'Organization' ? 'Organização' : 'Usuário'
            });
        } catch (error) {
            console.error(`Erro ao buscar detalhes de ${user.login}:`, error.message);
        }
    }

    return devs;
}

// Busca repositórios criados no Brasil na última semana
async function buscarRepositoriosEmAltaBrasil() {
    return new Promise((resolve, reject) => {
        // Data de 7 dias atrás
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 14);
        const dataFormatada = dataLimite.toISOString().split('T')[0];

        // Busca repos criados na última semana com topic brasil
        const query = `topic:brasil created:>${dataFormatada}`;
        const url = `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=25`;

        const options = {
            hostname: 'api.github.com',
            path: url,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js-GitHub-Trending-Script',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        https.get(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    if (result.items) {
                        const repos = result.items.map(repo => ({
                            autor: repo.owner.login,
                            nome: repo.name,
                            nomeCompleto: repo.full_name,
                            url: repo.html_url,
                            descricao: repo.description || 'Sem descrição',
                            // descricao: 'Sem descrição',
                            linguagem: repo.language || 'Não informada',
                            stars: repo.stargazers_count.toLocaleString('pt-BR'),
                            forks: repo.forks_count.toLocaleString('pt-BR'),
                            watchers: repo.watchers_count.toLocaleString('pt-BR'),
                            issues: repo.open_issues_count,
                            criadoEm: new Date(repo.created_at).toLocaleDateString('pt-BR')
                        }));
                        resolve(repos);
                    } else {
                        reject(new Error('Erro na resposta da API: ' + (result.message || 'Formato inválido')));
                    }
                } catch (error) {
                    reject(new Error('Erro ao processar resposta: ' + error.message));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Função para detectar categoria de um repositório
function detectarCategoria(nomeCompleto, descricao, linguagem) {
    const text = `${nomeCompleto} ${descricao}`.toLowerCase();
    
    const categoryKeywords = {
        'IA/Machine Learning': [
            'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 
            'neural network', 'llm', 'gpt', 'chatbot', 'nlp', 'computer vision',
            'tensorflow', 'pytorch', 'model', 'training', 'inference', 'agent'
        ],
        'Web Development': [
            'web', 'website', 'frontend', 'backend', 'fullstack', 'react', 'vue', 
            'angular', 'next.js', 'svelte', 'html', 'css', 'javascript', 'typescript',
            'web app', 'website builder', 'cms'
        ],
        'Mobile': [
            'mobile', 'android', 'ios', 'app', 'flutter', 'react native', 
            'swift', 'kotlin', 'mobile app'
        ],
        'DevOps/Cloud': [
            'devops', 'cloud', 'kubernetes', 'docker', 'aws', 'azure', 'gcp',
            'ci/cd', 'deployment', 'infrastructure', 'container', 'serverless'
        ],
        'Segurança': [
            'security', 'vulnerability', 'exploit', 'penetration', 'hacking',
            'encryption', 'authentication', 'cve-', 'scanner', 'malware'
        ],
        'Blockchain/Crypto': [
            'blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3', 'nft',
            'smart contract', 'defi', 'cryptocurrency'
        ],
        'Jogos': [
            'game', 'gaming', 'unity', 'unreal', 'godot', 'game engine',
            'game development', 'gamedev'
        ],
        'Data Science': [
            'data', 'analytics', 'data science', 'visualization', 'pandas',
            'numpy', 'analysis', 'statistics', 'big data'
        ],
        'Ferramentas/Utilitários': [
            'tool', 'utility', 'cli', 'command line', 'script', 'automation',
            'productivity', 'helper', 'framework', 'library'
        ],
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return category;
        }
    }
    
    // Se não encontrou categoria específica, tenta por linguagem
    if (linguagem && linguagem !== 'N/A') {
        const lang = linguagem.toLowerCase();
        if (['python', 'jupyter notebook'].includes(lang)) return 'IA/Machine Learning';
        if (['javascript', 'typescript', 'html', 'css'].includes(lang)) return 'Web Development';
        if (['java', 'kotlin', 'swift'].includes(lang)) return 'Mobile';
    }
    
    return 'Programação Geral';
}

function traduzirLoteDeepL(textos, chave) {
    return new Promise((resolve, reject) => {
        const corpo = JSON.stringify({ text: textos, target_lang: 'PT-BR' });
        const options = {
            hostname: chave.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com',
            path: '/v2/translate',
            method: 'POST',
            headers: {
                Authorization: `DeepL-Auth-Key ${chave}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(corpo)
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`DeepL respondeu com HTTP ${response.statusCode}.`));
                    return;
                }

                try {
                    const result = JSON.parse(data);
                    const traducoes = result.translations?.map((item) => item.text);
                    if (!traducoes || traducoes.length !== textos.length || traducoes.some((texto) => !texto?.trim())) {
                        throw new Error('A resposta do DeepL não contém todas as traduções.');
                    }
                    resolve(traducoes);
                } catch (error) {
                    reject(error);
                }
            });
        });

        request.setTimeout(30000, () => request.destroy(new Error('Tempo esgotado ao traduzir com DeepL.')));
        request.on('error', reject);
        request.end(corpo);
    });
}

async function traduzirConteudosPtBr(reposTrending, reposBrasileiros, reposEmAltaBrasil, devsBrasileiros) {
    const chave = process.env.DEEPL_AUTH_KEY;
    if (!chave) {
        throw new Error('DEEPL_AUTH_KEY é obrigatória. O HTML não será gerado sem a tradução para pt-BR.');
    }

    const campos = [
        ...[...reposTrending, ...reposBrasileiros, ...reposEmAltaBrasil].map((item) => [item, 'descricao']),
        ...devsBrasileiros.map((item) => [item, 'bio'])
    ].filter(([item, campo]) => {
        const texto = item[campo]?.trim();
        return texto && texto !== 'Sem descrição' && texto !== 'Sem bio';
    });
    const textosUnicos = [...new Set(campos.map(([item, campo]) => item[campo].trim()))];
    const traducoes = new Map();

    try {
        for (let inicio = 0; inicio < textosUnicos.length; inicio += 50) {
            const lote = textosUnicos.slice(inicio, inicio + 50);
            const resultado = await traduzirLoteDeepL(lote, chave);
            lote.forEach((texto, indice) => traducoes.set(texto, resultado[indice]));
        }
    } catch (error) {
        throw new Error(`Tradução para pt-BR não concluída; o HTML não será gerado. ${error.message}`);
    }

    campos.forEach(([item, campo]) => {
        const traducao = traducoes.get(item[campo].trim());
        if (!traducao) throw new Error(`Faltou tradução para o campo ${campo}; o HTML não será gerado.`);
        item[campo] = traducao;
    });
    console.log(`🌐 ${textosUnicos.length} descrições e bios traduzidas para pt-BR.`);
    return true;
}

const categoriasPtBr = {
    'IA/Machine Learning': 'IA e aprendizado de máquina',
    'Web Development': 'Desenvolvimento web',
    'Mobile': 'Desenvolvimento mobile',
    'DevOps/Cloud': 'DevOps e nuvem',
    'Segurança': 'Segurança',
    'Blockchain/Crypto': 'Blockchain e criptoativos',
    'Jogos': 'Jogos',
    'Data Science': 'Ciência de dados',
    'Ferramentas/Utilitários': 'Ferramentas e utilitários',
    'Programação Geral': 'Programação geral'
};

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caractere) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caractere]);
}

function renderizarCartaoRepositorio(repo) {
    const categoria = categoriasPtBr[detectarCategoria(repo.nomeCompleto, repo.descricao, repo.linguagem)] || 'Programação geral';
    return `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="https://cdn-icons-png.flaticon.com/128/685/685388.png" alt="Repositório" style="width: 20px; height: 20px; opacity: 0.8;">
                    <a href="${escaparHTML(repo.url)}" target="_blank" rel="noopener noreferrer" class="repo-name">${escaparHTML(repo.nomeCompleto)}</a>
                    <span class="category-badge">${escaparHTML(categoria)}</span>
                </div>
                <div class="repo-description">${escaparHTML(repo.descricao)}</div>
                <div class="repo-bottom">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/1828/1828884.png" alt="Estrela" style="width: 14px; height: 14px; vertical-align: middle;"> <span class="repo-star-count">${escaparHTML(repo.stars)}</span></strong> estrelas</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/2874/2874791.png" alt="Forks" style="width: 14px; height: 14px; vertical-align: middle;"> ${escaparHTML(repo.forks)} forks</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1005/1005141.png" alt="Linguagem" style="width: 14px; height: 14px; vertical-align: middle;"> ${escaparHTML(repo.linguagem)}</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/747/747310.png" alt="Data de criação" style="width: 14px; height: 14px; vertical-align: middle;"> ${escaparHTML(repo.criadoEm)}</span>
                </div>
            </div>`;
}

function renderizarLogoRadar() {
    return `<h1 class="brand-heading" aria-label="Radar Open Source">
                <svg class="brand-logo" viewBox="0 0 650 150" aria-hidden="true" focusable="false">
                    <g class="brand-logo-mark">
                        <path d="M 25.567 103.289 A 58 58 0 1 1 114.433 103.289" />
                        <path d="M 39.358 91.712 A 40 40 0 1 1 100.642 91.712" />
                        <path d="M 50.849 82.069 A 25 25 0 1 1 89.151 82.069" />
                        <path class="brand-logo-diamond" d="M 70 56 L 80 66 L 70 76 L 60 66 Z" />
                    </g>
                    <text class="brand-logo-title" x="165" y="88">RADAR</text>
                    <text class="brand-logo-subtitle" x="170" y="128">OPEN SOURCE</text>
                </svg>
            </h1>`;
}

function gerarHTML(reposTrending, reposBrasileiros, reposEmAltaBrasil, devsBrasileiros) {
    const dataAtualizacao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    // Calcular data de 14 dias atrás para as URLs
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 14);
    const dataFormatada = dataLimite.toISOString().split('T')[0];

    // URLs para auditoria no GitHub
    const trendingUrl = `https://github.com/search?q=created%3A%3E${dataFormatada}&type=repositories&s=stars&o=desc`;
    const brasilUrl = 'https://github.com/search?q=topic%3ABrazil&type=repositories&s=stars&o=desc';
    const emAltaBrasilUrl = `https://github.com/search?q=topic%3Abrasil+created%3A%3E${dataFormatada}&type=repositories&s=stars&o=desc`;
    const devsBrasilUrl = 'https://github.com/search?q=location%3ABrazil&type=users&s=followers&o=desc';

    const trendingItems = reposTrending.map(renderizarCartaoRepositorio).join('');
    const brasileirosItems = reposBrasileiros.map(renderizarCartaoRepositorio).join('');
    const emAltaBrasilItems = reposEmAltaBrasil.map(renderizarCartaoRepositorio).join('');

    const desenvolvedoresItems = devsBrasileiros.map((dev) => `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="${escaparHTML(dev.avatar)}" alt="Perfil de ${escaparHTML(dev.login)}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                    <a href="${escaparHTML(dev.url)}" target="_blank" rel="noopener noreferrer" class="repo-name">${escaparHTML(dev.login)}</a>
                </div>
                <div class="repo-description">${escaparHTML(dev.bio)}</div>
                <div class="repo-bottom">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Seguidores" style="width: 14px; height: 14px; vertical-align: middle;"> ${escaparHTML(dev.seguidores)}</strong> seguidores</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1077/1077114.png" alt="Tipo de perfil" style="width: 14px; height: 14px; vertical-align: middle;"> ${escaparHTML(dev.tipo)}</span>
                </div>
            </div>`).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Radar Open Source | GitHub em pauta</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Radar semanal em pt-BR com projetos open source em destaque no mundo e no Brasil, além de desenvolvedores da comunidade brasileira.">
    <meta name="keywords" content="GitHub, repositórios em alta, código aberto, projetos open source, programação, Brasil, desenvolvedores brasileiros">
    <meta name="author" content="Luiz Weber">
    <meta name="robots" content="index, follow">
    <meta name="language" content="Português">
    <meta name="revisit-after" content="7 days">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Radar Open Source | GitHub em pauta">
    <meta property="og:description" content="Descubra projetos open source em destaque e conheça as tendências da comunidade GitHub, com conteúdo em português do Brasil.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://www.weber.eti.br">
    <meta property="og:image" content="https://cdn-icons-png.flaticon.com/512/733/733553.png">
    <meta property="og:locale" content="pt_BR">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Radar Open Source | GitHub em pauta">
    <meta name="twitter:description" content="Projetos open source em alta, perfis brasileiros e tendências do GitHub em português do Brasil.">
    <meta name="twitter:image" content="https://cdn-icons-png.flaticon.com/512/733/733553.png">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#14181c">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css" />
</head>
<body>
    <div class="infographic-container">
        <div class="header">
            ${renderizarLogoRadar()}
            <p>Projetos, ideias e pessoas que estão movimentando o GitHub.</p>
            <button class="header-hint" type="button" aria-label="Última atualização do projeto: ${dataAtualizacao}, horário de Brasília." data-hint="Última atualização do projeto: ${dataAtualizacao}, horário de Brasília.">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
            </button>
            <button class="theme-toggle" onclick="toggleTheme()" aria-label="Alternar tema">
                <img id="theme-icon" src="https://cdn-icons-png.flaticon.com/128/3688/3688612.png" alt="Tema">
            </button>
        </div>

        <div class="tabs" role="tablist" aria-label="Abas do Radar">
            <button class="tab active" id="tab-trending" type="button" role="tab" aria-selected="true" aria-controls="trending" tabindex="0" onclick="trendingTab(this)" onkeydown="tabKeydown(event, this)">Em alta global</button>
            <button class="tab" id="tab-emaltabrasil" type="button" role="tab" aria-selected="false" aria-controls="emaltabrasil" tabindex="-1" onclick="emAltaBrasilTab(this)" onkeydown="tabKeydown(event, this)">Em alta no Brasil</button>
            <button class="tab" id="tab-brasil" type="button" role="tab" aria-selected="false" aria-controls="brasil" tabindex="-1" onclick="brTab(this)" onkeydown="tabKeydown(event, this)">Repositórios brasileiros</button>
            <button class="tab" id="tab-devs" type="button" role="tab" aria-selected="false" aria-controls="devs" tabindex="-1" onclick="devsTab(this)" onkeydown="tabKeydown(event, this)">Comunidade brasileira</button>
        </div>

        <div id="trending" class="tab-content active" role="tabpanel" aria-labelledby="tab-trending" aria-hidden="false" tabindex="0">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
                <span>
                    <img src="https://cdn-icons-png.flaticon.com/128/4721/4721571.png" alt="Em alta" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                    Repositórios em alta no mundo
                </span>
                <span class="trending-actions">
                    <button class="slideshow-trigger" type="button" data-share-list="trending">Compartilhar carrossel</button>
                <a href="${trendingUrl}" target="_blank" title="Ver busca no GitHub" class="link-externo">
                    <img src="https://cdn-icons-png.flaticon.com/128/7268/7268615.png" alt="Link externo" class="img-link-externo">
                </a>
                </span>
            </h3>
            <div class="repo-list">
${trendingItems}
            </div>
        </div>

        <div id="emaltabrasil" class="tab-content" role="tabpanel" aria-labelledby="tab-emaltabrasil" aria-hidden="true" tabindex="0">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
                <span>
                    <img src="https://cdn-icons-png.flaticon.com/128/4721/4721635.png" alt="Em alta no Brasil" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                    Repositórios em alta no Brasil
                </span>
                <span class="section-actions">
                    <button class="slideshow-trigger" type="button" data-share-list="emaltabrasil">Compartilhar carrossel</button>
                <a href="${emAltaBrasilUrl}" target="_blank" title="Ver busca no GitHub" class="link-externo">
                    <img src="https://cdn-icons-png.flaticon.com/128/7268/7268615.png" alt="Link externo" class="img-link-externo">
                </a>
                </span>
            </h3>
            <div class="repo-list">
${emAltaBrasilItems}
            </div>
        </div>

        <div id="brasil" class="tab-content" role="tabpanel" aria-labelledby="tab-brasil" aria-hidden="true" tabindex="0">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
                <span>
                    <img src="https://cdn-icons-png.flaticon.com/128/197/197386.png" alt="Brasil" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                    Repositórios brasileiros com mais estrelas
                </span>
                <span class="section-actions">
                    <button class="slideshow-trigger" type="button" data-share-list="brasil">Compartilhar carrossel</button>
                <a href="${brasilUrl}" target="_blank" title="Ver busca no GitHub" class="link-externo">
                    <img src="https://cdn-icons-png.flaticon.com/128/7268/7268615.png" alt="Link externo" class="img-link-externo">
                </a>
                </span>
            </h3>
            <div class="repo-list">
${brasileirosItems}
            </div>
        </div>

        <div id="devs" class="tab-content" role="tabpanel" aria-labelledby="tab-devs" aria-hidden="true" tabindex="0">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
                <span>
                    <img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Comunidade" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                    Perfis brasileiros com mais seguidores
                </span>
                <span class="section-actions">
                    <button class="slideshow-trigger" type="button" data-share-list="devs">Compartilhar carrossel</button>
                <a href="${devsBrasilUrl}" target="_blank" title="Ver busca no GitHub" class="link-externo">
                    <img src="https://cdn-icons-png.flaticon.com/128/7268/7268615.png" alt="Link externo" class="img-link-externo">
                </a>
                </span>
            </h3>
            <div class="repo-list">
${desenvolvedoresItems}
            </div>
        </div>
        <div class="footer">
            Dados fornecidos pela <a href="https://docs.github.com/en/rest" target="_blank">API do GitHub</a>. Desenvolvido por <a href="https://www.weber.eti.br" target="_blank">Luiz Weber</a>.
        </div>
    </div>

    <script language="javascript">
        const LIGHT_URL_ICON = 'https://cdn-icons-png.flaticon.com/128/581/581601.png';
        const DARK_URL_ICON = 'https://cdn-icons-png.flaticon.com/128/869/869869.png';
        
        // Função para aplicar cores aos badges de categoria
        function applyCategoryColors() {
            const categoryColors = {
                'IA/Machine Learning': 'linear-gradient(135deg, #a371f7, #7c3aed)',
                'Web Development': 'linear-gradient(135deg, #58a6ff, #2563eb)',
                'Mobile': 'linear-gradient(135deg, #3fb950, #059669)',
                'DevOps/Cloud': 'linear-gradient(135deg, #f0883e, #ea580c)',
                'Segurança': 'linear-gradient(135deg, #ff6b6b, #dc2626)',
                'Blockchain/Crypto': 'linear-gradient(135deg, #d29922, #d97706)',
                'Jogos': 'linear-gradient(135deg, #ec4899, #db2777)',
                'Data Science': 'linear-gradient(135deg, #06b6d4, #0891b2)',
                'Ferramentas/Utilitários': 'linear-gradient(135deg, #8b949e, #6b7280)',
                'Programação Geral': 'linear-gradient(135deg, #64748b, #475569)'
            };
            
            document.querySelectorAll('.category-badge').forEach(badge => {
                const category = badge.textContent.trim();
                if (categoryColors[category]) {
                    badge.style.background = categoryColors[category];
                }
            });
        }
        
        // Inicializar tema ao carregar página
        document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            document.getElementById('theme-icon').src = savedTheme === 'light' ? LIGHT_URL_ICON : DARK_URL_ICON;
            
            // Aplicar cores aos badges
            applyCategoryColors();
        });

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            const icon = document.getElementById('theme-icon');
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            if (newTheme === 'light') {
                icon.src = LIGHT_URL_ICON;
            } else {
                icon.src = DARK_URL_ICON;
            }
        }

        function trendingTab(tab) {
            switchTab('trending', tab);
        }

        function emAltaBrasilTab(tab) {
            switchTab('emaltabrasil', tab);
        }

        function brTab(tab) {
            switchTab('brasil', tab);
        }

        function devsTab(tab) {
            switchTab('devs', tab);
        }

        function statsTab() {
            switchTab('stats');
            // Criar gráficos quando a aba for aberta (apenas uma vez)
            if (!window.chartsCreated) {
                createCharts();
                window.chartsCreated = true;
            }
        }

        function switchTab(tabName, selectedTab) {
            const tab = selectedTab || document.querySelector('.tabs [aria-controls="' + tabName + '"]');
            document.querySelectorAll('.tabs .tab').forEach(item => {
                const selected = item === tab;
                item.classList.toggle('active', selected);
                item.setAttribute('aria-selected', String(selected));
                item.tabIndex = selected ? 0 : -1;
            });
            document.querySelectorAll('.tab-content').forEach(panel => {
                const selected = panel.id === tabName;
                panel.classList.toggle('active', selected);
                panel.setAttribute('aria-hidden', String(!selected));
            });
        }

        function tabKeydown(event, currentTab) {
            const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
            const currentIndex = tabs.indexOf(currentTab);
            let targetIndex = currentIndex;
            if (event.key === 'ArrowRight') targetIndex = (currentIndex + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') targetIndex = 0;
            else if (event.key === 'End') targetIndex = tabs.length - 1;
            else return;

            event.preventDefault();
            const targetTab = tabs[targetIndex];
            const panelId = targetTab.getAttribute('aria-controls');
            switchTab(panelId, targetTab);
            targetTab.focus();
        }

        // Função para detectar país baseado no nome do autor/repositório
        function detectCountry(repoName, description, language) {
            const text = (repoName + ' ' + description).toLowerCase();
            
            // Palavras-chave para identificar países
            const countryKeywords = {
                'China': ['chinese', 'china', 'zh-', 'zhong', 'beijing', 'shanghai', 'alibaba', 'baidu', 'tencent', '中国'],
                'EUA': ['usa', 'united states', 'american', 'us-', 'silicon valley', 'microsoft', 'google', 'apple', 'meta'],
                'Índia': ['india', 'indian', 'hindi', 'bangalore', 'mumbai', 'delhi'],
                'Brasil': ['brazil', 'brasil', 'brazilian', 'português', 'rio', 'são paulo', 'pt-br'],
                'Alemanha': ['germany', 'german', 'deutsch', 'berlin', 'munich'],
                'França': ['france', 'french', 'français', 'paris'],
                'Reino Unido': ['uk', 'united kingdom', 'british', 'england', 'london'],
                'Japão': ['japan', 'japanese', 'tokyo', 'nihon', '日本'],
                'Rússia': ['russia', 'russian', 'moscow', 'русский'],
                'Coreia': ['korea', 'korean', 'seoul', 'samsung'],
            };
            
            for (const [country, keywords] of Object.entries(countryKeywords)) {
                if (keywords.some(keyword => text.includes(keyword))) {
                    return country;
                }
            }
            
            return 'Outros';
        }

        // Função para detectar categoria do repositório
        function detectCategory(repoName, description, language) {
            const text = (repoName + ' ' + description).toLowerCase();
            
            const categoryKeywords = {
                'IA/Machine Learning': [
                    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 
                    'neural network', 'llm', 'gpt', 'chatbot', 'nlp', 'computer vision',
                    'tensorflow', 'pytorch', 'model', 'training', 'inference', 'agent'
                ],
                'Web Development': [
                    'web', 'website', 'frontend', 'backend', 'fullstack', 'react', 'vue', 
                    'angular', 'next.js', 'svelte', 'html', 'css', 'javascript', 'typescript',
                    'web app', 'website builder', 'cms'
                ],
                'Mobile': [
                    'mobile', 'android', 'ios', 'app', 'flutter', 'react native', 
                    'swift', 'kotlin', 'mobile app'
                ],
                'DevOps/Cloud': [
                    'devops', 'cloud', 'kubernetes', 'docker', 'aws', 'azure', 'gcp',
                    'ci/cd', 'deployment', 'infrastructure', 'container', 'serverless'
                ],
                'Segurança': [
                    'security', 'vulnerability', 'exploit', 'penetration', 'hacking',
                    'encryption', 'authentication', 'cve-', 'scanner', 'malware'
                ],
                'Blockchain/Crypto': [
                    'blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3', 'nft',
                    'smart contract', 'defi', 'cryptocurrency'
                ],
                'Jogos': [
                    'game', 'gaming', 'unity', 'unreal', 'godot', 'game engine',
                    'game development', 'gamedev'
                ],
                'Data Science': [
                    'data', 'analytics', 'data science', 'visualization', 'pandas',
                    'numpy', 'analysis', 'statistics', 'big data'
                ],
                'Ferramentas/Utilitários': [
                    'tool', 'utility', 'cli', 'command line', 'script', 'automation',
                    'productivity', 'helper', 'framework', 'library'
                ],
            };
            
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (keywords.some(keyword => text.includes(keyword))) {
                    return category;
                }
            }
            
            // Se não encontrou categoria específica, tenta por linguagem
            if (language) {
                const lang = language.toLowerCase();
                if (['python', 'jupyter notebook'].includes(lang)) return 'IA/Machine Learning';
                if (['javascript', 'typescript', 'html', 'css'].includes(lang)) return 'Web Development';
                if (['java', 'kotlin', 'swift'].includes(lang)) return 'Mobile';
            }
            
            return 'Programação Geral';
        }

        // Função para criar os gráficos
        function createCharts() {
            // Extrair dados dos repositórios da aba "Em Alta"
            const trendingRepos = [];
            document.querySelectorAll('#trending .repo-item').forEach(item => {
                const nameElement = item.querySelector('.repo-name');
                const descElement = item.querySelector('.repo-description');
                const langElement = item.querySelector('span:nth-child(3)');
                
                if (nameElement && descElement) {
                    const fullName = nameElement.textContent.trim();
                    const description = descElement.textContent.trim();
                    const language = langElement ? langElement.textContent.trim() : '';
                    
                    trendingRepos.push({
                        name: fullName,
                        description: description,
                        language: language
                    });
                }
            });

            // Processar dados por país
            const countryCount = {};
            trendingRepos.forEach(repo => {
                const country = detectCountry(repo.name, repo.description, repo.language);
                countryCount[country] = (countryCount[country] || 0) + 1;
            });

            // Processar desenvolvedores por país
            const devCountryCount = {};
            document.querySelectorAll('#devs .repo-item').forEach(item => {
                const bioElement = item.querySelector('.repo-description');
                const nameElement = item.querySelector('.repo-name');
                
                if (bioElement && nameElement) {
                    const bio = bioElement.textContent.trim();
                    const name = nameElement.textContent.trim();
                    
                    // Para desenvolvedores brasileiros, já sabemos que são do Brasil
                    // Mas vamos tentar detectar pela bio
                    const country = detectCountry(name, bio, '');
                    devCountryCount[country] = (devCountryCount[country] || 0) + 1;
                }
            });

            // Processar dados por categoria
            const categoryCount = {};
            trendingRepos.forEach(repo => {
                const category = detectCategory(repo.name, repo.description, repo.language);
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });

            // Cores para os gráficos
            const colors = [
                'rgba(88, 166, 255, 0.8)',   // Azul
                'rgba(163, 113, 247, 0.8)',  // Roxo
                'rgba(63, 185, 80, 0.8)',    // Verde
                'rgba(240, 136, 62, 0.8)',   // Laranja
                'rgba(210, 153, 34, 0.8)',   // Amarelo
                'rgba(255, 99, 132, 0.8)',   // Rosa
                'rgba(54, 162, 235, 0.8)',   // Azul claro
                'rgba(255, 206, 86, 0.8)',   // Amarelo claro
                'rgba(75, 192, 192, 0.8)',   // Verde água
                'rgba(153, 102, 255, 0.8)',  // Roxo claro
            ];

            // Criar gráfico de repositórios por país
            const ctx1 = document.getElementById('reposByCountryChart').getContext('2d');
            new Chart(ctx1, {
                type: 'pie',
                data: {
                    labels: Object.keys(countryCount),
                    datasets: [{
                        data: Object.values(countryCount),
                        backgroundColor: colors,
                        borderColor: 'rgba(30, 30, 30, 0.8)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        title: {
                            display: false
                        }
                    }
                }
            });

            // Criar gráfico de desenvolvedores por país
            const ctx2 = document.getElementById('devsByCountryChart').getContext('2d');
            new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: Object.keys(devCountryCount),
                    datasets: [{
                        data: Object.values(devCountryCount),
                        backgroundColor: colors,
                        borderColor: 'rgba(30, 30, 30, 0.8)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        title: {
                            display: false
                        }
                    }
                }
            });

            // Criar gráfico de repositórios por categoria
            const ctx3 = document.getElementById('reposByCategoryChart').getContext('2d');
            new Chart(ctx3, {
                type: 'pie',
                data: {
                    labels: Object.keys(categoryCount),
                    datasets: [{
                        data: Object.values(categoryCount),
                        backgroundColor: colors,
                        borderColor: 'rgba(30, 30, 30, 0.8)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        title: {
                            display: false
                        }
                    }
                }
            });

            // Processar dados por linguagem de programação
            const languageCount = {};
            trendingRepos.forEach(repo => {
                let lang = repo.language.trim();
                if (lang === '' || lang === 'N/A') {
                    lang = 'Não especificada';
                }
                languageCount[lang] = (languageCount[lang] || 0) + 1;
            });

            // Criar gráfico de repositórios por linguagem
            const ctx4 = document.getElementById('reposByLanguageChart').getContext('2d');
            new Chart(ctx4, {
                type: 'pie',
                data: {
                    labels: Object.keys(languageCount),
                    datasets: [{
                        data: Object.values(languageCount),
                        backgroundColor: colors,
                        borderColor: 'rgba(30, 30, 30, 0.8)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        title: {
                            display: false
                        }
                    }
                }
            });
        }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
    <script src="slideshow.js"></script>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XG24FJMJPP"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-XG24FJMJPP');
    </script>
</body>
</html>`;
}

async function main() {
    try {
        if (!process.env.DEEPL_AUTH_KEY) {
            throw new Error('Configure DEEPL_AUTH_KEY antes de gerar o HTML; descrições e bios precisam ser traduzidas para pt-BR.');
        }

        console.log('🔍 Buscando repositórios no GitHub...\n');

        // Buscar repositórios trending
        console.log('📈 Buscando repositórios em evidência (últimos 7 dias)...');
        const reposTrending = await buscarRepositoriosPopulares();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar 1 segundo para evitar rate limit
        console.log(`✅ Encontrados ${reposTrending.length} repositórios trending\n`);

        // Buscar repositórios brasileiros
        console.log('🇧🇷 Buscando repositórios de desenvolvedores brasileiros...');
        const reposBrasileiros = await buscarRepositoriosBrasileiros();
         await new Promise(resolve => setTimeout(resolve, 3000))
        console.log(`✅ Encontrados ${reposBrasileiros.length} repositórios brasileiros\n`);

        // Buscar repositórios em alta no Brasil
        console.log('🚀 Buscando repositórios em alta no Brasil (últimos 7 dias)...');
        const reposEmAltaBrasil = await buscarRepositoriosEmAltaBrasil();
         await new Promise(resolve => setTimeout(resolve, 3000))
        console.log(`✅ Encontrados ${reposEmAltaBrasil.length} repositórios em alta no Brasil\n`);

        // Buscar desenvolvedores brasileiros
        console.log('👥 Buscando desenvolvedores brasileiros mais seguidos...');
        const devsBrasileiros = await buscarDesenvolvedoresBrasileiros();
        console.log(`✅ Encontrados ${devsBrasileiros.length} desenvolvedores brasileiros\n`);

        await traduzirConteudosPtBr(reposTrending, reposBrasileiros, reposEmAltaBrasil, devsBrasileiros);

        // Exibir trending no console
        console.log('=== REPOSITÓRIOS EM ALTA ===\n');
        reposTrending.forEach((repo, index) => {
            console.log(`${index + 1}. ${repo.nomeCompleto}`);
            console.log(`   📝 ${repo.descricao}`);
            console.log(`   ⭐ ${repo.stars} stars | 🍴 ${repo.forks} forks | 💻 ${repo.linguagem}`);
            console.log('');
        });

        // Exibir brasileiros no console
        console.log('\n=== TOP REPOSITÓRIOS BRASILEIROS ===\n');
        reposBrasileiros.forEach((repo, index) => {
            console.log(`${index + 1}. ${repo.nomeCompleto}`);
            console.log(`   📝 ${repo.descricao}`);
            console.log(`   ⭐ ${repo.stars} stars | 🍴 ${repo.forks} forks | 💻 ${repo.linguagem}`);
            console.log('');
        });

        // Exibir em alta Brasil no console
        console.log('\n=== REPOSITÓRIOS EM ALTA NO BRASIL ===\n');
        reposEmAltaBrasil.forEach((repo, index) => {
            console.log(`${index + 1}. ${repo.nomeCompleto}`);
            console.log(`   📝 ${repo.descricao}`);
            console.log(`   ⭐ ${repo.stars} stars | 🍴 ${repo.forks} forks | 💻 ${repo.linguagem}`);
            console.log('');
        });

        // Exibir desenvolvedores no console
        console.log('\n=== TOP DESENVOLVEDORES BRASILEIROS ===\n');
        devsBrasileiros.forEach((dev, index) => {
            console.log(`${index + 1}. ${dev.login}`);
            console.log(`   👥 ${dev.seguidores} seguidores`);
            console.log(`   🔗 ${dev.url}`);
            console.log('');
        });

        // Gerar e salvar HTML
        const htmlContent = gerarHTML(reposTrending, reposBrasileiros, reposEmAltaBrasil, devsBrasileiros);
        const htmlPath = path.join(__dirname, 'infografico_github_dinamico.html');
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');

        console.log(`\n✅ HTML gerado com sucesso: ${htmlPath}`);
        console.log('📄 Abra o arquivo infografico_github_dinamico.html no navegador para ver os resultados!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exitCode = 1;
    }
}

main();