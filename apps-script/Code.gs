/**
 * Inventário Automob — servidor (Google Apps Script)
 *
 * Guarda cada foto numa pasta do Google Drive e registra uma linha na
 * planilha "Inventário Automob". Também lê a placa (OCR do Google Drive)
 * e converte as coordenadas do GPS em endereço.
 *
 * Acesso por usuário e senha, com dois perfis:
 *   Loja  — fotografa e consulta só as fotos das lojas do seu cadastro (uma ou mais).
 *   Admin — vê todas as lojas, cadastra usuários e baixa o Excel.
 * As filiais ficam na aba Lojas da planilha.
 *
 * Instalação: veja o arquivo LEIA-ME.md.
 */

const APP = {
  nome: 'Inventário Automob',
  abaFotos: 'Fotos',
  abaResumo: 'Resumo',
  abaUsuarios: 'Usuários',
  abaLojas: 'Lojas',
  pasta: 'Inventário Automob - Fotos',
  fuso: 'America/Sao_Paulo',
  diasSessao: 7,
  porPagina: 20,
};

const CABECALHO = [
  'Data/Hora', 'Data', 'Hora', 'Placa', 'Loja', 'Responsável', 'Endereço',
  'Latitude', 'Longitude', 'Precisão GPS (m)', 'Código da foto', 'Foto (link)',
  'Texto lido na foto', 'Placa digitada à mão', 'ID do arquivo', 'ID da miniatura', 'Usuário', 'Código da loja',
];
const COL = {}; CABECALHO.forEach((c, i) => { COL[c] = i; });

const CAB_LOJAS = ['Código', 'Loja', 'Bandeira', 'Ativa'];

