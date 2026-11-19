// Guarda o card que foi clicado no momento
var cardAtualSelecionado = null;

// Missão 3: idade total da criança em meses (null enquanto não houver data de nascimento)
var idadeTotalMeses = null;

// --- PARTE 1: CÁLCULO AUTOMÁTICO DE IDADE (ANOS E MESES) ---
var campoNascimento = document.getElementById("dataNascimento");
var campoIdadeAnos = document.getElementById("idadeAnos");
var campoIdadeMeses = document.getElementById("idadeMeses");

campoNascimento.addEventListener("change", function () {
  var valorData = campoNascimento.value;

  if (valorData === "") {
    campoIdadeAnos.value = "";
    campoIdadeMeses.value = "";
    idadeTotalMeses = null;
    atualizarAtrasos();
    return;
  }

  var partes = valorData.split("-");
  var anoNasc = parseInt(partes[0], 10);
  var mesNasc = parseInt(partes[1], 10);
  var diaNasc = parseInt(partes[2], 10);

  var hoje = new Date();
  var anoHoje = hoje.getFullYear();
  var mesHoje = hoje.getMonth() + 1;
  var diaHoje = hoje.getDate();

  var anos = anoHoje - anoNasc;
  var meses = mesHoje - mesNasc;

  if (diaHoje < diaNasc) {
    meses = meses - 1;
  }

  if (meses < 0) {
    anos = anos - 1;
    meses = meses + 12;
  }

  if (anos < 0) {
    alert("De geboortedatum kan niet later zijn dan de datum van vandaag!");
    campoNascimento.value = "";
    campoIdadeAnos.value = "";
    campoIdadeMeses.value = "";
    idadeTotalMeses = null;
    atualizarAtrasos();
    return;
  }

  campoIdadeAnos.value = anos + " jaar";
  campoIdadeMeses.value = meses + (meses === 1 ? " maand" : " maanden");

  idadeTotalMeses = anos * 12 + meses;
  atualizarAtrasos();
});

// --- PARTE 2: FUNÇÕES DE VALIDAÇÃO DE BSN E CARTÃO SUS ---
function limparNumeros(texto) {
  var resultado = "";
  for (var i = 0; i < texto.length; i++) {
    var caractere = texto[i];
    if (caractere >= "0" && caractere <= "9") {
      resultado = resultado + caractere;
    }
  }
  return resultado;
}

// BSN (Burgerservicenummer) – número de identificação do cidadão holandês.
// Regra "11-proef" (teste do 11):
//  1) Deve ter 9 dígitos (BSN antigo de 8 dígitos recebe um 0 à esquerda).
//  2) Multiplica-se cada dígito pelos pesos 9, 8, 7, 6, 5, 4, 3, 2 e -1.
//  3) A soma dos produtos deve ser maior que 0 e divisível por 11.
// Ex.: 111222333 → 9+8+7+12+10+8+9+6-3 = 66 → 66 % 11 = 0 → válido.
function validarBSN(bsnTexto) {
  var bsn = limparNumeros(bsnTexto);
  if (bsn.length === 8) { bsn = '0' + bsn; }
  if (bsn.length !== 9) { return false; }

  var soma = 0;
  for (var i = 0; i < 8; i++) {
    soma = soma + parseInt(bsn[i], 10) * (9 - i);
  }
  soma = soma - parseInt(bsn[8], 10); // último dígito com peso -1

  return soma > 0 && soma % 11 === 0;
}

function validarCartaoSUS(susTexto) {
  var cns = limparNumeros(susTexto);

  if (cns.length !== 15) {
    return false;
  }

  var primeiroDigito = cns[0];
  if (
    primeiroDigito !== "1" &&
    primeiroDigito !== "2" &&
    primeiroDigito !== "7" &&
    primeiroDigito !== "8" &&
    primeiroDigito !== "9"
  ) {
    return false;
  }

  var soma = 0;
  for (var i = 0; i < 15; i++) {
    soma = soma + parseInt(cns[i], 10) * (15 - i);
  }

  return soma % 11 === 0;
}

// Bônus: valida o campo assim que o usuário sai dele (blur) e marca a borda
// em vermelho se o número for inválido. Ao digitar de novo, a marcação some.
function validarAoSair(idCampo, funcaoValidacao) {
  var campo = document.getElementById(idCampo);

  campo.addEventListener("blur", function () {
    if (campo.value !== "" && !funcaoValidacao(campo.value)) {
      campo.classList.add("campo-invalido");
    } else {
      campo.classList.remove("campo-invalido");
    }
  });

  campo.addEventListener("input", function () {
    campo.classList.remove("campo-invalido");
  });
}

