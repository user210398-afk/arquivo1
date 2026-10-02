(function () {
  'use strict';

  /* ============================================================
     MEDSIM — RETOMAR SIMULADO INTERNO v2

     Responsável por:

     - mostrar Continuar / Recomeçar dentro do simulado;
     - registrar a navegação REAL utilizada pelo usuário;
     - reproduzir essa navegação ao continuar;
     - restaurar respostas;
     - preservar históricos já concluídos.

     O botão do Hub continua sendo responsabilidade de:
     retomar-simulado.js
     ============================================================ */


  const STORE_KEY =
    'medsim_resume_v2';


  const TRAIL_KEY =
    'medsim_resume_trail_v2';


  const ACTION_KEY =
    'medsim_resume_inside_action_v2';


  const STYLE_ID =
    'medsim-resume-inside-style-v2';


  const PANEL_ID =
    'medsim-resume-inside-panel-v2';


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
     LOCALSTORAGE
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
        typeof value ===
          'object' &&
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
     TRILHA DE NAVEGAÇÃO

     Guarda os botões reais usados para
     chegar até a questão atual.
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


    /*
     * Limite de segurança.
     */

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
     ELEMENTO VISÍVEL
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

      ||

      '';


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

     Usada para perceber que o clique
     realmente mudou de questão.
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
          text.length >=
          20
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
     DESCREVER UM BOTÃO REAL

     Em vez de guardar apenas "Próxima",
     guardamos id, texto, atributos etc.
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
     LOCALIZAR NOVAMENTE O MESMO BOTÃO
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
     BOTÕES QUE NÃO DEVEM SER GRAVADOS NA TRILHA
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
     GRAVAR A NAVEGAÇÃO REAL
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


    /*
     * Não instala duas vezes
     * no mesmo documento.
     */

    if (
      doc.documentElement
        .dataset
        .medsimTrailV2 ===
      '1'
    ) {

      return;
    }


    doc.documentElement
      .dataset
      .medsimTrailV2 =
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


        if (
          !control ||
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



        /*
         * Espera o JS do simulado
         * terminar a troca de questão.
         */

        setTimeout(
          () => {

            const after =
              questionSignature(
                doc
              );


            /*
             * Só grava se a página realmente
             * mudou de questão.
             */

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
     REPRODUZIR A NAVEGAÇÃO REAL
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


    /*
     * O estado nativo já colocou
     * exatamente na questão correta.
     */

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



      /*
       * Esperamos a questão realmente mudar.
       */

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


      if (
        !changed
      ) {

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
     FALLBACK PARA PROGRESSOS ANTIGOS

     Progressos criados antes da V2
     ainda não possuem trilha.
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



    /*
     * 1. Talvez o próprio state nativo
     * já tenha resolvido.
     */

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



    /*
     * 2. Nova estratégia:
     * reproduzir a navegação REAL.
     */

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



    /*
     * 3. Fallback para registros
     * antigos sem trilha.
     */

    if (
      !success
    ) {

      success =
        await fallbackAdvance(

          frame,
          record

        );
    }



    /*
     * Respostas.
     */

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



    /*
     * Rolagem.
     */

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


      #${PANEL_ID}[
        data-mode="done"
      ] {

        border-color:

          rgba(
            22,
            163,
            74,
            .22
          );
      }


      #${PANEL_ID}[
        data-mode="error"
      ] {

        border-color:

          rgba(
            220,
            38,
            38,
            .26
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



  function showStatus(
    doc,
    title,
    meta,
    mode,
    timeout
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
      mode || 'done';


    panel.innerHTML = `

      <div class="msri-title">

      </div>

      <div class="msri-meta">

      </div>

    `;


    panel
      .querySelector(
        '.msri-title'
      )
      .textContent =
        title;


    panel
      .querySelector(
        '.msri-meta'
      )
      .textContent =
        meta;


    doc.body
      .appendChild(
        panel
      );


    if (
      timeout !== 0
    ) {

      setTimeout(
        () => {

          if (
            panel.isConnected
          ) {

            panel.remove();
          }

        },

        timeout ||
        3800

      );
    }
  }



  /* ============================================================
     CONTINUAR / RECOMEÇAR
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

        }`

        +

        (
          trail.length

            ? ` · ${trail.length} passo(s) de navegação registrados`

            : ''
        );



    /* --------------------------------------------------------
       CONTINUAR
       -------------------------------------------------------- */

    panel
      .querySelector(
        '.msri-continue'
      )
      .addEventListener(

        'click',

        () => {

          /*
           * Se já temos a navegação real,
           * começamos da primeira questão
           * para conseguir reproduzi-la.
           */

          if (
            trail.length
          ) {

            clearNativeState(
              doc,
              record
            );


          } else {

            /*
             * Para registros antigos,
             * ainda tentamos o state nativo.
             */

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



    /* --------------------------------------------------------
       RECOMEÇAR
       -------------------------------------------------------- */

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
           * Remove o estado em andamento.
           */

          clearNativeState(
            doc,
            record
          );


          /*
           * Remove a trilha.
           */

          clearTrail(
            path
          );


          /*
           * Remove o registro de retomada.
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
           * Reabre do zero.
           */

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



    /*
     * A partir daqui começamos a
     * registrar a navegação REAL.
     */

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



    /* --------------------------------------------------------
       RECOMEÇAR
       -------------------------------------------------------- */

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



    /* --------------------------------------------------------
       CONTINUAR
       -------------------------------------------------------- */

    if (

      action

      &&

      action.mode ===
        'continue'

      &&

      record

    ) {

      /*
       * Registro antigo sem trilha:
       * tenta state nativo.
       */

      if (
        !action.useTrail
      ) {

        applyNativeState(
          record
        );
      }



      const success =
        await restoreAfterReload(

          frame,
          path,
          record

        );



      if (
        success
      ) {

        showStatus(

          doc,

          'Progresso restaurado',

          `${questionLabel(record)} · continue normalmente.`,

          'done',

          3800

        );


      } else {

        /*
         * Não mentimos dizendo que voltou
         * se não conseguimos confirmar.
         */

        showStatus(

          doc,

          'Não consegui voltar automaticamente à questão salva',

          'As respostas salvas foram restauradas quando possível. A partir desta versão, a navegação real também passa a ser registrada para tornar as próximas retomadas mais precisas.',

          'error',

          7000

        );
      }


      return;
    }



    /* --------------------------------------------------------
       EXISTE PROGRESSO SALVO
       -------------------------------------------------------- */

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


    /*
     * Apenas detecta novos iframes.
     * Não mexe na estrutura do Hub.
     */

    setInterval(

      scanFrames,

      1000

    );


    console.info(

      '[MedSim] Retomar simulado interno v2 ativo.'

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