/** Filiais cadastradas na primeira configuração (depois, edite na aba Lojas). */
const FILIAIS = [
  [2, "BMW MINI CTBA", "BMW"],
  [3, "BMW CTBA MARECHAL", "BMW"],
  [14, "BMW CTBA (CRA)", "BMW"],
  [69, "BMW JOINVILLE", "BMW"],
  [302, "EURO IMPORT CALHAU", "BMW"],
  [301, "EURO IMPORT COLOMBIA", "BMW"],
  [304, "EURO IMPORT JD EUROPA", "BMW"],
  [17, "EURO IMPORT NACOES", "BMW"],
  [303, "EURO IMPORT SOCORRO", "OUTROS"],
  [305, "EURO IMPORT VILA OLIMPIA", "BMW"],
  [5, "LAND ROVER CURITIBA", "LAND ROVER"],
  [6, "LAND ROVER LONDRINA", "LAND ROVER"],
  [13, "LAND ROVER MARINGA", "LAND ROVER"],
  [88, "LAND ROVER (CRA)", "LAND ROVER"],
  [21, "LAND ROVER CASCAVEL", "LAND ROVER"],
  [20, "LAND ROVER MORUMBI", "LAND ROVER"],
  [8, "MOTOS SUL", "BMW"],
  [82, "MOTOS SUL- CASCAVEL", "BMW"],
  [83, "MOTOS SUL - JOINVILLE", "BMW"],
  [11, "BMW LONDRINA", "BMW"],
  [12, "BMW CASCAVEL", "BMW"],
  [91, "LEAPMOTOR CALHAU", "LEAPMOTOR"],
  [101, "HONDA ARICANDUVA", "HONDA CARRO"],
  [102, "HONDA GUARULHOS", "HONDA CARRO"],
  [461, "HONDA PINHEIROS", "HONDA CARRO"],
  [462, "HONDA ITAIM BIBI", "HONDA CARRO"],
  [463, "HONDA MORUMBI", "HONDA CARRO"],
  [103, "HONDA STO ANDRE", "HONDA CARRO"],
  [104, "HONDA SBC", "HONDA CARRO"],
  [202, "TOYOTA TATUAPE", "TOYOTA"],
  [203, "TOYOTA OSASCO", "TOYOTA"],
  [204, "TOYOTA SAO MIGUEL", "TOYOTA"],
  [205, "TOYOTA GUARULHOS", "TOYOTA"],
  [207, "TSERVICE - GUARULHOS", "TOYOTA"],
  [225, "TOYOTA ALPHAVILLE", "TOYOTA"],
  [228, "TOYOTA SJC", "TOYOTA"],
  [276, "TOYOTA TAUBATE", "TOYOTA"],
  [286, "TOYOTA ARICANDUVA", "TOYOTA"],
  [288, "TOYOTA TAMBORE", "LEXUS"],
  [321, "ORGINAL ESTACO- HYUNDAI", "HYUNDAI"],
  [351, "CRA - GUARULHOS", "OUTROS"],
  [361, "GAC - MOGI", "GAC MOTOR"],
  [362, "GAC - CALHAU", "GAC MOTOR"],
  [363, "GAC - GUARULHOS", "GAC MOTOR"],
  [364, "GAC - SAO J. DOS CAMPOS", "GAC MOTOR"],
  [381, "HARLEY - NACOES", "HARLEY DAVIDSON"],
  [382, "HARLEY - BARRA FUNDA", "HARLEY DAVIDSON"],
  [385, "HARLEY - VILA OLIMPIA", "HARLEY DAVIDSON"],
  [391, "KTM - VL OLIMPIA", "OUTROS"],
  [401, "KIA - RENASCENCA", "KIA"],
  [421, "NEW ENGLAND NACOES", "TRIUMPH"],
  [422, "NEW ENGLAND SAO LUIS", "TRIUMPH"],
  [423, "NEW ENGLAND BARRA FUNDA", "TRIUMPH"],
  [424, "NEW ENGLAND SOCORRO", "TRIUMPH"],
  [441, "FORD VILA GUILHERME", "FORD"],
  [442, "FORD JAFET", "FORD"],
  [481, "GWM GUARULHOS STA FRANCI", "GWM"],
  [482, "GWM SAO JOSE", "GWM"],
  [483, "GWM MOGI CENTRO", "GWM"],
  [484, "GWM TAUBATE", "GWM"],
  [486, "GWM IBIRAPUERA", "GWM"],
  [488, "GWM JAFET", "GWM"],
  [489, "GWM NACOES", "GWM"],
  [501, "YAMAHA SAO LUIS", "YAMAHA"],
  [502, "YAMAHA IPES", "YAMAHA"],
  [503, "YAMAHA PACO LUMIAR", "YAMAHA"],
  [521, "CHERY CALHAU", "CHERY"],
  [561, "FIAT PIRES DN:91091", "FIAT"],
  [562, "FIAT USADOS PIRES", "FIAT"],
  [563, "FIAT VL PRUDENTE DN:91187", "FIAT"],
  [564, "FIAT GUARULHOS DN:90817", "FIAT"],
  [566, "FIAT GUARULHOS 2 DN:90754", "FIAT"],
  [571, "FIAT SAO MIGUEL", "FIAT"],
  [601, "NACIONAL SAO PAULO", "MULTIMARCAS"],
  [602, "NACIONAL ARARAQUARA", "MULTIMARCAS"],
  [603, "NACIONAL TAUBATE", "MULTIMARCAS"],
  [604, "NACIONAL SAO CARLOS", "MULTIMARCAS"],
  [605, "NACIONAL PIRACICABA", "MULTIMARCAS"],
  [606, "NACIONAL INDAIATUBA", "MULTIMARCAS"],
  [607, "NACIONAL CALHAU", "MULTIMARCAS"],
  [608, "NACIONAL JUNDIAI", "MULTIMARCAS"],
  [610, "NACIONAL AMERICANA", "MULTIMARCAS"],
  [611, "NACIONAL CAMPINAS", "MULTIMARCAS"],
  [612, "NACIONAL CAMPO GRANDE", "MULTIMARCAS"],
  [613, "NACIONAL PRAIA GRANDE", "MULTIMARCAS"],
  [614, "NACIONAL RIO CLARO", "MULTIMARCAS"],
  [615, "NACIONAL LIMEIRA", "MULTIMARCAS"],
  [617, "NACIONAL JOAO PESSOA", "MULTIMARCAS"],
  [619, "NACIONAL BELO HORIZONTE", "MULTIMARCAS"],
  [627, "NACIONAL RECIFE", "MULTIMARCAS"],
  [628, "NACIONAL GOIANIA", "MULTIMARCAS"],
  [629, "NACIONAL PORTO ALEGRE", "MULTIMARCAS"],
  [701, "GM JARACATY", "GM"],
  [702, "GM CALHAU", "GM"],
  [704, "GM MARANHAO", "GM"],
  [731, "GT MATRIZ", "MULTIMARCAS"],
  [732, "GT COMPLEXO", "MULTIMARCAS"],
  [733, "GT DANIEL", "MULTIMARCAS"],
  [734, "GT PATIO NORTE", "MULTIMARCAS"],
  [735, "GT HOLANDESES", "MULTIMARCAS"],
  [791, "ORIGINAL NICE SAO LUIS", "RENAULT"],
  [801, "VW SAO MIGUEL", "VOLKSWAGEN"],
  [802, "VW DO VALE", "VOLKSWAGEN"],
  [804, "VW MOGI", "VOLKSWAGEN"],
  [805, "VW ARUJA", "VOLKSWAGEN"],
  [806, "VW SUZANO I", "VOLKSWAGEN"],
  [807, "VW GRU I TIRADENTES", "VOLKSWAGEN"],
  [808, "VW SAO BERNARDO", "VOLKSWAGEN"],
  [810, "VW DUTRA", "VOLKSWAGEN"],
  [813, "VW TAUBATE II", "VOLKSWAGEN"],
  [815, "VW CARAGUA", "VOLKSWAGEN"],
  [817, "VW ABRAAO II", "VOLKSWAGEN"],
  [818, "VW ABRAAO I", "VOLKSWAGEN"],
  [819, "VW CURSINO", "VOLKSWAGEN"],
  [821, "VW BRAZ LEME", "VOLKSWAGEN"],
  [822, "VW VERGUEIRO", "VOLKSWAGEN"],
  [823, "VW ARICANDUVA", "VOLKSWAGEN"],
  [824, "VW GOMES CARDIN", "VOLKSWAGEN"],
  [825, "VW MORUMBI", "VOLKSWAGEN"],
  [826, "VW NACOES", "VOLKSWAGEN"],
  [851, "RENAULT IPIRANGA", "RENAULT"],
  [852, "RENAULT VILA PRUDENTE", "RENAULT"],
  [854, "RENAULT VILA GUILHERME", "RENAULT"],
  [855, "RENAULT BRAZ LEME", "RENAULT"],
  [857, "RENAULT SAO LUIS", "RENAULT"],
  [871, "BYD GUARULHOS", "BYD AUTOMOVEIS"],
  [872, "BYD SJC COLINAS", "BYD AUTOMOVEIS"],
  [873, "BYD SAO LUIS", "BYD AUTOMOVEIS"],
  [874, "BYD PACAEMBU", "BYD AUTOMOVEIS"],
  [875, "BYD EDUARDO ELIAS", "BYD AUTOMOVEIS"],
  [876, "BYD RICARDO BRANDAO", "BYD AUTOMOVEIS"],
  [877, "BYD DEPOSITO", "BYD AUTOMOVEIS"],
  [882, "BYD CALHAU", "BYD AUTOMOVEIS"],
  [901, "VOLVO CALHAU", "VOLVO"],
  [902, "VOLVO PACAEMBU", "VOLVO"],
  [903, "VOLVO MORUMBI", "VOLVO"],
  [932, "PEUGEOT GUARULHOS", "PEUGEOT"],
  [933, "CITROEN GUARULHOS", "CITROEN"],
  [939, "CITROEN VILA PRUDENTE", "CITROEN"],
  [1001, "PEUGEOT NEW PR MARANHAO", "PEUGEOT"],
  [1002, "CITROEN NEW PR MARANHAO", "CITROEN"],
  [1011, "FIAT TURIM MARANHAO", "FIAT"],
  [1012, "JEEP TURIM MARANHAO", "JEEP"],
  [1021, "PEUGEOT GREEN NACOES", "PEUGEOT"],
  [1023, "CITROEN GREEN GIOVANNI", "CITROEN"],
  [1024, "PEUGEOT GREEN ARICANDUV", "PEUGEOT"],
  [1051, "AMERICAN STAR MORATO", "JEEP"],
];

