(function () {
  'use strict';

  const VERSION = 1;

  const STYLE_ID =
    'medsim-grifo-borracha-v1';

  const TARGETS = [

    '#q-statement',
    '.q-statement',

    '#question-statement',
    '.question-statement',

    '#question-text',
    '.question-text',

    '#enunciado',
    '.enunciado',

    '[data-question-statement]',
    '[data-role="question-statement"]',
    '[data-role="question-text"]'

  ].join(',');


  const CONTROLS =
    'button,a,[role="button"],[onclick]';


  const frames =
    new WeakSet();


  const states =
    new WeakMap();



  /* ============================================================
     NORMALIZAR TEXTO
     ============================================================ */

  function norm(v) {

    return String(
      v || ''
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
     CSS AUXILIAR

     Não altera a estética dos botões.
     Apenas permite selecionar o texto
     e define o visual do trecho grifado.
     ============================================================ */

  function injectStyle(doc) {

    if (
      !doc.head ||
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

      #q-statement.medsim-grifo-selectable,
      .q-statement.medsim-grifo-selectable,
      .medsim-grifo-selectable {

        user-select:
          text !important;

        -webkit-user-select:
          text !important;
      }


      .medsim-universal-highlight {

        background-color:
          #fef08a;

        color:
          #0f172a;

        font-weight:
          600;

        border-radius:
          4px;

        padding:
          2px 3px;

        box-decoration-break:
          clone;

        -webkit-box-decoration-break:
          clone;
      }

    `;


    doc.head
      .appendChild(
        style
      );
  }



  /* ============================================================
     IDENTIFICAR GRIFAR / BORRACHA
     ============================================================ */

  function buttonKind(control) {

    if (!control) {

      return null;
    }


    const icon =

      control.querySelector

        ? control.querySelector('i')

        : null;


    const all =
      norm([

        control.id,

        control.getAttribute &&
          control.getAttribute(
            'title'
          ),

        control.getAttribute &&
          control.getAttribute(
            'aria-label'
          ),

        control.textContent,

        control.className,

        icon &&
          icon.className

      ].join(' '));


    if (

      control.id ===
        'btn-highlight'

      ||

      /\bgrifar\b|marca[ -]?texto|highlighter|ph-highlighter/
        .test(all)

    ) {

      return 'highlight';
    }


    if (

      control.id ===
        'btn-eraser'

      ||

      /\bborracha\b|apagar grifo|\beraser\b|ph-eraser/
        .test(all)

    ) {

      return 'eraser';
    }


    return null;
  }



  /* ============================================================
     ÁREAS DE TEXTO
     ============================================================ */

  function knownTargets(doc) {

    try {

      return Array.from(

        doc.querySelectorAll(
          TARGETS
        )

      );

    } catch (_) {

      return [];
    }
  }



  function targetForNode(
    doc,
    node
  ) {

    if (!node) {

      return null;
    }


    const el =

      node.nodeType === 1

        ? node

        : node.parentElement;


    if (
      !el ||
      !el.closest
    ) {

      return null;
    }


    /*
     * Não queremos grifar botões,
     * alternativas, inputs etc.
     */

    if (

      el.closest(

        'button,' +
        'label,' +
        'input,' +
        'textarea,' +
        'select,' +
        '.options-group,' +
        '[class*="option"],' +
        '[id*="option"],' +
        '[class*="alternativ"],' +
        '[id*="alternativ"]'

      )

    ) {

      return null;
    }


    const direct =
      el.closest(
        TARGETS
      );


    if (direct) {

      return direct;
    }


    /*
     * Fallback para simuladores
     * com estruturas diferentes.
     */

    const semantic =
      el.closest(

        '[class*="question"],' +
        '[id*="question"],' +

        '[class*="questao"],' +
        '[id*="questao"],' +

        '[class*="enunci"],' +
        '[id*="enunci"],' +

        '[class*="statement"],' +
        '[id*="statement"],' +

        '[class*="prompt"],' +
        '[id*="prompt"],' +

        '[class*="stem"],' +
        '[id*="stem"]'

      );


    if (semantic) {

      return semantic;
    }


    return el.closest(

      '.bento-q-card,' +
      '.question-card,' +
      '.quiz-question,' +
      '.question-container,' +
      '[data-question],' +
      '[data-questao]'

    );
  }



  function targetForRange(
    doc,
    range
  ) {

    if (
      !range ||
      range.collapsed
    ) {

      return null;
    }


    const a =
      targetForNode(
        doc,
        range.startContainer
      );


    const b =
      targetForNode(
        doc,
        range.endContainer
      );


    return (

      a &&
      a === b

        ? a

        : null

    );
  }



  /* ============================================================
     PERMITIR SELEÇÃO DE TEXTO
     ============================================================ */

  function setSelectable(
    doc,
    on
  ) {

    knownTargets(doc)
      .forEach(
        el => {

          el.classList.toggle(

            'medsim-grifo-selectable',

            Boolean(on)

          );

        }
      );
  }



  /* ============================================================
     RESET
     ============================================================ */

  function resetMode(
    doc,
    state
  ) {

    state.mode =
      null;


    state.range =
      null;


    state.target =
      null;


    setSelectable(
      doc,
      false
    );
  }



  /* ============================================================
     DETECTAR TROCA DE QUESTÃO
     ============================================================ */

  function observeTarget(
    doc,
    state,
    target
  ) {

    if (
      !target ||
      state.observed.has(
        target
      )
    ) {

      return;
    }


    state.observed.add(
      target
    );


    let lastText =
      target.textContent ||
      '';


    new MutationObserver(
      () => {

        const now =
          target.textContent ||
          '';


        if (
          now !== lastText
        ) {

          lastText =
            now;


          /*
           * Mudou de questão.
           * Desativa a ferramenta.
           */

          resetMode(
            doc,
            state
          );
        }

      }

    ).observe(

      target,

      {

        childList:
          true,

        characterData:
          true,

        subtree:
          true

      }

    );
  }



  function observeKnownTargets(
    doc,
    state
  ) {

    knownTargets(doc)
      .forEach(
        el => {

          observeTarget(
            doc,
            state,
            el
          );

        }
      );
  }



  /* ============================================================
     SINCRONIZAR MODO
     ============================================================ */

  function syncMode(
    doc,
    state,
    kind
  ) {

    const targets =
      knownTargets(
        doc
      );


    /*
     * Se o simulador original já
     * adiciona essas classes,
     * respeitamos isso.
     */

    const pen =
      targets.some(
        el =>

          el.classList.contains(
            'pen-active'
          )
      );


    const eraser =
      targets.some(
        el =>

          el.classList.contains(
            'eraser-active'
          )
      );


    if (pen) {

      state.mode =
        'highlight';


    } else if (eraser) {

      state.mode =
        'eraser';


    } else {

      /*
       * Fallback universal.
       */

      state.mode =

        state.mode === kind

          ? null

          : kind;
    }


    state.range =
      null;


    state.target =
      null;


    setSelectable(

      doc,

      state.mode ===
        'highlight'

    );
  }



  /* ============================================================
     SALVAR SELEÇÃO
     ============================================================ */

  function saveSelection(
    doc,
    state
  ) {

    if (
      state.mode !==
        'highlight'
    ) {

      return;
    }


    try {

      const sel =
        doc.defaultView
          .getSelection();


      if (

        !sel ||

        sel.rangeCount === 0 ||

        sel.isCollapsed

      ) {

        return;
      }


      const range =
        sel
          .getRangeAt(0)
          .cloneRange();


      const target =
        targetForRange(
          doc,
          range
        );


      if (!target) {

        return;
      }


      state.range =
        range;


      state.target =
        target;


      observeTarget(
        doc,
        state,
        target
      );


    } catch (_) {}
  }



  function getSelectionData(
    doc,
    state
  ) {

    try {

      const sel =
        doc.defaultView
          .getSelection();


      if (

        sel &&
        sel.rangeCount &&
        !sel.isCollapsed

      ) {

        const range =
          sel
            .getRangeAt(0)
            .cloneRange();


        const target =
          targetForRange(
            doc,
            range
          );


        if (target) {

          return {
            range,
            target
          };
        }
      }


    } catch (_) {}


    /*
     * Fallback caso o navegador
     * tenha perdido visualmente
     * a seleção.
     */

    return (

      state.range &&
      state.target

        ? {

            range:
              state.range
                .cloneRange(),

            target:
              state.target

          }

        : null

    );
  }



  /* ============================================================
     CRIAR GRIFO EM UM NÓ DE TEXTO
     ============================================================ */

  function wrapText(
    doc,
    node,
    start,
    end
  ) {

    if (
      !node ||
      start >= end
    ) {

      return false;
    }


    let selected =

      start > 0

        ? node.splitText(
            start
          )

        : node;


    const len =
      end - start;


    if (
      len <
      selected.nodeValue.length
    ) {

      selected.splitText(
        len
      );
    }


    if (
      !selected.parentNode
    ) {

      return false;
    }


    const mark =
      doc.createElement(
        'span'
      );


    /*
     * Mantemos também hl-word marked
     * para compatibilidade com os
     * simuladores que já possuem CSS.
     */

    mark.className =
      'hl-word marked medsim-universal-highlight';


    selected.parentNode
      .insertBefore(
        mark,
        selected
      );


    mark.appendChild(
      selected
    );


    return true;
  }



  /* ============================================================
     APLICAR GRIFO
     ============================================================ */

  function applyHighlight(
    doc,
    state
  ) {

    if (
      state.mode !==
        'highlight'
    ) {

      return false;
    }


    const data =
      getSelectionData(
        doc,
        state
      );


    if (!data) {

      return false;
    }


    const {
      range,
      target
    } = data;


    const nodes =
      [];


    /*
     * Percorre os nós de texto que
     * fazem parte da seleção.
     */

    const walker =
      doc.createTreeWalker(

        target,

        4,

        {

          acceptNode(node) {

            if (
              !node.nodeValue
            ) {

              return 2;
            }


            /*
             * Evita grifar novamente
             * algo já marcado.
             */

            if (

              node.parentElement

              &&

              node.parentElement.closest(

                '.medsim-universal-highlight,' +
                '.hl-word.marked'

              )

            ) {

              return 2;
            }


            try {

              return range
                .intersectsNode(
                  node
                )

                ? 1
                : 2;


            } catch (_) {

              return 2;
            }
          }

        }

      );


    let node;


    while (
      (
        node =
          walker.nextNode()
      )
    ) {

      nodes.push(
        node
      );
    }



    const tasks =
      nodes

        .map(
          n => {

            let start =

              range.startContainer === n

                ? range.startOffset

                : 0;


            let end =

              range.endContainer === n

                ? range.endOffset

                : n.nodeValue.length;


            start =
              Math.max(

                0,

                Math.min(

                  start,

                  n.nodeValue.length

                )

              );


            end =
              Math.max(

                start,

                Math.min(

                  end,

                  n.nodeValue.length

                )

              );


            return {

              node:
                n,

              start,

              end

            };

          }
        )

        .filter(
          x =>
            x.start <
            x.end
        );


    let changed =
      false;


    /*
     * De trás para frente para evitar
     * invalidar os offsets anteriores.
     */

    for (
      let i =
        tasks.length - 1;

      i >= 0;

      i--
    ) {

      const t =
        tasks[i];


      if (

        wrapText(

          doc,

          t.node,

          t.start,

          t.end

        )

      ) {

        changed =
          true;
      }
    }


    if (changed) {

      try {

        doc.defaultView
          .getSelection()
          .removeAllRanges();

      } catch (_) {}


      state.range =
        null;


      state.target =
        null;
    }


    return changed;
  }



  /* ============================================================
     APAGAR GRIFO
     ============================================================ */

  function erase(mark) {

    if (
      !mark ||
      !mark.parentNode
    ) {

      return;
    }


    const parent =
      mark.parentNode;


    /*
     * Remove somente o span,
     * preservando o texto.
     */

    while (
      mark.firstChild
    ) {

      parent.insertBefore(

        mark.firstChild,

        mark

      );
    }


    parent.removeChild(
      mark
    );


    parent.normalize();
  }



  /* ============================================================
     INSTALAR DENTRO DO SIMULADO
     ============================================================ */

  function attachDocument(doc) {

    if (

      !doc ||

      !doc.documentElement ||

      !doc.body ||

      states.has(doc)

    ) {

      return;
    }


    injectStyle(
      doc
    );


    const state = {

      mode:
        null,

      range:
        null,

      target:
        null,

      observed:
        new WeakSet()

    };


    states.set(
      doc,
      state
    );


    observeKnownTargets(
      doc,
      state
    );



    /* --------------------------------------------------------
       SELEÇÃO
       -------------------------------------------------------- */

    doc.addEventListener(

      'selectionchange',

      () => {

        saveSelection(
          doc,
          state
        );

      }

    );



    /* --------------------------------------------------------
       CLIQUE NOS BOTÕES / BORRACHA
       -------------------------------------------------------- */

    doc.addEventListener(

      'click',

      event => {

        const control =

          event.target &&
          event.target.closest

            ? event.target.closest(
                CONTROLS
              )

            : null;


        const kind =
          buttonKind(
            control
          );


        /*
         * GRIFAR / BORRACHA
         */

        if (kind) {

          observeKnownTargets(
            doc,
            state
          );


          /*
           * Espera o onclick original
           * alterar pen-active /
           * eraser-active.
           */

          setTimeout(
            () => {

              syncMode(
                doc,
                state,
                kind
              );

            },
            0
          );


          return;
        }



        /*
         * BORRACHA
         */

        if (
          state.mode ===
            'eraser'
        ) {

          const mark =

            event.target &&
            event.target.closest

              ? event.target.closest(

                  '.medsim-universal-highlight,' +
                  '.hl-word.marked'

                )

              : null;


          if (
            mark &&
            targetForNode(
              doc,
              mark
            )
          ) {

            event.preventDefault();

            event.stopPropagation();


            erase(
              mark
            );
          }
        }

      }

    );



    /* --------------------------------------------------------
       INÍCIO DA SELEÇÃO
       -------------------------------------------------------- */

    doc.addEventListener(

      'mousedown',

      event => {

        if (
          state.mode !==
            'highlight'
        ) {

          return;
        }


        const target =
          targetForNode(

            doc,

            event.target

          );


        if (target) {

          observeTarget(
            doc,
            state,
            target
          );


          /*
           * Mesmo que o simulador tenha
           * user-select:none.
           */

          target.classList.add(
            'medsim-grifo-selectable'
          );
        }

      },

      true

    );



    /* --------------------------------------------------------
       APLICAR GRIFO AO SOLTAR O MOUSE

       CAPTURE = true:
       executa antes da lógica quebrada
       dos simuladores.
       -------------------------------------------------------- */

    doc.addEventListener(

      'mouseup',

      event => {

        if (
          state.mode !==
            'highlight'
        ) {

          return;
        }


        if (

          !targetForNode(
            doc,
            event.target
          )

          &&

          !state.target

        ) {

          return;
        }


        saveSelection(
          doc,
          state
        );


        applyHighlight(
          doc,
          state
        );

      },

      true

    );



    /* --------------------------------------------------------
       TOUCH / CELULAR
       -------------------------------------------------------- */

    doc.addEventListener(

      'touchend',

      () => {

        if (
          state.mode ===
            'highlight'
        ) {

          setTimeout(
            () => {

              saveSelection(
                doc,
                state
              );


              applyHighlight(
                doc,
                state
              );

            },
            80
          );
        }

      },

      {
        capture:
          true,

        passive:
          true
      }

    );
  }



  /* ============================================================
     IFRAME
     ============================================================ */

  function attachFrame(frame) {

    if (
      !frame ||
      frames.has(frame)
    ) {

      return;
    }


    frames.add(
      frame
    );


    frame.addEventListener(

      'load',

      () => {

        try {

          attachDocument(
            frame.contentDocument
          );

        } catch (_) {}

      }

    );


    try {

      if (

        frame.contentDocument

        &&

        frame.contentDocument
          .readyState !==
          'loading'

      ) {

        attachDocument(
          frame.contentDocument
        );
      }


    } catch (_) {}
  }



  /* ============================================================
     PROCURAR IFRAMES
     ============================================================ */

  function scan() {

    document
      .querySelectorAll(
        'iframe'
      )

      .forEach(
        attachFrame
      );
  }



  /* ============================================================
     INICIAR
     ============================================================ */

  function start() {

    scan();


    /*
     * Apenas verifica se apareceu
     * algum novo iframe.
     */

    setInterval(

      scan,

      1000

    );


    window.MedSimGrifoBorracha = {

      version:
        VERSION,

      rescan:
        scan

    };


    console.info(

      '[MedSim] Grifar/Borracha universal v1 ativo.'

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
