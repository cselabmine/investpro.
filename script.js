const $ = (id) => document.getElementById(id);
const money = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const defaultHoldings = [
  {name:"Nifty Growth Fund",type:"Equity",symbol:"N",invested:100000,current:112500,rate:12.5},
  {name:"Secure Debt Fund",type:"Debt",symbol:"S",invested:80000,current:83500,rate:4.4},
  {name:"Digital Gold",type:"Gold",symbol:"G",invested:50000,current:52500,rate:5.0}
];
const plans = [
  {id:"growth",name:"Equity Growth",category:"Equity",icon:"↗",rate:"10–14%",risk:"High risk",minimum:500,description:"A sample equity-focused plan designed for long-term growth.",featured:true},
  {id:"secure",name:"Steady Income",category:"Debt",icon:"◒",rate:"6–8%",risk:"Moderate risk",minimum:1000,description:"A sample fixed-income style plan focused on steadier movement.",featured:false},
  {id:"gold",name:"Gold Advantage",category:"Gold",icon:"✧",rate:"7–9%",risk:"Moderate risk",minimum:500,description:"A sample gold allocation plan for diversification.",featured:false}
];
let state = loadState();
let selectedPlan = null;
let registerMode = false;
let toastTimer;
function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem("investpro-demo"));
    if(saved) return {...saved,holdings:saved.holdings||structuredClone(defaultHoldings),transactions:saved.transactions||[]};
  }catch(e){}
  return {name:"Karan Deep",email:"demo@investpro.com",holdings:structuredClone(defaultHoldings),transactions:[
    {description:"Nifty Growth Fund",date:"16 Nov 2026",type:"Investment",amount:10000,status:"Completed"},
    {description:"Monthly SIP",date:"05 Nov 2026",type:"Investment",amount:5000,status:"Completed"},
    {description:"Secure Debt Fund",date:"28 Oct 2026",type:"Investment",amount:15000,status:"Completed"}
  ]};
}
function saveState(){localStorage.setItem("investpro-demo",JSON.stringify(state));}
function totals(){
  const invested=state.holdings.reduce((s,h)=>s+h.invested,0);
  const current=state.holdings.reduce((s,h)=>s+h.current,0);
  return {invested,current,gain:current-invested,rate:invested?(current-invested)/invested*100:0};
}
function updateIdentity(){
  const first=state.name.trim().split(/\s+/)[0]||"Investor", initial=first[0].toUpperCase();
  $("welcomeName").textContent=first;$("sideName").textContent=state.name;$("sideAvatar").textContent=initial;$("topAvatar").textContent=initial;
}
function renderStats(){
  const t=totals();
  ["totalValue","portfolioTotal"].forEach(id=>$(id).textContent=money(t.current));
  ["investedValue","portfolioInvested"].forEach(id=>$(id).textContent=money(t.invested));
  ["returnsValue","portfolioReturns"].forEach(id=>$(id).textContent="+"+money(t.gain));
  $("totalGain").textContent=`↗ ${money(t.gain)} (${t.rate.toFixed(2)}%)`;
  $("chartCurrent").textContent=money(t.current);
}
function holdingRows(includeType=false){
  return state.holdings.map(h=>{
    const gain=h.current-h.invested, rate=h.invested?gain/h.invested*100:0;
    return `<tr><td><div class="asset-cell"><span class="asset-logo">${escapeHtml(h.symbol||h.name[0])}</span><span>${escapeHtml(h.name)}<small>${escapeHtml(h.category||h.type||"Investment")}</small></span></div></td>${includeType?`<td>${escapeHtml(h.category||h.type||"—")}</td>`:""}<td>${money(h.invested)}</td><td>${money(h.current)}</td><td class="positive">+${money(gain)} (${rate.toFixed(1)}%)</td></tr>`;
  }).join("");
}
function renderHoldings(){
  $("holdingsTable").innerHTML=holdingRows(false);
  $("portfolioTable").innerHTML=holdingRows(true);
}
function renderTransactions(){
  const body=$("transactionsTable");
  body.innerHTML=state.transactions.map(t=>`<tr><td><strong>${escapeHtml(t.description)}</strong></td><td>${escapeHtml(t.date)}</td><td>${escapeHtml(t.type)}</td><td>${money(t.amount)}</td><td><span class="status-pill">${escapeHtml(t.status)}</span></td></tr>`).join("");
  $("emptyTransactions").hidden=state.transactions.length>0;
}
function renderPlans(){
  $("plansGrid").innerHTML=plans.map(p=>`<article class="plan-card ${p.featured?"featured":""}">${p.featured?'<span class="plan-badge">POPULAR CHOICE</span>':'<span class="plan-badge">DEMO PLAN</span>'}<div class="plan-icon">${p.icon}</div><h3>${p.name}</h3><p>${p.description}</p><div class="plan-return">${p.rate}<small> p.a. illustrative</small></div><div class="plan-meta"><span>Risk level<strong>${p.risk}</strong></span><span>Minimum<strong>${money(p.minimum)}</strong></span></div><button class="primary-btn" data-invest="${p.id}">Invest in demo</button></article>`).join("");
}
function renderAll(){updateIdentity();renderStats();renderHoldings();renderTransactions();renderPlans();saveState();}
function escapeHtml(str){return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function showToast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2800);}
function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));
  const target=$(name+"View");if(target)target.classList.add("active-view");
  document.querySelectorAll(".nav-link[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  const label={overview:"Overview",portfolio:"My portfolio",plans:"Investment plans",calculator:"SIP calculator",transactions:"Transactions"}[name]||"Overview";
  $("pageName").textContent=label;$("sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{
  const goto=e.target.closest("[data-goto]");if(goto)showView(goto.dataset.goto);
  const nav=e.target.closest("[data-view]");if(nav)showView(nav.dataset.view);
  const invest=e.target.closest("[data-invest]");if(invest)openInvest(invest.dataset.invest);
});
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("logoutBtn").addEventListener("click",()=>{$("authModal").classList.add("show");showToast("Demo session paused.");});
function openAuth(){registerMode=false;updateAuthMode();$("authModal").classList.add("show");}
function updateAuthMode(){
  $("authTitle").textContent=registerMode?"Create your demo account":"Sign in to your account";
  $("nameLabel").hidden=!registerMode;$("userName").hidden=!registerMode;$("userName").required=registerMode;
  $("authSubmit").textContent=registerMode?"Create account":"Sign in";
  $("switchAuth").innerHTML=registerMode?'Already have an account? <button type="button">Sign in</button>':'New to InvestPro? <button type="button">Create demo account</button>';
}
$("switchAuth").addEventListener("click",()=>{registerMode=!registerMode;updateAuthMode();});
$("closeAuth").addEventListener("click",()=>$("authModal").classList.remove("show"));
$("authForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("userEmail").value.trim(),password=$("userPassword").value;
  if(!email||!password){showToast("Please complete the form.");return;}
  if(registerMode){state.name=$("userName").value.trim()||"Demo Investor";state.email=email;state.holdings=[];state.transactions=[];}
  else if(email!==state.email && email!=="demo@investpro.com"){state.name=email.split("@")[0].replace(/[._-]/g," ");state.email=email;}
  $("authModal").classList.remove("show");renderAll();showToast(registerMode?"Demo account created!":"Welcome back to InvestPro.");showView("overview");
});
function openInvest(id){
  selectedPlan=plans.find(p=>p.id===id);if(!selectedPlan)return;
  $("investTitle").textContent=selectedPlan.name;$("investDescription").textContent=`Minimum ${money(selectedPlan.minimum)} · ${selectedPlan.risk}. This is a local demo simulation.`;
  $("investAmount").min=selectedPlan.minimum;$("investAmount").value=Math.max(5000,selectedPlan.minimum);
  $("investModal").classList.add("show");
}
$("closeInvest").addEventListener("click",()=>$("investModal").classList.remove("show"));
$("investForm").addEventListener("submit",e=>{
  e.preventDefault();const amount=Number($("investAmount").value);
  if(!selectedPlan||!Number.isFinite(amount)||amount<selectedPlan.minimum){showToast(`Minimum demo amount is ${money(selectedPlan.minimum)}.`);return;}
  const existing=state.holdings.find(h=>h.name===selectedPlan.name);
  const estimatedRate=selectedPlan.id==="growth"?.08:selectedPlan.id==="secure"?.035:.05;
  if(existing){existing.invested+=amount;existing.current+=amount*(1+estimatedRate);}
  else state.holdings.push({name:selectedPlan.name,type:selectedPlan.category,category:selectedPlan.category,symbol:selectedPlan.icon,invested:amount,current:amount*(1+estimatedRate)});
  state.transactions.unshift({description:selectedPlan.name,date:new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),type:"Investment",amount,status:"Completed"});
  $("investModal").classList.remove("show");renderAll();showView("portfolio");showToast("Demo investment added to your portfolio.");
});
function calculateSIP(){
  const p=Number($("monthlyAmount").value),annual=Number($("expectedRate").value),years=Number($("duration").value);
  const r=annual/1200,n=years*12;
  const future=r===0?p*n:p*((Math.pow(1+r,n)-1)/r)*(1+r);
  const invested=p*n,gain=future-invested;
  $("monthlyLabel").textContent=money(p);$("rateLabel").textContent=annual+"%";$("durationLabel").textContent=years+" years";
  $("futureValue").textContent=money(future);$("calcInvested").textContent=money(invested);$("calcReturns").textContent=money(gain);
  $("principalBar").style.width=(invested/future*100)+"%";$("gainBar").style.width=(gain/future*100)+"%";
}
["monthlyAmount","expectedRate","duration"].forEach(id=>$(id).addEventListener("input",calculateSIP));
$("chartRange").addEventListener("change",e=>{
  const months=Number(e.target.value),labels=months===3?["Sep","Oct","Nov"]:months===12?["Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"]:["Jun","Jul","Aug","Sep","Oct","Nov"];
  $("chartLabels").innerHTML=labels.map(x=>`<span>${x}</span>`).join("");
});
$("authModal").addEventListener("click",e=>{if(e.target===$("authModal"))$("authModal").classList.remove("show");});
$("investModal").addEventListener("click",e=>{if(e.target===$("investModal"))$("investModal").classList.remove("show");});
renderAll();calculateSIP();showView("overview");
