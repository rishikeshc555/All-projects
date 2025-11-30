/* Glow — Simple Expense Tracker
   - Stores transactions in localStorage
   - Shows monthly income, expense, money left
   - Renders a 6-month Income vs Expense chart (Chart.js)
   - Exports a simple PDF summary (jsPDF)
*/

// ---------- Helpers ----------
const $ = id => document.getElementById(id);
const MONEY = v => "₹" + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0,10);

// Storage keys
const STORAGE_KEY = "glow_transactions_v1";

// Elements
const form = $("form");
const titleEl = $("title");
const amountEl = $("amount");
const typeEl = $("type");
const dateEl = $("date");
const txList = $("txList");

const incomeEl = $("income");
const expenseEl = $("expense");
const leftEl = $("left");

const exportPdfBtn = $("exportPdf");
const chartCanvas = $("chart");

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
dateEl.value = todayISO();

// ---------- Small utilities ----------
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }

function formatDate(d){
  const dt = new Date(d);
  return dt.toLocaleDateString();
}

function getMonthKey(dateStr){
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; // YYYY-MM
}

// ---------- Render recent transactions ----------
function renderTransactions(){
  txList.innerHTML = "";
  // show latest 8 transactions
  const list = transactions.slice().reverse().slice(0,8);
  if(list.length === 0){
    const li = document.createElement("li");
    li.className = "tx-item";
    li.textContent = "No transactions yet. Add your first one!";
    txList.appendChild(li);
    return;
  }

  list.forEach(tx => {
    const li = document.createElement("li");
    li.className = "tx-item";

    const left = document.createElement("div");
    left.className = "tx-left";
    const t = document.createElement("div"); t.className = "tx-title"; t.textContent = tx.title;
    const m = document.createElement("div"); m.className = "tx-meta"; m.textContent = `${tx.type} • ${tx.category || "—"} • ${formatDate(tx.date)}`;
    left.appendChild(t); left.appendChild(m);

    const amt = document.createElement("div");
    amt.innerHTML = (tx.type === "expense" ? "-" : "+") + MONEY(tx.amount);

    li.appendChild(left);
    li.appendChild(amt);

    txList.appendChild(li);
  });
}

// ---------- Calculate monthly totals & update UI ----------
function updateSummary(){
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  let income = 0, expense = 0;
  transactions.forEach(tx => {
    if(getMonthKey(tx.date) === thisMonthKey){
      if(tx.type === "income") income += Number(tx.amount);
      else expense += Number(tx.amount);
    }
  });

  incomeEl.textContent = MONEY(income);
  expenseEl.textContent = MONEY(expense);
  leftEl.textContent = MONEY(income - expense);
}

// ---------- Chart (6 months) ----------
let chartInstance = null;
function renderChart(){
  // build last 6 month keys
  const base = new Date();
  const months = [];
  for(let i=5;i>=0;i--){
    const d = new Date(base.getFullYear(), base.getMonth()-i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }

  // aggregate
  const incomeData = months.map(m => 0);
  const expenseData = months.map(m => 0);
  transactions.forEach(tx => {
    const k = getMonthKey(tx.date);
    const idx = months.indexOf(k);
    if(idx >= 0){
      if(tx.type === "income") incomeData[idx] += Number(tx.amount);
      else expenseData[idx] += Number(tx.amount);
    }
  });

  const labels = months.map(m => {
    const [y,mm] = m.split("-");
    const d = new Date(Number(y), Number(mm)-1, 1);
    return d.toLocaleString(undefined, { month: 'short', year: 'numeric' }); // e.g. "Jun 2025"
  });

  // destroy existing
  if(chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: 'rgba(37,117,252,0.9)' },
        { label: 'Expense', data: expenseData, backgroundColor: 'rgba(255,99,132,0.9)' }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { beginAtZero: true, ticks: { callback: value => '₹' + value } }
      },
      plugins: { legend: { position: 'top' } }
    }
  });
}

// ---------- Add transaction ----------
form.addEventListener('submit', e => {
  e.preventDefault();
  const title = titleEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const type = typeEl.value;
  const date = dateEl.value;
  if(!title || isNaN(amount) || !date) return alert("Please complete the form");

  const tx = { id: Date.now().toString(36), title, amount: +amount.toFixed(2), type, date, category: "" };
  transactions.push(tx);
  save();
  form.reset();
  dateEl.value = todayISO();
  refresh();
});

// clear form
$("clear").addEventListener("click", () => {
  form.reset();
  dateEl.value = todayISO();
});

// ---------- PDF Export ----------
exportPdfBtn.addEventListener("click", () => {
  // generate a simple PDF summary: header + monthly totals + last transactions
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const leftMargin = 40;
  let y = 40;

  doc.setFontSize(18);
  doc.text("Glow — Expense Summary", leftMargin, y);
  y += 26;

  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, leftMargin, y);
  y += 20;

  // monthly numbers
  doc.setFontSize(13);
  doc.text("This Month", leftMargin, y);
  y += 18;

  doc.setFontSize(11);
  doc.text(`Income: ${incomeEl.textContent}`, leftMargin, y); y += 16;
  doc.text(`Expense: ${expenseEl.textContent}`, leftMargin, y); y += 16;
  doc.text(`Money Left: ${leftEl.textContent}`, leftMargin, y); y += 22;

  // last transactions
  doc.setFontSize(13); doc.text("Recent Transactions", leftMargin, y); y += 16;
  doc.setFontSize(10);

  const recent = transactions.slice().reverse().slice(0, 12);
  if(recent.length === 0){
    doc.text("No transactions recorded", leftMargin, y);
  } else {
    // table-like rows
    recent.forEach(tx => {
      const line = `${formatDate(tx.date)}  •  ${tx.title}  •  ${tx.type === 'expense' ? '-' : '+'}${MONEY(tx.amount)}`;
      if(y > 740) { doc.addPage(); y = 40; }
      doc.text(line, leftMargin, y); y += 14;
    });
  }

  doc.save("glow_summary.pdf");
});

// ---------- Refresh UI ----------
function refresh(){
  renderTransactions();
  updateSummary();
  renderChart();
}

// initial render
refresh();
