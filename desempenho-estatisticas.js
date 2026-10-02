/* ==========================================================================
   MEDSIM — DESEMPENHO & ESTATÍSTICAS
   Arquivo independente para integração com index.html

   Integração:
   <script src="desempenho-estatisticas.js"></script>

   O arquivo procura automaticamente históricos no formato:
   simulado_*_history
   ========================================================================== */

(function () {
    "use strict";

    const CONFIG = {
        metaPadrao: 70,
        historicoPrefixo: "simulado_",
        historicoSufixo: "_history",
        chaveMeta: "medsim_meta_desempenho"
    };

    const MAPA_MATERIAS = {
        farma: "Farmacologia",
        farmaco: "Farmacologia",

        imuno: "Imunologia",
        imunologia: "Imunologia",

        micro: "Microbiologia",

        para: "Parasitologia",
        parasito: "Parasitologia",

        patologia: "Patologia",
        pato: "Patologia",

        prope: "Propedêutica",
        propedeu: "Propedêutica",

        fisio: "Fisiologia",
        fisiologia: "Fisiologia",

        psico: "Psicomed",
        psicomed: "Psicomed",

        vigilancia: "Vigilância em Saúde"
    };


    /* ======================================================================
       ESTADO
       ====================================================================== */

    let filtroMateria = "TODAS";

    let meta = Number(
        localStorage.getItem(CONFIG.chaveMeta) ||
        CONFIG.metaPadrao
    );

    let dadosAtuais = [];


    /* ======================================================================
       UTILIDADES
       ====================================================================== */

    function escapeHtml(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function limitar(valor, min, max) {
        return Math.min(Math.max(valor, min), max);
    }


    function media(lista) {

        if (!lista.length) {
            return 0;
        }

        return lista.reduce((soma, valor) => soma + valor, 0) /
            lista.length;
    }


    function arredondar(numero, casas = 1) {

        const fator = Math.pow(10, casas);

        return Math.round(numero * fator) / fator;
    }


    function formatarPercentual(numero) {

        if (!Number.isFinite(numero)) {
            return "0%";
        }

        return `${arredondar(numero, 1)}%`;
    }


    function segundosDeTempo(texto) {

        if (!texto) {
            return 0;
        }

        const partes = String(texto)
            .split(":")
            .map(Number);

        if (partes.some(Number.isNaN)) {
            return 0;
        }

        if (partes.length === 2) {

            return
                partes[0] * 60 +
                partes[1];
        }

        if (partes.length === 3) {

            return
                partes[0] * 3600 +
                partes[1] * 60 +
                partes[2];
        }

        return 0;
    }


    function formatarTempoTotal(segundos) {

        if (!segundos) {
            return "0 min";
        }

        const horas = Math.floor(segundos / 3600);

        const minutos = Math.floor(
            (segundos % 3600) / 60
        );

        if (horas > 0) {

            return `${horas}h ${minutos}min`;
        }

        return `${minutos} min`;
    }


    function obterMateriaDaChave(chave) {

        const nome = chave
            .replace(/^simulado_/, "")
            .replace(/_history$/, "")
            .toLowerCase();


        /*
         Caso especial existente nos seus arquivos.

         micro2024_history possui origem potencialmente compartilhada
         entre arquivos de Microbiologia / Imunologia 2024.
        */

        if (nome.includes("micro2024")) {

            return "Micro/Imuno 2024";
        }


        for (const [alias, materia] of Object.entries(MAPA_MATERIAS)) {

            if (nome.includes(alias)) {

                return materia;
            }
        }

        return nome
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, letra => letra.toUpperCase());
    }


    function normalizarTentativa(item, chave) {

        const pct =
            Number(
                item.pct ??
                item.percent ??
                item.percentage ??
                item.percentual ??
                0
            );


        return {

            materia:
                obterMateriaDaChave(chave),

            origem:
                chave,

            data:
                item.date ||
                item.data ||
                "Data não registrada",

            edicao:
                item.edition ||
                item.edicao ||
                item.title ||
                item.titulo ||
                "Simulado",

            pct:
                Number.isFinite(pct)
                    ? pct
                    : 0,

            pontos:
                item.pts ??
                item.score ??
                item.pontos ??
                "-",

            tempo:
                item.timeStr ||
                item.tempo ||
                "00:00",

            segundos:
                segundosDeTempo(
                    item.timeStr ||
                    item.tempo
                )
        };
    }


    /* ======================================================================
       LEITURA DOS HISTÓRICOS
       ====================================================================== */

    function coletarHistoricos() {

        const resultados = [];

        for (let i = 0; i < localStorage.length; i++) {

            const chave = localStorage.key(i);

            if (!chave) {
                continue;
            }

            if (
                !chave.startsWith(CONFIG.historicoPrefixo) ||
                !chave.endsWith(CONFIG.historicoSufixo)
            ) {
                continue;
            }


            try {

                const valor =
                    JSON.parse(
                        localStorage.getItem(chave) || "[]"
                    );

                if (!Array.isArray(valor)) {
                    continue;
                }


                valor.forEach(item => {

                    resultados.push(
                        normalizarTentativa(
                            item,
                            chave
                        )
                    );

                });

            } catch (erro) {

                console.warn(
                    "[MedSim Estatísticas] Não foi possível ler:",
                    chave,
                    erro
                );
            }
        }


        return resultados;
    }


    function obterConcluidos() {

        try {

            const lista =
                JSON.parse(
                    localStorage.getItem(
                        "simulados_concluidos"
                    ) || "[]"
                );

            return Array.isArray(lista)
                ? lista
                : [];

        } catch {

            return [];
        }
    }


    /* ======================================================================
       CSS
       ====================================================================== */

    function inserirCSS() {

        if (
            document.getElementById(
                "medsim-estatisticas-css"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");

        style.id =
            "medsim-estatisticas-css";

        style.textContent = `

        #medsim-performance-overlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: var(--bg-canvas, #f8fafc);
            color: var(--text-main, #0f172a);
            overflow-y: auto;
            display: none;
        }

        #medsim-performance-overlay.active {
            display: block;
        }

        .medperf-shell {
            width: min(1500px, 96%);
            margin: 0 auto;
            padding: 32px 0 70px;
        }

        .medperf-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .medperf-header h1 {
            margin: 5px 0 8px;
            font-size: clamp(1.8rem, 3vw, 2.7rem);
            letter-spacing: -1px;
        }

        .medperf-header p {
            color: var(--text-muted, #64748b);
            margin: 0;
        }

        .medperf-badge {
            font-size: .75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .08em;
            color: var(--purple-primary, #3b82f6);
        }

        .medperf-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .medperf-btn {
            border: 1px solid var(--border-color, #e2e8f0);
            background: var(--card-bg-solid, #fff);
            color: var(--text-main, #0f172a);
            padding: 10px 15px;
            border-radius: 10px;
            font-family: inherit;
            font-weight: 700;
            cursor: pointer;
            transition: .2s;
        }

        .medperf-btn:hover {
            transform: translateY(-1px);
            border-color: var(--purple-primary, #3b82f6);
        }

        .medperf-btn.primary {
            background: var(--purple-primary, #3b82f6);
            color: white;
            border-color: transparent;
        }

        .medperf-controls {
            display: flex;
            gap: 12px;
            align-items: end;
            flex-wrap: wrap;
            padding: 16px;
            margin-bottom: 22px;
            border-radius: 16px;
            border: 1px solid var(--border-color, #e2e8f0);
            background: var(--card-bg, #fff);
        }

        .medperf-control {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .medperf-control label {
            font-size: .75rem;
            font-weight: 800;
            color: var(--text-muted, #64748b);
        }

        .medperf-control select,
        .medperf-control input {
            border: 1px solid var(--border-color, #e2e8f0);
            background: var(--input-bg, #fff);
            color: var(--text-main, #0f172a);
            border-radius: 9px;
            padding: 9px 10px;
            font-family: inherit;
        }

        .medperf-kpis {
            display: grid;
            grid-template-columns:
                repeat(auto-fit, minmax(190px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }

        .medperf-card {
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: 16px;
            padding: 20px;
            box-shadow: var(--shadow-sm, 0 4px 10px rgba(0,0,0,.04));
        }

        .medperf-kpi-label {
            font-size: .76rem;
            font-weight: 800;
            color: var(--text-muted, #64748b);
            text-transform: uppercase;
            letter-spacing: .04em;
        }

        .medperf-kpi-value {
            font-size: 2rem;
            font-weight: 800;
            margin-top: 7px;
        }

        .medperf-kpi-sub {
            margin-top: 4px;
            color: var(--text-muted, #64748b);
            font-size: .8rem;
        }

        .medperf-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 20px;
        }

        .medperf-section-title {
            margin: 0 0 15px;
            font-size: 1.05rem;
        }

        .medperf-chart {
            height: 280px;
            width: 100%;
            position: relative;
        }

        .medperf-chart canvas {
            width: 100%;
            height: 100%;
        }

        .medperf-table-wrap {
            overflow-x: auto;
        }

        .medperf-table {
            width: 100%;
            border-collapse: collapse;
        }

        .medperf-table th,
        .medperf-table td {
            text-align: left;
            padding: 12px;
            border-bottom:
                1px solid var(--border-color, #e2e8f0);
            font-size: .86rem;
        }

        .medperf-table th {
            color: var(--text-muted, #64748b);
            font-size: .72rem;
            text-transform: uppercase;
            letter-spacing: .04em;
        }

        .medperf-score {
            font-weight: 800;
        }

        .medperf-insights {
            display: grid;
            grid-template-columns:
                repeat(auto-fit, minmax(230px, 1fr));
            gap: 14px;
        }

        .medperf-insight {
            border:
                1px solid var(--border-color, #e2e8f0);
            border-radius: 13px;
            padding: 16px;
            background: var(--card-bg-solid, #fff);
        }

        .medperf-insight-title {
            font-weight: 800;
            margin-bottom: 5px;
        }

        .medperf-insight-text {
            color: var(--text-muted, #64748b);
            font-size: .85rem;
            line-height: 1.5;
        }

        .medperf-empty {
            padding: 50px 20px;
            text-align: center;
            color: var(--text-muted, #64748b);
        }

        .medperf-warning {
            padding: 13px 15px;
            margin-bottom: 18px;
            border-radius: 10px;
            border: 1px solid rgba(245,158,11,.35);
            background: rgba(245,158,11,.08);
            font-size: .83rem;
        }

        @media (max-width: 900px) {

            .medperf-grid {
                grid-template-columns: 1fr;
            }

            .medperf-shell {
                width: 93%;
            }

            .medperf-header {
                flex-direction: column;
            }
        }

        `;


        document.head.appendChild(style);
    }


    /* ======================================================================
       BOTÃO NO INDEX
       ====================================================================== */

    function inserirBotaoSidebar() {

        if (
            document.getElementById(
                "medsim-btn-estatisticas"
            )
        ) {
            return;
        }


        const nav =
            document.querySelector(".nav-menu");

        if (!nav) {

            console.warn(
                "[MedSim Estatísticas] .nav-menu não encontrado."
            );

            return;
        }


        const botao =
            document.createElement("button");

        botao.id =
            "medsim-btn-estatisticas";

        botao.className =
            "nav-item";

        botao.innerHTML =
            `<i class="ph-duotone ph-chart-line-up"></i>
             Desempenho & Estatísticas`;

        botao.addEventListener(
            "click",
            abrirPainel
        );


        const calendario =
            Array.from(
                nav.querySelectorAll(".nav-item")
            ).find(el =>
                el.textContent
                    .toLowerCase()
                    .includes("calend")
            );


        if (calendario) {

            calendario.insertAdjacentElement(
                "afterend",
                botao
            );

        } else {

            nav.appendChild(botao);
        }
    }


    /* ======================================================================
       ESTRUTURA DO PAINEL
       ====================================================================== */

    function criarPainel() {

        if (
            document.getElementById(
                "medsim-performance-overlay"
            )
        ) {
            return;
        }


        const overlay =
            document.createElement("div");

        overlay.id =
            "medsim-performance-overlay";


        overlay.innerHTML = `

        <div class="medperf-shell">

            <header class="medperf-header">

                <div>

                    <span class="medperf-badge">
                        MedSim Analytics
                    </span>

                    <h1>
                        Desempenho & Estatísticas
                    </h1>

                    <p>
                        Acompanhe sua evolução nos simulados e identifique
                        quais matérias precisam de maior atenção.
                    </p>

                </div>


                <div class="medperf-actions">

                    <button
                        class="medperf-btn"
                        id="medperf-exportar">
                        Exportar CSV
                    </button>

                    <button
                        class="medperf-btn"
                        id="medperf-atualizar">
                        Atualizar
                    </button>

                    <button
                        class="medperf-btn primary"
                        id="medperf-fechar">
                        Voltar
                    </button>

                </div>

            </header>


            <div id="medperf-warning"></div>


            <div class="medperf-controls">

                <div class="medperf-control">

                    <label>
                        Matéria
                    </label>

                    <select id="medperf-filtro-materia">

                        <option value="TODAS">
                            Todas as matérias
                        </option>

                    </select>

                </div>


                <div class="medperf-control">

                    <label>
                        Meta de desempenho
                    </label>

                    <input
                        id="medperf-meta"
                        type="number"
                        min="1"
                        max="100"
                        value="${meta}">
                </div>


                <button
                    class="medperf-btn"
                    id="medperf-salvar-meta">
                    Salvar meta
                </button>

            </div>


            <div id="medperf-conteudo"></div>

        </div>
        `;


        document.body.appendChild(overlay);


        document
            .getElementById("medperf-fechar")
            .addEventListener(
                "click",
                fecharPainel
            );


        document
            .getElementById("medperf-atualizar")
            .addEventListener(
                "click",
                atualizarPainel
            );


        document
            .getElementById("medperf-exportar")
            .addEventListener(
                "click",
                exportarCSV
            );


        document
            .getElementById(
                "medperf-salvar-meta"
            )
            .addEventListener(
                "click",
                salvarMeta
            );


        document
            .getElementById(
                "medperf-filtro-materia"
            )
            .addEventListener(
                "change",
                function () {

                    filtroMateria =
                        this.value;

                    renderizar();
                }
            );
    }


    /* ======================================================================
       ABERTURA / FECHAMENTO
       ====================================================================== */

    function abrirPainel() {

        atualizarPainel();

        document
            .getElementById(
                "medsim-performance-overlay"
            )
            .classList
            .add("active");

        document.body.style.overflow =
            "hidden";
    }


    function fecharPainel() {

        document
            .getElementById(
                "medsim-performance-overlay"
            )
            .classList
            .remove("active");

        document.body.style.overflow =
            "";
    }


    /* ======================================================================
       FILTROS
       ====================================================================== */

    function preencherFiltroMaterias() {

        const select =
            document.getElementById(
                "medperf-filtro-materia"
            );

        if (!select) {
            return;
        }


        const materias =
            [
                ...new Set(
                    dadosAtuais.map(
                        item => item.materia
                    )
                )
            ]
                .sort();


        select.innerHTML =
            `<option value="TODAS">
                Todas as matérias
             </option>`;


        materias.forEach(materia => {

            const option =
                document.createElement("option");

            option.value =
                materia;

            option.textContent =
                materia;

            select.appendChild(
                option
            );
        });


        if (
            materias.includes(
                filtroMateria
            )
        ) {

            select.value =
                filtroMateria;

        } else {

            filtroMateria =
                "TODAS";

            select.value =
                "TODAS";
        }
    }


    function obterDadosFiltrados() {

        if (
            filtroMateria ===
            "TODAS"
        ) {

            return [...dadosAtuais];
        }

        return dadosAtuais.filter(
            item =>
                item.materia ===
                filtroMateria
        );
    }


    /* ======================================================================
       META
       ====================================================================== */

    function salvarMeta() {

        const input =
            document.getElementById(
                "medperf-meta"
            );

        const novaMeta =
            limitar(
                Number(input.value),
                1,
                100
            );

        meta =
            novaMeta;

        input.value =
            novaMeta;

        localStorage.setItem(
            CONFIG.chaveMeta,
            String(meta)
        );

        renderizar();
    }


    /* ======================================================================
       ATUALIZAÇÃO
       ====================================================================== */

    function atualizarPainel() {

        dadosAtuais =
            coletarHistoricos();

        preencherFiltroMaterias();

        renderizar();
    }


    /* ======================================================================
       ESTATÍSTICAS
       ====================================================================== */

    function calcularStats(dados) {

        const percentuais =
            dados.map(
                item => item.pct
            );


        const mediaGeral =
            media(percentuais);


        const melhor =
            percentuais.length
                ? Math.max(...percentuais)
                : 0;


        const atingiramMeta =
            dados.filter(
                item =>
                    item.pct >= meta
            ).length;


        const taxaMeta =
            dados.length
                ? atingiramMeta /
                    dados.length *
                    100
                : 0;


        const segundosTotal =
            dados.reduce(
                (soma, item) =>
                    soma +
                    item.segundos,
                0
            );


        return {

            total:
                dados.length,

            media:
                mediaGeral,

            melhor,

            atingiramMeta,

            taxaMeta,

            segundosTotal
        };
    }


    function agruparPorMateria(dados) {

        const grupos = {};

        dados.forEach(item => {

            if (!grupos[item.materia]) {

                grupos[item.materia] =
                    [];
            }

            grupos[item.materia]
                .push(item);
        });


        return Object.entries(grupos)
            .map(
                ([materia, tentativas]) => {

                    const valores =
                        tentativas.map(
                            item => item.pct
                        );


                    return {

                        materia,

                        tentativas:
                            tentativas.length,

                        media:
                            media(valores),

                        melhor:
                            Math.max(...valores),

                        meta:
                            tentativas.filter(
                                item =>
                                    item.pct >=
                                    meta
                            ).length
                    };
                }
            )
            .sort(
                (a, b) =>
                    b.media -
                    a.media
            );
    }


    /* ======================================================================
       INSIGHTS
       ====================================================================== */

    function gerarInsights(dados) {

        const grupos =
            agruparPorMateria(dados);


        if (!dados.length) {

            return [];
        }


        const insights = [];


        if (dados.length >= 4) {

            const recentes =
                dados
                    .slice(0, 3)
                    .map(x => x.pct);


            const anteriores =
                dados
                    .slice(3, 6)
                    .map(x => x.pct);


            if (anteriores.length) {

                const diferenca =
                    media(recentes) -
                    media(anteriores);


                let texto;

                if (diferenca > 3) {

                    texto =
                        `Sua média recente subiu aproximadamente ${arredondar(diferenca)} pontos percentuais.`;

                } else if (diferenca < -3) {

                    texto =
                        `Sua média recente caiu aproximadamente ${Math.abs(arredondar(diferenca))} pontos percentuais.`;

                } else {

                    texto =
                        "Seu desempenho recente está relativamente estável.";
                }


                insights.push({
                    titulo:
                        "Tendência recente",

                    texto
                });
            }
        }


        if (grupos.length) {

            const melhor =
                grupos[0];

            insights.push({

                titulo:
                    "Melhor desempenho",

                texto:
                    `${melhor.materia} apresenta média de ${formatarPercentual(melhor.media)}.`
            });


            const abaixoMeta =
                [...grupos]
                    .filter(
                        item =>
                            item.media <
                            meta
                    )
                    .sort(
                        (a, b) =>
                            a.media -
                            b.media
                    );


            if (abaixoMeta.length) {

                const prioridade =
                    abaixoMeta[0];

                insights.push({

                    titulo:
                        "Prioridade de revisão",

                    texto:
                        `${prioridade.materia} apresenta média de ${formatarPercentual(prioridade.media)}, abaixo da meta de ${meta}%.`
                });

            } else {

                insights.push({

                    titulo:
                        "Meta por matéria",

                    texto:
                        `Todas as matérias com histórico registrado apresentam média igual ou superior a ${meta}%.`
                });
            }
        }


        const valores =
            dados.map(
                x => x.pct
            );


        if (valores.length >= 2) {

            const med =
                media(valores);


            const variancia =
                media(
                    valores.map(
                        valor =>
                            Math.pow(
                                valor - med,
                                2
                            )
                    )
                );


            const desvio =
                Math.sqrt(
                    variancia
                );


            let descricao;

            if (desvio <= 8) {

                descricao =
                    "Seu desempenho está bastante consistente entre as tentativas.";

            } else if (desvio <= 15) {

                descricao =
                    "Há uma variação moderada entre seus resultados.";

            } else {

                descricao =
                    "Há grande variação entre seus resultados; vale observar as matérias com notas mais baixas.";
            }


            insights.push({

                titulo:
                    "Consistência",

                texto:
                    descricao
            });
        }


        return insights;
    }


    /* ======================================================================
       RENDERIZAÇÃO PRINCIPAL
       ====================================================================== */

    function renderizar() {

        const container =
            document.getElementById(
                "medperf-conteudo"
            );

        if (!container) {
            return;
        }


        const dados =
            obterDadosFiltrados();


        const aviso =
            document.getElementById(
                "medperf-warning"
            );


        const existeCompartilhado =
            dadosAtuais.some(
                item =>
                    item.materia ===
                    "Micro/Imuno 2024"
            );


        aviso.innerHTML =
            existeCompartilhado
                ? `
                <div class="medperf-warning">
                    <strong>Atenção:</strong>
                    foi detectado um histórico com chave compartilhada
                    relacionado aos arquivos de 2024.
                    Para evitar atribuir resultados incorretamente,
                    ele aparece como
                    <strong>Micro/Imuno 2024</strong>.
                </div>
                `
                : "";


        if (!dados.length) {

            container.innerHTML = `

                <div class="medperf-card medperf-empty">

                    <h2>
                        Ainda não há resultados registrados
                    </h2>

                    <p>
                        Termine um simulado para que seus
                        dados apareçam automaticamente aqui.
                    </p>

                </div>
            `;

            return;
        }


        const stats =
            calcularStats(dados);

        const concluidos =
            obterConcluidos();

        const insights =
            gerarInsights(dados);


        container.innerHTML = `

            <section class="medperf-kpis">

                ${criarKPI(
                    "Média geral",
                    formatarPercentual(stats.media),
                    `Meta atual: ${meta}%`
                )}

                ${criarKPI(
                    "Tentativas",
                    stats.total,
                    "Resultados registrados"
                )}

                ${criarKPI(
                    "Melhor resultado",
                    formatarPercentual(stats.melhor),
                    "Maior nota registrada"
                )}

                ${criarKPI(
                    "Meta atingida",
                    formatarPercentual(stats.taxaMeta),
                    `${stats.atingiramMeta} tentativa(s) ≥ ${meta}%`
                )}

                ${criarKPI(
                    "Tempo registrado",
                    formatarTempoTotal(stats.segundosTotal),
                    "Tempo acumulado nos simulados"
                )}

                ${criarKPI(
                    "Concluídos",
                    concluidos.length,
                    "Simulados marcados como concluídos"
                )}

            </section>


            <section class="medperf-grid">

                <div class="medperf-card">

                    <h3 class="medperf-section-title">
                        Evolução do desempenho
                    </h3>

                    <div class="medperf-chart">
                        <canvas id="medperf-chart-evolucao"></canvas>
                    </div>

                </div>


                <div class="medperf-card">

                    <h3 class="medperf-section-title">
                        Média por matéria
                    </h3>

                    <div class="medperf-chart">
                        <canvas id="medperf-chart-materias"></canvas>
                    </div>

                </div>


                <div class="medperf-card">

                    <h3 class="medperf-section-title">
                        Distribuição dos resultados
                    </h3>

                    <div class="medperf-chart">
                        <canvas id="medperf-chart-distribuicao"></canvas>
                    </div>

                </div>


                <div class="medperf-card">

                    <h3 class="medperf-section-title">
                        Análise rápida
                    </h3>

                    <div class="medperf-insights">

                        ${
                            insights
                                .map(
                                    item => `
                                <div class="medperf-insight">

                                    <div class="medperf-insight-title">
                                        ${escapeHtml(item.titulo)}
                                    </div>

                                    <div class="medperf-insight-text">
                                        ${escapeHtml(item.texto)}
                                    </div>

                                </div>
                                `
                                )
                                .join("")
                        }

                    </div>

                </div>

            </section>


            ${renderizarTabelaMaterias(dados)}

            ${renderizarTentativasRecentes(dados)}
        `;


        setTimeout(
            () => {

                desenharGraficoEvolucao(
                    dados
                );

                desenharGraficoMaterias(
                    dados
                );

                desenharDistribuicao(
                    dados
                );

            },
            20
        );
    }


    function criarKPI(
        titulo,
        valor,
        subtitulo
    ) {

        return `

        <div class="medperf-card">

            <div class="medperf-kpi-label">
                ${escapeHtml(titulo)}
            </div>

            <div class="medperf-kpi-value">
                ${escapeHtml(valor)}
            </div>

            <div class="medperf-kpi-sub">
                ${escapeHtml(subtitulo)}
            </div>

        </div>
        `;
    }


    /* ======================================================================
       TABELA POR MATÉRIA
       ====================================================================== */

    function renderizarTabelaMaterias(dados) {

        const grupos =
            agruparPorMateria(dados);


        return `

        <section
            class="medperf-card"
            style="margin-bottom:20px">

            <h3 class="medperf-section-title">
                Estatísticas por matéria
            </h3>

            <div class="medperf-table-wrap">

                <table class="medperf-table">

                    <thead>

                        <tr>

                            <th>
                                Matéria
                            </th>

                            <th>
                                Tentativas
                            </th>

                            <th>
                                Média
                            </th>

                            <th>
                                Melhor
                            </th>

                            <th>
                                ≥ ${meta}%
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            grupos
                                .map(
                                    grupo => `

                            <tr>

                                <td>
                                    <strong>
                                        ${escapeHtml(grupo.materia)}
                                    </strong>
                                </td>

                                <td>
                                    ${grupo.tentativas}
                                </td>

                                <td class="medperf-score">
                                    ${formatarPercentual(grupo.media)}
                                </td>

                                <td>
                                    ${formatarPercentual(grupo.melhor)}
                                </td>

                                <td>
                                    ${grupo.meta}
                                </td>

                            </tr>
                        `
                                )
                                .join("")
                        }

                    </tbody>

                </table>

            </div>

        </section>
        `;
    }


    /* ======================================================================
       TENTATIVAS RECENTES
       ====================================================================== */

    function renderizarTentativasRecentes(dados) {

        const recentes =
            dados.slice(0, 10);


        return `

        <section class="medperf-card">

            <h3 class="medperf-section-title">
                Tentativas recentes
            </h3>

            <div class="medperf-table-wrap">

                <table class="medperf-table">

                    <thead>

                        <tr>

                            <th>
                                Simulado
                            </th>

                            <th>
                                Matéria
                            </th>

                            <th>
                                Data
                            </th>

                            <th>
                                Resultado
                            </th>

                            <th>
                                Pontos
                            </th>

                            <th>
                                Tempo
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            recentes
                                .map(
                                    item => `

                            <tr>

                                <td>
                                    ${escapeHtml(item.edicao)}
                                </td>

                                <td>
                                    ${escapeHtml(item.materia)}
                                </td>

                                <td>
                                    ${escapeHtml(item.data)}
                                </td>

                                <td class="medperf-score">
                                    ${formatarPercentual(item.pct)}
                                </td>

                                <td>
                                    ${escapeHtml(item.pontos)}
                                </td>

                                <td>
                                    ${escapeHtml(item.tempo)}
                                </td>

                            </tr>
                        `
                                )
                                .join("")
                        }

                    </tbody>

                </table>

            </div>

        </section>
        `;
    }


    /* ======================================================================
       CANVAS
       ====================================================================== */

    function prepararCanvas(id) {

        const canvas =
            document.getElementById(id);

        if (!canvas) {
            return null;
        }


        const rect =
            canvas.getBoundingClientRect();

        const dpr =
            window.devicePixelRatio || 1;


        canvas.width =
            rect.width * dpr;

        canvas.height =
            rect.height * dpr;


        const ctx =
            canvas.getContext("2d");

        ctx.scale(dpr, dpr);


        return {

            canvas,

            ctx,

            width:
                rect.width,

            height:
                rect.height
        };
    }


    function cssVar(nome, fallback) {

        const valor =
            getComputedStyle(
                document.body
            )
                .getPropertyValue(nome)
                .trim();

        return valor || fallback;
    }


    function coresGrafico() {

        return {

            texto:
                cssVar(
                    "--text-muted",
                    "#64748b"
                ),

            principal:
                cssVar(
                    "--purple-primary",
                    "#3b82f6"
                ),

            verde:
                cssVar(
                    "--green-primary",
                    "#10b981"
                ),

            vermelho:
                cssVar(
                    "--incorrect-red",
                    "#ef4444"
                ),

            amarelo:
                cssVar(
                    "--accent-yellow",
                    "#d97706"
                ),

            borda:
                cssVar(
                    "--border-color",
                    "#e2e8f0"
                )
        };
    }


    function desenharGrade(
        ctx,
        width,
        height,
        padding
    ) {

        const cores =
            coresGrafico();

        ctx.strokeStyle =
            cores.borda;

        ctx.lineWidth =
            1;


        for (let i = 0; i <= 4; i++) {

            const y =
                padding.top +
                (
                    (
                        height -
                        padding.top -
                        padding.bottom
                    ) / 4
                ) * i;


            ctx.beginPath();

            ctx.moveTo(
                padding.left,
                y
            );

            ctx.lineTo(
                width -
                padding.right,
                y
            );

            ctx.stroke();
        }
    }


    /* ======================================================================
       GRÁFICO EVOLUÇÃO
       ====================================================================== */

    function desenharGraficoEvolucao(dados) {

        const preparado =
            prepararCanvas(
                "medperf-chart-evolucao"
            );

        if (!preparado) {
            return;
        }


        const {
            ctx,
            width,
            height
        } = preparado;


        const cores =
            coresGrafico();


        const padding = {
            top: 20,
            right: 20,
            bottom: 35,
            left: 42
        };


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        desenharGrade(
            ctx,
            width,
            height,
            padding
        );


        const lista =
            dados
                .slice(0, 15)
                .reverse();


        if (!lista.length) {
            return;
        }


        const areaW =
            width -
            padding.left -
            padding.right;


        const areaH =
            height -
            padding.top -
            padding.bottom;


        function yValor(valor) {

            return
                padding.top +
                areaH -
                (
                    limitar(
                        valor,
                        0,
                        100
                    ) /
                    100
                ) *
                areaH;
        }


        const metaY =
            yValor(meta);


        ctx.strokeStyle =
            cores.amarelo;

        ctx.setLineDash(
            [6, 6]
        );

        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            metaY
        );

        ctx.lineTo(
            width -
            padding.right,
            metaY
        );

        ctx.stroke();

        ctx.setLineDash([]);


        ctx.strokeStyle =
            cores.principal;

        ctx.lineWidth =
            3;

        ctx.beginPath();


        lista.forEach(
            (item, indice) => {

                const x =
                    padding.left +
                    (
                        lista.length === 1
                            ? areaW / 2
                            : indice /
                                (
                                    lista.length -
                                    1
                                ) *
                                areaW
                    );


                const y =
                    yValor(
                        item.pct
                    );


                if (indice === 0) {

                    ctx.moveTo(
                        x,
                        y
                    );

                } else {

                    ctx.lineTo(
                        x,
                        y
                    );
                }
            }
        );


        ctx.stroke();


        lista.forEach(
            (item, indice) => {

                const x =
                    padding.left +
                    (
                        lista.length === 1
                            ? areaW / 2
                            : indice /
                                (
                                    lista.length -
                                    1
                                ) *
                                areaW
                    );


                const y =
                    yValor(
                        item.pct
                    );


                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    4,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    item.pct >= meta
                        ? cores.verde
                        : cores.vermelho;

                ctx.fill();
            }
        );


        ctx.fillStyle =
            cores.texto;

        ctx.font =
            "11px sans-serif";


        [0, 25, 50, 75, 100]
            .forEach(valor => {

                ctx.fillText(
                    `${valor}%`,
                    4,
                    yValor(valor) + 4
                );
            });


        ctx.fillStyle =
            cores.amarelo;

        ctx.fillText(
            `Meta ${meta}%`,
            width - 70,
            metaY - 6
        );
    }


    /* ======================================================================
       GRÁFICO MATÉRIAS
       ====================================================================== */

    function desenharGraficoMaterias(dados) {

        const preparado =
            prepararCanvas(
                "medperf-chart-materias"
            );

        if (!preparado) {
            return;
        }


        const {
            ctx,
            width,
            height
        } = preparado;


        const grupos =
            agruparPorMateria(dados);


        if (!grupos.length) {
            return;
        }


        const cores =
            coresGrafico();


        const padding = {
            top: 15,
            right: 30,
            bottom: 15,
            left: 120
        };


        const areaW =
            width -
            padding.left -
            padding.right;


        const alturaLinha =
            (
                height -
                padding.top -
                padding.bottom
            ) /
            grupos.length;


        grupos.forEach(
            (grupo, indice) => {

                const y =
                    padding.top +
                    indice *
                    alturaLinha;


                const barH =
                    Math.min(
                        24,
                        alturaLinha * .55
                    );


                ctx.fillStyle =
                    cores.borda;

                ctx.fillRect(
                    padding.left,
                    y +
                        (
                            alturaLinha -
                            barH
                        ) / 2,
                    areaW,
                    barH
                );


                ctx.fillStyle =
                    grupo.media >= meta
                        ? cores.verde
                        : cores.principal;


                ctx.fillRect(
                    padding.left,
                    y +
                        (
                            alturaLinha -
                            barH
                        ) / 2,
                    areaW *
                        grupo.media /
                        100,
                    barH
                );


                ctx.fillStyle =
                    cores.texto;

                ctx.font =
                    "11px sans-serif";

                ctx.textAlign =
                    "right";


                let nome =
                    grupo.materia;

                if (nome.length > 16) {

                    nome =
                        nome.slice(
                            0,
                            14
                        ) + "…";
                }


                ctx.fillText(
                    nome,
                    padding.left - 8,
                    y +
                        alturaLinha / 2 +
                        4
                );


                ctx.textAlign =
                    "left";

                ctx.fillText(
                    `${arredondar(grupo.media)}%`,
                    padding.left +
                        areaW *
                            grupo.media /
                            100 +
                        6,
                    y +
                        alturaLinha / 2 +
                        4
                );
            }
        );


        ctx.textAlign =
            "left";
    }


    /* ======================================================================
       DISTRIBUIÇÃO
       ====================================================================== */

    function desenharDistribuicao(dados) {

        const preparado =
            prepararCanvas(
                "medperf-chart-distribuicao"
            );

        if (!preparado) {
            return;
        }


        const {
            ctx,
            width,
            height
        } = preparado;


        const cores =
            coresGrafico();


        const categorias = [

            {
                nome:
                    "< 50%",

                valor:
                    dados.filter(
                        item =>
                            item.pct < 50
                    ).length,

                cor:
                    cores.vermelho
            },

            {
                nome:
                    `50–${meta - 1}%`,

                valor:
                    dados.filter(
                        item =>
                            item.pct >= 50 &&
                            item.pct < meta
                    ).length,

                cor:
                    cores.amarelo
            },

            {
                nome:
                    `≥ ${meta}%`,

                valor:
                    dados.filter(
                        item =>
                            item.pct >= meta
                    ).length,

                cor:
                    cores.verde
            }

        ];


        const max =
            Math.max(
                ...categorias.map(
                    x => x.valor
                ),
                1
            );


        const padding = {
            top: 25,
            right: 30,
            bottom: 55,
            left: 35
        };


        const areaW =
            width -
            padding.left -
            padding.right;


        const areaH =
            height -
            padding.top -
            padding.bottom;


        const larguraGrupo =
            areaW /
            categorias.length;


        categorias.forEach(
            (cat, indice) => {

                const larguraBarra =
                    Math.min(
                        70,
                        larguraGrupo * .55
                    );


                const altura =
                    cat.valor /
                    max *
                    areaH;


                const x =
                    padding.left +
                    indice *
                    larguraGrupo +
                    (
                        larguraGrupo -
                        larguraBarra
                    ) /
                    2;


                const y =
                    padding.top +
                    areaH -
                    altura;


                ctx.fillStyle =
                    cat.cor;

                ctx.fillRect(
                    x,
                    y,
                    larguraBarra,
                    altura
                );


                ctx.fillStyle =
                    cores.texto;

                ctx.font =
                    "12px sans-serif";

                ctx.textAlign =
                    "center";


                ctx.fillText(
                    String(cat.valor),
                    x +
                        larguraBarra /
                        2,
                    Math.max(
                        y - 8,
                        12
                    )
                );


                ctx.fillText(
                    cat.nome,
                    x +
                        larguraBarra /
                        2,
                    height - 20
                );
            }
        );


        ctx.textAlign =
            "left";
    }


    /* ======================================================================
       EXPORTAÇÃO CSV
       ====================================================================== */

    function exportarCSV() {

        const dados =
            obterDadosFiltrados();


        if (!dados.length) {

            alert(
                "Não há resultados para exportar."
            );

            return;
        }


        const linhas = [

            [
                "Matéria",
                "Simulado",
                "Data",
                "Percentual",
                "Pontos",
                "Tempo",
                "Origem localStorage"
            ]

        ];


        dados.forEach(
            item => {

                linhas.push([

                    item.materia,
                    item.edicao,
                    item.data,
                    item.pct,
                    item.pontos,
                    item.tempo,
                    item.origem

                ]);
            }
        );


        const csv =
            linhas
                .map(
                    linha =>
                        linha
                            .map(
                                valor =>
                                    `"${String(valor)
                                        .replace(
                                            /"/g,
                                            '""'
                                        )}"`
                            )
                            .join(";")
                )
                .join("\n");


        const blob =
            new Blob(
                [
                    "\uFEFF",
                    csv
                ],
                {
                    type:
                        "text/csv;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");

        link.href =
            url;

        link.download =
            "medsim-desempenho.csv";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );
    }


    /* ======================================================================
       ATUALIZAÇÃO AUTOMÁTICA
       ====================================================================== */

    /*
       Os simulados já utilizam postMessage
       ao finalizar uma avaliação.

       Portanto podemos aproveitar o mesmo evento
       sem modificar os arquivos individuais.
    */

    window.addEventListener(
        "message",
        function (event) {

            if (
                event.data ===
                "simulados_concluido" ||

                (
                    event.data &&
                    event.data.type ===
                    "simulados_concluido"
                )
            ) {

                setTimeout(
                    atualizarPainel,
                    250
                );
            }
        }
    );


    /*
       Atualiza também caso o localStorage
       seja modificado por outra aba.
    */

    window.addEventListener(
        "storage",
        function (event) {

            if (
                event.key &&
                (
                    event.key.includes(
                        "_history"
                    ) ||
                    event.key ===
                        "simulados_concluidos"
                )
            ) {

                atualizarPainel();
            }
        }
    );


    /*
       Redesenha os gráficos ao redimensionar
       a janela.
    */

    let resizeTimer;

    window.addEventListener(
        "resize",
        function () {

            clearTimeout(
                resizeTimer
            );

            resizeTimer =
                setTimeout(
                    function () {

                        const overlay =
                            document.getElementById(
                                "medsim-performance-overlay"
                            );

                        if (
                            overlay &&
                            overlay.classList.contains(
                                "active"
                            )
                        ) {

                            renderizar();
                        }

                    },
                    200
                );
        }
    );


    /* ======================================================================
       INICIALIZAÇÃO
       ====================================================================== */

    function iniciar() {

        inserirCSS();

        criarPainel();

        inserirBotaoSidebar();

        dadosAtuais =
            coletarHistoricos();

        preencherFiltroMaterias();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    } else {

        iniciar();
    }


    /* ======================================================================
       API OPCIONAL
       ====================================================================== */

    window.MedSimEstatisticas = {

        abrir:
            abrirPainel,

        fechar:
            fecharPainel,

        atualizar:
            atualizarPainel,

        obterDados:
            function () {
                return coletarHistoricos();
            }

    };

})();
