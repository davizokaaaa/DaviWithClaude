/**
 * Anfavea Theme â main.js
 * Dark mode, filters, AJAX load more, countdown, Central de Dados
 */
(function () {
  'use strict';

  /* ============================================================
     1. DARK MODE TOGGLE
     ============================================================ */
  const THEME_KEY = 'anfavea_theme';

  function applyTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme);
	document.body?.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const icons = toggle.querySelectorAll('.toggle-icon');
    icons.forEach(icon => {
      const isLight = icon.dataset.themeIcon === 'light';
      icon.classList.toggle('active', theme === 'light' ? isLight : !isLight);
    });

    const logoLight = document.querySelector('.logo-light');
    const logoDark  = document.querySelector('.logo-dark');
    if (logoLight && logoDark) {
      logoLight.classList.toggle('d-none', theme === 'dark');
      logoDark.classList.toggle('d-none', theme === 'light');
    }
  }

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';

    applyTheme(saved);

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'light' ? 'dark' : 'light');
    }

    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('themeToggleMobile')?.addEventListener('click', toggleTheme);
}

/* ============================================================
   1. ESTADO GLOBAL PUBLICACOES
   ============================================================ */
window.anfaveaPublicacoesState = {
    term:   '',
    search: '',
    page:   1
};

/* ============================================================
   2. FUNÃÃO DE CARREGAMENTO (AJAX) - USANDO FETCH EM VEZ DE JQUERY
   ============================================================ */
