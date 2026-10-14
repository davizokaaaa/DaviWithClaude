/* ============================================================
   VARIÃVEIS GLOBAIS
   ============================================================ */
let empresaDropdown = null;
let marcaDropdown = null;
let periodosCache = {};
let ultimoTipoDado = '';
let ultimoDashboard = '';
let ultimoDimensao = 'procedencia';

/* ============================================================
   CENTRAL DE DADOS â Gerar Tabela
   ============================================================ */
function initCentralDados() {
    const btnGerar = document.getElementById('btnGerarTabela');
    if (!btnGerar) return;

    let subsegmentosSelecionados = ['TOTAL'];
    let estaAtualizando = false;

    // Mapa dos grupos multiselect -> botÃ£o "exclusivo" (equivale a "todos")
    //   categoriaLevesGroup / categoriaPesadosGroup: exclusivo = total_leves / total_pesados
    //   Estes dois PODEM ficar vazios (o usuÃ¡rio desmarca tudo daquele segmento).
    const GRUPOS_MULTISELECT = {
        'subsegmentoCaminhaoGroup': 'TOTAL',
        'combustivelTodosGroup':    'todos',
        'combustivelLevesGroup':    'todos',
        'combustivelPesadosGroup':  'todos',
        'categoriaLevesGroup':      'total_leves',
        'categoriaPesadosGroup':    'total_pesados',
        'maquinaAgricolaGroup':     'TOTAL_AGRICOLAS',
        'maquinaRodoviariaGroup':   'TOTAL_RODOVIARIAS',
        // ProcedÃªncia multi-seleÃ§Ã£o: 'total' Ã© o exclusivo (como "todos").
        //   Nacionais + Importados juntos => 3 linhas (nac, imp e TOTAL) no resultado.
        'procedenciaGroup':         'total'
    };
    // Grupos que PODEM ficar vazios (sem filtro daquele segmento)
    const GRUPOS_CATEGORIA = [
        'categoriaLevesGroup', 'categoriaPesadosGroup',
        'maquinaAgricolaGroup', 'maquinaRodoviariaGroup'
    ];
    const GRUPOS_MAQUINA = ['maquinaAgricolaGroup', 'maquinaRodoviariaGroup'];

    function getActive(groupId) {
        const group = document.getElementById(groupId);
        if (!group) return '';

        if (GRUPOS_MULTISELECT.hasOwnProperty(groupId)) {
            const exclusivo = GRUPOS_MULTISELECT[groupId];
            const ativos = [...group.querySelectorAll('.toggle-btn.active')]
                .map(btn => btn.dataset.value);

            if (ativos.length === 0) {
                // grupos de categoria podem ficar vazios; os demais voltam ao exclusivo
                return GRUPOS_CATEGORIA.includes(groupId) ? [] : [exclusivo];
            }
            // Se o exclusivo estiver junto com outros, prevalece o exclusivo
            if (ativos.includes(exclusivo) && ativos.length > 1) {
                return [exclusivo];
            }
            return ativos;
        }

        const ativo = group.querySelector('.toggle-btn.active');
        return ativo ? ativo.dataset.value : '';
    }

    // Categorias selecionadas (tokens) dos dois grupos combinados
    function getCategoriasSelecionadas() {
        const leves   = getActive('categoriaLevesGroup');
        const pesados = getActive('categoriaPesadosGroup');
        return [].concat(
            Array.isArray(leves) ? leves : [],
            Array.isArray(pesados) ? pesados : []
        );
    }
    function temCategoriaLeve() {
        const c = getCategoriasSelecionadas();
        return c.some(v => v === 'total_leves' || v === 'automoveis' || v === 'comerciais_leves');
    }
    function temCategoriaPesada() {
        const c = getCategoriasSelecionadas();
        return c.some(v => v === 'total_pesados' || v === 'caminhoes' || v === 'onibus');
    }
    function caminhoesAtivo() {
        return getCategoriasSelecionadas().includes('caminhoes');
    }

    // Tokens de mÃ¡quina selecionados nos dois grupos combinados
    function getMaquinasSelecionadas() {
        const agr = getActive('maquinaAgricolaGroup');
        const rod = getActive('maquinaRodoviariaGroup');
        return [].concat(
            Array.isArray(agr) ? agr : [],
            Array.isArray(rod) ? rod : []
        );
    }

    function setActive(button) {
        const group = button.closest('.toggle-button-group, .toggle-button-group-multiselect');
        if (!group) return;
        
        if (group.id === 'dimensaoEmplacamentoGroup') {
            // Remove active de todos os botÃµes
            group.querySelectorAll('.toggle-btn').forEach(function(btn) {
                btn.classList.remove('active');
            });
            // Ativa o botÃ£o clicado
            button.classList.add('active');

            // ForÃ§a o recarregamento dos perÃ­odos com a nova dimensÃ£o
            var tipoDado = getActive('tipoDadoGroup');
            if (tipoDado) {
                // Limpa o cache para forÃ§ar nova busca
                var dimensao = button.dataset.value;
                var cacheKey = 'dashboard1_' + tipoDado + '_' + dimensao;
                delete periodosCache[cacheKey];

                // Recarrega os perÃ­odos
                carregarPeriodosDisponiveis(tipoDado, 'dashboard1');
            }

            atualizarInterface();
            return;
        }

        // MULTISELECT (generalizado via GRUPOS_MULTISELECT)
        if (GRUPOS_MULTISELECT.hasOwnProperty(group.id)) {
            const exclusivo = GRUPOS_MULTISELECT[group.id];
            const btnExcl = group.querySelector('[data-value="' + exclusivo + '"]');
            const ehCategoria = GRUPOS_CATEGORIA.includes(group.id);

            if (button.dataset.value === exclusivo) {
                const ativosAgora = group.querySelectorAll('.toggle-btn.active');
                const jaAtivoSozinho = button.classList.contains('active') && ativosAgora.length === 1;
                group.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
                // Em grupos de categoria, clicar no "Total X" jÃ¡ ativo ESVAZIA o grupo.
                // Ã permitido esvaziar AMBOS (sem filtro de segmento â sÃ³ procedÃªncia etc.).
                if (!(ehCategoria && jaAtivoSozinho)) {
                    button.classList.add('active');
                }
            } else {
                if (btnExcl) btnExcl.classList.remove('active');
                button.classList.toggle('active');
                if (!group.querySelector('.toggle-btn.active') && !ehCategoria && btnExcl) {
                    btnExcl.classList.add('active'); // combustÃ­vel/subseg voltam ao exclusivo
                }
            }

            atualizarInterface();
            return;
        }

        // DimensÃ£o de emplacamento deselecionÃ¡vel:
        // clicar na opÃ§Ã£o jÃ¡ ativa desliga os filtros adicionais (ProcedÃªncia/CombustÃ­vel).
        if (group.id === 'dimensaoEmplacamentoGroup' && button.classList.contains('active')) {
            button.classList.remove('active');
            atualizarInterface();
            return;
        }

        // SELEÃÃO ÃNICA - para os demais grupos
        group.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        atualizarInterface();
    }

    function toggleSection(id, show) {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = show ? '' : 'none';
    }
    
    function verificarDisponibilidadeAgregacao() {
        var dashboard = getActive('dashboardGroup');
        var tipoDado = getActive('tipoDadoGroup');
        var tipoDado2 = getActive('tipoDadoEmpregoGroup');
        var agregacaoGroup = document.getElementById('agregacaoGroup');
        if (!agregacaoGroup) return;

        // Para Dashboard 2 com Estoque ou Emprego, jÃ¡ estÃ¡ travado
        if (dashboard === 'dashboard2' && (tipoDado2 === 'estoque' || tipoDado2 === 'emprego')) {
            return;
        }

        // Para Dashboard 1 com Emplacamento
        if (dashboard === 'dashboard1' && tipoDado === 'emplacamento') {
            var temFiltroEmpresa = document.getElementById('empresaMarcaSection') && 
                                   document.getElementById('empresaMarcaSection').style.display !== 'none';

            if (temFiltroEmpresa) {
                // Verifica disponibilidade para empresa
                verificarAgregacaoEmpresa();
                return;
            }
        }

        // Para outros casos, verifica por perÃ­odo
        verificarAgregacaoPorPeriodo();
    }

    // Trava as agregaÃ§Ãµes que nÃ£o cabem no perÃ­odo selecionado.
    function verificarAgregacaoPorPeriodo() {
        var dashboard = getActive('dashboardGroup');
        var tipoDado = getActive('tipoDadoGroup');
        var tipoDado2 = getActive('tipoDadoEmpregoGroup');

        // Se for Dashboard 2 com Estoque/Emprego, nÃ£o faz nada (jÃ¡ travado)
        if (dashboard === 'dashboard2' && (tipoDado2 === 'estoque' || tipoDado2 === 'emprego')) {
            return;
        }

        // Pega as datas do perÃ­odo
        var inicioAno = document.getElementById('inicioAno');
        var inicioMes = document.getElementById('inicioMes');
        var fimAno = document.getElementById('fimAno');
        var fimMes = document.getElementById('fimMes');

        if (!inicioAno || !inicioMes || !fimAno || !fimMes) {
            liberarAgregacoes();
            return;
        }

        if (!inicioAno.value || !inicioMes.value || !fimAno.value || !fimMes.value) {
            liberarAgregacoes();
            return;
        }

        // Conta quantos meses tÃªm no perÃ­odo selecionado
        var inicioDate = new Date(inicioAno.value, parseInt(inicioMes.value) - 1, 1);
        var fimDate = new Date(fimAno.value, parseInt(fimMes.value) - 1, 1);

        var meses = (fimDate.getFullYear() - inicioDate.getFullYear()) * 12 + 
                    (fimDate.getMonth() - inicioDate.getMonth()) + 1;

        var agregacaoGroup = document.getElementById('agregacaoGroup');
        var botoes = agregacaoGroup.querySelectorAll('.toggle-btn');

        botoes.forEach(function(btn) {
            var valor = btn.dataset.value;
            var disponivel = true;

            switch (valor) {
                case 'mensal':
                    disponivel = meses >= 1;
                    break;
                case 'trimestral':
                    disponivel = meses >= 3;
                    break;
                case 'semestral':
                    disponivel = meses >= 6;
                    break;
                case 'anual':
                    disponivel = meses >= 12;
                    break;
            }

            btn.disabled = !disponivel;
            btn.style.opacity = disponivel ? '' : '0.45';
            btn.style.cursor = disponivel ? '' : 'not-allowed';
            btn.title = disponivel ? '' : 'Dados insuficientes para esta agregaÃ§Ã£o';

            if (!disponivel && btn.classList.contains('active')) {
                btn.classList.remove('active');
            }
        });

        // Se nenhum botÃ£o estÃ¡ ativo, ativa 'mensal'
        var temAtivo = document.querySelector('#agregacaoGroup .toggle-btn.active');
        if (!temAtivo) {
            var btnMensal = agregacaoGroup.querySelector('[data-value="mensal"]');
            if (btnMensal && !btnMensal.disabled) {
                btnMensal.classList.add('active');
            }
        }
    }

    function liberarAgregacoes() {
        const agregacaoGroup = document.getElementById('agregacaoGroup');
        if (!agregacaoGroup) return;
        const botoes = agregacaoGroup.querySelectorAll('.toggle-btn');
        botoes.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '';
            btn.style.cursor = '';
            btn.title = '';
        });
    }

function verificarAgregacaoEmpresa() {
    const procedencia = getActive('procedenciaGroup');
    const categorias = getCategoriasSelecionadas();
    const empresaSelect = document.getElementById('empresaSelect');
    const marcaSelect = document.getElementById('marcaSelect');

    const empresas = Array.from(empresaSelect.querySelectorAll('option:checked'))
        .filter(o => o.value !== 'todas' && o.value !== '')
        .map(o => o.value);
    const marcas = Array.from(marcaSelect.querySelectorAll('option:checked'))
        .filter(o => o.value !== 'todas' && o.value !== '')
        .map(o => o.value);

    const temFiltro = empresas.length > 0 || marcas.length > 0;

    // Pega as datas atuais para enviar ao backend
    const inicioAno = document.getElementById('inicioAno');
    const inicioMes = document.getElementById('inicioMes');
    const fimAno = document.getElementById('fimAno');
    const fimMes = document.getElementById('fimMes');
    
    let inicio = '';
    let fim = '';
    
    if (inicioAno && inicioMes && inicioAno.value && inicioMes.value) {
        inicio = inicioAno.value + '-' + inicioMes.value + '-01';
    }
    if (fimAno && fimMes && fimAno.value && fimMes.value) {
        fim = fimAno.value + '-' + fimMes.value + '-01';
    }

    const body = new FormData();
    body.append('action', 'anfavea_verificar_agregacao');
    body.append('nonce', anfaveaData.nonce);
    body.append('tipo_dado', 'emplacamento');
    body.append('dashboard', 'dashboard1');
    body.append('procedencia', procedencia || 'total');
    categorias.forEach(c => body.append('categorias[]', c));
    body.append('empresa', empresas.join(','));
    body.append('marca', marcas.join(','));
    body.append('tem_filtro', temFiltro ? '1' : '0');
    body.append('inicio', inicio);
    body.append('fim', fim);
    body.append('dimensao_emplacamento', getActive('dimensaoEmplacamentoGroup') || 'procedencia');

    fetch(anfaveaData.ajaxurl, {
        method: 'POST',
        body: body
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const agregacaoGroup = document.getElementById('agregacaoGroup');
            const botoes = agregacaoGroup.querySelectorAll('.toggle-btn');

            botoes.forEach(btn => {
                const valor = btn.dataset.value;
                const disponivel = data.data[valor] || false;
                
                btn.disabled = !disponivel;
                btn.style.opacity = disponivel ? '' : '0.45';
                btn.style.cursor = disponivel ? '' : 'not-allowed';
                btn.title = disponivel ? '' : 'Dados insuficientes para esta agregaÃ§Ã£o';
                
                // Se o botÃ£o estÃ¡ desabilitado e estÃ¡ ativo, desativa
                if (!disponivel && btn.classList.contains('active')) {
                    btn.classList.remove('active');
                }
            });

            // Se nenhum botÃ£o estÃ¡ ativo, ativa 'mensal'
            const temAtivo = document.querySelector('#agregacaoGroup .toggle-btn.active');
            if (!temAtivo) {
                const btnMensal = agregacaoGroup.querySelector('[data-value="mensal"]');
                if (btnMensal && !btnMensal.disabled) {
                    btnMensal.classList.add('active');
                }
            }
        }
    })
    .catch(error => {
        console.error('Erro ao verificar agregaÃ§Ãµes:', error);
        liberarAgregacoes();
    });
}

