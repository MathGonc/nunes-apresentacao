/* Página "Como era": folha do Domínio até o RP Info, passando por arquivos e planilhas. */
(function () {
  'use strict';
  const { $, h, wait, art } = App;

  App.paintArt(document);
  App.initToolbar();
  App.initCounters([
    { key: 'arq', label: 'arquivos manipulados', tone: 'man' },
    { key: 'ret', label: 'retrabalhos manuais', tone: 'err' },
    { key: 'olho', label: 'conferências no olho', tone: 'dom' },
    { key: 'mao', label: 'passagens feitas à mão', tone: 'man' },
  ]);

  const stage = $('#stage');
  const tray = $('#tray');
  const links = App.links(stage);
  const node = (id) => $(`.node[data-id="${id}"]`, stage);
  const setStatus = (n, t) => ($('.node-status', n).textContent = t);

  /* Contadores e arquivos acumulam durante a etapa e aparecem quando o modal fecha. */
  const pending = [];
  const files = [];
  const later = (key, n) => pending.push([key, n || 1]);
  const newFile = (name, kind) => { later('arq'); files.push([name, kind]); };
  async function flush() {
    const empty = $('.tray-empty', tray);
    for (const [name, kind] of files.splice(0)) {
      if (empty) empty.remove();
      tray.appendChild(h('span', 'chip-file', art[kind] + name));
      await wait(140);
    }
    const sum = {};
    pending.splice(0).forEach(([k, n]) => (sum[k] = (sum[k] || 0) + n));
    await Promise.all(Object.entries(sum).map(([k, n]) => App.count(k, n)));
  }

  /* Dados ilustrativos (nomes e documentos fictícios). */
  const TXT_DOMINIO = [
    '"NUNES LJ 10 TERENOS",0000001,31/08/2026',
    '"NUNES LJ 10 TERENOS",0000001,31/08/2026,0331201,0000000,"Salário e Ordenados",000000000231550,"Vr. Pagto Salarios Ref Mês 08/2026","ANA PAULA FERREIRA"',
    '"NUNES LJ 10 TERENOS",0000001,31/08/2026,0331202,0000000,"Horas Extras",000000000073849,"Vr. Hora Extra Ref Mês 08/2026","ANA PAULA FERREIRA"',
    '"NUNES LJ 10 TERENOS",0000001,31/08/2026,0000000,0211415,"INSS retido da Folha",000000000025506,"Vr. Inss Retido a Pagar Ref Mês 08/2026","ANA PAULA FERREIRA"',
    '"NUNES LJ 10 TERENOS",0000001,31/08/2026,0331201,0000000,"Salário e Ordenados",000000000198000,"Vr. Pagto Salarios Ref Mês 08/2026","CARLOS EDUARDO LIMA"',
    '"NUNES LJ 10 TERENOS",0000001,31/08/2026,0000000,0211926,"Crédito Trabalhador - FGTS",000000000072472,"Crédito Trabalhador - Fgts Ref Mês","CARLOS EDUARDO LIMA"',
    '"NUNES LJ 10 TERENOS",0000001,31/08/2026,0000000,0211705,"Descontos - convênio quebra e adiantam",000000000004520,"Vr. Pagto Salarios Ref Mês 08/2026","MARIANA COSTA ROCHA"',
    '… mais 6.842 linhas',
  ];
  const TXT_DFUNC = [
    'Código;Unid.;Nome;Nascimento;Endereço;Pai;Mãe;Identidade;C.P.F.;PIS;Salário Contratual;Banco;Agência;Conta;… (76 campos)',
    '4817;010;ANA PAULA FERREIRA;••/••/1990;Rua ••••••, •••;••••••;••••••;••.•••.•••;•••.482.•••-••;•••.•••••.••-•;2.315,50;104;••••;•••••-•',
    '5203;003;CARLOS EDUARDO LIMA;••/••/1985;Av. ••••••, •••;••••••;••••••;••.•••.•••;•••.117.•••-••;•••.•••••.••-•;1.980,00;001;••••;•••••-•',
    '6634;008;JOSE APARECIDO DOS SANTOS;••/••/1979;Rua ••••••, •••;••••••;••••••;••.•••.•••;•••.906.•••-••;•••.•••••.••-•;2.104,10;237;••••;•••••-•',
    '7019;014;MARIANA COSTA ROCHA;••/••/1994;Rua ••••••, •••;••••••;••••••;••.•••.•••;•••.351.•••-••;•••.•••••.••-•;1.875,40;104;••••;•••••-•',
    '… mais 5.678 pessoas',
  ];
  const TXT_CSV = [
    'Cód. Loja MIX;Conta Nula;Conta;Data;Valor Corrigido;Historico_SemAcento;Código TT;Nome Colaborador;pger_tipo;D/C',
    '010;0;331201;31/08/2026;2315.50;Vr. Pagto Salarios Ref Mes 08/2026;4817;ANA PAULA FERREIRA;NN;DB',
    '010;0;331202;31/08/2026;738.49;Vr. Hora Extra Ref Mes 08/2026;4817;ANA PAULA FERREIRA;NN;DB',
    '010;0;211415;31/08/2026;255.06;Vr. Inss Retido a Pagar Ref Mes 08/2026;4817;ANA PAULA FERREIRA;CP;CR',
    '010;0;331207;31/08/2026;724.72;;128384;CARLOS EDUARDO LIMA;NN;DB',
    '010;0;211402;31/08/2026;724.72;;128384;CARLOS EDUARDO LIMA;CP;CR',
    '… mais 7.847 linhas',
  ];

  /* ------------------------------------------------------------ etapas */
  const S = {};

  S.ponto = async function () {
    const m = App.modal({ title: 'Apontamento do ponto', subtitle: 'Antes de fechar a folha · competência 08/2026', icon: art.clock, tone: 'dom', steps: 4 });
    const p = m.preview;
    await m.step('Fechar o ponto no dia 25', 'Registros de ponto de todas as lojas').run(900);
    let s = m.step('Lançar atestados e faltas até o dia 31', 'Digitados um a um').loading();
    const t = App.excel(p, {
      kind: 'dom', file: 'Domínio Folha · Atestados e faltas', head: ['Colaborador', 'Loja', 'Ocorrência', 'Dias'],
      rows: [['ANA PAULA FERREIRA', '010', 'Atestado médico', '2'], ['CARLOS EDUARDO LIMA', '003', 'Falta', '1'],
        ['MARIANA COSTA ROCHA', '014', 'Atestado médico', '3'], ['PEDRO HENRIQUE ALVES', '007', 'Falta', '1']],
    });
    await App.sweep(t.rows, 330);
    s.manual('feito à mão');
    s = m.step('Conferir os registros de ponto das 17 lojas', 'Loja por loja').loading();
    const card = h('div', 'card-msg info', '<b>Conferência loja por loja</b>Cada loja é aberta e conferida antes de liberar a folha.');
    p.appendChild(card);
    for (const c of App.chips17(card)) { c.classList.add('on'); await wait(95); c.classList.replace('on', 'ok'); }
    s.manual('17 lojas');
    await m.step('Ponto liberado para o fechamento da folha').run(650);
    await m.finish('Continuar');
    await m.close();
  };

  S.fechamento = async function () {
    const m = App.modal({ title: 'Fechamento da folha', subtitle: 'Domínio · análise do DP e rubricas novas', icon: art.close, tone: 'dom', steps: 5 });
    const p = m.preview;
    await m.step('Gerente do DP analisa a folha').run(900);
    await m.step('Enviar a prévia para a contabilidade', 'Trâmite até o dia 4').run(900);
    let s = m.step('Gerar o relatório de rubricas novas', 'Todas as lojas, menos a primeira linha').loading();
    const t = App.excel(p, {
      kind: 'dom', file: 'Domínio Folha · Rubricas sem configuração', head: ['Rubrica', 'Descrição', 'Situação'],
      rows: [['001', 'Salário', 'configurada'], ['050', 'INSS', 'configurada'], ['060', 'IRRF', 'configurada'], ['020', 'Gratificação', 'NOVA · sem configuração']],
    });
    await wait(900);
    t.rows[3].classList.add('bad');
    s.done('1 nova');
    s = m.step('Rubrica nova: 020 · Gratificação', 'Configurar loja por loja · não replicar, para não desconfigurar').waiting('ação manual');
    const card = h('div', 'card-msg warn', '<b>Configurar em cada loja, uma de cada vez</b><span class="lbl">Escolher o grupo de despesa e gravar · 0 de 17</span>');
    p.appendChild(card);
    const chips = App.chips17(card);
    await m.action('Configurar nas 17 lojas');
    s.loading();
    const lbl = $('.lbl', card);
    for (let i = 0; i < chips.length; i++) {
      chips[i].classList.add('on');
      lbl.textContent = `Loja ${chips[i].textContent} · grupo Salários · gravar · ${i + 1} de 17`;
      await wait(170);
      chips[i].classList.replace('on', 'ok');
    }
    s.manual('+1 retrabalho · 17×');
    later('ret');
    await m.step('Folha fechada no Domínio').run(700);
    await m.finish('Continuar');
    await m.close();
  };

  S.exportar = async function () {
    const m = App.modal({ title: 'Exportar arquivos do Domínio', subtitle: 'Relatórios salvos em Excel e TXT da folha', icon: art.export, tone: 'dom', steps: 4 });
    const p = m.preview;
    await m.step('Gerar o relatório Integração Contábil', 'Salvar em Excel, sobrescrevendo o anterior').run(950, 'xlsx');
    newFile('Integração Contábil.xlsx', 'xlsx');
    await m.step('Gerar o Resumo Mensal', 'Salvar em Excel, sobrescrevendo o anterior').run(950, 'xlsx');
    newFile('Resumo Mensal.xlsx', 'xlsx');
    const s = m.step('Exportar o TXT da folha', 'Valores em centavos, sem vírgula: 000000000231550 = R$ 2.315,50').loading();
    App.textFile(p, { file: 'Folha_Dominio.txt', tone: 'dom', lines: TXT_DOMINIO });
    await wait(1500);
    s.done('6.849 linhas');
    newFile('Folha_Dominio.txt', 'txt');
    const s2 = m.step('Levar os 3 arquivos para a pasta de rede').loading();
    await wait(900);
    s2.manual('passagem à mão');
    later('mao');
    await m.finish('Continuar');
    await m.close();
  };

  S.analise = async function () {
    const m = App.modal({ title: 'Conferência no Excel', subtitle: 'Análise.xlsx · relatórios do Domínio conferidos no olho', icon: art.excel, tone: 'man', steps: 3 });
    const p = m.preview;
    let s = m.step('Abrir a Análise.xlsx e atualizar com os relatórios').loading();
    const t = App.excel(p, {
      file: 'Análise.xlsx', sheets: ['INTEGRAÇÃO', 'RESUMO', 'BASE INTEGRAÇÃO'], formula: '=SOMASES(BASE!G:G;BASE!A:A;A2)',
      head: ['Loja', 'Débito', 'Crédito', 'Resumo', 'Conferido'],
      rows: App.LOJAS.map(([c, , v]) => ['Loja ' + c, v, v, v, '']),
    });
    await wait(1000);
    s.done();
    newFile('Análise.xlsx', 'xlsx');
    const check = async () => {
      for (const r of t.rows) {
        r.classList.add('scan');
        r.scrollIntoView({ block: 'nearest' });
        await wait(120);
        r.classList.remove('scan');
        r.classList.add('seen');
        r.lastElementChild.textContent = '✓';
      }
    };
    s = m.step('Conferir os valores no olho', 'Débito × crédito × resumo, loja por loja').loading();
    await check();
    s.manual('+1 retrabalho');
    later('ret'); later('olho');
    s = m.step('Desmarcar o FGTS e conferir de novo', 'Agora contra a aba RESUMO').loading();
    t.tabs.forEach((tb, i) => tb.classList.toggle('on', i === 1));
    t.rows.forEach((r) => { r.classList.remove('seen'); r.lastElementChild.textContent = ''; });
    await wait(400);
    await check();
    s.manual('conferência repetida');
    later('olho');
    await m.finish('Continuar');
    await m.close();
  };

  S.base = async function () {
    const m = App.modal({ title: 'Baixar a base de funcionários', subtitle: 'RP Info · base inteira exportada para a pasta de rede', icon: art.users, tone: 'rp', steps: 3 });
    const p = m.preview;
    await m.step('Abrir o RP Info e exportar a base de funcionários').run(900);
    const s = m.step('Gerar o TXT com a base inteira', '5.682 pessoas · 76 campos por pessoa').loading();
    App.textFile(p, { file: 'dfunc.txt', tone: 'rp', lines: TXT_DFUNC, header: true });
    await wait(1500);
    s.warn('dados pessoais');
    p.appendChild(h('div', 'card-msg err', '<b>Risco de proteção de dados (LGPD)</b>CPF, RG, filiação, endereço, salário e conta bancária de 5.682 pessoas, numa pasta de rede, todo mês. Tudo isso para descobrir o código da pessoa pelo nome.'));
    p.appendChild(h('div', 'note', 'Dados mascarados nesta apresentação.'));
    const s2 = m.step('Sobrescrever o dfunc.txt na pasta de rede').loading();
    await wait(1000);
    s2.manual('+1 retrabalho');
    later('ret'); later('mao');
    newFile('dfunc.txt', 'txt');
    await m.finish('Continuar');
    await m.close();
  };

  S.planilha = async function () {
    const m = App.modal({ title: 'Planilha de tratamento', subtitle: 'Excel com 8 consultas · as regras de negócio só existem aqui', icon: art.excel, tone: 'man', steps: 6 });
    const p = m.preview;
    let s = m.step('Abrir a planilha de tratamento').loading();
    const sheets = ['Importação', 'dFunc_RPMix', 'Plano_Gerencial', 'How To', 'Nomes Divergentes', 'BD_FGTS Acrescentar'];
    const t1 = App.excel(p, {
      file: 'Planilha de tratamento.xlsx', sheets,
      bar: '<div class="secbar"><b>AVISO DE SEGURANÇA</b> As conexões de dados externos foram desabilitadas <span class="fake-btn">Habilitar conteúdo</span></div>',
      head: ['Cód. Loja MIX', 'Conta', 'Valor', 'Código TT', 'Nome Colaborador', 'D/C'],
      rows: [['010', '331201', '2.315,50', '', 'ANA PAULA FERREIRA', 'DB'], ['010', '331202', '738,49', '', 'ANA PAULA FERREIRA', 'DB'], ['010', '211415', '255,06', '', 'ANA PAULA FERREIRA', 'CR']],
    });
    await wait(900);
    s.done();
    s = m.step('Habilitar conteúdo', 'Toda vez que a planilha é aberta').waiting('ação manual');
    await m.action('Habilitar conteúdo');
    const sec = $('.secbar', t1.el);
    sec.classList.add('ok');
    sec.innerHTML = '<b>Conteúdo habilitado</b> Conexões de dados externos ativas';
    s.manual();
    s = m.step('Dados → Atualizar tudo', '8 consultas leem os arquivos da pasta de rede').loading();
    const q = h('div', 'queries');
    p.appendChild(q);
    const names = [['Folha_Imp', 'Folha_Dominio.txt'], ['dfunc', 'dfunc.txt'], ['Planoger', 'Plano Gerencial RP.txt'], ['Cód_Lojas', 'de-para de lojas'],
      ['CNPJ', 'contas de terceiro'], ['FGTS_Crédito_Acrescentar', 'Folha_Dominio.txt'], ['Check_Nomes', 'nome × nome'], ['Códigos Inseridos', 'digitados à mão']];
    for (const [n, src] of names) {
      const d = h('div', '', `<i></i>${n}<small>${src}</small>`);
      q.appendChild(d);
      d.scrollIntoView({ block: 'nearest' });
      await wait(260);
      d.classList.add('ok');
    }
    t1.rows.forEach((r, i) => (r.children[4].textContent = ['4817', '4817', '4817'][i]));
    s.done('8 consultas');

    s = m.step('Nomes Divergentes: 1 colaborador sem correspondência', 'O nome no Domínio não bate com o nome no RP Info').loading();
    p.innerHTML = '';
    const t2 = App.excel(p, {
      file: 'Planilha de tratamento.xlsx', sheets, active: 4,
      head: ['Colaborador (Domínio)', 'Código', 'Colaborador (RP Info)', 'Inserir código'],
      rows: [['JOSÉ APARECIDO DOS SANTOS', '—', 'JOSE APARECIDO DOS SANTOS', '']],
    });
    await wait(700);
    t2.rows[0].classList.add('bad');
    s.warn('acento ≠ sem acento');
    p.appendChild(h('div', 'card-msg warn', '<b>A ligação é pelo nome, não pelo CPF</b>Um acento basta para a pessoa não ser encontrada. Alguém precisa achar o código e digitar.'));
    s = m.step('Digitar o código do colaborador à mão').waiting('ação manual');
    await m.action('Digitar o código');
    s.loading();
    const cell = t2.rows[0].lastElementChild;
    cell.classList.add('input');
    await App.type(cell, '6634', 200);
    t2.rows[0].classList.remove('bad');
    s.manual('+1 retrabalho');
    later('ret');
    await m.step('Atualizar tudo de novo').run(1000);
    newFile('Planilha de tratamento.xlsx', 'xlsx');
    await m.finish('Continuar');
    await m.close();
  };

  S.csv = async function () {
    const m = App.modal({ title: 'Gerar o CSV', subtitle: 'Arquivo que será importado no RP Info', icon: art.csv, tone: 'man', steps: 4 });
    const p = m.preview;
    await m.step('Salvar como CSV UTF-8', 'Na pasta “01-Histórico de Cargas”').run(950, 'csv');
    newFile('Importar_Folha.csv', 'csv');
    let s = m.step('Reabrir o arquivo').loading();
    const f = App.textFile(p, { file: 'Importar_Folha.csv', icon: art.csv, lines: TXT_CSV, header: true });
    await wait(1200);
    s.done();
    s = m.step('Apagar o cabeçalho à mão', 'Passo obrigatório antes de importar').waiting('ação manual');
    f.lines[0].classList.add('hl');
    await m.action('Apagar o cabeçalho');
    s.loading();
    f.lines[0].classList.replace('hl', 'del');
    await wait(700);
    f.lines[0].classList.add('gone');
    await wait(400);
    s.manual('+1 retrabalho');
    later('ret');
    await m.step('Arquivo pronto', '7.853 linhas').run(700, '7.853');
    await m.finish('Continuar');
    await m.close();
  };

  S.importar = async function () {
    const m = App.modal({ title: 'Importar no RP Info', subtitle: 'Lançar documentos (Ctrl+D)', icon: art.upload, tone: 'rp', steps: 5 });
    const p = m.preview;
    let s = m.step('Buscar o CSV na pasta de rede').loading();
    await wait(900);
    s.manual('passagem à mão');
    later('mao');
    s = m.step('Abrir “Lançar documentos”', 'Documento 2006 · data do último dia do mês').loading();
    const win = h('div', 'win rp', `<div class="win-bar">${art.rp}<span>RP Info · Lançar documentos (Ctrl+D)</span><span class="dots"><i></i><i></i><i></i></span></div>` +
      '<div class="form"><span>Documento</span><b>2006 · FIP Validação</b><span>Data do movimento</span><b>31/08/2026</b><span>Arquivo</span><b>Importar_Folha.csv</b><span>Linhas</span><b class="cnt">0</b></div>');
    p.appendChild(win);
    await wait(900);
    s.done();
    s = m.step('Importar as linhas').loading();
    const wrap = h('div', 'tone-rp');
    p.appendChild(wrap);
    const go = App.bar(wrap);
    await Promise.all([go(1, 1800), App.countUp($('.cnt', win), 0, 7853, 1800, (v) => App.fmt(Math.round(v)))]);
    s.done('7.853');
    s = m.step('Arquivo diferente do gerado · aceito mesmo assim', '11 colunas em vez de 10, zeros perdidos, formatos misturados').loading();
    await wait(800);
    s.warn('sem trava');
    p.appendChild(h('div', 'card-msg warn', '<b>Nenhuma trava contra erro</b>O RP Info aceitou um arquivo diferente do que a planilha gerou. O erro, se houver, só aparece depois.'));
    s = m.step('Conferir os totais na tela contra a Análise', 'Resumir por D ou C e comparar').loading();
    const t = App.excel(p, {
      kind: 'rp', file: 'RP Info · Movimento gerencial', head: ['Natureza', 'RP Info', 'Análise.xlsx', 'Conferido'],
      rows: [['Débito', App.TOTAL, App.TOTAL, ''], ['Crédito', App.TOTAL, App.TOTAL, '']],
    });
    for (const r of t.rows) { r.classList.add('scan'); await wait(700); r.classList.replace('scan', 'seen'); r.lastElementChild.textContent = '✓'; }
    s.manual('+1 retrabalho');
    later('ret'); later('olho');
    await m.finish('Continuar');
    await m.close();
  };

  S.pos = async function () {
    const m = App.modal({ title: 'Pós-importação', subtitle: 'RP Info · tudo feito à mão, depois de importar', icon: art.bank, tone: 'rp', steps: 4 });
    const p = m.preview;
    let s = m.step('Agrupar os líquidos por banco', 'Documento 3607 · conta 211301 · redigitar o valor de cada banco').loading();
    const t = App.excel(p, { kind: 'rp', file: 'RP Info · Documento 3607', head: ['Banco', 'Pendência', 'Valor digitado'], rows: [['Banco 1', 'líquidos', ''], ['Banco 2', 'líquidos', ''], ['Banco 3', 'líquidos', '']] });
    const vals = ['412.380,15', '298.144,02', '187.903,77'];
    for (let i = 0; i < t.rows.length; i++) {
      const c = t.rows[i].lastElementChild;
      c.classList.add('input');
      await App.type(c, vals[i], 70);
      c.classList.remove('input');
    }
    s.manual('+1 retrabalho');
    later('ret');
    s = m.step('Pensão: trocar o portador e digitar os dados bancários', 'Na observação de cada pendência').loading();
    const obs = h('div', 'win rp', `<div class="win-bar">${art.rp}<span>Pendência · pensão alimentícia</span></div><div class="form"><span>Portador</span><b class="pt"></b><span>Observação</span><b class="ob"></b></div>`);
    p.appendChild(obs);
    await App.type($('.pt', obs), 'Banco 2', 80);
    await App.type($('.ob', obs), 'Ag. 1234 · C/C 56789-0', 60);
    s.manual('+1 retrabalho');
    later('ret');
    s = m.step('Baixar 4 contas totalizadoras', 'Adiantamento de férias, rescisão, plano de saúde e sindicatos').loading();
    const card = h('div', 'card-msg info', '<b>Uma conta de cada vez</b>');
    const q = h('div', 'queries');
    card.appendChild(q);
    p.appendChild(card);
    for (const n of ['Adiantamento de férias', 'Rescisão contratual', 'Plano de saúde', 'Sindicatos']) {
      const d = h('div', '', `<i></i>${n}<small>baixar pendências</small>`);
      q.appendChild(d);
      d.scrollIntoView({ block: 'nearest' });
      await wait(420);
      d.classList.add('ok');
    }
    s.manual('+1 retrabalho');
    later('ret');
    s = m.step('Conferir no razão (F5) se a conta zerou').loading();
    await wait(1000);
    s.manual('conferência');
    later('olho');
    await m.finish('Concluir');
    await m.close();
  };

  /* --------------------------------------------- passagem entre etapas */
  const T = {
    ponto: { to: 'fechamento', tone: 'int' },
    fechamento: { to: 'exportar', tone: 'int' },
    exportar: { to: 'analise', tone: 'man', files: [['Integração Contábil.xlsx', 'xlsx'], ['Resumo Mensal.xlsx', 'xlsx']] },
    analise: { to: 'base', tone: 'man' },
    base: {
      to: 'planilha', tone: 'man', label: 'dfunc.txt', files: [['dfunc.txt', 'txt']],
      extra: { from: 'exportar', tone: 'man', label: 'TXT da folha', files: [['Folha_Dominio.txt', 'txt']] },
    },
    planilha: { to: 'csv', tone: 'man', files: [['Planilha de tratamento.xlsx', 'xlsx']] },
    csv: { to: 'importar', tone: 'man', label: 'importar à mão', files: [['Importar_Folha.csv', 'csv']] },
    importar: { to: 'pos', tone: 'int' },
  };

  async function pass(id) {
    const t = T[id];
    const from = node(id);
    const to = node(t.to);
    const draws = [links.add(from, to, t.tone, t.label)];
    if (t.extra) draws.push(links.add(node(t.extra.from), to, t.extra.tone, t.extra.label));
    await Promise.all(draws);
    const flights = (t.files || []).map(([n, k], i) => wait(i * 260).then(() => App.fly(from, to, art[k] + `<span>${n}</span>`)));
    if (t.extra) t.extra.files.forEach(([n, k]) => flights.push(App.fly(node(t.extra.from), to, art[k] + `<span>${n}</span>`)));
    await Promise.all(flights);
    to.classList.remove('locked');
    to.classList.add('ready');
    setStatus(to, 'Clique para continuar');
    to.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async function finale() {
    const m = App.modal({ title: 'Um mês de folha, do jeito de hoje', subtitle: 'Só o fluxo da folha · competência 08/2026', icon: art.dom, tone: 'man', steps: 1 });
    const p = m.preview;
    const c = App.counters;
    m.step('Folha lançada no RP Info', '9 etapas, 3 sistemas, 1 pessoa').done();
    m.step('Arquivos manipulados à mão', 'Relatórios, TXT, base de funcionários, planilhas e CSV').manual(String(c.arq.value));
    m.step('Retrabalhos manuais', 'Digitar, configurar loja a loja, apagar cabeçalho, redigitar valores').manual(String(c.ret.value));
    m.step('Conferências feitas no olho', 'Sem nenhuma trava contra erro').warn(String(c.olho.value));
    p.appendChild(h('div', 'card-msg warn', `<b>E isso é só a folha</b>As pendências de convênio, quebra de caixa e vale café somam mais <b style="display:inline">36 arquivos</b> e <b style="display:inline">6 retrabalhos</b> por mês: 17 TXT gerados um por loja, 17 importações no Domínio e 17 relatórios.`));
    p.appendChild(h('div', 'card-msg err', '<b>Total do mês: cerca de 43 arquivos e 15 retrabalhos</b>Com as regras de negócio escondidas numa planilha e o processo nas mãos de uma pessoa.'));
    m.status('Resumo');
    const goNext = m.action('Ver como vai ficar →', 'primary attention');
    await goNext;
    location.href = 'como-vai-ficar.html';
  }

  /* --------------------------------------------------------------- clique */
  let busy = false;
  stage.addEventListener('click', async (e) => {
    const n = e.target.closest('.node.ready');
    if (!n || busy) return;
    busy = true;
    const id = n.dataset.id;
    n.classList.remove('ready');
    n.classList.add('running');
    setStatus(n, 'Em andamento');
    await S[id]();
    n.classList.replace('running', 'done');
    setStatus(n, 'Concluído · feito à mão');
    await flush();
    if (T[id]) await pass(id);
    else await finale();
    busy = false;
  });
})();
