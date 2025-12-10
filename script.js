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

function gerarHTML(reposTrending, reposBrasileiros, reposEmAltaBrasil, devsBrasileiros) {
    const trendingItems = reposTrending.map((repo, index) => `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="https://cdn-icons-png.flaticon.com/128/685/685388.png " alt="Repository" style="width: 20px; height: 20px; opacity: 0.8;">
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/1828/1828884.png" alt="Star" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.stars}</strong> stars</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/2874/2874791.png" alt="Fork" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.forks} forks</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1005/1005141.png" alt="Code" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.linguagem}</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/747/747310.png" alt="Calendar" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.criadoEm}</span>
                </div>
            </div>`).join('');

    const brasileirosItems = reposBrasileiros.map((repo, index) => `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="https://cdn-icons-png.flaticon.com/128/685/685388.png " alt="Repository" style="width: 20px; height: 20px; opacity: 0.8;">
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/1828/1828884.png" alt="Star" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.stars}</strong> stars</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/2874/2874791.png" alt="Fork" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.forks} forks</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1005/1005141.png" alt="Code" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.linguagem}</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/747/747310.png" alt="Calendar" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.criadoEm}</span>
                </div>
            </div>`).join('');

    const emAltaBrasilItems = reposEmAltaBrasil.map((repo, index) => `
            <div class="repo-item">
                <div class="repo-header">
                    <img src="https://cdn-icons-png.flaticon.com/128/685/685388.png " alt="Repository" style="width: 20px; height: 20px; opacity: 0.8;">
                    <a href="${repo.url}" target="_blank" class="repo-name">${repo.nomeCompleto}</a>
                </div>
                <div class="repo-description">${repo.descricao}</div>
                <div style="margin-top: 10px; display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.85em;">
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/1828/1828884.png" alt="Star" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.stars}</strong> stars</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/2874/2874791.png" alt="Fork" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.forks} forks</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1005/1005141.png" alt="Code" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.linguagem}</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/747/747310.png" alt="Calendar" style="width: 14px; height: 14px; vertical-align: middle;"> ${repo.criadoEm}</span>
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
                    <span class="repo-stars"><strong><img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Followers" style="width: 14px; height: 14px; vertical-align: middle;"> ${dev.seguidores}</strong> seguidores</span>
                    <span style="color: var(--text-secondary);"><img src="https://cdn-icons-png.flaticon.com/128/1077/1077114.png" alt="User" style="width: 14px; height: 14px; vertical-align: middle;"> ${dev.tipo}</span>
                </div>
            </div>`).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repositórios GitHub — Trending & Brasil</title>
    <link rel="stylesheet" href="styles.css" />
</head>
<body>
    <div class="infographic-container">
        <div class="header">
            <button class="theme-toggle" onclick="toggleTheme()" aria-label="Alternar tema">
                <img id="theme-icon" src="https://cdn-icons-png.flaticon.com/128/3688/3688612.png" alt="Theme">
            </button>
            <h1>Repositórios GitHub</h1>
            <p>Os projetos open-source mais populares e inovadores.</p>
        </div>

        <div class="update-info">
            <img src="https://cdn-icons-png.flaticon.com/128/2838/2838779.png" alt="Clock" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px;">
            Última atualização: ${new Date().toLocaleString('pt-BR')}
        </div>

        <div class="tabs">
            <button class="tab active" onClick="trendingTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/2991/2991148.png" alt="Trending" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Em alta
            </button>
            <button class="tab" onClick="emAltaBrasilTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/3588/3588592.png" alt="Rocket" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Em alta BR
            </button>
            <button class="tab" onClick="brTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/197/197386.png" alt="Brazil" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Repos Brasil
            </button>
            <button class="tab" onClick="devsTab()">
                <img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Users" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">
                Devs Brasil
            </button>
        </div>

        <div id="trending" class="tab-content active">
            <h3>
                <img src="https://cdn-icons-png.flaticon.com/128/2991/2991148.png" alt="Trending" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                Repositórios em Alta — Última Semana
            </h3>
            <div class="repo-list">
${trendingItems}
            </div>
        </div>

        <div id="emaltabrasil" class="tab-content">
            <h3>
                <img src="https://cdn-icons-png.flaticon.com/128/3588/3588592.png" alt="Rocket" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                Repositórios em Alta no Brasil — Última Semana
            </h3>
            <div class="repo-list">
${emAltaBrasilItems}
            </div>
        </div>

        <div id="brasil" class="tab-content">
            <h3>
                <img src="https://cdn-icons-png.flaticon.com/128/197/197386.png" alt="Brazil" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                Top Repositórios de Desenvolvedores Brasileiros
            </h3>
            <div class="repo-list">
${brasileirosItems}
            </div>
        </div>

        <div id="devs" class="tab-content">
            <h3>
                <img src="https://cdn-icons-png.flaticon.com/128/681/681494.png" alt="Users" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                Top Desenvolvedores Brasileiros no GitHub
            </h3>
            <div class="repo-list">
${desenvolvedoresItems}
            </div>
        </div>

        <div class="footer">
            Dados: GitHub API • Gerado dinamicamente por Node.js
        </div>
    </div>

    <script language="javascript">
        // Inicializar tema ao carregar página
        document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
                document.getElementById('theme-icon').src = 'https://cdn-icons-png.flaticon.com/128/3688/3688596.png';
            }
        });

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            const icon = document.getElementById('theme-icon');
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            if (newTheme === 'light') {
                icon.src = 'https://cdn-icons-png.flaticon.com/128/3688/3688596.png';
            } else {
                icon.src = 'https://cdn-icons-png.flaticon.com/128/3688/3688612.png';
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

        function switchTab(tabName) {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            event.target.closest('.tab').classList.add('active');
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