const CAB_USUARIOS = ['Usuário', 'Nome', 'Perfil', 'Loja', 'Ativo', 'Trocar senha', 'Senha (hash)', 'Sal', 'Criado em'];

/**
 * Rode esta função pelo editor: cria (ou atualiza) a planilha, a pasta das
 * fotos e, na primeira vez, o usuário "admin" com uma senha provisória que
 * aparece no registro de execução.
 */
function configurar() {
  const props = PropertiesService.getScriptProperties();

  let ss = abrir_(() => SpreadsheetApp.openById(props.getProperty('SHEET_ID')));
  if (!ss) {
    ss = SpreadsheetApp.create(APP.nome);
    ss.setSpreadsheetLocale('pt_BR');
    ss.setSpreadsheetTimeZone(APP.fuso);
    props.setProperty('SHEET_ID', ss.getId());
  }

  // Aba Fotos (acrescenta colunas novas sem mexer nas fotos já registradas)
  let fotos = ss.getSheetByName(APP.abaFotos);
  if (!fotos) {
    fotos = ss.getSheets()[0];
    fotos.setName(APP.abaFotos);
  }
  if (fotos.getLastRow() === 0) {
    fotos.appendRow(CABECALHO);
    fotos.setFrozenRows(1);
    fotos.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
    fotos.setColumnWidth(7, 320);
    fotos.setColumnWidth(12, 260);
  } else {
    fotos.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO]);
  }
  fotos.getRange(1, 1, 1, CABECALHO.length)
    .setFontWeight('bold').setBackground('#103047').setFontColor('#ffffff');

  // Aba Resumo (fórmulas reescritas sempre, para corrigir versões antigas)
  {
    const r = ss.getSheetByName(APP.abaResumo) || ss.insertSheet(APP.abaResumo);
    r.getRange('A1').setValue('Fotos por loja').setFontWeight('bold');
    r.getRange('A2').setFormula(
      "=IFERROR(QUERY(Fotos!B:E,\"select E, count(D) where D is not null group by E order by count(D) desc label E 'Loja', count(D) 'Fotos'\",1),\"Sem fotos ainda\")");
    r.getRange('D1').setValue('Fotos por dia e loja').setFontWeight('bold');
    r.getRange('D2').setFormula(
      "=IFERROR(QUERY(Fotos!B:E,\"select B, E, count(D) where D is not null group by B, E label B 'Data', E 'Loja', count(D) 'Fotos'\",1),\"Sem fotos ainda\")");
    r.getRange('H1').setValue('Total de fotos').setFontWeight('bold');
    r.getRange('H2').setFormula('=MAX(0,COUNTA(Fotos!D:D)-1)');
  }

  // Aba Lojas (filiais)
  let lojas = ss.getSheetByName(APP.abaLojas);
  if (!lojas) {
    lojas = ss.insertSheet(APP.abaLojas);
    lojas.getRange(1, 1, 1, CAB_LOJAS.length).setValues([CAB_LOJAS])
      .setFontWeight('bold').setBackground('#103047').setFontColor('#ffffff');
    lojas.setFrozenRows(1);
    lojas.setColumnWidth(2, 280);
  }
  if (lojas.getLastRow() < 2) {
    lojas.getRange(2, 1, FILIAIS.length, 4).setValues(FILIAIS.map(f => [f[0], f[1], f[2], 'Sim']));
  }

  // Aba Usuários
  let usuarios = ss.getSheetByName(APP.abaUsuarios);
  let senhaAdmin = null;
  if (!usuarios) {
    usuarios = ss.insertSheet(APP.abaUsuarios);
    usuarios.appendRow(CAB_USUARIOS);
    usuarios.getRange(1, 1, 1, CAB_USUARIOS.length)
      .setFontWeight('bold').setBackground('#103047').setFontColor('#ffffff');
    usuarios.setFrozenRows(1);
    usuarios.hideColumns(7, 2);
  }
  if (usuarios.getLastRow() < 2) {
    senhaAdmin = senhaAleatoria_();
    const sal = Utilities.getUuid();
    usuarios.appendRow(['admin', 'Administrador', 'Admin', '', 'Sim', 'Sim', hash_(senhaAdmin, sal), sal, new Date()]);
  }

  let pasta = abrir_(() => DriveApp.getFolderById(props.getProperty('FOLDER_ID')));
  if (!pasta) {
    pasta = DriveApp.createFolder(APP.pasta);
    props.setProperty('FOLDER_ID', pasta.getId());
  }

  Logger.log('Planilha: ' + ss.getUrl());
  Logger.log('Pasta das fotos: ' + pasta.getUrl());
  if (senhaAdmin) Logger.log('PRIMEIRO ACESSO >> usuário: admin   senha provisória: ' + senhaAdmin);
  return { ss: ss, pasta: pasta };
}

