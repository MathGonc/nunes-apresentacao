/* Página "Como vai ficar": TOTVS RM → Servidor de Integração → RP Info, por API, com cenários de erro. */
(function () {
  'use strict';
  const { $, $$, h, wait, art } = App;

  App.paintArt(document);
  App.initToolbar();
  App.initCounters([
    { key: 'arq', label: 'arquivos intermediários', tone: 'ok', hint: 'antes: cerca de 43 por mês' },
    { key: 'red', label: 'redigitações', tone: 'ok', hint: 'antes: 15 retrabalhos por mês' },
    { key: 'lanc', label: 'lançamentos gravados', tone: 'rp', hint: 'direto no RP Info, pela API' },
    { key: 'lojas', label: 'lojas conferidas', tone: 'api', hint: 'débito = crédito, loja por loja' },
  ]);

  const stage = $('#stage');
  const fechar = $('.node[data-id="fechar"]');
  const pipeCard = $('#pipe');
  const cad = $('#cadastro');
  const lanc = $('#lancamentos');
  const conf = $('#conferencia');
  const hist = $('#historico');
  const links = App.links(stage);
  links.svg.classList.add('idle');

  const stageTiles = App.LOJAS.map(([c, q]) => {
    const t = h('div', 'tile off', `${c}<small>${App.fmt(q)}</small>`);
    $('#tiles').appendChild(t);
    return t;
  });

  requestAnimationFrame(() => {
    links.add(fechar, pipeCard, 'api', '', { instant: true });
    links.add(pipeCard, cad, 'api', '', { instant: true });
    links.add(pipeCard, lanc, 'api', '', { instant: true });
    links.add(pipeCard, conf, 'api', '', { instant: true });
  });

  const setStatus = (t) => ($('.node-status', fechar).textContent = t);
  const pipe = (k, state, note) => {
    const li = $(`.pipe li[data-k="${k}"]`);
    li.className = state || '';
    $('small', li).textContent = note || '';
  };
  const scenario = () => $('input[name="cen"]:checked').value;
  const n = (v) => App.fmt(Math.round(v));
  const clock = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  function reset() {
    $$('.pipe li').forEach((li) => { li.className = ''; $('small', li).textContent = ''; });
    stageTiles.forEach((t) => (t.className = 'tile off'));
    if (App.counters.lanc.value) App.setCount('lanc', 0);
    if (App.counters.lojas.value) App.setCount('lojas', 0);
    $('.conf-txt', conf).textContent = 'A integração lê de volta o que foi gravado e compara com o que enviou';
  }

  async function run(sc) {
    reset();
    links.svg.classList.remove('idle');
    const m = App.modal({
      title: 'Fechamento da folha · 08/2026', subtitle: 'TOTVS RM → Servidor de Integração → RP Info, direto por API',
      icon: art.closeRm, tone: 'api', layout: 'api', steps: 10,
    });
    const flow = App.flow(m.flowEl);
    const P = (html) => m.setPanel(html);
    const err = (title, body) => `<div class="card-msg err"><b>${title}</b>${body}</div>`;
    const events = [];

    /* 1 · evento */
    pipe('evento', 'run');
    flow.active('rm');
    let s = m.step('Folha fechada no TOTVS RM', 'O fechamento dispara a integração sozinho').loading();
    P('<div class="panel-title">Competência</div><div class="bignum tone-rm"><strong>08/2026</strong><span>17 lojas · 1.078 colaboradores</span></div>');
    await flow.packet('rm', 'srv', { label: 'folha fechada', color: '#0e8088' });
    m.log('POST', '/api/v1/eventos/rm/folha-fechada', '202 aceito');
    s.done();
    pipe('evento', 'ok');

    /* 2 · autenticação */
    pipe('auth', 'run');
    flow.active('srv');
    s = m.step('Autenticando no RM e no RP Info', 'Credenciais guardadas no servidor, renovadas sozinhas').loading();
    await Promise.all([flow.packet('srv', 'rp', { label: 'token' }), flow.packet('srv', 'rm', { label: 'login' })]);
    m.log('POST', '/v1.2/auth', '200 token');
    m.log('RM', 'wsDataServer · usuário de serviço', '200 ok');
    s.done();
    pipe('auth', 'ok');

    /* 3 · leitura da folha */
    async function lerFolha(again) {
      pipe('ler', 'run');
      flow.active('rm');
      const st = m.step(again ? 'Lendo a folha corrigida no RM' : 'Lendo os lançamentos da folha no RM', 'Conta, débito/crédito e valor de cada lançamento').loading();
      P('<div class="panel-title">Lançamentos lidos</div><div class="bignum tone-rm"><strong class="n">0</strong><span>lançamentos da folha</span></div>');
      await Promise.all([
        flow.packet('rm', 'srv', { count: 5, gap: 160, color: '#0e8088', label: 'lançamentos' }),
        App.countUp($('.n', m.panel), 0, 7853, 1300, n),
      ]);
      m.log('RM', 'wsDataServer · ReadView · lançamentos 08/2026', '200 7.853 linhas');
      st.done('7.853');
      pipe('ler', 'ok', '7.853');
    }
    await lerFolha(false);

    /* 4 · CPF */
    pipe('cpf', 'run');
    flow.active('srv');
    s = m.step('Identificando cada colaborador pelo CPF', 'Consulta só quem está na folha · nada fica salvo em pasta').loading();
    P('<div class="panel-title">Colaboradores identificados</div><div class="bignum tone-rp"><strong class="n">0</strong><span>de 1.078 · pelo CPF</span></div><div class="note">CPFs mascarados nesta apresentação.</div>');
    const cpfLog = (async () => {
      for (const c of ['482', '117', '906', '351', '774']) {
        m.log('GET', `/v1.2/funcionario/codcpf/•••.${c}.•••-••`, '200');
        await wait(240);
      }
      m.log('GET', '… 1.078 consultas', '200 todos encontrados');
    })();
    await Promise.all([flow.packet('srv', 'rp', { count: 5, gap: 210, dur: 520, label: 'CPF' }), App.countUp($('.n', m.panel), 0, 1078, 1400, n), cpfLog]);
    s.done('1.078');
    pipe('cpf', 'ok', '1.078');
    $('.cad-n', cad).textContent = '1.078 consultas por CPF';

    /* 5 · regras (cenário: rubrica nova) */
    if (sc === 'rubrica') {
      pipe('regras', 'run');
      s = m.step('Aplicando regras e tabelas de lojas e contas').loading();
      await wait(1000);
      s.error('envio travado');
      pipe('regras', 'err', 'travado');
      flow.mark('srv', 'error');
      m.log('—', 'regra: rubrica 020 sem conta contábil', '422 travado', 'err');
      P(err('Rubrica nova sem classificação', 'A rubrica <b style="display:inline">020 · Gratificação</b> apareceu na folha e ainda não tem conta contábil: 12 lançamentos em 3 lojas.') +
        '<div class="card-msg info"><b>Nada foi enviado ao RP Info</b>A Controladoria classifica a rubrica uma única vez, no cadastro. Vale para as 17 lojas.</div>' +
        '<div class="select-row">Grupo de despesa <select><option>Salários e Ordenados</option><option>Gratificações</option><option>Horas Extras</option></select></div>');
      await m.action('Classificar e continuar', 'primary attention');
      m.recover();
      flow.mark('srv', 'active');
      m.log('PUT', '/api/v1/cadastros/de-para/contas', '200 rubrica 020');
      m.addTotal(1);
      m.step('Rubrica 020 classificada no cadastro', 'Uma única vez, para todas as lojas').done('1 vez');
      events.push('rubrica 020 classificada no cadastro');
    }
    pipe('regras', 'run');
    s = m.step(sc === 'rubrica' ? 'Reaplicando regras e tabelas' : 'Aplicando regras e tabelas de lojas e contas', 'Lojas, contas e classificação em cadastro, não em planilha').loading();
    P('<div class="panel-title">Regras aplicadas</div><div class="kv"><span>Regras de negócio</span><b>11</b><span>Tabela de lojas</span><b>17 lojas</b><span>Contas contábeis</span><b>23</b><span>Linhas descartadas em silêncio</span><b>0</b></div>');
    await wait(1100);
    s.done();
    pipe('regras', 'ok');

    /* 6 · validação (cenário: loja não fecha) */
    async function validar(fail) {
      pipe('valida', 'run');
      flow.active('srv');
      const st = m.step('Validando: débito = crédito em cada loja', 'E toda pessoa e toda rubrica reconhecidas').loading();
      P('<div class="panel-title">Fechamento por loja</div><div class="tiles"></div><div class="kv"><span>Débito</span><b class="d">R$ 0,00</b><span>Crédito</span><b class="c">R$ 0,00</b></div>');
      const box = $('.tiles', m.panel);
      const tiles = App.LOJAS.map(([c]) => { const t = h('div', 'tile', c); box.appendChild(t); return t; });
      let deb = 0, cred = 0;
      for (let i = 0; i < App.LOJAS.length; i++) {
        const [c, , v] = App.LOJAS[i];
        deb += v;
        cred += fail && c === '008' ? v - 133.74 : v;
        $('.d', m.panel).textContent = App.brl(deb);
        $('.c', m.panel).textContent = App.brl(cred);
        if (fail && c === '008') {
          tiles[i].className = 'tile err';
          st.error('loja 008');
          pipe('valida', 'err', 'loja 008');
          return false;
        }
        tiles[i].className = 'tile ok';
        await wait(110);
      }
      st.done(App.brl(App.TOTAL));
      pipe('valida', 'ok', '17/17');
      return true;
    }

    if (!(await validar(sc === 'loja'))) {
      flow.mark('srv', 'error');
      m.log('POST', '/api/v1/folha/2026-08/validar', '422 lote travado', 'err');
      P(err('Loja 008: débito ≠ crédito', 'Débito R$ 169.120,84 × crédito R$ 168.987,10 · diferença de <b style="display:inline">R$ 133,74</b>.') +
        '<div class="card-msg info"><b>Nada foi enviado ao RP Info</b>A integração devolve o motivo ao RM. O DP corrige a folha da loja 008 e o envio roda de novo.</div>');
      await flow.packet('srv', 'rm', { label: 'retorna com o motivo', color: '#c0392b', r: 8 });
      flow.mark('rm', 'error');
      m.log('RM', 'aviso ao DP · loja 008 com diferença de R$ 133,74', 'enviado', 'warn');
      await m.action('Corrigir no RM e reenviar', 'danger attention');
      m.recover();
      flow.mark('srv', null);
      m.addTotal(3);
      flow.active('rm');
      s = m.step('DP corrige a folha da loja 008 no RM').loading();
      await wait(1000);
      s.done('corrigido');
      await flow.packet('rm', 'srv', { label: 'folha corrigida', color: '#0e8088' });
      m.log('POST', '/api/v1/eventos/rm/folha-fechada', '202 aceito');
      events.push('loja 008 travada na validação, corrigida no RM e reenviada');
      await lerFolha(true);
      await validar(false);
    }

    /* 7 · aprovação */
    pipe('aprova', 'run');
    flow.active('srv');
    s = m.step('Aguardando a aprovação do responsável', 'Resumo do lote antes do envio').waiting('aguardando');
    P('<div class="card-msg info"><b>Lote 08/2026 pronto para envio</b><div class="kv"><span>Lançamentos</span><b>7.853</b><span>Lojas</span><b>17</b>' +
      `<span>Colaboradores</span><b>1.078</b><span>Débito = Crédito</span><b>${App.brl(App.TOTAL)}</b><span>Erros</span><b>0</b></div></div>`);
    await m.action('Aprovar o lote', 'primary attention');
    m.log('POST', '/api/v1/folha/2026-08/aprovar', '200 aprovado');
    s.done('aprovado');
    pipe('aprova', 'ok');

    /* 8 · envio */
    pipe('envia', 'run');
    flow.active('rp');
    s = m.step('Enviando 17 documentos ao RP Info', 'Um documento por loja · sem arquivo, sem Ctrl+D').loading();
    P('<div class="panel-title">Documentos gravados</div><div class="bignum tone-rp"><strong class="n">0</strong><span>de 17 lojas</span></div><div class="tiles"></div>');
    const box = $('.tiles', m.panel);
    const sent = App.LOJAS.map(([c, q]) => { const t = h('div', 'tile off', `${c}<small>${App.fmt(q)}</small>`); box.appendChild(t); return t; });
    for (let i = 0; i < App.LOJAS.length; i++) {
      const [c, q] = App.LOJAS[i];
      await flow.packet('srv', 'rp', { dur: 300, r: 6 });
      sent[i].className = 'tile sent';
      stageTiles[i].className = 'tile sent';
      $('.n', m.panel).textContent = i + 1;
      m.log('POST', `/v1.0/fde · loja ${c} · ${App.fmt(q)} lançamentos`, `201 recibo 0826-${c}`);
    }
    s.done('17/17');
    pipe('envia', 'ok', '17/17');

    /* 9 · conferência e histórico */
    pipe('confere', 'run');
    s = m.step('Conferindo o que foi gravado', 'Lê de volta do RP Info e compara com o que foi enviado').loading();
    P('<div class="panel-title">Conferência automática</div><div class="kv"><span>Enviado</span><b>7.853</b><span>Gravado no RP Info</span><b class="g">0</b>' +
      `<span>Débito = Crédito</span><b>${App.brl(App.TOTAL)}</b></div>`);
    await Promise.all([flow.packet('rp', 'srv', { label: 'lê de volta', count: 3, gap: 200, color: '#5f8f4e' }), App.countUp($('.g', m.panel), 0, 7853, 1100, n)]);
    m.log('GET', '/v1.0/contabil/movimentos · 08/2026', '200 7.853 = 7.853');
    s.done('bateu');
    s = m.step('Histórico registrado', 'O que entrou, o que saiu, quem aprovou e os 17 recibos').loading();
    await wait(800);
    m.log('GET', '/api/v1/execucoes/2026-08', '200 registrado');
    s.done();
    pipe('confere', 'ok');
    ['rm', 'srv', 'rp'].forEach((k) => flow.mark(k, 'ok'));
    P('<div class="card-msg ok"><b>Folha lançada no RP Info</b>7.853 lançamentos em 17 lojas, conferidos automaticamente.</div>' +
      '<div class="kv"><span>Arquivos intermediários</span><b>0</b><span>Redigitações</span><b>0</b><span>Planilhas</span><b>0</b></div>');
    await m.finish('Concluir');
    await m.close();

    /* palco depois da execução */
    links.svg.classList.add('idle');
    $('.conf-txt', conf).textContent = '7.853 enviados = 7.853 gravados · débito = crédito em todas as lojas';
    const empty = $('.empty', hist);
    if (empty) empty.remove();
    hist.prepend(h('li', '', `08/2026 · ${clock()} · 7.853 lançamentos · 17 lojas · aprovado · 17 recibos` +
      events.map((ev) => `<small>↳ ${ev}</small>`).join('')));
    await Promise.all([App.setCount('lanc', 7853), App.setCount('lojas', 17), App.setCount('arq', 0), App.setCount('red', 0)]);
  }

  let busy = false;
  fechar.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    fechar.classList.remove('ready');
    fechar.classList.add('running');
    setStatus('Em andamento');
    await run(scenario());
    fechar.classList.remove('running');
    fechar.classList.add('ready');
    setStatus('Clique para rodar de novo');
    busy = false;
  });
})();