function criarDropdownCheckbox(dropdownId, optionsId, searchId, headerId, selectId, placeholder, onchangeCallback) {
    const container = document.getElementById(dropdownId);
    if (!container) {
        console.error('â Container nÃ£o encontrado:', dropdownId);
        return null;
    }
    
    const options = document.getElementById(optionsId);
    const search = document.getElementById(searchId);
    const header = document.getElementById(headerId);
    const select = document.getElementById(selectId);
    
    if (!options || !header || !select) {
        console.error('â Elementos do dropdown nÃ£o encontrados:', { optionsId, headerId, selectId });
        return null;
    }
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    const arrowSpan = header.querySelector('.dropdown-checkbox-arrow');
    const body = container.querySelector('.dropdown-checkbox-body');
    
    if (!body) {
        console.error('â Body do dropdown nÃ£o encontrado');
        return null;
    }
    
    let isOpen = false;
    let allOptions = [];
    let isUpdating = false;
    let selecoesAnteriores = ['todas'];
    
    // Abre/fecha o dropdown
    header.addEventListener('click', function(e) {
        e.stopPropagation();
        isOpen = !isOpen;
        body.style.display = isOpen ? 'block' : 'none';
        header.classList.toggle('active', isOpen);
        if (arrowSpan) {
            arrowSpan.classList.toggle('open', isOpen);
        }
        if (isOpen && search) {
            search.value = '';
            search.focus();
            filterOptions('');
        }
    });
    
    // Fecha ao clicar fora
    document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
            body.style.display = 'none';
            header.classList.remove('active');
            if (arrowSpan) {
                arrowSpan.classList.remove('open');
            }
            isOpen = false;
        }
    });
    
    // Filtro por busca
    if (search) {
        search.addEventListener('input', function() {
            filterOptions(this.value);
        });
    }
    
    function filterOptions(text) {
        const items = options.querySelectorAll('.dropdown-checkbox-item');
        const lowerText = text.toLowerCase().trim();
        items.forEach(item => {
            const label = item.querySelector('label');
            if (label) {
                const textMatch = label.textContent.toLowerCase().includes(lowerText);
                item.style.display = textMatch || !lowerText ? '' : 'none';
            }
        });
    }
    
    // Atualiza o texto do header
    function updateHeader() {
        if (!select) return;
        const checked = select.querySelectorAll('option:checked');
        const total = select.querySelectorAll('option').length;
        
        if (!selectedSpan) return;
        
        if (checked.length === 0 || checked.length === total) {
            selectedSpan.textContent = placeholder || 'Todos';
        } else {
            selectedSpan.classList.remove('placeholder');
            const names = Array.from(checked).map(o => o.textContent);
            if (names.length <= 2) {
                selectedSpan.textContent = names.join(', ');
            } else {
                selectedSpan.textContent = names.length + ' selecionados';
            }
        }
    }
    
    // Popula as opÃ§Ãµes (NÃO RESETA MAIS AS SELEÃÃES)
    function populateOptions(data, preserveSelection = true) {
        isUpdating = true;
        
        // Salva as seleÃ§Ãµes atuais ANTES de limpar
        const currentSelection = getSelectedValues();
        
        // Limpa opÃ§Ãµes atuais
        options.innerHTML = '';
        select.innerHTML = '';
        
        // Adiciona as opÃ§Ãµes
        Object.keys(data).forEach(key => {
            const value = data[key];
            
            // Adiciona ao select oculto
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            select.appendChild(option);
            
            // Adiciona ao dropdown visual
            const item = document.createElement('div');
            item.className = 'dropdown-checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = key;
            checkbox.id = 'cb_' + key.replace(/[^a-zA-Z0-9]/g, '_');
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = value;
            
            // Evento do checkbox
            checkbox.addEventListener('change', function() {
                if (isUpdating) return;
                
                const opt = select.querySelector('option[value="' + this.value + '"]');
                if (opt) {
                    opt.selected = this.checked;
                }
                
                // Se marcou uma empresa que nÃ£o Ã© "todas", desmarca "todas"
                if (this.value !== 'todas' && this.checked) {
                    const todasOpt = select.querySelector('option[value="todas"]');
                    if (todasOpt) {
                        todasOpt.selected = false;
                        const todasCb = options.querySelector('input[value="todas"]');
                        if (todasCb) todasCb.checked = false;
                    }
                }
                
                // Se desmarcou a Ãºltima empresa (nÃ£o "todas"), marca "todas"
                const checkedOptions = select.querySelectorAll('option:checked');
                const checkedNonTodas = Array.from(checkedOptions).filter(o => o.value !== 'todas');
                if (checkedNonTodas.length === 0) {
                    const todasOpt = select.querySelector('option[value="todas"]');
                    if (todasOpt) {
                        todasOpt.selected = true;
                        const todasCb = options.querySelector('input[value="todas"]');
                        if (todasCb) todasCb.checked = true;
                    }
                }
                
                updateHeader();
                
                // Chama o callback
                if (typeof onchangeCallback === 'function' && !isUpdating) {
                    const selectedValues = getSelectedValues();
                    // Remove 'todas' se houver outras seleÃ§Ãµes
                    let filtered = selectedValues;
                    if (selectedValues.length > 1) {
                        filtered = selectedValues.filter(v => v !== 'todas');
                    }
                    if (filtered.length > 0) {
                        onchangeCallback(filtered);
                    } else {
                        onchangeCallback(['todas']);
                    }
                }
            });
            
            item.appendChild(checkbox);
            item.appendChild(label);
            
            // Clique no item para marcar/desmarcar
            item.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    const cb = this.querySelector('input[type="checkbox"]');
                    if (cb) {
                        cb.checked = !cb.checked;
                        cb.dispatchEvent(new Event('change'));
                    }
                }
            });
            
            options.appendChild(item);
        });
        
        // Restaura seleÃ§Ãµes anteriores se preserveSelection for true
        if (preserveSelection && currentSelection.length > 0) {
            const selectionToRestore = currentSelection.filter(v => v !== 'todas');
            if (selectionToRestore.length > 0) {
                selectionToRestore.forEach(val => {
                    const opt = select.querySelector('option[value="' + val + '"]');
                    if (opt) opt.selected = true;
                    const cb = options.querySelector('input[value="' + val + '"]');
                    if (cb) cb.checked = true;
                });
                // Desmarca "todas" se houver outras seleÃ§Ãµes
                const todasOpt = select.querySelector('option[value="todas"]');
                if (todasOpt) {
                    todasOpt.selected = false;
                    const todasCb = options.querySelector('input[value="todas"]');
                    if (todasCb) todasCb.checked = false;
                }
            } else {
                // Se nÃ£o tinha seleÃ§Ãµes, marca "todas"
                const todasOpt = select.querySelector('option[value="todas"]');
                if (todasOpt) {
                    todasOpt.selected = true;
                    const todasCb = options.querySelector('input[value="todas"]');
                    if (todasCb) todasCb.checked = true;
                }
            }
        } else {
            // Se nÃ£o preservar, marca "todas" como padrÃ£o
            const todasOpt = select.querySelector('option[value="todas"]');
            if (todasOpt) {
                todasOpt.selected = true;
                const todasCb = options.querySelector('input[value="todas"]');
                if (todasCb) todasCb.checked = true;
            }
        }
        
        updateHeader();
        allOptions = data;
        isUpdating = false;
    }
    
    // Retorna os valores selecionados
    function getSelectedValues() {
        if (!select) return ['todas'];
        const selected = Array.from(select.querySelectorAll('option:checked')).map(o => o.value);
        return selected.length > 0 ? selected : ['todas'];
    }
    
    // Retorna os nomes selecionados
    function getSelectedNames() {
        if (!select) return ['Todas'];
        const selected = Array.from(select.querySelectorAll('option:checked')).map(o => o.textContent);
        return selected.length > 0 ? selected : ['Todas'];
    }
    
    // Sincroniza com o select oculto
    function syncFromSelect() {
        if (!select) return;
        const selectedValues = Array.from(select.querySelectorAll('option:checked')).map(o => o.value);
        
        options.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = selectedValues.includes(cb.value);
        });
        updateHeader();
    }
    
    return {
        populateOptions: populateOptions,
        getSelectedValues: getSelectedValues,
        getSelectedNames: getSelectedNames,
        syncFromSelect: syncFromSelect,
        updateHeader: updateHeader,
        getSelect: function() { return select; },
        isInitialized: function() { return true; }
    };
}
// FUNÃÃO PARA INICIALIZAR OS DROPDOWNS QUANDO A SEÃÃO FOR EXIBIDA
function inicializarDropdownsEmpresaMarca() {
    // Verifica se os elementos existem
    const container = document.getElementById('empresaDropdownContainer');
    if (!container) {
        console.warn('â ï¸ Container de empresa nÃ£o encontrado');
        return;
    }
    
    // SÃ³ inicializa se ainda nÃ£o foi inicializado
    if (!empresaDropdown) {
        // console.log('ð Inicializando dropdowns de empresa/marca');
        carregarSelectsEmpresaMarca();
    }
}

    // VARIÃVEIS GLOBAIS PARA OS DROPDOWNS
    let empresaDropdown = null;
    let marcaDropdown = null;