/** Se esquecer a senha do admin: rode pelo editor e veja a nova senha no registro. */
function redefinirSenhaAdmin() {
  const sh = cfg_().ss.getSheetByName(APP.abaUsuarios);
  const linhas = sh.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (String(linhas[i][0]).toLowerCase() === 'admin') {
      const senha = senhaAleatoria_(), sal = Utilities.getUuid();
      sh.getRange(i + 1, 5, 1, 4).setValues([['Sim', 'Sim', hash_(senha, sal), sal]]);
      Logger.log('usuário: admin   nova senha provisória: ' + senha);
      return;
    }
  }
  Logger.log('Usuário admin não encontrado. Rode configurar().');
}

/**
 * Rode esta função pelo editor para testar a leitura de placa com a última foto da planilha.
 * O texto lido aparece no Registro de execução.
 */
function testarLeitura() {
  const fotos = planilha_().getSheetByName(APP.abaFotos);
  if (fotos.getLastRow() < 2) { Logger.log('Ainda não há fotos na planilha.'); return; }
  const id = fotos.getRange(fotos.getLastRow(), CABECALHO.indexOf('ID do arquivo') + 1, 1, 1).getValues()[0][0];
  const b64 = Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes());
  Logger.log('TEXTO LIDO >> ' + (ocr_(b64) || '(nada)'));
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP.nome)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('mobile-web-app-capable', 'yes')
    .addMetaTag('apple-mobile-web-app-capable', 'yes');
}

/** Funções que o app instalado (página do GitHub) pode chamar pela internet. */
const API = {
  login: login, sair: sair, trocarSenha: trocarSenha, inicio: inicio, analisar: analisar,
  salvar: salvar, contagem: contagem, listarFotos: listarFotos, verFoto: verFoto,
  listarUsuarios: listarUsuarios, salvarUsuario: salvarUsuario, apagarFoto: apagarFoto,
};

/**
 * Porta de entrada do app instalado: recebe {fn, args} em JSON e devolve
 * {ok: resultado} ou {erro: mensagem}. As regras de acesso são as mesmas,
 * porque cada função confere o login.
 */
