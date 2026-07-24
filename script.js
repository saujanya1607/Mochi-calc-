// ---------- state ----------
let expression = '';   // e.g. "12+8"
let justEvaluated = false;

const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const screenEl = document.querySelector('.screen');
const particlesEl = document.getElementById('particles');
const speechEl = document.getElementById('speech');
const mouthEl = document.getElementById('mouth');
const eyeL = document.getElementById('eyeL');
const eyeR = document.getElementById('eyeR');

const OPS = ['+', '−', '×', '÷'];

// ---------- helpers ----------
function toEvalString(expr){
  return expr
    .split('×').join('*')
    .split('÷').join('/')
    .split('−').join('-');
}

function formatNumber(n){
  if (!isFinite(n)) return 'nyaa?!';
  if (Number.isInteger(n)) return n.toString();
  return parseFloat(n.toFixed(8)).toString();
}

function lastCharIsOp(str){
  return str.length > 0 && OPS.includes(str[str.length - 1]);
}

function currentPreview(){
  const clean = toEvalString(expression).replace(/[+\-*/]$/, '');
  if (clean === '' ) return null;
  try {
    const val = Function('"use strict"; return (' + clean + ')')();
    if (typeof val === 'number' && isFinite(val)) return formatNumber(val);
  } catch (e) { /* incomplete expression, ignore */ }
  return null;
}

function render(){
  expressionEl.textContent = expression || '\u00A0';
  const preview = currentPreview();
  if (justEvaluated) {
    return;
  }
  if (preview !== null) {
    resultEl.textContent = preview;
    return;
  }
  if (expression === '') {
    resultEl.textContent = '0';
    return;
  }
  const match = expression.match(/-?\d+\.?\d*$/);
  resultEl.textContent = match ? match[0] : '0';
}

// ---------- mascot expressions ----------
let blinkTimer = null;

function startIdleBlink(){
  clearInterval(blinkTimer);
  blinkTimer = setInterval(() => {
    eyeL.classList.add('blink');
    eyeR.classList.add('blink');
    setTimeout(() => {
      eyeL.classList.remove('blink');
      eyeR.classList.remove('blink');
    }, 140);
  }, 3200);
}

function setMascot(mood, message){
  eyeL.className = 'eye eye-l';
  eyeR.className = 'eye eye-r';
  mouthEl.className = 'mouth';

  if (mood === 'happy'){
    eyeL.classList.add('happy');
    eyeR.classList.add('happy');
    mouthEl.classList.add('smile');
  } else if (mood === 'thinking'){
    mouthEl.classList.add('o');
  } else if (mood === 'dizzy'){
    eyeL.classList.add('dizzy');
    eyeR.classList.add('dizzy');
    mouthEl.classList.add('o');
  }

  if (message){
    speechEl.textContent = message;
    speechEl.classList.add('show');
    clearTimeout(setMascot._t);
    setMascot._t = setTimeout(() => speechEl.classList.remove('show'), 1400);
  }
}

// ---------- particles ----------
const HEARTS = ['💗','✨','⭐','💕','🌸'];

function popParticle(x, y){
  const el = document.createElement('div');
  el.className = 'particle';
  el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  el.style.left = `${x + (Math.random() * 20 - 10)}px`;
  el.style.top = `${y}px`;
  particlesEl.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

function burst(el, count = 5){
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top;
  for (let i = 0; i < count; i++){
    setTimeout(() => popParticle(cx, cy), i * 40);
  }
}

// ---------- input handling ----------
function inputNumber(num){
  if (justEvaluated){
    expression = lastCharIsOp(num) ? resultEl.textContent : '';
    justEvaluated = false;
  }
  if (num === '.' ){
    const parts = expression.split(/[+\-×÷]/);
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('.')) return;
    if (lastPart === '') expression += '0';
  }
  expression += num;
  setMascot('thinking');
  render();
}

function inputOp(op){
  if (expression === '' && !justEvaluated) return;
  if (justEvaluated){
    expression = resultEl.textContent;
    justEvaluated = false;
  }
  if (lastCharIsOp(expression)){
    expression = expression.slice(0, -1) + op;
  } else {
    expression += op;
  }
  highlightOp(op);
  render();
}

function highlightOp(op){
  document.querySelectorAll('.key-op').forEach(btn => {
    btn.classList.toggle('active-op', btn.dataset.op === op);
  });
}

function clearOpHighlight(){
  document.querySelectorAll('.key-op').forEach(btn => btn.classList.remove('active-op'));
}

function backspace(){
  if (justEvaluated){ clearAll(); return; }
  expression = expression.slice(0, -1);
  setMascot('thinking');
  render();
}

function clearAll(){
  expression = '';
  justEvaluated = false;
  clearOpHighlight();
  setMascot('idle', 'clean slate~');
  render();
}

function percent(){
  const match = expression.match(/(-?\d+\.?\d*)$/);
  if (!match) return;
  const num = parseFloat(match[0]) / 100;
  expression = expression.slice(0, match.index) + formatNumber(num);
  render();
}

function equals(){
  if (expression === '' || lastCharIsOp(expression)) return;
  const evalStr = toEvalString(expression);
  let value;
  try {
    value = Function(`"use strict"; return (${evalStr})`)();
  } catch (e){
    value = NaN;
  }

  clearOpHighlight();

  if (!isFinite(value)){
    resultEl.textContent = 'oopsie!';
    setMascot('dizzy', 'div by 0?! >_<');
    screenEl.classList.remove('shake');
    void screenEl.offsetWidth;
    screenEl.classList.add('shake');
    justEvaluated = true;
    expressionEl.textContent = expression + ' =';
    return;
  }

  const formatted = formatNumber(value);
  expressionEl.textContent = expression + ' =';
  resultEl.textContent = formatted;
  justEvaluated = true;
  expression = formatted;

  const msgs = ['yay!! 🎉', 'tada~ ✨', 'here you go!', 'sugoi!'];
  setMascot('happy', msgs[Math.floor(Math.random() * msgs.length)]);
}

// ---------- events ----------
document.querySelectorAll('.key').forEach(btn => {
  btn.addEventListener('click', () => {
    burst(btn, 4);

    if (btn.dataset.num !== undefined){
      inputNumber(btn.dataset.num);
    } else if (btn.dataset.op !== undefined){
      inputOp(btn.dataset.op);
    } else if (btn.dataset.action === 'clear'){
      clearAll();
    } else if (btn.dataset.action === 'backspace'){
      backspace();
    } else if (btn.dataset.action === 'percent'){
      percent();
    } else if (btn.dataset.action === 'equals'){
      burst(btn, 8);
      equals();
    }
  });
});

document.addEventListener('keydown', (e) => {
  const map = { '*': '×', '/': '÷', '-': '−' };
  if (/[0-9.]/.test(e.key)) inputNumber(e.key);
  else if (['+','-','*','/'].includes(e.key)) inputOp(map[e.key] || e.key);
  else if (e.key === 'Enter' || e.key === '=') equals();
  else if (e.key === 'Backspace') backspace();
  else if (e.key === 'Escape') clearAll();
});

startIdleBlink();
render();