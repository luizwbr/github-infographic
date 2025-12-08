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
                            descricao:  'Sem descrição',
                            // descricao: repo.description || 'Sem descrição',
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

function gerarHTML(reposTrending, reposBrasileiros, reposEmAltaBrasil, devsBrasileiros) {
    const trendingItems = reposTrending.map((repo, index) => `
            <div class="repo-item">
                <div class="repo-header">
                    <span class="repo-icon">📦</span>
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong>⭐ ${repo.stars}</strong> stars</span>
                    <span style="color: var(--light-text);">🍴 ${repo.forks} forks</span>
                    <span style="color: var(--light-text);">💻 ${repo.linguagem}</span>
                    <span style="color: var(--light-text);">📅 ${repo.criadoEm}</span>
                </div>
            </div>`).join('');

    const brasileirosItems = reposBrasileiros.map((repo, index) => `
            <div class="repo-item">
                <div class="repo-header">
                    <span class="repo-icon">🇧🇷</span>
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong>⭐ ${repo.stars}</strong> stars</span>
                    <span style="color: var(--light-text);">🍴 ${repo.forks} forks</span>
                    <span style="color: var(--light-text);">💻 ${repo.linguagem}</span>
                    <span style="color: var(--light-text);">📅 ${repo.criadoEm}</span>
                </div>
            </div>`).join('');

    const emAltaBrasilItems = reposEmAltaBrasil.map((repo, index) => `
            <div class="repo-item">
                <div class="repo-header">
                    <span class="repo-icon">🚀</span>
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong>⭐ ${repo.stars}</strong> stars</span>
                    <span style="color: var(--light-text);">🍴 ${repo.forks} forks</span>
                    <span style="color: var(--light-text);">💻 ${repo.linguagem}</span>
                    <span style="color: var(--light-text);">📅 ${repo.criadoEm}</span>
                </div>
            </div>`).join('');

    const desenvolvedoresItems = devsBrasileiros.map((dev, index) => `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="${dev.avatar}" alt="${dev.login}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                    <a href="${dev.url}" target="_blank" class="repo-name">${dev.login}</a>
                </div>
                <div class="repo-description">${dev.bio}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong>👥 ${dev.seguidores}</strong> seguidores</span>
                    <span style="color: var(--light-text);">👤 ${dev.tipo}</span>
                </div>
            </div>`).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 Repositórios GitHub — Trending & Brasil</title>
    <style>
        :root {
            --primary-color: #2c3e50;
            --secondary-color: #3498db;
            --star-color: #f1c40f;
            --text-color: #ecf0f1;
            --light-text: #bdc3c7;
            --background-dark: #34495e;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--background-dark);
            color: var(--text-color);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
        }

        .infographic-container {
            width: 100%;
            max-width: 650px;
            background-color: var(--primary-color);
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            padding: 30px;
        }

        .header {
            text-align: center;
            border-bottom: 3px solid var(--secondary-color);
            padding-bottom: 15px;
            margin-bottom: 25px;
        }

        .header h1 {
            color: var(--text-color);
            font-size: 1.8em;
            margin: 0;
        }

        .header p {
            color: var(--light-text);
            font-size: 0.9em;
            margin-top: 5px;
        }

        .repo-item {
            background-color: var(--background-dark);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            transition: transform 0.2s, box-shadow 0.2s;
            border-left: 5px solid var(--secondary-color);
        }
        
        .repo-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
        }

        .repo-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .repo-icon {
            font-size: 1.5em;
            margin-right: 10px;
        }

        .repo-name {
            font-weight: bold;
            font-size: 1.1em;
            color: var(--secondary-color);
            text-decoration: none;
        }

        .repo-name:hover {
            text-decoration: underline;
        }

        .repo-stars strong {
            color: var(--star-color);
            font-size: 1.1em;
        }

        .repo-description {
            font-size: 0.9em;
            color: var(--light-text);
            margin-top: 5px;
        }

        .footer {
            text-align: center;
            padding-top: 20px;
            font-size: 0.8em;
            color: var(--light-text);
        }

        .update-info {
            text-align: center;
            color: var(--star-color);
            font-size: 0.85em;
            margin-bottom: 15px;
        }

        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid var(--background-dark);
        }

        .tab {
            padding: 12px 24px;
            background: transparent;
            border: none;
            color: var(--light-text);
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }

        .tab:hover {
            color: var(--text-color);
        }

        .tab.active {
            color: var(--secondary-color);
            border-bottom-color: var(--secondary-color);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="infographic-container">
        <div class="header">
            <h1>🔥 Repositórios GitHub</h1>
            <p>Os projetos open-source mais populares e inovadores.</p>
        </div>

        <div class="update-info">
            ⏱️ Última atualização: ${new Date().toLocaleString('pt-BR')}
        </div>

        <div class="tabs">
            <button class="tab active" onClick="trendingTab()">📈 Em Alta</button>
            <button class="tab" onClick="emAltaBrasilTab()">🚀 Em Alta BR</button>
            <button class="tab" onClick="brTab()">🇧🇷 Repos Brasil</button>
            <button class="tab" onClick="devsTab()">👥 Devs Brasil</button>
        </div>

        <div id="trending" class="tab-content active">
            <h3 style="color: var(--secondary-color); margin-bottom: 15px;">Repositórios em Alta — Última Semana</h3>
            <div class="repo-list">
${trendingItems}
            </div>
        </div>

        <div id="emaltabrasil" class="tab-content">
            <h3 style="color: var(--secondary-color); margin-bottom: 15px;">🚀 Repositórios em Alta no Brasil — Última Semana</h3>
            <div class="repo-list">
${emAltaBrasilItems}
            </div>
        </div>

        <div id="brasil" class="tab-content">
            <h3 style="color: var(--secondary-color); margin-bottom: 15px;">Top Repositórios de Desenvolvedores Brasileiros</h3>
            <div class="repo-list">
${brasileirosItems}
            </div>
        </div>

        <div id="devs" class="tab-content">
            <h3 style="color: var(--secondary-color); margin-bottom: 15px;">👥 Top Desenvolvedores Brasileiros no GitHub</h3>
            <div class="repo-list">
${desenvolvedoresItems}
            </div>
        </div>

        <div class="footer">
            Dados: GitHub API • Gerado dinamicamente por Node.js
        </div>
    </div>

    <script language="javascript">
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

        function switchTab(tabName) {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
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
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 1 segundo para evitar rate limit
        console.log(`✅ Encontrados ${reposTrending.length} repositórios trending\n`);

        // Buscar repositórios brasileiros
        console.log('🇧🇷 Buscando repositórios de desenvolvedores brasileiros...');
        const reposBrasileiros = await buscarRepositoriosBrasileiros();
         await new Promise(resolve => setTimeout(resolve, 2000))
        console.log(`✅ Encontrados ${reposBrasileiros.length} repositórios brasileiros\n`);

        // Buscar repositórios em alta no Brasil
        console.log('🚀 Buscando repositórios em alta no Brasil (última semana)...');
        const reposEmAltaBrasil = await buscarRepositoriosEmAltaBrasil();
         await new Promise(resolve => setTimeout(resolve, 2000))
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