function doPost(e) {
  let saida;
  try {
    const pedido = JSON.parse(e.postData.contents);
    const fn = API[pedido.fn];
    if (!fn) throw new Error('Função desconhecida.');
    saida = { ok: fn.apply(null, pedido.args || []) };
  } catch (err) {
    saida = { erro: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(saida)).setMimeType(ContentService.MimeType.JSON);
}

// ===========================================================================
// Login e sessão
// ===========================================================================

function login(usuario, senha) {
  usuario = String(usuario || '').trim().toLowerCase();
  const cache = CacheService.getScriptCache();
  const chaveFalhas = 'falhas_' + usuario;
  const falhas = Number(cache.get(chaveFalhas) || 0);
  if (falhas >= 5) throw new Error('Muitas tentativas erradas. Espere 15 minutos e tente de novo.');

  const u = buscarUsuario_(usuario);
  if (!u || u.ativo !== 'Sim' || hash_(String(senha || ''), u.sal) !== u.hash) {
    cache.put(chaveFalhas, String(falhas + 1), 900);
    throw new Error('Usuário ou senha incorretos.');
  }
  cache.remove(chaveFalhas);

  const props = PropertiesService.getScriptProperties();
  limparSessoes_(props);
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('sess_' + token, JSON.stringify({ u: u.usuario, exp: Date.now() + APP.diasSessao * 864e5 }));
  return { token: token, usuario: publico_(u) };
}

function sair(token) {
  try { PropertiesService.getScriptProperties().deleteProperty('sess_' + token); } catch (e) {}
  return true;
}

function trocarSenha(token, atual, nova) {
  const u = sessao_(token);
  if (hash_(String(atual || ''), u.sal) !== u.hash) throw new Error('A senha atual está errada.');
  validarSenha_(nova);
  const sal = Utilities.getUuid();
  const sh = planilha_().getSheetByName(APP.abaUsuarios);
  sh.getRange(u.linha, 6, 1, 3).setValues([['Não', hash_(nova, sal), sal]]);
  return publico_(Object.assign(u, { trocar: 'Não' }));
}

/** Dados iniciais do app depois do login. */
function inicio(token) {
  const u = sessao_(token);
  const todas = listaLojas_();
  const out = { usuario: publico_(u), lojas: u.perfil === 'Admin' ? todas : todas.filter(l => u.lojas.indexOf(l.nome) >= 0) };
  if (u.perfil === 'Admin') {
    const c = cfg_();
    const id = c.ss.getId();
    out.links = {
      planilha: c.ss.getUrl(),
      excel: 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx',
      pasta: c.pasta.getUrl(),
    };
  }
  return out;
}

// ===========================================================================
// Fotos
// ===========================================================================

/**
 * Lê o texto da foto (para achar a placa) e o endereço das coordenadas.
 * d = { imagem: base64 JPEG sem prefixo, lat, lng }
 */
function analisar(token, d) {
  sessao_(token);
  const out = { texto: '', endereco: '' };
  if (d && d.imagem) {
    const textos = [];
    [d.recorte, d.imagem].filter(Boolean).forEach(img => {
      try { textos.push(ocr_(img)); } catch (e) { out.erroOcr = String(e.message || e); }
    });
    out.texto = textos.join('\n');
    if (out.texto.trim()) delete out.erroOcr;
  }
  if (d && d.lat != null && d.lng != null) out.endereco = endereco_(d.lat, d.lng);
  return out;
}

/**
 * Salva a foto com marca d'água e registra a linha na planilha.
 * d = { foto, miniatura (base64), placa, loja, lat, lng, precisao, endereco,
 *       codigo, iso, data (dd/MM/yyyy), hora (HH:mm:ss), texto, manual }
 */
function salvar(token, d) {
  const u = sessao_(token);
  const c = cfg_();
  const placa = String(d.placa || '').toUpperCase().trim() || 'SEM PLACA';
  if (u.perfil !== 'Admin' && !u.lojas.length) throw new Error('Seu usuário está sem loja definida. Peça ao administrador para ajustar o cadastro.');
  const loja = lojaPermitida_(u, d.loja);
  if (!loja) throw new Error('Escolha a loja antes de fotografar.');
  const filial = listaLojas_(true).filter(l => l.nome === loja)[0];

  // Mesma foto enviada duas vezes (ex.: conexão caiu depois de gravar): não duplica.
  const ja = linhaPorCodigo_(c.ss, d.codigo);
  if (ja) return { ok: true, url: ja.url, duplicada: false, totalLojaDia: contagemLojaDia_(c.ss, loja, d.data) };

  const sub = subpasta_(subpasta_(c.pasta, loja), d.data.split('/').reverse().join('-'));
  const nome = placa.replace(/[^A-Z0-9]+/g, '-') + '_' + d.hora.replace(/:/g, '') + '_' + d.codigo + '.jpg';
  const arquivo = sub.createFile(Utilities.newBlob(Utilities.base64Decode(d.foto), 'image/jpeg', nome));
  let miniId = '';
  if (d.miniatura) {
    const mini = subpasta_(c.pasta, '_miniaturas')
      .createFile(Utilities.newBlob(Utilities.base64Decode(d.miniatura), 'image/jpeg', d.codigo + '.jpg'));
    miniId = mini.getId();
  }

  let endereco = d.endereco || '';
  if (!endereco && d.lat != null && d.lng != null) endereco = endereco_(d.lat, d.lng);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let duplicada = false;
  let totalLojaDia = 1;
  try {
    const sh = c.ss.getSheetByName(APP.abaFotos);
    const ultima = sh.getLastRow();
    if (ultima > 1) {
      const vals = sh.getRange(2, 2, ultima - 1, 4).getDisplayValues(); // Data, Hora, Placa, Loja
      for (let i = 0; i < vals.length; i++) {
        if (vals[i][0] === d.data && vals[i][3] === loja) {
          totalLojaDia++;
          if (vals[i][2] === placa && placa !== 'SEM PLACA') duplicada = true;
        }
      }
    }
    sh.appendRow([
      new Date(d.iso), "'" + d.data, "'" + d.hora, placa, loja, u.nome, endereco,
      d.lat == null ? '' : d.lat, d.lng == null ? '' : d.lng,
      d.precisao == null ? '' : Math.round(d.precisao),
      d.codigo, arquivo.getUrl(), (d.texto || '').replace(/\s+/g, ' ').slice(0, 300),
      d.manual ? 'Sim' : 'Não', arquivo.getId(), miniId, u.usuario, filial ? filial.codigo : '',
    ]);
  } finally {
    lock.releaseLock();
  }

  return { ok: true, url: arquivo.getUrl(), duplicada: duplicada, totalLojaDia: totalLojaDia, endereco: endereco };
}

/** Quantas fotos a loja tem no dia (dd/MM/yyyy) e no total. */
function contagem(token, loja, data) {
  const u = sessao_(token);
  loja = lojaPermitida_(u, loja);
  const sh = planilha_().getSheetByName(APP.abaFotos);
  const ultima = sh.getLastRow();
  let dia = 0, total = 0;
  if (ultima > 1) {
    sh.getRange(2, 2, ultima - 1, 4).getDisplayValues().forEach(r => {
      if (r[3] === loja) { total++; if (r[0] === data) dia++; }
    });
  }
  return { dia: dia, total: total };
}

/**
 * Lista as fotos para consulta. Perfil Loja só enxerga a própria loja.
 * f = { loja, data (dd/MM/yyyy ou ''), placa, pagina (0..) }
 */
function listarFotos(token, f) {
  const u = sessao_(token);
  f = f || {};
  const loja = lojaPermitida_(u, f.loja);
  const minhas = u.perfil === 'Admin' ? null : u.lojas; // sem loja escolhida, a loja vê todas as suas
  const placa = String(f.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const sh = planilha_().getSheetByName(APP.abaFotos);
  const ultima = sh.getLastRow();
  if (ultima < 2) return { itens: [], total: 0, pagina: 0, paginas: 0 };

  const vals = sh.getRange(2, 1, ultima - 1, CABECALHO.length).getDisplayValues();
  const achadas = [];
  for (let i = vals.length - 1; i >= 0; i--) {
    const r = vals[i];
    if (loja && r[COL['Loja']] !== loja) continue;
    if (!loja && minhas && minhas.indexOf(r[COL['Loja']]) < 0) continue;
    if (f.data && r[COL['Data']] !== f.data) continue;
    if (placa && r[COL['Placa']].replace(/[^A-Z0-9]/g, '').indexOf(placa) < 0) continue;
    achadas.push(r);
  }
  const pagina = Math.max(0, Number(f.pagina) || 0);
  const fatia = achadas.slice(pagina * APP.porPagina, (pagina + 1) * APP.porPagina);
  return {
    total: achadas.length,
    pagina: pagina,
    paginas: Math.ceil(achadas.length / APP.porPagina),
    itens: fatia.map(r => ({
      data: r[COL['Data']], hora: r[COL['Hora']], placa: r[COL['Placa']], loja: r[COL['Loja']],
      responsavel: r[COL['Responsável']], endereco: r[COL['Endereço']], codigo: r[COL['Código da foto']],
      manual: r[COL['Placa digitada à mão']] === 'Sim',
      miniatura: miniatura_(r[COL['ID da miniatura']], r[COL['ID do arquivo']]),
    })),
  };
}

/** Foto em tamanho cheio, para abrir na tela de consulta. */
function verFoto(token, codigo) {
  const u = sessao_(token);
  const r = linhaPorCodigo_(planilha_(), codigo);
  if (!r) throw new Error('Foto não encontrada.');
  if (u.perfil !== 'Admin' && u.lojas.indexOf(r.loja) < 0) throw new Error('Você não tem acesso a esta foto.');
  const blob = DriveApp.getFileById(r.arquivoId).getBlob();
  return { imagem: Utilities.base64Encode(blob.getBytes()), nome: blob.getName() };
}

// ===========================================================================
// Administração (perfil Admin)
// ===========================================================================

/** Apaga a foto de vez: arquivo e miniatura no Drive (sem lixeira) e a linha da planilha. */
function apagarFoto(token, codigo) {
  const eu = admin_(token);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = planilha_();
    const r = linhaPorCodigo_(ss, codigo);
    if (!r) throw new Error('Foto não encontrada. Talvez já tenha sido apagada.');
    [r.arquivoId, r.miniaturaId].filter(Boolean).forEach(apagarArquivo_);
    ss.getSheetByName(APP.abaFotos).deleteRow(r.linha);
    console.log('Foto ' + codigo + ' apagada por ' + eu.usuario);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function listarUsuarios(token) {
  admin_(token);
  const sh = planilha_().getSheetByName(APP.abaUsuarios);
  const linhas = sh.getDataRange().getValues().slice(1);
  return linhas.filter(r => r[0]).map(r => ({
    usuario: String(r[0]), nome: String(r[1]), perfil: String(r[2]), loja: String(r[3]), lojas: separarLojas_(r[3]),
    ativo: r[4] === 'Sim', trocar: r[5] === 'Sim',
  }));
}

/** Cria ou altera um usuário. u = { usuario, nome, perfil, lojas: [nomes] (ou loja), ativo, senha?, novo } */
function salvarUsuario(token, u) {
  const eu = admin_(token);
  const usuario = String(u.usuario || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) throw new Error('Usuário deve ter de 3 a 30 letras ou números, sem espaços nem acentos.');
  const nome = String(u.nome || '').trim();
  if (!nome) throw new Error('Informe o nome da pessoa.');
  const perfil = u.perfil === 'Admin' ? 'Admin' : 'Loja';
  const validas = listaLojas_().map(l => l.nome);
  const lojas = (Array.isArray(u.lojas) ? u.lojas.map(x => String(x).trim()) : separarLojas_(u.loja))
    .filter((l, i, a) => l && a.indexOf(l) === i);
  if (perfil === 'Loja' && !lojas.length) throw new Error('Escolha pelo menos uma loja para este usuário.');
  const invalida = lojas.filter(l => validas.indexOf(l) < 0)[0];
  if (perfil === 'Loja' && invalida) throw new Error('Loja desconhecida: ' + invalida + '.');
  if (usuario === eu.usuario && (perfil !== 'Admin' || !u.ativo)) throw new Error('Você não pode tirar o seu próprio acesso de administrador.');

  const sh = planilha_().getSheetByName(APP.abaUsuarios);
  const existente = buscarUsuario_(usuario);
  if (u.novo && existente) throw new Error('Já existe o usuário "' + usuario + '".');
  if (!existente && !u.senha) throw new Error('Defina uma senha provisória para o novo usuário.');

  let hash = existente ? existente.hash : '', sal = existente ? existente.sal : '', trocar = existente ? existente.trocar : 'Sim';
  if (u.senha) {
    validarSenha_(u.senha);
    sal = Utilities.getUuid(); hash = hash_(u.senha, sal); trocar = 'Sim';
  }
  const linha = [usuario, nome, perfil, perfil === 'Admin' ? '' : lojas.join(SEP_LOJAS), u.ativo ? 'Sim' : 'Não', trocar, hash, sal];
  if (existente) sh.getRange(existente.linha, 1, 1, linha.length).setValues([linha]);
  else sh.appendRow(linha.concat([new Date()]));
  return listarUsuarios(token);
}

// ===========================================================================
// Funções internas
// ===========================================================================

function cfg_() {
  const props = PropertiesService.getScriptProperties();
  const ss = abrir_(() => SpreadsheetApp.openById(props.getProperty('SHEET_ID')));
  const pasta = abrir_(() => DriveApp.getFolderById(props.getProperty('FOLDER_ID')));
  if (ss && pasta && ss.getSheetByName(APP.abaUsuarios)) return { ss: ss, pasta: pasta };
  return configurar();
}

function planilha_() { return cfg_().ss; }

function abrir_(fn) {
  try { return fn(); } catch (e) { return null; }
}

function subpasta_(pai, nome) {
  const it = pai.getFoldersByName(nome);
  return it.hasNext() ? it.next() : pai.createFolder(nome);
}

function hash_(senha, sal) {
  let h = sal + '|' + senha;
  for (let i = 0; i < 100; i++) {
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + sal, Utilities.Charset.UTF_8));
  }
  return h;
}

function senhaAleatoria_() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}