window.anfaveaLoadPublicacoes = function(page = 1, resetSearch = true) {
    const state = window.anfaveaPublicacoesState;
    
    // Se for uma nova busca, resetamos a pÃ¡gina para 1
    if (resetSearch) {
        state.page = 1;
        page = 1;
    } else {
        state.page = page;
    }

    // Verifica se anfaveaData existe
    if (typeof anfaveaData === 'undefined') {
        console.error('anfaveaData nÃ£o definido. Verifique o wp_localize_script.');
        return;
    }

    // Monta os dados para enviar via AJAX
    const formData = new FormData();
    formData.append('action', 'anfavea_load_more');
    formData.append('nonce', anfaveaData.nonce);
    formData.append('post_type', 'publicacoes');
    formData.append('tax', 'categoria_publicacoes');
    formData.append('term', state.term);
    formData.append('search', state.search);
    formData.append('paged', state.page);

    // Faz a requisiÃ§Ã£o AJAX usando Fetch API
    fetch(anfaveaData.ajaxurl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(response => {
        if (response.success) {
            // Atualiza a lista de publicaÃ§Ãµes
            const list = document.getElementById('publicacoesList');
            if (list) {
                list.innerHTML = response.data.html;
            } else {
                console.warn('Elemento #publicacoesList nÃ£o encontrado');
            }

            // Atualiza a paginaÃ§Ã£o
            if (window.anfaveaPublicacoes) {
                window.anfaveaPublicacoes.maxPages = response.data.max_pages || 1;
                window.anfaveaPublicacoes.currentPage = response.data.current || 1;
                renderPublicacoesPagination(response.data.current || 1, response.data.max_pages || 1);
            }
        } else {
            console.error('Erro na resposta AJAX:', response);
        }
    })
    .catch(error => {
        console.error('Erro ao carregar publicaÃ§Ãµes:', error);
    });
};

/* ============================================================
   3. PAGINAÃÃO PUBLICACOES
   ============================================================ */
function renderPublicacoesPagination(current, total) {
    const pagination = document.getElementById('publicacoesPagination');
    if (!pagination) {
        console.warn('Elemento #publicacoesPagination nÃ£o encontrado');
        return;
    }

    if (total <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `<button class="page-btn arrow" onclick="window.anfaveaPublicacoes.prevPage()">â¹</button>`;

    // LÃ³gica para mostrar pÃ¡ginas (ex: 1 2 3 ... 10)
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, current + 2);

    // Ajusta para mostrar sempre 5 pÃ¡ginas quando possÃ­vel
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(5, total);
        } else if (endPage === total) {
            startPage = Math.max(1, total - 4);
        }
    }

    // Primeira pÃ¡gina
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="window.anfaveaPublicacoes.goPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="page-dots">â¦</span>`;
        }
    }

    // PÃ¡ginas intermediÃ¡rias
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}"
                    onclick="window.anfaveaPublicacoes.goPage(${i})">${i}</button>`;
    }

    // Ãltima pÃ¡gina
    if (endPage < total) {
        if (endPage < total - 1) {
            html += `<span class="page-dots">â¦</span>`;
        }
        html += `<button class="page-btn" onclick="window.anfaveaPublicacoes.goPage(${total})">${total}</button>`;
    }

    html += `<button class="page-btn arrow" onclick="window.anfaveaPublicacoes.nextPage()">âº</button>`;

    pagination.innerHTML = html;
}

// ExpÃµe para uso externo
window.renderPublicacoesPagination = renderPublicacoesPagination;

/* ============================================================
   4. OBJETO DE CONTROLE PUBLICACOES
   ============================================================ */
window.anfaveaPublicacoes = {
    currentPage: 1,
    maxPages: 1,

    goPage(page) {
        this.currentPage = page;
        window.anfaveaPublicacoesState.page = page;
        if (window.anfaveaLoadPublicacoes) {
            window.anfaveaLoadPublicacoes(page, false);
        }
        // Scroll suave para o topo da lista
        const list = document.getElementById('publicacoesList');
        if (list) {
            list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    prevPage() {
        if (this.currentPage <= 1) return;
        this.goPage(this.currentPage - 1);
    },

    nextPage() {
        if (this.currentPage >= this.maxPages) return;
        this.goPage(this.currentPage + 1);
    },

    // MÃ©todo para resetar filtros
    resetFilters() {
        window.anfaveaPublicacoesState.term = '';
        window.anfaveaPublicacoesState.search = '';
        window.anfaveaPublicacoesState.page = 1;
        this.currentPage = 1;
        
        // Resetar botÃµes
        document.querySelectorAll('#publicacoesFilterBar .filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.term === '') {
                btn.classList.add('active');
            }
        });
        
        // Resetar busca
        const searchInput = document.getElementById('publicacoesSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Recarregar
        if (window.anfaveaLoadPublicacoes) {
            window.anfaveaLoadPublicacoes(1, true);
        }
    }
};

/* ============================================================
   5. INICIALIZAÃÃO DOS EVENTOS
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estÃ¡ na pÃ¡gina correta
    const filterBar = document.getElementById('publicacoesFilterBar');
    if (!filterBar) {
        // NÃ£o estÃ¡ na pÃ¡gina de publicaÃ§Ãµes, sai
        return;
    }

    // Seletor de filtros (categorias)
    const filterButtons = document.querySelectorAll('#publicacoesFilterBar .filter-btn');
    const searchInput = document.getElementById('publicacoesSearch');

    // Evento de clique nos botÃµes de filtro
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Remove active de todos
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Atualiza estado
            window.anfaveaPublicacoesState.term = this.dataset.term || '';

            // Recarrega com filtro (resetando pÃ¡gina)
            if (window.anfaveaLoadPublicacoes) {
                window.anfaveaLoadPublicacoes(1, true);
            }
        });
    });

    // Evento de busca (com debounce)
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                window.anfaveaPublicacoesState.search = this.value.trim();
                // Recarrega com busca (resetando pÃ¡gina)
                if (window.anfaveaLoadPublicacoes) {
                    window.anfaveaLoadPublicacoes(1, true);
                }
            }, 500); // 500ms de debounce
        });

        // Buscar ao pressionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                window.anfaveaPublicacoesState.search = this.value.trim();
                if (window.anfaveaLoadPublicacoes) {
                    window.anfaveaLoadPublicacoes(1, true);
                }
            }
        });
    }

    // Inicializa a paginaÃ§Ã£o na primeira carga
    const pagination = document.getElementById('publicacoesPagination');
    if (pagination) {
        // Pega o total de pÃ¡ginas do atributo data ou do HTML
        const maxPages = parseInt(pagination.dataset.maxPages) || 1;
        const currentPage = parseInt(pagination.dataset.currentPage) || 1;
        if (maxPages > 1) {
            renderPublicacoesPagination(currentPage, maxPages);
        }
    }
});

/* ============================================================
   1. ESTADO GLOBAL EVENTOS
   ============================================================ */
window.anfaveaEventosState = {
    term:   '',
    search: '',
    page:   1
};

function toggleEventosMes(page) {

    const bloco = document.getElementById('eventosMesContainer');

    if (!bloco) return;

    bloco.style.display = page === 1 ? '' : 'none';

}

/* ============================================================
   2. FUNÃÃO DE CARREGAMENTO (AJAX) - EVENTOS
   ============================================================ */
window.anfaveaLoadEventos = function(page = 1, resetSearch = true) {
    const state = window.anfaveaEventosState;
    
    // Se for uma nova busca, resetamos a pÃ¡gina para 1
    if (resetSearch) {
        state.page = 1;
        page = 1;
    } else {
        state.page = page;
    }

    // Verifica se anfaveaData existe
    if (typeof anfaveaData === 'undefined') {
        console.error('anfaveaData nÃ£o definido. Verifique o wp_localize_script.');
        return;
    }

    // Monta os dados para enviar via AJAX
    const formData = new FormData();
    formData.append('action', 'anfavea_load_more_eventos');
    formData.append('nonce', anfaveaData.nonce);
    formData.append('term', state.term);
    formData.append('search', state.search);
    formData.append('paged', state.page);

    // Faz a requisiÃ§Ã£o AJAX usando Fetch API
    fetch(anfaveaData.ajaxurl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(response => {
        if (response.success) {
            // Atualiza a lista de eventos (demais eventos)
            const list = document.getElementById('eventosList');
            if (list) {
                list.innerHTML = response.data.html;
            } else {
                console.warn('Elemento #eventosList nÃ£o encontrado');
            }

            // Atualiza a lista do mÃªs atual se houver
            if (response.data.html_mes && document.getElementById('eventosListMes')) {
                document.getElementById('eventosListMes').innerHTML = response.data.html_mes;
            }

            // Atualiza a paginaÃ§Ã£o
            if (window.anfaveaEventos) {
                window.anfaveaEventos.maxPages = response.data.max_pages || 1;
                window.anfaveaEventos.currentPage = response.data.current || 1;

                renderEventosPagination(
                    response.data.current || 1,
                    response.data.max_pages || 1
                );

                toggleEventosMes(response.data.current || 1);
            }
        } else {
            console.error('Erro na resposta AJAX:', response);
        }
    })
    .catch(error => {
        console.error('Erro ao carregar eventos:', error);
    });
};

/* ============================================================
   3. PAGINAÃÃO EVENTOS
   ============================================================ */
function renderEventosPagination(current, total) {
    const pagination = document.getElementById('eventosPagination');
    if (!pagination) {
        console.warn('Elemento #eventosPagination nÃ£o encontrado');
        return;
    }

    if (total <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `<button class="page-btn arrow" onclick="window.anfaveaEventos.prevPage()">â¹</button>`;

    // LÃ³gica para mostrar pÃ¡ginas (ex: 1 2 3 ... 10)
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, current + 2);

    // Ajusta para mostrar sempre 5 pÃ¡ginas quando possÃ­vel
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(5, total);
        } else if (endPage === total) {
            startPage = Math.max(1, total - 4);
        }
    }

    // Primeira pÃ¡gina
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="window.anfaveaEventos.goPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="page-dots">â¦</span>`;
        }
    }

    // PÃ¡ginas intermediÃ¡rias
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}"
                    onclick="window.anfaveaEventos.goPage(${i})">${i}</button>`;
    }

    // Ãltima pÃ¡gina
    if (endPage < total) {
        if (endPage < total - 1) {
            html += `<span class="page-dots">â¦</span>`;
        }
        html += `<button class="page-btn" onclick="window.anfaveaEventos.goPage(${total})">${total}</button>`;
    }

    html += `<button class="page-btn arrow" onclick="window.anfaveaEventos.nextPage()">âº</button>`;

    pagination.innerHTML = html;
}

// ExpÃµe para uso externo
window.renderEventosPagination = renderEventosPagination;

/* ============================================================
   4. OBJETO DE CONTROLE EVENTOS
   ============================================================ */
window.anfaveaEventos = {
    currentPage: 1,
    maxPages: 1,

    goPage(page) {
        this.currentPage = page;
        window.anfaveaEventosState.page = page;
        if (window.anfaveaLoadEventos) {
            window.anfaveaLoadEventos(page, false);
        }
        // Scroll suave para o topo da lista
        const list = document.getElementById('eventosList');
        if (list) {
            list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    prevPage() {
        if (this.currentPage <= 1) return;
        this.goPage(this.currentPage - 1);
    },

    nextPage() {
        if (this.currentPage >= this.maxPages) return;
        this.goPage(this.currentPage + 1);
    },

    // MÃ©todo para resetar filtros
    resetFilters() {
        window.anfaveaEventosState.term = '';
        window.anfaveaEventosState.search = '';
        window.anfaveaEventosState.page = 1;
        this.currentPage = 1;
        
        // Resetar botÃµes
        document.querySelectorAll('#eventosFilterBar .filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.term === '') {
                btn.classList.add('active');
            }
        });
        
        // Resetar busca
        const searchInput = document.getElementById('eventosSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Recarregar
        if (window.anfaveaLoadEventos) {
            window.anfaveaLoadEventos(1, true);
        }
    }
};

/* ============================================================
   5. INICIALIZAÃÃO DOS EVENTOS
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estÃ¡ na pÃ¡gina correta
    const filterBar = document.getElementById('eventosFilterBar');
    if (!filterBar) {
        // NÃ£o estÃ¡ na pÃ¡gina de eventos, sai
        return;
    }

    // Seletor de filtros (categorias)
    const filterButtons = document.querySelectorAll('#eventosFilterBar .filter-btn');
    const searchInput = document.getElementById('eventosSearch');

    // Evento de clique nos botÃµes de filtro
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Remove active de todos
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Atualiza estado
            window.anfaveaEventosState.term = this.dataset.term || '';

            // Recarrega com filtro (resetando pÃ¡gina)
            if (window.anfaveaLoadEventos) {
                window.anfaveaLoadEventos(1, true);
            }
        });
    });

    // Evento de busca (com debounce)
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                window.anfaveaEventosState.search = this.value.trim();
                // Recarrega com busca (resetando pÃ¡gina)
                if (window.anfaveaLoadEventos) {
                    window.anfaveaLoadEventos(1, true);
                }
            }, 500); // 500ms de debounce
        });

        // Buscar ao pressionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                window.anfaveaEventosState.search = this.value.trim();
                if (window.anfaveaLoadEventos) {
                    window.anfaveaLoadEventos(1, true);
                }
            }
        });
    }

    // Inicializa a paginaÃ§Ã£o na primeira carga
    const pagination = document.getElementById('eventosPagination');
    if (pagination) {
        // Pega o total de pÃ¡ginas do atributo data ou do HTML
        const maxPages = parseInt(pagination.dataset.maxPages) || 1;
        const currentPage = parseInt(pagination.dataset.currentPage) || 1;
        if (maxPages > 1) {
            renderEventosPagination(currentPage, maxPages);
            toggleEventosMes(currentPage);
        }
    }
});

  /* ============================================================
     2. ESTADO GLOBAL IMPRENSA
     ============================================================ */
  window.anfaveaImprensaState = {
    term:   '',
    search: '',
    page:   1
  };

  /* ============================================================
     3. PAGINAÃÃO IMPRENSA
     ============================================================ */
    function renderPagination(current, total) {
        const pagination = document.getElementById('imprensaPagination');
        if (!pagination) return;

        if (total <= 1) {
            pagination.innerHTML = '';
            return;
        }

        const maxVisible = 5;
        let html = '';

        // BotÃ£o anterior
        html += `
            <button class="page-btn arrow ${current === 1 ? 'disabled' : ''}"
                ${current === 1 ? 'disabled' : ''}
                onclick="window.anfaveaImprensa.prevPage()">
                â¹
            </button>
        `;

        let start = Math.max(1, current - 2);
        let end = Math.min(total, start + maxVisible - 1);

        // Ajusta quando chegar ao final
        start = Math.max(1, end - maxVisible + 1);

        // Primeira pÃ¡gina
        if (start > 1) {
            html += `
                <button class="page-btn"
                    onclick="window.anfaveaImprensa.goPage(1)">
                    1
                </button>
            `;

            if (start > 2) {
                html += `<span class="page-dots">...</span>`;
            }
        }

        // PÃ¡ginas visÃ­veis
        for (let i = start; i <= end; i++) {
            html += `
                <button class="page-btn ${i === current ? 'active' : ''}"
                    onclick="window.anfaveaImprensa.goPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Ãltima pÃ¡gina
        if (end < total) {
            if (end < total - 1) {
                html += `<span class="page-dots">...</span>`;
            }

            html += `
                <button class="page-btn"
                    onclick="window.anfaveaImprensa.goPage(${total})">
                    ${total}
                </button>
            `;
        }

        // BotÃ£o prÃ³ximo
        html += `
            <button class="page-btn arrow ${current === total ? 'disabled' : ''}"
                ${current === total ? 'disabled' : ''}
                onclick="window.anfaveaImprensa.nextPage()">
                âº
            </button>
        `;

        pagination.innerHTML = html;
    }

  // ExpÃµe para uso externo (ex: script inline no PHP se necessÃ¡rio)
  window.renderPagination = renderPagination;

  window.anfaveaImprensa = {
    currentPage: 1,
    maxPages:    1,

    goPage(page) {
      this.currentPage = page;
      window.anfaveaImprensaState.page = page;
      if (window.anfaveaLoadImprensa) {
        window.anfaveaLoadImprensa(page, false);
      }
    },

    prevPage() {
      if (this.currentPage <= 1) return;
      this.goPage(this.currentPage - 1);
    },

    nextPage() {
      if (this.currentPage >= this.maxPages) return;
      this.goPage(this.currentPage + 1);
    }
  };

  /* ============================================================
     4. FILTER BAR (Imprensa & Eventos)
     ============================================================ */
  function initFilterBar(barId, listId, postType, taxonomy) {
    const bar = document.getElementById(barId);
    if (!bar) return;

    const searchInput = bar.querySelector('input[type="text"]');
    const list        = document.getElementById(listId);
    let isLoading     = false;

    function loadPosts(page, append) {
      page   = page   || 1;
      append = append || false;

      if (isLoading) return;
      isLoading = true;

      const body = new FormData();
      body.append('action',    'anfavea_load_more');
      body.append('nonce',     anfaveaData.nonce);
      body.append('post_type', postType);
      body.append('tax',       taxonomy);
      body.append('term',      window.anfaveaImprensaState.term);
      body.append('search',    window.anfaveaImprensaState.search);
      body.append('paged',     page);

      fetch(anfaveaData.ajaxurl, { method: 'POST', body: body })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.success) {
            if (append) {
              list.insertAdjacentHTML('beforeend', data.data.html);
            } else {
              list.innerHTML = data.data.html;
            }

            window.anfaveaImprensaState.page    = page;
            window.anfaveaImprensa.currentPage  = page;
            window.anfaveaImprensa.maxPages     = data.data.max_pages;

            renderPagination(data.data.current, data.data.max_pages);
          }
          isLoading = false;
        })
        .catch(function(err) {
          console.error('Erro AJAX:', err);
          isLoading = false;
        });
    }

    // Disponibiliza para a paginaÃ§Ã£o
    window.anfaveaLoadImprensa = loadPosts;

    /* Filtros */
    bar.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        bar.querySelectorAll('.filter-btn').forEach(function(b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        window.anfaveaImprensaState.term   = btn.dataset.term || '';
        window.anfaveaImprensaState.page   = 1;
        window.anfaveaImprensa.currentPage = 1;

        loadPosts(1, false);
      });
    });

    /* Busca */
    if (searchInput) {
      var debounce;
      searchInput.addEventListener('input', function() {
        clearTimeout(debounce);
        debounce = setTimeout(function() {
          window.anfaveaImprensaState.search = searchInput.value.trim();
          window.anfaveaImprensaState.page   = 1;
          loadPosts(1, false);
        }, 400);
      });
    }
  }

