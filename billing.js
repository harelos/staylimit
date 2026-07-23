// Overstay — Play Billing (Digital Goods API) + paywall. Loaded after the app.
(function(){'use strict';
const CFG={"key":"ov_ent","event":"overstay-pro-changed","app":"Overstay","accent":"#3D7DE0","bg":"#0E1218","p1":"#161C24","line":"#2A323D","ink":"#EEF2F7","mut":"#8B96A5","title":"Track every zone you actually live in","sub":"Unlimited zones — Schengen, tax residency, any rolling day-limit rule, side by side.","benefits":["<b>Unlimited zones</b> — not just one country or one rule","Switch between them instantly, same trip log","Private — nothing leaves your phone, ever"],"plans":[{"key":"pro_yearly","name":"Annual","price":"$19.99","per":"/yr","tag":"Cancel anytime","hero":true},{"key":"pro_weekly","name":"Weekly","price":"$2.99","per":"/wk","tag":"No commitment"}],"grants":{"pro_yearly":"pro","pro_weekly":"pro"}};
const BILLING='https://play.google.com/billing';
let dgs=null,ready=false,selected=(CFG.plans.find(p=>p.hero)||CFG.plans[0]).key,ent=read();
function read(){try{return JSON.parse(localStorage.getItem(CFG.key))||{pro:false}}catch{return{pro:false}}}
function write(e){ent=e;try{localStorage.setItem(CFG.key,JSON.stringify(e))}catch{}document.dispatchEvent(new CustomEvent(CFG.event,{detail:e}))}
function grant(ids){let pro=ent.pro;ids.forEach(id=>{if(CFG.grants[id]==='pro')pro=true});write({pro});if(pro)closePaywall()}
async function init(){if(typeof window.getDigitalGoodsService!=='function')return;try{dgs=await window.getDigitalGoodsService(BILLING);if(!dgs)return;ready=true;await refreshOwned();refreshPrices()}catch(e){console.warn('[billing]',e)}}
async function refreshOwned(){if(!ready)return;try{const ps=await dgs.listPurchases();for(const p of(ps||[]))if(p.acknowledged!==true&&dgs.acknowledge){try{await dgs.acknowledge(p.purchaseToken,'onetime')}catch{}}grant((ps||[]).map(p=>p.itemId))}catch(e){console.warn(e)}}
async function refreshPrices(){if(!ready||!dgs.getDetails)return;try{const d=await dgs.getDetails(CFG.plans.map(p=>p.key));const by={};(d||[]).forEach(x=>by[x.itemId]=x);CFG.plans.forEach(p=>{const a=by[p.key]&&by[p.key].price;if(a&&a.value!=null){p.price=(a.currency==='USD'?'$':a.currency+' ')+a.value;p.per=p.per.includes('wk')?'/wk':'/yr'}});if(document.getElementById('pwPlans'))renderPlans()}catch{}}
async function buy(key){if(!ready||typeof window.PaymentRequest!=='function'){toast('Purchases open in the installed app from Google Play.');return}try{const req=new PaymentRequest([{supportedMethods:BILLING,data:{sku:key}}],{total:{label:CFG.app,amount:{currency:'USD',value:'0'}}});const resp=await req.show();const token=resp.details&&resp.details.token;await resp.complete('success');if(token&&dgs.acknowledge){try{await dgs.acknowledge(token,'onetime')}catch{}}grant([key]);toast('Unlocked ✓')}catch(e){if(e&&(e.name==='AbortError'||/cancel/i.test(e.message||'')))return;toast('Could not start checkout.')}}
async function restore(){if(!ready){toast('Open the installed app to restore.');return}toast('Restoring…');await refreshOwned();toast(ent.pro?'Restored ✓':'No purchases found')}
function perMonth(p){if(p.per!=='/yr')return '';const n=parseFloat((p.price||'').replace(/[^0-9.]/g,''));if(!n)return '';const sym=(p.price||'').replace(/[0-9.,\s]/g,'')||'$';return 'just '+sym+(n/12).toFixed(2)+'/mo, billed yearly'}
function openPaywall(trigger){if(ent.pro){toast("You're Pro ✓");return}
let ov=document.getElementById('pwOv');if(!ov){ov=document.createElement('div');ov.id='pwOv';ov.className='pw-ov';document.body.appendChild(ov);ov.addEventListener('click',e=>{if(e.target===ov)closePaywall()})}
ov.innerHTML='<div class="pw-sheet"><button class="pw-x" onclick="Billing.closePaywall()">×</button>'+
'<div class="pw-t">'+CFG.title+'</div><div class="pw-sub">'+CFG.sub+'</div>'+
'<ul class="pw-b">'+CFG.benefits.map(b=>'<li>'+b+'</li>').join('')+'</ul>'+
'<div class="pw-trust">No account. No ads. Everything stays on your phone.</div>'+
'<div class="pw-plans" id="pwPlans"></div>'+
'<button class="pw-cta" id="pwCta" onclick="Billing._buy()">Continue</button>'+
'<div class="pw-risk">Unlocks instantly · cancel anytime in Google Play</div>'+
'<button class="pw-restore" onclick="Billing.restore()">Restore purchases</button></div>';
ov.classList.add('open');renderPlans()}
function closePaywall(){const o=document.getElementById('pwOv');if(o)o.classList.remove('open')}
function renderPlans(){const w=document.getElementById('pwPlans');if(!w)return;
w.innerHTML=CFG.plans.map(p=>{const pm=perMonth(p);return '<button class="pw-plan'+(selected===p.key?' sel':'')+(p.hero?' hero':'')+'" onclick="Billing._sel(\''+p.key+'\')">'+
(p.hero?'<span class="pw-flag">Most popular</span>':'')+'<span class="pw-pn">'+p.name+'</span><span class="pw-pp">'+p.price+'<em>'+p.per+'</em></span>'+
'<span class="pw-pt">'+(p.per==='/yr'?'<b>7-day free trial</b> · ':'')+p.tag+(pm?' · '+pm:'')+'</span></button>'}).join('');
const c=document.getElementById('pwCta');if(c){const pl=CFG.plans.find(p=>p.key===selected);c.textContent=(pl.per==='/yr'?'Start 7-day free trial':'Get '+pl.name+' — '+pl.price)}}
const css='.pw-ov{position:fixed;inset:0;z-index:400;background:rgba(5,4,3,.74);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s}'+
'.pw-ov.open{opacity:1;pointer-events:auto}'+
'.pw-sheet{width:100%;max-width:440px;max-height:94%;overflow-y:auto;background:'+CFG.bg+';border-top:1px solid '+CFG.accent+'59;border-radius:20px 20px 0 0;padding:24px 20px calc(22px + env(safe-area-inset-bottom));position:relative;font-family:inherit;color:'+CFG.ink+';transform:translateY(16px);transition:transform .22s}'+
'.pw-ov.open .pw-sheet{transform:translateY(0)}'+
'.pw-x{position:absolute;top:13px;right:13px;width:30px;height:30px;border-radius:50%;border:1px solid '+CFG.line+';background:transparent;color:'+CFG.mut+';font-size:18px;cursor:pointer}'+
'.pw-t{font-size:22px;font-weight:700;letter-spacing:-.02em;max-width:15ch}'+
'.pw-sub{font-size:12.5px;color:'+CFG.mut+';line-height:1.5;margin-top:6px}'+
'.pw-b{list-style:none;margin:16px 0 10px;padding:0;display:flex;flex-direction:column;gap:9px}'+
'.pw-b li{position:relative;padding-left:24px;font-size:13px;line-height:1.4}'+
'.pw-b li::before{content:"";position:absolute;left:2px;top:4px;width:12px;height:7px;border-left:2.5px solid #4FB477;border-bottom:2.5px solid #4FB477;transform:rotate(-45deg)}'+
'.pw-b b{color:'+CFG.accent+'}'+
'.pw-trust{font-size:10.5px;letter-spacing:.02em;color:'+CFG.mut+';border-top:1px solid '+CFG.line+';border-bottom:1px solid '+CFG.line+';padding:10px 0;margin-bottom:14px;text-align:center}'+
'.pw-plans{display:flex;flex-direction:column;gap:9px;margin-bottom:14px}'+
'.pw-plan{position:relative;display:flex;align-items:center;gap:8px;flex-wrap:wrap;text-align:left;width:100%;padding:14px 13px;border-radius:13px;border:1.5px solid '+CFG.line+';background:'+CFG.p1+';color:'+CFG.ink+';cursor:pointer;font-family:inherit;transition:border-color .15s}'+
'.pw-plan.sel{border-color:'+CFG.accent+';background:linear-gradient(135deg,'+CFG.accent+'24,'+CFG.accent+'08)}'+
'.pw-flag{position:absolute;top:-9px;left:13px;font-size:8.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:'+CFG.bg+';background:'+CFG.accent+';padding:3px 9px;border-radius:999px}'+
'.pw-pn{font-size:14.5px;font-weight:700}.pw-pp{margin-left:auto;font-size:16px;font-weight:800}.pw-pp em{font-style:normal;font-size:11px;color:'+CFG.mut+';font-weight:600}'+
'.pw-pt{flex-basis:100%;font-size:10.5px;color:'+CFG.mut+'}'+
'.pw-cta{width:100%;padding:16px;border:none;border-radius:13px;background:'+CFG.accent+';color:'+CFG.bg+';font-family:inherit;font-weight:800;font-size:15.5px;cursor:pointer}'+
'.pw-risk{font-size:10.5px;color:'+CFG.mut+';text-align:center;margin-top:9px}'+
'.pw-restore{display:block;margin:10px auto 0;background:none;border:none;color:'+CFG.mut+';font-size:11.5px;font-weight:600;text-decoration:underline;cursor:pointer;font-family:inherit}';
function toast(m){try{if(typeof window.toast==='function'){window.toast(String(m).toUpperCase());return}}catch{}const t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:500;background:'+CFG.p1+';border:1px solid '+CFG.accent+';color:'+CFG.accent+';font-size:12px;padding:9px 15px;border-radius:999px;font-family:inherit';document.body.appendChild(t);setTimeout(()=>t.remove(),1900)}
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
window.Billing={isPro:()=>!!ent.pro,openPaywall,closePaywall,restore,requirePro(t){if(ent.pro)return true;openPaywall(t);return false},_sel(k){selected=k;renderPlans()},_buy(){buy(selected)}};
document.dispatchEvent(new CustomEvent(CFG.event,{detail:ent}));
init();
})();