validarAoSair("cpfCrianca", validarBSN);
validarAoSair("numeroSus", validarCartaoSUS);

// --- PARTE 3: ENVIO E VALIDAÇÃO DO FORMULÁRIO DA CRIANÇA ---
var formulario = document.getElementById("form-crianca");

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  var nome = document.getElementById("nomeCrianca").value;
  var nascimento = document.getElementById("dataNascimento").value;
  var cpf = document.getElementById("cpfCrianca").value;
  var sus = document.getElementById("numeroSus").value;
  var resp1 = document.getElementById("responsavel1").value;

  if (
    nome === "" ||
    nascimento === "" ||
    cpf === "" ||
    sus === "" ||
    resp1 === ""
  ) {
    alert(
      "Vul alstublieft alle verplichte velden in die met * zijn gemarkeerd!",
    );
    return;
  }

  if (!validarBSN(cpf)) {
    alert(
      "Het ingevoerde BSN is ongeldig! Controleer de cijfers en probeer het opnieuw.",
    );
    return;
  }

  if (!validarCartaoSUS(sus)) {
    alert(
      "Het SUS-kaartnummer (CNS) is ongeldig! Het moet 15 geldige cijfers bevatten.",
    );
    return;
  }

  // Missão 4: gera e baixa o arquivo JSON da carteirinha
  var nomeArquivo = salvarCarteirinhaJSON();

  var mensagem = document.getElementById("mensagem-cadastro");
  mensagem.textContent =
    "De gegevens van " +
    nome +
    " zijn gevalideerd en met succes opgeslagen in het bestand " +
    nomeArquivo +
    "!";
});

// --- MISSÃO 4: SALVAR A CARTEIRINHA EM ARQUIVO JSON LOCAL ---
// Junta os dados da criança e de todas as doses (com data, lote, local e
// vacinador das já aplicadas) num objeto, transforma em texto JSON e faz o
// navegador baixar como arquivo (Blob + link com atributo "download").
function salvarCarteirinhaJSON() {
  var bsn = limparNumeros(document.getElementById("cpfCrianca").value);

  var carteirinha = {
    kind: {
      naam: document.getElementById("nomeCrianca").value,
      geboortedatum: document.getElementById("dataNascimento").value,
      leeftijd: campoIdadeAnos.value + ", " + campoIdadeMeses.value,
      bsn: bsn,
      susNummer: limparNumeros(document.getElementById("numeroSus").value),
      wettelijkeVertegenwoordiger1: document.getElementById("responsavel1").value,
      wettelijkeVertegenwoordiger2: document.getElementById("responsavel2").value,
    },
    vaccinaties: [],
    opgeslagenOp: new Date().toISOString(),
  };

  var cards = document.querySelectorAll(".card-vacina");
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var dose = {
      vaccin: card.dataset.vacina,
      dosis: parseInt(card.dataset.dose, 10),
      leeftijd: card.dataset.idade,
      status: "in afwachting",
    };

    if (card.classList.contains("tomada")) {
      dose.status = "toegediend";
      dose.datumToediening = card.dataset.dataAplicacao;
      dose.batchnummer = card.dataset.numeroLote;
      dose.vaccinatielocatie = card.dataset.unidadeAplicadora;
      dose.vaccinator = card.dataset.responsavelAplicacao;
    } else if (card.classList.contains("atrasada")) {
      dose.status = "te laat";
    }

    carteirinha.vaccinaties.push(dose);
  }

  var textoJSON = JSON.stringify(carteirinha, null, 2);
  var arquivo = new Blob([textoJSON], { type: "application/json" });
  var nomeArquivo = "vaccinatiekaart_" + bsn + ".json";

  var link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // libera a memória do arquivo depois que o download começou
  setTimeout(function () {
    URL.revokeObjectURL(link.href);
  }, 1000);

  return nomeArquivo;
}

// --- PARTE 4: CARREGAR O ARQUIVO JSON E CRIAR OS CARDS ---
fetch("vacinasSUS.json")
  .then(function (resposta) {
    return resposta.json();
  })
  .then(function (dados) {
    var listaVacinas = dados.calendario_vacinacao_infantil_sus;
    var containerCards = document.getElementById("lista-vacinas");

    for (var i = 0; i < listaVacinas.length; i++) {
      var vacinaAtual = listaVacinas[i];
      var dosesSeparadas = separarDoses(vacinaAtual.idade);

      for (var j = 0; j < dosesSeparadas.length; j++) {
        criarCardNaTela(
          containerCards,
          vacinaAtual.vacina,
          dosesSeparadas[j],
          vacinaAtual.para_que_serve,
          j + 1,
        );
      }
    }

    atualizarAtrasos();
  })
  .catch(function (erro) {
    console.log("Erro ao carregar JSON:", erro);
    document.getElementById("lista-vacinas").innerHTML =
      "<p>Fout bij het laden van vacinasSUS.json. Open de pagina met Live Server.</p>";
  });

