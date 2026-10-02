(function () {
    'use strict';

    /* ============================================================
       MEDSIM — AJUSTES VISUAIS DOS SIMULADOS

       Este script entra automaticamente nos iframes dos simulados
       e estiliza o botão "Voltar ao Hub".

       Nenhum HTML dos simulados precisa ser alterado.
       ============================================================ */


    const STYLE_ID =
        'medsim-ajuste-voltar-hub';


    const CLASS_NAME =
        'medsim-voltar-hub-ajustado';



    /* ============================================================
       CSS QUE SERÁ INJETADO DENTRO DO SIMULADO
       ============================================================ */

    const CSS = `

        .${CLASS_NAME} {

            /* POSIÇÃO */

            position: fixed !important;

            top: 18px !important;
            left: 18px !important;

            right: auto !important;
            bottom: auto !important;

            z-index: 2147483646 !important;


            /* ORGANIZAÇÃO */

            display: inline-flex !important;

            align-items: center !important;
            justify-content: center !important;

            gap: 7px !important;


            /* TAMANHO */

            min-height: 42px !important;

            padding:
                10px 16px !important;


            /* VISUAL */

            background:
                linear-gradient(
                    135deg,
                    #6366f1 0%,
                    #7c3aed 100%
                ) !important;

            color:
                #ffffff !important;


            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.20
                ) !important;

            border-radius:
                12px !important;


            /* TEXTO */

            font-family:
                inherit !important;

            font-size:
                0.84rem !important;

            font-weight:
                700 !important;

            line-height:
                1 !important;

            letter-spacing:
                -0.01em !important;

            white-space:
                nowrap !important;

            text-decoration:
                none !important;


            /* SOMBRA */

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
                    0.12

                ) !important;


            /* INTERAÇÃO */

            cursor:
                pointer !important;


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

        .${CLASS_NAME}:hover {

            transform:
                translateY(-2px) !important;

            filter:
                brightness(1.07) !important;

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
                    0.14

                ) !important;
        }



        /* ========================================================
           CLIQUE
           ======================================================== */

        .${CLASS_NAME}:active {

            transform:

                translateY(0)

                scale(0.97)

                !important;
        }



        /* ========================================================
           FOCO POR TECLADO
           ======================================================== */

        .${CLASS_NAME}:focus-visible {

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
           CELULAR / TABLET
           ======================================================== */

        @media (
            max-width: 700px
        ) {

            .${CLASS_NAME} {

                top:
                    10px !important;

                left:
                    10px !important;


                min-height:
                    38px !important;


                padding:

                    8px 12px

                    !important;


                font-size:
                    0.76rem !important;


                border-radius:
                    10px !important;
            }

        }



        /* ========================================================
           REDUÇÃO DE MOVIMENTO
           ======================================================== */

        @media (
            prefers-reduced-motion:
            reduce
        ) {

            .${CLASS_NAME} {

                transition:
                    none !important;
            }


            .${CLASS_NAME}:hover {

                transform:
                    none !important;
            }

        }

    `;



    /* ============================================================
       NORMALIZA TEXTO
       ============================================================ */

    function normalizarTexto(
        texto
    ) {

        return String(
            texto || ''
        )

            .toLowerCase()

            .normalize('NFD')

            .replace(
                /[\u0300-\u036f]/g,
                ''
            )

            /*
             Remove símbolos de seta para que:

             ← Voltar ao Hub

             e

             Voltar ao Hub

             sejam tratados da mesma forma.
            */

            .replace(
                /[←↩⟵‹«]/g,
                ''
            )

            .replace(
                /\s+/g,
                ' '
            )

            .trim();
    }



    /* ============================================================
       VERIFICA SE É O BOTÃO QUE QUEREMOS
       ============================================================ */

    function ehBotaoVoltar(
        elemento
    ) {

        let texto = '';


        /*
         INPUT pode usar value em vez de textContent.
        */

        if (
            elemento.tagName ===
            'INPUT'
        ) {

            texto =
                elemento.value || '';

        } else {

            texto =
                elemento.textContent || '';
        }


        texto =
            normalizarTexto(
                texto
            );


        return (

            texto.includes(
                'voltar ao hub'
            )

            ||

            texto ===
                'voltar hub'

        );
    }



    /* ============================================================
       ENCONTRA O BOTÃO DENTRO DO SIMULADO
       ============================================================ */

    function encontrarBotoes(
        documento
    ) {

        if (!documento) {
            return [];
        }


        /*
         Não dependemos do ID ou classe original.

         Procuramos pelo texto, porque os diferentes simulados
         podem ter códigos ligeiramente diferentes.
        */

        const elementos =
            documento.querySelectorAll(`

                button,

                a,

                [role="button"],

                input[type="button"],

                input[type="submit"]

            `);


        return [
            ...elementos
        ].filter(
            ehBotaoVoltar
        );
    }



    /* ============================================================
       APLICA CLASSE
       ============================================================ */

    function aplicarClasse(
        documento
    ) {

        const botoes =
            encontrarBotoes(
                documento
            );


        botoes.forEach(
            botao => {

                botao.classList.add(
                    CLASS_NAME
                );

            }
        );


        return botoes.length;
    }



    /* ============================================================
       INJETA CSS NO DOCUMENTO DO SIMULADO
       ============================================================ */

    function injetarCSS(
        documento
    ) {

        if (
            documento.getElementById(
                STYLE_ID
            )
        ) {

            return;
        }


        const style =
            documento.createElement(
                'style'
            );


        style.id =
            STYLE_ID;


        style.textContent =
            CSS;


        /*
         Idealmente colocamos no <head>.

         Se o simulado ainda estiver carregando,
         usamos documentElement como alternativa.
        */

        (
            documento.head ||
            documento.documentElement
        ).appendChild(
            style
        );
    }



    /* ============================================================
       OBSERVA ALTERAÇÕES DENTRO DO SIMULADO
       ============================================================ */

    function observarDocumento(
        documento
    ) {

        const janela =
            documento.defaultView;


        if (!janela) {
            return;
        }


        /*
         Evita criar vários observers
         para o mesmo documento.
        */

        if (
            janela
                .__medsimVoltarHubObserver
        ) {

            return;
        }


        const observer =
            new MutationObserver(
                function () {

                    aplicarClasse(
                        documento
                    );

                }
            );


        observer.observe(

            documento.documentElement,

            {

                childList:
                    true,

                subtree:
                    true

            }

        );


        janela
            .__medsimVoltarHubObserver =
            observer;
    }



    /* ============================================================
       PROCESSA UM IFRAME
       ============================================================ */

    function processarIframe(
        iframe
    ) {

        try {

            const documento =
                iframe.contentDocument;


            if (
                !documento
            ) {

                return;
            }


            injetarCSS(
                documento
            );


            aplicarClasse(
                documento
            );


            observarDocumento(
                documento
            );


        } catch (erro) {

            /*
             Isso só deveria ocorrer se o iframe estivesse
             em outro domínio.

             Seus simulados em /simulados/ normalmente são
             same-origin com o index.html.
            */

            console.warn(

                '[MedSim] Não foi possível aplicar ' +
                'os ajustes ao simulado.',

                erro
            );
        }
    }



    /* ============================================================
       PREPARA UM IFRAME
       ============================================================ */

    function registrarIframe(
        iframe
    ) {

        if (
            iframe.dataset
                .medsimAjustesRegistrado
        ) {

            return;
        }


        iframe.dataset
            .medsimAjustesRegistrado =
            'true';


        /*
         Toda vez que o src do iframe mudar
         e um novo simulado carregar,
         executamos novamente.
        */

        iframe.addEventListener(

            'load',

            function () {

                /*
                 Pequeno atraso permite que o HTML interno
                 termine de montar o botão.
                */

                setTimeout(
                    function () {

                        processarIframe(
                            iframe
                        );

                    },
                    50
                );


                setTimeout(
                    function () {

                        processarIframe(
                            iframe
                        );

                    },
                    400
                );

            }

        );


        /*
         Caso o iframe já esteja carregado
         quando este script iniciar.
        */

        try {

            if (
                iframe.contentDocument &&
                iframe.contentDocument.readyState ===
                    'complete'
            ) {

                processarIframe(
                    iframe
                );
            }

        } catch {

            /* sem ação */

        }
    }



    /* ============================================================
       PROCURA TODOS OS IFRAMES
       ============================================================ */

    function procurarIframes() {

        document
            .querySelectorAll(
                'iframe'
            )
            .forEach(
                registrarIframe
            );
    }



    /* ============================================================
       OBSERVA NOVOS IFRAMES CRIADOS PELO INDEX
       ============================================================ */

    function observarIndex() {

        const observer =
            new MutationObserver(
                function () {

                    procurarIframes();

                }
            );


        observer.observe(

            document.documentElement,

            {

                childList:
                    true,

                subtree:
                    true

            }

        );
    }



    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */

    function iniciar() {

        procurarIframes();

        observarIndex();


        console.log(
            '[MedSim] Ajustes dos simulados carregados.'
        );
    }



    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(

            'DOMContentLoaded',

            iniciar,

            {
                once: true
            }

        );

    } else {

        iniciar();
    }

})();