// FUNÃÃO PARA CARREGAR EMPRESAS E MARCAS
function carregarSelectsEmpresaMarca() {
    const procedencia = getActive('procedenciaGroup');
    const tipoDado = getActive('tipoDadoGroup');

    // console.log('ð Carregando empresas/marcas...');

    if (tipoDado !== 'emplacamento') {
        // console.log('â ï¸ NÃ£o Ã© emplacamento, ignorando');
        return;
    }

    // Categorias multi-selecionadas (tokens) para filtrar empresas/marcas
    const categorias = getCategoriasSelecionadas();

    // ObtÃ©m as empresas selecionadas atualmente
    const empresaSelect = document.getElementById('empresaSelect');
    const empresasSelecionadas = Array.from(empresaSelect.querySelectorAll('option:checked')).map(o => o.value);

    // Se tiver empresas selecionadas (exceto "todas"), filtra as marcas
    let empresaParam = 'todas';
    const empresasFiltradas = empresasSelecionadas.filter(v => v !== 'todas');
    if (empresasFiltradas.length > 0) {
        empresaParam = empresasFiltradas.join(',');
    }

    // console.log('ð¤ Enviando dados:', {
    //    categorias: categorias,
    //   procedencia: procedencia || 'total',
    //    empresa: empresaParam
    // });

    const body = new FormData();
    body.append('action', 'carregar_filtros_empresa_marca');
    body.append('nonce', anfaveaData.nonce);
    categorias.forEach(c => body.append('categorias[]', c));
    body.append('procedencia', procedencia || 'total');
    body.append('empresa', empresaParam);

    fetch(anfaveaData.ajaxurl, { 
        method: 'POST', 
        body: body 
    })
    .then(response => response.json())
    .then(data => {
        // console.log('ð Resposta empresas/marcas:', data);
        
        if (data.success) {
            const empSelect = document.getElementById('empresaSelect');
            const marSelect = document.getElementById('marcaSelect');
            const empOptions = document.getElementById('empresaOptions');
            const marOptions = document.getElementById('marcaOptions');
            const empContainer = document.getElementById('empresaDropdownContainer');
            const marContainer = document.getElementById('marcaDropdownContainer');
            
            if (!empSelect || !marSelect || !empOptions || !marOptions) {
                console.error('â Elementos nÃ£o encontrados');
                return;
            }
            
            // SALVA AS SELEÃÃES ATUAIS ANTES DE RECARREGAR
            const empresasSelecionadasAtuais = Array.from(empSelect.querySelectorAll('option:checked')).map(o => o.value);
            const marcasSelecionadasAtuais = Array.from(marSelect.querySelectorAll('option:checked')).map(o => o.value);
            
            // console.log('ð Empresas selecionadas antes:', empresasSelecionadasAtuais);
            
            // POPULA EMPRESAS
            const empresas = data.data.empresas;
            empSelect.innerHTML = '';
            empOptions.innerHTML = '';
            
            Object.keys(empresas).forEach(key => {
                const value = empresas[key];
                
                // Adiciona ao select oculto
                const option = document.createElement('option');
                option.value = key;
                option.textContent = value;
                if (empresasSelecionadasAtuais.includes(key)) {
                    option.selected = true;
                }
                empSelect.appendChild(option);
                
                // Adiciona ao dropdown visual
                const item = document.createElement('div');
                item.className = 'dropdown-checkbox-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = key;
                checkbox.id = 'empresa_cb_' + key.replace(/[^a-zA-Z0-9]/g, '_');
                if (empresasSelecionadasAtuais.includes(key)) {
                    checkbox.checked = true;
                }
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = value;
                
                // Evento do checkbox - recarrega marcas quando empresa mudar
                checkbox.addEventListener('change', function() {
                    const opt = empSelect.querySelector('option[value="' + this.value + '"]');
                    if (opt) {
                        opt.selected = this.checked;
                    }

                    // "Todas as empresas" Ã© exclusivo com seleÃ§Ãµes individuais
                    if (this.value === 'todas' && this.checked) {
                        empOptions.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            if (cb.value !== 'todas') {
                                cb.checked = false;
                                const o = empSelect.querySelector('option[value="' + cb.value + '"]');
                                if (o) o.selected = false;
                            }
                        });
                    } else if (this.value !== 'todas' && this.checked) {
                        const todasCb = empOptions.querySelector('input[value="todas"]');
                        if (todasCb) todasCb.checked = false;
                        const todasOpt = empSelect.querySelector('option[value="todas"]');
                        if (todasOpt) todasOpt.selected = false;
                    }

                    atualizarHeaderEmpresa();
                    
                    // RECARREGA MARCAS quando empresa for selecionada/deselecionada
                    // Pequeno delay para evitar mÃºltiplas chamadas
                    clearTimeout(window._marcaTimeout);
                    window._marcaTimeout = setTimeout(function() {
                        carregarSelectsEmpresaMarca();
                        // perÃ­odos dependem do modo empresa (Empresa2)
                        carregarPeriodosDisponiveis('emplacamento', 'dashboard1');
                    }, 100);
                });
                
                item.appendChild(checkbox);
                item.appendChild(label);
                
                item.addEventListener('click', function(e) {
                    if (e.target.tagName !== 'INPUT') {
                        const cb = this.querySelector('input[type="checkbox"]');
                        if (cb) {
                            cb.checked = !cb.checked;
                            cb.dispatchEvent(new Event('change'));
                        }
                    }
                });
                
                empOptions.appendChild(item);
            });
            
            // POPULA MARCAS
            const marcas = data.data.marcas;
            marSelect.innerHTML = '';
            marOptions.innerHTML = '';
            
            Object.keys(marcas).forEach(key => {
                const value = marcas[key];
                
                const option = document.createElement('option');
                option.value = key;
                option.textContent = value;
                if (marcasSelecionadasAtuais.includes(key)) {
                    option.selected = true;
                }
                marSelect.appendChild(option);
                
                const item = document.createElement('div');
                item.className = 'dropdown-checkbox-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = key;
                checkbox.id = 'marca_cb_' + key.replace(/[^a-zA-Z0-9]/g, '_');
                if (marcasSelecionadasAtuais.includes(key)) {
                    checkbox.checked = true;
                }
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = value;
                
                checkbox.addEventListener('change', function() {
                    const opt = marSelect.querySelector('option[value="' + this.value + '"]');
                    if (opt) {
                        opt.selected = this.checked;
                    }

                    // "Todas as marcas" Ã© exclusivo com seleÃ§Ãµes individuais
                    if (this.value === 'todas' && this.checked) {
                        marOptions.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            if (cb.value !== 'todas') {
                                cb.checked = false;
                                const o = marSelect.querySelector('option[value="' + cb.value + '"]');
                                if (o) o.selected = false;
                            }
                        });
                    } else if (this.value !== 'todas' && this.checked) {
                        const todasCb = marOptions.querySelector('input[value="todas"]');
                        if (todasCb) todasCb.checked = false;
                        const todasOpt = marSelect.querySelector('option[value="todas"]');
                        if (todasOpt) todasOpt.selected = false;
                    }

                    atualizarHeaderMarca();
                    // perÃ­odos dependem do modo marca (Empresa2)
                    clearTimeout(window._periodoMarcaTimeout);
                    window._periodoMarcaTimeout = setTimeout(function() {
                        carregarPeriodosDisponiveis('emplacamento', 'dashboard1');
                    }, 100);
                });
                
                item.appendChild(checkbox);
                item.appendChild(label);
                
                item.addEventListener('click', function(e) {
                    if (e.target.tagName !== 'INPUT') {
                        const cb = this.querySelector('input[type="checkbox"]');
                        if (cb) {
                            cb.checked = !cb.checked;
                            cb.dispatchEvent(new Event('change'));
                        }
                    }
                });
                
                marOptions.appendChild(item);
            });
            
            // ATUALIZA HEADERS
            atualizarHeaderEmpresa();
            atualizarHeaderMarca();
            
            // CONFIGURA BUSCA
            configurarBusca('empresaSearch', 'empresaOptions');
            configurarBusca('marcaSearch', 'marcaOptions');
            
            // CONFIGURA TOGGLE DOS DROPDOWNS
            configurarDropdownToggle(empContainer);
            configurarDropdownToggle(marContainer);

            // Fecha os dropdowns de empresa/marca ao clicar FORA.
            // Registrado uma Ãºnica vez; usa lookup por id, entÃ£o sobrevive aos rebuilds.
            if (!window._dropdownOutsideBound) {
                window._dropdownOutsideBound = true;
                document.addEventListener('click', function(e) {
                    ['empresaDropdownContainer', 'marcaDropdownContainer'].forEach(id => {
                        const c = document.getElementById(id);
                        if (c && !c.contains(e.target)) {
                            const b = c.querySelector('.dropdown-checkbox-body');
                            const h = c.querySelector('.dropdown-checkbox-header');
                            const a = c.querySelector('.dropdown-checkbox-arrow');
                            if (b) b.style.display = 'none';
                            if (h) h.classList.remove('active');
                            if (a) a.classList.remove('open');
                        }
                    });
                });
            }
            
        } else {
            console.error('â Erro ao carregar empresas/marcas:', data.data);
        }
    })
    .catch(error => {
        console.error('â Erro na requisiÃ§Ã£o:', error);
    });
}

// FUNÃÃO PARA CONFIGURAR O TOGGLE DO DROPDOWN
function configurarDropdownToggle(container) {
    if (!container) return;
    
    const header = container.querySelector('.dropdown-checkbox-header');
    const body = container.querySelector('.dropdown-checkbox-body');
    const arrow = container.querySelector('.dropdown-checkbox-arrow');
    
    if (!header || !body) return;
    
    // Remove event listeners antigos
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);
    
    newHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = body.style.display === 'block';
        body.style.display = isOpen ? 'none' : 'block';
        this.classList.toggle('active', !isOpen);
        if (arrow) {
            arrow.classList.toggle('open', !isOpen);
        }
    });
}

// FUNÃÃO PARA CONFIGURAR BUSCA
function configurarBusca(searchId, optionsId) {
    const search = document.getElementById(searchId);
    const options = document.getElementById(optionsId);
    if (!search || !options) return;
    
    const newSearch = search.cloneNode(true);
    search.parentNode.replaceChild(newSearch, search);
    
    newSearch.addEventListener('input', function() {
        const filter = this.value.toLowerCase().trim();
        const items = options.querySelectorAll('.dropdown-checkbox-item');
        items.forEach(item => {
            const label = item.querySelector('label');
            if (label) {
                const text = label.textContent.toLowerCase();
                item.style.display = text.includes(filter) || filter === '' ? '' : 'none';
            }
        });
    });
}

// FUNÃÃO PARA ATUALIZAR O HEADER DA EMPRESA
function atualizarHeaderEmpresa() {
    const select = document.getElementById('empresaSelect');
    const header = document.getElementById('empresaDropdownHeader');
    if (!select || !header) return;
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    if (!selectedSpan) return;
    
    const checked = select.querySelectorAll('option:checked');
    const total = select.querySelectorAll('option').length;
    
    if (checked.length === 0 || checked.length === total) {
        selectedSpan.textContent = 'Todas as empresas';
    } else {
        selectedSpan.classList.remove('placeholder');
        const names = Array.from(checked).map(o => o.textContent);
        if (names.length <= 2) {
            selectedSpan.textContent = names.join(', ');
        } else {
            selectedSpan.textContent = names.length + ' selecionados';
        }
    }
}

// FUNÃÃO PARA ATUALIZAR O HEADER DA MARCA
function atualizarHeaderMarca() {
    const select = document.getElementById('marcaSelect');
    const header = document.getElementById('marcaDropdownHeader');
    if (!select || !header) return;
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    if (!selectedSpan) return;
    
    const checked = select.querySelectorAll('option:checked');
    const total = select.querySelectorAll('option').length;
    
    if (checked.length === 0 || checked.length === total) {
        selectedSpan.textContent = 'Todas as marcas';
    } else {
        selectedSpan.classList.remove('placeholder');
        const names = Array.from(checked).map(o => o.textContent);
        if (names.length <= 2) {
            selectedSpan.textContent = names.join(', ');
        } else {
            selectedSpan.textContent = names.length + ' selecionados';
        }
    }
}

// FUNÃÃO PARA ATUALIZAR MARCAS QUANDO EMPRESA MUDA (SEM RECARREGAR TUDO)
function atualizarMarcasPorEmpresa() {
    const empresaSelect = document.getElementById('empresaSelect');
    if (!empresaSelect) return;
    
    const empresasSelecionadas = Array.from(empresaSelect.querySelectorAll('option:checked')).map(o => o.value);
    
    // Se nÃ£o tiver empresa selecionada ou for "todas", nÃ£o faz nada
    if (empresasSelecionadas.length === 0 || empresasSelecionadas.includes('todas')) {
        return;
    }
    
    // Recarrega apenas as marcas
    carregarSelectsEmpresaMarca();
}

// FUNÃÃO PARA CONFIGURAR O TOGGLE DO DROPDOWN
function configurarDropdownToggle(container) {
    if (!container) return;
    
    const header = container.querySelector('.dropdown-checkbox-header');
    const body = container.querySelector('.dropdown-checkbox-body');
    const arrow = container.querySelector('.dropdown-checkbox-arrow');
    
    if (!header || !body) return;
    
    // Remove event listeners antigos (clonando e substituindo)
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);
    
    newHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = body.style.display === 'block';
        body.style.display = isOpen ? 'none' : 'block';
        this.classList.toggle('active', !isOpen);
        if (arrow) {
            arrow.classList.toggle('open', !isOpen);
        }
    });
}

// FUNÃÃO PARA CONFIGURAR BUSCA
function configurarBusca(searchId, optionsId) {
    const search = document.getElementById(searchId);
    const options = document.getElementById(optionsId);
    if (!search || !options) return;
    
    // Remove event listener antigo
    const newSearch = search.cloneNode(true);
    search.parentNode.replaceChild(newSearch, search);
    
    newSearch.addEventListener('input', function() {
        const filter = this.value.toLowerCase().trim();
        const items = options.querySelectorAll('.dropdown-checkbox-item');
        items.forEach(item => {
            const label = item.querySelector('label');
            if (label) {
                const text = label.textContent.toLowerCase();
                item.style.display = text.includes(filter) || filter === '' ? '' : 'none';
            }
        });
    });
}

// FUNÃÃO PARA ATUALIZAR O HEADER DA EMPRESA
function atualizarHeaderEmpresa() {
    const select = document.getElementById('empresaSelect');
    const header = document.getElementById('empresaDropdownHeader');
    if (!select || !header) return;
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    if (!selectedSpan) return;
    
    const checked = select.querySelectorAll('option:checked');
    const total = select.querySelectorAll('option').length;
    
    if (checked.length === 0 || checked.length === total) {
        selectedSpan.textContent = 'Todas as empresas';
    } else {
        selectedSpan.classList.remove('placeholder');
        const names = Array.from(checked).map(o => o.textContent);
        if (names.length <= 2) {
            selectedSpan.textContent = names.join(', ');
        } else {
            selectedSpan.textContent = names.length + ' selecionados';
        }
    }
}

// FUNÃÃO PARA ATUALIZAR O HEADER DA MARCA
function atualizarHeaderMarca() {
    const select = document.getElementById('marcaSelect');
    const header = document.getElementById('marcaDropdownHeader');
    if (!select || !header) return;
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    if (!selectedSpan) return;
    
    const checked = select.querySelectorAll('option:checked');
    const total = select.querySelectorAll('option').length;
    
    if (checked.length === 0 || checked.length === total) {
        selectedSpan.textContent = 'Todas as marcas';
    } else {
        selectedSpan.classList.remove('placeholder');
        const names = Array.from(checked).map(o => o.textContent);
        if (names.length <= 2) {
            selectedSpan.textContent = names.join(', ');
        } else {
            selectedSpan.textContent = names.length + ' selecionados';
        }
    }
}

