(function () {
  'use strict';

  const VERSION = 1;

  const PREFIX =
    'medsim_resume_v1:';

  const BUTTON_ID =
    'medsim-resume-button';

  const MODAL_ID =
    'medsim-resume-modal';

  const STYLE_ID =
    'medsim-resume-style';


  let pendingOpen = null;

  let bypassOpen = null;

  let active = null;



  /* ============================================================
     UTILIDADES
     ============================================================ */

  const normText =
    value =>
      String(value || '')

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



  function normPath(
    value
  ) {

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

        .split(
          /[?#]/
        )[0]

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



  function displayName(
    path
  ) {

    const base =

      String(
        path || ''
      )

        .split('/')

        .pop()

      ||

      'Simulado';


    return base

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



  function subjectFrom(
    path
  ) {

    const text =
      normText(
        path
      );


    if (
      /farmaco/.test(
        text
      )
    ) {

      return 'Farmacologia';
    }


    if (
      /fisiologia|endocrino|hipofise|pancreatic/
        .test(
          text
        )
    ) {

      return 'Fisiologia';
    }


    if (
      /imuno/.test(
        text
      )
    ) {

      return 'Imunologia';
    }


    if (
      /micro/.test(
        text
      )
    ) {

      return 'Microbiologia';
    }


    if (
      /parasito/.test(
        text
      )
    ) {

      return 'Parasitologia';
    }


    if (
      /patologia/.test(
        text
      )
    ) {

      return 'Patologia';
    }


    if (
      /propedeu/.test(
        text
      )
    ) {

      return 'Propedêutica';
    }


    if (
      /psico/.test(
        text
      )
    ) {

      return 'Psicomed';
    }


    if (
      /vigil/.test(
        text
      )
    ) {

      return 'Vigilância em Saúde';
    }


    return 'Simulado';
  }



  /* ============================================================
     LOCALSTORAGE
     ============================================================ */

  function recordKey(
    path
  ) {

    return (
      PREFIX +
      normPath(path)
    );
  }



  function loadRecord(
    path
  ) {

    try {

      const raw =
        localStorage.getItem(
          recordKey(path)
        );


      if (!raw) {
        return null;
      }


      const data =
        JSON.parse(
          raw
        );


      return (
        data &&
        data.path

          ? data

          : null
      );


    } catch (_) {

      return null;
    }
  }



  function saveRecord(
    record
  ) {

    try {

      localStorage.setItem(

        recordKey(
          record.path
        ),

        JSON.stringify(
          record
        )

      );


      updateHubUI();


    } catch (error) {

      console.warn(

        '[MedSim] Não foi possível salvar o progresso universal.',

        error

      );
    }
  }



  function removeRecord(
    path
  ) {

    localStorage.removeItem(
      recordKey(path)
    );


    updateHubUI();
  }



  function allRecords() {

    const result =
      [];


    for (
      let i = 0;
      i < localStorage.length;
      i++
    ) {

      const key =
        localStorage.key(
          i
        );


      if (
        !key ||
        !key.startsWith(
          PREFIX
        )
      ) {

        continue;
      }


      try {

        const item =
          JSON.parse(

            localStorage.getItem(
              key
            )

          );


        if (
          item &&
          item.path
        ) {

          result.push(
            item
          );
        }


      } catch (_) {}
    }


    return result.sort(

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
     VISIBILIDADE
     ============================================================ */

  function visible(
    element
  ) {

    if (
      !element ||
      !(element instanceof Element)
    ) {

      return false;
    }


    const style =

      element.ownerDocument
        .defaultView
        .getComputedStyle(
          element
        );


    if (
      style.display ===
        'none'

      ||

      style.visibility ===
        'hidden'

      ||

      Number(
        style.opacity
      ) ===
        0
    ) {

      return false;
    }


    const rect =
      element.getBoundingClientRect();


    return (

      rect.width > 0 &&
      rect.height > 0

    );
  }



  /* ============================================================
     QUESTÕES
     ============================================================ */

  function questionElements(
    doc
  ) {

    const selectors = [

      '[data-question]',

      '[data-questao]',

      '.question-card',

      '.question-container',

      '.question',

      '.questao',

      '.pergunta',

      '[id^="question"]',

      '[id^="questao"]'

    ];


    let best =
      [];


    for (
      const selector
      of selectors
    ) {

      const list = [

        ...doc.querySelectorAll(
          selector
        )

      ].filter(
        element => {

          const text =
            normText(
              element.textContent
            );


          return (

            text.length >
              10

            &&

            !/voltar ao hub/
              .test(
                text
              )

          );
        }
      );


      if (
        list.length >
          best.length

        &&

        list.length <=
          250
      ) {

        best =
          list;
      }
    }


    return best;
  }



  function currentQuestionInfo(
    doc
  ) {

    const all =
      questionElements(
        doc
      );


    /*
     * Fallback para simuladores
     * sem containers de questão claros.
     */

    if (
      !all.length
    ) {

      const body =
        normText(

          doc.body &&
          doc.body.innerText

        );


      const match =
        body.match(

          /questao\s*(\d+)\s*(?:de|\/)?\s*(\d+)?/i

        );


      return {

        index:

          match

            ? Math.max(
                0,
                Number(
                  match[1]
                ) - 1
              )

            : 0,


        number:

          match
            ? Number(
                match[1]
              )
            : null,


        total:

          match &&
          match[2]

            ? Number(
                match[2]
              )

            : null,


        label:

          match

            ? (
                `Questão ${match[1]}`

                +

                (
                  match[2]

                    ? ` de ${match[2]}`

                    : ''
                )
              )

            : 'Progresso salvo'

      };
    }



    const visibleQuestions =
      all.filter(
        visible
      );


    let current =
      null;



    if (
      visibleQuestions.length ===
      1
    ) {

      current =
        visibleQuestions[0];


    } else if (
      visibleQuestions.length >
      1
    ) {

      current =

        visibleQuestions

          .map(
            element => ({

              element,

              distance:

                Math.abs(

                  element
                    .getBoundingClientRect()
                    .top

                  -

                  90

                )

            })
          )

          .sort(
            (a, b) =>

              a.distance -
              b.distance

          )[0]
          .element;


    } else {

      current =
        all[0];
    }



    const index =
      Math.max(

        0,

        all.indexOf(
          current
        )

      );


    const text =
      normText(
        current.textContent
      );


    const match =
      text.match(
        /questao\s*(\d+)/i
      );


    const number =

      match

        ? Number(
            match[1]
          )

        : index + 1;


    return {

      index,

      number,

      total:
        all.length,

      label:

        `Questão ${number} de ${all.length}`

    };
  }



  /* ============================================================
     CAMPOS / RESPOSTAS
     ============================================================ */

  function fieldState(
    doc
  ) {

    const fields = [

      ...doc.querySelectorAll(
        'input, textarea, select'
      )

    ].filter(
      element =>

        ![

          'button',
          'submit',
          'reset',
          'file',
          'password'

        ].includes(

          (
            element.type ||
            ''
          ).toLowerCase()

        )

    );


    return fields.map(

      (
        element,
        index
      ) => {

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
            same.indexOf(
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

          tag:
            element.tagName,

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
     HISTÓRICO NATIVO
     ============================================================ */

  function discoverHistoryKey(
    doc
  ) {

    try {

      const text =

        [
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


      const matches =

        text.match(

          /simulado_[a-z0-9_\-]+_history/ig

        )

        ||

        [];


      return (
        matches[0] ||
        ''
      );


    } catch (_) {

      return '';
    }
  }



  /* ============================================================
     SALVAR PROGRESSO
     ============================================================ */

  function hashRecord(
    record
  ) {

    return JSON.stringify({

      question:

        record.question &&
        record.question.index,

      scroll:
        record.scrollY,

      fields:
        record.fields

    });
  }



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
      currentQuestionInfo(
        doc
      );


    const record = {

      version:
        VERSION,

      path:
        active.path,

      title:

        active.title ||

        displayName(
          active.path
        ),

      subject:

        subjectFrom(
          active.path
        ),

      updatedAt:

        new Date()
          .toISOString(),

      question,

      scrollY:

        Math.round(

          active.frame
            .contentWindow
            .scrollY

          ||

          0

        ),

      fields:

        fieldState(
          doc
        ),

      historyKey:

        active.historyKey ||
        '',

      nativeStateDetected:

        Boolean(
          active.nativeStateDetected
        )

    };


    const hash =
      hashRecord(
        record
      );


    if (
      !force &&
      hash ===
        active.lastHash
    ) {

      return;
    }


    active.lastHash =
      hash;


    saveRecord(
      record
    );
  }



  /* ============================================================
     RESTAURAÇÃO DE CAMPOS
     ============================================================ */

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


      if (
        byId
      ) {

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



    const all = [

      ...doc.querySelectorAll(
        'input, textarea, select'
      )

    ].filter(
      element =>

        ![

          'button',
          'submit',
          'reset',
          'file',
          'password'

        ].includes(

          (
            element.type ||
            ''
          ).toLowerCase()

        )

    );


    return (
      all[
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
    ).forEach(
      saved => {

        const element =
          findField(
            doc,
            saved
          );


        if (
          !element
        ) {

          return;
        }


        try {

          if (
            saved.checked !==
              null

            &&

            'checked' in element
          ) {

            element.checked =
              saved.checked;
          }


          if (
            saved.value !==
              undefined

            &&

            element.type !==
              'radio'

            &&

            element.type !==
              'checkbox'
          ) {

            element.value =
              saved.value;
          }


        } catch (_) {}

      }
    );
  }



  /* ============================================================
     NAVEGAÇÃO ENTRE QUESTÕES
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


    const wanted =

      direction ===
        'next'

        ? /^(proxima|proximo|avancar|seguinte|next)\b/

        : /^(anterior|questao anterior|prev|previous)\b/;


    return (

      nodes.find(
        element =>

          wanted.test(

            normText(

              element.textContent

              ||

              element.getAttribute(
                'aria-label'
              )

            )

          )
      )

      ||

      null

    );
  }



  async function restorePosition(
    doc,
    record
  ) {

    const savedIndex =

      record.question &&

      Number.isFinite(
        record.question.index
      )

        ? record.question.index

        : null;


    const all =
      questionElements(
        doc
      );


    if (

      savedIndex !==
        null

      &&

      all.length

      &&

      savedIndex <
        all.length

    ) {

      const visibleNow =
        all.filter(
          visible
        );


      /*
       * Simulado com várias questões
       * na mesma página.
       */

      if (
        visibleNow.length >
        1
      ) {

        all[
          savedIndex
        ].scrollIntoView({

          block:
            'start'

        });


        return;
      }



      /*
       * Simulado com uma questão
       * por vez.
       */

      let current =

        currentQuestionInfo(
          doc
        ).index;


      let guard =
        0;


      while (

        current !==
          savedIndex

        &&

        guard++ <
          100

      ) {

        const direction =

          current <
            savedIndex

            ? 'next'

            : 'prev';


        const button =
          findNavButton(
            doc,
            direction
          );


        if (
          !button
        ) {

          break;
        }


        button.click();


        await new Promise(

          resolve =>
            setTimeout(
              resolve,
              45
            )

        );


        current =

          currentQuestionInfo(
            doc
          ).index;
      }


      return;
    }



    /*
     * Fallback:
     * restaura posição da rolagem.
     */

    try {

      doc.defaultView
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
  }



  /* ============================================================
     RESTAURAR REGISTRO
     ============================================================ */

  async function restoreRecord(
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
     * Deixa primeiro o próprio simulado
     * restaurar seu estado nativo.
     *
     * Depois nossa camada complementa.
     */

    for (
      const delay
      of [
        180,
        550,
        1100
      ]
    ) {

      await new Promise(

        resolve =>
          setTimeout(
            resolve,
            delay
          )

      );


      restoreFields(
        doc,
        record
      );
    }


    await restorePosition(
      doc,
      record
    );
  }



  /* ============================================================
     MONITORAMENTO
     ============================================================ */

  function scheduleCapture() {

    if (
      !active
    ) {

      return;
    }


    clearTimeout(
      active.captureTimer
    );


    active.captureTimer =
      setTimeout(

        () =>
          captureActive(
            false
          ),

        180

      );
  }



  function setupFrame(
    frame,
    path,
    mode
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


    const historyBefore =

      historyKey

        ? localStorage.getItem(
            historyKey
          )

        : null;



    const scriptText =

      [
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



    const nativeStateDetected =

      /simulado_[a-z0-9_\-]+_state/i
        .test(
          scriptText
        );



    active = {

      frame,

      path,

      title:

        doc.title ||

        displayName(
          path
        ),

      historyKey,

      historyBefore,

      nativeStateDetected,

      lastHash:
        '',

      captureTimer:
        null,

      interval:
        null

    };



    const onChange =
      () =>
        scheduleCapture();



    doc.addEventListener(
      'input',
      onChange,
      true
    );


    doc.addEventListener(
      'change',
      onChange,
      true
    );



    doc.addEventListener(

      'click',

      event => {

        const control =

          event.target.closest

          &&

          event.target.closest(

            'button, a, [role="button"]'

          );


        const text =
          normText(

            control &&

            (
              control.textContent

              ||

              control.getAttribute(
                'aria-label'
              )
            )

          );


        /*
         * Salva imediatamente
         * antes de voltar ao Hub.
         */

        if (
          /voltar ao hub/
            .test(
              text
            )
        ) {

          captureActive(
            true
          );
        }


        scheduleCapture();

      },

      true

    );



    try {

      frame.contentWindow
        .addEventListener(

          'scroll',

          scheduleCapture,

          {
            passive:
              true
          }

        );


      frame.contentWindow
        .addEventListener(

          'beforeunload',

          () =>
            captureActive(
              true
            )

        );


    } catch (_) {}



    /* ========================================================
       VERIFICA CONCLUSÃO
       ======================================================== */

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
           * Se o histórico mudou,
           * entendemos que uma tentativa
           * foi concluída.
           */

          if (
            active.historyKey
          ) {

            const now =
              localStorage.getItem(
                active.historyKey
              );


            if (
              now !==
                active.historyBefore
            ) {

              removeRecord(
                active.path
              );


              active.historyBefore =
                now;


              active.lastHash =
                '';


              return;
            }
          }


          captureActive(
            false
          );

        },

        1200

      );



    const saved =
      loadRecord(
        path
      );


    if (
      mode ===
        'resume'

      &&

      saved
    ) {

      restoreRecord(
        frame,
        saved
      )

        .finally(
          () =>
            captureActive(
              true
            )
        );


    } else {

      /*
       * Evita criar imediatamente
       * um falso progresso antes de
       * o simulado terminar de carregar.
       */

      setTimeout(

        () =>
          captureActive(
            false
          ),

        900

      );
    }
  }



  /* ============================================================
     IFRAMES
     ============================================================ */

  function framePath(
    frame
  ) {

    return normPath(

      frame.getAttribute(
        'src'
      )

      ||

      ''

    );
  }



  function registerFrame(
    frame
  ) {

    if (
      frame.dataset
        .medsimResumeV1 ===
      '1'
    ) {

      return;
    }


    frame.dataset
      .medsimResumeV1 =
      '1';



    frame.addEventListener(

      'load',

      () => {

        const path =

          (
            pendingOpen &&
            pendingOpen.path
          )

          ||

          framePath(
            frame
          );


        const mode =

          pendingOpen &&
          pendingOpen.path ===
            path

            ? pendingOpen.mode

            : 'fresh';


        pendingOpen =
          null;


        if (
          /\.html?$/i.test(
            path
          )
        ) {

          setupFrame(
            frame,
            path,
            mode
          );
        }

      }

    );



    const path =
      framePath(
        frame
      );


    if (
      /\.html?$/i.test(
        path
      )
    ) {

      try {

        if (

          frame.contentDocument

          &&

          frame.contentDocument
            .readyState ===
            'complete'

        ) {

          setupFrame(
            frame,
            path,
            'fresh'
          );
        }


      } catch (_) {}
    }
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
     CARREGARSIMULADO
     ============================================================ */

  function extractPathFromArgs(
    args
  ) {

    for (
      const arg
      of args
    ) {

      if (

        typeof arg ===
          'string'

        &&

        /\.html?(?:[?#]|$)/i
          .test(
            arg
          )

      ) {

        return normPath(
          arg
        );
      }
    }


    return '';
  }



  function invokeCurrentCarregar(
    args,
    path,
    mode
  ) {

    bypassOpen = {

      path,

      mode

    };


    return window
      .carregarSimulado
      .apply(
        window,
        args
      );
  }



  function hookCarregar() {

    const current =
      window.carregarSimulado;


    if (

      typeof current !==
        'function'

      ||

      current.__medsimResumeV1

    ) {

      return;
    }



    function wrapped(
      ...args
    ) {

      const path =
        extractPathFromArgs(
          args
        );


      if (
        !path
      ) {

        return current.apply(
          this,
          args
        );
      }



      /*
       * Abertura autorizada pela
       * janela de retomada.
       */

      if (

        bypassOpen

        &&

        bypassOpen.path ===
          path

      ) {

        const mode =
          bypassOpen.mode;


        bypassOpen =
          null;


        pendingOpen = {

          path,

          mode

        };


        return current.apply(
          this,
          args
        );
      }



      const saved =
        loadRecord(
          path
        );


      /*
       * Existe progresso:
       * pergunta antes de abrir.
       */

      if (
        saved
      ) {

        showResumeChoice(

          saved,


          () =>
            invokeCurrentCarregar(

              args,
              path,
              'resume'

            ),


          () => {

            removeRecord(
              path
            );


            invokeCurrentCarregar(

              args,
              path,
              'fresh'

            );

          }

        );


        return;
      }



      pendingOpen = {

        path,

        mode:
          'fresh'

      };


      return current.apply(
        this,
        args
      );
    }



    wrapped.__medsimResumeV1 =
      true;


    window.carregarSimulado =
      wrapped;
  }



  /* ============================================================
     DATA
     ============================================================ */

  function formatDate(
    iso
  ) {

    if (
      !iso
    ) {

      return '';
    }


    const date =
      new Date(
        iso
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


    style.textContent = `

      #${BUTTON_ID} {

        width:
          100%;

        display:
          none;

        align-items:
          center;

        gap:
          11px;


        min-height:
          44px;


        padding:
          10px 12px;


        margin:
          2px 0;


        box-sizing:
          border-box;


        border:
          1px solid transparent;


        border-radius:
          11px;


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
          .88rem;


        font-weight:
          650;


        text-align:
          left;


        cursor:
          pointer;


        transition:
          .16s ease;
      }


      #${BUTTON_ID}:hover {

        background:

          rgba(
            99,
            102,
            241,
            .08
          );


        border-color:

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
      }


      #${BUTTON_ID}
      .mi {

        display:
          inline-flex;

        align-items:
          center;

        justify-content:
          center;


        width:
          30px;

        height:
          30px;


        border-radius:
          9px;


        background:

          rgba(
            99,
            102,
            241,
            .09
          );


        color:

          var(
            --purple-primary,
            #6366f1
          );


        font-weight:
          800;
      }


      #${BUTTON_ID}
      .badge {

        margin-left:
          auto;


        min-width:
          22px;

        height:
          22px;


        padding:
          0 6px;


        display:
          inline-flex;

        align-items:
          center;

        justify-content:
          center;


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
          .72rem;


        font-weight:
          800;
      }



      /* MODAL */

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
      .card {

        width:

          min(
            560px,
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
      .head {

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
      .title {

        font-size:
          1.02rem;


        font-weight:
          800;
      }


      #${MODAL_ID}
      .sub {

        margin-top:
          3px;


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .78rem;
      }


      #${MODAL_ID}
      .close {

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


        font-size:
          21px;


        cursor:
          pointer;
      }


      #${MODAL_ID}
      .resume-list {

        display:
          grid;

        gap:
          9px;
      }


      #${MODAL_ID}
      .resume-item {

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
      .resume-name {

        font-size:
          .86rem;


        font-weight:
          800;
      }


      #${MODAL_ID}
      .resume-meta {

        margin-top:
          4px;


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .74rem;


        line-height:
          1.45;
      }


      #${MODAL_ID}
      .resume-actions {

        display:
          flex;

        gap:
          8px;

        margin-top:
          10px;

        flex-wrap:
          wrap;
      }


      #${MODAL_ID}
      .resume-actions
      button {

        min-height:
          36px;


        padding:
          8px 11px;


        border-radius:
          9px;


        border:

          1px solid
          var(
            --border-color,
            #dbe2ea
          );


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
          .76rem;


        font-weight:
          750;


        cursor:
          pointer;
      }


      #${MODAL_ID}
      .resume-actions
      .primary {

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
      .resume-actions
      .danger {

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
      .empty {

        padding:
          18px;


        text-align:
          center;


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .82rem;
      }


      #${MODAL_ID}
      .note {

        margin-top:
          12px;


        padding:
          10px 11px;


        border-radius:
          10px;


        background:

          rgba(
            148,
            163,
            184,
            .065
          );


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .69rem;


        line-height:
          1.45;
      }


      @media (
        max-width:
        560px
      ) {

        #${MODAL_ID} {

          padding:
            12px;
        }


        #${MODAL_ID}
        .card {

          padding:
            15px;


          border-radius:
            15px;
        }


        #${MODAL_ID}
        .resume-actions {

          display:
            grid;


          grid-template-columns:
            1fr 1fr;
        }

      }

    `;


    document.head
      .appendChild(
        style
      );
  }



  /* ============================================================
     INTERFACE
     ============================================================ */

  function ensureUI() {

    ensureStyle();



    /* MODAL */

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
          class="card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="medsim-resume-title">


          <div class="head">

            <div>

              <div
                id="medsim-resume-title"
                class="title">

                Retomar simulado

              </div>


              <div class="sub">

                Continue de onde você parou neste navegador

              </div>

            </div>


            <button
              class="close"
              type="button"
              aria-label="Fechar">

              ×

            </button>

          </div>


          <div class="resume-list">

          </div>


          <div class="note">

            O MedSim salva uma camada universal de progresso local.
            Quando um simulado já possui salvamento próprio,
            ele continua sendo priorizado.

          </div>

        </div>

      `;


      document.body
        .appendChild(
          modal
        );


      modal
        .querySelector(
          '.close'
        )

        .addEventListener(
          'click',
          closeModal
        );


      modal.addEventListener(

        'pointerdown',

        event => {

          if (
            event.target ===
            modal
          ) {

            closeModal();
          }

        }

      );
    }



    /* BOTÃO DO HUB */

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

        <span class="mi">
          ↻
        </span>

        <span>
          Retomar simulado
        </span>

        <span class="badge">
          0
        </span>

      `;


      button.addEventListener(

        'click',

        openListModal

      );


      const nav =

        document.querySelector(
          '.nav-menu'
        )

        ||

        document.querySelector(
          '.sidebar'
        )

        ||

        document.body;


      nav.appendChild(
        button
      );
    }


    updateHubUI();
  }



  function updateHubUI() {

    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (
      !button
    ) {

      return;
    }


    const count =
      allRecords()
        .length;


    /*
     * Só aparece se realmente existir
     * simulado em andamento.
     */

    button.style.display =

      count

        ? 'flex'

        : 'none';


    const badge =
      button.querySelector(
        '.badge'
      );


    if (
      badge
    ) {

      badge.textContent =
        String(
          count
        );
    }
  }



  function closeModal() {

    const modal =
      document.getElementById(
        MODAL_ID
      );


    if (
      modal
    ) {

      modal.dataset.open =
        'false';
    }
  }



  /* ============================================================
     LISTA DE RETOMADAS
     ============================================================ */

  function renderList() {

    const modal =
      document.getElementById(
        MODAL_ID
      );


    if (
      !modal
    ) {

      return;
    }


    const list =
      modal.querySelector(
        '.resume-list'
      );


    const records =
      allRecords();


    list.innerHTML =
      '';



    if (
      !records.length
    ) {

      list.innerHTML = `

        <div class="empty">

          Nenhum simulado em andamento.

        </div>

      `;


      return;
    }



    records.forEach(
      record => {

        const item =
          document.createElement(
            'div'
          );


        item.className =
          'resume-item';



        const question =

          record.question &&
          record.question.label

            ? record.question.label

            : 'Progresso salvo';



        item.innerHTML = `

          <div class="resume-name">

          </div>


          <div class="resume-meta">

          </div>


          <div class="resume-actions">

            <button
              type="button"
              class="primary">

              Continuar

            </button>


            <button
              type="button"
              class="danger">

              Descartar progresso

            </button>

          </div>

        `;



        item
          .querySelector(
            '.resume-name'
          )
          .textContent =

            record.title ||

            displayName(
              record.path
            );



        item
          .querySelector(
            '.resume-meta'
          )
          .textContent =

            `${

              record.subject ||

              subjectFrom(
                record.path
              )

            } · ${question} · ${

              formatDate(
                record.updatedAt
              )

            }`;



        item
          .querySelector(
            '.primary'
          )

          .addEventListener(

            'click',

            () => {

              closeModal();


              invokeCurrentCarregar(

                [
                  record.path
                ],

                normPath(
                  record.path
                ),

                'resume'

              );

            }

          );



        item
          .querySelector(
            '.danger'
          )

          .addEventListener(

            'click',

            () => {

              const ok =
                confirm(

                  'Descartar o progresso universal salvo deste simulado?\n\n'

                  +

                  'Isso não apaga resultados já concluídos.'

                );


              if (
                !ok
              ) {

                return;
              }


              removeRecord(
                record.path
              );


              renderList();

            }

          );


        list.appendChild(
          item
        );

      }

    );
  }



  function openListModal() {

    ensureUI();

    renderList();


    document
      .getElementById(
        MODAL_ID
      )
      .dataset.open =
        'true';
  }



  /* ============================================================
     PERGUNTA AO ABRIR SIMULADO COM PROGRESSO
     ============================================================ */

  function showResumeChoice(
    record,
    onResume,
    onFresh
  ) {

    ensureUI();


    const modal =
      document.getElementById(
        MODAL_ID
      );


    const list =
      modal.querySelector(
        '.resume-list'
      );


    list.innerHTML =
      '';



    const item =
      document.createElement(
        'div'
      );


    item.className =
      'resume-item';



    item.innerHTML = `

      <div class="resume-name">

      </div>


      <div class="resume-meta">

      </div>


      <div class="resume-actions">

        <button
          type="button"
          class="primary">

          Continuar de onde parei

        </button>


        <button
          type="button">

          Abrir sem restaurar

        </button>

      </div>

    `;



    item
      .querySelector(
        '.resume-name'
      )
      .textContent =

        record.title ||

        displayName(
          record.path
        );



    item
      .querySelector(
        '.resume-meta'
      )
      .textContent =

        `${

          record.question &&
          record.question.label

            ? record.question.label

            : 'Progresso salvo'

        } · ${

          formatDate(
            record.updatedAt
          )

        }`;



    const buttons =

      item.querySelectorAll(

        '.resume-actions button'

      );



    buttons[0]
      .addEventListener(

        'click',

        () => {

          closeModal();

          onResume();

        }

      );



    buttons[1]
      .addEventListener(

        'click',

        () => {

          const ok =
            confirm(

              'Abrir sem restaurar o progresso universal salvo?\n\n'

              +

              'O registro de retomada será descartado, mas resultados já concluídos não serão apagados.'

            );


          if (
            !ok
          ) {

            return;
          }


          closeModal();

          onFresh();

        }

      );


    list.appendChild(
      item
    );


    modal.dataset.open =
      'true';
  }



  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */

  function start() {

    ensureUI();

    hookCarregar();

    scanFrames();



    /*
     * Detecta iframes ou funções
     * criadas posteriormente.
     */

    const observer =
      new MutationObserver(

        () => {

          ensureUI();

          scanFrames();

          hookCarregar();

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



    /*
     * Segurança adicional contra
     * scripts carregados depois.
     */

    setInterval(

      () => {

        hookCarregar();

        scanFrames();

        updateHubUI();

      },

      1200

    );



    /*
     * ESC fecha janela.
     */

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
     * Último salvamento antes
     * de fechar a página.
     */

    window.addEventListener(

      'beforeunload',

      () =>
        captureActive(
          true
        )

    );


    console.info(

      '[MedSim] Retomar simulado universal v1 ativo.'

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
