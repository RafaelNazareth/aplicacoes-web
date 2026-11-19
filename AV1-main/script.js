const PARTIDO = { nome: "PMauricio", numero: "94" };

const limitesPorCargo = {
    "Presidente": 1,
    "Governador(a)": 1,
    "Senador(a)": 2,
    "Deputado(a) Federal": Number.POSITIVE_INFINITY,
    "Deputado(a) Estadual": Number.POSITIVE_INFINITY
};

const digitosPorCargo = {
    "Presidente": 2,
    "Governador(a)": 2,
    "Senador(a)": 3,
    "Deputado(a) Federal": 4,
    "Deputado(a) Estadual": 5
};

const candidatos = [];
const registroCandidaturas = [];
let candidatoSelecionadoId = null;
let toastTimer = null;
const el = {};

window.addEventListener("DOMContentLoaded", iniciar);

function iniciar() {
    mapearElementos();
    vincularEventos();
    atualizarDashboard();
    renderizarRegistros();
    atualizarWorkflow();
    carregarCandidatos();
}

function mapearElementos() {
    el.statusCarregamento = document.getElementById("statusCarregamento");
    el.appbarStatus = el.statusCarregamento.closest(".appbar__status");
    el.statFiliados = document.getElementById("statFiliados");
    el.statCandidaturas = document.getElementById("statCandidaturas");
    el.statCargosPreenchidos = document.getElementById("statCargosPreenchidos");
    el.stepFiliado = document.getElementById("stepFiliado");
    el.stepCandidatura = document.getElementById("stepCandidatura");
    el.stepChapa = document.getElementById("stepChapa");
    el.sidebarFiliados = document.getElementById("sidebarFiliados");

    el.buscaFiliado = document.getElementById("buscaFiliado");
    el.listaFiliados = document.getElementById("listaFiliados");
    el.estadoVazioBusca = document.getElementById("estadoVazioBusca");

    el.editorVazio = document.getElementById("editorVazio");
    el.formCandidatura = document.getElementById("formCandidatura");
    el.infoFoto = document.getElementById("infoFoto");
    el.infoNome = document.getElementById("infoNome");
    el.btnTrocarFiliado = document.getElementById("btnTrocarFiliado");
    el.lstCargos = document.getElementById("lstCargos");
    el.hintCargo = document.getElementById("hintCargo");
    el.txtNumeroCandidato = document.getElementById("txtNumeroCandidato");
    el.numeroLength = document.getElementById("numeroLength");
    el.msgErroNumero = document.getElementById("msgErroNumero");
    el.infoCargo = document.getElementById("infoCargo");
    el.infoNumero = document.getElementById("infoNumero");
    el.btnRegistrar = document.getElementById("btnRegistrar");
    el.btnLimparSelecao = document.getElementById("btnLimparSelecao");
    el.msgFeedbackAcao = document.getElementById("msgFeedbackAcao");

    el.listaRegistrados = document.getElementById("listaRegistrados");
    el.contadorRegistros = document.getElementById("contadorRegistros");
    el.quotaPresidente = document.getElementById("quotaPresidente");
    el.quotaGovernador = document.getElementById("quotaGovernador");
    el.quotaSenador = document.getElementById("quotaSenador");
    el.quotaDepFederal = document.getElementById("quotaDepFederal");
    el.quotaDepEstadual = document.getElementById("quotaDepEstadual");
    el.btnEnviarTSE = document.getElementById("btnEnviarTSE");
    el.msgFeedbackEnvio = document.getElementById("msgFeedbackEnvio");
    el.toast = document.getElementById("toast");
}

function vincularEventos() {
    el.buscaFiliado.addEventListener("input", renderizarFiliados);
    el.lstCargos.addEventListener("change", aoAlterarCargo);
    el.txtNumeroCandidato.addEventListener("input", aoDigitarNumero);
    el.formCandidatura.addEventListener("submit", registrarCandidatura);
    el.btnTrocarFiliado.addEventListener("click", limparSelecao);
    el.btnLimparSelecao.addEventListener("click", limparSelecao);
    el.btnEnviarTSE.addEventListener("click", gerarArquivoFinal);
}

