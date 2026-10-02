(function () {
  'use strict';

  const STYLE_ID = 'medsim-back-v4-style';
  const SLOT = 'medsim-back-v4-slot';
  const BTN = 'medsim-back-v4-btn';

  const CSS = `

    /*
     * Pequeno espaço reservado apenas para o botão.
     * NÃO é uma barra.
     */
    .${SLOT} {

      position: relative !important;

      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important;

      width: fit-content !important;
      max-width: calc(100% - 24px) !important;

      height: auto !important;

      margin:
        12px 0 14px 12px !important;

      padding:
        0 !important;

      background:
        transparent !important;

      border:
        0 !important;

      box-shadow:
        none !important;

      z-index:
        30 !important;
    }



    /*
     * Botão real "Voltar ao Hub".
     */
    .${BTN} {

      /*
       * Remove qualquer posição absoluta/fixa
       * existente no botão original.
       */
      position:
        static !important;

      inset:
        auto !important;

      top:
        auto !important;

      right:
        auto !important;

      bottom:
        auto !important;

      left:
        auto !important;

      float:
        none !important;


      /*
       * Organização.
       */
      display:
        inline-flex !important;

      align-items:
        center !important;

      justify-content:
        center !important;

      gap:
        7px !important;


      /*
       * Dimensões compactas.
       */
      width:
        auto !important;

      min-width:
        0 !important;

      max-width:
        100% !important;

      min-height:
        40px !important;


      margin:
        0 !important;


      padding:
        9px 14px !important;


      box-sizing:
        border-box !important;


      /*
       * Visual compatível com MedSim.
       */
      background:

        linear-gradient(
          135deg,
          #4f46e5,
          #7c3aed
        )

        !important;


      color:
        #ffffff !important;


      border:

        1px solid
        rgba(
          255,
          255,
          255,
          0.20
        )

        !important;


      border-radius:
        11px !important;


      /*
       * Texto.
       */
      font-family:
        inherit !important;

      font-size:
        13px !important;

      font-weight:
        700 !important;

      line-height:
        1.15 !important;

      letter-spacing:
        -0.01em !important;

      text-align:
        center !important;

      text-decoration:
        none !important;

      white-space:
        nowrap !important;


      /*
       * Interação.
       */
      cursor:
        pointer !important;

      opacity:
        1 !important;

      visibility:
        visible !important;

      pointer-events:
        auto !important;


      /*
       * Destaque sutil.
       */
      box-shadow:

        0 5px 14px
        rgba(
          79,
          70,
          229,
          0.22
        ),

        0 2px 4px
        rgba(
          15,
          23,
          42,
          0.10
        )

        !important;


      transition:

        transform
        0.16s ease,

        box-shadow
        0.16s ease,

        filter
        0.16s ease

        !important;
    }



    .${BTN}:hover {

      transform:
        translateY(-1px) !important;


      filter:
        brightness(1.06) !important;


      box-shadow:

        0 7px 18px
        rgba(
          79,
          70,
          229,
          0.28
        ),

        0 3px 6px
        rgba(
          15,
          23,
          42,
          0.12
        )

        !important;
    }



    .${BTN}:active {

      transform:
        scale(0.98) !important;
    }



    .${BTN}:focus-visible {

      outline:

        3px solid
        rgba(
          99,
          102,
          241,
          0.28
        )

        !important;


      outline-offset:
        3px !important;
    }



    /*
     * Celular.
     */
    @media (
      max-width: 700px
    ) {

      .${SLOT} {

        margin:
          8px 0 10px 8px !important;

        max-width:
          calc(100% - 16px) !important;
      }


      .${BTN} {

        min-height:
          36px !important;

        padding:
          8px 11px !important;

        border-radius:
          9px !important;

        font-size:
          12px !important;
      }

    }

  `;



  /*
   * Normaliza textos.
   */
  function normalizeText(
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

      .replace(
        /[←↩⟵‹«]/g,
        ''
      )

      .replace(
        /\s+/g,
        ' '
      )

      .trim()

      .toLowerCase();
  }



  /*
   * Identifica o botão de retorno.
   */
  function isBackButton(
    element
  ) {

    if (
      !element ||
      element.nodeType !== 1
    ) {

      return false;
    }


    /*
     * O ID presente no seu projeto.
     */
    if (
      element.id ===
      'btn-back'
    ) {

      return true;
    }


    let text;


    if (
      element.tagName ===
      'INPUT'
    ) {

      text =
        element.value;

    } else {

      text =

        element.textContent ||

        element.getAttribute(
          'aria-label'
        ) ||

        element.getAttribute(
          'title'
        ) ||

        '';

    }


    return normalizeText(
      text
    ).includes(
      'voltar ao hub'
    );
  }



  /*
   * Injeta CSS.
   */
  function injectStyle(
    doc
  ) {

    if (
      !doc ||
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


    style.textContent =
      CSS;


    doc.head.appendChild(
      style
    );
  }



  /*
   * Detecta se um simulado está realmente aberto
   * no documento principal.
   *
   * Isso evita alterar aquele botão existente
   * antes de abrir a prova.
   */
  function simulationIsOpen() {

    return [

      ...document.querySelectorAll(
        'iframe'
      )

    ].some(
      frame => {

        const src =
          (
            frame.getAttribute(
              'src'
            ) ||
            ''
          ).trim();


        if (
          !src ||
          src ===
            'about:blank'
        ) {

          return false;
        }


        const style =
          getComputedStyle(
            frame
          );


        if (
          style.display ===
            'none' ||

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
      }
    );
  }



  /*
   * Remove estruturas deixadas pela V3.
   */
  function cleanupOldVersion(
    doc
  ) {

    doc
      .querySelectorAll(
        '.medsim-voltar-hub-toolbar-v3'
      )

      .forEach(
        toolbar => {

          const button =
            toolbar.querySelector(`

              #btn-back,

              .medsim-voltar-hub-button-v3

            `);


          if (
            button &&
            toolbar.parentNode
          ) {

            toolbar.parentNode.insertBefore(

              button,

              toolbar

            );
          }


          toolbar.remove();
        }
      );


    doc
      .querySelectorAll(
        '.medsim-voltar-hub-button-v3'
      )

      .forEach(
        button => {

          button.classList.remove(
            'medsim-voltar-hub-button-v3'
          );

        }
      );
  }



  /*
   * Encontra possíveis botões.
   */
  function findButtons(
    doc
  ) {

    const result =
      new Set();


    const byId =
      doc.getElementById(
        'btn-back'
      );


    if (
      byId
    ) {

      result.add(
        byId
      );
    }


    doc
      .querySelectorAll(`

        button,

        a,

        [role="button"],

        input[type="button"],

        input[type="submit"]

      `)

      .forEach(
        element => {

          if (
            isBackButton(
              element
            )
          ) {

            result.add(
              element
            );
          }

        }
      );


    return [
      ...result
    ];
  }



  /*
   * Procura o container apropriado.
   */
  function findHost(
    button,
    doc
  ) {

    return (

      button.closest(`

        #tela-prova,

        #prova-container,

        #simulado-container,

        .tela-prova,

        .prova-container,

        .simulado-container,

        .exam-container,

        main,

        .container

      `)

      ||

      doc.body

    );
  }



  /*
   * Coloca o botão no canto superior esquerdo
   * sem criar barra grande.
   */
  function placeButton(
    button,
    doc
  ) {

    /*
     * Se for o documento principal,
     * só mexemos quando existir
     * simulado realmente aberto.
     */
    if (
      doc === document &&
      !simulationIsOpen()
    ) {

      return;
    }


    /*
     * Já está na posição correta.
     */
    if (
      button.closest(
        '.' + SLOT
      )
    ) {

      return;
    }


    const host =
      findHost(
        button,
        doc
      );


    if (!host) {

      return;
    }


    /*
     * Pequeno suporte.
     *
     * Ele tem apenas o tamanho do botão,
     * não ocupa a página toda.
     */
    let slot =
      host.querySelector(

        ':scope > .' +
        SLOT

      );


    if (!slot) {

      slot =
        doc.createElement(
          'div'
        );


      slot.className =
        SLOT;


      slot.setAttribute(
        'aria-label',
        'Retorno ao Hub'
      );


      /*
       * Coloca no início do simulado.
       */
      host.insertBefore(

        slot,

        host.firstChild

      );
    }


    /*
     * Remove classe da V3,
     * caso ainda exista.
     */
    button.classList.remove(
      'medsim-voltar-hub-button-v3'
    );


    /*
     * Aplica novo visual.
     */
    button.classList.add(
      BTN
    );


    /*
     * MOVE o botão original.
     *
     * Não cria botão novo.
     */
    slot.appendChild(
      button
    );
  }



  /*
   * Processa documento.
   */
  function processDocument(
    doc
  ) {

    if (
      !doc ||
      !doc.documentElement
    ) {

      return;
    }


    injectStyle(
      doc
    );


    cleanupOldVersion(
      doc
    );


    findButtons(
      doc
    )

      .forEach(
        button => {

          placeButton(
            button,
            doc
          );

        }
      );


    /*
     * Observa botões adicionados
     * posteriormente.
     */
    if (
      doc.defaultView &&
      !doc.defaultView
        .__medsimBackV4Observer
    ) {

      const observer =
        new MutationObserver(
          function () {

            findButtons(
              doc
            )

              .forEach(
                button => {

                  placeButton(
                    button,
                    doc
                  );

                }
              );


            scanFrames(
              doc
            );
          }
        );


      observer.observe(

        doc.documentElement,

        {

          childList:
            true,

          subtree:
            true

        }

      );


      doc.defaultView
        .__medsimBackV4Observer =
        observer;
    }
  }



  /*
   * Executa no iframe.
   */
  function runFrame(
    frame
  ) {

    try {

      if (
        frame.contentDocument
      ) {

        processDocument(
          frame.contentDocument
        );
      }

    } catch (error) {

      console.warn(

        '[MedSim] Não foi possível ajustar o botão do iframe.',

        error

      );
    }
  }



  /*
   * Registra iframe.
   */
  function registerFrame(
    frame
  ) {

    if (
      frame.dataset
        .medsimBackV4 !==
      '1'
    ) {

      frame.dataset
        .medsimBackV4 =
        '1';


      frame.addEventListener(

        'load',

        function () {

          /*
           * Algumas páginas terminam de montar
           * elementos depois do load.
           */
          [
            0,
            120,
            500
          ]

            .forEach(
              delay => {

                setTimeout(
                  function () {

                    runFrame(
                      frame
                    );

                  },
                  delay
                );

              }
            );


          /*
           * Também reavalia o index,
           * caso o botão esteja fora do iframe.
           */
          [
            0,
            120
          ]

            .forEach(
              delay => {

                setTimeout(
                  function () {

                    processDocument(
                      document
                    );

                  },
                  delay
                );

              }
            );

        }

      );
    }


    runFrame(
      frame
    );
  }



  /*
   * Busca iframes.
   */
  function scanFrames(
    doc
  ) {

    doc
      .querySelectorAll(
        'iframe'
      )

      .forEach(
        registerFrame
      );
  }



  /*
   * Inicialização.
   */
  function start() {

    processDocument(
      document
    );


    scanFrames(
      document
    );


    /*
     * Varreduras extras para páginas
     * que criam o iframe mais tarde.
     */
    [
      250,
      900,
      2000
    ]

      .forEach(
        delay => {

          setTimeout(
            function () {

              processDocument(
                document
              );


              scanFrames(
                document
              );

            },
            delay
          );

        }
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
        once: true
      }

    );

  } else {

    start();
  }

})();
