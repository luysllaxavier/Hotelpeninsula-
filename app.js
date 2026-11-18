import {auth,db} from "./firebase-config.js";
import {onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {collection,doc,onSnapshot,addDoc,setDoc,updateDoc,deleteDoc,writeBatch} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const D=d=>d?new Date(d).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'-';
const dg=s=>String(s||'').replace(/\D/g,'');
const CATS=['Casal','Triplo','Casal + Solteiro','Suíte','Suíte Master/Especial'],ST=['Livre','Ocupado','Limpeza','Manutenção'];
const stc={Livre:'ok',Ocupado:'',Limpeza:'wn','Manutenção':'er'},chip=(s,c=stc[s])=>`<span class="chip ${c||''}">${s}</span>`;
const S={rooms:[],bk:[],gu:[],view:'painel'};
const paid=b=>(b.pays||[]).reduce((a,p)=>a+p.v,0),bal=b=>Math.max(0,b.total-paid(b));
const pers=b=>b.rooms.reduce((a,r)=>a+(+r.g||0),0),rn=b=>b.rooms.map(r=>esc(r.n)).join(', ');
const nat=(a,b)=>String(a).localeCompare(String(b),'pt',{numeric:true});
const dlg=h=>{$('#dlg').innerHTML=h;$('#dlg').showModal()};

$('#lf').onsubmit=async e=>{e.preventDefault();$('#le').textContent='';try{await signInWithEmailAndPassword(auth,$('#em').value,$('#pw').value)}catch{$('#le').textContent='E-mail ou senha incorretos.'}};
let un=[];
onAuthStateChanged(auth,u=>{
 $('#login').hidden=!!u;$('#app').hidden=!u;un.forEach(f=>f());un=[];if(!u)return;
 for(const [k,c] of [['rooms','rooms'],['bk','bookings'],['gu','guests']])
  un.push(onSnapshot(collection(db,c),s=>{S[k]=s.docs.map(d=>({id:d.id,...d.data()}));if(k==='rooms')S.rooms.sort((a,b)=>nat(a.n,b.n));render()}));
});

function render(){
 document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===S.view));
 $('#main').innerHTML={painel,quartos,reservas,hospedes}[S.view]();
}
const sums=()=>{const act=S.bk.filter(b=>b.st!=='Cancelada');return{act,rec:act.reduce((a,b)=>a+paid(b),0),tor:act.reduce((a,b)=>a+bal(b),0),oc:S.rooms.filter(r=>r.st==='Ocupado').length,now:S.bk.filter(b=>b.st==='Hospedado')}};
function painel(){
 const m=sums(),n=S.rooms.length,nx=S.bk.filter(b=>b.st==='Reservada').sort((a,b)=>a.cin>b.cin?1:-1);
 return `<header class="top"><h2>Painel</h2><button class="btn" data-a="rep">Imprimir relatório</button></header>
 <div class="kp"><div><b>${n?Math.round(m.oc/n*100):0}%</b>Ocupação (${m.oc} de ${n} quartos)</div><div><b>${R(m.rec)}</b>Faturamento recebido</div><div><b>${R(m.tor)}</b>Valores a receber</div><div><b>${m.now.reduce((a,b)=>a+pers(b),0)}</b>Hóspedes no hotel agora</div></div>
 <div class="row">${ST.map(s=>chip(`${s}: ${S.rooms.filter(r=>r.st===s).length}`,stc[s])).join('')}</div>
 <h2 class="s">Hospedados agora</h2><div class="grid">${m.now.map(card).join('')||'<p class="m">Nenhum hóspede no momento.</p>'}</div>
 <h2 class="s">Próximas chegadas</h2><div class="grid">${nx.map(card).join('')||'<p class="m">Nenhuma reserva aguardando check-in.</p>'}</div>`;
}
function quartos(){
 return `<header class="top"><h2>Quartos</h2><button class="btn" data-a="nr">Cadastrar quarto</button></header><div class="grid">${S.rooms.map(r=>{
 const b=S.bk.find(x=>x.st==='Hospedado'&&x.rooms.some(y=>y.id===r.id)),g=b&&b.rooms.find(y=>y.id===r.id).g;
 return `<div class="card"><div class="row"><h3>Quarto ${esc(r.n)}</h3>${chip(r.st)}</div><span class="m">${esc(r.cat)}</span>
 <div class="row">${r.tv?chip('TV'):''}${r.fr?chip('Frigobar'):''}</div>${r.obs?`<span class="m">${esc(r.obs)}</span>`:''}
 ${b?`<span class="m">${esc(b.name)} · ${g} hóspede(s)</span>`:''}
 <select data-a="rst" data-id="${r.id}">${ST.map(s=>`<option${s===r.st?' selected':''}>${s}</option>`).join('')}</select>
 <div class="row"><button class="btn o sm" data-a="er" data-id="${r.id}">Editar</button><button class="btn r sm" data-a="dr" data-id="${r.id}">Excluir</button></div></div>`}).join('')||'<p class="m">Cadastre o primeiro quarto para começar.</p>'}</div>`;
}
function card(b){
 const a=b.st!=='Cancelada'&&b.st!=='Finalizada';
 return `<div class="card"><div class="row"><h3>${esc(b.name)}</h3>${chip(b.st,{Reservada:'wn',Hospedado:'',Finalizada:'ok',Cancelada:'er'}[b.st])}</div>
 <span class="m">Quarto(s) ${rn(b)} · ${pers(b)} hóspede(s)<br>Entrada ${D(b.cin)}<br>Saída ${D(b.cout)}</span>
 <span>Total ${R(b.total)} · Pago ${R(paid(b))}<br><b>Saldo ${R(bal(b))}</b></span>
 <div class="row">${b.st==='Reservada'?`<button class="btn sm" data-a="ci" data-id="${b.id}">Check-in</button>`:''}${b.st==='Hospedado'?`<button class="btn sm" data-a="co" data-id="${b.id}">Check-out</button>`:''}
 ${b.st!=='Cancelada'&&bal(b)>0?`<button class="btn o sm" data-a="rc" data-id="${b.id}">Receber saldo</button>`:''}
 <button class="btn o sm" data-a="rb" data-id="${b.id}">Recibo</button>${a?`<button class="btn r sm" data-a="cn" data-id="${b.id}">Cancelar</button>`:''}</div></div>`;
}
function reservas(){
 const l=[...S.bk].sort((a,b)=>a.cin<b.cin?1:-1);
 return `<header class="top"><h2>Reservas</h2><button class="btn" data-a="nb">Nova reserva</button></header><div class="grid">${l.map(card).join('')||'<p class="m">Nenhuma reserva ainda.</p>'}</div>`;
}
function glist(q=''){
 q=q.toLowerCase();
 const l=S.gu.filter(g=>(g.name+g.doc+g.phone).toLowerCase().includes(q)).sort((a,b)=>nat(a.name,b.name));
 return l.map(g=>{const h=S.bk.filter(b=>b.gk===g.id&&b.st!=='Cancelada').sort((a,b)=>a.cin<b.cin?1:-1);
 return `<div class="card"><div class="row"><h3>${esc(g.name)}</h3><span class="chip">${h.length} estadia(s)</span></div>
 <span class="m">${esc(g.doc)} · ${esc(g.phone)} · Total gasto ${R(h.reduce((a,b)=>a+paid(b),0))}</span>
 <a class="btn sm" style="text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/${dg(g.phone).length<=11?'55':''}${dg(g.phone)}">Abrir WhatsApp</a>
 <label>Preferências<textarea rows="2" data-a="pref" data-id="${g.id}" placeholder="Ex.: andar baixo, travesseiro extra">${esc(g.prefs)}</textarea></label>
 <span class="m">${h.map(b=>`${D(b.cin).slice(0,8)} · quarto ${rn(b)} · ${R(b.total)}`).join('<br>')||'Sem estadias.'}</span></div>`}).join('')||'<p class="m">Os hóspedes aparecem aqui depois da primeira reserva.</p>';
}
function hospedes(){return `<header class="top"><h2>Hóspedes</h2></header><input data-a="gs" placeholder="Buscar por nome, documento ou telefone" style="margin-bottom:14px"><div class="grid" id="gl">${glist()}</div>`}

