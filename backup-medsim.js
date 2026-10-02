(function () {
  'use strict';


  /* ============================================================
     MEDSIM — BACKUP DOS MEUS DADOS
     ============================================================

     Funções:

     1. Exportar backup
     2. Restaurar backup
     3. Ver último backup
     4. Limpar meus dados

     O script trabalha somente com dados locais do MedSim.

     NÃO modifica:
     - arquivos HTML
     - simulados
     - outros sites
     - outros dados do navegador
     ============================================================ */


  const VERSION = 1;

  const FORMAT =
    'medsim-backup';


  const LAST_EXPORT_KEY =
    'medsim_backup_last_export_v1';


  const RECOVERY_KEY =
    'medsim_backup_recovery_v1';


  const BUTTON_ID =
    'medsim-backup-button';


  const MODAL_ID =
    'medsim-backup-modal';


  const STYLE_ID =
    'medsim-backup-style';


  const FILE_INPUT_ID =
    'medsim-backup-file';



  /* ============================================================
     CHAVES INTERNAS

     Estas não precisam entrar no backup.
     ============================================================ */

  const INTERNAL_KEYS =
    new Set([

      LAST_EXPORT_KEY

    ]);



  /* ============================================================
     CHAVES ESPECÍFICAS DO HUB
     ============================================================ */

  const EXACT_KEYS =
    new Set([

      'simulados_concluidos',

      'ultimo_acesso_simulado'

    ]);



  /* ============================================================
     IDENTIFICA DADOS DO MEDSIM
     ============================================================ */

  function isMedSimKey(
    key
  ) {

    if (
      !key ||
      INTERNAL_KEYS.has(
        key
      )
    ) {

      return false;
    }


    return (

      /^medsim_/i.test(
        key
      )

      ||

      /^simulado_/i.test(
        key
      )

      ||

      EXACT_KEYS.has(
        key
      )

    );
  }



  /* ============================================================
     LISTAR CHAVES
     ============================================================ */

  function listMedSimKeys() {

    const keys =
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
        isMedSimKey(
          key
        )
      ) {

        keys.push(
          key
        );
      }
    }


    return keys.sort();
  }



  /* ============================================================
     COLETAR DADOS
     ============================================================ */

  function collectData() {

    const data =
      {};


    listMedSimKeys()
      .forEach(
        key => {

          const value =
            localStorage.getItem(
              key
            );


          if (
            value !== null
          ) {

            /*
             * Mantemos o valor exatamente
             * como está armazenado.
             */

            data[key] =
              value;
          }

        }
      );


    return data;
  }



  /* ============================================================
     SNAPSHOT
     ============================================================ */

  function makeSnapshot(
    reason
  ) {

    return {

      format:
        FORMAT,

      version:
        VERSION,

      app:
        'MedSim',

      reason:
        reason || 'manual',

      createdAt:
        new Date()
          .toISOString(),

      data:
        collectData()

    };
  }



  /* ============================================================
     RECUPERAÇÃO TEMPORÁRIA

     Antes de restaurar ou apagar,
     guardamos uma cópia na sessão atual.

     Ela desaparece quando a aba é encerrada.
     ============================================================ */

  function saveRecovery(
    reason
  ) {

    try {

      sessionStorage.setItem(

        RECOVERY_KEY,

        JSON.stringify(

          makeSnapshot(
            reason
          )

        )

      );

    } catch (error) {

      console.warn(

        '[MedSim] Não foi possível criar recuperação temporária.',

        error

      );
    }
  }



  /* ============================================================
     LIMPAR APENAS DADOS DO MEDSIM
     ============================================================ */

  function clearTrackedData() {

    listMedSimKeys()
      .forEach(
        key => {

          localStorage.removeItem(
            key
          );

        }
      );
  }



  /* ============================================================
     RESTAURAR SNAPSHOT
     ============================================================ */

  function restoreSnapshot(
    snapshot
  ) {

    clearTrackedData();


    Object
      .entries(
        snapshot.data || {}
      )

      .forEach(
        ([key, value]) => {

          /*
           * Segurança:
           *
           * mesmo que alguém modifique manualmente
           * o JSON, só permitimos chaves do MedSim.
           */

          if (

            isMedSimKey(
              key
            )

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



  /* ============================================================
     NOME DO ARQUIVO
     ============================================================ */

  function filenameDate(
    date
  ) {

    const pad =
      number =>

        String(
          number
        )

          .padStart(
            2,
            '0'
          );


    return [

      date.getFullYear(),

      '-',

      pad(
        date.getMonth() + 1
      ),

      '-',

      pad(
        date.getDate()
      ),

      '_',

      pad(
        date.getHours()
      ),

      '-',

      pad(
        date.getMinutes()
      )

    ].join('');
  }



  /* ============================================================
     DOWNLOAD
     ============================================================ */

  function downloadJSON(
    payload
  ) {

    const blob =
      new Blob(

        [

          JSON.stringify(
            payload,
            null,
            2
          )

        ],

        {

          type:
            'application/json;charset=utf-8'

        }

      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        'a'
      );


    link.href =
      url;


    link.download =

      `medsim-backup-${

        filenameDate(
          new Date()
        )

      }.json`;


    document.body
      .appendChild(
        link
      );


    link.click();


    link.remove();


    setTimeout(
      function () {

        URL.revokeObjectURL(
          url
        );

      },

      1000

    );
  }



  /* ============================================================
     1. EXPORTAR BACKUP
     ============================================================ */

  function exportBackup() {

    const snapshot =
      makeSnapshot(
        'export'
      );


    const payload = {

      ...snapshot,


      origin:
        location.origin,


      path:
        location.pathname,


      summary: {

        keys:

          Object
            .keys(
              snapshot.data
            )
            .length

      }

    };


    downloadJSON(
      payload
    );


    /*
     * Registra quando o backup
     * foi exportado.
     */

    localStorage.setItem(

      LAST_EXPORT_KEY,

      payload.createdAt

    );


    updateStatus();


    showMessage(

      'Backup exportado com sucesso.',

      'success'

    );
  }



  /* ============================================================
     FORMATA DATA
     ============================================================ */

  function formatDate(
    iso
  ) {

    if (
      !iso
    ) {

      return 'Nenhum backup exportado ainda';
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

      return 'Nenhum backup exportado ainda';
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
     VALIDAR ARQUIVO DE BACKUP
     ============================================================ */

  function validateBackup(
    raw
  ) {

    if (
      !raw ||
      typeof raw !==
        'object'
    ) {

      throw new Error(
        'Arquivo inválido.'
      );
    }


    if (

      raw.format !==
        FORMAT

      ||

      raw.app !==
        'MedSim'

    ) {

      throw new Error(

        'Este arquivo não é um backup reconhecido do MedSim.'

      );
    }


    if (

      !raw.data

      ||

      typeof raw.data !==
        'object'

      ||

      Array.isArray(
        raw.data
      )

    ) {

      throw new Error(

        'O backup não contém dados restauráveis.'

      );
    }



    const data =
      {};


    /*
     * Segurança:
     *
     * ignoramos qualquer chave estranha
     * existente no JSON.
     */

    Object
      .entries(
        raw.data
      )

      .forEach(
        ([key, value]) => {

          if (

            isMedSimKey(
              key
            )

            &&

            typeof value ===
              'string'

          ) {

            data[key] =
              value;
          }

        }
      );


    if (
      !Object
        .keys(
          data
        )
        .length
    ) {

      throw new Error(

        'Nenhum dado válido do MedSim foi encontrado no arquivo.'

      );
    }


    return {

      format:
        FORMAT,

      version:

        Number(
          raw.version
        )

        ||

        1,

      app:
        'MedSim',

      createdAt:
        raw.createdAt || null,

      data

    };
  }



  /* ============================================================
     2. RESTAURAR BACKUP
     ============================================================ */

  async function restoreFromFile(
    file
  ) {

    if (
      !file
    ) {

      return;
    }



    /*
     * Um localStorage normalmente é muito
     * menor que isso.
     */

    if (
      file.size >
      10 * 1024 * 1024
    ) {

      showMessage(

        'O arquivo é grande demais para um backup do MedSim.',

        'error'

      );


      return;
    }



    let parsed;


    try {

      parsed =
        JSON.parse(

          await file.text()

        );

    } catch (_) {

      showMessage(

        'Não foi possível ler esse arquivo JSON.',

        'error'

      );


      return;
    }



    let backup;


    try {

      backup =
        validateBackup(
          parsed
        );

    } catch (error) {

      showMessage(

        error.message,

        'error'

      );


      return;
    }



    const count =

      Object
        .keys(
          backup.data
        )
        .length;



    const date =

      backup.createdAt

        ? formatDate(
            backup.createdAt
          )

        : 'data não informada';



    /*
     * CONFIRMAÇÃO ANTES DA OPERAÇÃO
     */

    const ok =
      window.confirm(

        `Restaurar este backup?\n\n`

        +

        `Backup: ${date}\n`

        +

        `Itens: ${count}\n\n`

        +

        `Os dados atuais do MedSim serão substituídos `

        +

        `pelos dados deste arquivo.\n\n`

        +

        `Outros dados do navegador não serão alterados.`

      );


    if (
      !ok
    ) {

      return;
    }



    /*
     * Guarda os dados atuais em memória
     * e em sessionStorage antes de alterar.
     */

    const current =
      makeSnapshot(
        'before-restore'
      );


    saveRecovery(
      'before-restore'
    );



    try {

      restoreSnapshot(
        backup
      );


      showMessage(

        'Backup restaurado. Recarregando o MedSim...',

        'success'

      );


      setTimeout(
        function () {

          location.reload();

        },

        500

      );

    } catch (error) {

      console.error(

        '[MedSim] Falha na restauração.',

        error

      );


      /*
       * Se algo der errado no meio,
       * tentamos restaurar automaticamente
       * os dados anteriores.
       */

      try {

        restoreSnapshot(
          current
        );

      } catch (_) {}


      showMessage(

        'A restauração falhou e os dados anteriores foram preservados.',

        'error'

      );
    }
  }



  /* ============================================================
     4. LIMPAR MEUS DADOS
     ============================================================ */

  function clearMyData() {

    const count =
      listMedSimKeys()
        .length;


    if (
      !count
    ) {

      showMessage(

        'Não há dados do MedSim para limpar neste navegador.',

        'info'

      );


      return;
    }



    /*
     * PRIMEIRA CONFIRMAÇÃO
     */

    const first =
      window.confirm(

        `Limpar meus dados do MedSim neste navegador?\n\n`

        +

        `Serão removidos histórico, progresso, simulados concluídos, `

        +

        `estatísticas, rascunhos, preferências e outros dados locais `

        +

        `do MedSim.\n\n`

        +

        `Os arquivos dos simulados e outros sites não serão afetados.`

      );


    if (
      !first
    ) {

      return;
    }



    /*
     * SEGUNDA CONFIRMAÇÃO
     */

    const second =
      window.confirm(

        `Última confirmação:\n\n`

        +

        `Deseja apagar ${count} item(ns) de dados do MedSim?`

      );


    if (
      !second
    ) {

      return;
    }



    /*
     * Segurança temporária antes da exclusão.
     */

    saveRecovery(
      'before-clear'
    );



    try {

      clearTrackedData();


      showMessage(

        'Seus dados locais do MedSim foram limpos.',

        'success'

      );


      closeModal();


      setTimeout(
        function () {

          location.reload();

        },

        500

      );

    } catch (error) {

      console.error(

        '[MedSim] Falha ao limpar dados.',

        error

      );


      showMessage(

        'Não foi possível limpar todos os dados.',

        'error'

      );
    }
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
         BOTÃO DO MENU
         ====================================================== */

      #${BUTTON_ID} {

        width:
          100%;

        display:
          flex;

        align-items:
          center;

        gap:
          10px;


        padding:
          10px 12px;


        border:
          0;


        border-radius:
          10px;


        background:
          transparent;


        color:
          inherit;


        font:
          inherit;


        font-weight:
          650;


        text-align:
          left;


        cursor:
          pointer;
      }


      #${BUTTON_ID}:hover {

        background:

          rgba(
            99,
            102,
            241,
            .09
          );
      }



      /* ======================================================
         FALLBACK

         Só é utilizado se o Hub não possuir
         sidebar/nav-menu.
         ====================================================== */

      #${BUTTON_ID}.medsim-backup-fallback {

        position:
          fixed;

        left:
          14px;

        bottom:
          14px;

        z-index:
          2147481000;


        width:
          auto;


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


        border:

          1px solid
          var(
            --border-color,
            rgba(148,163,184,.28)
          );


        box-shadow:

          0 8px 24px
          rgba(
            15,
            23,
            42,
            .12
          );
      }



      /* ======================================================
         FUNDO DO MODAL
         ====================================================== */

      #${MODAL_ID} {

        position:
          fixed;

        inset:
          0;


        z-index:
          2147482000;


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
          blur(5px);
      }


      #${MODAL_ID}[
        data-open="true"
      ] {

        display:
          flex;
      }



      /* ======================================================
         JANELA
         ====================================================== */

      #${MODAL_ID}
      .medsim-backup-card {

        width:

          min(
            520px,
            100%
          );


        max-height:

          min(
            720px,
            calc(100vh - 36px)
          );


        overflow:
          auto;


        box-sizing:
          border-box;


        padding:
          18px;


        border-radius:
          16px;


        border:

          1px solid
          var(
            --border-color,
            rgba(148,163,184,.25)
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


        box-shadow:

          0 24px 70px
          rgba(
            15,
            23,
            42,
            .24
          );
      }



      /* ======================================================
         CABEÇALHO
         ====================================================== */

      #${MODAL_ID}
      .medsim-backup-head {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          12px;


        margin-bottom:
          14px;
      }


      #${MODAL_ID}
      .medsim-backup-title {

        font-size:
          1.05rem;

        font-weight:
          800;
      }


      #${MODAL_ID}
      .medsim-backup-close {

        width:
          34px;

        height:
          34px;


        border:
          0;


        border-radius:
          9px;


        background:
          transparent;


        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          22px;


        cursor:
          pointer;
      }



      /* ======================================================
         ÚLTIMO BACKUP
         ====================================================== */

      #${MODAL_ID}
      .medsim-backup-status {

        padding:
          12px;


        margin-bottom:
          12px;


        border-radius:
          12px;


        border:

          1px solid
          var(
            --border-color,
            rgba(148,163,184,.22)
          );


        background:

          rgba(
            99,
            102,
            241,
            .06
          );
      }


      #${MODAL_ID}
      .medsim-backup-status
      strong {

        display:
          block;


        margin-bottom:
          4px;


        font-size:
          .82rem;
      }


      #${MODAL_ID}
      .medsim-backup-status
      span,

      #${MODAL_ID}
      .medsim-backup-note {

        color:

          var(
            --text-secondary,
            #64748b
          );


        font-size:
          .8rem;


        line-height:
          1.45;
      }



      /* ======================================================
         BOTÕES
         ====================================================== */

      #${MODAL_ID}
      .medsim-backup-grid {

        display:
          grid;


        grid-template-columns:
          1fr 1fr;


        gap:
          10px;


        margin-top:
          14px;
      }


      #${MODAL_ID}
      .medsim-backup-action {

        min-height:
          46px;


        padding:
          10px 12px;


        border-radius:
          11px;


        border:

          1px solid
          var(
            --border-color,
            rgba(148,163,184,.28)
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


        font-weight:
          750;


        cursor:
          pointer;
      }


      #${MODAL_ID}
      .medsim-backup-action.primary {

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


        box-shadow:

          0 5px 14px
          rgba(
            79,
            70,
            229,
            .20
          );
      }


      #${MODAL_ID}
      .medsim-backup-action.danger {

        color:
          #b91c1c;


        border-color:

          rgba(
            220,
            38,
            38,
            .25
          );


        background:

          rgba(
            220,
            38,
            38,
            .06
          );
      }


      #${MODAL_ID}
      .medsim-backup-action:hover {

        transform:
          translateY(-1px);
      }



      /* ======================================================
         MENSAGENS
         ====================================================== */

      #medsim-backup-message {

        display:
          none;


        margin-top:
          12px;


        padding:
          10px 12px;


        border-radius:
          10px;


        font-size:
          .82rem;


        line-height:
          1.4;
      }


      #medsim-backup-message[
        data-show="true"
      ] {

        display:
          block;
      }


      #medsim-backup-message[
        data-type="success"
      ] {

        background:

          rgba(
            22,
            163,
            74,
            .09
          );

        color:
          #15803d;
      }


      #medsim-backup-message[
        data-type="error"
      ] {

        background:

          rgba(
            220,
            38,
            38,
            .09
          );

        color:
          #b91c1c;
      }


      #medsim-backup-message[
        data-type="info"
      ] {

        background:

          rgba(
            59,
            130,
            246,
            .09
          );

        color:
          #1d4ed8;
      }



      /* ======================================================
         CELULAR
         ====================================================== */

      @media (
        max-width:
        560px
      ) {

        #${MODAL_ID}
        .medsim-backup-grid {

          grid-template-columns:
            1fr;
        }

      }

    `;


    document.head
      .appendChild(
        style
      );
  }



  /* ============================================================
     CRIAR INTERFACE
     ============================================================ */

  function buildUI() {

    injectStyle();



    /* ----------------------------------------------------------
       MODAL
       ---------------------------------------------------------- */

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
          class="medsim-backup-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="medsim-backup-title">

          <div class="medsim-backup-head">

            <div
              id="medsim-backup-title"
              class="medsim-backup-title">

              Backup dos meus dados

            </div>


            <button
              type="button"
              class="medsim-backup-close"
              aria-label="Fechar">

              ×

            </button>

          </div>


          <div class="medsim-backup-status">

            <strong>
              Último backup exportado
            </strong>

            <span id="medsim-backup-last">

              Nenhum backup exportado ainda

            </span>

          </div>


          <div class="medsim-backup-note">

            O backup inclui apenas dados locais
            do MedSim neste navegador, como
            histórico, progresso, simulados
            concluídos, estatísticas, rascunhos
            e preferências.

            <br><br>

            O arquivo pode conter informações
            pessoais de estudo. Guarde-o em
            local privado.

          </div>


          <div class="medsim-backup-grid">


            <button
              type="button"
              class="medsim-backup-action primary"
              data-action="export">

              Exportar backup

            </button>


            <button
              type="button"
              class="medsim-backup-action"
              data-action="restore">

              Restaurar backup

            </button>


            <button
              type="button"
              class="medsim-backup-action"
              data-action="refresh">

              Ver último backup

            </button>


            <button
              type="button"
              class="medsim-backup-action danger"
              data-action="clear">

              Limpar meus dados

            </button>


          </div>


          <div
            id="medsim-backup-message"
            data-show="false"
            data-type="info">

          </div>


          <input
            id="${FILE_INPUT_ID}"
            type="file"
            accept=".json,application/json"
            hidden>


        </div>

      `;


      document.body
        .appendChild(
          modal
        );



      /* --------------------------------------------------------
         FECHAR
         -------------------------------------------------------- */

      modal
        .querySelector(
          '.medsim-backup-close'
        )

        .addEventListener(
          'click',
          closeModal
        );



      /*
       * Clicar fora também fecha.
       */

      modal.addEventListener(

        'pointerdown',

        function (event) {

          if (
            event.target ===
            modal
          ) {

            closeModal();
          }

        }

      );



      /* --------------------------------------------------------
         EXPORTAR
         -------------------------------------------------------- */

      modal
        .querySelector(
          '[data-action="export"]'
        )

        .addEventListener(
          'click',
          exportBackup
        );



      /* --------------------------------------------------------
         RESTAURAR
         -------------------------------------------------------- */

      modal
        .querySelector(
          '[data-action="restore"]'
        )

        .addEventListener(

          'click',

          function () {

            const input =
              document.getElementById(
                FILE_INPUT_ID
              );


            input.value =
              '';


            input.click();

          }

        );



      /* --------------------------------------------------------
         VER ÚLTIMO BACKUP
         -------------------------------------------------------- */

      modal
        .querySelector(
          '[data-action="refresh"]'
        )

        .addEventListener(

          'click',

          function () {

            updateStatus();


            showMessage(

              'Informação do último backup atualizada.',

              'info'

            );

          }

        );



      /* --------------------------------------------------------
         LIMPAR
         -------------------------------------------------------- */

      modal
        .querySelector(
          '[data-action="clear"]'
        )

        .addEventListener(
          'click',
          clearMyData
        );



      /* --------------------------------------------------------
         ARQUIVO SELECIONADO
         -------------------------------------------------------- */

      document
        .getElementById(
          FILE_INPUT_ID
        )

        .addEventListener(

          'change',

          function (event) {

            restoreFromFile(

              event.target.files &&
              event.target.files[0]

            );

          }

        );
    }



    ensureButton();

    updateStatus();
  }



  /* ============================================================
     BOTÃO NO HUB
     ============================================================ */

  function ensureButton() {

    let button =
      document.getElementById(
        BUTTON_ID
      );


    if (
      !button
    ) {

      button =
        document.createElement(
          'button'
        );


      button.id =
        BUTTON_ID;


      button.type =
        'button';


      button.innerHTML = `

        <span aria-hidden="true">
          💾
        </span>

        <span>
          Backup dos meus dados
        </span>

      `;


      button.addEventListener(
        'click',
        openModal
      );
    }



    /*
     * Seu Hub possui nav-menu.
     * Tentamos colocar o botão ali.
     */

    const nav =
      document.querySelector(
        '.nav-menu'
      );


    const sidebar =
      document.querySelector(
        '.sidebar'
      );



    if (
      nav
    ) {

      if (
        button.parentElement !==
        nav
      ) {

        nav.appendChild(
          button
        );
      }


      button.classList.remove(
        'medsim-backup-fallback'
      );

    } else if (
      sidebar
    ) {

      if (
        button.parentElement !==
        sidebar
      ) {

        sidebar.appendChild(
          button
        );
      }


      button.classList.remove(
        'medsim-backup-fallback'
      );

    } else if (
      !button.isConnected
    ) {

      /*
       * Segurança caso a estrutura
       * do index mude futuramente.
       */

      document.body
        .appendChild(
          button
        );


      button.classList.add(
        'medsim-backup-fallback'
      );
    }
  }



  /* ============================================================
     ABRIR / FECHAR
     ============================================================ */

  function openModal() {

    const modal =
      document.getElementById(
        MODAL_ID
      );


    if (
      !modal
    ) {

      return;
    }


    updateStatus();


    modal.dataset.open =
      'true';
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
     3. VER ÚLTIMO BACKUP
     ============================================================ */

  function updateStatus() {

    const target =
      document.getElementById(
        'medsim-backup-last'
      );


    if (
      !target
    ) {

      return;
    }


    const last =
      localStorage.getItem(
        LAST_EXPORT_KEY
      );


    const count =
      listMedSimKeys()
        .length;


    target.textContent =

      `${formatDate(last)} · `

      +

      `${count} item(ns) locais atualmente`;

  }



  /* ============================================================
     MENSAGENS
     ============================================================ */

  function showMessage(
    message,
    type
  ) {

    const box =
      document.getElementById(
        'medsim-backup-message'
      );


    if (
      !box
    ) {

      return;
    }


    box.textContent =
      message;


    box.dataset.type =
      type || 'info';


    box.dataset.show =
      'true';



    clearTimeout(
      showMessage._timer
    );


    showMessage._timer =
      setTimeout(

        function () {

          box.dataset.show =
            'false';

        },

        5000

      );
  }



  /* ============================================================
     DETECTAR SE ESTÁ NO SIMULADO
     ============================================================ */

  function simulatorOpen() {

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

          rect.width >
            0

          &&

          rect.height >
            0

        );
      }
    );
  }



  /* ============================================================
     BOTÃO APARECE SOMENTE NO HUB
     ============================================================ */

  function syncHubVisibility() {

    ensureButton();


    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (
      !button
    ) {

      return;
    }


    const open =
      simulatorOpen();



    /*
     * Entrou no simulado:
     * botão desaparece.
     *
     * Voltou ao Hub:
     * reaparece.
     */

    button.style.display =
      open
        ? 'none'
        : '';



    if (
      open
    ) {

      closeModal();
    }
  }



  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */

  function start() {

    buildUI();


    syncHubVisibility();



    /*
     * ESC fecha a janela.
     */

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



    /*
     * Observa mudanças no Hub.
     */

    const observer =
      new MutationObserver(

        function () {

          ensureButton();

          syncHubVisibility();

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
     * Verificação leve para detectar
     * entrada/saída dos simulados.
     */

    setInterval(

      syncHubVisibility,

      700

    );


    console.info(

      '[MedSim] Backup dos meus dados ativo.'

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
