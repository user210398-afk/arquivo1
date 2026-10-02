(function () {
  'use strict';

  /* ============================================================
     MEDSIM — RETOMAR SIMULADO v4 — HUB

     Este arquivo agora faz SOMENTE:

     1. Detectar e salvar simulados em andamento
     2. Mostrar "Retomar simulado" no Hub
     3. Listar os simulados em andamento
     4. Abrir o simulado escolhido
     5. Descartar um progresso salvo

     IMPORTANTE:

     Ele NÃO mostra mais:
     - Continuar de onde parei
     - Recomeçar

     dentro do simulado.

     Isso será responsabilidade exclusiva de:

     retomar-simulado-interno.js
     ============================================================ */


  const STORE_KEY =
    'medsim_resume_v2';

  const BUTTON_ID =
    'medsim-resume-safe-button';

  const MODAL_ID =
    'medsim-resume-safe-modal';

  const STYLE_ID =
    'medsim-resume-safe-style-v4';


  let active =
    null;


  /* ============================================================
     CAMINHOS
     ============================================================ */

  function keyPath(value) {

    if (!value) {
      return '';
    }


    try {

      const url =
        new URL(
          String(value),
          location.href
        );


      return decodeURIComponent(
        url.pathname
      )

        .replace(
          /^\/+/,
          ''
        )

        .toLowerCase();


    } catch (_) {

      return String(value)

        .split(/[?#]/)[0]

        .replace(
          /\\/g,
          '/'
        )

        .replace(
          /^\.\//,
          ''
        )

        .replace(
          /^\/+/,
          ''
        )

        .toLowerCase();
    }
  }


  /*
   * Mantém maiúsculas/minúsculas.
   *
   * Esse é o caminho REAL usado
   * para abrir o arquivo.
   */

  function realPath(value) {

    if (!value) {
      return '';
    }


    try {

      const url =
        new URL(
          String(value),
          location.href
        );


      return decodeURIComponent(
        url.pathname
      )

        .replace(
          /^\/+/,
          ''
        );


    } catch (_) {

      try {

        return decodeURIComponent(

          String(value)

            .split(/[?#]/)[0]

            .replace(
              /\\/g,
              '/'
            )

            .replace(
              /^\.\//,
              ''
            )

            .replace(
              /^\/+/,
              ''
            )

        );


      } catch (_) {

        return String(value)

          .split(/[?#]/)[0]

          .replace(
            /\\/g,
            '/'
          )

          .replace(
            /^\.\//,
            ''
          )

          .replace(
            /^\/+/,
            ''
          );
      }
    }
  }


  function basename(value) {

    return (

      realPath(value)
        .split('/')
        .pop()

      ||

      ''

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
     DISCIPLINA
     ============================================================ */

  function subjectFrom(path) {

    const text =
      normText(path);


    if (
      /farmaco/.test(text)
    ) {

      return 'Farmacologia';
    }


    if (
      /fisiologia|endocrino|hipofise|pancreatic/
        .test(text)
    ) {

      return 'Fisiologia';
    }


    if (
      /imuno/.test(text)
    ) {

      return 'Imunologia';
    }


    if (
      /micro/.test(text)
    ) {

      return 'Microbiologia';
    }


    if (
      /parasito/.test(text)
    ) {

      return 'Parasitologia';
    }


    if (
      /patologia/.test(text)
    ) {

      return 'Patologia';
    }


    if (
      /propedeu/.test(text)
    ) {

      return 'Propedêutica';
    }


    if (
      /psico/.test(text)
    ) {

      return 'Psicomed';
    }


    if (
      /vigil/.test(text)
    ) {

      return 'Vigilância em Saúde';
    }


    return 'Simulado';
  }


  /* ============================================================
     NOME BONITO DO SIMULADO
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
          /_/g,
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
     * Remove a disciplina
     * do começo do nome.
     */

    name =
      name.replace(

        /^\s*(farmaco(?:logia)?|fisiologia|imunologia|imuno|microbiologia|micro|parasitologia|parasito|patologia|propedeutica|propedeu|psicomed|psico|vigilancia(?: em saude)?|vigil)\b\s*/i,

        ''

      );


    /*
     * Remove códigos internos
     * como M5, B4, P2 etc.
     */

    name =
      name

        .replace(
          /^\s*(m\d+|b\d+|p\d+)\b\s*/i,
          ''
        )

        .replace(
          /^\s*aula\b\s*/i,
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

    const date =
      new Date(
        iso || ''
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '';
    }


    return date.toLocaleString(

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
     ARMAZENAMENTO
     ============================================================ */

  function loadStore() {

    try {

      const raw =
        JSON.parse(

          localStorage.getItem(
            STORE_KEY
          )

          ||

          '{}'

        );


      return (

        raw &&
        typeof raw === 'object' &&
        !Array.isArray(raw)

          ? raw

          : {}

      );


    } catch (_) {

      return {};
    }
  }


  function saveStore(store) {

    try {

      localStorage.setItem(

        STORE_KEY,

        JSON.stringify(
          store
        )

      );


    } catch (error) {

      console.warn(

        '[MedSim] Não foi possível salvar o progresso.',

        error

      );
    }


    updateButton();
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


    saveStore(
      store
    );
  }


  function removeRecord(path) {

    const store =
      loadStore();


    delete store[
      keyPath(path)
    ];


    saveStore(
      store
    );
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
     IFRAME / SIMULADO ABERTO
     ============================================================ */

  function framePath(frame) {

    return realPath(

      frame.getAttribute(
        'src'
      )

      ||

      ''

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
        getComputedStyle(
          frame
        );


      if (
        style.display ===
          'none'

        ||

        style.visibility ===
          'hidden'
      ) {

        return false;
      }


      const rect =
        frame.getBoundingClientRect();


      return (

        rect.width > 0 &&
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
     JAVASCRIPT INTERNO
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
     ============================================================ */

  function discoverStateKeys(doc) {

    const found =
      new Set();


    const text =
      scriptText(doc);


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


    const history =
      discoverHistoryKey(
        doc
      );


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


    const bodyText =

      (
        doc.body &&
        doc.body.innerText
      )

      ||

      '';


    const match =
      bodyText.match(

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
     CAMPOS / RESPOSTAS
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

              'checked' in element

                ? Boolean(
                    element.checked
                  )

                : null

          };
        }
      );
  }


  /* ============================================================
     SALVAR PROGRESSO
     ============================================================ */

  function captureActive(force) {

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
      questionInfo(
        doc
      );


    const record = {

      version:
        4,

      /*
       * Caminho real.
       */

      path:
        active.path,

      /*
       * Nome amigável.
       */

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
        captureFields(
          doc
        ),

      /*
       * Guardamos também o state nativo.
       *
       * O retomar-simulado-interno.js
       * será responsável por utilizá-lo.
       */

      nativeState:
        captureNativeState(
          doc
        )

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
     MONITORAR SIMULADO
     ============================================================ */

  function setupFrame(frame) {

    const path =
      framePath(
        frame
      );


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


    /*
     * Cancela apenas o monitoramento
     * do iframe anterior.
     */

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
       RESPOSTAS
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


    /* --------------------------------------------------------
       CLIQUES
       -------------------------------------------------------- */

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

            control

            &&

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
         * Ao clicar em Voltar ao Hub,
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
       FECHAR / RECARREGAR
       -------------------------------------------------------- */

    try {

      frame.contentWindow
        .addEventListener(

          'beforeunload',

          () => {

            if (
              active &&
              active.frame === frame
            ) {

              active.dirty =
                true;


              captureActive(
                true
              );
            }

          }

        );


    } catch (_) {}


    /* --------------------------------------------------------
       DETECTAR CONCLUSÃO
       -------------------------------------------------------- */

    active.interval =
      setInterval(

        () => {

          if (
            !active ||
            active.frame !== frame
          ) {

            return;
          }


          /*
           * Se o history mudou,
           * entendemos que a tentativa
           * terminou.
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


    /*
     * IMPORTANTE:
     *
     * Não mostramos mais nenhum modal
     * Continuar/Recomeçar aqui.
     *
     * retomar-simulado-interno.js
     * será responsável por isso.
     */

    updateButton();
  }


  /* ============================================================
     REGISTRAR IFRAMES
     ============================================================ */

  function registerFrame(frame) {

    if (
      frame.dataset
        .medsimResumeHubV4 ===
      '1'
    ) {

      return;
    }


    frame.dataset
      .medsimResumeHubV4 =
      '1';


    frame.addEventListener(

      'load',

      () => {

        setTimeout(
          () => {

            setupFrame(
              frame
            );

          },
          100
        );

      }

    );


    try {

      if (
        frame.contentDocument &&
        frame.contentDocument
          .readyState ===
          'complete'
      ) {

        setTimeout(
          () => {

            setupFrame(
              frame
            );

          },
          100
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
          value &&
          /\.html?(?:[?#]|$)/i
            .test(value)
        ) {

          output.push(
            realPath(
              value
            )
          );
        }

      }
    );


    const onclick =

      (
        element.getAttribute

        &&

        element.getAttribute(
          'onclick'
        )
      )

      ||

      '';


    const regex =
      /["']([^"']+\.html?(?:[?#][^"']*)?)["']/ig;


    let match;


    while (
      (
        match =
          regex.exec(
            onclick
          )
      )
    ) {

      output.push(
        realPath(
          match[1]
        )
      );
    }


    return output;
  }


  function findSimulationElement(
    record
  ) {

    const target =
      keyPath(
        record.path
      );


    const targetBase =
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
                  targetBase
            )
      )

      ||

      null

    );
  }


  /* ============================================================
     ABRIR SIMULADO

     ALTERAÇÃO PRINCIPAL DA V4:

     O Hub agora SOMENTE abre o arquivo.

     Não restaura respostas.
     Não restaura state.
     Não pergunta Continuar/Recomeçar.

     Isso será feito dentro do iframe
     por retomar-simulado-interno.js.
     ============================================================ */

  function openSimulation(record) {

    closeModal();


    /*
     * Primeiro usa o próprio elemento
     * original do Hub.
     *
     * É a opção mais segura porque
     * preserva toda a lógica original.
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
     * Fallback usando a função
     * existente do Hub.
     */

    if (
      typeof window.carregarSimulado ===
        'function'
    ) {

      try {

        window.carregarSimulado(
          record.path
        );


        return;


      } catch (error) {

        console.warn(

          '[MedSim] Falha ao abrir via carregarSimulado().',

          error

        );
      }
    }


    alert(

      'Não foi possível localizar automaticamente este simulado no Hub.'

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

      /* ======================================================
         BOTÃO RETOMAR
         ====================================================== */

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

          transform .16s ease,
          box-shadow .16s ease;
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


      /* ======================================================
         MODAL
         ====================================================== */

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
      .appendChild(
        style
      );
  }


  /* ============================================================
     INTERFACE DO HUB
     ============================================================ */

  function createUI() {

    injectStyle();


    /* --------------------------------------------------------
       BOTÃO FLUTUANTE
       -------------------------------------------------------- */

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


      /*
       * Continua independente
       * da sidebar/menu do Hub.
       */

      document.body
        .appendChild(
          button
        );
    }


    /* --------------------------------------------------------
       MODAL
       -------------------------------------------------------- */

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

              <div
                class="medsim-resume-safe-title">

                Retomar simulado

              </div>


              <div
                class="medsim-resume-safe-subtitle">

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


          <div
            class="medsim-resume-safe-list">

          </div>


          <div
            class="medsim-resume-safe-note">

            Ao abrir o simulado, você poderá escolher
            dentro dele entre continuar de onde parou
            ou recomeçar.

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


    /*
     * Só aparece no Hub.
     */

    button.style.display =

      records.length > 0 &&
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


    /*
     * Entrou no simulado:
     * fecha eventual modal do Hub.
     */

    if (
      simulationOpen()
    ) {

      closeModal();
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
     CARTÃO NO HUB
     ============================================================ */

  function renderRecordCard(record) {

    const item =
      document.createElement(
        'div'
      );


    item.className =
      'medsim-resume-safe-item';


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


    let question =
      'Progresso salvo';


    if (
      record.question &&
      record.question.label
    ) {

      question =
        record.question.label;


    } else if (
      typeof record.question ===
        'string'
    ) {

      question =
        record.question;
    }


    item.innerHTML = `

      <div
        class="medsim-resume-safe-name">

      </div>


      <div
        class="medsim-resume-safe-subject">

      </div>


      <div
        class="medsim-resume-safe-meta">

      </div>


      <div
        class="medsim-resume-safe-actions">

        <button
          type="button"
          class="medsim-resume-safe-action primary">

          Abrir simulado

        </button>


        <button
          type="button"
          class="medsim-resume-safe-action danger">

          Descartar progresso

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

        `${question} · salvo em ${

          formatDate(
            record.updatedAt
          )

        }`;


    const buttons =
      item.querySelectorAll(
        'button'
      );


    /*
     * ABRIR.
     *
     * Aqui não restauramos nada.
     */

    buttons[0]
      .addEventListener(

        'click',

        () => {

          openSimulation(
            record
          );
        }

      );


    /*
     * DESCARTAR PROGRESSO UNIVERSAL.
     */

    buttons[1]
      .addEventListener(

        'click',

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

        }

      );


    return item;
  }


  /* ============================================================
     ABRIR LISTA
     ============================================================ */

  function openList() {

    const modal =
      document.getElementById(
        MODAL_ID
      );


    if (!modal) {
      return;
    }


    const list =
      modal.querySelector(
        '.medsim-resume-safe-list'
      );


    list.innerHTML =
      '';


    const records =
      allRecords();


    records.forEach(
      record => {

        list.appendChild(

          renderRecordCard(
            record
          )

        );

      }
    );


    modal.dataset.open =
      'true';
  }


  /* ============================================================
     INICIAR
     ============================================================ */

  function start() {

    createUI();

    scanFrames();


    /*
     * Não usamos MutationObserver
     * no Hub inteiro.
     *
     * Verificamos apenas se surgiram
     * novos iframes.
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


    /*
     * Última tentativa de salvar
     * antes de fechar o Hub.
     */

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

      '[MedSim] Retomar simulado — Hub v4 ativo.'

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