function validarSenha_(s) {
  if (String(s || '').length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
}

function buscarUsuario_(usuario) {
  const sh = planilha_().getSheetByName(APP.abaUsuarios);
  const linhas = sh.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    const r = linhas[i];
    if (String(r[0]).trim().toLowerCase() === usuario) {
      return {
        linha: i + 1, usuario: usuario, nome: String(r[1]), perfil: r[2] === 'Admin' ? 'Admin' : 'Loja',
        loja: separarLojas_(r[3])[0] || '', lojas: separarLojas_(r[3]), ativo: String(r[4]), trocar: String(r[5]), hash: String(r[6]), sal: String(r[7]),
      };
    }
  }
  return null;
}

function publico_(u) {
  return { usuario: u.usuario, nome: u.nome, perfil: u.perfil, loja: u.loja, lojas: u.lojas || [], trocarSenha: u.trocar === 'Sim' };
}

// Várias lojas por usuário ficam na mesma célula, separadas por ";".
const SEP_LOJAS = '; ';
function separarLojas_(v) {
  return String(v || '').split(';').map(x => x.trim()).filter(Boolean);
}

/** Loja que o usuário pode usar: admin usa a pedida; loja só uma das suas (ou a única que tem). */
function lojaPermitida_(u, pedida) {
  pedida = String(pedida || '').trim();
  if (u.perfil === 'Admin') return pedida;
  if (u.lojas.indexOf(pedida) >= 0) return pedida;
  return u.lojas.length === 1 ? u.lojas[0] : '';
}