/* ============================================================
   5. STATS FILTER TABS (Home)
   ============================================================ */
function initStatsFilter() {
    const filter = document.getElementById('statsFilter');
    if (!filter) {
        console.warn('statsFilter nÃ£o encontrado');
        return;
    }

    if (typeof anfaveaData === 'undefined') {
        console.error('anfaveaData nÃ£o estÃ¡ definido');
        return;
    }

    // ð¥ Pega o ano do tÃ­tulo
    const statsYear = document.getElementById('statsYear');
    const anoAtual = statsYear ? parseInt(statsYear.textContent) : new Date().getFullYear();
    console.log('Ano atual:', anoAtual);

    // ð¥ Mapeamento dos indicadores para cada categoria
    const categoryIndicators = {
        'veiculos-leves': ['emplacamento', 'exportacao', 'producao'],
        'caminhoes': ['emplacamento', 'exportacao', 'producao'],
        'onibus': ['emplacamento', 'exportacao', 'producao'],
        'maquinas-agricolas': ['vendas_atacado', 'vendas_varejo', 'exportacoes'],
        'maquinas-rodoviarias': ['vendas_atacado', 'exportacoes']
    };

    // ð¥ Mapeamento dos rÃ³tulos dos indicadores
    const indicatorLabels = {
        'emplacamento': 'Emplacamento',
        'exportacao': 'ExportaÃ§Ã£o',
        'producao': 'ProduÃ§Ã£o',
        'vendas_atacado': 'Vendas no atacado',
        'vendas_varejo': 'Vendas no varejo',
        'exportacoes': 'ExportaÃ§Ãµes'
    };

    // ð¥ Mapeamento dos Ã­cones
    const indicatorIcons = {
        'emplacamento': 'bi bi-car-front-fill',
        'exportacao': 'bi bi-box-arrow-up',
        'producao': 'bi bi-gear-fill',
        'vendas_atacado': 'bi bi-truck',
        'vendas_varejo': 'bi bi-cart-fill',
        'exportacoes': 'bi bi-box-arrow-up'
    };

    function formatarNumero(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace('.', ',') + ' mi';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace('.', ',') + ' mil';
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function renderStats(categoria, data) {
        const statsCards = document.getElementById('statsCards');
        if (!statsCards) return;

        if (!data) {
            statsCards.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Carregando dados...</p></div>';
            return;
        }

        const indicadores = categoryIndicators[categoria] || [];
        
        // ð¥ [CORRIGIDO] Usa os valores dinÃ¢micos vindos do PHP
        // Se o PHP nÃ£o retornar, usa valores padrÃ£o como fallback
        const mesReferencia = data.mes_referencia || 'julho';
        const periodo = data.periodo || 'janeiro a julho';

        let html = '';

        indicadores.forEach(function(indicator) {
            const value = data[indicator] || 0;
            const label = indicatorLabels[indicator] || indicator;
            const icon = indicatorIcons[indicator] || 'bi bi-bar-chart-fill';

            html += `
                <div class="col-md-${indicadores.length === 2 ? '6' : '4'}">
                    <div class="stat-card">
                        <div class="stat-card-title">${label}</div>
                        <span class="stat-card-icon"><i class="${icon}"></i></span>
                        <div class="stat-card-value">${formatarNumero(value)}</div>
                    </div>
                </div>
            `;
        });

        // ð¥ Adiciona a informaÃ§Ã£o do mÃªs de referÃªncia (usando dados dinÃ¢micos do PHP)
        html += `
            <div class="col-12">
                <div class="stats-reference mt-2">
                    <strong>MÃªs de referÃªncia:</strong> ${mesReferencia}<br>
                    <strong>Dados acumulados:</strong> ${periodo}
                </div>
            </div>
        `;

        statsCards.innerHTML = html;
    }

    function fetchStats(categoria) {
        console.log('Buscando estatÃ­sticas para categoria:', categoria, 'ano:', anoAtual);
        
        const statsCards = document.getElementById('statsCards');
        if (statsCards) {
            statsCards.innerHTML = `
                <div class="col-12 text-center py-4">
                    <div class="loading-spinner"></div>
                    <p class="text-muted mt-2">Carregando estatÃ­sticas...</p>
                </div>
            `;
        }
        
        var formData = new FormData();
        formData.append('action', 'anfavea_get_home_stats');
        formData.append('nonce', anfaveaData.nonce);
        formData.append('ano', anoAtual);
        formData.append('categoria', categoria);
        
        fetch(anfaveaData.ajaxurl, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Dados de estatÃ­sticas:', data);
            
            if (data.success) {
                renderStats(categoria, data.data);
            } else {
                console.error('Erro ao buscar estatÃ­sticas:', data.data);
                if (statsCards) {
                    statsCards.innerHTML = `<div class="col-12 text-center"><p class="text-danger">${data.data || 'Erro ao carregar dados'}</p></div>`;
                }
            }
        })
        .catch(error => {
            console.error('Erro na requisiÃ§Ã£o:', error);
            if (statsCards) {
                statsCards.innerHTML = `<div class="col-12 text-center"><p class="text-danger">Erro de conexÃ£o.</p></div>`;
            }
        });
    }

    // Adiciona event listeners nos botÃµes
    filter.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            filter.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const categoria = this.dataset.cat;
            fetchStats(categoria);
        });
    });

    // Carrega os dados iniciais
    const first = filter.querySelector('.btn-filter.active');
    if (first) {
        setTimeout(function() {
            first.click();
        }, 200);
    } else {
        const anyBtn = filter.querySelector('.btn-filter');
        if (anyBtn) {
            setTimeout(function() {
                anyBtn.click();
            }, 200);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initStatsFilter();
});

  /* ============================================================
     8. NAVBAR â sticky style on scroll
     ============================================================ */
  function initNavbar() {
    const header = document.getElementById('site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10
        ? '0 4px 20px rgba(0,0,0,.12)'
        : 'none';
    }, { passive: true });
  }

  /* ============================================================
     10. TIMELINE period buttons scroll
     ============================================================ */
  window.anfaveaTimeline = {

      scrollTo(period) {

          const target = document.querySelector(
              `.timeline-entry[data-period="${period}"]`
          );

          if (target) {

              const header =
                  document.querySelector('.site-header');

              const headerHeight =
                  header ? header.offsetHeight : 0;

              const top =
                  target.getBoundingClientRect().top +
                  window.pageYOffset -
                  headerHeight -
                  20;

              window.scrollTo({
                  top,
                  behavior: 'smooth'
              });

          }

          document
              .querySelectorAll('.timeline-period-btn')
              .forEach(btn => {

                  btn.classList.toggle(
                      'active',
                      btn.dataset.period === period
                  );

              });

      }

  };

  document.addEventListener('DOMContentLoaded', () => {

      const observer = new IntersectionObserver(entries => {

          entries.forEach(entry => {

              if (!entry.isIntersecting) {
                  return;
              }

              const period =
                  entry.target.dataset.period;

              document
                  .querySelectorAll('.timeline-period-btn')
                  .forEach(btn => {

                      btn.classList.toggle(
                          'active',
                          btn.dataset.period === period
                      );

                  });

          });

      }, {
          threshold: 0.3
      });

      document
          .querySelectorAll('.timeline-entry')
          .forEach(el => observer.observe(el));

  });