function separarDoses(texto) {
  if (texto.indexOf(";") !== -1) {
    return [texto];
  }
  var textoComVirgulas = texto.replace(" e ", ", ");
  return textoComVirgulas.split(", ");
}

function criarCardNaTela(
  container,
  nomeVacina,
  idadeDose,
  descricao,
  numeroDose,
) {
  var card = document.createElement("div");
  card.className = "card-vacina";

  card.innerHTML =
    '<span class="etiqueta-dose">Dosis ' +
    numeroDose +
    "</span>" +
    "<h3>" +
    nomeVacina +
    "</h3>" +
    "<p><strong>Leeftijd:</strong> " +
    idadeDose +
    "</p>" +
    '<p class="status-texto">Status: In afwachting</p>' +
    '<div class="detalhes-aplicacao-card escondido"></div>';

  // Missão 4: guarda no card os dados da dose para exportar no JSON
  card.dataset.vacina = nomeVacina;
  card.dataset.dose = numeroDose;
  card.dataset.idade = idadeDose;

  // Missão 3: guarda no card até que idade (em meses) a dose deve ser tomada
  var limite = idadeParaMeses(idadeDose);
  if (limite !== null) {
    card.dataset.limiteMeses = limite;
  }

  card.addEventListener("click", function () {
    abrirJanela(card, nomeVacina, numeroDose, idadeDose, descricao);
  });

  container.appendChild(card);
}

// --- MISSÃO 3: ALERTAS DE VACINAS ATRASADAS ---
// Converte o texto da idade da dose (do JSON) para meses:
//   "Bij geboorte ..."  -> 0
//   "N maanden ..."     -> N
//   "N jaar ..."        -> N * 12
//   "9 tot 14 jaar ..." -> 14 * 12 (em faixas vale o FIM da janela)
// Retorna null se não encontrar uma idade no texto.
function idadeParaMeses(texto) {
  var textoMinusculo = texto.toLowerCase();

  if (textoMinusculo.indexOf("bij geboorte") !== -1) {
    return 0;
  }

  // Primeiro número seguido de "maand(en)" ou "jaar".
  // Em "9 tot 14 jaar" o "9" não é seguido de unidade, então pega o 14.
  var encontrado = textoMinusculo.match(/(\d+)\s*(maanden|maand|jaar)/);
  if (encontrado === null) {
    return null;
  }

  var numero = parseInt(encontrado[1], 10);
  if (encontrado[2] === "jaar") {
    return numero * 12;
  }
  return numero;
}

// Marca como "atrasada" toda dose não aplicada cuja idade-limite já passou.
// É chamada quando a data de nascimento muda, quando os cards são criados
// e quando uma vacina é confirmada/desmarcada na janela.
function atualizarAtrasos() {
  var cards = document.querySelectorAll(".card-vacina");

  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var textoStatus = card.querySelector(".status-texto");

    if (card.classList.contains("tomada")) {
      card.classList.remove("atrasada");
      continue;
    }

    var limite = card.dataset.limiteMeses;
    var atrasada =
      idadeTotalMeses !== null &&
      limite !== undefined &&
      idadeTotalMeses > parseInt(limite, 10);

    if (atrasada) {
      card.classList.add("atrasada");
      textoStatus.textContent = "Status: Te laat ⚠";
    } else {
      card.classList.remove("atrasada");
      textoStatus.textContent = "Status: In afwachting";
    }
  }
}

// --- PARTE 5: CONTROLE DA JANELA (MODAL) E DADOS DA APLICAÇÃO ---
var janela = document.getElementById("janela-detalhes");
var checkTomada = document.getElementById("check-tomada");
var camposAplicacao = document.getElementById("campos-aplicacao");

var inputDataAplicacao = document.getElementById("dataAplicacao");
var inputNumeroLote = document.getElementById("numeroLote");
var inputUnidadeAplicadora = document.getElementById("unidadeAplicadora");
var inputResponsavelAplicacao = document.getElementById("responsavelAplicacao");