function roomForm(id){
 const r=S.rooms.find(x=>x.id===id)||{n:'',cat:CATS[0],obs:''};
 dlg(`<form id="rf" class="f"><h2 class="w">${id?'Editar':'Cadastrar'} quarto</h2><label>Número<input name="n" required value="${esc(r.n)}"></label>
 <label>Categoria<select name="cat">${CATS.map(c=>`<option${c===r.cat?' selected':''}>${c}</option>`).join('')}</select></label>
 <label class="rc w"><input type="checkbox" name="tv"${r.tv?' checked':''}> TV</label><label class="rc w"><input type="checkbox" name="fr"${r.fr?' checked':''}> Frigobar</label>
 <label class="w">Observações<textarea name="obs">${esc(r.obs)}</textarea></label><div class="w row"><button class="btn">Salvar</button><button class="btn o" type="button" data-a="x">Fechar</button></div></form>`);
 $('#rf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),d={n:f.get('n').trim(),cat:f.get('cat'),tv:!!f.get('tv'),fr:!!f.get('fr'),obs:f.get('obs')};
  id?await updateDoc(doc(db,'rooms',id),d):await addDoc(collection(db,'rooms'),{...d,st:'Livre'});$('#dlg').close()};
}
function bookForm(){
 const av=S.rooms.filter(r=>r.st!=='Manutenção');
 dlg(`<form id="bf" class="f"><h2 class="w">Nova reserva</h2><label class="w">Nome completo<input name="name" required></label>
 <label>CPF / documento<input name="doc" required></label><label>Telefone / WhatsApp<input name="phone" type="tel" required></label>
 <label>Entrada (check-in)<input name="cin" type="datetime-local" required></label><label>Saída prevista (check-out)<input name="cout" type="datetime-local" required></label>
 <div class="w"><span class="m"><b>Quartos e quantidade de hóspedes em cada um</b></span>${av.map(r=>`<label class="rc"><input type="checkbox" name="room" value="${r.id}"> Quarto ${esc(r.n)} · ${esc(r.cat)} ${chip(r.st)}<input type="number" min="1" value="1" name="g_${r.id}" aria-label="Hóspedes no quarto ${esc(r.n)}"></label>`).join('')||'<p class="m">Cadastre quartos antes de reservar.</p>'}</div>
 <label>Valor total (R$)<input name="total" type="number" step="0.01" min="0" required></label><label>Sinal / entrada (R$)<input name="dep" type="number" step="0.01" min="0" value="0"></label>
 <label>Forma de pagamento<select name="pm"><option>Pix</option><option>Dinheiro</option><option>Cartão</option></select></label><label>Saldo a receber<input id="sd" readonly value="R$ 0,00"></label>
 <label class="w">Observações<textarea name="obs"></textarea></label><div class="w row"><button class="btn">Salvar reserva</button><button class="btn o" type="button" data-a="x">Fechar</button></div></form>`);
 const f=$('#bf');f.oninput=()=>{$('#sd').value=R((+f.total.value||0)-(+f.dep.value||0))};
 f.onsubmit=async e=>{e.preventDefault();const x=new FormData(f),ids=x.getAll('room');if(!ids.length)return alert('Selecione ao menos um quarto.');
  const rooms=ids.map(id=>({id,n:S.rooms.find(r=>r.id===id).n,g:+x.get('g_'+id)||1})),gk=dg(x.get('doc'))||dg(x.get('phone')),dep=+x.get('dep')||0;
  await setDoc(doc(db,'guests',gk),{name:x.get('name').trim(),doc:x.get('doc'),phone:x.get('phone')},{merge:true});
  await addDoc(collection(db,'bookings'),{gk,name:x.get('name').trim(),doc:x.get('doc'),phone:x.get('phone'),cin:x.get('cin'),cout:x.get('cout'),rooms,total:+x.get('total')||0,
   pays:dep>0?[{v:dep,m:x.get('pm'),at:new Date().toISOString()}]:[],st:'Reservada',obs:x.get('obs'),created:new Date().toISOString()});$('#dlg').close()};
}
async function setSt(b,st,rst,ex={}){const w=writeBatch(db);w.update(doc(db,'bookings',b.id),{st,...ex});if(rst)b.rooms.forEach(r=>w.update(doc(db,'rooms',r.id),{st:rst}));await w.commit()}
async function receive(b){const m=prompt('Forma de pagamento (Pix, Dinheiro ou Cartão):','Pix');if(!m)return;await updateDoc(doc(db,'bookings',b.id),{pays:[...(b.pays||[]),{v:bal(b),m,at:new Date().toISOString()}]})}
function pr(h){const t=$('#paper').value==='t';$('#pg').textContent=t?'@page{size:80mm auto;margin:3mm}':'@page{size:A4;margin:14mm}';$('#pr').className=t?'th':'';$('#pr').innerHTML=h;print()}
const rcpt=b=>`<h1>Hotel Península</h1><h3>Comprovante de reserva / recibo</h3><p><b>${esc(b.name)}</b><br>Documento: ${esc(b.doc)} · Telefone: ${esc(b.phone)}</p><p>Entrada: ${D(b.cin)}<br>Saída: ${D(b.cout)}</p>
<table>${b.rooms.map(r=>`<tr><td>Quarto ${esc(r.n)}</td><td>${r.g} hóspede(s)</td></tr>`).join('')}</table>
<table><tr><td>Valor total</td><td>${R(b.total)}</td></tr>${(b.pays||[]).map(p=>`<tr><td>Pago em ${esc(p.m)} (${D(p.at)})</td><td>${R(p.v)}</td></tr>`).join('')}<tr><th>Saldo a receber</th><th>${R(bal(b))}</th></tr></table>${b.obs?`<p>Obs.: ${esc(b.obs)}</p>`:''}<p class="sg">Assinatura: ______________________</p><p>Emitido em ${D(new Date())}</p>`;
const report=()=>{const m=sums();return `<h1>Hotel Península · Relatório</h1><p>Emitido em ${D(new Date())}</p><table><tr><td>Ocupação</td><td>${m.oc} de ${S.rooms.length} quartos</td></tr><tr><td>Faturamento recebido</td><td>${R(m.rec)}</td></tr><tr><td>Valores a receber</td><td>${R(m.tor)}</td></tr></table>
<table><tr><th>Hóspede</th><th>Quartos</th><th>Situação</th><th>Total</th><th>Saldo</th></tr>${[...S.bk].sort((a,b)=>a.cin<b.cin?1:-1).map(b=>`<tr><td>${esc(b.name)}</td><td>${rn(b)}</td><td>${b.st}</td><td>${R(b.total)}</td><td>${R(bal(b))}</td></tr>`).join('')}</table>`};

