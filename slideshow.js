(function () {
    const sectionButtons = Array.from(document.querySelectorAll('[data-share-list]'));
    if (!sectionButtons.length) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'slideshow-dialog';
    dialog.setAttribute('aria-labelledby', 'slideshow-title');
    dialog.innerHTML = `
        <div class="slideshow-toolbar">
            <h2 class="slideshow-heading" id="slideshow-title"></h2>
            <div class="slideshow-options">
                <label class="slideshow-count-label" for="slideshow-count">Itens</label>
                <select class="slideshow-select" id="slideshow-count" aria-label="Quantidade de itens"></select>
                <button class="slideshow-button" type="button" data-close-slideshow>Fechar</button>
            </div>
        </div>
        <section class="slideshow-editor" aria-label="Personalizar visual do carrossel">
            <label class="slideshow-editor-select">
                <span>Paleta</span>
                <select class="slideshow-select" data-design-preset>
                    <option value="dark">Radar escuro</option>
                    <option value="light">Radar claro</option>
                    <option value="custom">Personalizada</option>
                </select>
            </label>
            <label class="slideshow-editor-color">
                <span>Fundo</span>
                <input type="color" value="#1b2127" data-design-color="surface">
            </label>
            <label class="slideshow-editor-color">
                <span>Fundo da capa</span>
                <input type="color" value="#20272d" data-design-color="cover">
            </label>
            <label class="slideshow-editor-color">
                <span>Acento</span>
                <input type="color" value="#9bbf7a" data-design-color="accent">
            </label>
            <label class="slideshow-editor-color">
                <span>Texto</span>
                <input type="color" value="#e4e8e5" data-design-color="text">
            </label>
            <label class="slideshow-editor-color">
                <span>Texto secundário</span>
                <input type="color" value="#9aa5a0" data-design-color="secondary">
            </label>
            <label class="slideshow-editor-color">
                <span>Texto principal da capa</span>
                <input type="color" value="#e4e8e5" data-design-color="cover-text">
            </label>
            <label class="slideshow-editor-color">
                <span>Texto secundário da capa</span>
                <input type="color" value="#9aa5a0" data-design-color="cover-secondary">
            </label>
            <label class="slideshow-editor-select">
                <span>Título</span>
                <select class="slideshow-select" data-design-font>
                    <option value="serif">Serifada</option>
                    <option value="sans">Sem serifa</option>
                </select>
            </label>
        </section>
        <div class="slideshow-stage" aria-live="polite"></div>
        <div class="slideshow-sharing">
            <strong>Compartilhar este carrossel</strong>
            <div class="slideshow-share-links">
                <a data-network="linkedin" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a data-network="facebook" target="_blank" rel="noopener noreferrer">Facebook</a>
                <a data-network="instagram" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>
                <a data-network="tiktok" href="https://www.tiktok.com/upload" target="_blank" rel="noopener noreferrer">TikTok</a>
                <button class="slideshow-button" type="button" data-download-images>Baixar slides PNG</button>
            </div>
            <p class="slideshow-share-note">LinkedIn e Facebook compartilham o link da seção. Para postar os slides, baixe e descompacte o ZIP; Instagram e TikTok também copiam a legenda.</p>
            <p class="slideshow-feedback" role="status" aria-live="polite"></p>
        </div>
        <div class="slideshow-footer">
            <div class="slideshow-navigation">
                <button class="slideshow-button" type="button" data-previous-slide>Anterior</button>
                <span class="slideshow-status" aria-label="Slide atual"></span>
                <button class="slideshow-button" type="button" data-next-slide>Próximo</button>
            </div>
            <button class="slideshow-button" type="button" data-print-slideshow>Imprimir / salvar PDF</button>
        </div>`;
    document.body.append(dialog);

    const stage = dialog.querySelector('.slideshow-stage');
    const countSelect = dialog.querySelector('#slideshow-count');
    const countLabel = dialog.querySelector('.slideshow-count-label');
    const presetSelect = dialog.querySelector('[data-design-preset]');
    const colorInputs = Object.fromEntries(Array.from(dialog.querySelectorAll('[data-design-color]'))
        .map((input) => [input.dataset.designColor, input]));
    const fontSelect = dialog.querySelector('[data-design-font]');
    const status = dialog.querySelector('.slideshow-status');
    const feedback = dialog.querySelector('.slideshow-feedback');
    const downloadButton = dialog.querySelector('[data-download-images]');
    const socialLinks = {
        linkedin: dialog.querySelector('[data-network="linkedin"]'),
        facebook: dialog.querySelector('[data-network="facebook"]'),
        instagram: dialog.querySelector('[data-network="instagram"]'),
        tiktok: dialog.querySelector('[data-network="tiktok"]')
    };

    let section;
    let sectionTitle = '';
    let currentItems = [];
    let selectedItems = [];
    let slides = [];
    let activeSlide = 0;
    let singleStory = false;
    const designPresets = {
        dark: {
            surface: '#1b2127',
            cover: '#20272d',
            accent: '#9bbf7a',
            text: '#e4e8e5',
            secondary: '#9aa5a0',
            'cover-text': '#e4e8e5',
            'cover-secondary': '#9aa5a0'
        },
        light: {
            surface: '#fbfcf9',
            cover: '#f7f9f5',
            accent: '#4e7048',
            text: '#28322d',
            secondary: '#5b6861',
            'cover-text': '#28322d',
            'cover-secondary': '#5b6861'
        }
    };

    function textOf(element) {
        return element ? element.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    function slug(value) {
        return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'radar-open-source';
    }

    function extractCard(card) {
        const nameLink = card.querySelector('.repo-name');
        if (!nameLink) return null;

        let repositoryUrl;
        try {
            repositoryUrl = new URL(nameLink.href, window.location.href);
        } catch {
            return null;
        }

        if (repositoryUrl.protocol !== 'https:' || repositoryUrl.hostname !== 'github.com') return null;

        const metrics = Array.from(card.querySelectorAll('.repo-bottom > span')).map(textOf);
        const primaryMetric = metrics[0] || '';
        const isProfile = primaryMetric.toLowerCase().includes('seguidor');
        const avatarImage = isProfile
            ? card.querySelector('.repo-header img[src*="avatars.githubusercontent.com"]')
            : null;
        const name = textOf(nameLink);
        const sectionId = card.closest('.tab-content')?.id || 'story';
        const cardId = card.id || `radar-${sectionId}-${slug(name)}`;
        card.id = cardId;
        card.tabIndex = 0;
        card.setAttribute('aria-label', `Abrir notícia para compartilhar: ${name}`);

        return {
            name,
            url: repositoryUrl.href,
            cardId,
            category: textOf(card.querySelector('.category-badge')) || (isProfile ? 'Comunidade brasileira' : 'Em destaque'),
            description: textOf(card.querySelector('.repo-description')) || 'Sem descrição disponível.',
            primaryMetric: primaryMetric || 'Em destaque',
            secondaryMetric: metrics[1] || '',
            language: isProfile ? '' : (metrics[2] || ''),
            avatar: avatarImage ? avatarImage.src : ''
        };
    }

    function getSectionTitle(targetSection) {
        const heading = targetSection.querySelector('h3');
        if (!heading) return 'Radar Open Source';
        const cleanHeading = heading.cloneNode(true);
        cleanHeading.querySelectorAll('a, button, .section-actions').forEach((element) => element.remove());
        return textOf(cleanHeading) || 'Radar Open Source';
    }

    function getRepositoryUpdateDate() {
        const updateText = textOf(document.querySelector('.update-info'));
        const match = updateText.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
        return match ? `ATUALIZADO EM ${match[1]}` : '';
    }

    function addText(parent, tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        parent.append(element);
        return element;
    }

    function addFooter(slide, current, total) {
        const footer = document.createElement('div');
        footer.className = 'share-slide-footer';
        addText(footer, 'span', '', 'RADAR OPEN SOURCE');
        addText(footer, 'span', '', `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`);
        slide.append(footer);
    }

    function applyDesignToSlides() {
        dialog.dataset.format = 'portrait';
        const ratio = '4 / 5';
        const titleFont = fontSelect.value === 'sans' ? 'DM Sans, sans-serif' : 'Lora, Georgia, serif';
        const bodyFont = 'DM Sans, sans-serif';
        slides.forEach((slide) => {
            Object.entries(colorInputs).forEach(([name, input]) => {
                slide.style.setProperty(`--deck-${name}`, input.value);
            });
            slide.style.setProperty('--deck-ratio', ratio);
            slide.style.setProperty('--deck-title-font', titleFont);
            slide.style.setProperty('--deck-body-font', bodyFont);
        });
    }

    function setDesignPreset(presetName) {
        const preset = designPresets[presetName];
        if (!preset) return;
        Object.entries(preset).forEach(([name, color]) => {
            colorInputs[name].value = color;
        });
        presetSelect.value = presetName;
        applyDesignToSlides();
    }

    function markDesignAsCustom() {
        presetSelect.value = 'custom';
        applyDesignToSlides();
    }

    function makeStorySlide(item, index, total) {
        const slide = document.createElement('article');
        slide.className = 'share-slide share-slide-repository';
        const content = document.createElement('div');
        const isProfile = item.primaryMetric.toLowerCase().includes('seguidor');

        if (isProfile && item.avatar) {
            const avatar = document.createElement('img');
            avatar.className = 'share-slide-avatar';
            avatar.src = item.avatar;
            avatar.alt = `Foto de perfil de ${item.name}`;
            avatar.crossOrigin = 'anonymous';
            content.append(avatar);
        }

        addText(content, 'div', 'share-slide-kicker', `${isProfile ? 'PESSOA EM DESTAQUE' : ''} · ${item.category}`);
        addText(content, 'h2', 'share-slide-title', item.name);
        addText(content, 'p', 'share-slide-description', item.description);

        const stats = document.createElement('div');
        stats.className = 'share-slide-stats';
        addText(stats, 'span', '', item.primaryMetric);
        if (item.secondaryMetric) addText(stats, 'span', '', item.secondaryMetric);
        if (item.language) addText(stats, 'span', '', item.language);
        content.append(stats);

        const link = addText(content, 'a', 'share-slide-link', 'Ver no GitHub ↗');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        slide.append(content);
        addFooter(slide, index + 1, total);
        return slide;
    }

    function makeCover(totalItems, totalSlides) {
        const cover = document.createElement('article');
        cover.className = 'share-slide share-slide-cover';
        const content = document.createElement('div');
        const editionLine = document.createElement('div');
        editionLine.className = 'share-slide-kicker-row';
        
        addText(editionLine, 'span', 'share-slide-kicker-date', getRepositoryUpdateDate());
        content.append(editionLine);
        addText(content, 'h2', 'share-slide-title', singleStory ? 'Uma notícia para acompanhar' : sectionTitle);
        const summary = singleStory
            ? `Em destaque: ${selectedItems[0].name}.`
            : `${totalItems} destaques da comunidade open source para descobrir e compartilhar.`;
        addText(content, 'p', 'share-slide-description', summary);
        cover.append(content);
        addFooter(cover, 1, totalSlides);
        return cover;
    }

    function makeClosing(totalSlides) {
        const closing = document.createElement('article');
        closing.className = 'share-slide share-slide-closing';
        const content = document.createElement('div');
        addText(content, 'div', 'share-slide-kicker', 'FIM DA EDIÇÃO');
        addText(content, 'h2', 'share-slide-title', 'Uma boa ideia merece ser compartilhada.');
        addText(content, 'p', 'share-slide-description', 'Explore os projetos e pessoas que estão construindo o próximo capítulo do open source.');
        closing.append(content);
        addFooter(closing, totalSlides, totalSlides);
        return closing;
    }

    function updateCountChoices() {
        countSelect.replaceChildren();
        [5, 10, 15, 25].filter((count) => count < currentItems.length).forEach((count) => {
            const option = document.createElement('option');
            option.value = String(count);
            option.textContent = `${count} destaques`;
            countSelect.append(option);
        });
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = `Todos (${currentItems.length})`;
        countSelect.append(allOption);
        countSelect.value = currentItems.length > 5 ? '5' : 'all';
        countSelect.hidden = singleStory || currentItems.length <= 5;
        countLabel.hidden = countSelect.hidden;
    }

    function publicShareUrl() {
        if (!/^https?:$/.test(window.location.protocol)) return '';
        const url = new URL(window.location.href);
        url.search = '';
        url.searchParams.set('shareDesign', '1');
        url.searchParams.set('count', String(selectedItems.length));
        url.searchParams.set('format', '4:5');
        url.searchParams.set('font', fontSelect.value);
        Object.entries(colorInputs).forEach(([name, input]) => {
            url.searchParams.set(name, input.value);
        });
        url.hash = singleStory ? selectedItems[0].cardId : section.id;
        return url.href;
    }

    function updateSocialLinks() {
        const shareUrl = publicShareUrl();
        const encodedUrl = encodeURIComponent(shareUrl);
        socialLinks.linkedin.href = shareUrl
            ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
            : '#';
        socialLinks.facebook.href = shareUrl
            ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
            : '#';
        [socialLinks.linkedin, socialLinks.facebook].forEach((link) => {
            link.setAttribute('aria-disabled', String(!shareUrl));
            link.classList.toggle('is-disabled', !shareUrl);
        });
        dialog.querySelector('.slideshow-share-note').textContent = shareUrl
            ? 'LinkedIn e Facebook compartilham o link da seção. Para postar os slides, baixe e descompacte o ZIP; Instagram e TikTok também copiam a legenda.'
            : 'Publique o site no GitHub Pages para ativar links sociais. Instagram e TikTok exigem anexar os slides manualmente.';
    }

    function createSlides() {
        const count = singleStory || countSelect.value === 'all'
            ? currentItems.length
            : Number(countSelect.value);
        selectedItems = currentItems.slice(0, count);
        const slideCount = selectedItems.length + 2;
        slides = [
            makeCover(selectedItems.length, slideCount),
            ...selectedItems.map((item, index) => makeStorySlide(item, index + 1, slideCount)),
            makeClosing(slideCount)
        ];
        applyDesignToSlides();
        activeSlide = 0;
        dialog.querySelector('#slideshow-title').textContent = singleStory
            ? 'Notícia para compartilhar'
            : `Compartilhe  · ${sectionTitle}`;
        updateSocialLinks();
        showSlide();
    }

    function showSlide() {
        stage.replaceChildren(slides[activeSlide]);
        status.textContent = `${activeSlide + 1} / ${slides.length}`;
        dialog.querySelector('[data-previous-slide]').disabled = activeSlide === 0;
        dialog.querySelector('[data-next-slide]').disabled = activeSlide === slides.length - 1;
    }

    function openSection(targetSection, focusedCard) {
        if (!targetSection || targetSection.id === 'stats') return;
        section = targetSection;
        sectionTitle = getSectionTitle(section);
        currentItems = Array.from(section.querySelectorAll('.repo-item'))
            .map(extractCard)
            .filter(Boolean);
        singleStory = Boolean(focusedCard);
        if (focusedCard) {
            const focusedItem = extractCard(focusedCard);
            currentItems = focusedItem ? [focusedItem] : [];
        }
        if (!currentItems.length) return;

        updateCountChoices();
        createSlides();
        feedback.textContent = '';
        dialog.showModal();
    }

    async function copyCaption() {
        const shareUrl = publicShareUrl();
        const names = selectedItems.slice(0, 5).map((item) => `• ${item.name}`).join('\n');
        const caption = `Radar Open Source | ${sectionTitle}\n\n${names}\n\nConfira a edição completa${shareUrl ? `: ${shareUrl}` : ''}\n\n#OpenSource #GitHub #Tecnologia`;
        try {
            await navigator.clipboard.writeText(caption);
            feedback.textContent = 'Legenda e link copiados.';
        } catch {
            const field = document.createElement('textarea');
            field.value = caption;
            field.setAttribute('readonly', '');
            field.style.position = 'fixed';
            field.style.opacity = '0';
            document.body.append(field);
            field.select();
            const copied = document.execCommand('copy');
            field.remove();
            feedback.textContent = copied ? 'Legenda e link copiados.' : 'Copie a legenda manualmente após publicar o site.';
        }
    }

    async function downloadPngCarousel() {
        if (!window.html2canvas || !window.JSZip) {
            feedback.textContent = 'Não foi possível carregar a exportação de imagens. Verifique a conexão e tente novamente.';
            return;
        }

        downloadButton.disabled = true;
        feedback.textContent = 'Preparando imagens do carrossel...';
        const exportHost = document.createElement('div');
        exportHost.style.cssText = 'position:fixed;left:-10000px;top:0;width:540px;z-index:-1;';
        document.body.append(exportHost);
        const archive = new window.JSZip();

        try {
            await document.fonts.ready;
            for (let index = 0; index < slides.length; index += 1) {
                const clone = slides[index].cloneNode(true);
                clone.style.width = '540px';
                clone.style.height = '675px';
                clone.style.aspectRatio = 'auto';
                clone.style.padding = '42px';
                exportHost.replaceChildren(clone);
                const canvas = await window.html2canvas(clone, { scale: 2, backgroundColor: null, useCORS: true });
                const image = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
                if (!image) throw new Error('Falha ao criar uma imagem do carrossel.');
                archive.file(`${String(index + 1).padStart(2, '0')}-${slug(sectionTitle)}.png`, image);
            }
            const archiveBlob = await archive.generateAsync({ type: 'blob' });
            const downloadUrl = URL.createObjectURL(archiveBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = `radar-open-source-${slug(sectionTitle)}.zip`;
            downloadLink.click();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            feedback.textContent = 'Slides PNG prontos para publicar como carrossel.';
        } catch (error) {
            feedback.textContent = error.message || 'Não foi possível exportar as imagens.';
        } finally {
            exportHost.remove();
            downloadButton.disabled = false;
        }
    }

    function printSlides() {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            feedback.textContent = 'Permita pop-ups para salvar o carrossel como PDF.';
            return;
        }
        const slideMarkup = slides.map((slide) => slide.outerHTML).join('');
        const pageHeight = '135mm';
        printWindow.document.write(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Radar Open Source - ${sectionTitle}</title>
<style>
    @page{size:108mm ${pageHeight};margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}
    body{font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .share-slide{display:flex;width:108mm;height:${pageHeight};flex-direction:column;justify-content:space-between;overflow:hidden;padding:11mm;background:var(--deck-surface,#1b2127);color:var(--deck-text,#e4e8e5);font-family:var(--deck-body-font,Arial,sans-serif);break-after:page;page-break-after:always}
    .share-slide:last-child{break-after:auto;page-break-after:auto}.share-slide-cover,.share-slide-closing{border-top:4px solid var(--deck-accent,#9bbf7a)}
    .share-slide-cover{background:var(--deck-cover,var(--deck-surface,#1b2127))}.share-slide-closing{background:var(--deck-surface,#1b2127)}
    .share-slide-avatar{display:block;width:88px;height:88px;margin:0 0 18px;border:2px solid var(--deck-accent,#9bbf7a);border-radius:50%;object-fit:cover}
    .share-slide-kicker-row{display:flex;align-items:center;justify-content:space-between;gap:4mm}
    .share-slide-kicker,.share-slide-footer{color:var(--deck-accent,#9bbf7a);font-size:8pt;font-weight:700;text-transform:uppercase}
    .share-slide-kicker-date{color:var(--deck-secondary,#9aa5a0);font-size:7pt;font-weight:600;text-align:right;white-space:nowrap}
    .share-slide-title{margin:6mm 0;color:var(--deck-text,#e4e8e5);font-family:var(--deck-title-font,Georgia,serif);font-size:25pt;line-height:1.08;overflow-wrap:anywhere}
    .share-slide-cover .share-slide-title{color:var(--deck-cover-text,var(--deck-text,#e4e8e5))}
    .share-slide-description{display:-webkit-box;overflow:hidden;color:var(--deck-secondary,#9aa5a0);font-size:11pt;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:6}
    .share-slide-cover .share-slide-description,.share-slide-cover .share-slide-kicker-date{color:var(--deck-cover-secondary,var(--deck-secondary,#9aa5a0))}
.share-slide-stats{display:flex;flex-wrap:wrap;gap:3mm 5mm;margin-top:7mm;font-size:9pt;font-weight:700}
    .share-slide-link{display:inline-block;margin-top:6mm;color:var(--deck-accent,#9bbf7a);font-size:9pt;font-weight:700}
    .share-slide-footer{display:flex;justify-content:space-between;gap:3mm;color:var(--deck-secondary,#9aa5a0)}
@media screen{body{display:grid;justify-content:center;gap:8mm;padding:8mm;background:#222}}
</style></head><body>${slideMarkup}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.setTimeout(() => printWindow.print(), 400);
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setDesignPreset(savedTheme === 'dark' ? 'dark' : 'light');
    presetSelect.addEventListener('change', () => setDesignPreset(presetSelect.value));
    Object.values(colorInputs).forEach((input) => {
        input.addEventListener('input', markDesignAsCustom);
    });
    fontSelect.addEventListener('change', applyDesignToSlides);

    sectionButtons.forEach((button) => {
        button.addEventListener('click', () => openSection(document.getElementById(button.dataset.shareList)));
    });
    document.querySelectorAll('.repo-item').forEach((card) => {
        extractCard(card);
        card.addEventListener('click', (event) => {
            if (event.target.closest('a, button, input, select, textarea')) return;
            openSection(card.closest('.tab-content'), card);
        });
        card.addEventListener('keydown', (event) => {
            if ((event.key === 'Enter' || event.key === ' ') && event.target === card) {
                event.preventDefault();
                openSection(card.closest('.tab-content'), card);
            }
        });
    });

    dialog.querySelector('[data-close-slideshow]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-previous-slide]').addEventListener('click', () => {
        activeSlide -= 1;
        showSlide();
    });
    dialog.querySelector('[data-next-slide]').addEventListener('click', () => {
        activeSlide += 1;
        showSlide();
    });
    dialog.querySelector('[data-print-slideshow]').addEventListener('click', printSlides);
    downloadButton.addEventListener('click', downloadPngCarousel);
    countSelect.addEventListener('change', createSlides);
    [socialLinks.instagram, socialLinks.tiktok].forEach((link) => {
        link.addEventListener('click', () => { void copyCaption(); });
    });
    [socialLinks.linkedin, socialLinks.facebook].forEach((link) => {
        link.addEventListener('click', (event) => {
            if (link.getAttribute('aria-disabled') === 'true') {
                event.preventDefault();
                feedback.textContent = 'Publique o site no GitHub Pages para compartilhar um link público.';
            }
        });
    });
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' && activeSlide > 0) {
            activeSlide -= 1;
            showSlide();
        } else if (event.key === 'ArrowRight' && activeSlide < slides.length - 1) {
            activeSlide += 1;
            showSlide();
        }
    });

    if (window.location.hash) {
        window.addEventListener('load', () => {
            let targetId = window.location.hash.slice(1);
            try {
                targetId = decodeURIComponent(targetId);
            } catch {
                return;
            }
            const target = document.getElementById(targetId);
            target?.scrollIntoView();

            const params = new URLSearchParams(window.location.search);
            if (params.get('shareDesign') !== '1' || !target) return;
            Object.entries(colorInputs).forEach(([name, input]) => {
                const value = params.get(name);
                if (value && /^#[\da-f]{6}$/i.test(value)) input.value = value;
            });
            fontSelect.value = params.get('font') === 'sans' ? 'sans' : 'serif';
            presetSelect.value = 'custom';

            const targetSection = target.classList.contains('repo-item')
                ? target.closest('.tab-content')
                : target;
            if (!targetSection?.classList.contains('tab-content')) return;
            document.querySelector(`.tabs [aria-controls="${targetSection.id}"]`)?.click();
            targetSection.scrollIntoView();
            openSection(targetSection, target.classList.contains('repo-item') ? target : null);
            const sharedCount = params.get('count');
            if (!singleStory && sharedCount && Array.from(countSelect.options).some((option) => option.value === sharedCount)) {
                countSelect.value = sharedCount;
                createSlides();
            }
        }, { once: true });
    }
})();