// FUNÃÃO PARA ATUALIZAR O HEADER DA EMPRESA
function atualizarHeaderEmpresa() {
    const select = document.getElementById('empresaSelect');
    const header = document.getElementById('empresaDropdownHeader');
    if (!select || !header) return;
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    if (!selectedSpan) return;
    
    const checked = select.querySelectorAll('option:checked');
    const total = select.querySelectorAll('option').length;
    
    if (checked.length === 0 || checked.length === total) {
        selectedSpan.textContent = 'Todas as empresas';
    } else {
        selectedSpan.classList.remove('placeholder');
        const names = Array.from(checked).map(o => o.textContent);
        if (names.length <= 2) {
            selectedSpan.textContent = names.join(', ');
        } else {
            selectedSpan.textContent = names.length + ' selecionados';
        }
    }
}

// FUNÃÃO PARA ATUALIZAR O HEADER DA MARCA
function atualizarHeaderMarca() {
    const select = document.getElementById('marcaSelect');
    const header = document.getElementById('marcaDropdownHeader');
    if (!select || !header) return;
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    if (!selectedSpan) return;
    
    const checked = select.querySelectorAll('option:checked');
    const total = select.querySelectorAll('option').length;
    
    if (checked.length === 0 || checked.length === total) {
        selectedSpan.textContent = 'Todas as marcas';
    } else {
        selectedSpan.classList.remove('placeholder');
        const names = Array.from(checked).map(o => o.textContent);
        if (names.length <= 2) {
            selectedSpan.textContent = names.join(', ');
        } else {
            selectedSpan.textContent = names.length + ' selecionados';
        }
    }
}

// FUNÃÃO PARA CONFIGURAR BUSCA
function configurarBusca(searchId, optionsId) {
    const search = document.getElementById(searchId);
    const options = document.getElementById(optionsId);
    if (!search || !options) return;
    
    search.addEventListener('input', function() {
        const filter = this.value.toLowerCase().trim();
        const items = options.querySelectorAll('.dropdown-checkbox-item');
        items.forEach(item => {
            const label = item.querySelector('label');
            if (label) {
                const text = label.textContent.toLowerCase();
                item.style.display = text.includes(filter) || filter === '' ? '' : 'none';
            }
        });
    });
}

// FUNÃÃO PARA ABRIR/FECHAR DROPDOWNS (adicionar apÃ³s carregar os elementos)
document.addEventListener('DOMContentLoaded', function() {
    // Configura toggle dos dropdowns
    document.querySelectorAll('.dropdown-checkbox-header').forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            const body = this.parentElement.querySelector('.dropdown-checkbox-body');
            const arrow = this.querySelector('.dropdown-checkbox-arrow');
            if (body) {
                const isOpen = body.style.display === 'block';
                body.style.display = isOpen ? 'none' : 'block';
                if (arrow) {
                    arrow.classList.toggle('open', !isOpen);
                }
                this.classList.toggle('active', !isOpen);
            }
        });
    });
    
    // Fecha dropdowns ao clicar fora
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.dropdown-checkbox-container').forEach(container => {
            if (!container.contains(e.target)) {
                const body = container.querySelector('.dropdown-checkbox-body');
                const header = container.querySelector('.dropdown-checkbox-header');
                const arrow = container.querySelector('.dropdown-checkbox-arrow');
                if (body) {
                    body.style.display = 'none';
                    if (header) header.classList.remove('active');
                    if (arrow) arrow.classList.remove('open');
                }
            }
        });
    });
});

// FUNÃÃO PARA ATUALIZAR O HEADER DA EMPRESA
function atualizarHeaderEmpresa() {
    const select = document.getElementById('empresaSelect');
    const header = document.getElementById('empresaDropdownHeader');
    if (!select || !header) return;
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    if (!selectedSpan) return;
    
    const checked = select.querySelectorAll('option:checked');
    const total = select.querySelectorAll('option').length;
    
    if (checked.length === 0 || checked.length === total) {
        selectedSpan.textContent = 'Todas as empresas';
    } else {
        selectedSpan.classList.remove('placeholder');
        const names = Array.from(checked).map(o => o.textContent);
        if (names.length <= 2) {
            selectedSpan.textContent = names.join(', ');
        } else {
            selectedSpan.textContent = names.length + ' selecionados';
        }
    }
}

// FUNÃÃO PARA ATUALIZAR O HEADER DA MARCA
function atualizarHeaderMarca() {
    const select = document.getElementById('marcaSelect');
    const header = document.getElementById('marcaDropdownHeader');
    if (!select || !header) return;
    
    const selectedSpan = header.querySelector('.dropdown-checkbox-selected');
    if (!selectedSpan) return;
    
    const checked = select.querySelectorAll('option:checked');
    const total = select.querySelectorAll('option').length;
    
    if (checked.length === 0 || checked.length === total) {
        selectedSpan.textContent = 'Todas as marcas';
    } else {
        selectedSpan.classList.remove('placeholder');
        const names = Array.from(checked).map(o => o.textContent);
        if (names.length <= 2) {
            selectedSpan.textContent = names.join(', ');
        } else {
            selectedSpan.textContent = names.length + ' selecionados';
        }
    }
}

// FUNÃÃO PARA CONFIGURAR BUSCA
function configurarBusca(searchId, optionsId) {
    const search = document.getElementById(searchId);
    const options = document.getElementById(optionsId);
    if (!search || !options) return;
    
    search.addEventListener('input', function() {
        const filter = this.value.toLowerCase().trim();
        const items = options.querySelectorAll('.dropdown-checkbox-item');
        items.forEach(item => {
            const label = item.querySelector('label');
            if (label) {
                const text = label.textContent.toLowerCase();
                item.style.display = text.includes(filter) || filter === '' ? '' : 'none';
            }
        });
    });
}

// FUNÃÃO PARA ABRIR/FECHAR DROPDOWNS (adicionar apÃ³s carregar os elementos)
document.addEventListener('DOMContentLoaded', function() {
    // Configura toggle dos dropdowns
    document.querySelectorAll('.dropdown-checkbox-header').forEach(header => {
        header.addEventListener('click', function(e) {
            e.stopPropagation();
            const body = this.parentElement.querySelector('.dropdown-checkbox-body');
            const arrow = this.querySelector('.dropdown-checkbox-arrow');
            if (body) {
                const isOpen = body.style.display === 'block';
                body.style.display = isOpen ? 'none' : 'block';
                if (arrow) {
                    arrow.classList.toggle('open', !isOpen);
                }
                this.classList.toggle('active', !isOpen);
            }
        });
    });
    
    // Fecha dropdowns ao clicar fora
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.dropdown-checkbox-container').forEach(container => {
            if (!container.contains(e.target)) {
                const body = container.querySelector('.dropdown-checkbox-body');
                const header = container.querySelector('.dropdown-checkbox-header');
                const arrow = container.querySelector('.dropdown-checkbox-arrow');
                if (body) {
                    body.style.display = 'none';
                    if (header) header.classList.remove('active');
                    if (arrow) arrow.classList.remove('open');
                }
            }
        });
    });
});

    // ââ EXPORT HELPERS ââââââââââââââââââââââââââââââââââââââââ
    function loadScript(src, cb) {
        if (document.querySelector('script[src="' + src + '"]')) { cb(); return; }
        var s = document.createElement('script');
        s.src = src;
        s.onload = cb;
        document.head.appendChild(s);
    }

    function tableToFileName(ext) {
        return 'anfavea_' + (new Date().toISOString().slice(0,10)) + '.' + ext;
    }

function extractTableData(table) {
    var result = { 
        headers: [], 
        rows: [], 
        headerRows: [],
        isCombustivel: false,
        hasMultiHeader: false,
        months: []
    };

    var thead = table.querySelector('thead');
    if (thead) {
        var headerRows = thead.querySelectorAll('tr');
        
        // Guarda TODAS as linhas do cabeÃ§alho
        headerRows.forEach(function(tr) {
            var rowData = [];
            tr.querySelectorAll('th').forEach(function(th) {
                var colspan = parseInt(th.getAttribute('colspan')) || 1;
                var text = th.textContent.trim();
                for (var i = 0; i < colspan; i++) {
                    rowData.push(text);
                }
            });
            if (rowData.length > 0) {
                result.headerRows.push(rowData);
            }
        });
        
        // Detecta se tem mÃºltiplas linhas de cabeÃ§alho
        result.hasMultiHeader = result.headerRows.length > 1;

        // Se tem 2 linhas, a primeira contÃ©m os meses e a segunda os tipos
        if (result.headerRows.length >= 2) {
            var firstRow = result.headerRows[0];
            var secondRow = result.headerRows[1];
            
            // Extrai os meses da primeira linha (pulando a primeira coluna "PROCEDÃNCIA")
            var months = [];

            for (var i = 1; i < firstRow.length; i++) {

                var text = (firstRow[i] || '').trim();

                if (!text) continue;
                if (text.toUpperCase() === 'TOTAL') continue;

                if (months.indexOf(text) === -1) {
                    months.push(text);
                }
            }
            result.months = months;
            
            // Monta os headers: PROCEDÃNCIA + (mÃªs + tipo) para cada mÃªs
            // Pula a primeira coluna (PROCEDÃNCIA) da segunda linha
            var types = [];

            for (var i = 1; i < secondRow.length; i++) {

                var type = (secondRow[i] || '').trim();

                if (!type) continue;

                if (types.indexOf(type) === -1) {
                    types.push(type);
                }

            }
            
            // Se nÃ£o tem types, usa "Estoque" e "Dias" como padrÃ£o
            if (types.length === 0) {
                types = ['Estoque', 'Dias'];
            }
            
            // Combina meses com tipos
            var combinedHeaders = ['PROCEDÃNCIA'];
            for (var m = 0; m < months.length; m++) {
                var month = months[m] || '';
                for (var t = 0; t < types.length; t++) {
                    var type = types[t] || '';
                    if (type !== '') {
                        combinedHeaders.push(month + ' (' + type + ')');
                    }
                }
            }
            
            // Adiciona TOTAL se existir
            var hasTotal = firstRow.some(function(h) {
                return h.toUpperCase() === 'TOTAL';
            });
            if (hasTotal) {
                combinedHeaders.push('TOTAL');
            }
            
            result.headers = combinedHeaders;
        } else if (result.headerRows.length > 0) {
            // Fallback: usa a Ãºltima linha
            result.headers = result.headerRows[result.headerRows.length - 1];
        }
    }

    // Extrai dados do corpo
    var tbody = table.querySelector('tbody');
    if (tbody) {
        var rows = tbody.querySelectorAll('tr');
        
        rows.forEach(function(tr) {
            var rowData = [];
            var cells = tr.querySelectorAll('td');
            
            cells.forEach(function(cell) {
                var text = cell.textContent.trim();
                rowData.push(text);
            });
            
            // Pula linhas vazias
            if (rowData.length > 0 && rowData.some(function(c) { return c !== ''; })) {
                result.rows.push(rowData);
            }
        });
    }

    return result;
}
    