async function carregarCandidatos() {
    atualizarStatus("Carregando filiados...", "loading");

    try {
        const resposta = await fetch("candidatos.json", { cache: "no-store" });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        const dados = await resposta.json();
        const lista = dados[PARTIDO.nome];
        if (!Array.isArray(lista)) throw new Error("Partido não encontrado no arquivo de candidatos.");

        candidatos.length = 0;
        lista.forEach((filiado, index) => {
            candidatos.push({ id: index + 1, nome: filiado.nome, foto: filiado.foto });
        });

        renderizarFiliados();
        atualizarDashboard();
        atualizarStatus("Dados atualizados", "ready");
    } catch (erro) {
        atualizarStatus("Falha ao carregar dados", "error");
        mostrarToast("Não foi possível carregar os filiados. Execute o projeto por um servidor local.", "error");
        console.error(erro);
    }
}

function renderizarFiliados() {
    const termo = normalizarTexto(el.buscaFiliado.value.trim());
    const listaFiltrada = candidatos.filter((candidato) => normalizarTexto(candidato.nome).includes(termo));

    el.listaFiliados.innerHTML = "";
    el.estadoVazioBusca.hidden = listaFiltrada.length > 0 || candidatos.length === 0;

    listaFiltrada.forEach((candidato) => {
        const registro = registroCandidaturas.find((item) => item.nome === candidato.nome);
        const selecionado = candidato.id === candidatoSelecionadoId;

        const button = document.createElement("button");
        button.type = "button";
        button.className = `roster-card${selecionado ? " is-selected" : ""}${registro ? " is-registered" : ""}`;
        button.setAttribute("role", "listitem");
        button.setAttribute("aria-pressed", String(selecionado));
        button.setAttribute("aria-label", registro ? `${candidato.nome}, candidatura já registrada` : `Selecionar ${candidato.nome}`);

        const photo = document.createElement("span");
        photo.className = "roster-card__photo";
        const img = document.createElement("img");
        img.alt = "";
        aplicarImagemSegura(img, candidato.foto, candidato.nome);
        photo.appendChild(img);

        const identity = document.createElement("span");
        identity.className = "roster-card__identity";
        const name = document.createElement("strong");
        name.textContent = candidato.nome;
        const status = document.createElement("span");
        status.textContent = registro ? `${registro.cargo} · ${registro.numero}` : "Disponível para registro";
        identity.append(name, status);

        const chevron = document.createElement("span");
        chevron.className = "roster-card__chevron";
        chevron.setAttribute("aria-hidden", "true");
        chevron.textContent = registro ? "✓" : "›";

        button.append(photo, identity, chevron);
        button.addEventListener("click", () => selecionarFiliado(candidato.id));
        el.listaFiliados.appendChild(button);
    });
}