/** Valida o token e devolve o usuário atual. Erro "SESSAO" faz o app pedir login de novo. */
function sessao_(token) {
  if (!token) throw new Error('SESSAO');
  const bruto = PropertiesService.getScriptProperties().getProperty('sess_' + token);
  if (!bruto) throw new Error('SESSAO');
  const s = JSON.parse(bruto);
  if (s.exp < Date.now()) { sair(token); throw new Error('SESSAO'); }
  const u = buscarUsuario_(s.u);
  if (!u || u.ativo !== 'Sim') { sair(token); throw new Error('SESSAO'); }
  return u;
}

function admin_(token) {
  const u = sessao_(token);
  if (u.perfil !== 'Admin') throw new Error('Somente administradores podem fazer isso.');
  return u;
}

function limparSessoes_(props) {
  const todas = props.getProperties();
  Object.keys(todas).forEach(k => {
    if (k.indexOf('sess_') !== 0) return;
    try { if (JSON.parse(todas[k]).exp < Date.now()) props.deleteProperty(k); } catch (e) { props.deleteProperty(k); }
  });
}

/** Filiais da aba Lojas: [{ codigo, nome, bandeira }]. Inativas ficam de fora, salvo se pedir todas. */
function listaLojas_(todas) {
  const sh = planilha_().getSheetByName(APP.abaLojas);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getDisplayValues()
    .map(r => ({ codigo: r[0].trim(), nome: r[1].trim(), bandeira: r[2].trim(), ativa: !/^n/i.test(r[3].trim()) }))
    .filter(l => l.nome && (todas || l.ativa))
    .map(l => ({ codigo: l.codigo, nome: l.nome, bandeira: l.bandeira }));
}