function verticalizeTableData(tableData) {
    if (!tableData.rows || tableData.rows.length === 0) {
        return { headers: [], rows: [] };
    }

    var headers = tableData.headers || [];
    var rows = tableData.rows;

    // ================================================================
    // A tabela jÃ¡ vem no formato vertical (perÃ­odo em linha, entidade em
    // coluna) diretamente do PHP. Detecta isso pela primeira cÃ©lula da
    // primeira linha do corpo ser um perÃ­odo (ex: "2026 - JAN") e, nesse
    // caso, usa os dados como estÃ£o â sem tentar "derreter" de novo.
    // ================================================================
    var primeiraCelula = (rows[0][0] || '').trim().toUpperCase();
    if (/^\d{4}(\s*-\s*.+)?$/.test(primeiraCelula)) {
        var headersOut = headers.slice();
        if (headersOut.length > 0) headersOut[0] = 'PerÃ­odo';
        var rowsOut = rows.map(function (row) {
            return row.map(function (cell, idx) {
                if (idx === 0) return cell;
                var num = parseNumeroBR(cell);
                return num !== null ? num : cell;
            });
        });
        return { headers: headersOut, rows: rowsOut };
    }

    // ================================================================
    // DETECTA SE Ã TABELA DE COMBUSTÃVEL
    // ================================================================
    var isCombustivel = false;
    if (headers.length >= 2) {
        var firstHeader = headers[0] || '';
        var secondHeader = headers[1] || '';
        if ((firstHeader.toUpperCase() === 'CATEGORIA' || firstHeader.toUpperCase() === 'PROCEDÃNCIA') && 
            secondHeader.toUpperCase() === 'COMBUSTÃVEL') {
            isCombustivel = true;
        }
    }

    // ================================================================
    // DETECTA SE Ã TABELA DE ESTOQUE
    // ================================================================
    var isEstoque = false;
    var temEstoque = false;
    var temDias = false;
    
    for (var i = 0; i < headers.length; i++) {
        var h = headers[i] || '';
        if (h.indexOf('Estoque') !== -1) temEstoque = true;
        if (h.indexOf('Dias') !== -1) temDias = true;
    }
    isEstoque = temEstoque && temDias;

    // ================================================================
    // PARA COMBUSTÃVEL
    // ================================================================
    if (isCombustivel) {
        var periodos = [];
        for (var i = 2; i < headers.length; i++) {
            var periodo = headers[i] || '';
            if (periodo !== '' && periodo.toUpperCase() !== 'TOTAL') {
                periodos.push(periodo);
            }
        }

        var linhas = [];
        var totalRowData = null;
        
        rows.forEach(function(row) {
            var categoria = row[0] || '';
            var combustivel = row[1] || '';
            var label = categoria + ' - ' + combustivel;
            
            if (categoria.toUpperCase() === 'TOTAL') {
                totalRowData = row;
            } else {
                linhas.push({
                    categoria: categoria,
                    combustivel: combustivel,
                    label: label,
                    dados: row.slice(2)
                });
            }
        });

        var newHeaders = ['PerÃ­odo'];
        linhas.forEach(function(item) {
            newHeaders.push(item.label);
        });
        if (totalRowData) {
            newHeaders.push('TOTAL');
        }

        var newRows = [];

        for (var p = 0; p < periodos.length; p++) {
            var rowData = [periodos[p]];
            
            linhas.forEach(function(item) {
                var val = item.dados[p] || '0';
                var num = parseNumeroBR(val);
                rowData.push(num !== null ? num : 0);
            });
            
            if (totalRowData) {
                var totalVal = totalRowData[p + 2] || '0';
                var numTotal = parseNumeroBR(totalVal);
                rowData.push(numTotal !== null ? numTotal : 0);
            }
            
            newRows.push(rowData);
        }

        return {
            headers: newHeaders,
            rows: newRows,
            isCombustivel: true
        };
    }

    // ================================================================
    // PARA ESTOQUE
    // ================================================================
    if (isEstoque) {
        // Pega os nomes das categorias (primeira coluna de cada linha)
        var categorias = [];
        var totalRowData = null;

        rows.forEach(function(row) {
            var label = row[0] || '';
            if (label.toUpperCase() === 'TOTAL') {
                totalRowData = row;
            } else {
                categorias.push(label);
            }
        });

        // Extrai os meses dos headers
        // Os headers estÃ£o no formato: "2025 - JAN (Estoque)", "2025 - JAN (Dias)", etc.
        var meses = [];
        for (var i = 1; i < headers.length; i++) {
            var h = headers[i] || '';
            // Pega apenas a parte antes do " ("
            var mes = h.split(' (')[0];
            if (mes !== '' && mes.toUpperCase() !== 'TOTAL' && mes !== 'PROCEDÃNCIA') {
                if (meses.indexOf(mes) === -1) {
                    meses.push(mes);
                }
            }
        }

        // CabeÃ§alho: PerÃ­odo + para cada categoria: Estoque e Dias + TOTAL
        var newHeaders = ['PerÃ­odo'];
        categorias.forEach(function(cat) {
            newHeaders.push(cat + ' (Estoque)');
            newHeaders.push(cat + ' (Dias)');
        });
        if (totalRowData) {
            newHeaders.push('TOTAL (Estoque)');
            newHeaders.push('TOTAL (Dias)');
        }

        var newRows = [];

        // Para cada mÃªs, cria UMA linha
        for (var m = 0; m < meses.length; m++) {
            var mes = meses[m];
            
            // Encontra os Ã­ndices das colunas para este mÃªs
            var colEstoque = -1;
            var colDias = -1;
            
            for (var i = 1; i < headers.length; i++) {
                var h = headers[i] || '';
                // Verifica se o header comeÃ§a com o mÃªs
                if (h.indexOf(mes) === 0) {
                    if (h.indexOf('Estoque') !== -1) {
                        colEstoque = i;
                    } else if (h.indexOf('Dias') !== -1) {
                        colDias = i;
                    }
                }
            }
            
            // Se nÃ£o encontrou as colunas, tenta buscar sem o sufixo
            if (colEstoque === -1 || colDias === -1) {
                for (var i = 1; i < headers.length; i++) {
                    var h = headers[i] || '';
                    var hSemSufixo = h.split(' (')[0];
                    if (hSemSufixo === mes) {
                        if (h.indexOf('Estoque') !== -1) {
                            colEstoque = i;
                        } else if (h.indexOf('Dias') !== -1) {
                            colDias = i;
                        }
                    }
                }
            }
            
            // Se ainda nÃ£o encontrou, pula
            if (colEstoque === -1 || colDias === -1) {
                continue;
            }

            // Cria UMA linha para este mÃªs
            var rowData = [mes];

            // Pega os valores de Estoque e Dias para CADA categoria
            rows.forEach(function(row) {
                var label = (row[0] || '').toUpperCase();
                if (label === 'TOTAL') return;

                var valorEstoque = row[colEstoque] || '0';
                var numEstoque = parseNumeroBR(valorEstoque);
                rowData.push(numEstoque !== null ? numEstoque : 0);

                var valorDias = row[colDias] || '0';
                var numDias = parseNumeroBR(valorDias);
                rowData.push(numDias !== null ? numDias : 0);
            });

            // Adiciona os valores da linha TOTAL para este mÃªs
            if (totalRowData) {
                var totalEstoque = totalRowData[colEstoque] || '0';
                var numTotalEstoque = parseNumeroBR(totalEstoque);
                rowData.push(numTotalEstoque !== null ? numTotalEstoque : 0);

                var totalDias = totalRowData[colDias] || '0';
                var numTotalDias = parseNumeroBR(totalDias);
                rowData.push(numTotalDias !== null ? numTotalDias : 0);
            }

            newRows.push(rowData);
        }

        return {
            headers: newHeaders,
            rows: newRows,
            isEstoque: true
        };
    }

    // ================================================================
    // PARA TABELAS NORMAIS (SUPORTA MÃLTIPLAS COLUNAS DE IDENTIFICAÃÃO)
    // ================================================================

    // Descobre onde comeÃ§am os perÃ­odos
    var firstPeriodIndex = -1;

    for (var i = 0; i < headers.length; i++) {

        var h = (headers[i] || '').trim().toUpperCase();

        // 2026 - JAN
        // 2026 - T1
        // 2026 - S1
        // 2026
        if (/^\d{4}(\s*-\s*.+)?$/.test(h)) {
            firstPeriodIndex = i;
            break;
        }

    }

    // fallback
    if (firstPeriodIndex === -1) {
        firstPeriodIndex = 1;
    }

    var series = [];
    var totalRowData = null;

    rows.forEach(function(row) {

        var primeiraColuna = (row[0] || '').trim().toUpperCase();

        if (primeiraColuna === 'TOTAL') {
            totalRowData = row;
            return;
        }

        var label = row
            .slice(0, firstPeriodIndex)
            .filter(function(v){
                return v !== '';
            })
            .join(' - ');

        series.push({
            label: label,
            dados: row.slice(firstPeriodIndex)
        });

    });

    var newHeaders = ['PerÃ­odo'];

    series.forEach(function(item){
        newHeaders.push(item.label);
    });

    if (totalRowData) {
        newHeaders.push('TOTAL');
    }

    var newRows = [];

    for (var col = firstPeriodIndex; col < headers.length; col++) {

        var periodo = headers[col] || '';

        if (periodo.toUpperCase() === 'TOTAL') {
            continue;
        }

        var rowData = [periodo];

        series.forEach(function(item){

            var idx = col - firstPeriodIndex;

            var valor = item.dados[idx] || '0';

            var numero = parseNumeroBR(valor);

            rowData.push(numero !== null ? numero : 0);

        });

        if (totalRowData) {

            var totalValor = totalRowData[col] || '0';

            var numeroTotal = parseNumeroBR(totalValor);

            rowData.push(numeroTotal !== null ? numeroTotal : 0);

        }

        newRows.push(rowData);

    }

    return {
        headers: newHeaders,
        rows: newRows,
        isCombustivel: false,
        isEstoque: false
    };
}

    function isMoedaValue(value) {
        if (!value) return false;
        var s = value.toString();
        return s.indexOf('R$') !== -1 || s.indexOf('US$') !== -1;
    }

    function parseNumeroBR(texto) {
        if (texto === null || texto === undefined) return null;
        var s = texto.toString().trim();
        if (s === '') return null;
        var limpo = s.replace(/[^\d.,-]/g, '');           // remove R$, US$, espaÃ§os
        if (limpo === '' || limpo === '-' || !/\d/.test(limpo)) return null;
        limpo = limpo.replace(/\./g, '').replace(',', '.'); // milhar . / decimal ,
        var n = parseFloat(limpo);
        return isNaN(n) ? null : n;
    }

    function tableAssunto() {
        var cap = document.querySelector('#resultadoContainer table caption');
        return cap ? cap.textContent.trim() : '';
    }

    // ââ EXPORTAÃÃO ââââââââââââââââââââââââââââââââââââââââââââââ
    function exportCSV() {
        var table = document.querySelector('#resultadoContainer table');
        if (!table) return;
        
        var data = extractTableData(table);
        var verticalData = verticalizeTableData(data);
        
        var rows = [];
        var assunto = tableAssunto();
        if (assunto) rows.push('"' + assunto.replace(/"/g, '""') + '"');
        
        rows.push(verticalData.headers.map(function(h) {
            return '"' + String(h).replace(/"/g, '""') + '"';
        }).join(';'));
        
        verticalData.rows.forEach(function(r) {
            var cells = r.map(function(cell, idx) {
                if (idx === 0) return '"' + String(cell).replace(/"/g, '""') + '"';
                if (typeof cell === 'number') {
                    return String(cell).replace('.', ',');
                }
                var num = parseNumeroBR(cell);
                return num === null ? '"' + String(cell).replace(/"/g, '""') + '"'
                                    : String(num).replace('.', ',');
            });
            rows.push(cells.join(';'));
        });
        
        var blob = new Blob(['\ufeff' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; 
        a.download = tableToFileName('csv'); 
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportXLSX() {
        loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', function() {
            var table = document.querySelector('#resultadoContainer table');
            if (!table) return;
            
            var data = extractTableData(table);
            var verticalData = verticalizeTableData(data);
            
            var aoa = [];
            var assunto = tableAssunto();
            if (assunto) aoa.push([assunto]);
            
            aoa.push(verticalData.headers);
            
            verticalData.rows.forEach(function(r) {
                aoa.push(r.map(function(cell, idx) {
                    if (idx === 0) return cell;
                    if (typeof cell === 'number') return cell;
                    var num = parseNumeroBR(cell);
                    return num === null ? cell : num;
                }));
            });
            
            var ws = XLSX.utils.aoa_to_sheet(aoa);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Dados ANFAVEA');
            XLSX.writeFile(wb, tableToFileName('xlsx'));
        });
    }

    function exportPDF() {
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', function() {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js', function() {
                var table = document.querySelector('#resultadoContainer table');
                if (!table) return;
                
                var tableData = extractTableData(table);
                var verticalData = verticalizeTableData(tableData);
                
                var isMoeda = false;
                if (tableData.rows.length > 0 && tableData.rows[0].length > 1) {
                    var firstValue = tableData.rows[0][1] || '';
                    isMoeda = isMoedaValue(firstValue);
                    if (!isMoeda) {
                        for (var i = 0; i < tableData.rows.length && !isMoeda; i++) {
                            for (var j = 1; j < Math.min(tableData.rows[i].length, 5); j++) {
                                if (isMoedaValue(tableData.rows[i][j])) {
                                    isMoeda = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // Sempre usa portrait (vertical) - mais colunas cabem melhor
                var doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                doc.setFontSize(16);
                doc.setTextColor(26, 26, 230);
                doc.text('ANFAVEA - Dados', 14, 20);

                var assuntoPDF = tableAssunto();
                var yBase = 27;
                if (assuntoPDF) {
                    doc.setFontSize(11);
                    doc.setTextColor(33, 33, 33);
                    doc.text(assuntoPDF, 14, yBase);
                    yBase += 6;
                }

                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), 14, yBase);
                yBase += 6;
                
                try {
                    var inicioAno = document.getElementById('inicioAno');
                    var inicioMes = document.getElementById('inicioMes');
                    var fimAno = document.getElementById('fimAno');
                    var fimMes = document.getElementById('fimMes');

                    if (inicioAno && inicioMes && fimAno && fimMes) {
                        var meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
                        var anoInicio = (inicioAno.value || '').match(/\d{4}/);
                        anoInicio = anoInicio ? anoInicio[0] : inicioAno.value;
                        var anoFim = (fimAno.value || '').match(/\d{4}/);
                        anoFim = anoFim ? anoFim[0] : fimAno.value;
                        var periodoText = meses[parseInt(inicioMes.value,10)-1] + '/' + anoInicio +
                            ' a ' + meses[parseInt(fimMes.value,10)-1] + '/' + anoFim;
                        doc.text('PerÃ­odo: ' + periodoText, 14, yBase);
                        yBase += 6;
                    }
                } catch(e) {}
                
                var head = [verticalData.headers];
                var body = verticalData.rows.map(function(row) {
                    return row.map(function(cell, index) {
                        if (isMoeda && index > 0 && typeof cell === 'number') {
                            return 'US$ ' + cell.toFixed(2).replace('.', ',');
                        }
                        if (typeof cell === 'number') {
                            return cell.toFixed(0).replace('.', ',');
                        }
                        return cell;
                    });
                });
                
                doc.autoTable({
                    head: head,
                    body: body,
                    startY: yBase + 3,
                    styles: { fontSize: 8, cellPadding: 2, valign: 'middle', halign: 'center' },
                    headStyles: { fillColor: [26, 26, 230], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                    columnStyles: { 0: { cellWidth: 40, halign: 'left', fontStyle: 'bold', fillColor: [245, 245, 245] } },
                    alternateRowStyles: { fillColor: [248, 248, 248] },
                    margin: { left: 10, right: 10 },
                    pageBreak: 'auto',
                    tableWidth: 'auto',
                    didDrawPage: function(data) {
                        doc.setFontSize(7);
                        doc.setTextColor(150, 150, 150);
                        doc.text('PÃ¡gina ' + doc.internal.getNumberOfPages(), 14, doc.internal.pageSize.height - 5);
                        doc.text('ANFAVEA - Dados Automotivos', doc.internal.pageSize.width - 50, doc.internal.pageSize.height - 5);
                    }
                });
                doc.save(tableToFileName('pdf'));
            });
        });
    }

    // ââ BOTÃES DE EXPORTAÃÃO âââââââââââââââââââââââââââââââââââ
    var btnCSV  = document.getElementById('btnExportCSV');
    var btnXLSX = document.getElementById('btnExportXLSX');
    var btnPDF  = document.getElementById('btnExportPDF');
    if (btnCSV)  btnCSV.addEventListener('click',  exportCSV);
    if (btnXLSX) btnXLSX.addEventListener('click', exportXLSX);
    if (btnPDF)  btnPDF.addEventListener('click',  exportPDF);

    // ââ ATIVAÃÃO DOS BOTÃES âââââââââââââââââââââââââââââââââââ
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            setActive(this);
        });
    });

    
    // Ao mudar qualquer select de perÃ­odo, revalida quais agregaÃ§Ãµes
    // cabem no intervalo (trava Trimestral/Semestral/Anual se nÃ£o houver perÃ­odo
    // civil completo). Ex.: jan/2026 a mai/2026 -> sÃ³ Mensal e Trimestral (T1).
    ['inicioAno', 'inicioMes', 'fimAno', 'fimMes'].forEach(function (id) {
        var sel = document.getElementById(id);
        if (!sel) return;
        sel.addEventListener('change', function () {
            verificarDisponibilidadeAgregacao();
        });
    });

    /* ========================================================
       [NOVO] MÃQUINAS AUTOPROPULSADAS â disponibilidade dos botÃµes
       Os botÃµes sÃ£o fixos no HTML (como Leves/Pesados), mas nem toda
       combinaÃ§Ã£o existe na sÃ©rie. O backend informa quais tokens tÃªm
       dados para o tipo de dado escolhido e os demais sÃ£o desabilitados:
         - MÃ¡quinas rodoviÃ¡rias           -> sem "Vendas no varejo"
         - AgrÃ­colas + ExportaÃ§Ãµes        -> sÃ³ o botÃ£o "Total"
         - RodoviÃ¡rias + ExportaÃ§Ãµes      -> sem mini-carregadeiras
                                             e manipulador telescÃ³pio
       ======================================================== */
    let _maqDispKey = null; // evita recarregar o mesmo tipo de dado

    function aplicarDisponibilidadeMaquinas(tokens) {
        // RÃ³tulo do tipo de dado ativo, para compor o aviso ("Vendas no varejo", etc.)
        const btnVar = document.querySelector('#tipoDadoMaquinaGroup .toggle-btn.active');
        const rotuloVar = btnVar ? btnVar.textContent.trim() : '';

        GRUPOS_MAQUINA.forEach(gid => {
            const grupo = document.getElementById(gid);
            if (!grupo) return;

            const botoes = [...grupo.querySelectorAll('.toggle-btn')];
            const indisponiveis = [];

            botoes.forEach(btn => {
                const ok = tokens.includes(btn.dataset.value);
                // `disabled` jÃ¡ impede o clique; NÃO usar pointer-events:none aqui,
                // senÃ£o o botÃ£o fica cinza sem nenhuma explicaÃ§Ã£o para o usuÃ¡rio.
                btn.disabled = !ok;
                btn.style.opacity = ok ? '' : '0.45';
                btn.style.cursor  = ok ? '' : 'not-allowed';
                if (!ok) {
                    btn.classList.remove('active'); // nÃ£o filtrar por algo inexistente
                    indisponiveis.push(btn.textContent.trim());
                }
            });

            // Aviso visÃ­vel explicando por que os botÃµes estÃ£o cinza
            const nota = document.getElementById(gid.replace('Group', 'Nota'));
            if (!nota) return;

            if (!rotuloVar || indisponiveis.length === 0) {
                nota.textContent = '';
                return;
            }

            const habilitados = botoes.filter(b => !b.disabled);
            const soTotal = habilitados.length === 1 &&
                            habilitados[0].dataset.value.indexOf('TOTAL_') === 0;

            if (indisponiveis.length === botoes.length) {
                // Ex.: MÃ¡quinas rodoviÃ¡rias nÃ£o tÃªm Vendas no varejo
                nota.textContent = 'Este segmento nÃ£o possui dados de ' + rotuloVar + '.';
            } else if (soTotal) {
                // Ex.: ExportaÃ§Ãµes de mÃ¡quinas agrÃ­colas nÃ£o sÃ£o abertas por tipo
                nota.textContent = 'Em ' + rotuloVar + ', este segmento nÃ£o Ã© aberto por tipo de mÃ¡quina â use o total.';
            } else {
                // Ex.: ExportaÃ§Ãµes sem mini-carregadeiras e manipulador telescÃ³pio
                nota.textContent = 'Sem dados de ' + rotuloVar + ' para: ' + indisponiveis.join(', ') + '.';
            }
        });
    }

    function atualizarDisponibilidadeMaquinas() {
        const variavel = getActive('tipoDadoMaquinaGroup');

        if (!variavel) {
            // Sem tipo de dado escolhido: tudo liberado
            _maqDispKey = null;
            const todos = [];
            GRUPOS_MAQUINA.forEach(gid => {
                const g = document.getElementById(gid);
                if (g) g.querySelectorAll('.toggle-btn').forEach(b => todos.push(b.dataset.value));
            });
            aplicarDisponibilidadeMaquinas(todos);
            return;
        }

        if (variavel === _maqDispKey) return; // jÃ¡ aplicado
        _maqDispKey = variavel;

        const body = new FormData();
        body.append('action', 'anfavea_get_maquinas_disponiveis');
        body.append('nonce', anfaveaData.nonce);
        body.append('variavel', variavel);

        fetch(anfaveaData.ajaxurl, { method: 'POST', body: body })
            .then(r => r.json())
            .then(data => {
                if (!data.success) return;
                aplicarDisponibilidadeMaquinas((data.data && data.data.tokens) || []);
            })
            .catch(err => {
                console.error('â Erro ao verificar disponibilidade das mÃ¡quinas:', err);
                _maqDispKey = null;
            });
    }

    // ================================================================
    // TRAVA AGREGAÃÃO PARA ESTOQUE E EMPREGO
    // ================================================================

    function travarAgregacaoEstoque(travar, tipo = '') {
        const grupo = document.getElementById('agregacaoGroup');
        if (!grupo) {
            console.warn('â ï¸ Grupo de agregaÃ§Ã£o nÃ£o encontrado');
            return;
        }

        const botoes = grupo.querySelectorAll('.toggle-btn');
        // console.log('ð§ travarAgregacaoEstoque:', { travar, tipo, totalBotoes: botoes.length });

        // Define a mensagem com base no tipo
        let mensagem = 'Esta sÃ©rie possui apenas dados mensais.';
        if (tipo === 'estoque') {
            mensagem = 'Estoque possui apenas sÃ©rie mensal';
        } else if (tipo === 'emprego') {
            mensagem = 'Emprego possui apenas sÃ©rie mensal';
        }

        botoes.forEach((btn, index) => {
            const ehMensal = btn.dataset.value === 'mensal';

            if (travar) {
                // MantÃ©m apenas "Mensal" ativo
                if (ehMensal) {
                    btn.classList.add('active');
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                    btn.style.cursor = 'pointer';
                    btn.title = '';
                } else {
                    btn.classList.remove('active');
                    btn.disabled = true;
                    btn.style.opacity = '0.4';
                    btn.style.pointerEvents = 'none';
                    btn.style.cursor = 'not-allowed';
                    btn.title = mensagem;
                }
            } else {
                // Libera todos os botÃµes
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.cursor = 'pointer';
                btn.style.color = '';
                btn.title = '';
            }

            // console.log(`  BotÃ£o ${index}: ${btn.dataset.value}`, {
            //    disabled: btn.disabled,
            //    opacity: btn.style.opacity,
            //    pointerEvents: btn.style.pointerEvents,
            //    classList: btn.classList.toString()
            //
        });
    }
    
    // ================================================================
    // DISPONIBILIDADE DO COMBUSTÃVEL
    // ================================================================

    function aplicarDisponibilidadeCombustivel() {
        const dimensaoEmpl = getActive('dimensaoEmplacamentoGroup');
        const btnCombustivel = document.querySelector('#dimensaoEmplacamentoGroup .toggle-btn[data-value="combustivel"]');
        const btnProcedencia = document.querySelector('#dimensaoEmplacamentoGroup .toggle-btn[data-value="procedencia"]');

        if (!btnCombustivel || !btnProcedencia) return;

        // Verifica se "Por CombustÃ­vel" estÃ¡ ativo
        const combustivelAtivo = btnCombustivel.classList.contains('active');

        // ================================================================
        // GERENCIA A SEÃÃO DE SUBCATEGORIA DE CAMINHÃES
        // ================================================================

        const subCaminhaoSection = document.getElementById('subsegmentoCaminhaoSection');
        const subCaminhaoGroup = document.getElementById('subsegmentoCaminhaoGroup');
        const notaSubCaminhao = document.getElementById('subsegmentoCaminhaoNota');

        if (combustivelAtivo) {
            // Quando "Por CombustÃ­vel" estÃ¡ ativo, oculta completamente a seÃ§Ã£o
            if (subCaminhaoSection) {
                subCaminhaoSection.style.display = 'none';
            }

            // Desabilita os botÃµes de subcategoria (por seguranÃ§a)
            if (subCaminhaoGroup) {
                subCaminhaoGroup.querySelectorAll('.toggle-btn').forEach(function(btn) {
                    btn.disabled = true;
                    btn.style.opacity = '0.45';
                    btn.style.cursor = 'not-allowed';
                    btn.title = 'Subcategorias nÃ£o disponÃ­veis em "Por CombustÃ­vel"';
                    btn.classList.remove('active');
                });
                // Ativa o botÃ£o "TOTAL" como padrÃ£o
                const btnTotal = subCaminhaoGroup.querySelector('[data-value="TOTAL"]');
                if (btnTotal) {
                    btnTotal.classList.add('active');
                }
            }

            // Esconde a nota da subcategoria
            if (notaSubCaminhao) {
                notaSubCaminhao.textContent = '';
                notaSubCaminhao.style.display = 'none';
            }

            // ================================================================
            // EXIBE NOTA NO GRUPO DE PESADOS
            // ================================================================
            const notaPesados = document.getElementById('categoriaPesadosNota');
            if (notaPesados) {
                // Verifica se "CaminhÃµes" estÃ¡ selecionado
                const caminhoesAtivo = document.querySelector('#categoriaPesadosGroup .toggle-btn[data-value="caminhoes"].active');

                if (caminhoesAtivo) {
                    notaPesados.textContent = 'â ï¸ Em "Por CombustÃ­vel", as subcategorias de CaminhÃµes nÃ£o estÃ£o disponÃ­veis.';
                    notaPesados.style.display = 'block';
                    notaPesados.style.color = '#856404';
                } else {
                    notaPesados.textContent = '';
                    notaPesados.style.display = 'none';
                }
            }

            // ================================================================
            // LIBERA OS BOTÃES DE CATEGORIA (nÃ£o forÃ§a Total)
            // ================================================================
            ['categoriaLevesGroup', 'categoriaPesadosGroup'].forEach(function(gid) {
                const grupo = document.getElementById(gid);
                if (!grupo) return;

                grupo.querySelectorAll('.toggle-btn').forEach(function(btn) {
                    btn.disabled = false;
                    btn.style.opacity = '';
                    btn.style.cursor = '';
                    btn.title = '';
                });
            });

            // Esconde nota de Leves
            const notaLeves = document.getElementById('categoriaLevesNota');
            if (notaLeves) {
                notaLeves.textContent = '';
                notaLeves.style.display = 'none';
            }

        } else {
            // ================================================================
            // QUANDO "POR COMBUSTÃVEL" NÃO ESTÃ ATIVO
            // ================================================================

            // Libera a seÃ§Ã£o de subcategoria de caminhÃµes (serÃ¡ controlada pelo toggleSection)
            if (subCaminhaoGroup) {
                subCaminhaoGroup.querySelectorAll('.toggle-btn').forEach(function(btn) {
                    btn.disabled = false;
                    btn.style.opacity = '';
                    btn.style.cursor = '';
                    btn.title = '';
                });
            }

            // Esconde a nota de subcategoria
            if (notaSubCaminhao) {
                notaSubCaminhao.textContent = '';
                notaSubCaminhao.style.display = 'none';
            }

            // Esconde a nota de Pesados
            const notaPesados = document.getElementById('categoriaPesadosNota');
            if (notaPesados) {
                notaPesados.textContent = '';
                notaPesados.style.display = 'none';
            }

            // Libera os botÃµes de categoria
            ['categoriaLevesGroup', 'categoriaPesadosGroup'].forEach(function(gid) {
                const grupo = document.getElementById(gid);
                if (!grupo) return;

                grupo.querySelectorAll('.toggle-btn').forEach(function(btn) {
                    btn.disabled = false;
                    btn.style.opacity = '';
                    btn.style.cursor = '';
                    btn.title = '';
                });
            });
        }

        // O botÃ£o "Por CombustÃ­vel" sempre fica disponÃ­vel
        btnCombustivel.disabled = false;
        btnCombustivel.style.opacity = '';
        btnCombustivel.style.cursor = '';
        btnCombustivel.title = '';
    }

    // ================================================================
    // ATUALIZAR INTERFACE
    // ================================================================
    
    function atualizarInterface() {
        if (estaAtualizando) return;
        estaAtualizando = true;

        const dashboard = getActive('dashboardGroup');
        const tipoDado = getActive('tipoDadoGroup');
        const tipoDado2 = getActive('tipoDadoEmpregoGroup');

        const dashboard1 = document.getElementById('dashboard1Section');
        const dashboard2 = document.getElementById('dashboard2Section');
        const dashboard3 = document.getElementById('dashboard3Section');

        const secoes = {
            dashboard1: dashboard1,
            dashboard2: dashboard2,
            dashboard3: dashboard3
        };
        Object.keys(secoes).forEach(key => {
            const el = secoes[key];
            if (!el) return;
            if (key === dashboard) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
                el.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
            }
        });

        if (dashboard === 'dashboard1') {
            travarAgregacaoEstoque(false);
            if (tipoDado && tipoDado !== '') {
                carregarPeriodosDisponiveis(tipoDado, 'dashboard1');
                atualizarMesesPorAno(tipoDado, 'dashboard1');
            }
        } else if (dashboard === 'dashboard3') {
            travarAgregacaoEstoque(false);
            atualizarDisponibilidadeMaquinas();
            carregarPeriodosDisponiveis('maquinas_autopropulsadas', 'dashboard3');
            atualizarMesesPorAno('maquinas_autopropulsadas', 'dashboard3');
        } else {
            const travar = tipoDado2 === 'estoque' || tipoDado2 === 'emprego';
            travarAgregacaoEstoque(travar, tipoDado2);

            if (tipoDado2 && tipoDado2 !== '') {
                carregarPeriodosDisponiveis(tipoDado2, 'dashboard2');
                atualizarMesesPorAno(tipoDado2, 'dashboard2');
            }
        }

        // Aplica disponibilidade do combustÃ­vel
        aplicarDisponibilidadeCombustivel();

        const isEstoqueOuEmprego = dashboard === 'dashboard2' && (tipoDado2 === 'estoque' || tipoDado2 === 'emprego');
        if (!isEstoqueOuEmprego) {
            verificarDisponibilidadeAgregacao();
        }

        const temLeve = temCategoriaLeve();
        const temPesado = temCategoriaPesada();

        const dimensaoEmpl = getActive('dimensaoEmplacamentoGroup');
        const isCombustivelAtivo = dimensaoEmpl === 'combustivel';
        const mostrarSubCaminhao = caminhoesAtivo() && !isCombustivelAtivo;
        toggleSection('subsegmentoCaminhaoSection', mostrarSubCaminhao);
        
        const mostrarEscopo = tipoDado === 'emplacamento';
        toggleSection('escopoDadoSection', mostrarEscopo);

        if (mostrarEscopo) {
            const porProcedencia = dimensaoEmpl === 'procedencia';
            const porCombustivel = dimensaoEmpl === 'combustivel';

            toggleSection('procedenciaSection', porProcedencia);
            toggleSection('empresaMarcaSection', porProcedencia);
            toggleSection('combustivelSection', porCombustivel);

            if (porProcedencia) {
                carregarSelectsEmpresaMarca();
            }

            const levesComb = document.getElementById('combustivelLeves');
            const pesadosComb = document.getElementById('combustivelPesados');
            const todosComb = document.getElementById('combustivelTodos');

            if (levesComb && pesadosComb && todosComb) {
                if (temLeve && temPesado) {
                    levesComb.style.display = 'none';
                    pesadosComb.style.display = 'none';
                    todosComb.style.display = '';
                } else if (temLeve) {
                    levesComb.style.display = '';
                    pesadosComb.style.display = 'none';
                    todosComb.style.display = 'none';
                } else if (temPesado) {
                    levesComb.style.display = 'none';
                    pesadosComb.style.display = '';
                    todosComb.style.display = 'none';
                } else {
                    levesComb.style.display = 'none';
                    pesadosComb.style.display = 'none';
                    todosComb.style.display = '';
                }
            }
        } else {
            toggleSection('procedenciaSection', false);
            toggleSection('empresaMarcaSection', false);
            toggleSection('combustivelSection', false);
        }

        estaAtualizando = false;
        atualizarBotaoGerar();
    }

    // Jornada mÃ­nima por dashboard:
    //   dash1: >=1 categoria/segmento + sÃ©rie estatÃ­stica
    //   dash2: uma sÃ©rie
    //   dash3: >=1 mÃ¡quina + sÃ©rie (tipo de dado)
    function jornadaMinimaOk() {
        var dashboard = getActive('dashboardGroup');
        if (dashboard === 'dashboard1') {
            return getCategoriasSelecionadas().length > 0 && !!getActive('tipoDadoGroup');
        }
        if (dashboard === 'dashboard3') {
            return getMaquinasSelecionadas().length > 0 && !!getActive('tipoDadoMaquinaGroup');
        }
        return !!getActive('tipoDadoEmpregoGroup'); // dashboard2
    }

    function atualizarBotaoGerar() {
        var ok = jornadaMinimaOk();
        btnGerar.disabled = !ok;
        btnGerar.style.opacity = ok ? '' : '0.5';
        btnGerar.style.cursor = ok ? '' : 'not-allowed';
        btnGerar.title = ok ? '' : 'Escolha o segmento/categoria e a sÃ©rie estatÃ­stica.';
    }

    // InicializaÃ§Ã£o
    atualizarInterface();

    // ââ GERAR TABELA ââââââââââââââââââââââââââââââââââââââââââââââ
    btnGerar.addEventListener('click', function() {
    // [doc] NÃ£o gera sem a jornada mÃ­nima
    if (!jornadaMinimaOk()) {
        var rJ = document.getElementById('resultadoSection');
        var cJ = document.getElementById('resultadoContainer');
        if (rJ) rJ.classList.remove('d-none');
        if (cJ) cJ.innerHTML = '<p class="text-muted">Para gerar a tabela, escolha o segmento/categoria e a sÃ©rie estatÃ­stica.</p>';
        return;
    }
    const resultado = document.getElementById('resultadoSection');
    const container = document.getElementById('resultadoContainer');
    const dashboard = getActive('dashboardGroup');
    resultado.classList.remove('d-none');
    container.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><br>Gerando tabela...</div>';

    const body = new FormData();
    body.append('action', 'anfavea_dashboard1');
    body.append('nonce', anfaveaData.nonce);

    // Dashboard
    body.append('dashboard', getActive('dashboardGroup'));

    // Categorias multi-selecionadas (tokens)
    const categoriasSel = getCategoriasSelecionadas();
    categoriasSel.forEach(c => body.append('categorias[]', c));

    // Subsegmentos de caminhÃµes (multi)
    const subsegAtivos = getActive('subsegmentoCaminhaoGroup');
    (Array.isArray(subsegAtivos) ? subsegAtivos : [subsegAtivos])
        .forEach(val => { if (val) body.append('subsegmento_caminhao[]', val); });

    // Tipo de Dado
    const tipoDado = getActive('tipoDadoGroup');
    body.append('tipo_dado', tipoDado);

    // DimensÃ£o ('' = sem filtros adicionais â sÃ³ os totais por categoria)
    const dimensaoEmpl = getActive('dimensaoEmplacamentoGroup');
    body.append('dimensao_emplacamento', dimensaoEmpl);

    if (tipoDado === 'emplacamento') {
        if (dimensaoEmpl === 'procedencia') {
            // [pedido 2] procedÃªncia multi-seleÃ§Ã£o -> envia lista
            const procs = getActive('procedenciaGroup');
            (Array.isArray(procs) ? procs : [procs || 'total']).forEach(function (pr) {
                if (pr) body.append('procedencia[]', pr);
            });

            // Empresa/Marca: flags de "agrupar por" + filtro (opcionais)
            //   por_empresa/por_marca = 1 quando o usuÃ¡rio engajou a dimensÃ£o
            //   (marcou qualquer opÃ§Ã£o, inclusive "todas"). Filtro = seleÃ§Ãµes especÃ­ficas.
            const empresa = document.getElementById('empresaSelect');
            const marca = document.getElementById('marcaSelect');

            let porEmpresa = 0, empresaFiltro = [];
            if (empresa) {
                const checked = [...empresa.selectedOptions].map(o => o.value);
                porEmpresa = checked.length > 0 ? 1 : 0;
                empresaFiltro = checked.filter(v => v !== 'todas' && v !== '');
            }
            let porMarca = 0, marcaFiltro = [];
            if (marca) {
                const checked = [...marca.selectedOptions].map(o => o.value);
                porMarca = checked.length > 0 ? 1 : 0;
                marcaFiltro = checked.filter(v => v !== 'todas' && v !== '');
            }

            body.append('por_empresa', porEmpresa);
            body.append('por_marca', porMarca);
            body.append('empresa', empresaFiltro.join(','));
            body.append('marca', marcaFiltro.join(','));
            body.append('combustivel_filter', '');

        } else if (dimensaoEmpl === 'combustivel') {
            // Grupo de combustÃ­vel conforme categorias selecionadas
            const temLeve   = temCategoriaLeve();
            const temPesado = temCategoriaPesada();
            let combGrp;
            if (temLeve && temPesado)      combGrp = 'combustivelTodosGroup';
            else if (temPesado)            combGrp = 'combustivelPesadosGroup';
            else if (temLeve)              combGrp = 'combustivelLevesGroup';
            else                           combGrp = 'combustivelTodosGroup';

            const combValues = getActive(combGrp);
            (Array.isArray(combValues) ? combValues : [combValues || 'todos'])
                .forEach(val => body.append('combustivel_filter[]', val));

            body.append('procedencia', '');
            body.append('por_empresa', 0);
            body.append('por_marca', 0);
            body.append('empresa', '');
            body.append('marca', '');

        } else {
            // Emplacamento sem dimensÃ£o: sÃ³ os totais por categoria
            body.append('procedencia', 'total');
            body.append('por_empresa', 0);
            body.append('por_marca', 0);
            body.append('empresa', '');
            body.append('marca', '');
            body.append('combustivel_filter', '');
        }
    } else {
        body.append('procedencia', '');
        body.append('por_empresa', 0);
        body.append('por_marca', 0);
        body.append('empresa', '');
        body.append('marca', '');
        body.append('combustivel_filter', '');
    }

    // Dashboard 2
    body.append('tipo_dado_dashboard2', getActive('tipoDadoEmpregoGroup'));

    // Dashboard 3
    body.append('tipo_dado_maquina', getActive('tipoDadoMaquinaGroup'));
    getMaquinasSelecionadas().forEach(t => body.append('maquinas[]', t));

    body.append('agregacao', getActive('agregacaoGroup') || 'mensal');

    // Datas
    body.append('inicio', document.getElementById('inicioAno').value + '-' + 
                         document.getElementById('inicioMes').value);
    body.append('fim', document.getElementById('fimAno').value + '-' + 
                       document.getElementById('fimMes').value);

    // REQUEST COM DEBUG
    fetch(anfaveaData.ajaxurl, {
        method: 'POST',
        body: body
    })
    .then(response => {
        return response.text().then(text => {
            // Tenta parsear como JSON
            try {
                const data = JSON.parse(text);
                // console.log('ð Resposta JSON parseada:', data);
                return data;
            } catch (e) {
                console.error('â Erro ao parsear JSON:', e);
            }
        });
    })
    .then(data => {
        
        if (data.success) {
            container.innerHTML = data.data.table_html;
            var expDiv = document.getElementById('exportButtons');
            if (expDiv) expDiv.style.display = 'flex';
        } else {
            container.innerHTML = '<p class="text-danger">' + (data.data || data.message || 'Erro ao gerar consulta.') + '</p>';
        }
    })
    .catch((error) => {
        console.error('â Erro na requisiÃ§Ã£o:', error);
        container.innerHTML = '<p class="text-danger">Erro de conexÃ£o. Detalhes: ' + error.message + '</p>';
    });
});
}

/* ============================================================
   POPULAR PERÃODOS DISPONÃVEIS
   ============================================================ */

function mostrarLoadingPeriodos() {
    const selects = ['inicioAno', 'fimAno', 'inicioMes', 'fimMes'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<option value="">Carregando...</option>';
        } else {
            console.warn('â ï¸ Elemento nÃ£o encontrado:', id);
        }
    });
}