function selecionarFiliado(id) {
    const candidato = candidatos.find((item) => item.id === id);
    if (!candidato) return;

    const registroExistente = registroCandidaturas.find((item) => item.nome === candidato.nome);
    if (registroExistente) {
        mostrarToast(`${candidato.nome} já está registrado(a) na chapa.`, "success");
        return;
    }

    candidatoSelecionadoId = id;
    el.editorVazio.hidden = true;
    el.formCandidatura.hidden = false;
    el.infoNome.textContent = candidato.nome;
    el.infoFoto.alt = `Foto de ${candidato.nome}`;
    aplicarImagemSegura(el.infoFoto, candidato.foto, candidato.nome);

    el.lstCargos.value = "";
    el.txtNumeroCandidato.value = "";
    el.txtNumeroCandidato.disabled = true;
    el.txtNumeroCandidato.readOnly = false;
    el.txtNumeroCandidato.placeholder = "Selecione um cargo";
    el.hintCargo.textContent = "";
    el.numeroLength.textContent = "";
    el.infoCargo.textContent = "A definir";
    el.infoNumero.textContent = "—";
    definirMensagemNumero("", "");
    definirFeedbackAcao("", "");
    atualizarEstadoBotaoRegistro();
    renderizarFiliados();
    atualizarWorkflow();

    if (window.innerWidth <= 960) {
        document.querySelector(".editor-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function limparSelecao() {
    candidatoSelecionadoId = null;
    el.formCandidatura.hidden = true;
    el.editorVazio.hidden = false;
    el.lstCargos.value = "";
    el.txtNumeroCandidato.value = "";
    definirMensagemNumero("", "");
    definirFeedbackAcao("", "");
    renderizarFiliados();
    atualizarWorkflow();
}

function aoAlterarCargo() {
    const cargo = el.lstCargos.value;
    el.infoCargo.textContent = cargo || "A definir";
    definirMensagemNumero("", "");

    if (!cargo) {
        el.txtNumeroCandidato.value = "";
        el.txtNumeroCandidato.disabled = true;
        el.txtNumeroCandidato.readOnly = false;
        el.txtNumeroCandidato.placeholder = "Selecione um cargo";
        el.hintCargo.textContent = "";
        el.numeroLength.textContent = "";
        el.infoNumero.textContent = "—";
        atualizarEstadoBotaoRegistro();
        return;
    }

    const tamanho = digitosPorCargo[cargo];
    const limite = limitesPorCargo[cargo];
    const ocupados = contarPorCargo(cargo);

    if (ocupados >= limite) {
        el.hintCargo.textContent = "Não há vaga disponível para este cargo.";
    } else {
        el.hintCargo.textContent = `${tamanho} dígitos · inicia com ${PARTIDO.numero}`;
    }

    el.txtNumeroCandidato.disabled = false;
    el.txtNumeroCandidato.maxLength = tamanho;

    if (cargo === "Presidente" || cargo === "Governador(a)") {
        el.txtNumeroCandidato.value = PARTIDO.numero;
        el.txtNumeroCandidato.readOnly = true;
    } else {
        el.txtNumeroCandidato.readOnly = false;
        el.txtNumeroCandidato.value = PARTIDO.numero;
    }

    el.txtNumeroCandidato.placeholder = formatoExemplo(cargo);
    atualizarNumeroVisual();
    validarNumeroNaInterface();

    if (!el.txtNumeroCandidato.readOnly) {
        el.txtNumeroCandidato.focus();
        el.txtNumeroCandidato.setSelectionRange(el.txtNumeroCandidato.value.length, el.txtNumeroCandidato.value.length);
    }
}

function aoDigitarNumero() {
    const cargo = el.lstCargos.value;
    const tamanho = digitosPorCargo[cargo] || 5;
    el.txtNumeroCandidato.value = somenteDigitos(el.txtNumeroCandidato.value).slice(0, tamanho);
    atualizarNumeroVisual();
    validarNumeroNaInterface();
}

function atualizarNumeroVisual() {
    const cargo = el.lstCargos.value;
    const numero = el.txtNumeroCandidato.value;
    const tamanho = digitosPorCargo[cargo];
    el.infoNumero.textContent = numero || "—";
    el.numeroLength.textContent = tamanho ? `${numero.length}/${tamanho}` : "";
}

function validarNumeroNaInterface() {
    const cargo = el.lstCargos.value;
    const numero = el.txtNumeroCandidato.value;

    if (!cargo || !numero) {
        definirMensagemNumero("", "");
        atualizarEstadoBotaoRegistro();
        return false;
    }

    const formato = validarNumeroCandidato(numero, cargo);
    if (!formato.valido) {
        definirMensagemNumero(formato.mensagem, "error");
        atualizarEstadoBotaoRegistro();
        return false;
    }

    const disponibilidade = validarDisponibilidadeNumero(numero, cargo);
    if (!disponibilidade.valido) {
        definirMensagemNumero(disponibilidade.mensagem, "error");
        atualizarEstadoBotaoRegistro();
        return false;
    }

    if (contarPorCargo(cargo) >= limitesPorCargo[cargo]) {
        definirMensagemNumero("Número indisponível.", "error");
        atualizarEstadoBotaoRegistro();
        return false;
    }

    definirMensagemNumero("Número disponível.", "success");
    atualizarEstadoBotaoRegistro();
    return true;
}

function validarNumeroCandidato(numero, cargo) {
    const tamanho = digitosPorCargo[cargo];
    if (!tamanho) return { valido: false, mensagem: "Selecione um cargo." };
    if (!numero.startsWith(PARTIDO.numero)) return { valido: false, mensagem: `O número deve iniciar com ${PARTIDO.numero}.` };
    if (numero.length !== tamanho) return { valido: false, mensagem: `Informe ${tamanho} dígitos.` };
    return { valido: true, mensagem: "Número disponível." };
}

function validarDisponibilidadeNumero(numero, cargo) {
    const conflito = registroCandidaturas.find((registro) =>
        registro.numero === numero && !repeticaoPermitidaEntreCargos(registro.cargo, cargo)
    );
    return conflito
        ? { valido: false, mensagem: "Número já escolhido por outro candidato." }
        : { valido: true, mensagem: "Número disponível." };
}

function repeticaoPermitidaEntreCargos(cargoExistente, novoCargo) {
    const executivos = new Set(["Presidente", "Governador(a)"]);
    return executivos.has(cargoExistente) && executivos.has(novoCargo);
}

function atualizarEstadoBotaoRegistro() {
    const candidato = obterCandidatoSelecionado();
    const cargo = el.lstCargos.value;
    const numero = el.txtNumeroCandidato.value;
    const candidatoLivre = candidato && !registroCandidaturas.some((item) => item.nome === candidato.nome);
    const cargoLivre = cargo && contarPorCargo(cargo) < limitesPorCargo[cargo];
    const formatoValido = candidatoLivre && cargo && numero && validarNumeroCandidato(numero, cargo).valido;
    const numeroLivre = formatoValido && validarDisponibilidadeNumero(numero, cargo).valido;
    el.btnRegistrar.disabled = !(candidatoLivre && cargoLivre && formatoValido && numeroLivre);
}

function registrarCandidatura(event) {
    event.preventDefault();
    definirFeedbackAcao("", "");

    const candidato = obterCandidatoSelecionado();
    const cargo = el.lstCargos.value;
    const numero = el.txtNumeroCandidato.value;

    if (!candidato || !cargo || !validarNumeroNaInterface()) return;
    if (registroCandidaturas.some((item) => item.nome === candidato.nome)) {
        definirFeedbackAcao("Candidato já registrado.", "error");
        return;
    }
    if (contarPorCargo(cargo) >= limitesPorCargo[cargo]) {
        definirFeedbackAcao("Cargo indisponível.", "error");
        return;
    }

    registroCandidaturas.push({
        nome: candidato.nome,
        numero,
        foto: candidato.foto,
        cargo
    });

    renderizarRegistros();
    atualizarDashboard();
    mostrarToast(`${candidato.nome} foi adicionado(a) à chapa.`, "success");
    limparSelecao();
}

function renderizarRegistros() {
    el.listaRegistrados.innerHTML = "";

    if (registroCandidaturas.length === 0) {
        const tr = document.createElement("tr");
        tr.className = "empty-row";
        tr.innerHTML = '<td colspan="4"><strong>A chapa ainda está vazia</strong>Selecione um filiado para iniciar o registro.</td>';
        el.listaRegistrados.appendChild(tr);
    } else {
        registroCandidaturas.forEach((registro, index) => {
            const tr = document.createElement("tr");

            const tdNome = document.createElement("td");
            const person = document.createElement("div");
            person.className = "table-person";
            const miniFoto = document.createElement("img");
            miniFoto.className = "table-avatar";
            miniFoto.alt = "";
            aplicarImagemSegura(miniFoto, registro.foto, registro.nome);
            const nome = document.createElement("span");
            nome.textContent = registro.nome;
            person.append(miniFoto, nome);
            tdNome.appendChild(person);
            tdNome.dataset.label = "Filiado";

            const tdCargo = document.createElement("td");
            tdCargo.textContent = registro.cargo;
            tdCargo.dataset.label = "Cargo";

            const tdNumero = document.createElement("td");
            const numero = document.createElement("span");
            numero.className = "number-pill";
            numero.textContent = registro.numero;
            tdNumero.appendChild(numero);
            tdNumero.dataset.label = "Número";

            const tdAcao = document.createElement("td");
            const remover = document.createElement("button");
            remover.type = "button";
            remover.className = "remove-button";
            remover.setAttribute("aria-label", `Remover ${registro.nome} da chapa`);
            remover.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"/></svg>';
            remover.addEventListener("click", () => removerCandidatura(index));
            tdAcao.appendChild(remover);

            tr.append(tdNome, tdCargo, tdNumero, tdAcao);
            el.listaRegistrados.appendChild(tr);
        });
    }

    const total = registroCandidaturas.length;
    el.contadorRegistros.textContent = `${total} registrado${total === 1 ? "" : "s"}`;
}

function removerCandidatura(index) {
    const [removido] = registroCandidaturas.splice(index, 1);
    renderizarRegistros();
    atualizarDashboard();
    renderizarFiliados();
    mostrarToast(`${removido.nome} foi removido(a) da chapa.`, "success");
}

function atualizarDashboard() {
    el.statFiliados.textContent = String(candidatos.length);
    el.sidebarFiliados.textContent = String(candidatos.length);
    el.statCandidaturas.textContent = String(registroCandidaturas.length);
    el.statCargosPreenchidos.textContent = String(new Set(registroCandidaturas.map((item) => item.cargo)).size);

    el.quotaPresidente.textContent = `${contarPorCargo("Presidente")}/1`;
    el.quotaGovernador.textContent = `${contarPorCargo("Governador(a)")}/1`;
    el.quotaSenador.textContent = `${contarPorCargo("Senador(a)")}/2`;
    el.quotaDepFederal.textContent = String(contarPorCargo("Deputado(a) Federal"));
    el.quotaDepEstadual.textContent = String(contarPorCargo("Deputado(a) Estadual"));
    atualizarEstadoBotaoRegistro();
    atualizarWorkflow();
}

function atualizarWorkflow() {
    const possuiSelecao = Boolean(obterCandidatoSelecionado());
    const possuiRegistros = registroCandidaturas.length > 0;
    el.stepFiliado.classList.toggle("is-active", !possuiSelecao && !possuiRegistros);
    el.stepCandidatura.classList.toggle("is-active", possuiSelecao);
    el.stepChapa.classList.toggle("is-active", !possuiSelecao && possuiRegistros);
}

function gerarArquivoFinal() {
    const dadosFinais = registroCandidaturas.map(({ nome, numero, foto, cargo }) => ({ nome, numero, foto, cargo }));
    const blob = new Blob([JSON.stringify(dadosFinais, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${PARTIDO.nome}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    definirFeedbackEnvio(`Arquivo ${PARTIDO.nome}.json gerado com sucesso.`, "success");
    mostrarToast("Arquivo da chapa gerado com sucesso.", "success");
}

function obterCandidatoSelecionado() {
    return candidatos.find((item) => item.id === candidatoSelecionadoId) || null;
}

function contarPorCargo(cargo) {
    return registroCandidaturas.filter((item) => item.cargo === cargo).length;
}

function formatoExemplo(cargo) {
    const tamanho = digitosPorCargo[cargo];
    return tamanho ? `${PARTIDO.numero}${"0".repeat(Math.max(0, tamanho - PARTIDO.numero.length))}` : PARTIDO.numero;
}

function somenteDigitos(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function normalizarTexto(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function atualizarStatus(texto, tipo) {
    el.statusCarregamento.textContent = texto;
    el.appbarStatus.classList.remove("is-ready", "is-error");
    if (tipo === "ready") el.appbarStatus.classList.add("is-ready");
    if (tipo === "error") el.appbarStatus.classList.add("is-error");
}

function definirMensagemNumero(texto, tipo) {
    el.msgErroNumero.textContent = texto;
    el.msgErroNumero.className = `field-message${tipo ? ` is-${tipo}` : ""}`;
}

function definirFeedbackAcao(texto, tipo) {
    el.msgFeedbackAcao.textContent = texto;
    el.msgFeedbackAcao.className = `form-feedback${tipo ? ` is-${tipo}` : ""}`;
}

function definirFeedbackEnvio(texto, tipo) {
    el.msgFeedbackEnvio.textContent = texto;
    el.msgFeedbackEnvio.className = `form-feedback export-feedback${tipo ? ` is-${tipo}` : ""}`;
}

function mostrarToast(texto, tipo = "success") {
    clearTimeout(toastTimer);
    el.toast.textContent = texto;
    el.toast.className = `toast is-${tipo}`;
    el.toast.hidden = false;
    toastTimer = setTimeout(() => {
        el.toast.hidden = true;
    }, 3200);
}

function aplicarImagemSegura(img, srcOriginal, nome) {
    const fallback = gerarAvatarSvg(nome);
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
        img.onerror = null;
        img.src = fallback;
    };
    img.src = srcOriginal || fallback;
}

function gerarAvatarSvg(nome) {
    const iniciais = String(nome).split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="28" fill="#eaf2f9"/><circle cx="120" cy="92" r="45" fill="#b8cadd"/><path d="M55 210c14-48 43-73 65-73s51 25 65 73" fill="#b8cadd"/><text x="120" y="226" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#0b2748">${iniciais}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
