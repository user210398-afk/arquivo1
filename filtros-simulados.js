(function () {
  'use strict';


  /* ============================================================
     MEDSIM — FILTROS DO HUB
     ============================================================ */

  const FAVORITES_KEY =
    'medsim_favoritos_v1';

  const FILTERS_KEY =
    'medsim_filtros_v1';

  const COMPLETED_KEY =
    'simulados_concluidos';

  const STYLE_ID =
    'medsim-filtros-style-v1';

  const PANEL_ID =
    'medsim-filtros-panel';

  const HIDDEN_CLASS =
    'medsim-filtro-oculto';


  let manifest =
    [];

  let manifestMap =
    new Map();

  let favoritos =
    carregarFavoritos();

  let estado =
    carregarEstado();

  let buscaInput =
    null;

  let aplicando =
    false;



  /* ============================================================
     REGRAS DE DISCIPLINA

     A disciplina é detectada pelo nome do arquivo.
     ============================================================ */

  const DISCIPLINAS = [

    {
      rx: /farmaco|farmacologia/i,
      nome: 'Farmacologia'
    },

    {
      rx: /fisiologia|endocrino|hip[oó]fise|pancre[aá]tic/i,
      nome: 'Fisiologia'
    },

    {
      rx: /imuno/i,
      nome: 'Imunologia'
    },

    {
      rx: /micro/i,
      nome: 'Microbiologia'
    },

    {
      rx: /parasito/i,
      nome: 'Parasitologia'
    },

    {
      rx: /patologia/i,
      nome: 'Patologia'
    },

    {
      rx: /propedeu|proped[eê]utica/i,
      nome: 'Propedêutica'
    },

    {
      rx: /psico/i,
      nome: 'Psicomed'
    },

    {
      rx: /vigil/i,
      nome: 'Vigilância em Saúde'
    }

  ];



  /* ============================================================
     CSS

     Usa variáveis do próprio Hub quando disponíveis.
     ============================================================ */

  const CSS = `

    #${PANEL_ID} {

      display:
        flex;

      flex-wrap:
        wrap;

      align-items:
        flex-end;

      gap:
        10px;


      margin:
        10px 0 16px;


      padding:
        12px;


      border:

        1px solid
        var(
          --border-color,
          rgba(148, 163, 184, 0.22)
        );


      border-radius:
        14px;


      background:

        var(
          --card-bg,
          rgba(255, 255, 255, 0.72)
        );


      box-shadow:

        0 4px 14px
        rgba(15, 23, 42, 0.05);


      backdrop-filter:
        blur(8px);

      -webkit-backdrop-filter:
        blur(8px);
    }



    #${PANEL_ID}
    .medsim-filter-field {

      display:
        flex;

      flex-direction:
        column;

      gap:
        5px;


      min-width:
        145px;


      flex:
        1 1 145px;
    }



    #${PANEL_ID}
    .medsim-filter-label {

      font-family:
        inherit;


      font-size:
        0.76rem;


      font-weight:
        700;


      color:

        var(
          --text-secondary,
          #64748b
        );
    }



    #${PANEL_ID}
    select {

      width:
        100%;


      min-height:
        38px;


      padding:
        8px 10px;


      border:

        1px solid
        var(
          --border-color,
          #dbe2ea
        );


      border-radius:
        10px;


      background:

        var(
          --card-bg,
          #ffffff
        );


      color:

        var(
          --text-primary,
          #0f172a
        );


      font-family:
        inherit;


      outline:
        none;


      cursor:
        pointer;
    }



    #${PANEL_ID}
    select:focus {

      border-color:

        var(
          --purple-primary,
          #6366f1
        );


      box-shadow:

        0 0 0 3px
        rgba(
          99,
          102,
          241,
          0.12
        );
    }



    /* ========================================================
       BOTÃO FAVORITOS
       ======================================================== */

    #${PANEL_ID}
    .medsim-fav-filter {

      min-height:
        38px;


      padding:
        8px 12px;


      border:

        1px solid
        var(
          --border-color,
          #dbe2ea
        );


      border-radius:
        10px;


      background:

        var(
          --card-bg,
          #ffffff
        );


      color:

        var(
          --text-primary,
          #0f172a
        );


      font-family:
        inherit;


      font-weight:
        700;


      cursor:
        pointer;


      transition:
        0.15s ease;
    }



    #${PANEL_ID}
    .medsim-fav-filter:hover {

      transform:
        translateY(-1px);
    }



    #${PANEL_ID}
    .medsim-fav-filter[
      data-active="true"
    ] {

      border-color:
        #f59e0b;


      background:

        rgba(
          245,
          158,
          11,
          0.10
        );


      color:
        #b45309;
    }



    /* ========================================================
       LIMPAR FILTROS
       ======================================================== */

    #${PANEL_ID}
    .medsim-clear-filter {

      min-height:
        38px;


      padding:
        8px 12px;


      border:
        1px solid transparent;


      border-radius:
        10px;


      background:
        transparent;


      color:

        var(
          --text-secondary,
          #64748b
        );


      font-family:
        inherit;


      font-weight:
        700;


      cursor:
        pointer;
    }



    #${PANEL_ID}
    .medsim-clear-filter:hover {

      background:

        rgba(
          148,
          163,
          184,
          0.08
        );
    }



    /* ========================================================
       RESUMO
       ======================================================== */

    #${PANEL_ID}
    .medsim-filter-summary {

      flex:
        1 0 100%;


      display:
        flex;


      justify-content:
        space-between;


      gap:
        10px;


      padding-top:
        2px;


      font-size:
        0.78rem;


      color:

        var(
          --text-secondary,
          #64748b
        );
    }



    /* ========================================================
       OCULTAR SIMULADOS
       ======================================================== */

    .${HIDDEN_CLASS} {

      display:
        none !important;
    }



    /* ========================================================
       ESTRELA DE FAVORITO
       ======================================================== */

    .medsim-favorite-toggle {

      position:
        absolute !important;


      top:
        8px !important;


      right:
        8px !important;


      z-index:
        20 !important;


      display:
        inline-flex !important;


      align-items:
        center !important;


      justify-content:
        center !important;


      width:
        34px !important;


      height:
        34px !important;


      padding:
        0 !important;


      margin:
        0 !important;


      border:

        1px solid
        rgba(
          148,
          163,
          184,
          0.24
        )

        !important;


      border-radius:
        10px !important;


      background:

        rgba(
          255,
          255,
          255,
          0.92
        )

        !important;


      color:
        #94a3b8 !important;


      font-family:
        inherit !important;


      font-size:
        18px !important;


      line-height:
        1 !important;


      cursor:
        pointer !important;


      box-shadow:

        0 3px 10px
        rgba(
          15,
          23,
          42,
          0.08
        )

        !important;


      transition:
        0.15s ease !important;
    }



    .medsim-favorite-toggle:hover {

      transform:

        translateY(-1px)
        scale(1.05)

        !important;
    }



    .medsim-favorite-toggle[
      data-favorite="true"
    ] {

      color:
        #f59e0b !important;


      background:
        #fffbeb !important;


      border-color:

        rgba(
          245,
          158,
          11,
          0.35
        )

        !important;
    }



    .medsim-filtro-item {

      position:
        relative !important;
    }



    /* ========================================================
       CELULAR
       ======================================================== */

    @media (
      max-width:
      700px
    ) {

      #${PANEL_ID} {

        padding:
          10px;

        gap:
          8px;
      }


      #${PANEL_ID}
      .medsim-filter-field {

        flex-basis:
          calc(50% - 4px);

        min-width:
          120px;
      }


      #${PANEL_ID}
      .medsim-filter-actions {

        width:
          100%;


        display:
          flex;


        gap:
          8px;
      }


      #${PANEL_ID}
      .medsim-filter-actions
      button {

        flex:
          1;
      }

    }

  `;



  /* ============================================================
     UTILIDADES
     ============================================================ */

  function parseJSON(
    valor,
    fallback
  ) {

    try {

      return JSON.parse(
        valor
      );

    } catch (_) {

      return fallback;
    }
  }



  function normalizarTexto(
    valor
  ) {

    return String(
      valor || ''
    )

      .normalize(
        'NFD'
      )

      .replace(
        /[\u0300-\u036f]/g,
        ''
      )

      .toLowerCase()

      .replace(
        /\s+/g,
        ' '
      )

      .trim();
  }



  function normalizarCaminho(
    valor
  ) {

    if (!valor) {

      return '';
    }


    let texto =
      String(
        valor
      ).trim();


    try {

      const url =
        new URL(
          texto,
          location.href
        );


      texto =
        decodeURIComponent(
          url.pathname
        );

    } catch (_) {

      try {

        texto =
          decodeURIComponent(
            texto
          );

      } catch (_) {}

    }


    return texto

      .replace(
        /\\/g,
        '/'
      )

      .replace(
        /^\/+/,
        ''
      )

      .replace(
        /^\.\//,
        ''
      )

      .toLowerCase();
  }



  function basename(
    caminho
  ) {

    return (
      normalizarCaminho(
        caminho
      )

        .split('/')

        .pop()

      || ''
    );
  }



  function tituloDoArquivo(
    arquivo
  ) {

    return basename(
      arquivo
    )

      .replace(
        /\.html?$/i,
        ''
      )

      .replace(
        /[-_]+/g,
        ' '
      )

      .replace(
        /\s+/g,
        ' '
      )

      .trim();
  }



  /* ============================================================
     DISCIPLINA
     ============================================================ */

  function detectarDisciplina(
    arquivo,
    titulo
  ) {

    const fonte =
      `${arquivo || ''} ${titulo || ''}`;


    const regra =
      DISCIPLINAS.find(
        item =>
          item.rx.test(
            fonte
          )
      );


    return regra
      ? regra.nome
      : 'Outros';
  }



  /* ============================================================
     ANO
     ============================================================ */

  function detectarAno(
    arquivo,
    titulo
  ) {

    const match =
      `${arquivo || ''} ${titulo || ''}`

        .match(
          /\b(20\d{2})\b/
        );


    return match
      ? match[1]
      : 'Sem ano';
  }



  /* ============================================================
     FAVORITOS
     ============================================================ */

  function carregarFavoritos() {

    const raw =
      parseJSON(

        localStorage.getItem(
          FAVORITES_KEY
        ),

        []

      );


    if (
      !Array.isArray(
        raw
      )
    ) {

      return new Set();
    }


    return new Set(

      raw

        .map(
          normalizarCaminho
        )

        .filter(
          Boolean
        )

    );
  }



  function salvarFavoritos() {

    localStorage.setItem(

      FAVORITES_KEY,

      JSON.stringify(
        [...favoritos]
      )

    );
  }



  /* ============================================================
     ESTADO DOS FILTROS
     ============================================================ */

  function carregarEstado() {

    const salvo =
      parseJSON(

        localStorage.getItem(
          FILTERS_KEY
        ),

        {}

      );


    return {

      disciplina:
        salvo.disciplina || '',

      ano:
        salvo.ano || '',

      status:
        salvo.status || '',

      somenteFavoritos:
        Boolean(
          salvo.somenteFavoritos
        )

    };
  }



  function salvarEstado() {

    localStorage.setItem(

      FILTERS_KEY,

      JSON.stringify(
        estado
      )

    );
  }



  /* ============================================================
     SIMULADOS.JSON
     ============================================================ */

  function normalizarManifesto(
    raw
  ) {

    let dados =
      [];


    if (
      Array.isArray(
        raw
      )
    ) {

      dados =
        raw;

    } else if (
      raw &&
      Array.isArray(
        raw.simulados
      )
    ) {

      dados =
        raw.simulados;

    } else if (
      raw &&
      Array.isArray(
        raw.items
      )
    ) {

      dados =
        raw.items;
    }



    return dados

      .map(
        item => {

          let arquivo =
            '';

          let titulo =
            '';

          let disciplina =
            '';

          let ano =
            '';


          /*
           * Aceita:
           *
           * ["arquivo.html"]
           *
           * ou:
           *
           * [{
           *   file: "...",
           *   title: "..."
           * }]
           */

          if (
            typeof item ===
            'string'
          ) {

            arquivo =
              item;

          } else if (
            item &&
            typeof item ===
            'object'
          ) {

            arquivo =

              item.file ||

              item.filename ||

              item.path ||

              item.url ||

              item.href ||

              item.src ||

              item.arquivo ||

              '';


            titulo =

              item.title ||

              item.name ||

              item.nome ||

              item.label ||

              '';


            disciplina =

              item.subject ||

              item.disciplina ||

              '';


            ano =
              String(

                item.year ||

                item.ano ||

                ''

              );
          }


          const caminho =
            normalizarCaminho(
              arquivo
            );


          if (
            !caminho ||
            !/\.html?$/i.test(
              caminho
            ) ||
            basename(
              caminho
            ) ===
              'index.html'
          ) {

            return null;
          }


          if (!titulo) {

            titulo =
              tituloDoArquivo(
                caminho
              );
          }


          if (!disciplina) {

            disciplina =
              detectarDisciplina(
                caminho,
                titulo
              );
          }


          if (!ano) {

            ano =
              detectarAno(
                caminho,
                titulo
              );
          }


          return {

            arquivo:
              caminho,

            base:
              basename(
                caminho
              ),

            titulo,

            disciplina,

            ano

          };

        }
      )

      .filter(
        Boolean
      );
  }



  async function carregarManifesto() {

    try {

      const resposta =
        await fetch(

          'simulados.json?v=' +
          Date.now(),

          {
            cache:
              'no-store'
          }

        );


      if (
        !resposta.ok
      ) {

        throw new Error(
          'HTTP ' +
          resposta.status
        );
      }


      manifest =
        normalizarManifesto(

          await resposta.json()

        );


      manifestMap =
        new Map();


      manifest.forEach(
        item => {

          manifestMap.set(
            item.arquivo,
            item
          );


          manifestMap.set(
            item.base,
            item
          );


          manifestMap.set(

            'simulados/' +
            item.base,

            item

          );

        }
      );


    } catch (erro) {

      console.warn(

        '[MedSim] Não foi possível ler simulados.json. ' +
        'Os filtros usarão os links encontrados no Hub.',

        erro

      );


      manifest =
        [];


      manifestMap =
        new Map();
    }
  }



  /* ============================================================
     CONCLUÍDOS
     ============================================================ */

  function extrairStrings(
    valor,
    saida = []
  ) {

    if (
      valor == null
    ) {

      return saida;
    }


    if (
      typeof valor ===
      'string'
    ) {

      saida.push(
        valor
      );


      return saida;
    }


    if (
      Array.isArray(
        valor
      )
    ) {

      valor.forEach(
        item => {

          extrairStrings(
            item,
            saida
          );

        }
      );


      return saida;
    }


    if (
      typeof valor ===
      'object'
    ) {

      Object.values(
        valor
      )

        .forEach(
          item => {

            extrairStrings(
              item,
              saida
            );

          }
        );
    }


    return saida;
  }



  function carregarConcluidos() {

    const raw =
      parseJSON(

        localStorage.getItem(
          COMPLETED_KEY
        ),

        []

      );


    const set =
      new Set();


    extrairStrings(
      raw
    )

      .forEach(
        valor => {

          const caminho =
            normalizarCaminho(
              valor
            );


          const base =
            basename(
              caminho
            );


          const texto =
            normalizarTexto(
              valor
            );


          if (caminho) {

            set.add(
              caminho
            );
          }


          if (base) {

            set.add(
              base
            );
          }


          if (texto) {

            set.add(
              texto
            );
          }

        }
      );


    return set;
  }



  /* ============================================================
     BUSCA EXISTENTE
     ============================================================ */

  function detectarBusca() {

    const inputs = [

      ...document.querySelectorAll(
        'input'
      )

    ];


    buscaInput =
      inputs.find(
        input => {

          const tipo =
            (
              input.type ||
              ''
            ).toLowerCase();


          const dica =
            normalizarTexto(

              `${input.placeholder || ''}
               ${input.getAttribute('aria-label') || ''}
               ${input.id || ''}
               ${input.className || ''}`

            );


          return (

            tipo ===
              'search'

            ||

            /buscar|pesquisar|search|simulado/
              .test(
                dica
              )

          );
        }
      )

      || null;


    if (
      buscaInput &&
      buscaInput.dataset
        .medsimFiltros !==
        '1'
    ) {

      buscaInput.dataset
        .medsimFiltros =
        '1';


      buscaInput.addEventListener(

        'input',

        agendarAplicacao

      );


      buscaInput.addEventListener(

        'search',

        agendarAplicacao

      );
    }
  }



  /* ============================================================
     IDENTIFICAR ARQUIVO DO SIMULADO
     ============================================================ */

  function obterCaminho(
    elemento
  ) {

    const atributos = [

      elemento.getAttribute(
        'href'
      ),

      elemento.getAttribute(
        'data-file'
      ),

      elemento.getAttribute(
        'data-path'
      ),

      elemento.getAttribute(
        'data-src'
      ),

      elemento.getAttribute(
        'data-simulado'
      )

    ].filter(
      Boolean
    );


    for (
      const valor
      of atributos
    ) {

      if (
        /\.html?(?:[?#]|$)/i
          .test(
            valor
          )
      ) {

        return normalizarCaminho(

          valor.split(
            /[?#]/
          )[0]

        );
      }
    }



    /*
     * Caso seja:
     *
     * onclick="carregarSimulado('arquivo.html')"
     */

    const onclick =
      elemento.getAttribute(
        'onclick'
      )

      || '';


    const match =
      onclick.match(

        /["']([^"']+\.html?(?:[?#][^"']*)?)["']/i

      );


    if (
      match
    ) {

      return normalizarCaminho(

        match[1].split(
          /[?#]/
        )[0]

      );
    }


    return '';
  }



  /* ============================================================
     METADADOS
     ============================================================ */

  function obterMetadados(
    caminho,
    elemento
  ) {

    const normalizado =
      normalizarCaminho(
        caminho
      );


    const base =
      basename(
        normalizado
      );


    const conhecido =

      manifestMap.get(
        normalizado
      )

      ||

      manifestMap.get(
        base
      )

      ||

      manifestMap.get(

        'simulados/' +
        base

      );


    if (
      conhecido
    ) {

      return conhecido;
    }


    if (
      !normalizado ||
      !/\.html?$/i.test(
        normalizado
      ) ||
      base ===
        'index.html'
    ) {

      return null;
    }


    const titulo =

      (
        elemento.textContent ||
        ''
      ).trim()

      ||

      tituloDoArquivo(
        normalizado
      );


    return {

      arquivo:
        normalizado,

      base,

      titulo,

      disciplina:
        detectarDisciplina(
          normalizado,
          titulo
        ),

      ano:
        detectarAno(
          normalizado,
          titulo
        )

    };
  }



  /* ============================================================
     CONTAINER DO CARD
     ============================================================ */

  function obterContainer(
    elemento
  ) {

    const seletores = [

      '[data-simulado-item]',

      '.simulado-card',

      '.simulado-item',

      '.simulation-card',

      '.card',

      'article',

      'li'

    ];


    for (
      const seletor
      of seletores
    ) {

      const encontrado =
        elemento.closest(
          seletor
        );


      if (
        encontrado &&
        !encontrado.closest(
          '#' + PANEL_ID
        )
      ) {

        return encontrado;
      }
    }


    /*
     * Fallback.
     */

    if (
      elemento.parentElement &&
      elemento.parentElement !==
        document.body
    ) {

      return elemento.parentElement;
    }


    return elemento;
  }



  /* ============================================================
     COLETAR SIMULADOS VISÍVEIS NO HUB
     ============================================================ */

  function coletarItens() {

    const seletores = [

      'a[href*=".html"]',

      'button[onclick*=".html"]',

      '[onclick*="carregarSimulado"]',

      '[data-file*=".html"]',

      '[data-path*=".html"]',

      '[data-src*=".html"]',

      '[data-simulado*=".html"]'

    ].join(
      ','
    );


    const resultado =
      [];


    const containers =
      new Set();



    document
      .querySelectorAll(
        seletores
      )

      .forEach(
        elemento => {

          if (
            elemento.closest(
              '#' + PANEL_ID
            )
          ) {

            return;
          }


          const caminho =
            obterCaminho(
              elemento
            );


          const meta =
            obterMetadados(
              caminho,
              elemento
            );


          if (
            !meta
          ) {

            return;
          }



          /*
           * Se simulados.json foi carregado,
           * só considera arquivos que aparecem nele.
           */

          if (
            manifest.length
          ) {

            const conhecido =

              manifestMap.has(
                meta.arquivo
              )

              ||

              manifestMap.has(
                meta.base
              )

              ||

              manifestMap.has(

                'simulados/' +
                meta.base

              );


            if (
              !conhecido
            ) {

              return;
            }
          }


          const container =
            obterContainer(
              elemento
            );


          if (
            !container ||
            containers.has(
              container
            )
          ) {

            return;
          }


          containers.add(
            container
          );


          resultado.push({

            elemento,

            container,

            meta

          });

        }
      );


    return resultado;
  }



  /* ============================================================
     CSS
     ============================================================ */

  function garantirCSS() {

    if (
      document.getElementById(
        STYLE_ID
      )
    ) {

      return;
    }


    const style =
      document.createElement(
        'style'
      );


    style.id =
      STYLE_ID;


    style.textContent =
      CSS;


    document.head.appendChild(
      style
    );
  }



  /* ============================================================
     ORDENAÇÃO
     ============================================================ */

  function unicosOrdenados(
    valores,
    anos = false
  ) {

    const lista = [

      ...new Set(
        valores.filter(
          Boolean
        )
      )

    ];


    if (
      anos
    ) {

      return lista.sort(
        (a, b) => {

          if (
            a ===
            'Sem ano'
          ) {

            return 1;
          }


          if (
            b ===
            'Sem ano'
          ) {

            return -1;
          }


          return (
            Number(b) -
            Number(a)
          );
        }
      );
    }


    return lista.sort(
      (a, b) =>

        a.localeCompare(
          b,
          'pt-BR'
        )

    );
  }



  /* ============================================================
     ONDE INSERIR OS FILTROS
     ============================================================ */

  function encontrarAncora() {

    detectarBusca();


    /*
     * Se encontrar a busca existente,
     * coloca os filtros logo abaixo dela.
     */

    if (
      buscaInput
    ) {

      const bloco =

        buscaInput.closest(
          '.search-container'
        )

        ||

        buscaInput.closest(
          '.search-box'
        )

        ||

        buscaInput.closest(
          '.search-bar'
        )

        ||

        buscaInput.closest(
          'form'
        )

        ||

        buscaInput.parentElement;


      if (
        bloco &&
        bloco.parentElement
      ) {

        return {

          pai:
            bloco.parentElement,

          depois:
            bloco

        };
      }
    }


    /*
     * Fallback: início do conteúdo principal.
     */

    const main =
      document.querySelector(

        'main, .main-content, .content, #main-content, #content'

      );


    if (
      main
    ) {

      return {

        pai:
          main,

        antes:
          main.firstChild

      };
    }


    return {

      pai:
        document.body,

      antes:
        document.body.firstChild

    };
  }



  /* ============================================================
     OPTION
     ============================================================ */

  function criarOption(
    valor,
    texto,
    selecionado
  ) {

    const option =
      document.createElement(
        'option'
      );


    option.value =
      valor;


    option.textContent =
      texto;


    option.selected =
      selecionado ===
      valor;


    return option;
  }



  /* ============================================================
     CAMPO
     ============================================================ */

  function criarCampo(
    titulo,
    select
  ) {

    const campo =
      document.createElement(
        'label'
      );


    campo.className =
      'medsim-filter-field';


    const label =
      document.createElement(
        'span'
      );


    label.className =
      'medsim-filter-label';


    label.textContent =
      titulo;


    campo.append(
      label,
      select
    );


    return campo;
  }



  /* ============================================================
     PAINEL
     ============================================================ */

  function criarPainel(
    itens
  ) {

    let painel =
      document.getElementById(
        PANEL_ID
      );


    if (
      painel
    ) {

      return painel;
    }


    painel =
      document.createElement(
        'section'
      );


    painel.id =
      PANEL_ID;


    painel.setAttribute(
      'aria-label',
      'Filtros de simulados'
    );



    /* --------------------------------------------------------
       DISCIPLINA
       -------------------------------------------------------- */

    const selectDisciplina =
      document.createElement(
        'select'
      );


    selectDisciplina.id =
      'medsim-filter-disciplina';


    selectDisciplina.appendChild(

      criarOption(
        '',
        'Todas',
        estado.disciplina
      )

    );


    unicosOrdenados(

      itens.map(
        item =>
          item.meta.disciplina
      )

    ).forEach(
      disciplina => {

        selectDisciplina.appendChild(

          criarOption(
            disciplina,
            disciplina,
            estado.disciplina
          )

        );

      }
    );



    /* --------------------------------------------------------
       ANO
       -------------------------------------------------------- */

    const selectAno =
      document.createElement(
        'select'
      );


    selectAno.id =
      'medsim-filter-ano';


    selectAno.appendChild(

      criarOption(
        '',
        'Todos',
        estado.ano
      )

    );


    unicosOrdenados(

      itens.map(
        item =>
          item.meta.ano
      ),

      true

    ).forEach(
      ano => {

        selectAno.appendChild(

          criarOption(
            ano,
            ano,
            estado.ano
          )

        );

      }
    );



    /* --------------------------------------------------------
       STATUS
       -------------------------------------------------------- */

    const selectStatus =
      document.createElement(
        'select'
      );


    selectStatus.id =
      'medsim-filter-status';


    selectStatus.append(

      criarOption(
        '',
        'Todos',
        estado.status
      ),

      criarOption(
        'concluido',
        'Concluídos',
        estado.status
      ),

      criarOption(
        'pendente',
        'Não concluídos',
        estado.status
      )

    );



    /* --------------------------------------------------------
       FAVORITOS
       -------------------------------------------------------- */

    const btnFavoritos =
      document.createElement(
        'button'
      );


    btnFavoritos.type =
      'button';


    btnFavoritos.id =
      'medsim-filter-favoritos';


    btnFavoritos.className =
      'medsim-fav-filter';


    btnFavoritos.textContent =
      '★ Favoritos';


    btnFavoritos.dataset.active =
      String(
        estado.somenteFavoritos
      );


    btnFavoritos.setAttribute(

      'aria-pressed',

      String(
        estado.somenteFavoritos
      )

    );



    /* --------------------------------------------------------
       LIMPAR
       -------------------------------------------------------- */

    const btnLimpar =
      document.createElement(
        'button'
      );


    btnLimpar.type =
      'button';


    btnLimpar.className =
      'medsim-clear-filter';


    btnLimpar.textContent =
      'Limpar filtros';



    const acoes =
      document.createElement(
        'div'
      );


    acoes.className =
      'medsim-filter-actions';


    acoes.append(
      btnFavoritos,
      btnLimpar
    );



    /* --------------------------------------------------------
       CONTADORES
       -------------------------------------------------------- */

    const resumo =
      document.createElement(
        'div'
      );


    resumo.className =
      'medsim-filter-summary';


    resumo.innerHTML = `

      <span id="medsim-filter-count">
        0 simulados
      </span>

      <span id="medsim-filter-fav-count">
        0 favoritos
      </span>

    `;



    painel.append(

      criarCampo(
        'Disciplina',
        selectDisciplina
      ),

      criarCampo(
        'Ano',
        selectAno
      ),

      criarCampo(
        'Status',
        selectStatus
      ),

      acoes,

      resumo

    );



    /* --------------------------------------------------------
       INSERÇÃO
       -------------------------------------------------------- */

    const ancora =
      encontrarAncora();


    if (
      ancora.depois
    ) {

      ancora.depois
        .insertAdjacentElement(
          'afterend',
          painel
        );

    } else {

      ancora.pai.insertBefore(

        painel,

        ancora.antes ||
        null

      );
    }



    /* ========================================================
       EVENTOS
       ======================================================== */

    selectDisciplina
      .addEventListener(

        'change',

        function () {

          estado.disciplina =
            selectDisciplina.value;


          salvarEstado();

          aplicarFiltros();
        }

      );



    selectAno
      .addEventListener(

        'change',

        function () {

          estado.ano =
            selectAno.value;


          salvarEstado();

          aplicarFiltros();
        }

      );



    selectStatus
      .addEventListener(

        'change',

        function () {

          estado.status =
            selectStatus.value;


          salvarEstado();

          aplicarFiltros();
        }

      );



    btnFavoritos
      .addEventListener(

        'click',

        function () {

          estado.somenteFavoritos =
            !estado.somenteFavoritos;


          btnFavoritos.dataset.active =
            String(
              estado.somenteFavoritos
            );


          btnFavoritos.setAttribute(

            'aria-pressed',

            String(
              estado.somenteFavoritos
            )

          );


          salvarEstado();

          aplicarFiltros();
        }

      );



    btnLimpar
      .addEventListener(

        'click',

        function () {

          estado = {

            disciplina:
              '',

            ano:
              '',

            status:
              '',

            somenteFavoritos:
              false

          };


          selectDisciplina.value =
            '';


          selectAno.value =
            '';


          selectStatus.value =
            '';


          btnFavoritos.dataset.active =
            'false';


          btnFavoritos.setAttribute(
            'aria-pressed',
            'false'
          );


          salvarEstado();

          aplicarFiltros();
        }

      );


    return painel;
  }



  /* ============================================================
     FAVORITO
     ============================================================ */

  function chaveFavorito(
    meta
  ) {

    return (
      meta.arquivo ||
      meta.base
    );
  }



  function ehFavorito(
    meta
  ) {

    return (

      favoritos.has(
        chaveFavorito(
          meta
        )
      )

      ||

      favoritos.has(
        meta.base
      )

    );
  }



  function decorarFavorito(
    item
  ) {

    const container =
      item.container;


    container.classList.add(
      'medsim-filtro-item'
    );


    let botao =
      container.querySelector(

        ':scope > .medsim-favorite-toggle'

      );


    if (
      !botao
    ) {

      botao =
        document.createElement(
          'button'
        );


      botao.type =
        'button';


      botao.className =
        'medsim-favorite-toggle';


      botao.textContent =
        '★';


      container.appendChild(
        botao
      );


      botao.addEventListener(

        'click',

        function (event) {

          /*
           * Impede que clicar na estrela
           * abra o simulado.
           */

          event.preventDefault();

          event.stopPropagation();

          event.stopImmediatePropagation();


          const chave =
            botao.dataset
              .favoriteKey;


          if (
            !chave
          ) {

            return;
          }


          if (
            favoritos.has(
              chave
            )
          ) {

            favoritos.delete(
              chave
            );

          } else {

            favoritos.add(
              chave
            );
          }


          salvarFavoritos();

          atualizarEstrelas();

          aplicarFiltros();

        },

        true

      );
    }



    const chave =
      chaveFavorito(
        item.meta
      );


    botao.dataset.favoriteKey =
      chave;


    const ativo =
      ehFavorito(
        item.meta
      );


    botao.dataset.favorite =
      String(
        ativo
      );


    botao.title =
      ativo
        ? 'Remover dos favoritos'
        : 'Adicionar aos favoritos';


    botao.setAttribute(
      'aria-label',
      botao.title
    );
  }



  function atualizarEstrelas() {

    document
      .querySelectorAll(
        '.medsim-favorite-toggle'
      )

      .forEach(
        botao => {

          const chave =
            botao.dataset
              .favoriteKey;


          const ativo =
            Boolean(

              chave &&
              favoritos.has(
                chave
              )

            );


          botao.dataset.favorite =
            String(
              ativo
            );


          botao.title =
            ativo
              ? 'Remover dos favoritos'
              : 'Adicionar aos favoritos';


          botao.setAttribute(
            'aria-label',
            botao.title
          );

        }
      );
  }



  /* ============================================================
     CONCLUÍDO
     ============================================================ */

  function estaConcluido(
    item,
    concluidos
  ) {

    const candidatos = [

      item.meta.arquivo,

      item.meta.base,

      normalizarTexto(
        item.meta.titulo
      ),

      normalizarTexto(
        item.container
          .textContent
      )

    ].filter(
      Boolean
    );


    return candidatos.some(
      valor =>
        concluidos.has(
          valor
        )
    );
  }



  /* ============================================================
     BUSCA
     ============================================================ */

  function correspondeBusca(
    item
  ) {

    if (
      !buscaInput
    ) {

      return true;
    }


    const busca =
      normalizarTexto(
        buscaInput.value
      );


    if (
      !busca
    ) {

      return true;
    }


    const texto =
      normalizarTexto(`

        ${item.meta.titulo}

        ${item.meta.disciplina}

        ${item.meta.ano}

        ${item.meta.arquivo}

        ${item.container.textContent || ''}

      `);


    return texto.includes(
      busca
    );
  }



  /* ============================================================
     APLICAR FILTROS
     ============================================================ */

  function aplicarFiltros() {

    if (
      aplicando
    ) {

      return;
    }


    aplicando =
      true;


    try {

      detectarBusca();


      const concluidos =
        carregarConcluidos();


      const itens =
        coletarItens();


      if (
        itens.length &&
        !document.getElementById(
          PANEL_ID
        )
      ) {

        criarPainel(
          itens
        );
      }



      let visiveis =
        0;



      itens.forEach(
        item => {

          decorarFavorito(
            item
          );


          const concluido =
            estaConcluido(
              item,
              concluidos
            );


          const favorito =
            ehFavorito(
              item.meta
            );


          const disciplinaOK =

            !estado.disciplina

            ||

            item.meta.disciplina ===
              estado.disciplina;



          const anoOK =

            !estado.ano

            ||

            item.meta.ano ===
              estado.ano;



          const statusOK =

            !estado.status

            ||

            (
              estado.status ===
                'concluido'

              &&

              concluido
            )

            ||

            (
              estado.status ===
                'pendente'

              &&

              !concluido
            );



          const favoritosOK =

            !estado.somenteFavoritos

            ||

            favorito;



          const buscaOK =
            correspondeBusca(
              item
            );



          const mostrar =

            disciplinaOK &&

            anoOK &&

            statusOK &&

            favoritosOK &&

            buscaOK;



          item.container
            .classList
            .toggle(

              HIDDEN_CLASS,

              !mostrar

            );


          if (
            mostrar
          ) {

            visiveis++;
          }

        }
      );



      /* ========================================================
         CONTADORES
         ======================================================== */

      const contador =
        document.getElementById(
          'medsim-filter-count'
        );


      const contadorFavoritos =
        document.getElementById(
          'medsim-filter-fav-count'
        );


      if (
        contador
      ) {

        contador.textContent =

          `${visiveis} ${
            visiveis === 1
              ? 'simulado'
              : 'simulados'
          }`;
      }


      if (
        contadorFavoritos
      ) {

        contadorFavoritos.textContent =

          `${favoritos.size} ${
            favoritos.size === 1
              ? 'favorito'
              : 'favoritos'
          }`;
      }


    } finally {

      aplicando =
        false;
    }
  }



  /* ============================================================
     AGENDAMENTO
     ============================================================ */

  let agendado =
    false;


  function agendarAplicacao() {

    if (
      agendado
    ) {

      return;
    }


    agendado =
      true;


    requestAnimationFrame(
      function () {

        agendado =
          false;


        aplicarFiltros();

      }
    );
  }



  /* ============================================================
     OBSERVAR HUB

     Caso o index regenere a lista de simulados.
     ============================================================ */

  function observarHub() {

    const observer =
      new MutationObserver(
        function (mutations) {

          const relevante =
            mutations.some(
              mutation =>

                [...mutation.addedNodes]
                  .some(
                    node => {

                      if (
                        node.nodeType !==
                        1
                      ) {

                        return false;
                      }


                      return !node.closest?.(
                        '#' + PANEL_ID
                      );
                    }
                  )
            );


          if (
            relevante
          ) {

            agendarAplicacao();
          }

        }
      );


    observer.observe(

      document.body,

      {

        childList:
          true,

        subtree:
          true

      }

    );
  }



  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */

  async function iniciar() {

    garantirCSS();


    /*
     * Lê simulados.json.
     */

    await carregarManifesto();


    detectarBusca();


    aplicarFiltros();


    observarHub();



    /* --------------------------------------------------------
       OUTRA ABA ALTEROU DADOS
       -------------------------------------------------------- */

    window.addEventListener(

      'storage',

      function (event) {

        if (
          event.key ===
          FAVORITES_KEY
        ) {

          favoritos =
            carregarFavoritos();


          agendarAplicacao();
        }


        if (
          event.key ===
          COMPLETED_KEY
        ) {

          agendarAplicacao();
        }

      }

    );



    /* --------------------------------------------------------
       VOLTOU PARA A ABA
       -------------------------------------------------------- */

    window.addEventListener(

      'focus',

      agendarAplicacao

    );



    document.addEventListener(

      'visibilitychange',

      function () {

        if (
          !document.hidden
        ) {

          agendarAplicacao();
        }

      }

    );



    /*
     * O evento "storage" não dispara quando
     * localStorage muda na MESMA aba.
     *
     * Por isso verificamos discretamente a
     * cada 2 segundos.
     */

    setInterval(

      function () {

        if (
          !document.hidden
        ) {

          agendarAplicacao();
        }

      },

      2000

    );


    console.info(
      '[MedSim] Filtros do Hub ativos.'
    );
  }



  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(

      'DOMContentLoaded',

      iniciar,

      {
        once:
          true
      }

    );

  } else {

    iniciar();
  }

})();