function carregarPeriodosDisponiveis(tipoDado, dashboard = 'dashboard1') {
    // Empresa/marca "engajadas" (qualquer opÃ§Ã£o marcada, inclusive "todas")
    const isDashboard2 = (dashboard === 'dashboard2');
    const isEstoqueOuEmprego = isDashboard2 && (tipoDado === 'estoque' || tipoDado === 'emprego');
    
    // SÃ³ aplica filtro de empresa se for Dashboard 1 e Emplacamento
    const secVisivel = document.getElementById('empresaMarcaSection') &&
                       document.getElementById('empresaMarcaSection').style.display !== 'none';
    const empSel = document.getElementById('empresaSelect');
    const marSel = document.getElementById('marcaSelect');
    const empEngaj = empSel ? [...empSel.selectedOptions].length > 0 : false;
    const marEngaj = marSel ? [...marSel.selectedOptions].length > 0 : false;
    const temFiltro = !isDashboard2 && tipoDado === 'emplacamento' && secVisivel && (empEngaj || marEngaj);

    // ProcedÃªncia ativa
    let procedencia = 'total';
    const procAtivos = [...document.querySelectorAll('#procedenciaGroup .toggle-btn.active')]
        .map(b => b.dataset.value);
    if (procAtivos.includes('importados')) procedencia = 'importados';
    else if (procAtivos.includes('nacionais')) procedencia = 'nacionais';
    else if (procAtivos.length) procedencia = procAtivos[0];

    // Pega todas as categorias ativas
    const categoriasSel = [...document.querySelectorAll('#categoriaLevesGroup .toggle-btn.active, #categoriaPesadosGroup .toggle-btn.active')]
        .map(b => b.dataset.value)
        .filter(v => v && v !== '');

    let subcatsSel = [];
    const subGrp = document.getElementById('subsegmentoCaminhaoGroup');
    if (subGrp) {
        subcatsSel = [...subGrp.querySelectorAll('.toggle-btn.active')]
            .map(b => b.dataset.value)
            .filter(v => v && v.toUpperCase() !== 'TOTAL');
    }
    const recorteKey = categoriasSel.slice().sort().join(',') + '|' + subcatsSel.slice().sort().join(',');

    // ================================================================
    // Pega a dimensÃ£o ativa
    // ================================================================
    var btnCombustivel = document.querySelector('#dimensaoEmplacamentoGroup .toggle-btn[data-value="combustivel"]');
    var btnProcedencia = document.querySelector('#dimensaoEmplacamentoGroup .toggle-btn[data-value="procedencia"]');
    var dimensao = 'procedencia'; // valor padrÃ£o
    
    if (btnCombustivel && btnCombustivel.classList.contains('active')) {
        dimensao = 'combustivel';
    } else if (btnProcedencia && btnProcedencia.classList.contains('active')) {
        dimensao = 'procedencia';
    }
    
    // console.log('ð¤ dimensao_emplacamento FINAL:', dimensao);
    // console.log('ð¤ btnCombustivel ativo:', btnCombustivel ? btnCombustivel.classList.contains('active') : false);
    // console.log('ð¤ btnProcedencia ativo:', btnProcedencia ? btnProcedencia.classList.contains('active') : false);
    
    const dimKey = dimensao;

    // ================================================================
    // Pega os combustÃ­veis selecionados
    // ================================================================
    var combustiveisSel = [];
    var combustivelAtivo = document.querySelector('#dimensaoEmplacamentoGroup .toggle-btn[data-value="combustivel"].active');
    
    // Mapeamento dos combustÃ­veis do front para o banco
    var mapCombustivel = {
        'diesel': 'DIESEL',
        'etanol': 'ETANOL',
        'eletrico': 'ELETRICO',
        'flex': 'FLEX FUEL',
        'gasolina': 'GASOLINA',
        'plugin': 'HIBRIDO PLUG-IN',
        'hibrido': 'HIBRIDO',
        'gas': 'GAS'
    };
    
    if (combustivelAtivo) {
        var grupoCombustivel = null;
        var levesComb = document.getElementById('combustivelLeves');
        var pesadosComb = document.getElementById('combustivelPesados');
        var todosComb = document.getElementById('combustivelTodos');
        
        if (levesComb && levesComb.style.display !== 'none') {
            grupoCombustivel = document.getElementById('combustivelLevesGroup');
        } else if (pesadosComb && pesadosComb.style.display !== 'none') {
            grupoCombustivel = document.getElementById('combustivelPesadosGroup');
        } else if (todosComb && todosComb.style.display !== 'none') {
            grupoCombustivel = document.getElementById('combustivelTodosGroup');
        }
        
        // console.log("combustivelAtivo:", combustivelAtivo);
        
        if (grupoCombustivel) {
            combustiveisSel = [...grupoCombustivel.querySelectorAll('.toggle-btn.active')]
                .map(b => b.dataset.value)
                .filter(v => v && v !== 'todos')
                .map(v => mapCombustivel[v] || v);
        }
    }
    
    // console.log("CombustÃ­veis enviados:", combustiveisSel);

    const cacheKey = dashboard + '_' + tipoDado + '_' + (temFiltro ? 'emp' : 'noemp') + '_' + procedencia + '_' + recorteKey + '_' + dimKey + '_' + combustiveisSel.join(',');

    const mudouTipo = tipoDado !== ultimoTipoDado;
    const mudouDashboard = dashboard !== ultimoDashboard;
    const mudouDimensao = dimKey !== ultimoDimensao;

    if (!mudouDimensao && periodosCache[cacheKey]) {
        preencherSelectsPeriodo(periodosCache[cacheKey]);
        ultimoTipoDado = tipoDado;
        ultimoDashboard = dashboard;
        ultimoDimensao = dimKey;
        return;
    }

    if (mudouTipo || mudouDashboard || mudouDimensao) {
        mostrarLoadingPeriodos();
    }

    const formData = new FormData();
    formData.append('action', 'anfavea_get_periodos');
    formData.append('nonce', anfaveaData.nonce);
    formData.append('tipo_dado', tipoDado);
    formData.append('dashboard', dashboard);
    formData.append('tem_filtro_empresa', temFiltro ? 'true' : 'false');
    formData.append('procedencia', procedencia);
    
    formData.append('dimensao_emplacamento', dimensao);
    
    categoriasSel.forEach(c => formData.append('categorias[]', c));
    subcatsSel.forEach(s => formData.append('subcategorias[]', s));
    combustiveisSel.forEach(c => formData.append('combustiveis[]', c));
    
    const empresaSelect = document.getElementById('empresaSelect');
    const marcaSelect = document.getElementById('marcaSelect');

    if (empresaSelect) {
        const empresas = Array.from(empresaSelect.querySelectorAll('option:checked'))
            .filter(o => o.value !== 'todas' && o.value !== '')
            .map(o => o.value);
        formData.append('empresa', empresas.join(','));
    }
    if (marcaSelect) {
        const marcas = Array.from(marcaSelect.querySelectorAll('option:checked'))
            .filter(o => o.value !== 'todas' && o.value !== '')
            .map(o => o.value);
        formData.append('marca', marcas.join(','));
    }

    // console.log('ð¤ Enviando request para perÃ­odos:', {
    //    tipoDado, dashboard, temFiltro, procedencia, categoriasSel, subcatsSel, combustiveisSel,
    //    empresa: empresaSelect ? Array.from(empresaSelect.querySelectorAll('option:checked')).map(o => o.value) : [],
    //    marca: marcaSelect ? Array.from(marcaSelect.querySelectorAll('option:checked')).map(o => o.value) : []
    // });
    
    fetch(anfaveaData.ajaxurl, { method: 'POST', body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                periodosCache[cacheKey] = data.data;
                preencherSelectsPeriodo(data.data);
                ultimoTipoDado = tipoDado;
                ultimoDashboard = dashboard;
                ultimoDimensao = dimKey;
                
                setTimeout(function() {
                    verificarDisponibilidadeAgregacao();
                }, 200);
            } else {
                console.error('Erro ao carregar perÃ­odos:', data.data);
                popularPeriodosFallback();
            }
        })
        .catch(error => {
            console.error('Erro na requisiÃ§Ã£o:', error);
            popularPeriodosFallback();
        });
}