var btnConfirmar = document.getElementById("btn-confirmar");
var btnFechar = document.getElementById("btn-fechar");

// Mostra ou esconde os 4 campos extras quando o checkbox muda
checkTomada.addEventListener("change", function () {
  if (checkTomada.checked === true) {
    camposAplicacao.classList.remove("escondido");
  } else {
    camposAplicacao.classList.add("escondido");
  }
});

// Função simples para converter YYYY-MM-DD em DD/MM/YYYY
function formatarDataBrasil(dataISO) {
  if (dataISO === "") return "";
  var partes = dataISO.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function abrirJanela(cardClicado, nome, numDose, idade, descricao) {
  cardAtualSelecionado = cardClicado;

  document.getElementById("janela-titulo").textContent = nome;
  document.getElementById("janela-dose").textContent = "Dosis " + numDose;
  document.getElementById("janela-idade").textContent = idade;
  document.getElementById("janela-descricao").textContent = descricao;

  // Verifica se o card já estava marcado como tomado
  if (cardClicado.classList.contains("tomada")) {
    checkTomada.checked = true;
    camposAplicacao.classList.remove("escondido");

    // Recupera os valores salvos anteriormente no próprio card
    inputDataAplicacao.value = cardClicado.dataset.dataAplicacao || "";
    inputNumeroLote.value = cardClicado.dataset.numeroLote || "";
    inputUnidadeAplicadora.value = cardClicado.dataset.unidadeAplicadora || "";
    inputResponsavelAplicacao.value =
      cardClicado.dataset.responsavelAplicacao || "";
  } else {
    checkTomada.checked = false;
    camposAplicacao.classList.add("escondido");

    // Limpa os campos para um novo preenchimento
    inputDataAplicacao.value = "";
    inputNumeroLote.value = "";
    inputUnidadeAplicadora.value = "";
    inputResponsavelAplicacao.value = "";
  }

  janela.classList.remove("escondido");
}

btnConfirmar.addEventListener("click", function () {
  if (cardAtualSelecionado !== null) {
    var textoStatus = cardAtualSelecionado.querySelector(".status-texto");
    var caixaDetalhesCard = cardAtualSelecionado.querySelector(
      ".detalhes-aplicacao-card",
    );

    if (checkTomada.checked === true) {
      var dataApl = inputDataAplicacao.value;
      var lote = inputNumeroLote.value;
      var unidade = inputUnidadeAplicadora.value;
      var responsavel = inputResponsavelAplicacao.value;

      // Valida se os campos da aplicação foram preenchidos (lote sem verificação de formato)
      if (
        dataApl === "" ||
        lote === "" ||
        unidade === "" ||
        responsavel === ""
      ) {
        alert(
          "Vul de datum van toediening, het batchnummer, de vaccinatielocatie en de vaccinator in!",
        );
        return;
      }

      // Salva os dados no próprio elemento HTML do card usando dataset
      cardAtualSelecionado.dataset.dataAplicacao = dataApl;
      cardAtualSelecionado.dataset.numeroLote = lote;
      cardAtualSelecionado.dataset.unidadeAplicadora = unidade;
      cardAtualSelecionado.dataset.responsavelAplicacao = responsavel;

      cardAtualSelecionado.classList.add("tomada");
      textoStatus.textContent = "Status: Toegediend ✓";

      // Mostra o resumo da aplicação dentro do card
      caixaDetalhesCard.innerHTML =
        "<strong>Datum:</strong> " +
        formatarDataBrasil(dataApl) +
        "<br>" +
        "<strong>Batch:</strong> " +
        lote +
        "<br>" +
        "<strong>Locatie:</strong> " +
        unidade +
        "<br>" +
        "<strong>Vaccinator:</strong> " +
        responsavel;
      caixaDetalhesCard.classList.remove("escondido");
    } else {
      // Se desmarcou a opção, volta o card para Pendente e limpa os dados
      cardAtualSelecionado.classList.remove("tomada");
      textoStatus.textContent = "Status: In afwachting";
      caixaDetalhesCard.innerHTML = "";
      caixaDetalhesCard.classList.add("escondido");

      delete cardAtualSelecionado.dataset.dataAplicacao;
      delete cardAtualSelecionado.dataset.numeroLote;
      delete cardAtualSelecionado.dataset.unidadeAplicadora;
      delete cardAtualSelecionado.dataset.responsavelAplicacao;
    }
  }

  atualizarAtrasos();
  janela.classList.add("escondido");
});

btnFechar.addEventListener("click", function () {
  janela.classList.add("escondido");
});
