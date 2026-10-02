(function () {
  'use strict';

  const STYLE_ID = 'medsim-voltar-hub-style-v3';
  const TOOLBAR_CLASS = 'medsim-voltar-hub-toolbar-v3';
  const BUTTON_CLASS = 'medsim-voltar-hub-button-v3';
  const PROCESSED_ATTR = 'data-medsim-voltar-v3';

  /* ============================================================
     CSS QUE SERÁ APLICADO AO BOTÃO REAL
     ============================================================ */

  const CSS = `

    .${TOOLBAR_CLASS} {

      position: sticky !important;
      top: 0 !important;

      z-index: 2147483000 !important;

      width: 100% !important;

      box-sizing: border-box !important;

      display: flex !important;

      align-items: center !important;
      justify-content: flex-start !important;

      min-height: 62px !important;

      padding:
        10px 16px !important;

      margin:
        0 0 16px 0 !important;


      background:
        rgba(
          248,
          250,
          252,
          0.94
        ) !important;


      border-bottom:
        1px solid
        rgba(
          148,
          163,
          184,
          0.22
        ) !important;


      box-shadow:
        0 5px 18px
        rgba(
          15,
          23,
          42,
          0.07
        ) !important;


      backdrop-filter:
        blur(12px) !important;

      -webkit-backdrop-filter:
        blur(12px) !important;
    }



    /* ========================================================
       BOTÃO
       ======================================================== */

    .${BUTTON_CLASS} {

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


      transform:
        none !important;


      display:
        inline-flex !important;

      align-items:
        center !important;

      justify-content:
        center !important;

      gap:
        8px !important;


      width:
        auto !important;

      max-width:
        100% !important;


      min-height:
        42px !important;


      margin:
        0 !important;


      padding:
        10px 16px !important;


      box-sizing:
        border-box !important;


      border:
        1px solid
        rgba(
          255,
          255,
          255,
          0.22
        ) !important;


      border-radius:
        12px !important;


      /*
       Destaque roxo/azulado compatível
       com o restante do MedSim.
      */

      background:

        linear-gradient(
          135deg,

          #4f46e5 0%,

          #7c3aed 100%

        ) !important;


      color:
        #ffffff !important;


      font-family:
        inherit !important;


      font-size:
        14px !important;


      font-weight:
        750 !important;


      line-height:
        1.1 !important;


      letter-spacing:
        -0.01em !important;


      text-decoration:
        none !important;


      text-align:
        center !important;


      white-space:
        nowrap !important;


      cursor:
        pointer !important;


      opacity:
        1 !important;


      visibility:
        visible !important;


      box-shadow:

        0 6px 18px
        rgba(
          79,
          70,
          229,
          0.24
        ),

        0 2px 5px
        rgba(
          15,
          23,
          42,
          0.10
        )

        !important;


      transition:

        transform
        0.18s ease,

        box-shadow
        0.18s ease,

        filter
        0.18s ease

        !important;
    }



    /* ========================================================
       HOVER
       ======================================================== */

    .${BUTTON_CLASS}:hover {

      transform:
        translateY(-1px) !important;


      filter:
        brightness(1.06) !important;


      box-shadow:

        0 9px 24px
        rgba(
          79,
          70,
          229,
          0.30
        ),

        0 3px 7px
        rgba(
          15,
          23,
          42,
          0.12
        )

        !important;
    }



    /* ========================================================
       CLIQUE
       ======================================================== */

    .${BUTTON_CLASS}:active {

      transform:
        scale(0.98) !important;
    }



    /* ========================================================
       FOCO
       ======================================================== */

    .${BUTTON_CLASS}:focus-visible {

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



    /* ========================================================
       MODO ESCURO
       ======================================================== */

    @media (
      prefers-color-scheme:
      dark
    ) {

      .${TOOLBAR_CLASS} {

        background:

          rgba(
            15,
            23,
            42,
            0.92
          ) !important;


        border-bottom-color:

          rgba(
            148,
            163,
            184,
            0.18
          ) !important;


        box-shadow:

          0 5px 18px
          rgba(
            0,
            0,
            0,
            0.24
          ) !important;
      }

    }



    /* ========================================================
       CELULAR
       ======================================================== */

    @media (
      max-width:
      700px
    ) {

      .${TOOLBAR_CLASS} {

        min-height:
          54px !important;


        padding:
          8px 10px !important;


        margin-bottom:
          10px !important;
      }


      .${BUTTON_CLASS} {

        min-height:
          38px !important;


        padding:
          9px 12px !important;


        border-radius:
          10px !important;


        font-size:
          13px !important;
      }

    }



    /* ========================================================
       ACESSIBILIDADE
       ======================================================== */

    @media (
      prefers-reduced-motion:
      reduce
    ) {

      .${BUTTON_CLASS} {

        transition:
          none !important;
      }


      .${BUTTON_CLASS}:hover {

        transform:
          none !important;
      }

    }

  `;



  /* ============================================================
     NORMALIZA TEXTO
     ============================================================ */

  function normalizeText(value) {

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



  /* ============================================================
     TEXTO DO ELEMENTO
     ============================================================ */

  function elementText(
    element
  ) {

    if (!element) {

      return '';
    }


    if (
      element.tagName ===
      'INPUT'
    ) {

      return (
        element.value ||
        ''
      );
    }


    return (

      element.textContent ||

      element.getAttribute(
        'aria-label'
      ) ||

      element.getAttribute(
        'title'
      ) ||

      ''

    );
  }



  /* ============================================================
     CONFERE SE É O BOTÃO VOLTAR AO HUB
     ============================================================ */

  function isBackToHub(
    element
  ) {

    if (
      !element ||
      element.nodeType !== 1
    ) {

      return false;
    }


    /*
      O ID encontrado no seu index.
    */

    if (
      element.id ===
      'btn-back'
    ) {

      return true;
    }


    const text =
      normalizeText(
        elementText(
          element
        )
      );


    return (

      text ===
        'voltar ao hub'

      ||

      text.includes(
        'voltar ao hub'
      )

    );
  }



  /* ============================================================
     INJETA CSS
     ============================================================ */

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



  /* ============================================================
     DESCOBRE A ÁREA DO SIMULADO
     ============================================================ */

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

        main

      `)

      ||

      doc.body

    );
  }



  /* ============================================================
     CRIA A BARRA E MOVE O BOTÃO EXISTENTE
     ============================================================ */

  function ensureToolbar(
    button,
    doc
  ) {

    if (
      !button ||
      !doc ||
      button.getAttribute(
        PROCESSED_ATTR
      ) === '1'
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
      IMPORTANTE:

      Se estivermos no INDEX principal,
      só alteramos o botão quando houver
      um iframe realmente carregado.

      Isso evita alterar aquele botão
      da etapa anterior que você relatou.
    */

    const isTopDocument =
      doc === document;


    if (
      isTopDocument
    ) {

      const iframe =
        host.querySelector(
          'iframe'
        );


      if (!iframe) {

        return;
      }


      const src =
        (
          iframe.getAttribute(
            'src'
          ) || ''
        ).trim();


      /*
        Sem simulado carregado:
        não mexemos em nada.
      */

      if (
        !src ||
        src ===
          'about:blank'
      ) {

        return;
      }
    }



    /*
      Procura uma barra já criada.
    */

    let toolbar =
      host.querySelector(

        `:scope > .${TOOLBAR_CLASS}`

      );



    /*
      Se ainda não existe,
      cria uma.
    */

    if (
      !toolbar
    ) {

      toolbar =
        doc.createElement(
          'div'
        );


      toolbar.className =
        TOOLBAR_CLASS;


      toolbar.setAttribute(
        'role',
        'navigation'
      );


      toolbar.setAttribute(
        'aria-label',
        'Navegação do simulado'
      );


      host.insertBefore(

        toolbar,

        host.firstChild

      );
    }



    /*
      Aplica a classe visual.
    */

    button.classList.add(
      BUTTON_CLASS
    );


    button.setAttribute(
      PROCESSED_ATTR,
      '1'
    );


    /*
      MOVE o botão existente.

      Não cria outro botão.
    */

    toolbar.appendChild(
      button
    );
  }



  /* ============================================================
     PROCURA BOTÕES
     ============================================================ */

  function findButtons(
    doc
  ) {

    if (!doc) {

      return [];
    }


    const found =
      new Set();



    /*
      Primeiro tenta pelo ID.
    */

    const byId =
      doc.getElementById(
        'btn-back'
      );


    if (byId) {

      found.add(
        byId
      );
    }



    /*
      Depois procura também pelo texto.
    */

    doc.querySelectorAll(`

      button,

      a,

      [role="button"],

      input[type="button"],

      input[type="submit"]

    `)

      .forEach(
        element => {

          if (
            isBackToHub(
              element
            )
          ) {

            found.add(
              element
            );
          }

        }
      );


    return [
      ...found
    ];
  }



  /* ============================================================
     PROCESSA UM DOCUMENTO
     ============================================================ */

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


    findButtons(
      doc
    )

      .forEach(
        button => {

          ensureToolbar(
            button,
            doc
          );

        }
      );



    /*
      Evita criar mais de um observer.
    */

    if (
      !doc.defaultView ||
      doc.defaultView
        .__medsimVoltarHubV3Observer
    ) {

      return;
    }



    const observer =
      new MutationObserver(
        function () {

          findButtons(
            doc
          )

            .forEach(
              button => {

                ensureToolbar(
                  button,
                  doc
                );

              }
            );


          scanIframes(
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
      .__medsimVoltarHubV3Observer =
      observer;
  }



  /* ============================================================
     PROCESSA IFRAME
     ============================================================ */

  function processIframe(
    iframe
  ) {

    if (!iframe) {

      return;
    }


    /*
      Registra apenas uma vez
      o listener do iframe.
    */

    if (
      iframe.dataset
        .medsimVoltarV3 !==
      '1'
    ) {

      iframe.dataset
        .medsimVoltarV3 =
        '1';


      iframe.addEventListener(

        'load',

        function () {

          /*
            Rodamos algumas vezes porque
            alguns simulados montam elementos
            após o load inicial.
          */

          setTimeout(
            function () {

              runIframe(
                iframe
              );

            },
            0
          );


          setTimeout(
            function () {

              runIframe(
                iframe
              );

            },
            150
          );


          setTimeout(
            function () {

              runIframe(
                iframe
              );

            },
            700
          );

        }

      );
    }



    /*
      Tenta também imediatamente.
    */

    runIframe(
      iframe
    );
  }



  /* ============================================================
     EXECUTA DENTRO DO IFRAME
     ============================================================ */

  function runIframe(
    iframe
  ) {

    try {

      const innerDocument =
        iframe.contentDocument;


      if (
        innerDocument
      ) {

        processDocument(
          innerDocument
        );
      }

    } catch (error) {

      /*
        Isso ocorreria apenas se o iframe
        estivesse em outro domínio.
      */

      console.warn(

        '[MedSim] O iframe não pôde ser ajustado:',

        error

      );
    }
  }



  /* ============================================================
     PROCURA IFRAMES
     ============================================================ */

  function scanIframes(
    doc
  ) {

    if (!doc) {

      return;
    }


    doc.querySelectorAll(
      'iframe'
    )

      .forEach(
        processIframe
      );
  }



  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */

  function start() {

    /*
      Documento principal.
    */

    processDocument(
      document
    );


    /*
      Iframes existentes.
    */

    scanIframes(
      document
    );



    /*
      Algumas varreduras extras.

      Isso cobre páginas em que o iframe
      é criado depois de outros scripts.
    */

    [
      250,
      1000,
      2500
    ]

      .forEach(
        delay => {

          setTimeout(
            function () {

              processDocument(
                document
              );


              scanIframes(
                document
              );

            },
            delay
          );

        }
      );


    console.info(
      '[MedSim] Ajuste universal do botão Voltar ao Hub ativo.'
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