function linhaPorCodigo_(ss, codigo) {
  if (!codigo) return null;
  const sh = ss.getSheetByName(APP.abaFotos);
  const ultima = sh.getLastRow();
  if (ultima < 2) return null;
  const achou = sh.getRange(2, COL['Código da foto'] + 1, ultima - 1, 1)
    .createTextFinder(codigo).matchEntireCell(true).findNext();
  if (!achou) return null;
  const r = sh.getRange(achou.getRow(), 1, 1, CABECALHO.length).getDisplayValues()[0];
  return { linha: achou.getRow(), loja: r[COL['Loja']], url: r[COL['Foto (link)']], arquivoId: r[COL['ID do arquivo']],
    miniaturaId: r[COL['ID da miniatura']] };
}

// Apaga o arquivo do Drive sem passar pela lixeira; se não der, manda para a lixeira.
function apagarArquivo_(id) {
  const r = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id), {
    method: 'delete', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true,
  });
  const c = r.getResponseCode();
  if (c >= 300 && c !== 404) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) {} }
}

function contagemLojaDia_(ss, loja, data) {
  const sh = ss.getSheetByName(APP.abaFotos);
  const ultima = sh.getLastRow();
  if (ultima < 2) return 0;
  return sh.getRange(2, 2, ultima - 1, 4).getDisplayValues().filter(r => r[0] === data && r[3] === loja).length;
}

function miniatura_(miniId, arquivoId) {
  try {
    if (miniId) return Utilities.base64Encode(DriveApp.getFileById(miniId).getBlob().getBytes());
    const t = DriveApp.getFileById(arquivoId).getThumbnail(); // fotos antigas, sem miniatura própria
    return t ? Utilities.base64Encode(t.getBytes()) : '';
  } catch (e) {
    return '';
  }
}

/** OCR do Google Drive: converte a imagem num Google Doc temporário e lê o texto. */
function ocr_(b64) {
  let erroRest;
  try {
    return ocrRest_(b64);
  } catch (e) {
    erroRest = String(e.message || e);
  }
  if (typeof Drive === 'undefined') throw new Error(erroRest);
  try {
    return ocrServico_(b64); // serviço avançado "Drive API", se estiver ligado
  } catch (e) {
    throw new Error(erroRest + ' | ' + String(e.message || e));
  }
}

// Leitura pelo Google Drive: envia a imagem convertendo para Google Docs (OCR) e lê o texto.
function ocrRest_(b64) {
  const cab = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  const f = 'inventario' + Date.now();
  const meta = JSON.stringify({ name: 'ocr-placa', mimeType: 'application/vnd.google-apps.document' });
  const corpo = Utilities.newBlob('--' + f + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta +
      '\r\n--' + f + '\r\nContent-Type: image/jpeg\r\n\r\n').getBytes()
    .concat(Utilities.base64Decode(b64))
    .concat(Utilities.newBlob('\r\n--' + f + '--').getBytes());
  const r = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&ocrLanguage=pt&fields=id', {
    method: 'post', contentType: 'multipart/related; boundary=' + f, payload: corpo, headers: cab, muteHttpExceptions: true,
  });
  if (r.getResponseCode() >= 300) throw new Error('Drive ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
  const id = JSON.parse(r.getContentText()).id;
  try {
    const t = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '/export?mimeType=text/plain',
      { headers: cab, muteHttpExceptions: true });
    if (t.getResponseCode() >= 300) throw new Error('Drive ' + t.getResponseCode() + ': ' + t.getContentText().slice(0, 300));
    return t.getContentText();
  } finally {
    UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id, { method: 'delete', headers: cab, muteHttpExceptions: true });
  }
}

function ocrServico_(b64) {
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', 'placa.jpg');
  let id;
  if (Drive.Files.insert) { // Drive API v2
    // na v2 o OCR já cria um Google Docs; informar o tipo de destino faz a API recusar
    id = Drive.Files.insert({ title: 'ocr-placa' }, blob, { ocr: true, ocrLanguage: 'pt' }).id;
  } else { // Drive API v3
    id = Drive.Files.create({ name: 'ocr-placa', mimeType: MimeType.GOOGLE_DOCS }, blob,
      { ocrLanguage: 'pt', fields: 'id' }).id;
  }
  try {
    return DocumentApp.openById(id).getBody().getText();
  } finally {
    try { Drive.Files.remove(id); } catch (e) {
      try { DriveApp.getFileById(id).setTrashed(true); } catch (e2) {}
    }
  }
}

/** Endereço a partir das coordenadas, com cache de 6 h por ponto (~10 m). */
function endereco_(lat, lng) {
  const chave = 'end_' + Number(lat).toFixed(4) + '_' + Number(lng).toFixed(4);
  const cache = CacheService.getScriptCache();
  const salvo = cache.get(chave);
  if (salvo) return salvo;
  try {
    const r = Maps.newGeocoder().setLanguage('pt-BR').reverseGeocode(lat, lng);
    const end = (r && r.results && r.results[0]) ? r.results[0].formatted_address : '';
    if (end) cache.put(chave, end, 21600);
    return end;
  } catch (e) {
    return '';
  }
}
