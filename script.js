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
                            linguagem: repo.language || 'N/A',
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
                            linguagem: repo.language || 'N/A',
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
                tipo: details.type
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
                            linguagem: repo.language || 'N/A',
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

function gerarHTML(reposTrending, reposBrasileiros, reposEmAltaBrasil, devsBrasileiros) {
    // Calcular data de 14 dias atrás para as URLs
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 14);
    const dataFormatada = dataLimite.toISOString().split('T')[0];

    // URLs para auditoria no GitHub
    const trendingUrl = `https://github.com/search?q=created%3A%3E${dataFormatada}&type=repositories&s=stars&o=desc`;
    const brasilUrl = 'https://github.com/search?q=topic%3ABrazil&type=repositories&s=stars&o=desc';
    const emAltaBrasilUrl = `https://github.com/search?q=topic%3Abrasil+created%3A%3E${dataFormatada}&type=repositories&s=stars&o=desc`;
    const devsBrasilUrl = 'https://github.com/search?q=location%3ABrazil&type=users&s=followers&o=desc';

    const trendingItems = reposTrending.map((repo, index) => {
        const categoria = detectarCategoria(repo.nomeCompleto, repo.descricao, repo.linguagem);
        return `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="https://cdn-icons-png.flaticon.com/128/685/685388.png " alt="Repository" style="width: 20px; height: 20px; opacity: 0.8;">
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                    <span class="category-badge">${categoria}</span>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/1828/1828884.png" alt="Star" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.stars}</strong> stars</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/2874/2874791.png" alt="Fork" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.forks} forks</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1005/1005141.png" alt="Code" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.linguagem}</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/747/747310.png" alt="Calendar" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.criadoEm}</span>
                </div>
            </div>`;
    }).join('');

    const brasileirosItems = reposBrasileiros.map((repo, index) => {
        const categoria = detectarCategoria(repo.nomeCompleto, repo.descricao, repo.linguagem);
        return `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="https://cdn-icons-png.flaticon.com/128/685/685388.png " alt="Repository" style="width: 20px; height: 20px; opacity: 0.8;">
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                    <span class="category-badge">${categoria}</span>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/1828/1828884.png" alt="Star" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.stars}</strong> stars</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/2874/2874791.png" alt="Fork" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.forks} forks</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1005/1005141.png" alt="Code" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.linguagem}</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/747/747310.png" alt="Calendar" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.criadoEm}</span>
                </div>
            </div>`;
    }).join('');

    const emAltaBrasilItems = reposEmAltaBrasil.map((repo, index) => {
        const categoria = detectarCategoria(repo.nomeCompleto, repo.descricao, repo.linguagem);
        return `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="https://cdn-icons-png.flaticon.com/128/685/685388.png " alt="Repository" style="width: 20px; height: 20px; opacity: 0.8;">
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                    <span class="category-badge">${categoria}</span>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/1828/1828884.png" alt="Star" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.stars}</strong> stars</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/2874/2874791.png" alt="Fork" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.forks} forks</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1005/1005141.png" alt="Code" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.linguagem}</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/747/747310.png" alt="Calendar" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.criadoEm}</span>
                </div>
            </div>`;
    }).join('');

    const desenvolvedoresItems = devsBrasileiros.map((dev, index) => `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="${dev.avatar}" alt="${dev.login}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                    <a href="${dev.url}" target="_blank" class="repo-name">${dev.login}</a>
                </div>
                <div class="repo-description">${dev.bio}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Followers" style="width: 14px; height: 14px; vertical-align: middle;"> ${dev.seguidores}</strong> seguidores</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1077/1077114.png" alt="User" style="width: 14px; height: 14px; vertical-align: middle;"> ${dev.tipo}</span>
                </div>
            </div>`).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estatísticas de Repositórios - GitHub</title>
    <link rel="stylesheet" href="styles.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
    <div class="infographic-container">
        <div class="header">
            <button class="theme-toggle" onclick="toggleTheme()" aria-label="Alternar tema">
                <img id="theme-icon" src="https://cdn-icons-png.flaticon.com/128/3688/3688612.png" alt="Theme">
            </button>
            <h1>>Estatísticas de Repositórios - GitHub</h1>
            <p>Os projetos open-source mais populares e inovadores.</p>
        </div>

        <div class="update-info">
            <img src="https://cdn-icons-png.flaticon.com/128/2838/2838779.png" alt="Clock" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px;">
            Última atualização: ${new Date().toLocaleString('pt-BR')}
        </div>

        <div class="tabs">
            <button class="tab active" onClick="trendingTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/4721/4721571.png" alt="Trending" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Em alta mundial
            </button>
            <button class="tab" onClick="emAltaBrasilTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/4721/4721635.png" alt="Trending" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Em alta BR
            </button>
            <button class="tab" onClick="brTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/197/197386.png" alt="Top repositórios Brasil" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Repos BR
            </button>
            <button class="tab" onClick="devsTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Top Devs Brasil" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Ranking Devs BR
            </button>
            <button class="tab" onClick="statsTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/3426/3426653.png" alt="Stats" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Estatísticas
            </button>
        </div>

        <div id="trending" class="tab-content active">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
                <span>
                    <img src="https://cdn-icons-png.flaticon.com/128/4721/4721571.png" alt="Trending" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                    Repositórios em Alta - Última Semana
                </span>
                <a href="${trendingUrl}" target="_blank" title="Ver busca no GitHub" style="text-decoration: none; color: var(--text-secondary); font-size: 0.9em;">
                    <img src="https://cdn-icons-png.flaticon.com/128/7268/7268615.png" alt="Link externo" style="width: 16px; height: 16px; vertical-align: middle; opacity: 0.7;">
                </a>
            </h3>
            <div class="repo-list">
