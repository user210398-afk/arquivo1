(function () {
  'use strict';

  /* ============================================================
     MEDSIM — RETOMAR SIMULADO v2 SAFE

     Esta versão foi desenhada para NÃO interferir no Hub.

     - Não altera .nav-menu
     - Não altera .sidebar
     - Não substitui carregarSimulado()
     - Não interfere com Backup
     - Não interfere com Desempenho
     - Não injeta CSS nos simulados
     - Não modifica HTMLs individuais

     O progresso fica em:
     medsim_resume_v2

     Portanto ele também entra automaticamente no backup,
     pois começa com "medsim_".
     ============================================================ */


  const STORE_KEY =
    'medsim_resume_v2';

  const LEGACY_PREFIX =
    'medsim_resume_v1:';

  const BUTTON_ID =
    'medsim-resume-safe-button';

  const MODAL_ID =
    'medsim-resume-safe-modal';

  const STYLE_ID =
    'medsim-resume-safe-style';


  let active =
    null;


  let pendingRestore =
    null;


  /* ============================================================
     UTILIDADES
     ============================================================ */

  function normalizePath(value) {

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


  function fileName(path) {

    return (
      String(path || '')
        .split('/')
        .pop()

      ||

      'Simulado'
    );
  }


  function displayName(path) {

    return fileName(path)

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


  function normalizeText(value) {

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


  function subjectFrom(path) {

    const text =
      normalizeText(path);


    if (/farmaco/.test(text)) {
      return 'Farmacologia';
    }


    if (
      /fisiologia|endocrino|hipofise|pancreatic/
        .test(text)
    ) {
      return 'Fisiologia';
    }


    if (/imuno/.test(text)) {
      return 'Imunologia';
    }


    if (/micro/.test(text)) {
      return 'Microbiologia';
    }


    if (/parasito/.test(text)) {
      return 'Parasitologia';
    }


    if (/patologia/.test(text)) {
      return 'Patologia';
    }


    if (/propedeu/.test(text)) {
      return 'Propedêutica';
    }


    if (/psico/.test(text)) {
      return 'Psicomed';
    }


    if (/vigil/.test(text)) {
      return 'Vigilância em Saúde';
    }


    return 'Simulado';
  }


  function formatDate(iso) {

    if (!iso) {
      return '';
    }


    const date =
      new Date(iso);


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
     BANCO LOCAL
     ============================================================ */

  function loadStore() {

    try {

      const raw =
        JSON.parse(
          localStorage.getItem(
            STORE_KEY
          ) || '{}'
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
        JSON.stringify(store)
      );

    } catch (error) {

      console.warn(
        '[MedSim] Não foi possível salvar a retomada.',
        error
      );
    }


    updateButton();
  }


  function getRecord(path) {

    const store =
      loadStore();


    return (
      store[
        normalizePath(path)
      ]

      ||

      null
    );
  }


  function setRecord(record) {

    const store =
      loadStore();


    store[
      normalizePath(
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
      normalizePath(path)
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
     MIGRAR DADOS DA V1

     Caso a versão anterior tenha criado algum registro,
     aproveitamos o progresso e apagamos apenas as chaves
     antigas da própria função de retomada.
     ============================================================ */

  function migrateLegacy() {

    const store =
      loadStore();


    const oldKeys =
      [];


    for (
      let i = 0;
      i < localStorage.length;
      i++
    ) {

      const key =
        localStorage.key(i);


      if (
        key &&
        key.startsWith(
          LEGACY_PREFIX
        )
      ) {

        oldKeys.push(key);
      }
    }


    oldKeys.forEach(key => {

      try {

        const record =
          JSON.parse(
            localStorage.getItem(
              key
            )
          );


        if (
          record &&
          record.path
        ) {

          store[
            normalizePath(
              record.path
            )
          ] =
            record;
        }


      } catch (_) {}


      localStorage.removeItem(key);
    });


    saveStore(store);
  }


  /* ============================================================
     DETECTAR SIMULADO ABERTO
     ============================================================ */

  function framePath(frame) {

    return normalizePath(

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
        getComputedStyle(frame);


      if (
        style.display === 'none' ||
        style.visibility === 'hidden'
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

    ].some(frame => {

      const path =
        framePath(frame);


      return (
        isSimulationPath(path) &&
        isFrameVisible(frame)
      );
    });
  }


  /* ============================================================
     DETECTAR QUESTÃO ATUAL

     Só para mostrar informação ao usuário.

     Não altera o simulado.
     ============================================================ */

  function questionLabel(doc) {

    try {

      const text =
        doc.body
          ? doc.body.innerText
          : '';


      const match =
        text.match(

          /quest(?:ão|ao)\s*(\d+)(?:\s*(?:de|\/)\s*(\d+))?/i

        );


      if (match) {

        return (
          `Questão ${match[1]}`

          +

          (
            match[2]
              ? ` de ${match[2]}`
              : ''
          )
        );
      }


    } catch (_) {}


    return 'Progresso salvo';
  }


  /* ============================================================
     CAMPOS DO SIMULADO
     ============================================================ */

  function captureFields(doc) {

    const fields = [

      ...doc.querySelectorAll(
        'input, textarea, select'
      )

    ].filter(element => {

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
    });


    return fields.map(
      (element, index) => {

        let nameIndex =
          -1;


        if (
          element.name
        ) {

          const same = [

            ...doc.getElementsByName(
              element.name
            )

          ];


          nameIndex =
            same.indexOf(element);
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


  function findField(
    doc,
    saved
  ) {

    if (
      saved.id
    ) {

      const byId =
        doc.getElementById(
          saved.id
        );


      if (byId) {
        return byId;
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
        saved.nameIndex >= 0 &&
        same[
          saved.nameIndex
        ]
      ) {

        return same[
          saved.nameIndex
        ];
      }


      if (same[0]) {
        return same[0];
      }
    }


    const fields = [

      ...doc.querySelectorAll(
        'input, textarea, select'
      )

    ].filter(element => {

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
    });


    return (
      fields[
        saved.index
      ]

      ||

      null
    );
  }


  function restoreFields(
    doc,
    record
  ) {

    (
      record.fields ||
      []
    ).forEach(saved => {

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
          saved.checked !== null &&
          'checked' in element
        ) {

          element.checked =
            saved.checked;
        }


        if (
          saved.value !== undefined &&
          saved.type !== 'radio' &&
          saved.type !== 'checkbox'
        ) {

          element.value =
            saved.value;
        }


        /*
         * Alguns simulados atualizam seu estado
         * quando recebem input/change.
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
    });
  }


  /* ============================================================
     DESCOBRIR HISTÓRICO NATIVO

     Se o histórico mudar, consideramos que a tentativa
     terminou e retiramos "Retomar simulado".
     ============================================================ */

  function discoverHistoryKey(doc) {

    try {

      const scripts = [

        ...doc.scripts

      ]
      .map(
        script =>
          script.textContent ||
          ''
      )
      .join('\n');


      const match =
        scripts.match(

          /simulado_[a-z0-9_-]+_history/i

        );


      return (
        match
          ? match[0]
          : ''
      );


    } catch (_) {

      return '';
    }
  }


  /* ============================================================
     CAPTURAR PROGRESSO
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


    const record = {

      version:
        2,

      path:
        active.path,

      title:

        doc.title ||

        displayName(
          active.path
        ),

      subject:

        subjectFrom(
          active.path
        ),

      question:
        questionLabel(doc),

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
        captureFields(doc)

    };


    setRecord(record);


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
          captureActive(false),
        250
      );
  }


  /* ============================================================
     RESTAURAR PROGRESSO

     Conservador:
     - deixa primeiro o simulador restaurar seu próprio estado
     - complementa campos
     - restaura posição da página

     NÃO clica automaticamente em Próxima/Anterior.
     ============================================================ */

  function restoreRecord(
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


    const restore =
      function () {

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
      };


    /*
     * Alguns simulados terminam de montar
     * a interface depois do load.
     */

    setTimeout(
      restore,
      250
    );


    setTimeout(
      restore,
      800
    );
  }


  /* ============================================================
     MONITORAR IFRAME
     ============================================================ */

  function setupFrame(
    frame
  ) {

    const path =
      framePath(frame);


    if (
      !isSimulationPath(path)
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
      discoverHistoryKey(doc);


    const historyBefore =

      historyKey

        ? localStorage.getItem(
            historyKey
          )

        : null;


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

      historyBefore

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
          normalizeText(

            control

              ? (
                  control.textContent

                  ||

                  control.getAttribute(
                    'aria-label'
                  )

                  ||

                  ''
                )

              : ''

          );


        /*
         * Antes de sair para o Hub,
         * garante o último salvamento.
         */

        if (
          /voltar ao hub/
            .test(text)
        ) {

          active.dirty =
            true;


          captureActive(true);
        }


        scheduleCapture();

      },

      true

    );


    try {

      frame.contentWindow
        .addEventListener(

          'beforeunload',

          () =>
            captureActive(
              true
            )

        );


    } catch (_) {}


    /* --------------------------------------------------------
       DETECTAR CONCLUSÃO
       -------------------------------------------------------- */

    active.interval =
      setInterval(
        function () {

          if (
            !active ||
            active.frame !== frame
          ) {

            return;
          }


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

              removeRecord(path);


              active.historyBefore =
                now;


              active.dirty =
                false;


              return;
            }
          }


          captureActive(false);

        },
        1500
      );


    /* --------------------------------------------------------
       RETOMADA SOLICITADA PELO HUB
       -------------------------------------------------------- */

    if (
      pendingRestore ===
        path
    ) {

      const record =
        getRecord(path);


      pendingRestore =
        null;


      if (record) {

        restoreRecord(
          frame,
          record
        );
      }


      return;
    }


    /* --------------------------------------------------------
       ABERTURA NORMAL COM PROGRESSO EXISTENTE
       -------------------------------------------------------- */

    const existing =
      getRecord(path);


    if (
      existing
    ) {

      /*
       * Espera o simulado aparecer antes
       * de mostrar a escolha.
       */

      setTimeout(
        () =>
          showOpenChoice(
            existing,
            frame
          ),
        180
      );
    }
  }


  function registerFrame(
    frame
  ) {

    if (
      frame.dataset
        .medsimResumeSafe ===
      '1'
    ) {

      return;
    }


    frame.dataset
      .medsimResumeSafe =
      '1';


    frame.addEventListener(
      'load',
      function () {

        setupFrame(frame);

        updateButton();

      }
    );


    try {

      if (
        frame.contentDocument &&
        frame.contentDocument
          .readyState ===
          'complete'
      ) {

        setupFrame(frame);
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
     ABRIR SIMULADO A PARTIR DA LISTA DE RETOMADA
     ============================================================ */

  function findSimulationElement(
    path
  ) {

    const target =
      normalizePath(path);


    const base =
      fileName(target);


    const candidates = [

      ...document.querySelectorAll(
        'a, button, [onclick], [data-file], [data-src], [data-path], [data-simulado]'
      )

    ];


    return candidates.find(element => {

      const values = [

        element.getAttribute(
          'href'
        ),

        element.getAttribute(
          'onclick'
        ),

        element.getAttribute(
          'data-file'
        ),

        element.getAttribute(
          'data-src'
        ),

        element.getAttribute(
          'data-path'
        ),

        element.getAttribute(
          'data-simulado'
        )

      ]

      .filter(Boolean)

      .join(' ')

      .toLowerCase();


      return (
        values.includes(
          target
        )

        ||

        values.includes(
          base
        )
      );
    });
  }


  function openSimulation(
    record
  ) {

    const path =
      normalizePath(
        record.path
      );


    pendingRestore =
      path;


    closeModal();


    /*
     * Primeiro tenta usar a função
     * que o Hub já possui.
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


    /*
     * Fallback:
     * clica no próprio card/link do Hub.
     */

    const element =
      findSimulationElement(
        path
      );


    if (
      element
    ) {

      element.click();

      return;
    }


    pendingRestore =
      null;


    alert(

      'Não foi possível localizar automaticamente este simulado no Hub.'

    );
  }


  /* ============================================================
     CSS ISOLADO

     Nenhum seletor genérico do Hub.
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
          .85rem;


        font-weight:
          800;
      }


      #${MODAL_ID}
      .medsim-resume-safe-meta {

        margin-top:
          4px;


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .72rem;


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


      /*
       * IMPORTANTE:
       *
       * Vai direto para document.body.
       * Não entra no menu lateral.
       */

      document.body
        .appendChild(button);
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
            dos simulados. Nenhum resultado já concluído é apagado.

          </div>

        </div>

      `;


      document.body
        .appendChild(modal);


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

        function (event) {

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


    const show =
      records.length > 0 &&
      !simulationOpen();


    button.style.display =
      show
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
     LISTA DE SIMULADOS EM ANDAMENTO
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


    allRecords()
      .forEach(record => {

        const item =
          document.createElement(
            'div'
          );


        item.className =
          'medsim-resume-safe-item';


        item.innerHTML = `

          <div class="medsim-resume-safe-name">

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

              Descartar progresso

            </button>

          </div>

        `;


        item
          .querySelector(
            '.medsim-resume-safe-name'
          )
          .textContent =

            record.title

            ||

            displayName(
              record.path
            );


        item
          .querySelector(
            '.medsim-resume-safe-meta'
          )
          .textContent =

            `${

              record.subject

              ||

              subjectFrom(
                record.path
              )

            } · ${

              record.question

              ||

              'Progresso salvo'

            } · ${

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
            function () {

              openSimulation(
                record
              );
            }
          );


        buttons[1]
          .addEventListener(
            'click',
            function () {

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


        list.appendChild(item);

      });


    modal.dataset.open =
      'true';
  }


  /* ============================================================
     ABERTURA NORMAL DE SIMULADO COM PROGRESSO

     A prova já abriu.
     O usuário decide se quer restaurar a camada universal.
     ============================================================ */

  function showOpenChoice(
    record,
    frame
  ) {

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


    list.innerHTML = `

      <div class="medsim-resume-safe-item">

        <div class="medsim-resume-safe-name">

        </div>

        <div class="medsim-resume-safe-meta">

        </div>

        <div class="medsim-resume-safe-actions">

          <button
            type="button"
            class="medsim-resume-safe-action primary">

            Continuar de onde parei

          </button>

          <button
            type="button"
            class="medsim-resume-safe-action">

            Começar novamente

          </button>

        </div>

      </div>

    `;


    list
      .querySelector(
        '.medsim-resume-safe-name'
      )
      .textContent =

        record.title

        ||

        displayName(
          record.path
        );


    list
      .querySelector(
        '.medsim-resume-safe-meta'
      )
      .textContent =

        `${

          record.question

          ||

          'Progresso salvo'

        } · ${

          formatDate(
            record.updatedAt
          )

        }`;


    const buttons =
      list.querySelectorAll(
        'button'
      );


    buttons[0]
      .addEventListener(
        'click',
        function () {

          closeModal();


          restoreRecord(
            frame,
            record
          );

        }
      );


    buttons[1]
      .addEventListener(
        'click',
        function () {

          const ok =
            confirm(

              'Começar sem restaurar o progresso salvo?\n\n'

              +

              'O registro de retomada deste simulado será descartado.'

            );


          if (!ok) {
            return;
          }


          removeRecord(
            record.path
          );


          closeModal();

        }
      );


    modal.dataset.open =
      'true';
  }


  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */

  function start() {

    migrateLegacy();

    createUI();

    scanFrames();


    /*
     * Sem MutationObserver sobre o Hub.
     *
     * Apenas procura novos iframes ocasionalmente.
     */

    setInterval(
      function () {

        scanFrames();

        updateButton();

      },
      1200
    );


    document.addEventListener(

      'keydown',

      function (event) {

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

      function () {

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
      '[MedSim] Retomar simulado v2 Safe ativo.'
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
