(function () {
  'use strict';

  const STORE_KEY = 'medsim_resume_v2';
  const BUTTON_ID = 'medsim-resume-safe-button';
  const MODAL_ID = 'medsim-resume-safe-modal';
  const STYLE_ID = 'medsim-resume-safe-style-v3';

  let active = null;
  let pendingAction = null;


  /* ============================================================
     CAMINHOS
     ============================================================ */

  function keyPath(value) {

    if (!value) return '';

    try {

      const u =
        new URL(
          String(value),
          location.href
        );

      return decodeURIComponent(
        u.pathname
      )
        .replace(/^\/+/, '')
        .toLowerCase();

    } catch (_) {

      return String(value)

        .split(/[?#]/)[0]

        .replace(/\\/g, '/')

        .replace(/^\.\//, '')

        .replace(/^\/+/, '')

        .toLowerCase();
    }
  }


  /*
   * Diferente de keyPath(),
   * este mantém maiúsculas/minúsculas.
   *
   * É o caminho REAL usado para abrir
   * o arquivo no GitHub Pages.
   */
  function realPath(value) {

    if (!value) return '';

    try {

      const u =
        new URL(
          String(value),
          location.href
        );

      return decodeURIComponent(
        u.pathname
      )
        .replace(/^\/+/, '');

    } catch (_) {

      try {

        return decodeURIComponent(

          String(value)

            .split(/[?#]/)[0]

            .replace(/\\/g, '/')

            .replace(/^\.\//, '')

            .replace(/^\/+/, '')

        );

      } catch (_) {

        return String(value)

          .split(/[?#]/)[0]

          .replace(/\\/g, '/')

          .replace(/^\.\//, '')

          .replace(/^\/+/, '');
      }
    }
  }


  function basename(value) {

    return (
      realPath(value)
        .split('/')
        .pop()

      || ''
    );
  }


  function normText(value) {

    return String(
      value || ''
    )
      .normalize('NFD')

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


  /* ============================================================
     MATÉRIA
     ============================================================ */

  function subjectFrom(path) {

    const t =
      normText(path);


    if (/farmaco/.test(t)) {
      return 'Farmacologia';
    }


    if (
      /fisiologia|endocrino|hipofise|pancreatic/
        .test(t)
    ) {
      return 'Fisiologia';
    }


    if (/imuno/.test(t)) {
      return 'Imunologia';
    }


    if (/micro/.test(t)) {
      return 'Microbiologia';
    }


    if (/parasito/.test(t)) {
      return 'Parasitologia';
    }


    if (/patologia/.test(t)) {
      return 'Patologia';
    }


    if (/propedeu/.test(t)) {
      return 'Propedêutica';
    }


    if (/psico/.test(t)) {
      return 'Psicomed';
    }


    if (/vigil/.test(t)) {
      return 'Vigilância em Saúde';
    }


    return 'Simulado';
  }


  /* ============================================================
     NOME AMIGÁVEL DO SIMULADO
     ============================================================ */

  function prettifyWords(text) {

    return String(
      text || ''
    )

      .replace(
        /\bEndocrino\b/gi,
        'Endócrino'
      )

      .replace(
        /\bHipofise\b/gi,
        'Hipófise'
      )

      .replace(
        /\bPancreaticos\b/gi,
        'Pancreáticos'
      )

      .replace(
        /\bPancreatico\b/gi,
        'Pancreático'
      )

      .replace(
        /\bIntroducao\b/gi,
        'Introdução'
      )

      .replace(
        /\bPropedeutica\b/gi,
        'Propedêutica'
      );
  }


  function cleanSimulationName(path) {

    let name =
      basename(path)

        .replace(
          /\.html?$/i,
          ''
        )

        .replace(
          /[_]+/g,
          ' '
        )

        .replace(
          /-/g,
          ' '
        )

        .replace(
          /\s+/g,
          ' '
        )

        .trim();


    /*
     * Remove o nome da disciplina
     * do começo.
     */

    name =
      name.replace(

        /^\s*(farmaco(?:logia)?|fisiologia|imunologia|imuno|microbiologia|micro|parasitologia|parasito|patologia|propedeutica|propedeu|psicomed|psico|vigilancia(?: em saude)?|vigil)\b\s*/i,

        ''

      );


    /*
     * Remove identificadores internos:
     *
     * m5
     * b4
     * p2
     * aula
     * números de aula
     */

    name =
      name

        .replace(
          /^\s*(aula\s*)?/i,
          ''
        )

        .replace(
          /^\s*(m\d+|b\d+|p\d+)\b\s*/i,
          ''
        )

        .replace(
          /^\s*(aula)\b\s*/i,
          ''
        )

        .replace(
          /^\s*\d+\s*/i,
          ''
        )

        .replace(
          /\s+/g,
          ' '
        )

        .trim();


    /*
     * Caso fique apenas "2025",
     * vira "Simulado 2025".
     */

    if (
      /^20\d{2}$/.test(name)
    ) {

      name =
        'Simulado ' +
        name;
    }


    if (!name) {

      name =
        'Simulado';
    }


    return prettifyWords(
      name
    );
  }


  /* ============================================================
     DATA
     ============================================================ */

  function formatDate(iso) {

    const d =
      new Date(
        iso || ''
      );


    if (
      Number.isNaN(
        d.getTime()
      )
    ) {

      return '';
    }


    return d.toLocaleString(

      'pt-BR',

      {

        dateStyle:
          'short',

        timeStyle:
          'short'

      }

    );
  }


  /* ============================================================
     BANCO
     ============================================================ */

  function loadStore() {

    try {

      const raw =
        JSON.parse(

          localStorage.getItem(
            STORE_KEY
          )

          || '{}'

        );


      return (

        raw &&
        typeof raw ===
          'object' &&
        !Array.isArray(raw)

          ? raw

          : {}

      );

    } catch (_) {

      return {};
    }
  }


  function saveStore(store) {

    localStorage.setItem(

      STORE_KEY,

      JSON.stringify(store)

    );


    updateButton();
  }


  function getRecord(path) {

    return (

      loadStore()[
        keyPath(path)
      ]

      || null

    );
  }


  function setRecord(record) {

    const store =
      loadStore();


    store[
      keyPath(
        record.path
      )
    ] =
      record;


    saveStore(store);
  }


  function removeRecord(path) {

    const store =
      loadStore();


    delete store[
      keyPath(path)
    ];


    saveStore(store);
  }


  function allRecords() {

    return Object

      .values(
        loadStore()
      )

      .filter(
        record =>
          record &&
          record.path
      )

      .sort(
        (a, b) =>

          String(
            b.updatedAt || ''
          )

            .localeCompare(

              String(
                a.updatedAt || ''
              )

            )
      );
  }


  /* ============================================================
     IFRAME
     ============================================================ */

  function framePath(frame) {

    return realPath(

      frame.getAttribute(
        'src'
      )

      || ''

    );
  }


  function isSimulationPath(path) {

    return (

      /\.html?$/i.test(path)

      &&

      !/index\.html?$/i.test(path)

    );
  }


  function isFrameVisible(frame) {

    try {

      const style =
        getComputedStyle(frame);


      const rect =
        frame.getBoundingClientRect();


      return (

        style.display !==
          'none'

        &&

        style.visibility !==
          'hidden'

        &&

        rect.width > 0

        &&

        rect.height > 0

      );

    } catch (_) {

      return false;
    }
  }


  function simulationOpen() {

    return [

      ...document.querySelectorAll(
        'iframe'
      )

    ].some(
      frame =>

        isSimulationPath(
          framePath(frame)
        )

        &&

        isFrameVisible(
          frame
        )
    );
  }


  /* ============================================================
     JAVASCRIPT INTERNO DO SIMULADO
     ============================================================ */

  function scriptText(doc) {

    try {

      return [

        ...doc.scripts

      ]

        .map(
          script =>
            script.textContent ||
            ''
        )

        .join(
          '\n'
        );


    } catch (_) {

      return '';
    }
  }


  /* ============================================================
     HISTÓRICO NATIVO
     ============================================================ */

  function discoverHistoryKey(doc) {

    const match =
      scriptText(doc)
        .match(

          /simulado_[a-z0-9_-]+_history/i

        );


    return match
      ? match[0]
      : '';
  }


  /* ============================================================
     STATE NATIVO

     Exemplo:
     simulado_endo_state
     simulado_farma_state
     ============================================================ */

  function discoverStateKeys(doc) {

    const text =
      scriptText(doc);


    const found =
      new Set();


    const regex =
      /simulado_[a-z0-9_-]+_state/ig;


    let match;


    while (
      (
        match =
          regex.exec(text)
      )
    ) {

      found.add(
        match[0]
      );
    }


    /*
     * Se conhecemos o history,
     * também testamos o state correspondente.
     */

    const history =
      discoverHistoryKey(doc);


    if (history) {

      found.add(

        history.replace(
          /_history$/i,
          '_state'
        )

      );
    }


    return [
      ...found
    ];
  }


  function captureNativeState(doc) {

    const output =
      {};


    discoverStateKeys(doc)
      .forEach(
        key => {

          const value =
            localStorage.getItem(
              key
            );


          if (
            value !== null
          ) {

            output[key] =
              value;
          }

        }
      );


    return output;
  }


  function applyNativeState(
    nativeState
  ) {

    if (
      !nativeState ||
      typeof nativeState !==
        'object'
    ) {

      return;
    }


    Object.entries(
      nativeState
    )
    .forEach(
      ([key, value]) => {

        /*
         * Segurança:
         * apenas state de simulados.
         */

        if (

          /^simulado_[a-z0-9_-]+_state$/i
            .test(key)

          &&

          typeof value ===
            'string'

        ) {

          localStorage.setItem(
            key,
            value
          );
        }

      }
    );
  }


  function clearNativeState(
    doc,
    record
  ) {

    const keys =
      new Set(

        discoverStateKeys(
          doc
        )

      );


    Object.keys(
      (
        record &&
        record.nativeState
      )

      || {}
    )
    .forEach(
      key =>
        keys.add(key)
    );


    keys.forEach(
      key => {

        if (

          /^simulado_[a-z0-9_-]+_state$/i
            .test(key)

        ) {

          localStorage.removeItem(
            key
          );
        }

      }
    );
  }


  /* ============================================================
     VISIBILIDADE
     ============================================================ */

  function visible(element) {

    if (
      !element ||
      !(element instanceof Element)
    ) {

      return false;
    }


    try {

      const style =

        element
          .ownerDocument
          .defaultView
          .getComputedStyle(
            element
          );


      const rect =
        element.getBoundingClientRect();


      return (

        style.display !==
          'none'

        &&

        style.visibility !==
          'hidden'

        &&

        rect.width > 0

        &&

        rect.height > 0

      );

    } catch (_) {

      return false;
    }
  }


  /* ============================================================
     QUESTÃO ATUAL
     ============================================================ */

  function questionInfo(doc) {

    const candidates = [

      ...doc.querySelectorAll(

        '[class*="quest"],' +
        '[id*="quest"],' +
        '.progress,' +
        '.counter,' +
        'h1,h2,h3,h4,p,span'

      )

    ]

      .filter(
        visible
      )

      .map(
        element =>
          (
            element.textContent ||
            ''
          ).trim()
      )

      .filter(
        text =>

          text.length > 0

          &&

          text.length < 160
      );


    for (
      const text
      of candidates
    ) {

      const match =
        text.match(

          /quest(?:ão|ao)\s*(\d+)(?:\s*(?:de|\/)\s*(\d+))?/i

        );


      if (match) {

        return {

          number:
            Number(
              match[1]
            ),

          total:

            match[2]

              ? Number(
                  match[2]
                )

              : null,

          label:

            `Questão ${match[1]}`

            +

            (
              match[2]

                ? ` de ${match[2]}`

                : ''
            )

        };
      }
    }


    const body =

      (
        doc.body &&
        doc.body.innerText
      )

      || '';


    const match =
      body.match(

        /quest(?:ão|ao)\s*(\d+)(?:\s*(?:de|\/)\s*(\d+))?/i

      );


    if (match) {

      return {

        number:
          Number(
            match[1]
          ),

        total:

          match[2]

            ? Number(
                match[2]
              )

            : null,

        label:

          `Questão ${match[1]}`

          +

          (
            match[2]

              ? ` de ${match[2]}`

              : ''
          )

      };
    }


    return {

      number:
        null,

      total:
        null,

      label:
        'Progresso salvo'

    };
  }


  /* ============================================================
     RESPOSTAS
     ============================================================ */

  function captureFields(doc) {

    return [

      ...doc.querySelectorAll(
        'input, textarea, select'
      )

    ]

      .filter(
        element => {

          const type =
            (
              element.type ||
              ''
            ).toLowerCase();


          return ![

            'button',
            'submit',
            'reset',
            'file',
            'password',
            'hidden'

          ].includes(type);
        }
      )

      .map(
        (
          element,
          index
        ) => {

          let nameIndex =
            -1;


          if (
            element.name
          ) {

            nameIndex = [

              ...doc.getElementsByName(
                element.name
              )

            ].indexOf(
              element
            );
          }


          return {

            index,

            id:
              element.id || '',

            name:
              element.name || '',

            nameIndex,

            type:

              (
                element.type ||
                ''
              ).toLowerCase(),

            value:
              element.value,

            checked:

              'checked' in
                element

                ? Boolean(
                    element.checked
                  )

                : null

          };
        }
      );
  }


  function findField(
    doc,
    saved
  ) {

    if (
      saved.id
    ) {

      const element =
        doc.getElementById(
          saved.id
        );


      if (element) {
        return element;
      }
    }


    if (
      saved.name
    ) {

      const same = [

        ...doc.getElementsByName(
          saved.name
        )

      ];


      if (

        saved.nameIndex >=
          0

        &&

        same[
          saved.nameIndex
        ]

      ) {

        return same[
          saved.nameIndex
        ];
      }


      if (
        same[0]
      ) {

        return same[0];
      }
    }


    const fields = [

      ...doc.querySelectorAll(
        'input, textarea, select'
      )

    ]

      .filter(
        element =>

          ![

            'button',
            'submit',
            'reset',
            'file',
            'password',
            'hidden'

          ].includes(

            (
              element.type ||
              ''
            ).toLowerCase()

          )
      );


    return (

      fields[
        saved.index
      ]

      || null

    );
  }


  function restoreFields(
    doc,
    record
  ) {

    (
      record.fields ||
      []
    )
    .forEach(
      saved => {

        const element =
          findField(
            doc,
            saved
          );


        if (!element) {
          return;
        }


        try {

          if (

            saved.checked !==
              null

            &&

            'checked' in
              element

          ) {

            element.checked =
              saved.checked;
          }


          if (

            saved.value !==
              undefined

            &&

            saved.type !==
              'radio'

            &&

            saved.type !==
              'checkbox'

          ) {

            element.value =
              saved.value;
          }


          /*
           * Faz o JS nativo perceber
           * a restauração.
           */

          element.dispatchEvent(

            new Event(

              'input',

              {
                bubbles:
                  true
              }

            )

          );


          element.dispatchEvent(

            new Event(

              'change',

              {
                bubbles:
                  true
              }

            )

          );


        } catch (_) {}

      }
    );
  }


  /* ============================================================
     PRÓXIMA / ANTERIOR

     Só usado quando o usuário clicou
     explicitamente em CONTINUAR.
     ============================================================ */

  function findNavButton(
    doc,
    direction
  ) {

    const nodes = [

      ...doc.querySelectorAll(
        'button, a, [role="button"]'
      )

    ].filter(
      visible
    );


    const regex =

      direction ===
        'next'

        ? /^(proxima|proximo|próxima|próximo|avancar|avançar|seguinte|next)\b/i

        : /^(anterior|questao anterior|questão anterior|voltar questao|voltar questão|prev|previous)\b/i;


    return (

      nodes.find(
        element =>

          regex.test(

            (
              element.textContent

              ||

              element.getAttribute(
                'aria-label'
              )

              ||

              ''
            ).trim()

          )
      )

      || null

    );
  }


  async function navigateToSavedQuestion(
    doc,
    record
  ) {

    const target =
      Number(

        record.questionNumber

        ||

        (
          record.question &&
          record.question.number
        )

        ||

        0

      );


    if (!target) {
      return;
    }


    let current =
      questionInfo(
        doc
      ).number;


    if (
      !current ||
      current === target
    ) {

      return;
    }


    let guard =
      0;


    while (

      current

      &&

      current !== target

      &&

      guard++ < 80

    ) {

      const button =
        findNavButton(

          doc,

          current < target

            ? 'next'

            : 'prev'

        );


      if (!button) {
        break;
      }


      button.click();


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            80
          )
      );


      const next =
        questionInfo(
          doc
        ).number;


      if (
        !next ||
        next === current
      ) {

        break;
      }


      current =
        next;
    }
  }


  /* ============================================================
     RESTAURAÇÃO COMPLETA
     ============================================================ */

  async function restoreUniversal(
    frame,
    record
  ) {

    let doc;


    try {

      doc =
        frame.contentDocument;

    } catch (_) {

      return;
    }


    if (
      !doc ||
      !doc.body
    ) {

      return;
    }


    /*
     * Dá tempo para o próprio simulado
     * ler seu _state.
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          250
        )
    );


    restoreFields(
      doc,
      record
    );


    /*
     * Se necessário,
     * navega até a questão salva.
     */

    await navigateToSavedQuestion(
      doc,
      record
    );


    /*
     * Restaura novamente depois
     * da navegação.
     */

    restoreFields(
      doc,
      record
    );


    try {

      frame.contentWindow
        .scrollTo({

          top:
            Number(
              record.scrollY ||
              0
            ),

          behavior:
            'auto'

        });

    } catch (_) {}


    setTimeout(

      () =>
        restoreFields(
          doc,
          record
        ),

      500

    );
  }


  /* ============================================================
     CAPTURA
     ============================================================ */

  function captureActive(
    force
  ) {

    if (

      !active ||
      !active.frame ||
      !active.path

    ) {

      return;
    }


    if (
      !active.dirty &&
      !force
    ) {

      return;
    }


    let doc;


    try {

      doc =
        active.frame
          .contentDocument;

    } catch (_) {

      return;
    }


    if (
      !doc ||
      !doc.body
    ) {

      return;
    }


    const question =
      questionInfo(doc);


    const record = {

      version:
        3,

      /*
       * CAMINHO REAL:
       * mantém maiúsculas.
       */

      path:
        active.path,

      name:
        cleanSimulationName(
          active.path
        ),

      subject:
        subjectFrom(
          active.path
        ),

      question,

      questionNumber:
        question.number,

      updatedAt:
        new Date()
          .toISOString(),

      scrollY:

        Math.round(

          active.frame
            .contentWindow
            .scrollY

          ||

          0

        ),

      fields:
        captureFields(doc),

      nativeState:
        captureNativeState(doc)

    };


    setRecord(
      record
    );


    active.dirty =
      false;
  }


  function scheduleCapture() {

    if (!active) {
      return;
    }


    active.dirty =
      true;


    clearTimeout(
      active.timer
    );


    active.timer =
      setTimeout(

        () =>
          captureActive(
            false
          ),

        250

      );
  }


  /* ============================================================
     RECARREGAR IFRAME
     ============================================================ */

  function reloadFrame(frame) {

    try {

      frame.contentWindow
        .location
        .reload();


    } catch (_) {

      const src =
        frame.getAttribute(
          'src'
        );


      if (src) {

        frame.setAttribute(
          'src',
          src
        );
      }
    }
  }


  /* ============================================================
     CONFIGURAR SIMULADO
     ============================================================ */

  function setupFrame(frame) {

    const path =
      framePath(frame);


    if (
      !isSimulationPath(
        path
      )
    ) {

      return;
    }


    let doc;


    try {

      doc =
        frame.contentDocument;

    } catch (_) {

      return;
    }


    if (
      !doc ||
      !doc.body
    ) {

      return;
    }


    if (
      active &&
      active.interval
    ) {

      clearInterval(
        active.interval
      );
    }


    const historyKey =
      discoverHistoryKey(
        doc
      );


    active = {

      frame,

      path,

      dirty:
        false,

      timer:
        null,

      interval:
        null,

      historyKey,

      historyBefore:

        historyKey

          ? localStorage.getItem(
              historyKey
            )

          : null

    };


    /* --------------------------------------------------------
       INTERAÇÕES
       -------------------------------------------------------- */

    doc.addEventListener(
      'input',
      scheduleCapture,
      true
    );


    doc.addEventListener(
      'change',
      scheduleCapture,
      true
    );


    doc.addEventListener(
      'keydown',
      scheduleCapture,
      true
    );


    doc.addEventListener(

      'click',

      event => {

        const control =

          event.target.closest

            ? event.target.closest(

                'button, a, [role="button"], label, input'

              )

            : null;


        const text =
          normText(

            control &&
            (
              control.textContent

              ||

              control.getAttribute(
                'aria-label'
              )

              ||

              ''
            )

          );


        /*
         * Antes de voltar ao Hub,
         * salva imediatamente.
         */

        if (
          /voltar ao hub/
            .test(text)
        ) {

          active.dirty =
            true;


          captureActive(
            true
          );
        }


        scheduleCapture();

      },

      true

    );


    /* --------------------------------------------------------
       CONCLUSÃO
       -------------------------------------------------------- */

    active.interval =
      setInterval(

        () => {

          if (

            !active ||
            active.frame !==
              frame

          ) {

            return;
          }


          /*
           * Se o history mudou,
           * a tentativa terminou.
           */

          if (
            historyKey
          ) {

            const now =
              localStorage.getItem(
                historyKey
              );


            if (
              now !==
                active.historyBefore
            ) {

              removeRecord(
                path
              );


              active.historyBefore =
                now;


              active.dirty =
                false;


              return;
            }
          }


          captureActive(
            false
          );

        },

        1500

      );


    /* --------------------------------------------------------
       AÇÃO PENDENTE
       -------------------------------------------------------- */

    const pending =

      pendingAction

      &&

      keyPath(
        pendingAction.path
      )

      ===

      keyPath(path)

        ? pendingAction

        : null;


    if (pending) {

      pendingAction =
        null;


      /*
       * CONTINUAR
       */

      if (
        pending.mode ===
          'continue'
      ) {

        setTimeout(

          () =>
            restoreUniversal(

              frame,

              pending.record

            ),

          100

        );
      }


      /*
       * FRESH:
       * simplesmente deixa o simulado
       * abrir do zero.
       */


      updateButton();

      return;
    }


    /* --------------------------------------------------------
       ABERTURA NORMAL
       -------------------------------------------------------- */

    const existing =
      getRecord(path);


    if (existing) {

      setTimeout(

        () =>
          showOpenChoice(

            existing,

            frame

          ),

        180

      );
    }


    updateButton();
  }


  function registerFrame(frame) {

    if (
      frame.dataset
        .medsimResumeV3 ===
      '1'
    ) {

      return;
    }


    frame.dataset
      .medsimResumeV3 =
      '1';


    frame.addEventListener(

      'load',

      () =>
        setupFrame(
          frame
        )

    );


    try {

      if (

        frame.contentDocument

        &&

        frame.contentDocument
          .readyState ===
          'complete'

      ) {

        setupFrame(
          frame
        );
      }

    } catch (_) {}
  }


  function scanFrames() {

    document
      .querySelectorAll(
        'iframe'
      )
      .forEach(
        registerFrame
      );
  }


  /* ============================================================
     LOCALIZAR SIMULADO NO HUB
     ============================================================ */

  function candidatePathsFromElement(
    element
  ) {

    const output =
      [];


    [

      'href',
      'data-file',
      'data-src',
      'data-path',
      'data-simulado',
      'data-arquivo'

    ]
    .forEach(
      attribute => {

        const value =

          element.getAttribute

          &&

          element.getAttribute(
            attribute
          );


        if (

          value

          &&

          /\.html?(?:[?#]|$)/i
            .test(value)

        ) {

          output.push(
            realPath(value)
          );
        }

      }
    );


    /*
     * Também procura caminho dentro
     * de onclick="carregarSimulado('...')"
     */

    const onclick =

      (
        element.getAttribute

        &&

        element.getAttribute(
          'onclick'
        )
      )

      || '';


    const matches =

      onclick.match(

        /["']([^"']+\.html?(?:[?#][^"']*)?)["']/ig

      )

      || [];


    matches.forEach(
      value =>

        output.push(

          realPath(

            value.slice(
              1,
              -1
            )

          )

        )
    );


    return output;
  }


  function findSimulationElement(
    record
  ) {

    const target =
      keyPath(
        record.path
      );


    const base =
      basename(
        record.path
      )
      .toLowerCase();


    const elements = [

      ...document.querySelectorAll(

        'a,' +
        'button,' +
        '[onclick],' +
        '[data-file],' +
        '[data-src],' +
        '[data-path],' +
        '[data-simulado],' +
        '[data-arquivo]'

      )

    ];


    return (

      elements.find(
        element =>

          candidatePathsFromElement(
            element
          )

          .some(
            path =>

              keyPath(path) ===
                target

              ||

              basename(path)
                .toLowerCase() ===
                base
          )
      )

      || null

    );
  }


  /* ============================================================
     CONTINUAR A PARTIR DO HUB
     ============================================================ */

  function openSimulation(
    record
  ) {

    /*
     * Restaura o _state antes mesmo
     * de abrir o HTML.
     */

    applyNativeState(
      record.nativeState
    );


    pendingAction = {

      path:
        record.path,

      mode:
        'continue',

      record

    };


    closeModal();


    /*
     * Primeiro tenta clicar no próprio
     * card/link já existente no Hub.
     *
     * Isso preserva toda a lógica
     * original do Hub.
     */

    const element =
      findSimulationElement(
        record
      );


    if (element) {

      element.click();

      return;
    }


    /*
     * Fallback.
     */

    if (
      typeof window
        .carregarSimulado ===
        'function'
    ) {

      try {

        window.carregarSimulado(
          record.path
        );

        return;

      } catch (_) {}
    }


    pendingAction =
      null;


    alert(

      'Não foi possível localizar automaticamente este simulado no Hub.\n\n'

      +

      'Abra-o normalmente e escolha “Continuar”.'

    );
  }


  /* ============================================================
     CONTINUAR SIMULADO JÁ ABERTO
     ============================================================ */

  function continueCurrent(
    record,
    frame
  ) {

    /*
     * Primeiro devolve o state nativo.
     */

    applyNativeState(
      record.nativeState
    );


    /*
     * Marca o próximo load para
     * completar a restauração.
     */

    pendingAction = {

      path:
        framePath(frame),

      mode:
        'continue',

      record

    };


    closeModal();


    /*
     * Recarrega para que o próprio
     * JS do simulado leia o state.
     */

    reloadFrame(
      frame
    );
  }


  /* ============================================================
     RECOMEÇAR
     ============================================================ */

  function restartCurrent(
    record,
    frame
  ) {

    let doc;


    try {

      doc =
        frame.contentDocument;

    } catch (_) {

      doc =
        null;
    }


    /*
     * Remove apenas o STATE em andamento.
     *
     * NÃO remove history.
     */

    if (doc) {

      clearNativeState(
        doc,
        record
      );
    }


    /*
     * Remove nossa camada universal.
     */

    removeRecord(
      record.path
    );


    /*
     * Próximo load será "fresh".
     */

    pendingAction = {

      path:
        framePath(frame),

      mode:
        'fresh',

      record:
        null

    };


    closeModal();


    /*
     * Recarrega o simulado.
     */

    reloadFrame(
      frame
    );
  }


  /* ============================================================
     CSS
     ============================================================ */

  function injectStyle() {

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


    style.textContent = `

      #${BUTTON_ID} {

        position:
          fixed;

        right:
          18px;

        bottom:
          18px;

        z-index:
          2147481000;


        display:
          none;

        align-items:
          center;

        gap:
          8px;


        min-height:
          42px;


        padding:
          9px 14px;


        border:

          1px solid
          rgba(
            99,
            102,
            241,
            .18
          );


        border-radius:
          12px;


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
          .80rem;


        font-weight:
          750;


        cursor:
          pointer;


        box-shadow:

          0 8px 24px
          rgba(
            15,
            23,
            42,
            .12
          );


        transition:
          .16s ease;
      }


      #${BUTTON_ID}:hover {

        transform:
          translateY(-1px);


        box-shadow:

          0 10px 28px
          rgba(
            15,
            23,
            42,
            .15
          );
      }


      #${BUTTON_ID}
      .medsim-resume-safe-icon {

        display:
          inline-flex;

        align-items:
          center;

        justify-content:
          center;


        width:
          27px;

        height:
          27px;


        border-radius:
          8px;


        color:
          #ffffff;


        background:

          linear-gradient(
            135deg,
            #4f46e5,
            #7c3aed
          );
      }


      #${BUTTON_ID}
      .medsim-resume-safe-count {

        display:
          inline-flex;

        align-items:
          center;

        justify-content:
          center;


        min-width:
          21px;

        height:
          21px;


        padding:
          0 5px;


        border-radius:
          999px;


        background:

          rgba(
            99,
            102,
            241,
            .10
          );


        color:

          var(
            --purple-primary,
            #6366f1
          );


        font-size:
          .70rem;


        font-weight:
          800;
      }


      #${MODAL_ID} {

        position:
          fixed;

        inset:
          0;


        z-index:
          2147482500;


        display:
          none;


        align-items:
          center;

        justify-content:
          center;


        padding:
          18px;


        box-sizing:
          border-box;


        background:

          rgba(
            15,
            23,
            42,
            .42
          );


        backdrop-filter:
          blur(6px);
      }


      #${MODAL_ID}[
        data-open="true"
      ] {

        display:
          flex;
      }


      #${MODAL_ID}
      .medsim-resume-safe-card {

        width:

          min(
            520px,
            100%
          );


        max-height:
          calc(100vh - 36px);


        overflow:
          auto;


        box-sizing:
          border-box;


        padding:
          18px;


        border:

          1px solid
          var(
            --border-color,
            rgba(148,163,184,.22)
          );


        border-radius:
          18px;


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

          0 24px 70px
          rgba(
            15,
            23,
            42,
            .22
          );
      }


      #${MODAL_ID}
      .medsim-resume-safe-head {

        display:
          flex;

        align-items:
          flex-start;

        justify-content:
          space-between;

        gap:
          12px;


        margin-bottom:
          14px;
      }


      #${MODAL_ID}
      .medsim-resume-safe-title {

        font-size:
          1rem;

        font-weight:
          800;
      }


      #${MODAL_ID}
      .medsim-resume-safe-subtitle {

        margin-top:
          3px;


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .76rem;
      }


      #${MODAL_ID}
      .medsim-resume-safe-close {

        width:
          34px;

        height:
          34px;


        border:
          0;


        border-radius:
          10px;


        background:

          rgba(
            148,
            163,
            184,
            .08
          );


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


      #${MODAL_ID}
      .medsim-resume-safe-list {

        display:
          grid;

        gap:
          9px;
      }


      #${MODAL_ID}
      .medsim-resume-safe-item {

        padding:
          12px;


        border:

          1px solid
          var(
            --border-color,
            rgba(148,163,184,.22)
          );


        border-radius:
          13px;


        background:

          rgba(
            99,
            102,
            241,
            .035
          );
      }


      #${MODAL_ID}
      .medsim-resume-safe-name {

        font-size:
          .88rem;

        font-weight:
          800;
      }


      #${MODAL_ID}
      .medsim-resume-safe-subject {

        margin-top:
          2px;


        color:

          var(
            --purple-primary,
            #6366f1
          );


        font-size:
          .73rem;


        font-weight:
          750;
      }


      #${MODAL_ID}
      .medsim-resume-safe-meta {

        margin-top:
          5px;


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .71rem;


        line-height:
          1.45;
      }


      #${MODAL_ID}
      .medsim-resume-safe-actions {

        display:
          flex;

        flex-wrap:
          wrap;

        gap:
          8px;


        margin-top:
          10px;
      }


      #${MODAL_ID}
      .medsim-resume-safe-action {

        min-height:
          36px;


        padding:
          8px 11px;


        border:

          1px solid
          var(
            --border-color,
            #dbe2ea
          );


        border-radius:
          9px;


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
          .75rem;


        font-weight:
          750;


        cursor:
          pointer;
      }


      #${MODAL_ID}
      .medsim-resume-safe-action.primary {

        border-color:
          transparent;


        color:
          #ffffff;


        background:

          linear-gradient(
            135deg,
            #4f46e5,
            #7c3aed
          );
      }


      #${MODAL_ID}
      .medsim-resume-safe-action.danger {

        color:
          #b91c1c;


        border-color:

          rgba(
            220,
            38,
            38,
            .18
          );


        background:

          rgba(
            220,
            38,
            38,
            .05
          );
      }


      #${MODAL_ID}
      .medsim-resume-safe-note {

        margin-top:
          12px;


        padding:
          9px 10px;


        border-radius:
          10px;


        background:

          rgba(
            148,
            163,
            184,
            .06
          );


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .68rem;


        line-height:
          1.45;
      }


      @media (
        max-width:
        560px
      ) {

        #${BUTTON_ID} {

          right:
            10px;

          bottom:
            10px;
        }


        #${MODAL_ID} {

          padding:
            12px;
        }

      }

    `;


    document.head
      .appendChild(style);
  }


  /* ============================================================
     INTERFACE
     ============================================================ */

  function createUI() {

    injectStyle();


    if (
      !document.getElementById(
        BUTTON_ID
      )
    ) {

      const button =
        document.createElement(
          'button'
        );


      button.id =
        BUTTON_ID;


      button.type =
        'button';


      button.innerHTML = `

        <span
          class="medsim-resume-safe-icon"
          aria-hidden="true">

          ↻

        </span>

        <span>
          Retomar simulado
        </span>

        <span
          class="medsim-resume-safe-count">

          0

        </span>

      `;


      button.addEventListener(
        'click',
        openList
      );


      document.body
        .appendChild(
          button
        );
    }


    if (
      !document.getElementById(
        MODAL_ID
      )
    ) {

      const modal =
        document.createElement(
          'div'
        );


      modal.id =
        MODAL_ID;


      modal.dataset.open =
        'false';


      modal.innerHTML = `

        <div
          class="medsim-resume-safe-card"
          role="dialog"
          aria-modal="true">

          <div class="medsim-resume-safe-head">

            <div>

              <div class="medsim-resume-safe-title">

                Retomar simulado

              </div>

              <div class="medsim-resume-safe-subtitle">

                Continue um simulado em andamento neste navegador

              </div>

            </div>


            <button
              type="button"
              class="medsim-resume-safe-close"
              aria-label="Fechar">

              ×

            </button>

          </div>


          <div class="medsim-resume-safe-list">

          </div>


          <div class="medsim-resume-safe-note">

            O salvamento universal complementa o sistema interno
            dos simulados. Resultados já concluídos não são apagados.

          </div>

        </div>

      `;


      document.body
        .appendChild(
          modal
        );


      modal
        .querySelector(
          '.medsim-resume-safe-close'
        )
        .addEventListener(
          'click',
          closeModal
        );


      modal.addEventListener(

        'pointerdown',

        event => {

          if (
            event.target === modal
          ) {

            closeModal();
          }

        }

      );
    }


    updateButton();
  }


  function updateButton() {

    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (!button) {
      return;
    }


    const records =
      allRecords();


    button.style.display =

      records.length &&
      !simulationOpen()

        ? 'flex'

        : 'none';


    const count =
      button.querySelector(
        '.medsim-resume-safe-count'
      );


    if (count) {

      count.textContent =
        String(
          records.length
        );
    }
  }


  function closeModal() {

    const modal =
      document.getElementById(
        MODAL_ID
      );


    if (modal) {

      modal.dataset.open =
        'false';
    }
  }


  /* ============================================================
     CARTÃO
     ============================================================ */

  function renderRecordCard(
    record,
    onContinue,
    onRestart,
    restartLabel
  ) {

    const item =
      document.createElement(
        'div'
      );


    item.className =
      'medsim-resume-safe-item';


    /*
     * Mesmo registros antigos da V2
     * passam a usar o nome limpo.
     */

    const name =

      record.name

      ||

      cleanSimulationName(
        record.path
      );


    const subject =

      record.subject

      ||

      subjectFrom(
        record.path
      );


    const questionLabel =

      (
        record.question &&
        record.question.label
      )

      ||

      (
        typeof record.question ===
          'string'

          ? record.question

          : 'Progresso salvo'
      );


    item.innerHTML = `

      <div class="medsim-resume-safe-name">

      </div>


      <div class="medsim-resume-safe-subject">

      </div>


      <div class="medsim-resume-safe-meta">

      </div>


      <div class="medsim-resume-safe-actions">

        <button
          type="button"
          class="medsim-resume-safe-action primary">

          Continuar

        </button>


        <button
          type="button"
          class="medsim-resume-safe-action danger">

        </button>

      </div>

    `;


    item
      .querySelector(
        '.medsim-resume-safe-name'
      )
      .textContent =
        name;


    item
      .querySelector(
        '.medsim-resume-safe-subject'
      )
      .textContent =
        subject;


    item
      .querySelector(
        '.medsim-resume-safe-meta'
      )
      .textContent =

        `${questionLabel} · salvo em ${

          formatDate(
            record.updatedAt
          )

        }`;


    const buttons =
      item.querySelectorAll(
        'button'
      );


    buttons[0]
      .addEventListener(
        'click',
        onContinue
      );


    buttons[1]
      .textContent =

        restartLabel

        ||

        'Descartar progresso';


    buttons[1]
      .addEventListener(
        'click',
        onRestart
      );


    return item;
  }


  /* ============================================================
     LISTA NO HUB
     ============================================================ */

  function openList() {

    const modal =
      document.getElementById(
        MODAL_ID
      );


    const list =

      modal

      &&

      modal.querySelector(
        '.medsim-resume-safe-list'
      );


    if (
      !modal ||
      !list
    ) {

      return;
    }


    list.innerHTML =
      '';


    allRecords()
      .forEach(
        record => {

          list.appendChild(

            renderRecordCard(

              record,


              () =>
                openSimulation(
                  record
                ),


              () => {

                const ok =
                  confirm(

                    'Descartar o progresso salvo deste simulado?\n\n'

                    +

                    'Resultados já concluídos não serão apagados.'

                  );


                if (!ok) {
                  return;
                }


                removeRecord(
                  record.path
                );


                openList();
              },


              'Descartar progresso'

            )

          );

        }
      );


    modal.dataset.open =
      'true';
  }


  /* ============================================================
     MODAL AO ABRIR O SIMULADO
     ============================================================ */

  function showOpenChoice(
    record,
    frame
  ) {

    const modal =
      document.getElementById(
        MODAL_ID
      );


    const list =

      modal

      &&

      modal.querySelector(
        '.medsim-resume-safe-list'
      );


    if (
      !modal ||
      !list
    ) {

      return;
    }


    list.innerHTML =
      '';


    list.appendChild(

      renderRecordCard(

        record,


        /*
         * CONTINUAR
         */

        () =>
          continueCurrent(
            record,
            frame
          ),


        /*
         * RECOMEÇAR
         */

        () => {

          const ok =
            confirm(

              'Recomeçar este simulado do início?\n\n'

              +

              'O progresso em andamento será descartado, mas resultados já concluídos serão mantidos.'

            );


          if (!ok) {
            return;
          }


          restartCurrent(
            record,
            frame
          );
        },


        'Recomeçar'

      )

    );


    modal.dataset.open =
      'true';
  }


  /* ============================================================
     INÍCIO
     ============================================================ */

  function start() {

    createUI();

    scanFrames();


    /*
     * Continua sem MutationObserver
     * sobre o Hub.
     */

    setInterval(

      () => {

        scanFrames();

        updateButton();

      },

      1200

    );


    document.addEventListener(

      'keydown',

      event => {

        if (
          event.key ===
          'Escape'
        ) {

          closeModal();
        }

      }

    );


    window.addEventListener(

      'beforeunload',

      () => {

        if (active) {

          active.dirty =
            true;


          captureActive(
            true
          );
        }

      }

    );


    console.info(

      '[MedSim] Retomar simulado v3 ativo.'

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
