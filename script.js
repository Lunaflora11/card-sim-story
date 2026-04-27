let state = { score: 0, cards: {H:13, S:13, D:13, C:13}, total: 52, mode: "" };

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function startPlay() {
    showScreen('screen-modes');
    document.getElementById('ui-top').classList.remove('hidden');
}

function selectMode(m) {
    state.mode = m;
    state.cards = {H:13, S:13, D:13, C:13}; state.total = 52;
    document.getElementById('label-mode').innerText = "الوضع: " + m;
    updateChart();
    showScreen('screen-play');
}

function drawCard() {
    let keys = Object.keys(state.cards);
    let s = keys[Math.floor(Math.random()*4)];
    if(state.mode === 'غير مستقلة' && state.total > 1) {
        state.cards[s]--; state.total--;
    }
    updateChart();
}

function updateChart() {
    const chart = document.getElementById('game-chart');
    chart.innerHTML = '';
    for(let k in state.cards) {
        let h = (state.cards[k]/state.total * 100);
        let color = (k=='H'||k=='D') ? 'var(--card-red)' : 'var(--ink)';
        chart.innerHTML += `<div class="bar" style="height:${h}%; background:${color}"></div>`;
    }
}
