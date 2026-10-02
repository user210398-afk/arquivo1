(function () {
  'use strict';

  /* ============================================================
     MEDSIM — RETOMAR SIMULADO INTERNO v3

     REGRA:

     - Só mostra Continuar/Recomeçar quando o simulado
       JÁ POSSUI progresso de uma sessão anterior.

     - Depois que a resolução começa:
         • novo simulado
         • continuar
         • recomeçar

       o painel fica bloqueado até o usuário voltar ao Hub.

     ============================================================ */


  const STORE_KEY =
    'medsim_resume_v2';


  const TRAIL_KEY =
    'medsim_resume_trail_v2';


  const ACTION_KEY =
    'medsim_resume_inside_action_v3';


  /*
   * Guarda quais simulados estão sendo
   * resolvidos NESTA sessão da página.
   *
   * sessionStorage é proposital:
   * fecha a aba → desaparece.
   */

  const RUNNING_KEY =
    'medsim_resume_running_v1';


  const STYLE_ID =
    'medsim-resume-inside-style-v3';


  const PANEL_ID =
    'medsim-resume-inside-panel-v3';


  const registered =
    new WeakSet();



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



  function norm(value) {

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



  /* ============================================================
     OBJETOS LOCALSTORAGE
     ============================================================ */

  function loadObject(key) {

    try {

      const value =
        JSON.parse(

          localStorage.getItem(
            key
          )

          || '{}'

        );


      return (

        value &&
        typeof value === 'object' &&
        !Array.isArray(value)

          ? value

          : {}

      );


    } catch (_) {

      return {};
    }
  }



  function saveObject(
    key,
    value
  ) {

    try {

      localStorage.setItem(

        key,

        JSON.stringify(
          value
        )

      );

    } catch (_) {}
  }



  function getRecord(path) {

    return (

      loadObject(
        STORE_KEY
      )[
        keyPath(path)
      ]

      ||

      null

    );
  }



  function removeRecord(path) {

    const store =
      loadObject(
        STORE_KEY
      );


    delete store[
      keyPath(path)
    ];


    saveObject(
      STORE_KEY,
      store
    );
  }



  /* ============================================================
     SIMULADO EM RESOLUÇÃO

     Essa é a principal mudança da V3.
     ============================================================ */

  function loadRunning() {

    try {

      const value =
        JSON.parse(

          sessionStorage.getItem(
            RUNNING_KEY
          )

          || '{}'

        );


      return (

        value &&
        typeof value === 'object' &&
        !Array.isArray(value)

          ? value

          : {}

      );


    } catch (_) {

      return {};
    }
  }



  function saveRunning(value) {

    try {

      sessionStorage.setItem(

        RUNNING_KEY,

        JSON.stringify(
          value
        )

      );

    } catch (_) {}
  }



  function setRunning(path) {

    const running =
      loadRunning();


    running[
      keyPath(path)
    ] = true;


    saveRunning(
      running
    );
  }



  function clearRunning(path) {

    const running =
      loadRunning();


    delete running[
      keyPath(path)
    ];


    saveRunning(
      running
    );
  }



  function isRunning(path) {

    return Boolean(

      loadRunning()[
        keyPath(path)
      ]

    );
  }



  /* ============================================================
     TRILHA DE NAVEGAÇÃO
     ============================================================ */

  function getTrail(path) {

    const all =
      loadObject(
        TRAIL_KEY
      );


    const trail =
      all[
        keyPath(path)
      ];


    return Array.isArray(
      trail
    )

      ? trail

      : [];
  }



  function setTrail(
    path,
    trail
  ) {

    const all =
      loadObject(
        TRAIL_KEY
      );


    all[
      keyPath(path)
    ] =

      Array.isArray(trail)

        ? trail.slice(
            -150
          )

        : [];


    saveObject(
      TRAIL_KEY,
      all
    );
  }



  function clearTrail(path) {

    const all =
      loadObject(
        TRAIL_KEY
      );


    delete all[
      keyPath(path)
    ];


    saveObject(
      TRAIL_KEY,
      all
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
     QUESTÃO SALVA
     ============================================================ */

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



  function targetQuestion(record) {

    const direct =
      Number(

        record &&
        (
          record.questionNumber

          ||

          (
            record.question &&
            record.question.number
          )
        )

      );


    if (direct) {

      return direct;
    }


    const match =
      questionLabel(
        record
      )
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
     VISIBILIDADE
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

        style.display !== 'none'

        &&

        style.visibility !== 'hidden'

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

  function currentQuestionNumber(doc) {

    const selectors =

      '[data-question],' +

      '[data-questao],' +

      '[class*="question"],' +

      '[class*="questao"],' +

      '[class*="quest"],' +

      '[id*="question"],' +

      '[id*="questao"],' +

      '[id*="quest"],' +

      '.progress,' +

      '.counter,' +

      'h1,h2,h3,h4,p,span';



    const nodes = [

      ...doc.querySelectorAll(
        selectors
      )

    ].filter(
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
        text.length > 180
      ) {

        continue;
      }


      const match =
        text.match(

          /quest(?:ão|ao)\s*(\d+)(?:\s*(?:de|\/)\s*(\d+))?/i

        );


      if (match) {

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

        /quest(?:ão|ao)\s*(\d+)(?:\s*(?:de|\/)\s*(\d+))?/i

      );


    return match

      ? Number(
          match[1]
        )

      : 0;
  }



  /* ============================================================
     ASSINATURA DA QUESTÃO
     ============================================================ */

  function questionSignature(doc) {

    const number =
      currentQuestionNumber(
        doc
      );


    if (number) {

      return (
        'numero:' +
        number
      );
    }



    const selectors =

      '[data-question],' +

      '[data-questao],' +

      '[class*="question"],' +

      '[class*="questao"],' +

      '[class*="quest"],' +

      '[id*="question"],' +

      '[id*="questao"],' +

      '[id*="quest"]';



    const candidates = [

      ...doc.querySelectorAll(
        selectors
      )

    ]

      .filter(
        visible
      )

      .map(
        element =>

          norm(
            element.textContent
          ).slice(
            0,
            700
          )
      )

      .filter(
        text =>
          text.length >= 20
      )

      .sort(
        (a, b) =>

          b.length -
          a.length
      );


    if (
      candidates[0]
    ) {

      return (
        'texto:' +
        candidates[0]
      );
    }


    return (

      'body:' +

      norm(
        doc.body &&
        doc.body.innerText
      ).slice(
        0,
        900
      )

    );
  }



  /* ============================================================
     STATE NATIVO
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



    Object.keys(

      (
        record &&
        record.nativeState
      )

      || {}

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


    return [
      ...keys
    ];
  }



  function applyNativeState(record) {

    Object.entries(

      (
        record &&
        record.nativeState
      )

      || {}

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
     RESPOSTAS
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

        ].includes(
          type
        );
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

            saved.checked !== null

            &&

            saved.checked !== undefined

            &&

            'checked' in element

          ) {

            element.checked =
              Boolean(
                saved.checked
              );
          }



          if (

            saved.value !== undefined

            &&

            saved.type !== 'radio'

            &&

            saved.type !== 'checkbox'

          ) {

            element.value =
              saved.value;
          }



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
     DESCRITOR DO BOTÃO
     ============================================================ */

  function descriptorFor(
    element,
    doc
  ) {

    if (!element) {

      return null;
    }


    const clickable =

      element.closest

        ? element.closest(

            'button,' +
            'a,' +
            '[role="button"],' +
            '[onclick],' +
            'input[type="button"],' +
            'input[type="submit"]'

          )

        : element;


    if (!clickable) {

      return null;
    }



    const text =

      (
        clickable.textContent

        ||

        clickable.value

        ||

        ''
      )

      .trim()

      .slice(
        0,
        160
      );


    const aria =

      (
        clickable.getAttribute(
          'aria-label'
        )

        ||

        ''
      )

      .trim()

      .slice(
        0,
        160
      );


    const title =

      (
        clickable.getAttribute(
          'title'
        )

        ||

        ''
      )

      .trim()

      .slice(
        0,
        160
      );



    const data =
      {};


    [

      'data-action',
      'data-index',
      'data-question',
      'data-questao',
      'data-step',
      'data-page',
      'data-slide'

    ]
    .forEach(
      key => {

        const value =
          clickable.getAttribute(
            key
          );


        if (
          value !== null
        ) {

          data[key] =
            value;
        }

      }
    );



    const sameText = [

      ...doc.querySelectorAll(

        'button,' +
        'a,' +
        '[role="button"],' +
        '[onclick],' +
        'input[type="button"],' +
        'input[type="submit"]'

      )

    ]

    .filter(
      item =>

        norm(

          item.textContent

          ||

          item.value

          ||

          ''

        )

        ===

        norm(text)
    );



    return {

      tag:
        clickable.tagName ||
        '',

      id:
        clickable.id ||
        '',

      name:

        clickable.getAttribute(
          'name'
        )

        ||

        '',

      value:
        clickable.value ||
        '',

      text,

      aria,

      title,

      data,

      classes:

        [
          ...(
            clickable.classList ||
            []
          )
        ].slice(
          0,
          8
        ),

      textOrdinal:

        sameText.indexOf(
          clickable
        )

    };
  }



  /* ============================================================
     LOCALIZAR BOTÃO
     ============================================================ */

  function matchesDescriptor(
    element,
    descriptor
  ) {

    if (
      !element ||
      !descriptor
    ) {

      return false;
    }


    if (
      descriptor.tag &&
      element.tagName !==
        descriptor.tag
    ) {

      return false;
    }


    if (
      descriptor.name &&
      element.getAttribute(
        'name'
      ) !== descriptor.name
    ) {

      return false;
    }


    if (
      descriptor.aria &&
      (
        element.getAttribute(
          'aria-label'
        )

        || ''
      )

      !==

      descriptor.aria
    ) {

      return false;
    }


    if (
      descriptor.title &&
      (
        element.getAttribute(
          'title'
        )

        || ''
      )

      !==

      descriptor.title
    ) {

      return false;
    }



    for (
      const [key, value]
      of Object.entries(
        descriptor.data ||
        {}
      )
    ) {

      if (
        element.getAttribute(
          key
        ) !== value
      ) {

        return false;
      }
    }



    if (
      descriptor.text &&
      norm(

        element.textContent

        ||

        element.value

        ||

        ''

      )

      !==

      norm(
        descriptor.text
      )
    ) {

      return false;
    }


    return true;
  }



  function findByDescriptor(
    doc,
    descriptor
  ) {

    if (!descriptor) {

      return null;
    }



    if (
      descriptor.id
    ) {

      const byId =
        doc.getElementById(
          descriptor.id
        );


      if (
        byId &&
        visible(byId)
      ) {

        return byId;
      }
    }



    const nodes = [

      ...doc.querySelectorAll(

        'button,' +
        'a,' +
        '[role="button"],' +
        '[onclick],' +
        'input[type="button"],' +
        'input[type="submit"]'

      )

    ]
    .filter(
      visible
    );



    const exact =
      nodes.filter(
        element =>

          matchesDescriptor(
            element,
            descriptor
          )
      );


    if (
      exact.length
    ) {

      const index =
        Math.max(

          0,

          Math.min(

            descriptor.textOrdinal ||
            0,

            exact.length - 1

          )

        );


      return exact[
        index
      ];
    }



    if (
      descriptor.text
    ) {

      const sameText =
        nodes.filter(
          element =>

            norm(

              element.textContent

              ||

              element.value

              ||

              ''

            )

            ===

            norm(
              descriptor.text
            )
        );


      if (
        sameText.length
      ) {

        return sameText[
          Math.max(

            0,

            Math.min(

              descriptor.textOrdinal ||
              0,

              sameText.length - 1

            )

          )
        ];
      }
    }



    if (
      descriptor.classes &&
      descriptor.classes.length
    ) {

      const byClasses =
        nodes.find(
          element =>

            descriptor.classes
              .every(
                className =>

                  element.classList
                    .contains(
                      className
                    )
              )
        );


      if (byClasses) {

        return byClasses;
      }
    }


    return null;
  }



  /* ============================================================
     CONTROLES IGNORADOS
     ============================================================ */

  function shouldIgnoreControl(
    element
  ) {

    const text =
      norm(

        element &&
        (
          element.textContent

          ||

          element.value

          ||

          element.getAttribute(
            'aria-label'
          )

          ||

          ''
        )

      );


    return (

      /voltar ao hub/
        .test(text)

      ||

      /finalizar/
        .test(text)

      ||

      /encerrar/
        .test(text)

      ||

      /corrigir/
        .test(text)

      ||

      /resultado/
        .test(text)

      ||

      /gabarito/
        .test(text)

      ||

      /reiniciar/
        .test(text)

      ||

      /recomecar|recomeçar/
        .test(text)

    );
  }



  /* ============================================================
     MONITORAR NAVEGAÇÃO

     Também detecta "Voltar ao Hub"
     para liberar a próxima retomada.
     ============================================================ */

  function monitorNavigation(
    frame,
    path
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
      doc.documentElement
        .dataset
        .medsimTrailV3 ===
      '1'
    ) {

      return;
    }


    doc.documentElement
      .dataset
      .medsimTrailV3 =
      '1';



    doc.addEventListener(

      'click',

      event => {

        const control =

          event.target.closest

            ? event.target.closest(

                'button,' +
                'a,' +
                '[role="button"],' +
                '[onclick],' +
                'input[type="button"],' +
                'input[type="submit"]'

              )

            : null;


        if (!control) {

          return;
        }


        const controlText =
          norm(

            control.textContent

            ||

            control.value

            ||

            control.getAttribute(
              'aria-label'
            )

            ||

            ''

          );


        /*
         * SAIU PARA O HUB.
         *
         * Libera o painel para a
         * próxima abertura.
         */

        if (
          /voltar ao hub/
            .test(
              controlText
            )
        ) {

          clearRunning(
            path
          );


          removePanel(
            doc
          );


          return;
        }


        if (
          shouldIgnoreControl(
            control
          )
        ) {

          return;
        }



        const before =
          questionSignature(
            doc
          );


        const descriptor =
          descriptorFor(
            control,
            doc
          );


        if (!descriptor) {

          return;
        }



        setTimeout(
          () => {

            const after =
              questionSignature(
                doc
              );


            if (
              !after ||
              after === before
            ) {

              return;
            }


            const trail =
              getTrail(
                path
              );


            trail.push(
              descriptor
            );


            setTrail(
              path,
              trail
            );

          },

          320

        );

      },

      true

    );
  }



  /* ============================================================
     REPRODUZIR TRILHA
     ============================================================ */

  async function replayTrail(
    frame,
    path,
    record
  ) {

    let doc;


    try {

      doc =
        frame.contentDocument;

    } catch (_) {

      return false;
    }


    if (
      !doc ||
      !doc.body
    ) {

      return false;
    }



    const target =
      targetQuestion(
        record
      );


    const trail =
      getTrail(
        path
      );


    if (
      !trail.length
    ) {

      return false;
    }



    let current =
      currentQuestionNumber(
        doc
      );


    if (
      target &&
      current === target
    ) {

      return true;
    }



    for (
      let i = 0;
      i < trail.length;
      i++
    ) {

      const descriptor =
        trail[i];


      const control =
        findByDescriptor(
          doc,
          descriptor
        );


      if (!control) {

        continue;
      }



      const before =
        questionSignature(
          doc
        );


      control.click();



      let changed =
        false;


      for (
        const delay
        of [
          90,
          180,
          320,
          520
        ]
      ) {

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              delay
            )
        );


        const after =
          questionSignature(
            doc
          );


        if (
          after &&
          after !== before
        ) {

          changed =
            true;

          break;
        }
      }



      current =
        currentQuestionNumber(
          doc
        );


      if (
        target &&
        current === target
      ) {

        return true;
      }


      if (!changed) {

        continue;
      }
    }


    return (

      target

        ? currentQuestionNumber(
            doc
          ) === target

        : true

    );
  }



  /* ============================================================
     FALLBACK
     ============================================================ */

  async function fallbackAdvance(
    frame,
    record
  ) {

    let doc;


    try {

      doc =
        frame.contentDocument;

    } catch (_) {

      return false;
    }



    const target =
      targetQuestion(
        record
      );


    if (!target) {

      return false;
    }



    let current =
      currentQuestionNumber(
        doc
      );


    if (!current) {

      return false;
    }


    if (
      current === target
    ) {

      return true;
    }



    let guard =
      0;


    while (

      current < target

      &&

      guard++ < 100

    ) {

      const buttons = [

        ...doc.querySelectorAll(

          'button,' +
          'a,' +
          '[role="button"],' +
          '[onclick]'

        )

      ].filter(
        visible
      );


      const next =
        buttons.find(
          element =>

            /^(proxima|proximo|próxima|próximo|avancar|avançar|seguinte|next)\b/i

              .test(

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
        );


      if (!next) {

        break;
      }


      next.click();


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            120
          )
      );


      const nextNumber =
        currentQuestionNumber(
          doc
        );


      if (
        !nextNumber ||
        nextNumber === current
      ) {

        break;
      }


      current =
        nextNumber;
    }


    return (
      current === target
    );
  }



  /* ============================================================
     RESTAURAÇÃO
     ============================================================ */

  async function restoreAfterReload(
    frame,
    path,
    record
  ) {

    let doc;


    try {

      doc =
        frame.contentDocument;

    } catch (_) {

      return false;
    }


    if (
      !doc ||
      !doc.body
    ) {

      return false;
    }



    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          300
        )
    );



    let success =
      false;


    const target =
      targetQuestion(
        record
      );



    if (

      target

      &&

      currentQuestionNumber(
        doc
      ) === target

    ) {

      success =
        true;
    }



    if (
      !success
    ) {

      success =
        await replayTrail(

          frame,
          path,
          record

        );
    }



    if (
      !success
    ) {

      success =
        await fallbackAdvance(

          frame,
          record

        );
    }



    restoreFields(
      doc,
      record
    );


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          120
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


    return success;
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

        keyPath(path)

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
     CSS
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
            390px,
            calc(100vw - 24px)
          );


        box-sizing:
          border-box;


        padding:
          13px;


        border:

          1px solid
          rgba(
            99,
            102,
            241,
            .20
          );


        border-radius:
          14px;


        background:

          rgba(
            255,
            255,
            255,
            .98
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
      .msri-title {

        font-size:
          .88rem;

        font-weight:
          800;

        line-height:
          1.25;
      }


      #${PANEL_ID}
      .msri-meta {

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
      .msri-actions {

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
      .msri-continue {

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
      .msri-restart {

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
        .msri-actions {

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


    if (panel) {

      panel.remove();
    }
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



    /*
     * Segurança:
     * se já começou a resolução,
     * o painel NÃO pode aparecer.
     */

    if (
      isRunning(
        path
      )
    ) {

      removePanel(
        doc
      );

      return;
    }



    injectStyle(
      doc
    );


    removePanel(
      doc
    );



    const trail =
      getTrail(
        path
      );


    const panel =
      doc.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.innerHTML = `

      <div class="msri-title">

        Há um progresso salvo neste simulado

      </div>


      <div class="msri-meta">

      </div>


      <div class="msri-actions">

        <button
          type="button"
          class="msri-continue">

          Continuar de onde parei

        </button>


        <button
          type="button"
          class="msri-restart">

          Recomeçar

        </button>

      </div>

    `;



    panel
      .querySelector(
        '.msri-meta'
      )
      .textContent =

        `${questionLabel(record)} · salvo em ${

          formatDate(
            record.updatedAt
          )

        }`;



    /* ========================================================
       CONTINUAR
       ======================================================== */

    panel
      .querySelector(
        '.msri-continue'
      )
      .addEventListener(

        'click',

        () => {

          /*
           * A partir daqui o usuário
           * ESTÁ resolvendo o simulado.
           */

          setRunning(
            path
          );


          /*
           * Painel desaparece
           * imediatamente.
           */

          removePanel(
            doc
          );


          if (
            trail.length
          ) {

            clearNativeState(
              doc,
              record
            );


          } else {

            applyNativeState(
              record
            );
          }


          setAction({

            mode:
              'continue',

            path,

            useTrail:
              trail.length > 0

          });


          reloadFrame(
            frame
          );

        }

      );



    /* ========================================================
       RECOMEÇAR
       ======================================================== */

    panel
      .querySelector(
        '.msri-restart'
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

                'O progresso em andamento será apagado, mas resultados já concluídos serão mantidos.'

              );


          if (!ok) {

            return;
          }


          /*
           * Começou uma nova resolução.
           */

          setRunning(
            path
          );


          /*
           * Painel desaparece
           * imediatamente.
           */

          removePanel(
            doc
          );


          clearNativeState(
            doc,
            record
          );


          clearTrail(
            path
          );


          removeRecord(
            path
          );


          setAction({

            mode:
              'restart',

            path

          });


          reloadFrame(
            frame
          );

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

        ||

        ''

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



    monitorNavigation(
      frame,
      path
    );



    const action =
      takeAction(
        path
      );


    const record =
      getRecord(
        path
      );



    /* ========================================================
       RECOMEÇAR

       Já está em resolução.
       Nenhum painel.
       ======================================================== */

    if (
      action &&
      action.mode === 'restart'
    ) {

      setRunning(
        path
      );


      removePanel(
        doc
      );


      return;
    }



    /* ========================================================
       CONTINUAR

       Restaura e depois deixa o usuário
       resolver normalmente.

       Nenhum painel durante a prova.
       ======================================================== */

    if (

      action

      &&

      action.mode === 'continue'

      &&

      record

    ) {

      setRunning(
        path
      );


      removePanel(
        doc
      );


      if (
        !action.useTrail
      ) {

        applyNativeState(
          record
        );
      }


      await restoreAfterReload(

        frame,
        path,
        record

      );


      /*
       * NÃO mostra mais:
       *
       * "Progresso restaurado"
       *
       * nem qualquer outra aba.
       */

      removePanel(
        doc
      );


      return;
    }



    /* ========================================================
       JÁ ESTÁ RESOLVENDO

       Mesmo que o Hub salve progresso
       durante a resolução, o painel
       permanece escondido.
       ======================================================== */

    if (
      isRunning(
        path
      )
    ) {

      removePanel(
        doc
      );


      return;
    }



    /* ========================================================
       SIMULADO JÁ INICIADO ANTERIORMENTE

       Tem registro e NÃO está atualmente
       em resolução.

       Só neste caso mostramos o painel.
       ======================================================== */

    if (
      record
    ) {

      showChoice(

        frame,
        path,
        record

      );


      return;
    }



    /* ========================================================
       SIMULADO NOVO / DO ZERO

       Não existe progresso anterior.

       Consideramos que uma nova resolução
       começou e bloqueamos o painel.
       ======================================================== */

    setRunning(
      path
    );


    removePanel(
      doc
    );
  }



  /* ============================================================
     IFRAMES
     ============================================================ */

  function registerFrame(frame) {

    if (
      registered.has(
        frame
      )
    ) {

      return;
    }


    registered.add(
      frame
    );


    frame.addEventListener(

      'load',

      () => {

        setTimeout(
          () => {

            setupFrame(
              frame
            );

          },
          140
        );

      }

    );


    try {

      if (

        frame.contentDocument

        &&

        frame.contentDocument
          .readyState === 'complete'

      ) {

        setTimeout(
          () => {

            setupFrame(
              frame
            );

          },
          140
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


    setInterval(

      scanFrames,

      1000

    );


    console.info(

      '[MedSim] Retomar simulado interno v3 ativo.'

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