function preencherSelectsPeriodo(dados) {
    const anos = dados.anos;
    const mesesPorAno = dados.meses_por_ano;
    
    // console.log('ð Preenchendo selects com anos:', anos);
    
    if (!anos || anos.length === 0) {
        console.warn('â ï¸ Nenhum ano encontrado para preencher os selects');
        popularPeriodosFallback();
        return;
    }
    
    const inicioAno = document.getElementById('inicioAno');
    const fimAno = document.getElementById('fimAno');
    
    if (inicioAno && fimAno) {
        inicioAno.innerHTML = '';
        fimAno.innerHTML = '';
        
        anos.forEach(ano => {
            const option1 = document.createElement('option');
            option1.value = ano;
            option1.textContent = ano;
            inicioAno.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = ano;
            option2.textContent = ano;
            fimAno.appendChild(option2);
        });
        
        const primeiroAno = anos[0];
        const ultimoAno = anos[anos.length - 1];
        
        // console.log('ð Primeiro ano:', primeiroAno, 'Ãltimo ano:', ultimoAno);
        
        if (primeiroAno) {
            inicioAno.value = primeiroAno;
            if (mesesPorAno && mesesPorAno[primeiroAno]) {
                preencherMeses('inicioMes', mesesPorAno[primeiroAno]);
                // Define o primeiro mÃªs disponÃ­vel para o inÃ­cio
                if (mesesPorAno[primeiroAno].length > 0) {
                    document.getElementById('inicioMes').value = mesesPorAno[primeiroAno][0];
                }
            } else {
                preencherMeses('inicioMes', ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
                document.getElementById('inicioMes').value = '01';
            }
        }
        
        if (ultimoAno) {
            fimAno.value = ultimoAno;
            if (mesesPorAno && mesesPorAno[ultimoAno]) {
                preencherMeses('fimMes', mesesPorAno[ultimoAno]);
                // Define o ÃLTIMO mÃªs disponÃ­vel para o fim do perÃ­odo
                const mesesUltimoAno = mesesPorAno[ultimoAno];
                if (mesesUltimoAno.length > 0) {
                    document.getElementById('fimMes').value = mesesUltimoAno[mesesUltimoAno.length - 1];
                }
            } else {
                preencherMeses('fimMes', ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
                document.getElementById('fimMes').value = '12';
            }
        }

        // Handlers de "change" dos anos
        anexarHandlersPeriodo(mesesPorAno);
    } else {
        console.error('â Selects de ano nÃ£o encontrados');
    }
    
    // Verifica disponibilidade das agregaÃ§Ãµes apÃ³s preencher os selects
    setTimeout(function() {
        verificarDisponibilidadeAgregacao();
    }, 300);
}

function anexarHandlersPeriodo(mesesPorAno) {
    const mesesFallback = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    [['inicioAno','inicioMes'], ['fimAno','fimMes']].forEach(function (par) {
        const selAno = document.getElementById(par[0]);
        const selMesId = par[1];
        if (!selAno) return;
        if (selAno._changeHandler) selAno.removeEventListener('change', selAno._changeHandler);
        selAno._changeHandler = function () {
            const ano = this.value;
            preencherMeses(selMesId, (mesesPorAno && mesesPorAno[ano]) ? mesesPorAno[ano] : mesesFallback);
            // Reavalia agregaÃ§Ãµes quando o perÃ­odo muda
            setTimeout(function() {
                verificarDisponibilidadeAgregacao();
            }, 200);
        };
        selAno.addEventListener('change', selAno._changeHandler);
    });
    
    // Listeners para os selects de mÃªs
    ['inicioMes', 'fimMes'].forEach(function(id) {
        const sel = document.getElementById(id);
        if (!sel) return;
        if (sel._changeHandler) sel.removeEventListener('change', sel._changeHandler);
        sel._changeHandler = function() {
            // Reavalia agregaÃ§Ãµes quando o mÃªs muda
            setTimeout(function() {
                verificarDisponibilidadeAgregacao();
            }, 200);
        };
        sel.addEventListener('change', sel._changeHandler);
    });
}

function preencherMeses(selectId, meses) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.warn('â ï¸ Select nÃ£o encontrado:', selectId);
        return;
    }
    
    // Guarda o valor atualmente selecionado
    const valorAtual = select.value;
    
    select.innerHTML = '';
    meses.forEach(mes => {
        const option = document.createElement('option');
        option.value = mes;
        option.textContent = mes;
        select.appendChild(option);
    });
    
    // Se o valor atual ainda Ã© vÃ¡lido, mantÃ©m; senÃ£o, define o Ãºltimo
    if (valorAtual && select.querySelector('option[value="' + valorAtual + '"]')) {
        select.value = valorAtual;
    } else if (meses.length > 0) {
        // Se for o select de fim, pega o Ãºltimo mÃªs
        if (selectId === 'fimMes') {
            select.value = meses[meses.length - 1];
        } else {
            // Se for o select de inÃ­cio, pega o primeiro mÃªs
            select.value = meses[0];
        }
    }
}

function popularPeriodosFallback() {
    
//     console.log('ð Usando fallback para perÃ­odos');
    
    const anoAtual = new Date().getFullYear();
    const inicioAno = document.getElementById('inicioAno');
    const fimAno = document.getElementById('fimAno');
    
    if (inicioAno && fimAno) {
        inicioAno.innerHTML = '';
        fimAno.innerHTML = '';
        
        for (let y = 1957; y <= anoAtual; y++) {
            const option1 = document.createElement('option');
            option1.value = y;
            option1.textContent = y;
            inicioAno.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = y;
            option2.textContent = y;
            fimAno.appendChild(option2);
        }
        
        inicioAno.value = 1957;
        fimAno.value = anoAtual;
        
        const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        preencherMeses('inicioMes', meses);
        preencherMeses('fimMes', meses);
    } else {
        console.error('â Selects de ano nÃ£o encontrados no fallback');
    }
}

function atualizarMesesPorAno(tipoDado, dashboard = 'dashboard1') {
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
    carregarPeriodosDisponiveis('producao', 'dashboard1');
    atualizarMesesPorAno('producao', 'dashboard1');
    initCentralDados();
});