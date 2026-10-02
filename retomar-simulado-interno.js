(function () {
  'use strict';


  /* ============================================================
     MEDSIM — RETOMAR SIMULADO INTERNO v1

     Trabalha dentro dos iframes dos simulados.

     O Hub continua sendo controlado por:
     retomar-simulado.js

     Este arquivo controla exclusivamente:

     - Continuar de onde parei
     - Recomeçar pela primeira questão
     ============================================================ */


  const STORE_KEY =
    'medsim_resume_v2';


  const STYLE_ID =
    'medsim-resume-inside-style';


  const PANEL_ID =
    'medsim-resume-inside-panel';


  const ACTION_KEY =
    'medsim_resume_inside_action_v1';



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



  /* ============================================================
     BANCO DO RETOMAR
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

    try {

      localStorage.setItem(

        STORE_KEY,

        JSON.stringify(
          store
        )

      );

    } catch (_) {}
  }



  function getRecord(path) {

    return (

      loadStore()[
        keyPath(path)
      ]

      ||

      null

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



  function questionLabel(record) {

    if (
      record &&
      record.question &&
      record.question.label
    ) {

      return record
        .question
        .label;
    }


    if (
      record &&
      typeof record.question ===
        'string'
    ) {

      return record.question;
    }


    if (
      record &&
      record.questionNumber
    ) {

      return (
        `Questão ${
          record.questionNumber
        }`
      );
    }


    return 'Progresso salvo';
  }



  function questionNumber(record) {

    if (!record) {
      return 0;
    }


    if (
      Number(
        record.questionNumber
      )
    ) {

      return Number(
        record.questionNumber
      );
    }


    if (
      record.question &&
      Number(
        record.question.number
      )
    ) {

      return Number(
        record.question.number
      );
    }


    const text =

      typeof record.question ===
        'string'

        ? record.question

        : (
            record.question &&
            record.question.label

              ? record.question.label

              : ''
          );


    const match =
      String(text)
        .match(

          /quest(?:ão|ao)\s*(\d+)/i

        );


    return match

      ? Number(
          match[1]
        )

      : 0;
  }



  /* ============================================================
     STATE NATIVO DO SIMULADO
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



  function discoverStateKeys(
    doc,
    record
  ) {

    const keys =
      new Set();


    const text =
      scriptText(
        doc
      );


    const regex =
      /simulado_[a-z0-9_-]+_state/ig;


    let match;


    while (
      (
        match =
          regex.exec(text)
      )
    ) {

      keys.add(
        match[0]
      );
    }



    /*
     * Também utiliza os states
     * que foram salvos no registro.
     */

    if (
      record &&
      record.nativeState &&
      typeof record.nativeState ===
        'object'
    ) {

      Object.keys(
        record.nativeState
      )
      .forEach(
        key => {

          if (

            /^simulado_[a-z0-9_-]+_state$/i
              .test(key)

          ) {

            keys.add(
              key
            );
          }

        }
      );
    }


    return [
      ...keys
    ];
  }



  function applyNativeState(record) {

    if (
      !record ||
      !record.nativeState ||
      typeof record.nativeState !==
        'object'
    ) {

      return;
    }


    Object.entries(
      record.nativeState
    )
    .forEach(
      ([key, value]) => {

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

    discoverStateKeys(
      doc,
      record
    )
    .forEach(
      key => {

        localStorage.removeItem(
          key
        );

      }
    );
  }



  /* ============================================================
     RESPOSTAS SALVAS
     ============================================================ */

  function restorableFields(doc) {

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

        Number.isInteger(
          saved.nameIndex
        )

        &&

        saved.nameIndex >= 0

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



    return (

      restorableFields(
        doc
      )[
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

            saved.checked !==
              undefined

            &&

            'checked' in
              element

          ) {

            element.checked =
              Boolean(
                saved.checked
              );
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
           * Faz o JavaScript nativo
           * perceber a mudança.
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
     QUESTÃO ATUAL
     ============================================================ */

  function visible(element) {

    if (!element) {
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
        element
          .getBoundingClientRect();


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



  function currentQuestionNumber(
    doc
  ) {

    const nodes = [

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
    );



    for (
      const node
      of nodes
    ) {

      const text =
        (
          node.textContent ||
          ''
        ).trim();


      if (
        !text ||
        text.length > 160
      ) {

        continue;
      }


      const match =
        text.match(

          /quest(?:ão|ao)\s*(\d+)/i

        );


      if (
        match
      ) {

        return Number(
          match[1]
        );
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

        /quest(?:ão|ao)\s*(\d+)/i

      );


    return match

      ? Number(
          match[1]
        )

      : 0;
  }



  /* ============================================================
     PRÓXIMA / ANTERIOR
     ============================================================ */

  function findNavButton(
    doc,
    direction
  ) {

    const nodes = [

      ...doc.querySelectorAll(

        'button, a, [role="button"]'

      )

    ]
    .filter(
      visible
    );


    const regex =

      direction ===
        'next'

        ? /^(proxima|proximo|próxima|próximo|avancar|avançar|seguinte|next)\b/i

        : /^(anterior|questao anterior|questão anterior|voltar questao|voltar questão|prev|previous)\b/i;



    return (

      nodes.find(
        element => {

          const text =
            (
              element.textContent

              ||

              element.getAttribute(
                'aria-label'
              )

              ||

              ''
            ).trim();


          return regex.test(
            text
          );
        }
      )

      || null

    );
  }



  async function navigateToQuestion(
    doc,
    target
  ) {

    if (!target) {
      return;
    }


    let current =
      currentQuestionNumber(
        doc
      );


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

      const direction =

        current < target

          ? 'next'

          : 'prev';


      const button =
        findNavButton(
          doc,
          direction
        );


      if (!button) {

        break;
      }


      button.click();


      await new Promise(

        resolve =>
          setTimeout(
            resolve,
            90
          )

      );


      const next =
        currentQuestionNumber(
          doc
        );


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
     * Espera o próprio simulado terminar
     * de restaurar seu estado nativo.
     */

    await new Promise(

      resolve =>
        setTimeout(
          resolve,
          220
        )

    );



    restoreFields(
      doc,
      record
    );



    await navigateToQuestion(

      doc,

      questionNumber(
        record
      )

    );



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



    /*
     * Última passagem porque alguns
     * simuladores remontam os campos.
     */

    setTimeout(

      () =>
        restoreFields(
          doc,
          record
        ),

      450

    );
  }



  /* ============================================================
     AÇÃO ENTRE RELOADS
     ============================================================ */

  function setAction(action) {

    try {

      sessionStorage.setItem(

        ACTION_KEY,

        JSON.stringify(
          action
        )

      );

    } catch (_) {}
  }



  function takeAction(path) {

    try {

      const raw =
        sessionStorage.getItem(
          ACTION_KEY
        );


      if (!raw) {

        return null;
      }


      const action =
        JSON.parse(
          raw
        );


      if (

        !action

        ||

        keyPath(
          action.path
        )

        !==

        keyPath(
          path
        )

      ) {

        return null;
      }


      sessionStorage.removeItem(
        ACTION_KEY
      );


      return action;


    } catch (_) {

      return null;
    }
  }



  /* ============================================================
     CSS DENTRO DO SIMULADO
     ============================================================ */

  function injectStyle(doc) {

    if (
      doc.getElementById(
        STYLE_ID
      )
    ) {

      return;
    }


    const style =
      doc.createElement(
        'style'
      );


    style.id =
      STYLE_ID;


    style.textContent = `

      #${PANEL_ID} {

        position:
          fixed;

        top:
          12px;

        right:
          12px;

        z-index:
          2147483000;


        width:

          min(
            360px,
            calc(100vw - 24px)
          );


        box-sizing:
          border-box;


        padding:
          12px;


        border:

          1px solid
          rgba(
            99,
            102,
            241,
            .18
          );


        border-radius:
          14px;


        background:

          rgba(
            255,
            255,
            255,
            .97
          );


        color:
          #0f172a;


        box-shadow:

          0 14px 38px
          rgba(
            15,
            23,
            42,
            .18
          ),

          0 3px 10px
          rgba(
            15,
            23,
            42,
            .08
          );


        backdrop-filter:
          blur(10px);


        font-family:
          inherit;
      }



      #${PANEL_ID}
      .medsim-resume-inside-title {

        font-size:
          .86rem;


        font-weight:
          800;


        line-height:
          1.25;
      }



      #${PANEL_ID}
      .medsim-resume-inside-meta {

        margin-top:
          4px;


        color:
          #64748b;


        font-size:
          .72rem;


        line-height:
          1.4;
      }



      #${PANEL_ID}
      .medsim-resume-inside-actions {

        display:
          flex;


        gap:
          8px;


        margin-top:
          10px;


        flex-wrap:
          wrap;
      }



      #${PANEL_ID}
      button {

        min-height:
          36px;


        padding:
          8px 11px;


        border-radius:
          9px;


        border:
          1px solid #dbe2ea;


        background:
          #ffffff;


        color:
          #0f172a;


        font:
          inherit;


        font-size:
          .75rem;


        font-weight:
          750;


        cursor:
          pointer;
      }



      #${PANEL_ID}
      .medsim-resume-inside-continue {

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



      #${PANEL_ID}
      .medsim-resume-inside-restart {

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



      #${PANEL_ID}[
        data-mode="done"
      ] {

        border-color:

          rgba(
            22,
            163,
            74,
            .18
          );
      }



      #${PANEL_ID}[
        data-mode="done"
      ]
      .medsim-resume-inside-title {

        color:
          #15803d;
      }



      @media (
        max-width:
        560px
      ) {

        #${PANEL_ID} {

          top:
            8px;

          right:
            8px;

          width:
            calc(100vw - 16px);
        }


        #${PANEL_ID}
        .medsim-resume-inside-actions {

          display:
            grid;


          grid-template-columns:
            1fr 1fr;
        }

      }

    `;


    doc.head
      .appendChild(
        style
      );
  }



  function removePanel(doc) {

    const panel =
      doc.getElementById(
        PANEL_ID
      );


    if (
      panel
    ) {

      panel.remove();
    }
  }



  /* ============================================================
     PROGRESSO RESTAURADO
     ============================================================ */

  function showRestored(
    doc,
    record
  ) {

    removePanel(
      doc
    );


    injectStyle(
      doc
    );


    const panel =
      doc.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.dataset.mode =
      'done';


    panel.innerHTML = `

      <div class="medsim-resume-inside-title">

        Progresso restaurado

      </div>


      <div class="medsim-resume-inside-meta">

      </div>

    `;


    panel
      .querySelector(
        '.medsim-resume-inside-meta'
      )
      .textContent =

        `${

          questionLabel(
            record
          )

        } · você pode continuar normalmente.`;



    doc.body
      .appendChild(
        panel
      );


    setTimeout(
      () => {

        if (
          panel.isConnected
        ) {

          panel.remove();
        }

      },
      3500
    );
  }



  /* ============================================================
     PAINEL CONTINUAR / RECOMEÇAR
     ============================================================ */

  function showChoice(
    frame,
    path,
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


    injectStyle(
      doc
    );


    removePanel(
      doc
    );


    const panel =
      doc.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.innerHTML = `

      <div class="medsim-resume-inside-title">

        Há um progresso salvo neste simulado

      </div>


      <div class="medsim-resume-inside-meta">

      </div>


      <div class="medsim-resume-inside-actions">


        <button
          type="button"
          class="medsim-resume-inside-continue">

          Continuar de onde parei

        </button>


        <button
          type="button"
          class="medsim-resume-inside-restart">

          Recomeçar

        </button>


      </div>

    `;



    panel
      .querySelector(
        '.medsim-resume-inside-meta'
      )
      .textContent =

        `${

          questionLabel(
            record
          )

        } · salvo em ${

          formatDate(
            record.updatedAt
          )

        }`;



    /* ========================================================
       CONTINUAR
       ======================================================== */

    panel
      .querySelector(
        '.medsim-resume-inside-continue'
      )
      .addEventListener(

        'click',

        () => {

          /*
           * Coloca o state nativo de volta
           * ANTES do reload.
           */

          applyNativeState(
            record
          );


          setAction({

            mode:
              'continue',

            path

          });


          /*
           * Recarrega o iframe para que
           * o próprio simulado leia seu state.
           */

          try {

            frame
              .contentWindow
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

      );



    /* ========================================================
       RECOMEÇAR
       ======================================================== */

    panel
      .querySelector(
        '.medsim-resume-inside-restart'
      )
      .addEventListener(

        'click',

        () => {

          const ok =
            frame
              .contentWindow
              .confirm(

                'Recomeçar este simulado pela primeira questão?\n\n'

                +

                'O progresso em andamento será apagado, mas os resultados já concluídos serão mantidos.'

              );


          if (!ok) {
            return;
          }


          /*
           * Apaga somente state em andamento.
           * Não toca no history.
           */

          clearNativeState(
            doc,
            record
          );


          /*
           * Apaga a retomada universal.
           */

          removeRecord(
            path
          );


          setAction({

            mode:
              'restart',

            path

          });


          /*
           * Recarrega sem state.
           */

          try {

            frame
              .contentWindow
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

      );


    doc.body
      .appendChild(
        panel
      );
  }



  /* ============================================================
     CONFIGURAR IFRAME
     ============================================================ */

  async function setupFrame(
    frame
  ) {

    const path =
      realPath(

        frame.getAttribute(
          'src'
        )

        || ''

      );


    if (

      !/\.html?$/i.test(
        path
      )

      ||

      /index\.html?$/i.test(
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
     * Houve uma ação antes do reload?
     */

    const action =
      takeAction(
        path
      );


    const record =
      getRecord(
        path
      );



    /* ========================================================
       RECOMEÇOU
       ======================================================== */

    if (
      action &&
      action.mode ===
        'restart'
    ) {

      removePanel(
        doc
      );


      return;
    }



    /* ========================================================
       CONTINUOU
       ======================================================== */

    if (

      action

      &&

      action.mode ===
        'continue'

      &&

      record

    ) {

      /*
       * Garante novamente state nativo.
       */

      applyNativeState(
        record
      );


      /*
       * Complementa com campos
       * e posição/questão.
       */

      await restoreUniversal(

        frame,

        record

      );


      showRestored(

        doc,

        record

      );


      return;
    }



    /* ========================================================
       EXISTE PROGRESSO
       ======================================================== */

    if (
      record
    ) {

      showChoice(

        frame,

        path,

        record

      );


    } else {

      removePanel(
        doc
      );
    }
  }



  /* ============================================================
     IFRAMES
     ============================================================ */

  function registerFrame(
    frame
  ) {

    if (
      frame.dataset
        .medsimResumeInside ===
      '1'
    ) {

      return;
    }


    frame.dataset
      .medsimResumeInside =
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
          120
        );

      }

    );



    try {

      if (

        frame.contentDocument

        &&

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
          120
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
     INICIAR
     ============================================================ */

  function start() {

    scanFrames();


    /*
     * Não observa o DOM inteiro.
     * Apenas verifica se surgiu
     * algum novo iframe.
     */

    setInterval(

      scanFrames,

      1000

    );


    console.info(

      '[MedSim] Interface interna de retomada v1 ativa.'

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