${trendingItems}
            </div>
        </div>

        <div id="emaltabrasil" class="tab-content">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
                <span>
                    <img src="https://cdn-icons-png.flaticon.com/128/4721/4721635.png" alt="Em alta repos BR" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                    Repositórios em Alta no Brasil - Última Semana
                </span>
                <a href="${emAltaBrasilUrl}" target="_blank" title="Ver busca no GitHub" style="text-decoration: none; color: var(--text-secondary); font-size: 0.9em;">
                    <img src="https://cdn-icons-png.flaticon.com/128/7268/7268615.png" alt="Link externo" style="width: 16px; height: 16px; vertical-align: middle; opacity: 0.7;">
                </a>
            </h3>
            <div class="repo-list">
${emAltaBrasilItems}
            </div>
        </div>

        <div id="brasil" class="tab-content">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
                <span>
                    <img src="https://cdn-icons-png.flaticon.com/128/197/197386.png" alt="Brazil" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                    Top Repositórios de Desenvolvedores Brasileiros
                </span>
                <a href="${brasilUrl}" target="_blank" title="Ver busca no GitHub" style="text-decoration: none; color: var(--text-secondary); font-size: 0.9em;">
                    <img src="https://cdn-icons-png.flaticon.com/128/7268/7268615.png" alt="Link externo" style="width: 16px; height: 16px; vertical-align: middle; opacity: 0.7;">
                </a>
            </h3>
            <div class="repo-list">
${brasileirosItems}
            </div>
        </div>

        <div id="devs" class="tab-content">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
                <span>
                    <img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Users" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                    Ranking seguidores no Brasil
                </span>
                <a href="${devsBrasilUrl}" target="_blank" title="Ver busca no GitHub" style="text-decoration: none; color: var(--text-secondary); font-size: 0.9em;">
                    <img src="https://cdn-icons-png.flaticon.com/128/7268/7268615.png" alt="Link externo" style="width: 16px; height: 16px; vertical-align: middle; opacity: 0.7;">
                </a>
            </h3>
            <div class="repo-list">
${desenvolvedoresItems}
            </div>
        </div>
        <div id="stats" class="tab-content">
            <h3>
                <img src="https://cdn-icons-png.flaticon.com/128/3426/3426653.png" alt="Statistics" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                Estatísticas dos Repositórios em Alta
            </h3>
            <div style="padding: 20px;">
                <div style="margin-bottom: 40px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/128/7268/7268667.png" alt="Globe" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                        Repositórios por País
                    </h4>
                    <div style="max-width: 500px; margin: 0 auto;">
                        <canvas id="reposByCountryChart"></canvas>
                    </div>
                </div>
                
                <div style="margin-bottom: 40px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Developers" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                        Desenvolvedores por País
                    </h4>
                    <div style="max-width: 500px; margin: 0 auto;">
                        <canvas id="devsByCountryChart"></canvas>
                    </div>
                </div>
                
                <div style="margin-bottom: 40px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/128/1998/1998087.png" alt="Categories" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                        Repositórios por Categoria
                    </h4>
                    <div style="max-width: 500px; margin: 0 auto;">
                        <canvas id="reposByCategoryChart"></canvas>
                    </div>
                </div>
                
                <div style="margin-bottom: 40px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/128/1005/1005141.png" alt="Languages" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                        Repositórios por Linguagem de Programação
                    </h4>
                    <div style="max-width: 500px; margin: 0 auto;">
                        <canvas id="reposByLanguageChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">
            Dados fornecidos por <a href="https://docs.github.com/en/rest" target="_blank">GitHub API</a>. Desenvolvido por <a href="https://www.weber.eti.br" target="_blank">Luiz Weber</a>.
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
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
                document.getElementById('theme-icon').src = LIGHT_URL_ICON;
            }
            
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

        function trendingTab() {
            switchTab('trending');
        }

        function emAltaBrasilTab() {
            switchTab('emaltabrasil');
        }

        function brTab() {
            switchTab('brasil');
        }

        function devsTab() {
            switchTab('devs');
        }

        function statsTab() {
            switchTab('stats');
            // Criar gráficos quando a aba for aberta (apenas uma vez)
            if (!window.chartsCreated) {
                createCharts();
                window.chartsCreated = true;
            }
        }

        function switchTab(tabName) {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            event.target.closest('.tab').classList.add('active');
            document.getElementById(tabName).classList.add('active');
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
    }
}

main();