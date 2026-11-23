/* Site da Pousada dos Pinheiros.
   Os quartos, os preços, os horários e os pedidos vêm do sistema de reservas (Supabase), o mesmo do painel da pousada.
   Enquanto a pousada não estiver cadastrada no sistema, o site funciona pelo WhatsApp: busca, quartos e pedido viram mensagem. */
(async () => {
  const CONFIG = {
    // sistema de reservas (as chaves abaixo são as públicas, feitas para ficar no navegador; quem protege os dados são as regras do banco)
    supabaseUrl: "https://edybjkudmucoecxebdto.supabase.co",
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWJqa3VkbXVjb2VjeGViZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3MzczMDEsImV4cCI6MjExMDMxMzMwMX0.9nrfWHtZ1qaSIYeD5weG0hR5rgFOL5inMeRnp70UBGM",
    slug: "pousada-dos-pinheiros",                       // o endereço da pousada no sistema (sai do nome no cadastro)
    sistema: "https://pousada-gestao-theta.vercel.app",  // onde ficam "Acompanhar pedido" e o Aviso de Privacidade
    whatsapp: "5541992497056",                           // usado até a pousada se cadastrar; depois vale o do painel
    endereco: "Av. Dr. Agrícola Fonseca, 51\nCentro, Guaraqueçaba – PR",
    fotos: [
      ["img/1.jpg", "Piscina da pousada com a baía ao fundo"],
      ["img/2.jpg", "Pôr do sol sobre a piscina e a baía"],
      ["img/3.jpg", "A casa vermelha vista do pátio da piscina"],
      ["img/4.jpg", "O pátio e a pousada ao fim da tarde"]
    ]
  };

  /* ---------- utilidades ---------- */
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = v => "R$ " + Number(v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const pad = n => String(n).padStart(2, "0");
  const hoje = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const utc = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
  const addDias = (s, n) => { const t = new Date(utc(s) + n * 864e5); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
  const noites = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);
  const SEM = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"], MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const dia = d => { const t = new Date(d + "T12:00:00Z"); return `${SEM[t.getUTCDay()]}, ${t.getUTCDate()} de ${MES[t.getUTCMonth()]}`; };
  const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
  const erroTxt = e => { const m = String((e && (e.message || e)) || ""); if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão. Confira a internet e tente de novo."; return m.replace(/^.*?ERROR:\s*/, "") || "Não deu certo. Tente de novo."; };
  const MOV = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.toggle("anima", MOV);

  /* ---------- desenhos ---------- */
  const PINHEIRO_D = "M30 3 L45 33 Q30 28 15 33 Z M30 19 L50 55 Q30 49 10 55 Z M30 38 L55 80 Q30 73 5 80 Z M27 80 H33 V97 H27 Z";
  const PINHEIRO = `<svg viewBox="0 0 60 100" aria-hidden="true" focusable="false"><path d="${PINHEIRO_D}"/></svg>`;
  const GUARA = `<svg class="guara" viewBox="0 0 100 60" aria-hidden="true" focusable="false">
    <path class="asa" opacity=".5" d="M38 29 C39 18 47 9 59 5 C66 3 73 4 79 7 C73 9 70 13 68 18 C66 23 63 27 60 30 Z"/>
    <path d="M24 30 C36 23 60 23 75 29 C62 35 38 36 24 30 Z"/>
    <path class="tr" stroke-width="4.6" d="M29 29.5 L15 28.5"/><circle cx="14" cy="28.5" r="3.8"/>
    <path class="tr" stroke-width="1.9" d="M11 28.5 C6 29.5 3 33 0 38"/>
    <path class="tr" stroke-width="1.6" d="M73 29.5 L98 30.5 M73 31 L97 33"/>
    <path class="asa" d="M36 30 C36 18 44 8 57 3 C65 0 74 1 82 4 C76 7 72 11 70 17 C68 23 65 28 62 31 Z"/></svg>`;
  document.querySelectorAll('[data-desenho="pinheiro"]').forEach(el => { el.innerHTML = PINHEIRO; });
  document.querySelectorAll(".voo").forEach(el => { el.innerHTML = Array.from({ length: 5 }, () => `<span>${GUARA}</span>`).join(""); });
  // rodapé: duas fileiras de pinheiros; cada árvore é um <g> com a posição e um <path> dentro, que é o que balança
  const arvore = (x, s, cls) => `<g transform="translate(${x.toFixed(0)} ${(130 - 97 * s).toFixed(1)}) scale(${s.toFixed(2)})"><path class="${cls}" d="${PINHEIRO_D}"/></g>`;
  $("pinhal").innerHTML = Array.from({ length: 22 }, (_, i) => arvore(i * 72 + 14 + ((i * 41) % 17), .5 + ((i * 29) % 7) / 22, "b")).join("")
    + Array.from({ length: 24 }, (_, i) => arvore(i * 66 - 18 + ((i * 53) % 27), .6 + ((i * 37) % 9) / 18, "f")).join("");
  const onda = (y, amp, per) => { let d = `M0 ${y}`; for (let x = 0; x < 2400; x += per) d += ` Q${x + per / 4} ${y - amp} ${x + per / 2} ${y} T${x + per} ${y}`; return d + " L2400 60 L0 60 Z"; };
  $("onda-1").setAttribute("d", onda(30, 14, 600)); $("onda-2").setAttribute("d", onda(34, 10, 400));
  // "código de barras" de pinheiros no canhoto do bilhete
  (() => { let h = 2463534242, x = 2, out = ""; for (let i = 0; i < 12; i++) { h = (h * 1103515245 + 12345) >>> 0; const alt = 13 + (h >> 8) % 17, s = alt / 100; out += `<path transform="translate(${x.toFixed(1)} ${(30 - 97 * s).toFixed(1)}) scale(${s.toFixed(3)})" d="${PINHEIRO_D}"/>`; x += 60 * s + 3 + ((h >> 4) % 5); } $("codigo").innerHTML = out; })();

  /* ---------- dados da pousada ---------- */
  let P = null, sb = null;
  try {
    if (window.supabase && CONFIG.supabaseUrl && CONFIG.supabaseKey) {
      sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, { auth: { persistSession: false } });
      const r = await sb.rpc("site_pousada", { p_slug: CONFIG.slug }); if (!r.error) P = r.data || null;
    }
  } catch (e) { P = null; }
  const SISTEMA = !!P; // com a pousada cadastrada e aprovada: busca, ficha e pedido de verdade; sem ela: tudo pelo WhatsApp
  const Q = SISTEMA ? (P.quartos || []).slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true })) : [];
  const zap = (() => { let d = String((P && P.whatsapp) || CONFIG.whatsapp || "").replace(/\D/g, ""); if (d.length === 10 || d.length === 11) d = "55" + d; return d.length >= 12 ? d : ""; })();
  const linkZap = msg => `https://wa.me/${zap}?text=${encodeURIComponent(msg)}`;
  const urlSistema = pag => CONFIG.sistema ? `${CONFIG.sistema}/${pag}?p=${encodeURIComponent(CONFIG.slug)}` : "";

  // fatos da abertura, contato, links do rodapé e "Bom saber"
  const precoMin = Q.length ? Math.min(...Q.map(q => Number(q.diaria) || 0).filter(v => v > 0)) : 0;
  $("fatos").innerHTML = [
    SISTEMA && P.checkin_hora ? `<li>Entrada <b>${esc(P.checkin_hora)}</b></li>` : "",
    SISTEMA && P.checkout_hora ? `<li>Saída <b>${esc(P.checkout_hora)}</b></li>` : "",
    Q.length ? `<li>Quartos <b>${Q.length}</b></li>` : "",
    precoMin ? `<li>Diárias desde <b>${brl(precoMin)}</b></li>` : ""
  ].join("");
  if (zap) $("contato").innerHTML = `<a class="btn btn--zap" href="${linkZap("Olá! Vi o site da Pousada dos Pinheiros e queria saber mais.")}" target="_blank" rel="noopener">Falar no WhatsApp</a>`;
  if (SISTEMA && urlSistema("reserva.html")) $("link-acompanhar").href = urlSistema("reserva.html"); else $("link-acompanhar").remove();
  if (urlSistema("privacidade.html")) $("link-privacidade").href = urlSistema("privacidade.html"); else $("link-privacidade").remove();
  const ACESSO = { estrada: "De carro ou ônibus", barco: "Só de barco", ambos: "Pela estrada ou de barco" };
  const saber = [["Endereço", CONFIG.endereco]];
  if (SISTEMA && P.checkin_hora) saber.push(["Horários", `Entrada a partir das ${P.checkin_hora}.\nSaída até as ${P.checkout_hora}.`]);
  if (SISTEMA && (P.acesso || P.como_chegar)) saber.push(["Como chegar", [ACESSO[P.acesso], P.como_chegar].filter(Boolean).join(".\n")]);
  if (SISTEMA && (P.pagamentos || []).length) saber.push(["Pagamento", P.pagamentos.join(", ") + "."]);
  if (SISTEMA && P.politica) saber.push(["Cancelamento", P.politica]);
  $("saber-lista").innerHTML = saber.map(([t, v]) => `<div><dt>${esc(t)}</dt><dd>${esc(v)}</dd></div>`).join("");

  /* ---------- bilhete ---------- */
  const S = { entrada: hoje(), saida: addDias(hoje(), 1), adultos: 2, criancas: 0, livres: null, quarto: null, enviado: null };
  const pessoas = () => S.adultos + S.criancas;
  $("b-in").min = hoje(); $("b-in").value = S.entrada; $("b-out").min = addDias(hoje(), 1); $("b-out").value = S.saida;
  if (!SISTEMA) $("b-ver").textContent = "Perguntar no WhatsApp";
  // o sol percorre o arco entre a chegada e a saída quando as datas mudam
  const sc = $("sol-rota"), P0 = [6, 56], P1 = [100, -16], P2 = [194, 56]; let anim = 0;
  const poe = t => { const [x, y] = [0, 1].map(k => (1 - t) * (1 - t) * P0[k] + 2 * (1 - t) * t * P1[k] + t * t * P2[k]); sc.setAttribute("cx", x.toFixed(1)); sc.setAttribute("cy", y.toFixed(1)); };
  const viaja = () => { poe(.5); if (!MOV) return; cancelAnimationFrame(anim); const t0 = performance.now(); const passo = now => { const u = Math.min(1, (now - t0) / 1300); poe((1 - Math.pow(1 - u, 3)) * .5); if (u < 1) anim = requestAnimationFrame(passo); }; anim = requestAnimationFrame(passo); };
  function atualizaBilhete() {
    $("o-adultos").value = S.adultos; $("o-criancas").value = S.criancas;
    document.querySelectorAll("[data-conta]").forEach(b => { const v = S[b.dataset.conta] + Number(b.dataset.d); b.disabled = v < (b.dataset.conta === "adultos" ? 1 : 0) || v > 20; });
    const n = S.entrada && S.saida && S.saida > S.entrada ? noites(S.entrada, S.saida) : 0;
    $("b-noites").textContent = n ? `${plural(n, "noite", "noites")}, de ${dia(S.entrada)} a ${dia(S.saida)}` : "";
    $("n-noites").textContent = n || "–"; $("n-rotulo").textContent = n === 1 ? "noite" : "noites";
  }
  function limpaBusca() { if (S.livres) { S.livres = null; S.quarto = null; desenhaQuartos(); desenhaFicha(); } atualizaBilhete(); }
  $("b-in").addEventListener("change", e => { S.entrada = e.target.value; if (!S.saida || S.saida <= S.entrada) { S.saida = addDias(S.entrada, 1); $("b-out").value = S.saida; } $("b-out").min = addDias(S.entrada, 1); limpaBusca(); viaja(); });
  $("b-out").addEventListener("change", e => { S.saida = e.target.value; limpaBusca(); viaja(); });
  document.addEventListener("click", e => { const b = e.target.closest("[data-conta]"); if (!b) return; S[b.dataset.conta] = Math.max(0, S[b.dataset.conta] + Number(b.dataset.d)); limpaBusca(); });
  const vaiPara = id => $(id).scrollIntoView({ behavior: MOV ? "smooth" : "auto", block: "start" });

  $("bilhete").addEventListener("submit", async e => {
    e.preventDefault(); const err = $("b-erro"); err.hidden = true;
    const falha = !S.entrada || !S.saida ? "Escolha a data de chegada e a de saída." : S.entrada < hoje() ? "A chegada precisa ser a partir de hoje." : S.saida <= S.entrada ? "A saída precisa ser depois da chegada." : noites(S.entrada, S.saida) > 60 ? "Dá para pedir até 60 noites por vez." : "";
    if (falha) { err.textContent = falha; err.hidden = false; return; }
    if (!SISTEMA) { // sem o sistema: a pergunta vai pronta para o WhatsApp da pousada
      const msg = `Olá! Queria saber se há quarto livre de ${dia(S.entrada)} a ${dia(S.saida)} (${plural(noites(S.entrada, S.saida), "noite", "noites")}) para ${plural(S.adultos, "adulto", "adultos")}${S.criancas ? ` e ${plural(S.criancas, "criança", "crianças")}` : ""}.`;
      if (zap) window.open(linkZap(msg), "_blank", "noopener"); else { err.textContent = "O WhatsApp da pousada ainda não foi configurado."; err.hidden = false; }
      return;
    }
    const btn = $("b-ver"); btn.disabled = true; btn.textContent = "Procurando…";
    const { data, error } = await sb.rpc("quartos_disponiveis", { p_slug: CONFIG.slug, p_entrada: S.entrada, p_saida: S.saida });
    btn.disabled = false; btn.textContent = "Ver quartos livres";
    if (error) { err.textContent = erroTxt(error); err.hidden = false; return; }
    S.livres = new Map((data || []).map(r => [r.id, r])); S.quarto = null;
    desenhaQuartos(); desenhaFicha(); vaiPara("quartos");
  });

  /* ---------- quartos ---------- */
  function desenhaQuartos() {
    const leg = $("q-legenda"), lista = $("lista-q");
    if (!SISTEMA || !Q.length) {
      leg.textContent = "";
      lista.innerHTML = `<div class="vazio-q"><p>Os quartos e os valores aparecem aqui em breve. Por enquanto, a pousada responde pelo WhatsApp: escolha as datas no bilhete e mande a pergunta pronta.</p>${zap ? `<a class="btn btn--zap" href="${linkZap("Olá! Queria saber dos quartos e dos valores da Pousada dos Pinheiros.")}" target="_blank" rel="noopener">Perguntar dos quartos</a>` : ""}</div>`;
      return;
    }
    const n = noites(S.entrada, S.saida);
    if (!S.livres) leg.textContent = "Escolha as datas no bilhete para ver o que está livre e quanto fica a estadia.";
    else { const ok = Q.filter(q => S.livres.has(q.id) && q.capacidade >= pessoas()).length; leg.textContent = ok ? `${plural(ok, "quarto livre", "quartos livres")} para ${plural(pessoas(), "pessoa", "pessoas")}, ${dia(S.entrada)} a ${dia(S.saida)}.` : `Nenhum quarto livre para ${plural(pessoas(), "pessoa", "pessoas")} nessas datas. Tente outras datas${zap ? " ou fale com a pousada pelo WhatsApp" : ""}.`; }
    lista.innerHTML = Q.map(q => {
      const livre = S.livres && S.livres.get(q.id), pode = livre && q.capacidade >= pessoas(), esc0 = S.quarto === q.id;
      const situ = !S.livres ? "" : pode ? `<span class="situ livre">Livre</span>` : `<span class="situ">${livre ? `Cabem até ${q.capacidade}` : "Ocupado nessas datas"}</span>`;
      const preco = pode ? `<b>${brl(livre.total)}</b><span>${plural(n, "noite", "noites")}, ${brl(q.diaria)} cada</span>` : `<b>${brl(q.diaria)}</b><span>por noite</span>`;
      const acao = !S.livres ? `<a class="btn btn--borda" href="#bilhete" data-datas>Escolher datas</a>` : pode ? `<button class="btn ${esc0 ? "btn--cheio" : "btn--borda"}" data-escolher="${esc(q.id)}" aria-pressed="${esc0}">${esc0 ? "Quarto escolhido" : "Escolher este quarto"}</button>` : "";
      return `<article class="q rv ${esc0 ? "escolhido" : ""} ${S.livres && !pode ? "fora" : ""}"><div><h3>${esc(q.nome)}</h3><p class="tipo">${esc(q.tipo || "Quarto")}, para até ${plural(q.capacidade, "pessoa", "pessoas")}</p>${q.descricao ? `<p class="desc">${esc(q.descricao)}</p>` : ""}${situ}</div>
        <div class="lado"><span class="preco">${preco}</span>${acao}</div></article>`;
    }).join("");
    revela(lista.querySelectorAll(".q"), .08);
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-datas]")) { e.preventDefault(); $("bilhete").scrollIntoView({ behavior: MOV ? "smooth" : "auto", block: "center" }); setTimeout(() => $("b-in").focus(), 400); return; }
    const b = e.target.closest("[data-escolher]"); if (!b) return;
    S.quarto = b.dataset.escolher; desenhaQuartos(); desenhaFicha(); vaiPara("ficha");
    setTimeout(() => { const f = $("f-nome"); if (f) f.focus({ preventScroll: true }); }, 450);
  });

  /* ---------- ficha e pedido ---------- */
  function desenhaFicha() {
    const box = $("ficha-dentro");
    if (!SISTEMA) { box.innerHTML = ""; return; }
    if (S.enviado) {
      const r = S.enviado, q = Q.find(x => x.id === r.quarto);
      const msg = `Olá! Mandei o pedido ${r.cod} pelo site: ${q.nome}, de ${dia(r.entrada)} a ${dia(r.saida)}, ${plural(r.pessoas, "pessoa", "pessoas")}. Nome: ${r.nome}.`;
      const acompanhar = urlSistema("reserva.html") ? `${urlSistema("reserva.html")}&c=${r.num}` : "";
      box.innerHTML = `<div class="feito-ok" tabindex="-1" id="ok"><h2 class="titulo">Pedido enviado</h2><span class="cod">${esc(r.cod)}</span>
        <p>A pousada recebeu seu pedido para o ${esc(q.nome)}, de ${dia(r.entrada)} a ${dia(r.saida)}. A reserva só vale depois que ela confirmar. Guarde esse número.</p>
        <div class="bts">${acompanhar ? `<a class="btn btn--cheio" href="${esc(acompanhar)}" target="_blank" rel="noopener" style="background:#fff;color:var(--p)">Acompanhar o pedido</a>` : ""}${zap ? `<a class="btn btn--zap" href="${linkZap(msg)}" target="_blank" rel="noopener">Avisar no WhatsApp</a>` : ""}<button class="btn btn--borda" type="button" id="outro">Fazer outro pedido</button></div></div>`;
      $("outro").onclick = () => { S.enviado = null; S.livres = null; S.quarto = null; desenhaQuartos(); desenhaFicha(); vaiPara("inicio"); };
      $("ok").focus(); return;
    }
    const q = S.quarto && Q.find(x => x.id === S.quarto), livre = q && S.livres && S.livres.get(q.id), n = noites(S.entrada, S.saida);
    const passo = !S.livres ? 1 : !q ? 2 : 3;
    const passos = `<ol class="passos" aria-label="Etapas do pedido">${["Datas", "Quarto", "Seus dados"].map((t, i) => `<li class="${i + 1 < passo ? "feito" : i + 1 === passo ? "agora" : ""}" ${i + 1 === passo ? 'aria-current="step"' : ""}>${t}</li>`).join("")}</ol>`;
    const cab = `<div class="cab"><h2 class="titulo">Sua ficha</h2><p>Preencha uma vez e a pousada já recebe tudo. Você ainda não paga nada.</p></div>`;
    if (!q) { box.innerHTML = cab + passos + `<p class="espera">${passo === 1 ? "Escolha as datas no bilhete lá em cima e toque em Ver quartos livres." : "Escolha um quarto livre na lista acima. A ficha abre aqui."}</p>`; return; }
    const priv = urlSistema("privacidade.html");
    box.innerHTML = cab + passos + `<div class="ficha-grade">
      <form id="f-ficha" novalidate><div class="campos">
        <label class="todo">Nome completo<input id="f-nome" maxlength="100" autocomplete="name" required></label>
        <label>WhatsApp com DDD<input id="f-tel" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="(41) 99999-0000" required></label>
        <label>CPF ou documento <small>opcional</small><input id="f-doc" maxlength="30" inputmode="numeric" autocomplete="off"></label>
        <label class="todo">Email <small>opcional</small><input id="f-email" type="email" inputmode="email" maxlength="120" autocomplete="email"></label>
        <label class="todo">Recado para a pousada <small>opcional: horário de chegada, por exemplo. Não coloque dados de saúde.</small><textarea id="f-obs" maxlength="500"></textarea></label></div>
        <p class="erro" id="f-erro" role="alert" hidden style="margin-top:14px"></p>
        <div class="enviar"><button class="btn" type="submit" id="f-enviar">Enviar pedido</button><small>A pousada confirma o pedido. Ao enviar, você confirma que tem 18 anos ou mais${priv ? ` e que leu o <a href="${esc(priv)}" target="_blank" rel="noopener">Aviso de Privacidade</a>` : ""}.</small></div>
      </form>
      <aside class="resumo" aria-label="Resumo do pedido"><h3>${esc(q.nome)}</h3>
        <dl><div><dt>Chegada</dt><dd>${dia(S.entrada)}${P.checkin_hora ? `, a partir das ${esc(P.checkin_hora)}` : ""}</dd></div><div><dt>Saída</dt><dd>${dia(S.saida)}${P.checkout_hora ? `, até as ${esc(P.checkout_hora)}` : ""}</dd></div>
        <div><dt>Pessoas</dt><dd>${plural(S.adultos, "adulto", "adultos")}${S.criancas ? ` e ${plural(S.criancas, "criança", "crianças")}` : ""}</dd></div>
        <div class="total"><dt>${plural(n, "noite", "noites")}</dt><dd>${brl(livre.total)}</dd></div></dl>
        <button class="mudar" type="button" id="mudar">Trocar quarto ou datas</button></aside></div>`;
    $("mudar").onclick = () => vaiPara("quartos");
    $("f-ficha").addEventListener("input", () => { $("f-erro").hidden = true; });
    $("f-ficha").addEventListener("submit", async e => {
      e.preventDefault(); const err = $("f-erro"); err.hidden = true;
      const d = { nome: $("f-nome").value.trim(), tel: $("f-tel").value.trim(), doc: $("f-doc").value.trim(), email: $("f-email").value.trim(), obs: $("f-obs").value.trim() };
      const dig = d.tel.replace(/\D/g, "");
      const falha = d.nome.length < 2 ? "Escreva seu nome completo." : dig.length < 10 || dig.length > 13 ? "Coloque o WhatsApp com DDD, por exemplo (41) 99999-0000." : d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email) ? "Esse email não parece completo. Confira ou deixe em branco." : "";
      if (falha) { err.textContent = falha; err.hidden = false; return; }
      const btn = $("f-enviar"); btn.disabled = true; btn.textContent = "Enviando…";
      const { data, error } = await sb.rpc("pedir_estadia", { p_slug: CONFIG.slug, p_quarto: q.id, p_entrada: S.entrada, p_saida: S.saida, p_adultos: S.adultos, p_criancas: S.criancas, p_nome: d.nome, p_telefone: d.tel, p_documento: d.doc, p_email: d.email, p_obs: d.obs });
      if (error) { btn.disabled = false; btn.textContent = "Enviar pedido"; err.textContent = erroTxt(error); err.hidden = false; return; }
      S.enviado = { num: data, cod: "#" + String(data).padStart(5, "0"), quarto: q.id, entrada: S.entrada, saida: S.saida, pessoas: pessoas(), nome: d.nome };
      desenhaFicha();
    });
  }

  /* ---------- fotos em tela cheia ---------- */
  let fotoAtual = 0;
  const mostraFoto = i => { fotoAtual = (i + CONFIG.fotos.length) % CONFIG.fotos.length; const [src, alt] = CONFIG.fotos[fotoAtual]; $("visor-img").src = src; $("visor-img").alt = alt; $("visor-conta").textContent = `${fotoAtual + 1} de ${CONFIG.fotos.length}`; };
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-foto]"); if (t) { mostraFoto(Number(t.dataset.foto)); $("visor").showModal(); return; }
    const v = e.target.closest("[data-visor]"); if (v) { if (v.dataset.visor === "fechar") $("visor").close(); else mostraFoto(fotoAtual + Number(v.dataset.visor)); return; }
    if (e.target.id === "visor") $("visor").close();
  });
  document.addEventListener("keydown", e => { if (!$("visor").open) return; if (e.key === "ArrowRight") mostraFoto(fotoAtual + 1); if (e.key === "ArrowLeft") mostraFoto(fotoAtual - 1); });

  /* ---------- aparecer ao rolar ---------- */
  const io = MOV && "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: .08 }) : null;
  function revela(els, passo = .1) { if (!io) return; [...els].forEach((el, i) => { el.classList.add("rv"); el.style.setProperty("--d", `${(Math.min(i, 6) * passo).toFixed(2)}s`); io.observe(el); }); }
  revela(document.querySelectorAll(".foto"), .12);
  revela(document.querySelectorAll(".folha .cab, .saber div"), .08);

  /* ---------- céu, sol e topo ao rolar ---------- */
  const raiz = document.documentElement, sol = $("sol"), topo = $("topo"); let pedido = false;
  const suave = t => t * t * (3 - 2 * t);
  const rola = () => {
    pedido = false;
    const h = raiz.scrollHeight - innerHeight, p = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
    topo.style.setProperty("--rol", p.toFixed(4)); topo.classList.toggle("rolou", scrollY > 8);
    if (!MOV) return;
    raiz.style.setProperty("--sol", p.toFixed(4));
    const mar = document.querySelector(".mar"), d = sol.offsetHeight, y0 = innerHeight * .09, y1 = innerHeight - (mar ? mar.offsetHeight : 120) - d * .38;
    sol.style.transform = `translate3d(0, ${(y0 + (y1 - y0) * suave(p)).toFixed(1)}px, 0)`;
  };
  addEventListener("scroll", () => { if (!pedido) { pedido = true; requestAnimationFrame(rola); } }, { passive: true });
  addEventListener("resize", rola); if (document.fonts) document.fonts.ready.then(rola);
  sol.style.transform = `translate3d(0, ${(innerHeight * .09).toFixed(1)}px, 0)`;

  atualizaBilhete(); poe(.5); desenhaQuartos(); desenhaFicha(); rola();
})();