window.anfaveaAnuario = {

    goToYear(anchorId) {

        if (!anchorId) return;

        const target =
            document.getElementById(anchorId);

        if (!target) return;

        const header =
            document.querySelector('.page-template-page-anuario-anfavea header.site-header');

        const headerHeight =
            header ? header.offsetHeight : 0;

        const offset = 20;

        const position =
            target.getBoundingClientRect().top
            +
            window.pageYOffset
            -
            headerHeight
            -
            offset;

        window.scrollTo({
            top: position,
            behavior: 'smooth'
        });

    }

};
	
// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    // Armazena os textos originais APENAS UMA VEZ
    function storeOriginalTexts() {
        // SÃ³ captura o "original" quando NÃO estiver traduzido, para nunca
        // guardar acidentalmente o texto em inglÃªs/espanhol como se fosse o original.
        var isTranslated = document.documentElement.classList.contains('translated-ltr') ||
                           document.documentElement.classList.contains('translated-rtl');

        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(el) {
            if (!el.hasAttribute('data-original-text') && !isTranslated) {
                // Pega o texto puro sem as tags font
                var text = el.textContent.trim();
                el.setAttribute('data-original-text', text);
                el.innerHTML = text;
            }
        });
    }

    // FunÃ§Ã£o para limpar pontos finais (apenas em traduÃ§Ãµes)
    // Ã idempotente: se nÃ£o houver tags <font> ou se o ponto jÃ¡ foi removido,
    // simplesmente nÃ£o faz nada. Pode ser chamada quantas vezes for preciso.
    function cleanTrailingDots() {
        // SÃ³ executa se estiver traduzido
        if (!document.documentElement.classList.contains('translated-ltr') &&
            !document.documentElement.classList.contains('translated-rtl')) {
            return;
        }

        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(el) {
            // Pega todos os textos dentro das tags font
            var fonts = el.querySelectorAll('font');
            var modified = false;

            fonts.forEach(function(font) {
                // Verifica se o texto termina com ponto
                var text = font.textContent;
                if (text.endsWith('.') && !text.endsWith('...')) {
                    // Remove o ponto final
                    var newText = text.slice(0, -1);
                    // Atualiza apenas o texto, mantendo a estrutura
                    if (font.firstChild && font.firstChild.nodeType === 3) {
                        font.firstChild.textContent = newText;
                        modified = true;
                    }
                }
            });

            // Se modificou, atualiza o innerHTML
            if (modified) {
                // ForÃ§a a atualizaÃ§Ã£o sem recriar os elementos
                var html = el.innerHTML;
                el.innerHTML = html;
            }
        });
    }

    // FunÃ§Ã£o para restaurar portuguÃªs
    function restorePortuguese() {
        // SÃ³ executa se NÃO estiver traduzido
        if (document.documentElement.classList.contains('translated-ltr') ||
            document.documentElement.classList.contains('translated-rtl')) {
            return;
        }

        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(el) {
            var original = el.getAttribute('data-original-text');
            if (original && el.textContent.trim() !== original) {
                el.innerHTML = original;
            }
        });
    }

    // FunÃ§Ã£o principal - executa apenas quando necessÃ¡rio
    function fixTitles() {
        var isTranslated = document.documentElement.classList.contains('translated-ltr') ||
                          document.documentElement.classList.contains('translated-rtl');

        if (isTranslated) {
            cleanTrailingDots();
        } else {
            restorePortuguese();
        }
    }

    // NOVO: tenta limpar os pontos repetidamente logo apÃ³s o carregamento.
    // Na primeira carga o GTranslate cria as tags <font> de forma assÃ­ncrona,
    // entÃ£o fazemos um poll rÃ¡pido que limpa assim que elas aparecerem
    // (e cobre tambÃ©m traduÃ§Ãµes aplicadas progressivamente).
    function cleanWhenReady(attemptsLeft) {
        var isTranslated = document.documentElement.classList.contains('translated-ltr') ||
                          document.documentElement.classList.contains('translated-rtl');

        if (!isTranslated || attemptsLeft <= 0) {
            return;
        }

        // Idempotente: sÃ³ age se jÃ¡ houver <font> com ponto final
        cleanTrailingDots();

        setTimeout(function() {
            cleanWhenReady(attemptsLeft - 1);
        }, 150);
    }

    // Armazena textos originais
    storeOriginalTexts();

    // Executa a correÃ§Ã£o inicial com delay
    setTimeout(fixTitles, 500);

    // NOVO: dispara o poll rÃ¡pido jÃ¡ na primeira carga (~4,5s de cobertura)
    cleanWhenReady(30);

    // Monitora mudanÃ§as na classe do HTML (GTranslate muda isso)
    var observer = new MutationObserver(function(mutations) {
        var hasClassChange = false;

        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                hasClassChange = true;
            }
        });

        if (hasClassChange) {
            // Aguarda o GTranslate terminar
            clearTimeout(window._fixTimeout);
            window._fixTimeout = setTimeout(function() {
                fixTitles();
                // ReforÃ§a a limpeza logo apÃ³s a troca de idioma
                cleanWhenReady(15);
            }, 200);
        }
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    // Executa a cada 300ms (rede de seguranÃ§a de longo prazo)
    setInterval(function() {
        var isTranslated = document.documentElement.classList.contains('translated-ltr') ||
                          document.documentElement.classList.contains('translated-rtl');

        // NOVO: garante que os pontos finais continuem removidos enquanto
        // estiver traduzido (antes o interval sÃ³ restaurava o portuguÃªs).
        if (isTranslated) {
            cleanTrailingDots();
        }

        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(el) {
            // Se estÃ¡ traduzido mas nÃ£o tem font tags, o GTranslate ainda nÃ£o processou
            if (isTranslated && !el.querySelector('font')) {
                return;
            }

            // Se estÃ¡ em portuguÃªs mas tem font tags, restaura
            if (!isTranslated && el.querySelector('font')) {
                var original = el.getAttribute('data-original-text');
                if (original) {
                    el.innerHTML = original;
                }
            }
        });
    }, 300);

    // Executa quando a pÃ¡gina carregar completamente
    window.addEventListener('load', function() {
        setTimeout(fixTitles, 500);
        // NOVO: mais uma rodada de poll apÃ³s o load completo
        cleanWhenReady(20);
    });
});

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initNavbar();

    initFilterBar('imprensaFilterBar', 'newsList',    'noticias', 'tipo_imprensa');
    initFilterBar('eventosFilterBar',  'eventosList', 'eventos',  'categoria_evento');
    initFilterBar('publicacoesFilterBar',  'eventosList', 'publicacoes',  'categoria_publicacoes');

    // PaginaÃ§Ã£o inicial â max_pages vem do PHP via wp_localize_script
    if (typeof anfaveaData !== 'undefined' && anfaveaData.imprensaMaxPages > 1) {
      renderPagination(1, parseInt(anfaveaData.imprensaMaxPages));
    }
  });

})();