document.addEventListener('click',async e=>{
 const t=e.target.closest('[data-a],[data-v]');if(!t)return;
 if(t.dataset.v){S.view=t.dataset.v;return render()}
 const a=t.dataset.a,id=t.dataset.id,b=S.bk.find(x=>x.id===id);
 if(a==='out')signOut(auth);else if(a==='x')$('#dlg').close();else if(a==='nr')roomForm();else if(a==='er')roomForm(id);else if(a==='nb')bookForm();
 else if(a==='dr'){if(confirm('Excluir este quarto?'))deleteDoc(doc(db,'rooms',id))}
 else if(a==='ci')setSt(b,'Hospedado','Ocupado',{cinReal:new Date().toISOString()});
 else if(a==='co'){if(bal(b)>0&&confirm(`Saldo de ${R(bal(b))}. Receber agora?`))await receive(b);setSt(b,'Finalizada','Limpeza',{coutReal:new Date().toISOString()})}
 else if(a==='cn'){if(confirm('Cancelar esta reserva?'))setSt(b,'Cancelada',b.st==='Hospedado'?'Limpeza':null)}
 else if(a==='rc')receive(b);else if(a==='rb')pr(rcpt(b));else if(a==='rep')pr(report());
});
document.addEventListener('change',e=>{const t=e.target,id=t.dataset.id;
 if(t.dataset.a==='rst')updateDoc(doc(db,'rooms',id),{st:t.value});
 if(t.dataset.a==='pref')setDoc(doc(db,'guests',id),{prefs:t.value},{merge:true})});
document.addEventListener('input',e=>{if(e.target.dataset.a==='gs')$('#gl').innerHTML=glist(e.target.value)});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
