/* Inteligência de Mercado · Indicadores — helpers do design system IM v1. Só forma e navegação, nenhum dado. */
(function () {
  var LINKS = [
    { id: 'hub', label: 'Hub', url: 'https://claude.ai/artifact/V1bVorfGMvbgGWoQbHjA1r' },
    { id: 'overall', label: 'Overall Michelin', url: 'https://claude.ai/artifact/BLaQZRNXjzwTWnfyC96Qf9' },
    { id: 'anfavea', label: 'Autoveículos', url: 'https://claude.ai/artifact/BFjv7uaNAb6ZKscpYy2Y1m' },
    { id: 'anp', label: 'Combustíveis', url: 'https://claude.ai/artifact/5zCFL7zy2UTQxKTgj4Lk5P' },
    { id: 'abcr', label: 'Fluxo pedagiado', url: 'https://claude.ai/artifact/4QNxE4hMyDfYFqYGQHaAQ4' },
    { id: 'pim', label: 'Produção industrial', url: 'https://claude.ai/artifact/FBhGpvwfJWYiW2esC4Pb8J' },
  ];
  var CATS = {
    light: ['#2a62a0', '#c8452c', '#1f8a70', '#b07a1f', '#8a4f8f', '#6b7d2a', '#c0577a', '#5b5fc7'],
    dark: ['#5a8fd0', '#e0603f', '#2fa385', '#b8842a', '#a874b2', '#8a9c3f', '#d06f94', '#8a86e8'],
  };
  function root(el) { return el || document.querySelector('.im') || document.documentElement; }
  function isDark(el) { return getComputedStyle(root(el)).getPropertyValue('--mode').trim() === 'dark'; }
  window.IM = {
    links: LINKS,
    // paleta categórica do tema atual (hex), para d3; chame dentro de cada desenho
    colors: function (el) { return (isDark(el) ? CATS.dark : CATS.light).slice(); },
    tok: function (name, el) { return getComputedStyle(root(el)).getPropertyValue(name).trim(); },
    isDark: isDark,
    // monta a barra do projeto dentro de `host`; `current` é o id da página
    bar: function (host, current) {
      if (!host) return;
      host.classList.add('im-bar');
      host.replaceChildren();
      var brand = document.createElement('a');
      brand.className = 'im-bar-brand'; brand.href = LINKS[0].url; brand.target = '_blank'; brand.rel = 'noopener';
      var b = document.createElement('b'); b.textContent = 'Inteligência de Mercado';
      brand.append(b, document.createTextNode('Indicadores'));
      var nav = document.createElement('nav'); nav.className = 'im-bar-nav'; nav.setAttribute('aria-label', 'Painéis do projeto');
      LINKS.forEach(function (l) {
        if (l.id === 'hub') return;
        var a = document.createElement('a'); a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = l.label;
        if (l.id === current) a.setAttribute('aria-current', 'page');
        nav.append(a);
      });
      host.append(brand, nav);
    },
  };
})();
