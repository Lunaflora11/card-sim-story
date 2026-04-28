let state = JSON.parse(localStorage.getItem('probcard_state')) || {
    score: 0,
    completedModes: [],
    badges: { explorer: false, expert: false, pro: false },
    settings: { howToPlaySeen: false }
};

let currentMode = '';
let deckCount = 52;
let suits = { H: 13, S: 13, D: 13, C: 13 };
let drawCount = 0;
let challengeTimer = null;
let timeLeft = 60;

function startApp() {
    navTo(state.settings.howToPlaySeen ? 'screen-modes' : 'screen-guide');
    updateBadgesUI();
}

function viewedGuide() {
    state.settings.howToPlaySeen = true;
    save();
    navTo('screen-modes');
}

function initMode(mode) {
    currentMode = mode;
    deckCount = 52;
    suits = { H: 13, S: 13, D: 13, C: 13 };
    drawCount = 0;
    document.getElementById('ui-mode').innerText = "الوضع: " + getModeAr(mode);
    document.getElementById('btn-to-mastery').style.display = 'none';
    showIntroQuestion(mode);
}

function showIntroQuestion(mode) {
    const content = document.getElementById('pop-content');
    let q = mode === 'independent' ? "في الحوادث المستقلة، هل يتأثر احتمال السحبة الثانية بالسحبة الأولى؟" :
            mode === 'dependent' ? "في الحوادث غير المستقلة، إذا سحبنا كرت ولم نرجعه، هل يقل المقام (العدد الكلي)؟" :
            "هل أنت مستعد لبدء محاكاة " + getModeAr(mode) + "؟";

    content.innerHTML = `<h3>❓ سؤال تمهيدي (+10)</h3><p>${q}</p>
        <button class="btn" onclick="startSim(true)">نعم</button>
        <button class="btn" onclick="startSim(false)">لا</button>`;
    document.getElementById('overlay').style.display = 'flex';
}

function startSim(correct) {
    if(correct) state.score += 10;
    document.getElementById('overlay').style.display = 'none';
    navTo('screen-game');
    updateSimUI();
    setMission();
}

function setMission() {
    const msgs = {
        independent: "اسحب 3 كروت. لاحظ أن الاحتمالات لا تتغير (إرجاع).",
        dependent: "اسحب 3 كروت. لاحظ كيف تنقص الاحتمالات (بدون إرجاع).",
        mutually: "اسحب كرتين. ابحث عن احتمال ظهور (ملك ورقم 5) معاً.",
        'non-mutually': "اسحب كرتين. ابحث عن احتمال (كرت أحمر وملك) معاً."
    };
    document.getElementById('mission-msg').innerText = msgs[currentMode];
}

function handleDraw() {
    drawCount++;
    const suitKeys = Object.keys(suits);
    const picked = suitKeys[Math.floor(Math.random() * suitKeys.length)];

    if(currentMode === 'dependent' || currentMode === 'challenge') {
        if(suits[picked] > 0) {
            suits[picked]--;
            deckCount--;
        }
    }
    updateSimUI();
    if(drawCount >= 3) document.getElementById('btn-to-mastery').style.display = 'inline-block';
}

function updateSimUI() {
    const container = document.getElementById('bars-ui');
    if(!container) return;
    container.innerHTML = '';
    const symbols = {H:'♥', S:'♠', D:'♦', C:'♣'};
    for(let key in suits) {
        let prob = (suits[key] / deckCount * 100).toFixed(0);
        container.innerHTML += `
            <div class="bar-wrap">
                <div class="bar" style="height:${prob}%; background:${(key==='H'||key==='D')?'var(--card-red)':'var(--ink)'}"></div>
                <span class="bar-label">${symbols[key]}</span>
                <span class="bar-val">${suits[key]}/${deckCount}</span>
                <span class="bar-val">${prob}%</span>
            </div>`;
    }
    document.getElementById('ui-score').innerText = "النقاط: " + state.score;
}

function showExplanation() {
    const content = document.getElementById('pop-content');
    let txt = currentMode === 'independent' ? "الاحتمالات ثابتة دائماً (13/52) لأن الحادثة الأولى لا تؤثر على الثانية." : "الاحتمالات تتغير لأن سحب الكرت يغير فضاء العينة (المقام) وعدد الكروت المتبقية.";
    content.innerHTML = `<h3>📘 الدفتر العلمي</h3><p>${txt}</p><button class="btn" onclick="closePop()">فهمت</button>`;
    document.getElementById('overlay').style.display = 'flex';
}

function goToMastery() {
    const content = document.getElementById('pop-content');
    content.innerHTML = `<h3>🎯 سؤال الإتقان (+20)</h3><p>إذا كان احتمال الحدث A هو 1/4، فما احتمال عدم وقوعه (الحدث المتمم)؟</p>
        <button class="btn" onclick="finishMode(true)">3/4</button>
        <button class="btn" onclick="finishMode(false)">1/4</button>`;
    document.getElementById('overlay').style.display = 'flex';
}

function finishMode(correct) {
    if(correct) {
        state.score += 20;
        if(!state.completedModes.includes(currentMode)) state.completedModes.push(currentMode);
        checkBadges();
        save();
        alert("أحسنت! تم إكمال " + getModeAr(currentMode));
        navTo('screen-modes');
    } else alert("حاول مرة أخرى");
    closePop();
}

function startChallenge() {
    currentMode = 'challenge';
    timeLeft = 60;
    navTo('screen-game');
    document.getElementById('ui-timer').classList.remove('hidden');
    challengeTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('ui-timer').innerText = "⏱️ " + timeLeft;
        if(timeLeft <= 0) endChallenge();
    }, 1000);
}

function endChallenge() {
    clearInterval(challengeTimer);
    document.getElementById('ui-timer').classList.add('hidden');
    if(state.score >= 100) state.badges.pro = true;
    save();
    alert(state.score >= 75 ? "تم اجتياز التحدي!" : "انتهى الوقت!");
    navTo('screen-modes');
}

function navTo(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('help-btn').style.display = 'flex';
}

function getModeAr(m) {
    return {independent:'مستقلة', dependent:'غير مستقلة', mutually:'متنافية', 'non-mutually':'غير متنافية', challenge:'التحدي'}[m];
}

function checkBadges() {
    if(state.completedModes.length >= 1) state.badges.explorer = true;
    if(state.completedModes.length === 4) {
        state.badges.expert = true;
        let btn = document.getElementById('btn-challenge');
        btn.disabled = false;
        btn.style.background = 'var(--accent)';
        btn.innerText = "🔓 دخول التحدي";
    }
    updateBadgesUI();
}

function updateBadgesUI() {
    if(state.badges.explorer) document.getElementById('badge-explorer').classList.add('unlocked');
    if(state.badges.expert) document.getElementById('badge-expert').classList.add('unlocked');
    if(state.badges.pro) document.getElementById('badge-pro').classList.add('unlocked');
}

function save() { localStorage.setItem('probcard_state', JSON.stringify(state)); }
function closePop() { document.getElementById('overlay').style.display = 'none'; }
function showAbout() {
    const content = document.getElementById('pop-content');
    content.innerHTML = `<h3>عن PROBCARD</h3><p>مشروع مادة الرياضيات - الصف الثاني متوسط (موهبة).<br>إعداد: فرح الغامدي وفريقها المبدع.<br>بإشراف المعلمة: زهرة الشمراني.</p><button class="btn" onclick="closePop()">إغلاق</button>`;
    document.getElementById('overlay').style.display = 'flex';
}
function showHowToPlay() { navTo('screen-guide'); }

checkBadges();
