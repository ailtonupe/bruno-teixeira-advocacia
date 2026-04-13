// artigo.js — Carrega e renderiza um artigo individual
'use strict';

const CATEGORIAS = {
  trabalhista:    'Trabalhista',
  civel:          'Cível',
  previdenciario: 'Previdenciário',
  criminal:       'Criminal',
  dicas:          'Dicas Jurídicas',
};

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatarData(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}`;
}

function markdownToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr style="border-color:rgba(201,168,76,0.2);margin:32px 0;">')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:var(--gold);text-decoration:underline;">$1</a>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:24px 0;display:block;">')
    .replace(/(<li>[\s\S]*?<\/li>)(\n<li>[\s\S]*?<\/li>)*/g, (match) => `<ul>${match}</ul>`)
    .split('\n\n')
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<')) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

function parseMarkdown(texto) {
  const match = texto.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = match ? match[1] : '';
  const body = texto.replace(/^---[\s\S]*?---\n/, '').trim();

  function getField(field) {
    const re = new RegExp(`^${field}:\\s*["']?(.+?)["']?\\s*$`, 'm');
    const m = frontmatter.match(re);
    return m ? m[1].trim() : '';
  }

  return {
    title:     getField('title'),
    date:      getField('date'),
    resumo:    getField('resumo'),
    categoria: getField('categoria'),
    capa:      getField('capa'),
    body,
  };
}

async function carregarArtigo() {
  const slug    = getParam('slug');
  const loading = document.getElementById('artigo-loading');
  const main    = document.getElementById('artigo-main');

  if (!slug) {
    loading.innerHTML = 'Artigo não encontrado. <a href="artigos.html" style="color:var(--gold)">← Voltar</a>';
    return;
  }

  try {
    const res = await fetch(`artigos/${slug}.md`);
    if (!res.ok) throw new Error('Não encontrado');
    const texto  = await res.text();
    const artigo = parseMarkdown(texto);

    document.title = `${artigo.title} | Bruno Teixeira Advocacia`;
    document.getElementById('pageDesc').content        = artigo.resumo;
    document.getElementById('artigo-titulo').textContent      = artigo.title;
    document.getElementById('breadcrumb-titulo').textContent  = artigo.title.substring(0, 40) + (artigo.title.length > 40 ? '…' : '');
    document.getElementById('artigo-cat').textContent         = CATEGORIAS[artigo.categoria] || artigo.categoria;
    document.getElementById('artigo-data').textContent        = formatarData(artigo.date);

    // Exibir imagem de capa se existir
    if (artigo.capa) {
      const heroSection = document.querySelector('.artigo-hero');
      const capaEl = document.createElement('div');
      capaEl.style.cssText = `
        width: 100%;
        max-height: 420px;
        overflow: hidden;
        margin-top: 32px;
      `;
      capaEl.innerHTML = `
        <img 
          src="${artigo.capa}" 
          alt="${artigo.title}"
          style="width:100%; height:420px; object-fit:cover; display:block;"
        />
      `;
      heroSection.appendChild(capaEl);
    }

    document.getElementById('artigo-body').innerHTML = markdownToHtml(artigo.body);

    loading.style.display = 'none';
    main.style.display    = 'block';

  } catch (err) {
    loading.innerHTML = 'Artigo não encontrado. <a href="artigos.html" style="color:var(--gold)">← Voltar para artigos</a>';
  }
}

carregarArtigo();