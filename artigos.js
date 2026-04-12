// artigos.js — Carrega artigos automaticamente via GitHub API
// Novos artigos publicados pelo Decap CMS aparecem sem precisar editar este arquivo
'use strict';

const GITHUB_REPO  = 'ailtonupe/bruno-teixeira-advocacia';
const GITHUB_PASTA = 'artigos';

const CATEGORIAS = {
  trabalhista:    'Trabalhista',
  civel:          'Cível',
  previdenciario: 'Previdenciário',
  criminal:       'Criminal',
  dicas:          'Dicas Jurídicas',
};

let todosArtigos = [];

async function listarArquivosGitHub() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PASTA}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!res.ok) throw new Error('Erro ao listar artigos do GitHub');
  const arquivos = await res.json();
  return arquivos
    .filter(f => f.name.endsWith('.md'))
    .map(f => f.name);
}

async function carregarArtigos() {
  const lista   = document.getElementById('artigosLista');
  const loading = document.getElementById('loading');

  try {
    const arquivos = await listarArquivosGitHub();

    if (!arquivos.length) {
      loading.style.display = 'none';
      lista.style.display = 'grid';
      lista.innerHTML = '<div class="artigos-vazio">Nenhum artigo publicado ainda.</div>';
      return;
    }

    const resultados = await Promise.allSettled(
      arquivos.map(async (arquivo) => {
        const res = await fetch(`artigos/${arquivo}`);
        if (!res.ok) throw new Error(`Nao encontrado: ${arquivo}`);
        const texto = await res.text();
        return parseMarkdown(texto, arquivo);
      })
    );

    todosArtigos = resultados
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

  } catch (err) {
    console.warn('GitHub API indisponivel, tentando fallback local:', err);
    todosArtigos = await carregarFallbackLocal();
  }

  loading.style.display = 'none';
  lista.style.display = 'grid';
  renderArtigos(todosArtigos);
  iniciarFiltros();
}

async function carregarFallbackLocal() {
  const conhecidos = [
    '2025-04-01-demitido-sem-justa-causa.md',
  ];
  const resultados = await Promise.allSettled(
    conhecidos.map(async (arquivo) => {
      const res = await fetch(`artigos/${arquivo}`);
      if (!res.ok) throw new Error();
      return parseMarkdown(await res.text(), arquivo);
    })
  );
  return resultados
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function parseMarkdown(texto, arquivo) {
  const match = texto.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = match ? match[1] : '';
  const body = texto.replace(/^---[\s\S]*?---\n/, '').trim();

  function getField(field) {
    const re = new RegExp(`^${field}:\\s*["']?(.+?)["']?\\s*$`, 'm');
    const m = frontmatter.match(re);
    return m ? m[1].trim() : '';
  }

  return {
    slug:      arquivo.replace('.md', ''),
    arquivo,
    title:     getField('title'),
    date:      getField('date'),
    resumo:    getField('resumo'),
    categoria: getField('categoria'),
    body,
  };
}

function formatarData(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}`;
}

function renderArtigos(artigos) {
  const lista = document.getElementById('artigosLista');
  if (!artigos.length) {
    lista.innerHTML = '<div class="artigos-vazio">Nenhum artigo encontrado nesta categoria.</div>';
    return;
  }
  lista.innerHTML = artigos.map(a => `
    <a class="artigo-card" href="artigo.html?slug=${encodeURIComponent(a.slug)}">
      <div class="artigo-meta">
        <span class="artigo-categoria">${CATEGORIAS[a.categoria] || a.categoria}</span>
        <span class="artigo-data">${formatarData(a.date)}</span>
      </div>
      <h2 class="artigo-titulo">${a.title}</h2>
      <p class="artigo-resumo">${a.resumo}</p>
      <span class="artigo-link">Ler artigo →</span>
    </a>
  `).join('');
}

function iniciarFiltros() {
  document.getElementById('filtros').addEventListener('click', (e) => {
    const btn = e.target.closest('.filtro-btn');
    if (!btn) return;
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    const cat = btn.dataset.cat;
    const filtrados = cat === 'todos'
      ? todosArtigos
      : todosArtigos.filter(a => a.categoria === cat);
    renderArtigos(filtrados);
  });
}

carregarArtigos();