(function () {
  'use strict';

  const FAV_KEY = 'medsim_favoritos_v1';
  const FILTER_KEY = 'medsim_filtros_v2';
  const DONE_KEY = 'simulados_concluidos';

  const PANEL_ID = 'medsim-filtros-v2';
  const TRIGGER_ID = 'medsim-filtros-v2-btn';

  const HIDE = 'medsim-filtro-v2-hide';
  const STYLE_ID = 'medsim-filtros-v2-style';


  /* ============================================================
     DISCIPLINAS
     ============================================================ */

  const SUBJECTS = [

    [
      /farmaco|farmacologia/i,
      'Farmacologia'
    ],

    [
      /fisiologia|endocrino|hip[oó]fise|pancre[aá]tic/i,
      'Fisiologia'
    ],

    [
      /imuno/i,
      'Imunologia'
    ],

    [
      /micro/i,
      'Microbiologia'
    ],

    [
      /parasito/i,
      'Parasitologia'
    ],

    [
      /patologia/i,
      'Patologia'
    ],

    [
      /propedeu|proped[eê]utica/i,
      'Propedêutica'
    ],

    [
      /psico/i,
      'Psicomed'
    ],

    [
      /vigil/i,
      'Vigilância em Saúde'
    ]

  ];


  let manifest = [];

  let map =
    new Map();

  let favorites =
    loadFavorites();

  let applied =
    loadFilters();

  let draft = {
    ...applied
  };

  let searchInput =
    null;

  let open =
    false;

  let refreshTimer =
    0;



  /* ============================================================
     CSS
     ============================================================ */

  const CSS = `

    /* ========================================================
       BOTÃO FILTROS AO LADO DA PESQUISA
       ======================================================== */

    #${TRIGGER_ID} {

      display:
        inline-flex;

      align-items:
        center;

      justify-content:
        center;

      gap:
        6px;


      min-height:
        36px;


      margin-left:
        8px;


      padding:
        8px 11px;


      border:

        1px solid
        var(
          --border-color,
          rgba(148,163,184,.30)
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


      font:
        inherit;


      font-size:
        .82rem;


      font-weight:
        700;


      cursor:
        pointer;


      white-space:
        nowrap;


      box-shadow:

        0 2px 8px
        rgba(
          15,
          23,
          42,
          .06
        );
    }



    /* Filtros ativos */

    #${TRIGGER_ID}[
      data-active="true"
    ] {

      border-color:

        var(
          --purple-primary,
          #6366f1
        );


      color:

        var(
          --purple-primary,
          #6366f1
        );


      background:

        rgba(
          99,
          102,
          241,
          .08
        );
    }



    /* ========================================================
       PAINEL FLUTUANTE

       Não ocupa espaço quando fechado.
       ======================================================== */

    #${PANEL_ID} {

      position:
        fixed;


      z-index:
        2147482000;


      display:
        none;


      width:

        min(
          430px,
          calc(100vw - 24px)
        );


      max-height:
        calc(100vh - 24px);


      overflow:
        auto;


      box-sizing:
        border-box;


      padding:
        14px;


      border:

        1px solid
        var(
          --border-color,
          rgba(148,163,184,.28)
        );


      border-radius:
        16px;


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


      box-shadow:

        0 18px 45px
        rgba(
          15,
          23,
          42,
          .18
        ),

        0 4px 12px
        rgba(
          15,
          23,
          42,
          .08
        );


      backdrop-filter:
        blur(14px);
    }



    #${PANEL_ID}[
      data-open="true"
    ] {

      display:
        block;
    }



    /* ========================================================
       CABEÇALHO
       ======================================================== */

    #${PANEL_ID}
    .head {

      display:
        flex;

      align-items:
        center;

      justify-content:
        space-between;

      gap:
        10px;


      margin-bottom:
        12px;
    }



    #${PANEL_ID}
    .title {

      font-size:
        .95rem;

      font-weight:
        800;
    }



    #${PANEL_ID}
    .close {

      width:
        32px;

      height:
        32px;


      border:
        0;


      border-radius:
        9px;


      background:
        transparent;


      color:

        var(
          --text-secondary,
          #64748b
        );


      font:
        inherit;


      font-size:
        20px;


      cursor:
        pointer;
    }



    /* ========================================================
       CAMPOS
       ======================================================== */

    #${PANEL_ID}
    .grid {

      display:
        grid;


      grid-template-columns:
        1fr 1fr;


      gap:
        10px;
    }



    #${PANEL_ID}
    label.field {

      display:
        flex;


      flex-direction:
        column;


      gap:
        5px;


      min-width:
        0;
    }



    #${PANEL_ID}
    .full {

      grid-column:
        1 / -1;
    }



    #${PANEL_ID}
    .label {

      font-size:
        .74rem;


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
        39px;


      box-sizing:
        border-box;


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


      font:
        inherit;


      outline:
        none;
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
          .12
        );
    }



    /* ========================================================
       FAVORITOS
       ======================================================== */

    #${PANEL_ID}
    .favcheck {

      display:
        flex;


      align-items:
        center;


      gap:
        9px;


      min-height:
        39px;


      padding:
        8px 10px;


      box-sizing:
        border-box;


      border:

        1px solid
        var(
          --border-color,
          #dbe2ea
        );


      border-radius:
        10px;


      cursor:
        pointer;


      user-select:
        none;
    }



    #${PANEL_ID}
    .favcheck input {

      accent-color:
        #f59e0b;
    }



    /* ========================================================
       RESUMO
       ======================================================== */

    #${PANEL_ID}
    .summary {

      margin-top:
        11px;


      padding-top:
        10px;


      border-top:

        1px solid
        var(
          --border-color,
          rgba(148,163,184,.20)
        );


      color:

        var(
          --text-secondary,
          #64748b
        );


      font-size:
        .77rem;
    }



    /* ========================================================
       BOTÕES
       ======================================================== */

    #${PANEL_ID}
    .actions {

      display:
        grid;


      grid-template-columns:
        1fr 1.6fr;


      gap:
        8px;


      margin-top:
        12px;
    }



    #${PANEL_ID}
    .actions button {

      min-height:
        40px;


      border-radius:
        10px;


      font:
        inherit;


      font-weight:
        750;


      cursor:
        pointer;
    }



    #${PANEL_ID}
    .clear {

      border:

        1px solid
        var(
          --border-color,
          #dbe2ea
        );


      background:
        transparent;


      color:

        var(
          --text-secondary,
          #64748b
        );
    }



    #${PANEL_ID}
    .apply {

      border:
        1px solid transparent;


      color:
        #ffffff;


      background:

        linear-gradient(
          135deg,
          #4f46e5,
          #7c3aed
        );


      box-shadow:

        0 4px 12px
        rgba(
          79,
          70,
          229,
          .20
        );
    }



    /* ========================================================
       SIMULADO FILTRADO
       ======================================================== */

    .${HIDE} {

      display:
        none !important;
    }



    /* ========================================================
       FAVORITO NO CARD
       ======================================================== */

    .medsim-filter-card {

      position:
        relative !important;
    }



    .medsim-fav-star {

      position:
        absolute !important;


      top:
        8px !important;


      right:
        8px !important;


      z-index:
        25 !important;


      display:
        inline-flex !important;


      align-items:
        center !important;


      justify-content:
        center !important;


      width:
        32px !important;


      height:
        32px !important;


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
          .28
        )

        !important;


      border-radius:
        9px !important;


      background:

        rgba(
          255,
          255,
          255,
          .92
        )

        !important;


      color:
        #94a3b8 !important;


      font:
        inherit !important;


      font-size:
        17px !important;


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
          .08
        )

        !important;
    }



    .medsim-fav-star[
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
          .35
        )

        !important;
    }



    /* ========================================================
       CELULAR
       ======================================================== */

    @media (
      max-width:
      600px
    ) {

      #${PANEL_ID}
      .grid {

        grid-template-columns:
          1fr;
      }


      #${PANEL_ID}
      .full {

        grid-column:
          auto;
      }


      #${TRIGGER_ID} {

        margin-left:
          6px;


        padding-inline:
          9px;
      }

    }

  `;



  /* ============================================================
     UTILIDADES
     ============================================================ */

  function j(
    value,
    fallback
  ) {

    try {

      return JSON.parse(
        value
      );

    } catch (_) {

      return fallback;
    }
  }



  function txt(
    value
  ) {

    return String(
      value || ''
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



  function path(
    value
  ) {

    if (!value) {

      return '';
    }


    let text =
      String(
        value
      ).trim();


    try {

      text =
        decodeURIComponent(

          new URL(
            text,
            location.href
          ).pathname

        );

    } catch (_) {

      try {

        text =
          decodeURIComponent(
            text
          );

      } catch (_) {}

    }


    return text

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



  function base(
    value
  ) {

    return (

      path(
        value
      )

        .split('/')

        .pop()

      ||

      ''

    );
  }



  function titleFromFile(
    value
  ) {

    return base(
      value
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
     DISCIPLINA / ANO
     ============================================================ */

  function subject(
    file,
    title
  ) {

    const source =
      `${file} ${title}`;


    const rule =
      SUBJECTS.find(
        ([rx]) =>
          rx.test(
            source
          )
      );


    return rule
      ? rule[1]
      : 'Outros';
  }



  function year(
    file,
    title
  ) {

    const match =
      `${file} ${title}`

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

  function loadFavorites() {

    const array =
      j(

        localStorage.getItem(
          FAV_KEY
        ),

        []

      );


    return new Set(

      Array.isArray(
        array
      )

        ? array
            .map(
              path
            )
            .filter(
              Boolean
            )

        : []

    );
  }



  function saveFavorites() {

    localStorage.setItem(

      FAV_KEY,

      JSON.stringify(
        [...favorites]
      )

    );
  }



  /* ============================================================
     FILTROS SALVOS
     ============================================================ */

  function loadFilters() {

    const object =
      j(

        localStorage.getItem(
          FILTER_KEY
        ),

        {}

      );


    return {

      subject:
        object.subject || '',

      year:
        object.year || '',

      status:
        object.status || '',

      favoritesOnly:
        Boolean(
          object.favoritesOnly
        )

    };
  }



  function saveFilters() {

    localStorage.setItem(

      FILTER_KEY,

      JSON.stringify(
        applied
      )

    );
  }



  /* ============================================================
     CONCLUÍDOS
     ============================================================ */

  function collectStrings(
    value,
    output = []
  ) {

    if (
      value == null
    ) {

      return output;
    }


    if (
      typeof value ===
      'string'
    ) {

      output.push(
        value
      );


      return output;
    }


    if (
      Array.isArray(
        value
      )
    ) {

      value.forEach(
        item =>
          collectStrings(
            item,
            output
          )
      );


      return output;
    }


    if (
      typeof value ===
      'object'
    ) {

      Object
        .values(
          value
        )

        .forEach(
          item =>
            collectStrings(
              item,
              output
            )
        );
    }


    return output;
  }



  function completedSet() {

    const output =
      new Set();


    const raw =
      j(

        localStorage.getItem(
          DONE_KEY
        ),

        []

      );


    collectStrings(
      raw
    )

      .forEach(
        value => {

          const p =
            path(
              value
            );


          const b =
            base(
              value
            );


          const t =
            txt(
              value
            );


          if (p) {

            output.add(
              p
            );
          }


          if (b) {

            output.add(
              b
            );
          }


          if (t) {

            output.add(
              t
            );
          }

        }
      );


    return output;
  }



  /* ============================================================
     SIMULADOS.JSON
     ============================================================ */

  async function loadManifest() {

    try {

      const response =
        await fetch(

          'simulados.json?v=' +
          Date.now(),

          {
            cache:
              'no-store'
          }

        );


      if (
        !response.ok
      ) {

        throw new Error(
          'HTTP ' +
          response.status
        );
      }


      const raw =
        await response.json();


      const array =
        Array.isArray(
          raw
        )

          ? raw

          : (
              raw.simulados ||
              raw.items ||
              []
            );


      manifest =
        array

          .map(
            item => {

              let file =
                '';

              let title =
                '';

              let sub =
                '';

              let yr =
                '';


              if (
                typeof item ===
                'string'
              ) {

                file =
                  item;

              } else if (
                item &&
                typeof item ===
                'object'
              ) {

                file =

                  item.file ||

                  item.filename ||

                  item.path ||

                  item.url ||

                  item.href ||

                  item.src ||

                  item.arquivo ||

                  '';


                title =

                  item.title ||

                  item.name ||

                  item.nome ||

                  item.label ||

                  '';


                sub =

                  item.subject ||

                  item.disciplina ||

                  '';


                yr =
                  String(

                    item.year ||

                    item.ano ||

                    ''

                  );
              }


              const p =
                path(
                  file
                );


              if (
                !p ||

                !/\.html?$/i.test(
                  p
                ) ||

                base(
                  p
                ) ===
                  'index.html'
              ) {

                return null;
              }


              title =
                title ||
                titleFromFile(
                  p
                );


              sub =
                sub ||
                subject(
                  p,
                  title
                );


              yr =
                yr ||
                year(
                  p,
                  title
                );


              return {

                file:
                  p,

                base:
                  base(
                    p
                  ),

                title,

                subject:
                  sub,

                year:
                  yr

              };

            }
          )

          .filter(
            Boolean
          );


      map =
        new Map();


      manifest.forEach(
        item => {

          map.set(
            item.file,
            item
          );


          map.set(
            item.base,
            item
          );


          map.set(

            'simulados/' +
            item.base,

            item

          );

        }
      );


    } catch (error) {

      manifest =
        [];


      map =
        new Map();


      console.warn(

        '[MedSim] Filtros: não foi possível ler simulados.json.',

        error

      );
    }
  }



  /* ============================================================
     IDENTIFICAR SIMULADO
     ============================================================ */

  function fileFrom(
    element
  ) {

    const attributes = [

      'href',
      'data-file',
      'data-path',
      'data-src',
      'data-simulado',
      'data-arquivo'

    ];


    for (
      const attribute
      of attributes
    ) {

      const value =
        element.getAttribute &&
        element.getAttribute(
          attribute
        );


      if (
        value &&
        /\.html?(?:[?#]|$)/i.test(
          value
        )
      ) {

        return path(

          value.split(
            /[?#]/
          )[0]

        );
      }
    }



    const onclick =

      (
        element.getAttribute &&
        element.getAttribute(
          'onclick'
        )
      )

      ||

      '';



    const match =
      onclick.match(

        /["']([^"']+\.html?(?:[?#][^"']*)?)["']/i

      );


    return match

      ? path(
          match[1]
            .split(
              /[?#]/
            )[0]
        )

      : '';
  }



  function metaFor(
    p,
    element
  ) {

    const b =
      base(
        p
      );


    const known =

      map.get(
        p
      )

      ||

      map.get(
        b
      )

      ||

      map.get(
        'simulados/' +
        b
      );


    if (
      known
    ) {

      return known;
    }


    if (
      !p ||

      !/\.html?$/i.test(
        p
      ) ||

      b ===
        'index.html'
    ) {

      return null;
    }


    const title =

      (
        element.textContent ||
        ''
      ).trim()

      ||

      titleFromFile(
        p
      );


    return {

      file:
        p,

      base:
        b,

      title,

      subject:
        subject(
          p,
          title
        ),

      year:
        year(
          p,
          title
        )

    };
  }



  function cardFor(
    element
  ) {

    const selectors = [

      '[data-simulado-item]',
      '.simulado-card',
      '.simulado-item',
      '.simulation-card',
      '.card',
      'article',
      'li'

    ];


    for (
      const selector
      of selectors
    ) {

      const card =
        element.closest &&
        element.closest(
          selector
        );


      if (
        card &&
        !card.closest(
          '#' + PANEL_ID
        )
      ) {

        return card;
      }
    }


    return (

      element.parentElement &&
      element.parentElement !==
        document.body

        ? element.parentElement

        : element

    );
  }



  function items() {

    const selector = [

      'a[href*=".html"]',

      'button[onclick*=".html"]',

      '[onclick*="carregarSimulado"]',

      '[data-file*=".html"]',

      '[data-path*=".html"]',

      '[data-src*=".html"]',

      '[data-simulado*=".html"]',

      '[data-arquivo*=".html"]'

    ].join(
      ','
    );


    const output =
      [];


    const seen =
      new Set();


    document
      .querySelectorAll(
        selector
      )

      .forEach(
        element => {

          if (
            element.closest(
              '#' + PANEL_ID
            ) ||

            element.id ===
              TRIGGER_ID
          ) {

            return;
          }


          const p =
            fileFrom(
              element
            );


          const meta =
            metaFor(
              p,
              element
            );


          const container =
            cardFor(
              element
            );


          if (
            !meta ||
            !container ||
            seen.has(
              container
            )
          ) {

            return;
          }


          seen.add(
            container
          );


          output.push({

            element,

            container,

            meta

          });

        }
      );


    return output;
  }



  /* ============================================================
     CONCLUÍDO / FAVORITO
     ============================================================ */

  function isDone(
    item,
    done
  ) {

    return [

      item.meta.file,

      item.meta.base,

      txt(
        item.meta.title
      ),

      txt(
        item.container
          .textContent ||
        ''
      )

    ]

      .filter(
        Boolean
      )

      .some(
        value =>
          done.has(
            value
          )
      );
  }



  function favKey(
    meta
  ) {

    return (
      meta.file ||
      meta.base
    );
  }



  function isFav(
    meta
  ) {

    return (

      favorites.has(
        favKey(
          meta
        )
      )

      ||

      favorites.has(
        meta.base
      )

    );
  }



  /* ============================================================
     ESTRELA DE FAVORITO
     ============================================================ */

  function addStar(
    item
  ) {

    item.container.classList.add(
      'medsim-filter-card'
    );


    let button =
      item.container.querySelector(

        ':scope > .medsim-fav-star'

      );


    if (
      !button
    ) {

      button =
        document.createElement(
          'button'
        );


      button.type =
        'button';


      button.className =
        'medsim-fav-star';


      button.textContent =
        '★';


      item.container.appendChild(
        button
      );


      button.addEventListener(

        'click',

        event => {

          event.preventDefault();

          event.stopPropagation();

          event.stopImmediatePropagation();


          const key =
            button.dataset.key;


          if (!key) {

            return;
          }


          if (
            favorites.has(
              key
            )
          ) {

            favorites.delete(
              key
            );

          } else {

            favorites.add(
              key
            );
          }


          saveFavorites();

          refresh();

        },

        true

      );
    }


    const key =
      favKey(
        item.meta
      );


    const yes =
      isFav(
        item.meta
      );


    button.dataset.key =
      key;


    button.dataset.favorite =
      String(
        yes
      );


    button.title =
      yes

        ? 'Remover dos favoritos'

        : 'Adicionar aos favoritos';
  }



  /* ============================================================
     APLICAR FILTROS
     ============================================================ */

  function activeCount() {

    return [

      applied.subject,

      applied.year,

      applied.status,

      applied.favoritesOnly
        ? 'x'
        : ''

    ]

      .filter(
        Boolean
      )

      .length;
  }



  function updateTrigger() {

    const button =
      document.getElementById(
        TRIGGER_ID
      );


    if (!button) {

      return;
    }


    const number =
      activeCount();


    button.dataset.active =
      String(
        number > 0
      );


    button.textContent =
      number

        ? `Filtros (${number})`

        : 'Filtros';
  }



  function applyFilters() {

    const done =
      completedSet();


    const list =
      items();


    let visible =
      0;


    list.forEach(
      item => {

        addStar(
          item
        );


        const show =

          (
            !applied.subject ||

            item.meta.subject ===
              applied.subject
          )

          &&

          (
            !applied.year ||

            item.meta.year ===
              applied.year
          )

          &&

          (
            !applied.status

            ||

            (
              applied.status ===
                'concluido'

                ? isDone(
                    item,
                    done
                  )

                : !isDone(
                    item,
                    done
                  )
            )
          )

          &&

          (
            !applied.favoritesOnly ||

            isFav(
              item.meta
            )
          );


        item.container
          .classList
          .toggle(

            HIDE,

            !show

          );


        if (
          show
        ) {

          visible++;
        }

      }
    );


    const summary =
      document.querySelector(

        '#' +
        PANEL_ID +
        ' .summary'

      );


    if (
      summary
    ) {

      summary.textContent =

        `${visible} ${
          visible === 1
            ? 'simulado exibido'
            : 'simulados exibidos'
        } · ${favorites.size} ${
          favorites.size === 1
            ? 'favorito'
            : 'favoritos'
        }`;
    }


    updateTrigger();
  }



  /* ============================================================
     OPÇÕES
     ============================================================ */

  function opts(
    values,
    years = false
  ) {

    const array = [

      ...new Set(
        values.filter(
          Boolean
        )
      )

    ];


    if (
      years
    ) {

      return array.sort(
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


    return array.sort(
      (a, b) =>
        a.localeCompare(
          b,
          'pt-BR'
        )
    );
  }



  function esc(
    value
  ) {

    return String(
      value
    )

      .replace(

        /[&<>"]/g,

        char => ({

          '&':
            '&amp;',

          '<':
            '&lt;',

          '>':
            '&gt;',

          '"':
            '&quot;'

        })[char]

      );
  }



  /* ============================================================
     CSS
     ============================================================ */

  function ensureStyle() {

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
     PAINEL
     ============================================================ */

  function buildPanel() {

    let panel =
      document.getElementById(
        PANEL_ID
      );


    if (
      panel
    ) {

      return panel;
    }


    panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.dataset.open =
      'false';


    panel.innerHTML = `

      <div class="head">

        <div class="title">
          Filtrar simulados
        </div>

        <button
          type="button"
          class="close"
          aria-label="Fechar">

          ×

        </button>

      </div>


      <div class="grid">

        <label class="field">

          <span class="label">
            Disciplina
          </span>

          <select data-f="subject">

            <option value="">
              Todas
            </option>

          </select>

        </label>


        <label class="field">

          <span class="label">
            Ano
          </span>

          <select data-f="year">

            <option value="">
              Todos
            </option>

          </select>

        </label>


        <label class="field full">

          <span class="label">
            Status
          </span>

          <select data-f="status">

            <option value="">
              Todos
            </option>

            <option value="concluido">
              Concluídos
            </option>

            <option value="pendente">
              Não concluídos
            </option>

          </select>

        </label>


        <label class="favcheck full">

          <input
            type="checkbox"
            data-f="favoritesOnly">

          <span>
            Mostrar somente favoritos
          </span>

        </label>

      </div>


      <div class="summary">

        Filtros prontos.

      </div>


      <div class="actions">

        <button
          type="button"
          class="clear">

          Limpar

        </button>


        <button
          type="button"
          class="apply">

          Aplicar e fechar

        </button>

      </div>

    `;


    document.body.appendChild(
      panel
    );


    panel
      .querySelector(
        '.close'
      )

      .onclick =
        closePanel;



    panel
      .querySelector(
        '.clear'
      )

      .onclick =
        () => {

          draft = {

            subject:
              '',

            year:
              '',

            status:
              '',

            favoritesOnly:
              false

          };


          syncPanel();
        };



    panel
      .querySelector(
        '.apply'
      )

      .onclick =
        () => {

          readDraft();


          applied = {
            ...draft
          };


          saveFilters();

          applyFilters();

          closePanel();
        };


    return panel;
  }



  /* ============================================================
     POPULAR CAMPOS
     ============================================================ */

  function populate() {

    const panel =
      buildPanel();


    const list =
      items();


    const subjects =

      opts(

        manifest.length

          ? manifest.map(
              item =>
                item.subject
            )

          : list.map(
              item =>
                item.meta.subject
            )

      );


    const years =

      opts(

        manifest.length

          ? manifest.map(
              item =>
                item.year
            )

          : list.map(
              item =>
                item.meta.year
            ),

        true

      );


    panel
      .querySelector(
        '[data-f="subject"]'
      )

      .innerHTML =

        '<option value="">Todas</option>'

        +

        subjects
          .map(
            item =>
              `<option value="${esc(item)}">${esc(item)}</option>`
          )
          .join(
            ''
          );



    panel
      .querySelector(
        '[data-f="year"]'
      )

      .innerHTML =

        '<option value="">Todos</option>'

        +

        years
          .map(
            item =>
              `<option value="${esc(item)}">${esc(item)}</option>`
          )
          .join(
            ''
          );
  }



  function readDraft() {

    const panel =
      buildPanel();


    draft = {

      subject:

        panel
          .querySelector(
            '[data-f="subject"]'
          )
          .value,


      year:

        panel
          .querySelector(
            '[data-f="year"]'
          )
          .value,


      status:

        panel
          .querySelector(
            '[data-f="status"]'
          )
          .value,


      favoritesOnly:

        panel
          .querySelector(
            '[data-f="favoritesOnly"]'
          )
          .checked

    };
  }



  function syncPanel() {

    const panel =
      buildPanel();


    populate();


    panel
      .querySelector(
        '[data-f="subject"]'
      )
      .value =
        draft.subject || '';


    panel
      .querySelector(
        '[data-f="year"]'
      )
      .value =
        draft.year || '';


    panel
      .querySelector(
        '[data-f="status"]'
      )
      .value =
        draft.status || '';


    panel
      .querySelector(
        '[data-f="favoritesOnly"]'
      )
      .checked =
        Boolean(
          draft.favoritesOnly
        );
  }



  /* ============================================================
     LOCALIZAR A BUSCA EXISTENTE
     ============================================================ */

  function findSearch() {

  /*
   * Primeiro procura exatamente a barra
   * existente no MedSim.
   */
  const exact =
    document.querySelector(
      'input[placeholder="Pesquisar simulado..."]'
    );

  if (exact) {
    return exact;
  }


  /*
   * Segurança caso o texto seja alterado
   * ligeiramente no futuro.
   */
  const inputs =
    [...document.querySelectorAll('input')];

  return (
    inputs.find(input => {

      const placeholder =
        (input.placeholder || '')
          .toLowerCase()
          .trim();

      return (
        placeholder.includes('pesquisar simulado') ||
        placeholder.includes('buscar simulado')
      );

    })

    || null
  );
  }



  /* ============================================================
     POSICIONAR PAINEL
     ============================================================ */

  function positionPanel() {

    const panel =
      document.getElementById(
        PANEL_ID
      );


    if (
      !panel
    ) {

      return;
    }


    const anchor =

      searchInput

      ||

      document.getElementById(
        TRIGGER_ID
      );


    if (
      !anchor
    ) {

      return;
    }


    const rect =
      anchor.getBoundingClientRect();


    const width =
      Math.min(
        430,
        innerWidth - 24
      );


    let left =
      Math.max(

        12,

        Math.min(

          rect.left,

          innerWidth -
          width -
          12

        )

      );


    panel.style.width =
      width + 'px';


    panel.style.left =
      left + 'px';


    panel.style.top =
      (
        rect.bottom +
        8
      ) +
      'px';



    requestAnimationFrame(
      () => {

        const p =
          panel.getBoundingClientRect();


        if (
          p.bottom >
          innerHeight - 12
        ) {

          const above =

            rect.top -
            p.height -
            8;


          panel.style.top =

            (
              above >= 12

                ? above

                : 12
            )

            +

            'px';
        }

      }
    );
  }



  /* ============================================================
     ABRIR / FECHAR
     ============================================================ */

  function openPanel() {

    const panel =
      buildPanel();


    draft = {
      ...applied
    };


    syncPanel();


    panel.dataset.open =
      'true';


    open =
      true;


    positionPanel();
  }



  function closePanel() {

    const panel =
      document.getElementById(
        PANEL_ID
      );


    if (
      panel
    ) {

      panel.dataset.open =
        'false';
    }


    open =
      false;
  }



  /* ============================================================
     INTEGRAR À BUSCA
     ============================================================ */

  function ensureSearch() {

    const found =
      findSearch();


    if (
      found &&
      searchInput !==
        found
    ) {

      searchInput =
        found;


      /*
       * Clicar ou focar a busca
       * abre os filtros.
       */

      searchInput.addEventListener(

        'focus',

        openPanel

      );


      searchInput.addEventListener(

        'click',

        openPanel

      );
    }



    let button =
      document.getElementById(
        TRIGGER_ID
      );


    if (
      !button
    ) {

      button =
        document.createElement(
          'button'
        );


      button.type =
        'button';


      button.id =
        TRIGGER_ID;


      button.textContent =
        'Filtros';


      button.onclick =
        event => {

          event.preventDefault();

          event.stopPropagation();


          if (
            open
          ) {

            closePanel();

          } else {

            openPanel();
          }
        };
    }



    /*
     * Se encontrou a busca,
     * coloca o botão ao lado dela.
     */

    if (
      searchInput &&
      button.parentElement !==
        searchInput.parentElement
    ) {

      searchInput
        .insertAdjacentElement(

          'afterend',

          button

        );

    }


    /*
     * Fallback:
     * se não encontrar a busca,
     * ainda assim mostra o botão.
     */

    else if (
      !searchInput &&
      !button.isConnected
    ) {

      const host =

        document.querySelector(

          'main, .main-content, .content, #main-content, #content'

        )

        ||

        document.body;


      host.insertBefore(

        button,

        host.firstChild

      );
    }


    updateTrigger();
  }



  /* ============================================================
     ATUALIZAÇÃO
     ============================================================ */

  function refresh() {

    clearTimeout(
      refreshTimer
    );


    refreshTimer =
      setTimeout(
        () => {

          favorites =
            loadFavorites();


          ensureSearch();

          populate();

          applyFilters();


          if (
            open
          ) {

            positionPanel();
          }

        },

        60
      );
  }



  /* ============================================================
     OBSERVAR ALTERAÇÕES DO HUB
     ============================================================ */

  function observe() {

    const observer =
      new MutationObserver(
        mutations => {

          const relevant =
            mutations.some(
              mutation => {

                const target =

                  mutation.target &&
                  mutation.target.nodeType === 1

                    ? mutation.target

                    : mutation.target &&
                      mutation.target.parentElement;


                /*
                 * Ignora alterações que o próprio
                 * painel está fazendo.
                 */

                if (
                  target &&
                  (
                    target.closest(
                      '#' + PANEL_ID
                    )

                    ||

                    target.closest(
                      '.medsim-fav-star'
                    )
                  )
                ) {

                  return false;
                }


                return [

                  ...mutation.addedNodes,

                  ...mutation.removedNodes

                ]

                  .some(
                    node => {

                      if (
                        !node ||
                        node.nodeType !== 1
                      ) {

                        return false;
                      }


                      if (
                        node.id ===
                          PANEL_ID

                        ||

                        node.id ===
                          TRIGGER_ID
                      ) {

                        return false;
                      }


                      if (
                        node.classList &&
                        node.classList.contains(
                          'medsim-fav-star'
                        )
                      ) {

                        return false;
                      }


                      return true;
                    }
                  );
              }
            );


          if (
            relevant
          ) {

            refresh();
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
     NAVEGAÇÃO HUB / SIMULADO
     ============================================================ */

  function hookNav() {

    const carregar =
      window.carregarSimulado;


    if (
      typeof carregar ===
        'function' &&

      !carregar.__filterV2
    ) {

      const wrapper =
        function () {

          closePanel();


          return carregar.apply(
            this,
            arguments
          );
        };


      wrapper.__filterV2 =
        true;


      window.carregarSimulado =
        wrapper;
    }



    const fechar =
      window.fecharProva;


    if (
      typeof fechar ===
        'function' &&

      !fechar.__filterV2
    ) {

      const wrapper =
        function () {

          const result =
            fechar.apply(
              this,
              arguments
            );


          setTimeout(
            refresh,
            50
          );


          return result;
        };


      wrapper.__filterV2 =
        true;


      window.fecharProva =
        wrapper;
    }
  }



  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */

  async function start() {

    ensureStyle();

    buildPanel();


    await loadManifest();


    ensureSearch();

    populate();

    applyFilters();

    observe();

    hookNav();



    /* Reposiciona se a tela mudar */

    window.addEventListener(

      'resize',

      () => {

        if (
          open
        ) {

          positionPanel();
        }

      }

    );



    window.addEventListener(

      'scroll',

      () => {

        if (
          open
        ) {

          positionPanel();
        }

      },

      true

    );



    /*
     * ESC fecha sem aplicar.
     */

    document.addEventListener(

      'keydown',

      event => {

        if (
          event.key ===
            'Escape'
        ) {

          closePanel();
        }

      }

    );



    /*
     * Clique fora fecha sem aplicar.
     */

    document.addEventListener(

      'pointerdown',

      event => {

        if (
          !open
        ) {

          return;
        }


        const panel =
          document.getElementById(
            PANEL_ID
          );


        const button =
          document.getElementById(
            TRIGGER_ID
          );


        if (
          panel &&
          panel.contains(
            event.target
          )
        ) {

          return;
        }


        if (
          button &&
          button.contains(
            event.target
          )
        ) {

          return;
        }


        if (
          searchInput &&
          searchInput.contains(
            event.target
          )
        ) {

          return;
        }


        closePanel();

      },

      true

    );



    /*
     * Algumas páginas constroem
     * a busca/lista depois.
     */

    setTimeout(
      refresh,
      250
    );


    setTimeout(
      refresh,
      900
    );


    setTimeout(

      () => {

        hookNav();

        refresh();

      },

      1800

    );


    console.info(
      '[MedSim] Filtros do Hub v2 ativos.'
    );
  }



  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(

      'DOMContentLoaded',

      start,

      {
        once:
          true
      }

    );

  } else {

    start();
  }

})();
