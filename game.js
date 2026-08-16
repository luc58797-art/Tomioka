
// ============================================================
// SPRITES REAIS DO JOGO
// ============================================================

const tomiokaSprite = new Image();
tomiokaSprite.src = "images/sprites/optimized/tomioka.png";

const chaoSprite = new Image();
chaoSprite.src = "images/chao.png";

const inimigosSprite = new Image();
inimigosSprite.src = "images/sprites/optimized/inimigos.png";

// ============================================================
// SPRITES INDIVIDUAIS DOS INIMIGOS
// ============================================================
//
// Quando os arquivos existirem, o jogo usa automaticamente:
//
// images/sprites/enemies/demonio.png
// images/sprites/enemies/slime.png
// images/sprites/enemies/espirito.png
// images/sprites/enemies/oni.png
// images/sprites/enemies/rui.png
// images/sprites/enemies/enmu.png
// images/sprites/enemies/akaza.png
// images/sprites/enemies/doma.png
// images/sprites/enemies/kaigaku.png
// images/sprites/enemies/kokushibo.png
//
// Se o arquivo não existir, usa o spritesheet antigo.
//

const enemySpriteCache = {};

const enemySpriteFiles = {
    "Slime": "images/sprites/enemies/slime.png",
    "Demônio": "images/sprites/enemies/demonio.png",
    "Espírito": "images/sprites/enemies/espirito.png",
    "Oni": "images/sprites/enemies/oni.png",

    "Rui": "images/sprites/enemies/rui.png",
    "Enmu": "images/sprites/enemies/enmu.png",
    "Akaza": "images/sprites/enemies/akaza.png",
    "Doma": "images/sprites/enemies/doma.png",
    "Kaigaku": "images/sprites/enemies/kaigaku.png",
    "Kokushibo": "images/sprites/enemies/kokushibo.png"
};

function getEnemySprite(enemy) {

    if (!enemy || !enemy.name)
        return null;

    const path =
        enemySpriteFiles[enemy.name];

    if (!path)
        return null;

    if (!enemySpriteCache[enemy.name]) {

        const img = new Image();

        img.onload = () => {
            enemySpriteCache[enemy.name] = img;
        };

        img.onerror = () => {
            enemySpriteCache[enemy.name] = null;
        };

        img.src = path;

        // Enquanto carrega, não força outro sprite.
        return null;
    }

    return enemySpriteCache[enemy.name];
}

const espadaSprite = new Image();
espadaSprite.src = "images/sprites/optimized/espada.png";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

let W = innerWidth;
let H = innerHeight;
let dpr = Math.min(devicePixelRatio || 1, 2);

function resize() {
    W = innerWidth;
    H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resize();
addEventListener("resize", resize);

const player = {
    x: W / 2,
    y: H / 2,
    r: 20,
    speed: 4.2,
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpNext: 100,
    coins: 0,

    attackCooldown: 0,
    specialCooldown: 0,
    invincible: 0,
    dashCooldown: 0,

    facing: 0,

    mastery: 0,
    masteryMax: 50,
    technique: 0
};

// Técnica atualmente selecionada
let selectedTechnique = 0;

const waterTechniques = [
    {
        name: "Corte da Água",
        short: "Corte",
        required: 0,
        damage: 34,
        color: "#38bdf8",
        wave: 1
    },
    {
        name: "Maré Crescente",
        short: "Maré",
        required: 50,
        damage: 48,
        color: "#60a5fa",
        wave: 2
    },
    {
        name: "Correnteza Giratória",
        short: "Correnteza",
        required: 120,
        damage: 65,
        color: "#22d3ee",
        wave: 3
    },
    {
        name: "Queda da Cachoeira",
        short: "Cachoeira",
        required: 220,
        damage: 86,
        color: "#93c5fd",
        wave: 4
    },
    {
        name: "Dança da Água",
        short: "Dança",
        required: 350,
        damage: 112,
        color: "#67e8f9",
        wave: 5
    },
    {
        name: "Fluxo Contínuo",
        short: "Fluxo",
        required: 550,
        damage: 145,
        color: "#38bdf8",
        wave: 6
    },
    {
        name: "Fluxo Supremo",
        short: "Supremo",
        required: 800,
        damage: 190,
        color: "#e0f2fe",
        wave: 7
    }
];

function updateTechnique() {
    let current = 0;

    for (let i = 0; i < waterTechniques.length; i++) {
        if (player.mastery >= waterTechniques[i].required)
            current = i;
    }

    player.technique = current;

    // Impede selecionar uma técnica ainda bloqueada.
    if (selectedTechnique > current)
        selectedTechnique = current;

    const next = waterTechniques[current + 1];

    player.masteryMax =
        next ? next.required : waterTechniques[current].required;
}

function addMastery(value) {
    const oldTechnique = player.technique;

    player.mastery += value;

    updateTechnique();

    text(
        player.x,
        player.y - 65,
        "+" + value + " MESTRIA",
        "#67e8f9",
        13
    );

    if (player.technique > oldTechnique) {
        const tech = waterTechniques[player.technique];

    // Som da Respiração da Água
    playWaterSlashSound();


        text(
            player.x,
            player.y - 95,
            "🌊 TÉCNICA DESBLOQUEADA!",
            "#facc15",
            16
        );

        text(
            player.x,
            player.y - 120,
            tech.name,
            "#bae6fd",
            15
        );

        addParticle(
            player.x,
            player.y,
            "#38bdf8",
            55,
            5
        );

        cameraShake = 10;
        playTone(880, .15, "triangle", .08);
        setTimeout(() => playTone(1100, .18, "sine", .06), 90);
    }
}

updateTechnique();

const enemies = [];
const projectiles = [];
const MAX_PARTICLES = 70;
const MAX_FLOATING_TEXTS = 35;
const MAX_SLASH_EFFECTS = 18;

const particles = [];
const floatingTexts = [];
const slashEffects = [];

const keys = {};

const joystick = {
    active: false,
    pointerId: null,
    dx: 0,
    dy: 0,
    max: 58
};

let attackPressed = false;
let attackPointerId = null;

let gameOver = false;
let paused = false;
let started = false;

let spawnTimer = 0;

// ==================== SISTEMA DE FASES ====================

let currentStage = 1;
let stageKills = 0;
let stageTarget = 20;

let stageTransition = 0;
let stageMessage = "";

function getStageTarget() {
    return 20 + (currentStage - 1) * 5;
}

function getStageName() {
    const names = [
        "Floresta da Água",
        "Floresta Noturna",
        "Vila Abandonada",
        "Templo Demoníaco",
        "Montanha Nevada",
        "Vale Sombrio",
        "Santuário da Lua",
        "Fortaleza Oni"
    ];

    return names[
        Math.min(
            currentStage - 1,
            names.length - 1
        )
    ];
}

function getStageDifficulty() {
    return 1 + (currentStage - 1) * 0.16;
}

function nextStage() {

    currentStage++;

    stageKills = 0;
    stageTarget = getStageTarget();

    stageTransition = 180;

    saveGame();

    stageMessage =
        "FASE " +
        currentStage +
        " • " +
        getStageName();

    // Limpa os inimigos restantes.
    enemies.length = 0;

    // Reinicia o spawn.
    spawnTimer = 70;

    // Pequena recuperação entre fases.
    player.hp = Math.min(
        player.maxHp,
        player.hp + Math.floor(player.maxHp * .25)
    );

    text(
        player.x,
        player.y - 55,
        "🌊 FASE " + currentStage,
        "#67e8f9",
        20
    );

    text(
        player.x,
        player.y - 30,
        getStageName(),
        "#bae6fd",
        14
    );

    addParticle(
        player.x,
        player.y,
        "#38bdf8",
        55,
        5
    );

    cameraShake = 12;

    playTone(
        620,
        .12,
        "triangle",
        .08
    );

    setTimeout(
        () => playTone(
            880,
            .18,
            "sine",
            .07
        ),
        100
    );
}

function checkStageComplete() {

    if (
        stageKills >= stageTarget &&
        enemies.length === 0 &&
        stageTransition <= 0
    ) {
        nextStage();
    }
}

stageTarget = getStageTarget();
let cameraShake = 0;
let worldTime = 0;

let musicEnabled = true;
let audioStarted = false;
let audioContext = null;
let musicTimer = null;

const stars = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: random(1, 2.5),
    speed: random(.1, .5),
    phase: random(0, Math.PI * 2)
}));

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestEnemy() {
    let best = null;
    let bestDistSq = Infinity;

    for (const e of enemies) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < bestDistSq) {
            bestDistSq = distSq;
            best = e;
        }
    }

    return best;
}

function addParticle(x, y, color, amount = 8, power = 2.5) {
    const available = Math.max(0, MAX_PARTICLES - particles.length);
    amount = Math.min(amount, available);

    for (let i = 0; i < amount; i++) {
        const a = random(0, Math.PI * 2);
        const s = random(.4, power);

        particles.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: random(20, 48),
            maxLife: 48,
            size: random(2, 5),
            color
        });
    }
}

function text(x, y, value, color = "#fff", size = 14) {
    if (floatingTexts.length >= MAX_FLOATING_TEXTS)
        floatingTexts.shift();

    floatingTexts.push({
        x,
        y,
        value,
        color,
        size,
        life: 55
    });
}

function spawnEnemy() {
    const side = Math.floor(random(0, 4));

    let x;
    let y;

    if (side === 0) {
        x = random(20, W - 20);
        y = -40;
    } else if (side === 1) {
        x = W + 40;
        y = random(90, H - 20);
    } else if (side === 2) {
        x = random(20, W - 20);
        y = H + 40;
    } else {
        x = -40;
        y = random(90, H - 20);
    }

    const roll = Math.random();

    let base;

    if (roll < .38) {
        base = {
            name: "Slime",
            color: "#4ade80",
            r: 18,
            hp: 35,
            speed: 1.15,
            damage: 8,
            xp: 20,
            coins: 3
        };
    } else if (roll < .68) {
        base = {
            name: "Demônio",
            color: "#ef476f",
            r: 22,
            hp: 60,
            speed: .8,
            damage: 13,
            xp: 35,
            coins: 6
        };
    } else if (roll < .88) {
        base = {
            name: "Espírito",
            color: "#a78bfa",
            r: 16,
            hp: 30,
            speed: 1.8,
            damage: 7,
            xp: 27,
            coins: 4
        };
    } else {
        base = {
            name: "Oni",
            color: "#f97316",
            r: 27,
            hp: 110,
            speed: .55,
            damage: 20,
            xp: 70,
            coins: 12
        };
    }

    const scale =
        (1 + (player.level - 1) * .14) *
        getStageDifficulty();

    enemies.push({
        x,
        y,
        r: base.r,
        name: base.name,
        color: base.color,
        hp: Math.floor(base.hp * scale),
        maxHp: Math.floor(base.hp * scale),
        speed:
            base.speed +
            player.level * .025 +
            (currentStage - 1) * .035,
        damage:
            base.damage +
            Math.floor(player.level * .55) +
            Math.floor((currentStage - 1) * 1.4),
        xp: base.xp + Math.floor(player.level * 2),
        coins: base.coins,
        hitFlash: 0,
        wobble: random(0, Math.PI * 2)
    });
}


function playWaterSlashSound() {
    if (!audioContext || !audioStarted || !musicEnabled)
        return;

    try {
        const now = audioContext.currentTime;

        // Ruído filtrado para dar sensação de água/correnteza
        const bufferSize = audioContext.sampleRate * 0.35;
        const buffer = audioContext.createBuffer(
            1,
            bufferSize,
            audioContext.sampleRate
        );

        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const fade = 1 - i / bufferSize;
            data[i] = (
                Math.random() * 2 - 1
            ) * fade * fade;
        }

        const noise = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        const gain = audioContext.createGain();

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(
            450,
            now + 0.32
        );
        filter.Q.value = 0.7;

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(
            0.055,
            now + 0.025
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.35
        );

        noise.buffer = buffer;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        noise.start(now);
        noise.stop(now + 0.36);

        // Pequeno "whoosh" da espada
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();

        osc.type = "sine";

        osc.frequency.setValueAtTime(
            520,
            now
        );

        osc.frequency.exponentialRampToValueAtTime(
            180,
            now + 0.22
        );

        oscGain.gain.setValueAtTime(
            0.0001,
            now
        );

        oscGain.gain.exponentialRampToValueAtTime(
            0.045,
            now + 0.025
        );

        oscGain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.24
        );

        osc.connect(oscGain);
        oscGain.connect(audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.25);

    } catch (err) {
        console.log("Erro no som da água:", err);
    }
}


function useSpecial() {
    if (!started || paused || gameOver) return;

    if (upgradeMenuOpen)
        return;
    if (player.specialCooldown > 0) return;

    selectedTechnique = player.technique;

    const tech = waterTechniques[selectedTechnique];

    if (!tech) return;

    const target = nearestEnemy();

    if (!target) {
        text(
            player.x,
            player.y - 70,
            "🌊 SEM ALVO",
            "#67e8f9",
            12
        );
        return;
    }

    const angle = Math.atan2(
        target.y - player.y,
        target.x - player.x
    );

    player.facing = angle;

    const range =
        150 + selectedTechnique * 18;

    const damage =
        Math.floor(
            tech.damage * 2.2 +
            player.level * 10 +
            player.mastery * .08
        );

    const hitEnemies = [];

    for (const enemy of enemies) {
        const d = distance(player, enemy);

        if (d <= range + enemy.r) {
            const a = Math.atan2(
                enemy.y - player.y,
                enemy.x - player.x
            );

            let diff = Math.abs(a - angle);

            if (diff > Math.PI)
                diff = Math.PI * 2 - diff;

            if (diff <= 1.15) {
                enemy.hp -= damage;
                enemy.hitFlash = 12;

                text(
                    enemy.x,
                    enemy.y - 24,
                    "-" + damage,
                    tech.color,
                    15
                );

                hitEnemies.push(enemy);

                addParticle(
                    enemy.x,
                    enemy.y,
                    tech.color,
                    28 + selectedTechnique * 5,
                    5 + selectedTechnique * .5
                );
            }
        }
    }

    // Grande onda de água
    if (slashEffects.length < MAX_SLASH_EFFECTS)
        slashEffects.push({
        x: player.x + Math.cos(angle) * 35,
        y: player.y + Math.sin(angle) * 35,
        angle,
        life: 32,
        maxLife: 32,
        technique: selectedTechnique,
        color: tech.color,
        special: true
    });

    // Segunda onda visual
    slashEffects.push({
        x: player.x,
        y: player.y,
        angle: angle + Math.PI * .55,
        life: 24,
        maxLife: 24,
        technique: selectedTechnique,
        color: "#e0f2fe",
        special: true
    });

    addParticle(
        player.x,
        player.y,
        tech.color,
        45 + selectedTechnique * 7,
        6 + selectedTechnique * .5
    );

    cameraShake =
        8 + selectedTechnique * 1.2;

    playWaterSlashSound();

    playTone(
        260 + selectedTechnique * 65,
        .18,
        "sine",
        .10
    );

    text(
        player.x,
        player.y - 95,
        "🌊 " + tech.name.toUpperCase(),
        tech.color,
        16
    );

    player.specialCooldown =
        Math.max(
            75,
            145 - selectedTechnique * 7
        );

    // Mata inimigos atingidos
    for (const enemy of hitEnemies) {
        if (enemy.hp <= 0)
            killEnemy(enemy);
    }
}

function attack() {
    if (!started || paused || gameOver) return;
    if (player.attackCooldown > 0) return;

    const target = nearestEnemy();

    if (!target) return;

    const tech = waterTechniques[selectedTechnique];

    const angle = Math.atan2(
        target.y - player.y,
        target.x - player.x
    );

    player.facing = angle;

    // Alcance do golpe
    const attackRange =
        105 + selectedTechnique * 7;

    const targetDistance =
        distance(player, target);

    // Se estiver longe, não acerta.
    if (targetDistance > attackRange + target.r)
        return;

    const damage =
        tech.damage +
        player.level * 6 +
        Math.floor(player.mastery * .035);

    // DANO DIRETO
    target.hp -= damage + (player.damageBonus || 0);
    target.hitFlash = 7;

    text(
        target.x,
        target.y - 20,
        "-" + damage,
        tech.color
    );

    // Efeito de água
    slashEffects.push({
        x: player.x + Math.cos(angle) * 24,
        y: player.y + Math.sin(angle) * 24,
        angle,
        life: 18,
        maxLife: 18,
        technique: selectedTechnique,
        color: tech.color
    });

    addParticle(
        target.x,
        target.y,
        tech.color,
        16 + selectedTechnique * 4,
        3.5 + selectedTechnique * .35
    );

    cameraShake =
        3 + selectedTechnique * .7;

    playWaterSlashSound();

    playTone(
        430 + selectedTechnique * 70,
        .055,
        "sine",
        .05
    );

    player.attackCooldown =
        Math.max(
            8,
            17 - selectedTechnique
        );

    if (target.hp <= 0)
        killEnemy(target);
}

function gainXP(value) {
    player.xp += value;

    while (player.xp >= player.xpNext) {
        player.xp -= player.xpNext;
        player.level++;

        player.xpNext = Math.floor(player.xpNext * 1.35);

        player.maxHp += 15;
        player.hp = player.maxHp;

        text(
            player.x,
            player.y - 50,
            "⚡ LEVEL UP!",
            "#facc15",
            19
        );

        addParticle(
            player.x,
            player.y,
            "#facc15",
            45,
            5
        );

        cameraShake = 8;
        playTone(780, .12, "triangle", .08);
    }
}

function killEnemy(enemy) {

    // Conta apenas inimigos realmente derrotados.
    stageKills++;

    const index = enemies.indexOf(enemy);

    if (index !== -1)
        enemies.splice(index, 1);

    player.coins += enemy.coins;

    gainXP(enemy.xp);

    // Cada Oni derrotado aumenta a maestria.
    const masteryGain =
        enemy.name === "Oni"
            ? 10
            : enemy.name === "Demônio"
                ? 7
                : 5;

    addMastery(masteryGain);

    checkStageComplete();

    text(
        enemy.x,
        enemy.y - 25,
        "+" + enemy.xp + " XP",
        "#93c5fd"
    );

    text(
        enemy.x,
        enemy.y - 5,
        "+" + enemy.coins + " 💰",
        "#facc15",
        12
    );

    addParticle(
        enemy.x,
        enemy.y,
        enemy.color,
        35,
        4.5
    );

    cameraShake = 6;

    playTone(
        160 + player.technique * 20,
        .07,
        "square",
        .035
    );
}

function update() {

    updateShop();


    ensurePlayerEnergy();

    // Detecta passagem de fase e entrega um ponto.
    if (
        currentStage > lastUpgradeStage &&
        currentStage > 1
    ) {
        lastUpgradeStage = currentStage;
        giveStageUpgradePoint();
    }


    if (stageTransition > 0)
        stageTransition--;


    if (!started || paused || gameOver) return;

    worldTime++;

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) dy--;
    if (keys["s"] || keys["arrowdown"]) dy++;
    if (keys["a"] || keys["arrowleft"]) dx--;
    if (keys["d"] || keys["arrowright"]) dx++;

    if (joystick.active) {
        dx += joystick.dx;
        dy += joystick.dy;
    }

    const len = Math.hypot(dx, dy);

    if (len > 0) {
        dx /= len;
        dy /= len;

        player.x += dx * player.speed;
        player.y += dy * player.speed;

        player.facing = Math.atan2(dy, dx);
    }

    player.x = clamp(player.x, 28, W - 28);
    player.y = clamp(player.y, 125, H - 28);

    // Impede o Tomioka de atravessar objetos do cenário.
    resolvePlayerScenarioCollision();

    if (player.attackCooldown > 0)
        player.attackCooldown--;

    if (player.specialCooldown > 0)
        player.specialCooldown--;

    if (player.invincible > 0)
        player.invincible--;

    if (player.dashCooldown > 0)
        player.dashCooldown--;

    if (attackPressed)
        attack();

    spawnTimer--;

    // Quantos inimigos ainda precisam nascer
    // para completar a fase.
    const remaining =
        Math.max(
            0,
            stageTarget - stageKills - enemies.length
        );

    // Mais inimigos simultâneos nas fases maiores.
    const maxEnemies =
        Math.min(
            30,
            5 +
            Math.floor(player.level * 1.5) +
            Math.floor(currentStage * 1.4)
        );

    if (
        stageTransition <= 0 &&
        remaining > 0 &&
        spawnTimer <= 0 &&
        enemies.length < maxEnemies
    ) {
        spawnEnemy();

        spawnTimer =
            Math.max(
                12,
                70 -
                player.level * 3 -
                currentStage * 2
            );
    }

    for (const enemy of enemies) {
        const angle = Math.atan2(
            player.y - enemy.y,
            player.x - enemy.x
        );

        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        enemy.wobble += .06;

        if (enemy.hitFlash > 0)
            enemy.hitFlash--;

        const d = distance(player, enemy);

        if (d < player.r + enemy.r) {
            if (player.invincible <= 0) {
                player.hp -= enemy.damage;
                player.invincible = 38;

                text(
                    player.x,
                    player.y - 35,
                    "-" + enemy.damage,
                    "#ef4444",
                    16
                );

                addParticle(
                    player.x,
                    player.y,
                    "#ef4444",
                    14,
                    3
                );

                cameraShake = 8;
                playTone(90, .09, "sawtooth", .06);

                if (player.hp <= 0) {
                    player.hp = 0;
                    gameOver = true;
                    playTone(55, .3, "sawtooth", .07);
                }
            }
        }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        let removed = false;

        for (const enemy of enemies) {
            if (distance(p, enemy) < p.r + enemy.r) {
                enemy.hp -= p.damage;
                enemy.hitFlash = 5;

                addParticle(
                    p.x,
                    p.y,
                    "#38bdf8",
                    5,
                    2.2
                );

                text(
                    enemy.x,
                    enemy.y - 20,
                    "-" + p.damage,
                    "#7dd3fc"
                );

                projectiles.splice(i, 1);
                removed = true;

                if (enemy.hp <= 0)
                    killEnemy(enemy);

                break;
            }
        }

        if (
            !removed &&
            (
                p.life <= 0 ||
                p.x < -60 ||
                p.x > W + 60 ||
                p.y < -60 ||
                p.y > H + 60
            )
        ) {
            projectiles.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= .965;
        p.vy *= .965;

        p.life--;

        if (p.life <= 0)
            particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];

        t.y -= .65;
        t.life--;

        if (t.life <= 0)
            floatingTexts.splice(i, 1);
    }

    for (let i = slashEffects.length - 1; i >= 0; i--) {
        slashEffects[i].life--;

        if (slashEffects[i].life <= 0)
            slashEffects.splice(i, 1);
    }

    if (cameraShake > .1)
        cameraShake *= .82;
    else
        cameraShake = 0;
}


// ============================================================
// OBSTÁCULOS / COLISÃO DO CENÁRIO
// ============================================================


// ============================================================
// MAPAS DE COLISÃO DAS FASES
// ============================================================
//
// Cada obstáculo usa coordenadas normalizadas:
//
// circle:
// x = posição horizontal 0..1
// y = posição vertical   0..1
// r = raio proporcional
//
// rect:
// x/y = canto superior esquerdo
// w/h = tamanho proporcional
//
// O mesmo mapa é usado para:
// 1. desenhar o objeto
// 2. detectar colisão
// 3. impedir o movimento
//
// ============================================================

let DEBUG_COLLISION_MAP = true;



// ============================================================
// SISTEMA DE EVOLUÇÃO POR FASE
// ============================================================

let upgradePoints = 0;
let upgradeMenuOpen = false;
let lastUpgradeStage = 1;

// Energia própria do Tomioka.
// Criada sem quebrar saves antigos.
function ensurePlayerEnergy() {

    if (!Number.isFinite(player.maxEnergy))
        player.maxEnergy = 100;

    if (!Number.isFinite(player.energy))
        player.energy = player.maxEnergy;

    if (!Number.isFinite(player.damageBonus))
        player.damageBonus = 0;
}

function giveStageUpgradePoint() {

    ensurePlayerEnergy();

    upgradePoints++;
    upgradeMenuOpen = true;

    paused = true;

    playTone(
        880,
        .12,
        "triangle",
        .08
    );

    text(
        player.x,
        player.y - 75,
        "⭐ PONTO DE EVOLUÇÃO!",
        "#facc15",
        18
    );
}

function applyUpgrade(option) {

    ensurePlayerEnergy();

    if (upgradePoints <= 0)
        return;

    if (option === 1) {

        // VIDA
        player.maxHp += 25;
        player.hp = player.maxHp;

        text(
            player.x,
            player.y - 55,
            "❤️ VIDA +25",
            "#f87171",
            18
        );

    } else if (option === 2) {

        // ENERGIA
        player.maxEnergy += 20;
        player.energy = player.maxEnergy;

        text(
            player.x,
            player.y - 55,
            "⚡ ENERGIA +20",
            "#60a5fa",
            18
        );

    } else if (option === 3) {

        // DINHEIRO
        player.coins += 500;

        text(
            player.x,
            player.y - 55,
            "💰 +500",
            "#facc15",
            18
        );

    } else if (option === 4) {

        // PODER
        player.damageBonus += 5;

        text(
            player.x,
            player.y - 55,
            "⚔️ PODER +5",
            "#c084fc",
            18
        );
    }

    upgradePoints--;

    if (upgradePoints <= 0) {

        upgradeMenuOpen = false;
        paused = false;

        playTone(
            620,
            .10,
            "triangle",
            .06
        );
    }
}


// ============================================================
// MENU DE EVOLUÇÃO
// ============================================================

function drawUpgradeMenu() {

    if (!upgradeMenuOpen)
        return;

    ensurePlayerEnergy();

    ctx.save();

    // Fundo escuro
    ctx.fillStyle = "rgba(0,0,0,.78)";
    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    const panelW =
        Math.min(
            520,
            W - 30
        );

    const panelH = 390;

    const panelX =
        (W - panelW) / 2;

    const panelY =
        Math.max(
            85,
            (H - panelH) / 2
        );

    // Painel
    ctx.fillStyle = "rgba(15,23,42,.97)";

    ctx.beginPath();

    ctx.roundRect(
        panelX,
        panelY,
        panelW,
        panelH,
        22
    );

    ctx.fill();

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;

    ctx.stroke();

    // Título
    ctx.textAlign = "center";

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 25px sans-serif";

    ctx.fillText(
        "⭐ EVOLUÇÃO",
        W / 2,
        panelY + 42
    );

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "15px sans-serif";

    ctx.fillText(
        "Você ganhou 1 ponto de evolução!",
        W / 2,
        panelY + 68
    );

    // ========================================================
    // BOTÕES
    // ========================================================

    const gap = 10;

    const buttonW =
        (panelW - 45) / 2;

    const buttonH = 105;

    const buttons = [

        {
            x: panelX + 15,
            y: panelY + 90,
            color: "#7f1d1d",
            title: "❤️ VIDA",
            desc: "+25 Vida Máxima"
        },

        {
            x: panelX + 30 + buttonW,
            y: panelY + 90,
            color: "#1e3a8a",
            title: "⚡ ENERGIA",
            desc: "+20 Energia Máxima"
        },

        {
            x: panelX + 15,
            y: panelY + 205,
            color: "#713f12",
            title: "💰 DINHEIRO",
            desc: "+500 Moedas"
        },

        {
            x: panelX + 30 + buttonW,
            y: panelY + 205,
            color: "#581c87",
            title: "⚔️ PODER",
            desc: "+5 Dano"
        }
    ];

    buttons.forEach((b, index) => {

        ctx.fillStyle = b.color;

        ctx.beginPath();

        ctx.roundRect(
            b.x,
            b.y,
            buttonW,
            buttonH,
            15
        );

        ctx.fill();

        ctx.strokeStyle =
            "rgba(255,255,255,.25)";

        ctx.lineWidth = 2;

        ctx.stroke();

        ctx.fillStyle = "#ffffff";

        ctx.font = "bold 17px sans-serif";

        ctx.fillText(
            b.title,
            b.x + buttonW / 2,
            b.y + 38
        );

        ctx.font = "13px sans-serif";

        ctx.fillStyle = "#cbd5e1";

        ctx.fillText(
            b.desc,
            b.x + buttonW / 2,
            b.y + 65
        );

        ctx.fillStyle = "#facc15";

        ctx.font = "bold 12px sans-serif";

        ctx.fillText(
            "TOQUE / " + (index + 1),
            b.x + buttonW / 2,
            b.y + 88
        );
    });

    // Pontos
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px sans-serif";

    ctx.fillText(
        "Pontos restantes: " + upgradePoints,
        W / 2,
        panelY + 340
    );

    ctx.restore();
}


// ============================================================
// CRÉDITOS
// ============================================================

function drawGameCredits() {

    ctx.save();

    ctx.globalAlpha = .65;

    ctx.fillStyle = "#cbd5e1";

    ctx.font =
        "11px sans-serif";

    ctx.textAlign = "center";

    ctx.fillText(
        "Criado por João Lucas",
        W / 2,
        H - 8
    );

    ctx.restore();
}



// ============================================================
// LOJA DO TOMIOKA
// ============================================================

const TOMIOKA_SHOP_VERSION = "1.0";

let shopOpen = false;
let shopMessage = "";
let shopMessageTimer = 0;
let shopMessageColor = "#facc15";

const shopItems = [

    {
        id: "life",
        icon: "❤️",
        name: "POÇÃO DE VIDA",
        description: "Recupera 50% da vida",
        basePrice: 250
    },

    {
        id: "energy",
        icon: "⚡",
        name: "POÇÃO DE ENERGIA",
        description: "Recupera 50% da energia",
        basePrice: 200
    },

    {
        id: "power",
        icon: "⚔️",
        name: "TREINO DE PODER",
        description: "+5 dano permanente",
        basePrice: 600
    },

    {
        id: "defense",
        icon: "🛡️",
        name: "TREINO DE RESISTÊNCIA",
        description: "+10 vida máxima",
        basePrice: 700
    },

    {
        id: "speed",
        icon: "💨",
        name: "TREINO DE VELOCIDADE",
        description: "+0.15 velocidade",
        basePrice: 800
    }
];

const shopPurchases = {
    life: 0,
    energy: 0,
    power: 0,
    defense: 0,
    speed: 0
};


// ============================================================
// GARANTE OS ATRIBUTOS
// ============================================================

function ensureShopStats() {

    if (!Number.isFinite(player.coins))
        player.coins = 0;

    if (!Number.isFinite(player.maxEnergy))
        player.maxEnergy = 100;

    if (!Number.isFinite(player.energy))
        player.energy = player.maxEnergy;

    if (!Number.isFinite(player.damageBonus))
        player.damageBonus = 0;

    if (!Number.isFinite(player.speed))
        player.speed = 3;
}


// ============================================================
// PREÇO PROGRESSIVO
// ============================================================

function getShopPrice(item) {

    const bought =
        shopPurchases[item.id] || 0;

    return Math.floor(
        item.basePrice *
        Math.pow(1.35, bought)
    );
}


// ============================================================
// MENSAGEM
// ============================================================

function shopNotify(
    message,
    color = "#facc15"
) {

    shopMessage = message;
    shopMessageTimer = 100;
    shopMessageColor = color;

    playTone(
        700,
        .10,
        "triangle",
        .06
    );
}


// ============================================================
// ABRIR / FECHAR
// ============================================================

function openShop() {

    ensureShopStats();

    if (upgradeMenuOpen)
        return;

    shopOpen = true;
    paused = true;

    playTone(
        520,
        .08,
        "triangle",
        .05
    );
}


function closeShop() {

    shopOpen = false;

    if (!upgradeMenuOpen)
        paused = false;

    playTone(
        360,
        .07,
        "triangle",
        .04
    );
}


// ============================================================
// COMPRA
// ============================================================

function buyShopItem(id) {

    ensureShopStats();

    if (!shopOpen)
        return;

    const item =
        shopItems.find(
            x => x.id === id
        );

    if (!item)
        return;

    const price =
        getShopPrice(item);

    if (player.coins < price) {

        shopNotify(
            "💸 DINHEIRO INSUFICIENTE!",
            "#f87171"
        );

        playTone(
            180,
            .12,
            "sawtooth",
            .04
        );

        return;
    }


    // ========================================================
    // VIDA
    // ========================================================

    if (id === "life") {

        if (player.hp >= player.maxHp) {

            shopNotify(
                "❤️ SUA VIDA JÁ ESTÁ CHEIA!",
                "#facc15"
            );

            return;
        }

        player.coins -= price;

        const heal =
            Math.max(
                1,
                Math.floor(
                    player.maxHp * .50
                )
            );

        player.hp =
            Math.min(
                player.maxHp,
                player.hp + heal
            );
    }


    // ========================================================
    // ENERGIA
    // ========================================================

    else if (id === "energy") {

        if (
            player.energy >=
            player.maxEnergy
        ) {

            shopNotify(
                "⚡ SUA ENERGIA JÁ ESTÁ CHEIA!",
                "#facc15"
            );

            return;
        }

        player.coins -= price;

        const restore =
            Math.max(
                1,
                Math.floor(
                    player.maxEnergy * .50
                )
            );

        player.energy =
            Math.min(
                player.maxEnergy,
                player.energy + restore
            );
    }


    // ========================================================
    // PODER
    // ========================================================

    else if (id === "power") {

        player.coins -= price;

        player.damageBonus += 5;
    }


    // ========================================================
    // RESISTÊNCIA
    // ========================================================

    else if (id === "defense") {

        player.coins -= price;

        player.maxHp += 10;
        player.hp += 10;
    }


    // ========================================================
    // VELOCIDADE
    // ========================================================

    else if (id === "speed") {

        player.coins -= price;

        player.speed += .15;
    }


    else {
        return;
    }


    shopPurchases[id] =
        (shopPurchases[id] || 0) + 1;


    shopNotify(
        "✅ COMPRA REALIZADA!",
        "#4ade80"
    );

    addParticle(
        player.x,
        player.y,
        "#facc15",
        20,
        3
    );
}


// ============================================================
// BOTÃO DA LOJA
// ============================================================

function drawShopButton() {

    if (
        !started ||
        gameOver ||
        upgradeMenuOpen ||
        shopOpen
    )
        return;

    ensureShopStats();

    const w = 112;
    const h = 42;

    // Loja fica à esquerda do botão DEV.
    const x =
        W - 112 - 92;

    const y = 84;

    ctx.save();

    ctx.fillStyle =
        "rgba(15,23,42,.90)";

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        w,
        h,
        12
    );

    ctx.fill();

    ctx.strokeStyle =
        "#facc15";

    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.textAlign = "center";

    ctx.fillStyle = "#facc15";

    ctx.font =
        "bold 16px sans-serif";

    ctx.fillText(
        "💰 LOJA",
        x + w / 2,
        y + 18
    );

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold 12px sans-serif";

    ctx.fillText(
        player.coins + " moedas",
        x + w / 2,
        y + 34
    );

    ctx.restore();
}


// ============================================================
// MENU DA LOJA
// ============================================================

function drawShopMenu() {

    if (!shopOpen)
        return;

    ensureShopStats();

    ctx.save();

    // Fundo
    ctx.fillStyle =
        "rgba(0,0,0,.80)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const panelW =
        Math.min(
            560,
            W - 24
        );

    const panelH =
        Math.min(
            620,
            H - 90
        );

    const panelX =
        (W - panelW) / 2;

    const panelY =
        Math.max(
            45,
            (H - panelH) / 2
        );


    // Painel
    ctx.fillStyle =
        "rgba(15,23,42,.98)";

    ctx.beginPath();

    ctx.roundRect(
        panelX,
        panelY,
        panelW,
        panelH,
        22
    );

    ctx.fill();

    ctx.strokeStyle =
        "#facc15";

    ctx.lineWidth = 3;

    ctx.stroke();


    // ========================================================
    // CABEÇALHO
    // ========================================================

    ctx.textAlign = "center";

    ctx.fillStyle =
        "#facc15";

    ctx.font =
        "bold 26px sans-serif";

    ctx.fillText(
        "💰 LOJA DO TOMIOKA",
        W / 2,
        panelY + 38
    );


    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 16px sans-serif";

    ctx.fillText(
        "💰 " + player.coins + " moedas",
        W / 2,
        panelY + 65
    );


    // Botão X
    ctx.fillStyle =
        "#7f1d1d";

    ctx.beginPath();

    ctx.roundRect(
        panelX + panelW - 48,
        panelY + 14,
        32,
        32,
        9
    );

    ctx.fill();

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 18px sans-serif";

    ctx.fillText(
        "X",
        panelX + panelW - 32,
        panelY + 36
    );


    // ========================================================
    // ITENS
    // ========================================================

    const gap = 10;

    const itemW =
        panelW - 30;

    const itemH =
        Math.min(
            78,
            (panelH - 105) / shopItems.length
        );


    shopItems.forEach(
        (item, index) => {

            const x =
                panelX + 15;

            const y =
                panelY +
                82 +
                index *
                (itemH + gap);

            const price =
                getShopPrice(item);

            const canBuy =
                player.coins >= price;


            // Fundo
            ctx.fillStyle =
                canBuy
                    ? "rgba(30,41,59,.96)"
                    : "rgba(30,41,59,.55)";

            ctx.beginPath();

            ctx.roundRect(
                x,
                y,
                itemW,
                itemH,
                13
            );

            ctx.fill();


            ctx.strokeStyle =
                canBuy
                    ? "rgba(250,204,21,.35)"
                    : "rgba(255,255,255,.08)";

            ctx.lineWidth = 2;

            ctx.stroke();


            // Ícone
            ctx.textAlign = "left";

            ctx.font =
                "24px sans-serif";

            ctx.fillStyle =
                canBuy
                    ? "#ffffff"
                    : "#64748b";

            ctx.fillText(
                item.icon,
                x + 12,
                y + 32
            );


            // Nome
            ctx.font =
                "bold 14px sans-serif";

            ctx.fillStyle =
                canBuy
                    ? "#f8fafc"
                    : "#94a3b8";

            ctx.fillText(
                item.name,
                x + 50,
                y + 25
            );


            // Descrição
            ctx.font =
                "11px sans-serif";

            ctx.fillStyle =
                "#94a3b8";

            ctx.fillText(
                item.description,
                x + 50,
                y + 44
            );


            // Compras
            ctx.fillStyle =
                "#64748b";

            ctx.font =
                "10px sans-serif";

            ctx.fillText(
                "Comprado: " +
                (shopPurchases[item.id] || 0),
                x + 50,
                y + 62
            );


            // Preço
            ctx.textAlign = "right";

            ctx.fillStyle =
                canBuy
                    ? "#facc15"
                    : "#f87171";

            ctx.font =
                "bold 14px sans-serif";

            ctx.fillText(
                "💰 " + price,
                x + itemW - 12,
                y + 31
            );


            ctx.fillStyle =
                canBuy
                    ? "#4ade80"
                    : "#f87171";

            ctx.font =
                "bold 10px sans-serif";

            ctx.fillText(
                canBuy
                    ? "COMPRAR"
                    : "SEM DINHEIRO",
                x + itemW - 12,
                y + 52
            );
        }
    );


    // ========================================================
    // MENSAGEM
    // ========================================================

    if (shopMessageTimer > 0) {

        ctx.textAlign = "center";

        ctx.fillStyle =
            shopMessageColor;

        ctx.font =
            "bold 17px sans-serif";

        ctx.fillText(
            shopMessage,
            W / 2,
            panelY + panelH - 18
        );
    }


    ctx.restore();
}


// ============================================================
// ATUALIZA MENSAGEM
// ============================================================

function updateShop() {

    if (shopMessageTimer > 0)
        shopMessageTimer--;
}


// ============================================================
// TOQUE / CLIQUE NA LOJA
// ============================================================

function shopPointer(x, y) {

    // --------------------------------------------------------
    // FECHAR
    // --------------------------------------------------------

    if (shopOpen) {

        const panelW =
            Math.min(
                560,
                W - 24
            );

        const panelH =
            Math.min(
                620,
                H - 90
            );

        const panelX =
            (W - panelW) / 2;

        const panelY =
            Math.max(
                45,
                (H - panelH) / 2
            );


        // X
        if (
            x >= panelX + panelW - 48 &&
            x <= panelX + panelW - 16 &&
            y >= panelY + 14 &&
            y <= panelY + 46
        ) {

            closeShop();
            return true;
        }


        // Itens
        const gap = 10;

        const itemW =
            panelW - 30;

        const itemH =
            Math.min(
                78,
                (panelH - 105) /
                shopItems.length
            );


        for (
            let i = 0;
            i < shopItems.length;
            i++
        ) {

            const itemY =
                panelY +
                82 +
                i *
                (itemH + gap);


            if (
                x >= panelX + 15 &&
                x <= panelX + 15 + itemW &&
                y >= itemY &&
                y <= itemY + itemH
            ) {

                buyShopItem(
                    shopItems[i].id
                );

                return true;
            }
        }

        return true;
    }


    // --------------------------------------------------------
    // BOTÃO
    // --------------------------------------------------------

    if (
        !upgradeMenuOpen &&
        started &&
        !gameOver
    ) {

        const w = 112;
        const h = 42;

        const bx =
            W - w - 92;

        const by = 84;

        if (
            x >= bx &&
            x <= bx + w &&
            y >= by &&
            y <= by + h
        ) {

            openShop();

            return true;
        }
    }

    return false;
}


// ============================================================
// TECLA L
// ============================================================

addEventListener(
    "keydown",
    function(e) {

        if (
            e.key.toLowerCase() === "l" &&
            started &&
            !gameOver
        ) {

            if (shopOpen)
                closeShop();
            else if (!upgradeMenuOpen)
                openShop();
        }

        if (
            shopOpen &&
            e.key === "Escape"
        ) {
            closeShop();
        }
    }
);


// ============================================================
// TOQUE NO CELULAR
// ============================================================

addEventListener(
    "touchend",
    function(e) {

        if (
            !started ||
            gameOver
        )
            return;

        const touch =
            e.changedTouches[0];

        if (!touch)
            return;

        const rect =
            canvas.getBoundingClientRect();

        const x =
            (touch.clientX - rect.left) *
            (W / rect.width);

        const y =
            (touch.clientY - rect.top) *
            (H / rect.height);


        if (
            shopPointer(
                x,
                y
            )
        ) {

            e.preventDefault();
            e.stopPropagation();
        }
    },
    {
        passive: false
    }
);


const stageCollisionMaps = {

    // ========================================================
    // FASE 1 - FLORESTA DA ÁGUA
    // ========================================================
    1: [
        { type:"circle", x:.14, y:.27, r:.045, kind:"arvore" },
        { type:"circle", x:.28, y:.24, r:.038, kind:"pedra" },
        { type:"circle", x:.84, y:.27, r:.045, kind:"arvore" },
        { type:"circle", x:.72, y:.40, r:.035, kind:"pedra" },

        { type:"circle", x:.18, y:.66, r:.042, kind:"pedra" },
        { type:"circle", x:.34, y:.78, r:.050, kind:"arvore" },
        { type:"circle", x:.68, y:.73, r:.045, kind:"arvore" },
        { type:"circle", x:.84, y:.62, r:.040, kind:"pedra" },

        { type:"circle", x:.50, y:.34, r:.032, kind:"pedra" }
    ],

    // ========================================================
    // FASE 2 - FLORESTA NOTURNA
    // ========================================================
    2: [
        { type:"circle", x:.14, y:.28, r:.055, kind:"arvore" },
        { type:"circle", x:.30, y:.22, r:.045, kind:"arvore" },
        { type:"circle", x:.82, y:.25, r:.055, kind:"arvore" },
        { type:"circle", x:.68, y:.38, r:.045, kind:"arvore" },

        { type:"circle", x:.18, y:.67, r:.050, kind:"arvore" },
        { type:"circle", x:.36, y:.76, r:.045, kind:"arvore" },
        { type:"circle", x:.66, y:.75, r:.050, kind:"arvore" },
        { type:"circle", x:.84, y:.65, r:.045, kind:"arvore" },

        { type:"circle", x:.50, y:.30, r:.035, kind:"pedra" }
    ],

    // ========================================================
    // FASE 3 - VILA ABANDONADA
    // ========================================================
    3: [
        { type:"rect", x:.06, y:.21, w:.22, h:.13, kind:"casa" },
        { type:"rect", x:.72, y:.21, w:.22, h:.13, kind:"casa" },

        { type:"rect", x:.08, y:.65, w:.20, h:.13, kind:"casa" },
        { type:"rect", x:.72, y:.64, w:.20, h:.14, kind:"casa" },

        { type:"rect", x:.34, y:.24, w:.08, h:.08, kind:"barril" },
        { type:"rect", x:.58, y:.24, w:.08, h:.08, kind:"barril" },

        { type:"rect", x:.35, y:.68, w:.08, h:.08, kind:"barril" },
        { type:"rect", x:.57, y:.68, w:.08, h:.08, kind:"barril" }
    ],

    // ========================================================
    // FASE 4 - TEMPLO DEMONÍACO
    // ========================================================
    4: [
        { type:"rect", x:.08, y:.20, w:.08, h:.34, kind:"coluna" },
        { type:"rect", x:.84, y:.20, w:.08, h:.34, kind:"coluna" },

        { type:"rect", x:.28, y:.68, w:.16, h:.09, kind:"altar" },
        { type:"rect", x:.56, y:.68, w:.16, h:.09, kind:"altar" },

        { type:"rect", x:.24, y:.34, w:.10, h:.08, kind:"coluna" },
        { type:"rect", x:.66, y:.34, w:.10, h:.08, kind:"coluna" },

        { type:"rect", x:.44, y:.48, w:.12, h:.10, kind:"altar" }
    ],

    // ========================================================
    // FASE 5 - MONTANHA NEVADA
    // ========================================================
    5: [
        { type:"circle", x:.15, y:.27, r:.060, kind:"neve" },
        { type:"circle", x:.31, y:.23, r:.045, kind:"neve" },
        { type:"circle", x:.82, y:.27, r:.060, kind:"neve" },
        { type:"circle", x:.68, y:.38, r:.045, kind:"neve" },

        { type:"circle", x:.18, y:.68, r:.055, kind:"neve" },
        { type:"circle", x:.34, y:.77, r:.050, kind:"neve" },
        { type:"circle", x:.67, y:.74, r:.055, kind:"neve" },
        { type:"circle", x:.84, y:.64, r:.050, kind:"neve" },

        { type:"circle", x:.50, y:.31, r:.038, kind:"neve" }
    ],

    // ========================================================
    // FASE 6 - VALE SOMBRIO
    // ========================================================
    6: [
        { type:"circle", x:.14, y:.29, r:.060, kind:"rocha" },
        { type:"circle", x:.29, y:.23, r:.045, kind:"rocha" },
        { type:"circle", x:.82, y:.27, r:.060, kind:"rocha" },
        { type:"circle", x:.69, y:.40, r:.045, kind:"rocha" },

        { type:"circle", x:.18, y:.68, r:.055, kind:"rocha" },
        { type:"circle", x:.34, y:.77, r:.050, kind:"rocha" },
        { type:"circle", x:.67, y:.74, r:.060, kind:"rocha" },
        { type:"circle", x:.84, y:.64, r:.050, kind:"rocha" },

        { type:"circle", x:.50, y:.33, r:.040, kind:"rocha" }
    ],

    // ========================================================
    // FASE 7 - SANTUÁRIO DA LUA
    // ========================================================
    7: [
        { type:"circle", x:.15, y:.28, r:.045, kind:"pilar" },
        { type:"circle", x:.31, y:.23, r:.040, kind:"pilar" },
        { type:"circle", x:.84, y:.28, r:.045, kind:"pilar" },
        { type:"circle", x:.69, y:.39, r:.040, kind:"pilar" },

        { type:"circle", x:.18, y:.69, r:.042, kind:"pilar" },
        { type:"circle", x:.34, y:.77, r:.040, kind:"pilar" },
        { type:"circle", x:.67, y:.74, r:.042, kind:"pilar" },
        { type:"circle", x:.84, y:.64, r:.040, kind:"pilar" },

        { type:"rect", x:.42, y:.46, w:.16, h:.07, kind:"altar" }
    ],

    // ========================================================
    // FASE 8 - FORTALEZA ONI
    // ========================================================
    8: [
        { type:"rect", x:.06, y:.20, w:.12, h:.34, kind:"muralha" },
        { type:"rect", x:.82, y:.20, w:.12, h:.34, kind:"muralha" },

        { type:"rect", x:.16, y:.70, w:.22, h:.09, kind:"muralha" },
        { type:"rect", x:.62, y:.70, w:.22, h:.09, kind:"muralha" },

        { type:"rect", x:.28, y:.28, w:.10, h:.10, kind:"coluna" },
        { type:"rect", x:.62, y:.28, w:.10, h:.10, kind:"coluna" },

        { type:"rect", x:.43, y:.48, w:.14, h:.12, kind:"altar" }
    ]
};

function getStageObstacles() {

    const stage = Math.max(
        1,
        currentStage
    );

    const mode =
        ((stage - 1) % 8) + 1;

    const map =
        stageCollisionMaps[mode] || [];

    return map.map(o => {

        if (o.type === "circle") {

            return {
                type: "circle",

                x: W * o.x,
                y: H * o.y,

                r: Math.max(
                    10,
                    Math.min(W, H) * o.r
                ),

                kind: o.kind
            };
        }

        if (o.type === "rect") {

            return {
                type: "rect",

                x: W * o.x,
                y: H * o.y,

                w: W * o.w,
                h: H * o.h,

                kind: o.kind
            };
        }

        return null;

    }).filter(Boolean);
}


// ============================================================
// COLISÃO DO PLAYER COM O MAPA
// ============================================================

function circleHitsObstacle(
    x,
    y,
    radius,
    obstacle
) {

    const margin = 2;

    if (obstacle.type === "circle") {

        const dx =
            x - obstacle.x;

        const dy =
            y - obstacle.y;

        const distance =
            Math.hypot(dx, dy);

        return distance <
            radius +
            obstacle.r -
            margin;
    }

    if (obstacle.type === "rect") {

        const left =
            obstacle.x;

        const right =
            obstacle.x +
            obstacle.w;

        const top =
            obstacle.y;

        const bottom =
            obstacle.y +
            obstacle.h;

        const closestX =
            clamp(
                x,
                left,
                right
            );

        const closestY =
            clamp(
                y,
                top,
                bottom
            );

        const dx =
            x - closestX;

        const dy =
            y - closestY;

        return (
            dx * dx +
            dy * dy
        ) < Math.pow(
            radius,
            2
        );
    }

    return false;
}


// ============================================================
// RESOLVE COLISÃO
// ============================================================

function resolvePlayerScenarioCollision() {

    const obstacles =
        getStageObstacles();

    for (const obstacle of obstacles) {

        if (!circleHitsObstacle(
            player.x,
            player.y,
            player.r,
            obstacle
        )) {
            continue;
        }

        // ----------------------------------------------------
        // CÍRCULO
        // ----------------------------------------------------

        if (obstacle.type === "circle") {

            let dx =
                player.x -
                obstacle.x;

            let dy =
                player.y -
                obstacle.y;

            let distance =
                Math.hypot(dx, dy);

            if (distance < .001) {
                dx = 1;
                dy = 0;
                distance = 1;
            }

            const target =
                player.r +
                obstacle.r;

            const push =
                target -
                distance;

            if (push > 0) {

                player.x +=
                    dx / distance *
                    push;

                player.y +=
                    dy / distance *
                    push;
            }
        }

        // ----------------------------------------------------
        // RETÂNGULO
        // ----------------------------------------------------

        if (obstacle.type === "rect") {

            const left =
                obstacle.x;

            const right =
                obstacle.x +
                obstacle.w;

            const top =
                obstacle.y;

            const bottom =
                obstacle.y +
                obstacle.h;

            const insideX =
                player.x > left &&
                player.x < right;

            const insideY =
                player.y > top &&
                player.y < bottom;

            // Player entrou dentro do objeto.
            if (insideX && insideY) {

                const dl =
                    player.x - left;

                const dr =
                    right - player.x;

                const dt =
                    player.y - top;

                const db =
                    bottom - player.y;

                const smallest =
                    Math.min(
                        dl,
                        dr,
                        dt,
                        db
                    );

                if (smallest === dl) {

                    player.x =
                        left -
                        player.r;

                } else if (smallest === dr) {

                    player.x =
                        right +
                        player.r;

                } else if (smallest === dt) {

                    player.y =
                        top -
                        player.r;

                } else {

                    player.y =
                        bottom +
                        player.r;
                }

            } else {

                // Player está fora, mas encostando.
                const closestX =
                    clamp(
                        player.x,
                        left,
                        right
                    );

                const closestY =
                    clamp(
                        player.y,
                        top,
                        bottom
                    );

                const dx =
                    player.x -
                    closestX;

                const dy =
                    player.y -
                    closestY;

                const distance =
                    Math.hypot(dx, dy);

                if (
                    distance > 0 &&
                    distance < player.r
                ) {

                    const push =
                        player.r -
                        distance;

                    player.x +=
                        dx / distance *
                        push;

                    player.y +=
                        dy / distance *
                        push;
                }
            }
        }
    }

    player.x =
        clamp(
            player.x,
            28,
            W - 28
        );

    player.y =
        clamp(
            player.y,
            125,
            H - 28
        );
}





function drawStageObstacles() {

    const obstacles = getStageObstacles();

    for (const o of obstacles) {

        ctx.save();

        // =====================================================
        // CÍRCULOS
        // =====================================================

        if (o.type === "circle") {

            if (o.kind === "arvore") {

                // sombra
                ctx.globalAlpha = .30;
                ctx.fillStyle = "#020617";

                ctx.beginPath();
                ctx.ellipse(
                    o.x,
                    o.y + o.r * .75,
                    o.r * 1.25,
                    o.r * .35,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                // tronco
                ctx.globalAlpha = 1;
                ctx.fillStyle = "#422b1c";

                ctx.fillRect(
                    o.x - o.r * .22,
                    o.y - o.r * .15,
                    o.r * .44,
                    o.r * 1.05
                );

                // copa
                ctx.fillStyle = "#14532d";

                ctx.beginPath();
                ctx.arc(
                    o.x,
                    o.y - o.r * .35,
                    o.r,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.fillStyle = "#166534";

                ctx.beginPath();
                ctx.arc(
                    o.x - o.r * .30,
                    o.y - o.r * .55,
                    o.r * .58,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.beginPath();
                ctx.arc(
                    o.x + o.r * .30,
                    o.y - o.r * .50,
                    o.r * .55,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

            } else if (o.kind === "neve") {

                ctx.globalAlpha = .30;
                ctx.fillStyle = "#64748b";

                ctx.beginPath();
                ctx.ellipse(
                    o.x,
                    o.y + o.r * .55,
                    o.r * 1.2,
                    o.r * .45,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.globalAlpha = 1;
                ctx.fillStyle = "#e2e8f0";

                ctx.beginPath();
                ctx.arc(
                    o.x,
                    o.y,
                    o.r,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.fillStyle = "#ffffff";

                ctx.beginPath();
                ctx.arc(
                    o.x - o.r * .25,
                    o.y - o.r * .30,
                    o.r * .55,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.strokeStyle = "#bfdbfe";
                ctx.lineWidth = 2;
                ctx.stroke();

            } else if (o.kind === "pilar") {

                ctx.globalAlpha = .30;
                ctx.fillStyle = "#020617";

                ctx.beginPath();
                ctx.ellipse(
                    o.x,
                    o.y + o.r,
                    o.r * 1.2,
                    o.r * .30,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.globalAlpha = 1;
                ctx.fillStyle = "#64748b";

                ctx.fillRect(
                    o.x - o.r * .55,
                    o.y - o.r,
                    o.r * 1.1,
                    o.r * 2
                );

                ctx.fillStyle = "#94a3b8";

                ctx.fillRect(
                    o.x - o.r * .70,
                    o.y - o.r,
                    o.r * 1.4,
                    o.r * .25
                );

                ctx.fillRect(
                    o.x - o.r * .70,
                    o.y + o.r * .75,
                    o.r * 1.4,
                    o.r * .25
                );

                ctx.strokeStyle = "#cbd5e1";
                ctx.lineWidth = 2;

                ctx.strokeRect(
                    o.x - o.r * .55,
                    o.y - o.r,
                    o.r * 1.1,
                    o.r * 2
                );

            } else {

                // pedra / rocha
                ctx.globalAlpha = .35;
                ctx.fillStyle = "#020617";

                ctx.beginPath();
                ctx.ellipse(
                    o.x,
                    o.y + o.r * .60,
                    o.r * 1.15,
                    o.r * .40,
                    0,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.globalAlpha = 1;
                ctx.fillStyle =
                    o.kind === "rocha"
                        ? "#292524"
                        : "#475569";

                ctx.beginPath();
                ctx.arc(
                    o.x,
                    o.y,
                    o.r,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.fillStyle =
                    o.kind === "rocha"
                        ? "#44403c"
                        : "#64748b";

                ctx.beginPath();
                ctx.arc(
                    o.x - o.r * .25,
                    o.y - o.r * .30,
                    o.r * .48,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.strokeStyle = "rgba(255,255,255,.12)";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }


        // =====================================================
        // RETÂNGULOS
        // =====================================================

        if (o.type === "rect") {

            // sombra
            ctx.globalAlpha = .30;
            ctx.fillStyle = "#020617";

            ctx.fillRect(
                o.x + 5,
                o.y + 6,
                o.w,
                o.h
            );

            ctx.globalAlpha = 1;

            if (o.kind === "casa") {

                ctx.fillStyle = "#3f2f24";
                ctx.fillRect(
                    o.x,
                    o.y,
                    o.w,
                    o.h
                );

                // telhado
                ctx.fillStyle = "#211712";

                ctx.beginPath();
                ctx.moveTo(
                    o.x - 5,
                    o.y
                );
                ctx.lineTo(
                    o.x + o.w / 2,
                    o.y - 18
                );
                ctx.lineTo(
                    o.x + o.w + 5,
                    o.y
                );
                ctx.closePath();
                ctx.fill();

                // janela
                ctx.fillStyle = "#f59e0b";

                ctx.fillRect(
                    o.x + o.w * .25,
                    o.y + o.h * .28,
                    o.w * .18,
                    o.h * .25
                );

            } else if (o.kind === "barril") {

                ctx.fillStyle = "#78350f";

                ctx.fillRect(
                    o.x,
                    o.y,
                    o.w,
                    o.h
                );

                ctx.strokeStyle = "#d97706";
                ctx.lineWidth = 3;

                ctx.strokeRect(
                    o.x + 2,
                    o.y + 2,
                    o.w - 4,
                    o.h - 4
                );

            } else if (o.kind === "coluna") {

                ctx.fillStyle = "#4c1d2b";

                ctx.fillRect(
                    o.x,
                    o.y,
                    o.w,
                    o.h
                );

                ctx.fillStyle = "#7f1d1d";

                ctx.fillRect(
                    o.x - 5,
                    o.y,
                    o.w + 10,
                    10
                );

                ctx.fillRect(
                    o.x - 5,
                    o.y + o.h - 10,
                    o.w + 10,
                    10
                );

            } else if (o.kind === "altar") {

                ctx.fillStyle = "#713f12";

                ctx.fillRect(
                    o.x,
                    o.y,
                    o.w,
                    o.h
                );

                ctx.fillStyle = "#facc15";

                ctx.fillRect(
                    o.x + o.w * .35,
                    o.y - 5,
                    o.w * .30,
                    5
                );

            } else if (o.kind === "muralha") {

                ctx.fillStyle = "#292524";

                ctx.fillRect(
                    o.x,
                    o.y,
                    o.w,
                    o.h
                );

                ctx.fillStyle = "#44403c";

                for (
                    let y = o.y + 8;
                    y < o.y + o.h;
                    y += 18
                ) {
                    ctx.fillRect(
                        o.x,
                        y,
                        o.w,
                        4
                    );
                }
            }

            ctx.strokeStyle = "rgba(255,255,255,.15)";
            ctx.lineWidth = 2;

            ctx.strokeRect(
                o.x,
                o.y,
                o.w,
                o.h
            );
        }

        ctx.restore();
    }
}





function drawBackground() {

    const stage = Math.max(1, currentStage);
    const mode = ((stage - 1) % 8) + 1;

    // =========================================================
    // PALETA DE CADA FASE
    // =========================================================

    const themes = {

        1: {
            top: "#071f22",
            middle: "#0b4037",
            bottom: "#061f1c",
            ground: "#0b493b",
            accent: "#38bdf8"
        },

        2: {
            top: "#080b18",
            middle: "#151b32",
            bottom: "#080d18",
            ground: "#101827",
            accent: "#818cf8"
        },

        3: {
            top: "#241914",
            middle: "#493026",
            bottom: "#211510",
            ground: "#50372b",
            accent: "#f59e0b"
        },

        4: {
            top: "#160b18",
            middle: "#351323",
            bottom: "#100711",
            ground: "#32121f",
            accent: "#ef4444"
        },

        5: {
            top: "#dbeafe",
            middle: "#bfdbfe",
            bottom: "#93c5fd",
            ground: "#dbeafe",
            accent: "#ffffff"
        },

        6: {
            top: "#090b12",
            middle: "#171725",
            bottom: "#05060a",
            ground: "#151525",
            accent: "#a855f7"
        },

        7: {
            top: "#11142b",
            middle: "#25245a",
            bottom: "#090b1d",
            ground: "#202052",
            accent: "#c4b5fd"
        },

        8: {
            top: "#180708",
            middle: "#421316",
            bottom: "#100405",
            ground: "#351012",
            accent: "#f87171"
        }

    };

    const theme = themes[mode] || themes[1];

    // =========================================================
    // FUNDO PRINCIPAL
    // =========================================================

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    gradient.addColorStop(
        0,
        theme.top
    );

    gradient.addColorStop(
        .5,
        theme.middle
    );

    gradient.addColorStop(
        1,
        theme.bottom
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    // =========================================================
    // ÁREA DO CHÃO
    // =========================================================

    ctx.fillStyle = theme.ground;

    ctx.fillRect(
        0,
        76,
        W,
        H - 76
    );

    // =========================================================
    // SPRITE DO CHÃO
    // =========================================================

    if (
        chaoSprite.complete &&
        chaoSprite.naturalWidth
    ) {

        ctx.save();

        const chaoY = 76;
        const chaoH = H - chaoY;

        // Menos dominante para permitir que cada fase
        // tenha sua própria identidade visual.
        ctx.globalAlpha =
            mode === 5 ? 0.55 : 0.35;

        const escala =
            Math.max(
                W / chaoSprite.naturalWidth,
                chaoH / chaoSprite.naturalHeight
            );

        const chaoW =
            chaoSprite.naturalWidth *
            escala;

        const chaoDrawH =
            chaoSprite.naturalHeight *
            escala;

        ctx.drawImage(
            chaoSprite,
            (W - chaoW) / 2,
            chaoY +
                (chaoH - chaoDrawH) / 2,
            chaoW,
            chaoDrawH
        );

        ctx.restore();
    }

    // =========================================================
    // DETALHES ESPECÍFICOS DA FASE
    // =========================================================

    ctx.save();

    // ---------------------------------------------------------
    // FASE 1 - FLORESTA DA ÁGUA
    // ---------------------------------------------------------

    if (mode === 1) {

        ctx.globalAlpha = .22;
        ctx.fillStyle = "#22c55e";

        for (let x = 20; x < W; x += 65) {

            const h =
                25 +
                Math.sin(x * .08) * 15;

            ctx.fillRect(
                x,
                H - 55 - h,
                10,
                h
            );
        }

        ctx.globalAlpha = .18;
        ctx.strokeStyle = "#38bdf8";

        for (let y = 100; y < H; y += 70) {

            ctx.beginPath();

            for (let x = 0; x <= W; x += 20) {

                const wave =
                    Math.sin(
                        x * .04 +
                        worldTime * .03 +
                        y
                    ) * 3;

                if (x === 0)
                    ctx.moveTo(x, y + wave);
                else
                    ctx.lineTo(x, y + wave);
            }

            ctx.stroke();
        }
    }

    // ---------------------------------------------------------
    // FASE 2 - FLORESTA NOTURNA
    // ---------------------------------------------------------

    if (mode === 2) {

        ctx.globalAlpha = .30;
        ctx.fillStyle = "#020617";

        for (let x = 15; x < W; x += 70) {

            ctx.beginPath();
            ctx.arc(
                x,
                110,
                35,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.globalAlpha = .55;
        ctx.fillStyle = "#e0e7ff";

        for (let i = 0; i < 30; i++) {

            const x =
                (i * 97) % W;

            const y =
                90 +
                ((i * 53) % Math.max(1, H - 100));

            ctx.fillRect(
                x,
                y,
                2,
                2
            );
        }
    }

    // ---------------------------------------------------------
    // FASE 3 - VILA ABANDONADA
    // ---------------------------------------------------------

    if (mode === 3) {

        ctx.globalAlpha = .35;

        for (let x = 0; x < W; x += 100) {

            ctx.fillStyle = "#291b15";

            ctx.fillRect(
                x,
                90,
                55,
                35
            );

            ctx.fillStyle = "#17100d";

            ctx.fillRect(
                x + 8,
                98,
                12,
                15
            );

            ctx.fillRect(
                x + 32,
                98,
                12,
                15
            );
        }
    }

    // ---------------------------------------------------------
    // FASE 4 - TEMPLO DEMONÍACO
    // ---------------------------------------------------------

    if (mode === 4) {

        ctx.globalAlpha = .22;

        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;

        for (let y = 120; y < H; y += 70) {

            ctx.beginPath();

            ctx.moveTo(
                W * .25,
                y
            );

            ctx.lineTo(
                W * .75,
                y
            );

            ctx.stroke();
        }

        ctx.globalAlpha = .18;
        ctx.fillStyle = "#991b1b";

        ctx.fillRect(
            W * .44,
            90,
            W * .12,
            H - 90
        );
    }

    // ---------------------------------------------------------
    // FASE 5 - MONTANHA NEVADA
    // ---------------------------------------------------------

    if (mode === 5) {

        ctx.globalAlpha = .75;
        ctx.fillStyle = "#ffffff";

        for (let i = 0; i < 45; i++) {

            const x =
                (i * 83) % W;

            const y =
                90 +
                ((i * 47 +
                    worldTime * .4) %
                    Math.max(1, H - 90));

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                2 + (i % 3),
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }

    // ---------------------------------------------------------
    // FASE 6 - VALE SOMBRIO
    // ---------------------------------------------------------

    if (mode === 6) {

        ctx.globalAlpha = .25;
        ctx.fillStyle = "#000000";

        for (let x = 0; x < W; x += 80) {

            ctx.beginPath();

            ctx.arc(
                x,
                H * .55,
                60,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.globalAlpha = .18;
        ctx.strokeStyle = "#a855f7";

        for (let y = 130; y < H; y += 100) {

            ctx.beginPath();

            ctx.moveTo(
                0,
                y
            );

            ctx.lineTo(
                W,
                y
            );

            ctx.stroke();
        }
    }

    // ---------------------------------------------------------
    // FASE 7 - SANTUÁRIO DA LUA
    // ---------------------------------------------------------

    if (mode === 7) {

        ctx.globalAlpha = .75;
        ctx.fillStyle = "#f8fafc";

        ctx.beginPath();

        ctx.arc(
            W * .82,
            125,
            32,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = .20;
        ctx.strokeStyle = "#c4b5fd";
        ctx.lineWidth = 3;

        for (let r = 55; r < 140; r += 28) {

            ctx.beginPath();

            ctx.arc(
                W * .82,
                125,
                r,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
    }

    // ---------------------------------------------------------
    // FASE 8 - FORTALEZA ONI
    // ---------------------------------------------------------

    if (mode === 8) {

        ctx.globalAlpha = .35;
        ctx.fillStyle = "#050505";

        for (let x = 0; x < W; x += 75) {

            ctx.fillRect(
                x,
                82,
                45,
                45
            );
        }

        ctx.globalAlpha = .20;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;

        ctx.strokeRect(
            8,
            84,
            W - 16,
            H - 92
        );
    }

    ctx.restore();

    // =========================================================
    // OBJETOS FÍSICOS DO MAPA
    // =========================================================

    drawStageObstacles();

    // =========================================================
    // GRADE SUTIL DO TERRENO
    // =========================================================

    ctx.save();

    ctx.globalAlpha = .08;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1;

    for (
        let y = 120;
        y < H;
        y += 150
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            W,
            y
        );

        ctx.stroke();
    }

    
    // =========================================================
    // DEBUG DA COLISÃO
    // =========================================================
    if (DEBUG_COLLISION_MAP) {

        const debugObstacles = getStageObstacles();

        ctx.save();

        for (const o of debugObstacles) {

            ctx.globalAlpha = 0.30;
            ctx.fillStyle = "#ff0000";
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 2;

            if (o.type === "circle") {

                ctx.beginPath();

                ctx.arc(
                    o.x,
                    o.y,
                    o.r,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
                ctx.stroke();

            } else if (o.type === "rect") {

                ctx.fillRect(
                    o.x,
                    o.y,
                    o.w,
                    o.h
                );

                ctx.strokeRect(
                    o.x,
                    o.y,
                    o.w,
                    o.h
                );
            }
        }

        // Hitbox do Tomioka
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.r,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
}



// ============================================================
// SPRITE REAL DO TOMIOKA
// ============================================================

function drawPlayerSprite() {
    if (!tomiokaSprite.complete || !tomiokaSprite.naturalWidth) {
        return false;
    }

    const bob = Math.sin(worldTime * .12) * 2;

    // Área real do personagem dentro da imagem original.
    const sx = 312;
    const sy = 88;
    const sw = 502;
    const sh = 974;

    // Tamanho visual dentro do jogo.
    const dw = 58;
    const dh = 112;

    ctx.save();

    ctx.globalAlpha = 1;

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.beginPath();
    ctx.ellipse(
        player.x,
        player.y + 25,
        24,
        8,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Aura de água
    const aura = ctx.createRadialGradient(
        player.x,
        player.y,
        2,
        player.x,
        player.y,
        48
    );

    aura.addColorStop(0, "rgba(56,189,248,.22)");
    aura.addColorStop(1, "rgba(56,189,248,0)");

    ctx.fillStyle = aura;

    ctx.beginPath();
    ctx.arc(
        player.x,
        player.y,
        48,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Sprite
    ctx.imageSmoothingEnabled = true;

    ctx.drawImage(
        tomiokaSprite,
        sx,
        sy,
        sw,
        sh,
        player.x - dw / 2,
        player.y - dh + bob,
        dw,
        dh
    );

    ctx.restore();

    // Nome
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "Tomioka",
        player.x,
        player.y - 70 + bob
    );

    ctx.textAlign = "left";

    return true;
}


// ============================================================
// ESPADA REAL DO TOMIOKA
// ============================================================

function drawSwordSprite() {
    if (
        !espadaSprite.complete ||
        !espadaSprite.naturalWidth
    ) {
        return;
    }

    const sx = 86;
    const sy = 102;
    const sw = 934;
    const sh = 892;

    const dw = 72;
    const dh = 69;

    const ataque =
        typeof player.attacking !== "undefined"
            ? player.attacking
            : false;

    const movimento =
        Math.sin(worldTime * .12) * .04;

    let angulo = movimento;

    if (ataque) {
        angulo = -0.9;
    }

    ctx.save();

    ctx.translate(
        player.x + 20,
        player.y - 50
    );

    ctx.rotate(angulo);

    ctx.globalAlpha = .96;

    ctx.drawImage(
        espadaSprite,
        sx,
        sy,
        sw,
        sh,
        -dw / 2,
        -dh / 2,
        dw,
        dh
    );

    ctx.restore();
}

function drawPlayer() {
    if (
        player.invincible > 0 &&
        Math.floor(player.invincible / 4) % 2 === 0
    ) {
        return;
    }

    if (drawPlayerSprite()) {
        drawSwordSprite();
        return;
    }

    // Fallback: mantém o desenho antigo caso a imagem ainda não tenha carregado.
    const bob = Math.sin(worldTime * .12) * 2;

    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.beginPath();
    ctx.ellipse(
        player.x,
        player.y + 24,
        24,
        8,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#164e63";
    ctx.beginPath();
    ctx.arc(
        player.x,
        player.y - 5 + bob,
        22,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#f2c6a0";
    ctx.beginPath();
    ctx.arc(
        player.x,
        player.y - 18 + bob,
        15,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(
        player.x,
        player.y - 25 + bob,
        16,
        Math.PI,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#e0f2fe";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        "Tomioka",
        player.x,
        player.y - 43 + bob
    );
    ctx.textAlign = "left";
}


function drawEnemy(enemy) {

    const bob =
        Math.sin(enemy.wobble) * 2;

    // ========================================================
    // SPRITES DOS INIMIGOS
    // Cada inimigo usa uma região diferente do spritesheet.
    // ========================================================

    if (
        inimigosSprite.complete &&
        inimigosSprite.naturalWidth
    ) {

        /*
         * O spritesheet possui vários personagens.
         *
         * Os recortes abaixo são definidos em coordenadas
         * relativas ao arquivo original 2048x1846.
         *
         * O sistema escolhe automaticamente pelo nome.
         */

        const sprites = {

            "Slime": {
                sx: 188,
                sy: 91,
                sw: 638,
                sh: 810
            },

            "Demônio": {
                sx: 826,
                sy: 91,
                sw: 600,
                sh: 810
            },

            "Espírito": {
                sx: 390,
                sy: 901,
                sw: 680,
                sh: 615
            },

            "Oni": {
                sx: 1070,
                sy: 901,
                sw: 680,
                sh: 615
            },

            "Caçador": {
                sx: 390,
                sy: 0,
                sw: 682,
                sh: 615
            },

            "Lua": {
                sx: 1070,
                sy: 0,
                sw: 680,
                sh: 615
            }
        };

        /*
         * Se o inimigo não tiver sprite específico,
         * usa o primeiro sprite como fallback.
         */
        const sprite =
            sprites[enemy.name] ||
            sprites["Slime"];

        const tamanho =
            Math.max(
                58,
                enemy.r * 2.35
            );

        const proporcao =
            sprite.sh / sprite.sw;

        const dw = tamanho;
        const dh = tamanho * proporcao;

        ctx.save();

        // ----------------------------------------------------
        // SOMBRA
        // ----------------------------------------------------

        ctx.fillStyle =
            "rgba(0,0,0,.45)";

        ctx.beginPath();

        ctx.ellipse(
            enemy.x,
            enemy.y + enemy.r + 5,
            enemy.r * 1.05,
            enemy.r * .34,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // ----------------------------------------------------
        // FLASH DE DANO
        // ----------------------------------------------------

        if (enemy.hitFlash > 0) {
            ctx.globalAlpha = .82;
        }

        ctx.imageSmoothingEnabled = true;

        // ----------------------------------------------------
        // SPRITE
        // ----------------------------------------------------

        ctx.drawImage(
            inimigosSprite,

            sprite.sx,
            sprite.sy,
            sprite.sw,
            sprite.sh,

            enemy.x - dw / 2,
            enemy.y - dh + bob,

            dw,
            dh
        );

        ctx.restore();

        // ----------------------------------------------------
        // BARRA DE VIDA
        // ----------------------------------------------------

        const width =
            enemy.r * 2.6;

        ctx.fillStyle =
            "#111827";

        ctx.fillRect(
            enemy.x - width / 2,
            enemy.y - enemy.r - 18,
            width,
            6
        );

        ctx.fillStyle =
            enemy.name === "Oni"
                ? "#dc2626"
                : "#ef4444";

        ctx.fillRect(
            enemy.x - width / 2,
            enemy.y - enemy.r - 18,
            width *
                Math.max(
                    0,
                    enemy.hp / enemy.maxHp
                ),
            6
        );

        // ----------------------------------------------------
        // NOME DOS INIMIGOS ESPECIAIS
        // ----------------------------------------------------

        if (
            enemy.name === "Oni" ||
            enemy.name === "Caçador" ||
            enemy.name === "Lua"
        ) {

            ctx.fillStyle =
                enemy.name === "Oni"
                    ? "#fecaca"
                    : "#ddd6fe";

            ctx.font =
                "bold 10px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                enemy.name.toUpperCase(),
                enemy.x,
                enemy.y + enemy.r + 17
            );

            ctx.textAlign =
                "left";
        }

        return;
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    const bobFallback =
        Math.sin(enemy.wobble) * 2;

    ctx.fillStyle =
        "rgba(0,0,0,.48)";

    ctx.beginPath();

    ctx.ellipse(
        enemy.x,
        enemy.y + enemy.r + 5,
        enemy.r * 1.05,
        enemy.r * .34,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        enemy.hitFlash > 0
            ? "#ffffff"
            : enemy.color;

    ctx.beginPath();

    if (enemy.name === "Oni") {

        ctx.ellipse(
            enemy.x,
            enemy.y + bobFallback,
            enemy.r * .82,
            enemy.r * 1.15,
            0,
            0,
            Math.PI * 2
        );

    } else if (
        enemy.name === "Demônio"
    ) {

        ctx.roundRect(
            enemy.x - enemy.r,
            enemy.y - enemy.r,
            enemy.r * 2,
            enemy.r * 2.1,
            9
        );

    } else {

        ctx.arc(
            enemy.x,
            enemy.y + bobFallback,
            enemy.r,
            0,
            Math.PI * 2
        );
    }

    ctx.fill();

    const width =
        enemy.r * 2.6;

    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        enemy.x - width / 2,
        enemy.y - enemy.r - 18,
        width,
        6
    );

    ctx.fillStyle =
        "#ef4444";

    ctx.fillRect(
        enemy.x - width / 2,
        enemy.y - enemy.r - 18,
        width *
            Math.max(
                0,
                enemy.hp / enemy.maxHp
            ),
        6
    );
}


function drawProjectiles() {
    for (const p of projectiles) {
        const g = ctx.createRadialGradient(
            p.x,
            p.y,
            1,
            p.x,
            p.y,
            18
        );

        g.addColorStop(0, "#ffffff");
        g.addColorStop(.25, p.color || "#bae6fd");
        g.addColorStop(1, "#0369a1");

        ctx.fillStyle = g;

        ctx.beginPath();
        ctx.arc(
            p.x,
            p.y,
            p.r,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // rastro de água
        ctx.strokeStyle = p.color || "#38bdf8";
        ctx.globalAlpha = .55;
        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.moveTo(
            p.x - p.vx * 1.3,
            p.y - p.vy * 1.3
        );

        ctx.quadraticCurveTo(
            p.x - p.vy,
            p.y + p.vx,
            p.x,
            p.y
        );

        ctx.stroke();

        ctx.globalAlpha = 1;
    }
}

function drawSlashEffects() {
    for (const slash of slashEffects) {
        const progress =
            1 - slash.life / slash.maxLife;

        ctx.save();

        ctx.translate(
            slash.x,
            slash.y
        );

        ctx.rotate(slash.angle);

        ctx.globalAlpha =
            Math.max(0, 1 - progress);

        const radius =
            28 + progress * (28 + slash.technique * 6);

        // arco principal
        ctx.strokeStyle =
            slash.color || "#38bdf8";

        ctx.lineWidth =
            5 + slash.technique * .5;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            radius,
            -.85,
            .85
        );

        ctx.stroke();

        // segunda onda
        ctx.globalAlpha *= .55;

        ctx.strokeStyle = "#e0f2fe";
        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            radius + 8,
            -.72,
            .72
        );

        ctx.stroke();

        // gotículas
        for (let i = 0; i < 5; i++) {
            const a =
                -.75 +
                i * .38;

            const px =
                Math.cos(a) *
                radius;

            const py =
                Math.sin(a) *
                radius;

            ctx.fillStyle =
                slash.color || "#38bdf8";

            ctx.beginPath();

            ctx.arc(
                px,
                py,
                2 + slash.technique * .3,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.restore();
    }

    ctx.globalAlpha = 1;
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha =
            Math.max(0, p.life / p.maxLife);

        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

function drawTexts() {
    ctx.textAlign = "center";

    for (const t of floatingTexts) {
        ctx.globalAlpha =
            Math.min(1, t.life / 20);

        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size}px Arial`;

        ctx.fillText(
            t.value,
            t.x,
            t.y
        );
    }

    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
}

function drawStageHUD() {

    if (!started)
        return;

    ctx.save();

    ctx.textAlign = "center";

    // Fase
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "bold 16px Arial";

    ctx.fillText(
        "🌊 FASE " + currentStage,
        W / 2,
        32
    );

    // Progresso
    const progress =
        clamp(
            stageKills / stageTarget,
            0,
            1
        );

    const barW =
        Math.min(280, W * .42);

    const barH = 9;

    const barX =
        W / 2 - barW / 2;

    const barY = 42;

    ctx.fillStyle =
        "rgba(15,23,42,.8)";

    ctx.fillRect(
        barX,
        barY,
        barW,
        barH
    );

    ctx.fillStyle =
        "#38bdf8";

    ctx.fillRect(
        barX,
        barY,
        barW * progress,
        barH
    );

    ctx.strokeStyle =
        "rgba(186,230,253,.7)";

    ctx.strokeRect(
        barX,
        barY,
        barW,
        barH
    );

    ctx.fillStyle =
        "#bae6fd";

    ctx.font =
        "11px Arial";

    ctx.fillText(
        stageKills +
        " / " +
        stageTarget,
        W / 2,
        64
    );

    ctx.restore();
}

function drawHUD() {
    const hudHeight = 80;

    ctx.fillStyle = "rgba(2,6,23,.94)";
    ctx.fillRect(
        0,
        0,
        W,
        hudHeight
    );

    ctx.strokeStyle =
        "rgba(56,189,248,.35)";

    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, hudHeight);
    ctx.lineTo(W, hudHeight);
    ctx.stroke();

    // nível
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "bold 16px Arial";

    ctx.fillText(
        "🌊 LV " + player.level,
        12,
        24
    );

    // moedas
    ctx.fillStyle = "#facc15";

    ctx.fillText(
        "💰 " + player.coins,
        12,
        50
    );

    const barW =
        Math.min(
            205,
            Math.max(120, W * .34)
        );

    // HP
    ctx.fillStyle = "#172033";

    ctx.beginPath();
    ctx.roundRect(
        98,
        12,
        barW,
        18,
        7
    );
    ctx.fill();

    ctx.fillStyle = "#22c55e";

    ctx.beginPath();
    ctx.roundRect(
        98,
        12,
        barW *
            Math.max(
                0,
                player.hp / player.maxHp
            ),
        18,
        7
    );
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        `${player.hp}/${player.maxHp}`,
        98 + barW / 2,
        25
    );

    // XP
    ctx.fillStyle = "#172033";

    ctx.beginPath();
    ctx.roundRect(
        98,
        36,
        barW,
        7,
        3
    );
    ctx.fill();

    ctx.fillStyle = "#a855f7";

    ctx.beginPath();
    ctx.roundRect(
        98,
        36,
        barW *
            (player.xp / player.xpNext),
        7,
        3
    );
    ctx.fill();

    // maestria
    const next =
        waterTechniques[player.technique + 1];

    ctx.fillStyle = "#0e7490";

    ctx.beginPath();
    ctx.roundRect(
        98,
        51,
        barW,
        7,
        3
    );
    ctx.fill();

    let masteryProgress = 1;

    if (next) {
        const currentReq =
            waterTechniques[player.technique].required;

        masteryProgress =
            (player.mastery - currentReq) /
            (next.required - currentReq);
    }

    ctx.fillStyle = "#22d3ee";

    ctx.beginPath();
    ctx.roundRect(
        98,
        51,
        barW *
            clamp(masteryProgress, 0, 1),
        7,
        3
    );
    ctx.fill();

    ctx.textAlign = "left";

    // técnica
    ctx.fillStyle = "#bae6fd";
    ctx.font = "bold 10px Arial";

    ctx.fillText(
        "🌊 " +
        waterTechniques[player.technique].name,
        98,
        72
    );

    // contador de inimigos
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Arial";

    ctx.fillText(
        "👹 " + enemies.length,
        W - 60,
        25
    );

    ctx.fillStyle =
        musicEnabled
            ? "#7dd3fc"
            : "#64748b";

    ctx.font = "19px Arial";

    ctx.fillText(
        musicEnabled ? "♫" : "🔇",
        W - 30,
        52
    );
}

function drawJoystick() {
    const baseX = 82;
    const baseY = H - 100;

    ctx.globalAlpha = .72;

    ctx.fillStyle = "rgba(255,255,255,.10)";
    ctx.beginPath();
    ctx.arc(baseX, baseY, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(125,211,252,.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const knobX = baseX + joystick.dx * 47;
    const knobY = baseY + joystick.dy * 47;

    const g = ctx.createRadialGradient(
        knobX - 8,
        knobY - 8,
        2,
        knobX,
        knobY,
        32
    );

    g.addColorStop(0, "#bae6fd");
    g.addColorStop(1, "#2563eb");

    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.arc(knobX, knobY, 29, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
}

function getTechniqueButtons() {
    const buttons = [];

    const size =
        Math.max(
            42,
            Math.min(54, H * .10)
        );

    const gap = 8;

    const cols = 2;

    const totalW =
        size * cols + gap;

    const startX =
        W - totalW - 18;

    const rows = 4;

    const totalH =
        size * rows +
        gap * (rows - 1);

    const startY =
        Math.max(
            145,
            Math.min(
                H - totalH - 125,
                H / 2 - totalH / 2
            )
        );

    for (
        let i = 0;
        i < waterTechniques.length;
        i++
    ) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        buttons.push({
            index: i,
            x: startX + col * (size + gap),
            y: startY + row * (size + gap),
            w: size,
            h: size
        });
    }

    return buttons;
}

function selectTechniqueAt(x, y) {

    for (const b of getTechniqueButtons()) {

        if (
            x >= b.x &&
            x <= b.x + b.w &&
            y >= b.y &&
            y <= b.y + b.h
        ) {

            const tech =
                waterTechniques[b.index];

            if (
                player.mastery <
                tech.required
            ) {

                text(
                    player.x,
                    player.y - 85,
                    "🔒 Requer " +
                    tech.required +
                    " MESTRIA",
                    "#f87171",
                    12
                );

                playTone(
                    120,
                    .06,
                    "square",
                    .025
                );

                return true;
            }

            selectedTechnique =
                b.index;

            text(
                player.x,
                player.y - 85,
                "🌊 " + tech.name,
                tech.color,
                13
            );

            playTone(
                520 + b.index * 55,
                .05,
                "sine",
                .035
            );

            return true;
        }
    }

    return false;
}

function drawTechniqueButtons() {

    if (!started || gameOver)
        return;

    for (
        const b of getTechniqueButtons()
    ) {

        const tech =
            waterTechniques[b.index];

        const unlocked =
            player.mastery >=
            tech.required;

        const selected =
            selectedTechnique ===
            b.index;

        ctx.save();

        ctx.globalAlpha =
            unlocked ? .94 : .48;

        ctx.fillStyle =
            selected
            ? tech.color
            : "rgba(8,15,30,.82)";

        ctx.strokeStyle =
            tech.color;

        ctx.lineWidth =
            selected ? 3 : 1.5;

        ctx.beginPath();

        ctx.roundRect(
            b.x,
            b.y,
            b.w,
            b.h,
            10
        );

        ctx.fill();
        ctx.stroke();

        ctx.fillStyle =
            selected
            ? "#07111f"
            : "#e0f2fe";

        ctx.font =
            "bold 17px Arial";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            String(b.index + 1),
            b.x + b.w / 2,
            b.y + b.h / 2 - 6
        );

        ctx.font =
            "bold 8px Arial";

        ctx.fillText(
            tech.short,
            b.x + b.w / 2,
            b.y + b.h - 9
        );

        if (!unlocked) {

            ctx.font =
                "13px Arial";

            ctx.fillText(
                "🔒",
                b.x + b.w - 10,
                b.y + 12
            );
        }

        ctx.restore();
    }
}



function drawFullscreenButton() {
    const x = W - 38;
    const y = 32;

    ctx.save();

    ctx.fillStyle = "rgba(15,23,42,.82)";
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(
        x - 25,
        y - 22,
        50,
        44,
        12
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 19px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        document.fullscreenElement ? "⛶" : "⛶",
        x,
        y
    );

    ctx.restore();
}

function toggleFullscreen() {
    try {
        if (!document.fullscreenElement) {
            const request =
                document.documentElement.requestFullscreen ||
                document.documentElement.webkitRequestFullscreen;

            if (request)
                request.call(document.documentElement);
        } else {
            const exit =
                document.exitFullscreen ||
                document.webkitExitFullscreen;

            if (exit)
                exit.call(document);
        }
    } catch (err) {
        console.log("Fullscreen:", err);
    }
}

function drawAttackButton() {
    const x = W - 82;
    const y = H - 72;

    const g = ctx.createRadialGradient(
        x - 10,
        y - 10,
        3,
        x,
        y,
        58
    );

    g.addColorStop(
        0,
        attackPressed ? "#bae6fd" : "#60a5fa"
    );

    g.addColorStop(
        1,
        attackPressed ? "#0284c7" : "#1d4ed8"
    );

    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.arc(x, y, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "⚔",
        x,
        y + 4
    );

    ctx.font = "bold 10px Arial";

    ctx.fillText(
        "ATACAR",
        x,
        y + 23
    );

    ctx.textAlign = "left";
}


function drawSpecialButton() {
    if (!started || gameOver)
        return;

    const tech =
        waterTechniques[player.technique];

    if (!tech)
        return;

    const x = W - 82;
    const y = H - 180;

    const ready =
        player.specialCooldown <= 0;

    ctx.save();

    const g =
        ctx.createRadialGradient(
            x - 8,
            y - 8,
            3,
            x,
            y,
            52
        );

    g.addColorStop(
        0,
        ready
            ? tech.color
            : "#334155"
    );

    g.addColorStop(
        1,
        ready
            ? "#0369a1"
            : "#1e293b"
    );

    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.arc(
        x,
        y,
        47,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle =
        ready
            ? "rgba(255,255,255,.85)"
            : "rgba(255,255,255,.25)";

    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle =
        ready
            ? "#fff"
            : "#94a3b8";

    ctx.font = "bold 21px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "🌊",
        x,
        y - 7
    );

    ctx.font = "bold 9px Arial";

    ctx.fillText(
        ready
            ? "TÉCNICA"
            : Math.ceil(
                player.specialCooldown / 10
            ),
        x,
        y + 17
    );

    ctx.font = "bold 8px Arial";

    ctx.fillText(
        tech.short.toUpperCase(),
        x,
        y + 29
    );

    ctx.restore();
}

function drawDashButton() {
    const x = W - 165;
    const y = H - 72;

    ctx.fillStyle =
        player.dashCooldown <= 0
            ? "rgba(30,64,175,.85)"
            : "rgba(30,41,59,.7)";

    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        player.dashCooldown <= 0 ? "DASH" : Math.ceil(player.dashCooldown / 10),
        x,
        y + 4
    );

    ctx.textAlign = "left";
}

function drawPauseButton() {
    ctx.fillStyle = "rgba(15,23,42,.75)";
    roundRect(W - 62, 86, 45, 35, 10);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        paused ? "▶" : "Ⅱ",
        W - 39,
        110
    );

    ctx.textAlign = "left";
}

function drawGameOver() {
    if (!gameOver) return;

    ctx.fillStyle = "rgba(0,0,0,.76)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";

    ctx.fillStyle = "#fff";
    ctx.font = "bold clamp(28px, 8vw, 42px) Arial";

    ctx.fillText(
        "💀 VOCÊ MORREU",
        W / 2,
        H / 2 - 60
    );

    ctx.font = "18px Arial";

    ctx.fillText(
        `Nível ${player.level}  •  💰 ${player.coins}`,
        W / 2,
        H / 2 - 18
    );

    ctx.fillStyle = "#7dd3fc";
    ctx.font = "bold 17px Arial";

    ctx.fillText(
        "TOQUE PARA JOGAR NOVAMENTE",
        W / 2,
        H / 2 + 38
    );

    ctx.textAlign = "left";
}

function getPauseButtons() {
    const panelW = Math.min(560, W - 50);
    const panelH = 320;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    const buttonW = Math.min(390, panelW - 60);
    const buttonH = 42;
    const gap = 12;
    const x = W / 2 - buttonW / 2;
    const y = panelY + 170;

    return [
        {
            id: "continue",
            x,
            y,
            w: buttonW,
            h: buttonH,
            text: "▶  CONTINUAR"
        },
        {
            id: "save",
            x,
            y: y + buttonH + gap,
            w: buttonW,
            h: buttonH,
            text: "💾  SALVAR JOGO"
        },
        {
            id: "menu",
            x,
            y: y + (buttonH + gap) * 2,
            w: buttonW,
            h: buttonH,
            text: "🏠  MENU PRINCIPAL"
        }
    ];
}

function drawPaused() {
    if (!paused || gameOver)
        return;

    ctx.save();

    // Fundo
    ctx.fillStyle = "rgba(0,0,0,.82)";
    ctx.fillRect(0, 0, W, H);

    // Painel
    const panelW = Math.min(560, W - 50);
    const panelH = 320;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    ctx.fillStyle = "rgba(5,15,25,.98)";

    ctx.beginPath();
    ctx.roundRect(
        panelX,
        panelY,
        panelW,
        panelH,
        24
    );
    ctx.fill();

    ctx.strokeStyle = "rgba(56,189,248,.8)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(
        panelX,
        panelY,
        panelW,
        panelH,
        24
    );
    ctx.stroke();

    ctx.textAlign = "center";

    // Título
    ctx.fillStyle = "#e0f2fe";
    ctx.font = "bold 30px Arial";

    ctx.fillText(
        "⏸ PAUSADO",
        W / 2,
        panelY + 45
    );

    // Nome
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 17px Arial";

    ctx.fillText(
        "🌊 AVENTURA TOMIOKA",
        W / 2,
        panelY + 75
    );

    // Status
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px Arial";

    ctx.fillText(
        `Nível ${player.level}  •  💰 ${player.coins}  •  🌊 ${player.mastery} MESTRIA`,
        W / 2,
        panelY + 102
    );

    // Botões
    for (const b of getPauseButtons()) {

        ctx.fillStyle =
            b.id === "save"
                ? "rgba(8,145,178,.82)"
                : "rgba(15,23,42,.95)";

        ctx.strokeStyle =
            b.id === "save"
                ? "rgba(103,232,249,.9)"
                : "rgba(148,163,184,.45)";

        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(
            b.x,
            b.y,
            b.w,
            b.h,
            12
        );

        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px Arial";

        ctx.fillText(
            b.text,
            W / 2,
            b.y + 27
        );
    }

    ctx.textAlign = "left";
    ctx.restore();
}

function selectPauseButtonAt(x, y) {
    if (!paused || gameOver)
        return false;

    for (const b of getPauseButtons()) {

        if (
            x >= b.x &&
            x <= b.x + b.w &&
            y >= b.y &&
            y <= b.y + b.h
        ) {

            if (b.id === "continue") {

                togglePause();

                return true;
            }

            if (b.id === "save") {

                if (saveGame(true)) {
                    text(
                        player.x,
                        player.y - 75,
                        "💾 JOGO SALVO!",
                        "#67e8f9",
                        15
                    );
                }

                return true;
            }

            if (b.id === "menu") {

                saveGame();

                paused = false;
                stopMusicLoop();

                started = false;

                const menu =
                    document.getElementById("startScreen");

                if (menu)
                    menu.classList.remove("hidden");

                updateContinueButton();

                return true;
            }
        }
    }

    return false;
}


function drawStageTransition() {

    if (
        stageTransition <= 0 ||
        !started ||
        gameOver
    )
        return;

    const alpha =
        clamp(
            Math.min(
                1,
                stageTransition / 35
            ),
            0,
            1
        );

    ctx.save();

    ctx.fillStyle =
        "rgba(2,6,23," +
        (.72 * alpha) +
        ")";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "#67e8f9";

    ctx.font =
        "bold 34px Arial";

    ctx.fillText(
        "🌊 FASE " + currentStage,
        W / 2,
        H / 2 - 30
    );

    ctx.fillStyle =
        "#e0f2fe";

    ctx.font =
        "bold 17px Arial";

    ctx.fillText(
        getStageName(),
        W / 2,
        H / 2 + 8
    );

    ctx.fillStyle =
        "#94a3b8";

    ctx.font =
        "13px Arial";

    ctx.fillText(
        stageTarget +
        " inimigos",
        W / 2,
        H / 2 + 34
    );

    ctx.restore();
}


function draw() {
    ctx.save();

    if (cameraShake > 0) {
        ctx.translate(
            random(-cameraShake, cameraShake),
            random(-cameraShake, cameraShake)
        );
    }

    drawBackground();

    for (const enemy of enemies)
        drawEnemy(enemy);

    drawProjectiles();
    drawSlashEffects();
    drawParticles();
    drawPlayer();
    drawTexts();

    ctx.restore();

    drawHUD();
    drawStageHUD();
    drawStageTransition();
    drawPauseButton();
    drawFullscreenButton();
    drawJoystick();
    drawAttackButton();
    drawSpecialButton();
    drawDashButton();
    drawGameOver();
    drawPaused();

    
    drawUpgradeMenu();

    drawShopButton();
    drawShopMenu();

    // ========================================================
    // CAMADA FINAL DA INTERFACE
    // Créditos e Dev Menu ficam acima de todas as outras UI.
    // ========================================================

    drawGameCredits();
    drawDevButton();
    drawDevMenu();
}


/* TOMIOKA_DEV_MENU_V1 */

// ============================================================
// DEV MENU
// ============================================================

const DEV_MODE = true;

let devMenuOpen = false;
let devMessage = "";
let devMessageTimer = 0;

function devNotify(message) {

    devMessage = message;
    devMessageTimer = 90;

    text(
        player.x,
        player.y - 95,
        "🛠️ " + message,
        "#facc15",
        14
    );
}

function toggleDevMenu() {

    if (!DEV_MODE)
        return;

    devMenuOpen = !devMenuOpen;

    if (devMenuOpen) {
        paused = true;
        devNotify("DEV MENU ABERTO");
    } else {
        paused = false;
        devNotify("DEV MENU FECHADO");
    }
}

// ============================================================
// BOTÃO DEV
// ============================================================

function getDevButton() {

    return {
        x: W - 78,
        y: 86,
        w: 66,
        h: 42
    };
}

function drawDevButton() {

    if (!DEV_MODE)
        return;

    const b = getDevButton();

    ctx.save();

    ctx.fillStyle =
        devMenuOpen
            ? "rgba(239,68,68,.92)"
            : "rgba(15,23,42,.90)";

    ctx.strokeStyle =
        devMenuOpen
            ? "#fca5a5"
            : "#64748b";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.roundRect(
        b.x,
        b.y,
        b.w,
        b.h,
        9
    );

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "🛠️",
        b.x + b.w / 2,
        b.y + b.h / 2
    );

    ctx.restore();
}

// ============================================================
// BOTÕES DO MENU
// ============================================================

function getDevButtons() {

    const panelW = Math.min(560, W - 24);
    const panelX = (W - panelW) / 2;

    const buttonW =
        (panelW - 36) / 2;

    const buttonH = 52;

    const startY =
        Math.max(
            125,
            (H - 430) / 2 + 75
        );

    const gap = 8;

    const items = [
        ["💰 +1.000", "money"],
        ["💰 +100.000", "moneyBig"],

        ["❤️ VIDA MAX", "hp"],
        ["⚡ ENERGIA", "energy"],

        ["⭐ +1.000 XP", "xp"],
        ["⬆️ +1 NÍVEL", "level"],

        ["🔥 RESET CD", "cooldown"],
        ["🏃 VELOCIDADE", "speed"],

        ["👹 SPAWN ONI", "spawn"],
        ["🧹 LIMPAR INIMIGOS", "clear"],

        ["🗺️ PRÓXIMA FASE", "nextStage"],
        ["🔄 FASE 1", "stage1"]
    ];

    const buttons = [];

    for (let i = 0; i < items.length; i++) {

        const col = i % 2;
        const row = Math.floor(i / 2);

        buttons.push({
            x:
                panelX +
                12 +
                col * (buttonW + gap),

            y:
                startY +
                row * (buttonH + gap),

            w: buttonW,
            h: buttonH,

            label: items[i][0],
            action: items[i][1]
        });
    }

    return buttons;
}

// ============================================================
// EXECUTA AÇÃO DEV
// ============================================================

function executeDevAction(action) {

    if (!DEV_MODE)
        return;

    switch (action) {

        case "money":
            player.coins += 1000;
            devNotify("+1.000 moedas");
            break;

        case "moneyBig":
            player.coins += 100000;
            devNotify("+100.000 moedas");
            break;

        case "hp":
            player.maxHp += 100;
            player.hp = player.maxHp;
            devNotify("Vida máxima aumentada");
            break;

        case "energy":

            if ("energy" in player)
                player.energy = player.maxEnergy ?? 999;

            if ("stamina" in player)
                player.stamina = player.maxStamina ?? 999;

            if ("specialEnergy" in player)
                player.specialEnergy = 999;

            devNotify("Energia restaurada");
            break;

        case "xp":
            gainXP(1000);
            devNotify("+1.000 XP");
            break;

        case "level":

            player.level++;

            player.maxHp += 15;
            player.hp = player.maxHp;

            player.xp = 0;

            player.xpNext =
                Math.floor(
                    player.xpNext * 1.35
                );

            devNotify("Nível aumentado");
            break;

        case "cooldown":

            player.attackCooldown = 0;
            player.specialCooldown = 0;
            player.dashCooldown = 0;
            player.invincible = 0;

            devNotify("Cooldowns resetados");
            break;

        case "speed":

            player.speed =
                Math.min(
                    20,
                    player.speed + 1
                );

            devNotify(
                "Velocidade: " +
                player.speed.toFixed(1)
            );

            break;

        case "spawn":

            if (
                typeof spawnEnemy === "function"
            ) {
                spawnEnemy();
                devNotify("Oni spawnado");
            } else {
                devNotify("Spawn automático usado");
            }

            break;

        case "clear":

            enemies.length = 0;

            devNotify(
                "Todos os inimigos removidos"
            );

            break;

        case "nextStage":

            currentStage++;

            stageKills = 0;

            devNotify(
                "Fase " +
                currentStage
            );

            break;

        case "stage1":

            currentStage = 1;
            stageKills = 0;

            devNotify("Voltando para fase 1");

            break;
    }

    saveGame();
}

// ============================================================
// DESENHO DO MENU
// ============================================================

function drawDevMenu() {

    if (!DEV_MODE || !devMenuOpen)
        return;

    const panelW =
        Math.min(
            560,
            W - 24
        );

    const panelH =
        Math.min(
            455,
            H - 105
        );

    const panelX =
        (W - panelW) / 2;

    const panelY =
        Math.max(
            82,
            (H - panelH) / 2
        );

    ctx.save();

    // Fundo escuro
    ctx.fillStyle =
        "rgba(0,0,0,.68)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    // Painel
    ctx.fillStyle =
        "rgba(15,23,42,.97)";

    ctx.strokeStyle =
        "#facc15";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.roundRect(
        panelX,
        panelY,
        panelW,
        panelH,
        18
    );

    ctx.fill();
    ctx.stroke();

    // Título
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "🛠️ DEV MENU",
        W / 2,
        panelY + 28
    );

    // Status
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";

    ctx.fillText(
        "Tomioka Developer Tools",
        W / 2,
        panelY + 51
    );

    // Informações
    ctx.textAlign = "left";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "13px sans-serif";

    ctx.fillText(
        "💰 " + player.coins +
        "    ❤️ " +
        Math.floor(player.hp) +
        "/" +
        Math.floor(player.maxHp),

        panelX + 18,
        panelY + 70
    );

    ctx.fillText(
        "⭐ Nv. " +
        player.level +
        "    🗺️ Fase " +
        currentStage,

        panelX + panelW - 160,
        panelY + 70
    );

    // Botões
    const buttons =
        getDevButtons();

    for (const b of buttons) {

        ctx.fillStyle =
            "rgba(30,41,59,.96)";

        ctx.strokeStyle =
            "rgba(148,163,184,.45)";

        ctx.lineWidth = 1.5;

        ctx.beginPath();

        ctx.roundRect(
            b.x,
            b.y,
            b.w,
            b.h,
            10
        );

        ctx.fill();
        ctx.stroke();

        ctx.fillStyle =
            "#f8fafc";

        ctx.font =
            "bold 13px sans-serif";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            b.label,
            b.x + b.w / 2,
            b.y + b.h / 2
        );
    }

    // Fechar
    const closeY =
        panelY +
        panelH -
        34;

    ctx.fillStyle =
        "#f87171";

    ctx.font =
        "bold 13px sans-serif";

    ctx.fillText(
        "✕ FECHAR DEV MENU",
        W / 2,
        closeY
    );

    ctx.restore();
}

// ============================================================
// TOQUE NO DEV MENU
// ============================================================

function handleDevTouch(x, y) {

    if (!DEV_MODE)
        return false;

    const button =
        getDevButton();

    // Botão 🛠️
    if (
        x >= button.x &&
        x <= button.x + button.w &&
        y >= button.y &&
        y <= button.y + button.h
    ) {

        toggleDevMenu();

        return true;
    }

    if (!devMenuOpen)
        return false;

    const panelW =
        Math.min(
            560,
            W - 24
        );

    const panelH =
        Math.min(
            455,
            H - 105
        );

    const panelX =
        (W - panelW) / 2;

    const panelY =
        Math.max(
            82,
            (H - panelH) / 2
        );

    // Fechar
    if (
        y >= panelY + panelH - 60 &&
        y <= panelY + panelH &&
        x >= panelX &&
        x <= panelX + panelW
    ) {

        toggleDevMenu();

        return true;
    }

    // Botões
    for (const b of getDevButtons()) {

        if (
            x >= b.x &&
            x <= b.x + b.w &&
            y >= b.y &&
            y <= b.y + b.h
        ) {

            executeDevAction(
                b.action
            );

            return true;
        }
    }

    return true;
}

// ============================================================
// TECLADO DEV
// ============================================================

addEventListener(
    "keydown",
    e => {

        if (
            DEV_MODE &&
            e.key === "F2"
        ) {

            e.preventDefault();

            toggleDevMenu();
        }
    }
);

// ============================================================
// TOUCH CAPTURE DO DEV MENU
// ============================================================

let devTouchActive = false;

function getCanvasPointFromTouch(touch) {

    const rect = canvas.getBoundingClientRect();

    return {
        x:
            (touch.clientX - rect.left) *
            (W / rect.width),

        y:
            (touch.clientY - rect.top) *
            (H / rect.height)
    };
}

addEventListener(
    "touchstart",
    e => {

        if (!DEV_MODE)
            return;

        const touch = e.changedTouches[0];

        if (!touch)
            return;

        const p = getCanvasPointFromTouch(touch);
        const b = getDevButton();

        const onDevButton =
            p.x >= b.x &&
            p.x <= b.x + b.w &&
            p.y >= b.y &&
            p.y <= b.y + b.h;

        if (devMenuOpen || onDevButton) {

            devTouchActive = true;

            e.preventDefault();
            e.stopImmediatePropagation();
        }

    },
    {
        passive: false,
        capture: true
    }
);

addEventListener(
    "touchend",
    e => {

        if (!DEV_MODE || !devTouchActive)
            return;

        const touch = e.changedTouches[0];

        if (!touch)
            return;

        const p = getCanvasPointFromTouch(touch);

        e.preventDefault();
        e.stopImmediatePropagation();

        handleDevTouch(p.x, p.y);

        devTouchActive = false;

    },
    {
        passive: false,
        capture: true
    }
);

addEventListener(
    "touchcancel",
    e => {

        if (!DEV_MODE || !devTouchActive)
            return;

        e.preventDefault();
        e.stopImmediatePropagation();

        devTouchActive = false;

    },
    {
        passive: false,
        capture: true
    }
);


// ============================================================
// SISTEMA DE SAVE / LOAD
// ============================================================

const SAVE_KEY = "tomioka_last_save_v1";

function getSaveData() {
    return {
        player: {
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.maxHp,
            level: player.level,
            xp: player.xp,
            xpNext: player.xpNext,
            coins: player.coins,
            mastery: player.mastery,
            technique: player.technique,
            selectedTechnique: selectedTechnique
        },

        stage: {
            currentStage: currentStage,
            stageKills: stageKills,
            stageTarget: stageTarget
        },

        savedAt: Date.now()
    };
}

function saveGame(showMessage = false) {
    try {
        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(getSaveData())
        );

        if (showMessage) {
            text(
                player.x,
                player.y - 75,
                "💾 JOGO SALVO",
                "#67e8f9",
                14
            );
        }

        updateContinueButton();
        return true;

    } catch (err) {
        console.log("Erro ao salvar:", err);
        return false;
    }
}

function hasSaveGame() {
    try {
        return !!localStorage.getItem(SAVE_KEY);
    } catch (err) {
        return false;
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);

        if (!raw)
            return false;

        const data = JSON.parse(raw);

        if (!data || !data.player)
            return false;

        // Limpa o mundo antes de carregar
        enemies.length = 0;
        projectiles.length = 0;
        particles.length = 0;
        floatingTexts.length = 0;
        slashEffects.length = 0;

        player.x = clamp(
            Number(data.player.x) || W / 2,
            28,
            W - 28
        );

        player.y = clamp(
            Number(data.player.y) || H / 2,
            125,
            H - 28
        );

        resolvePlayerScenarioCollision();

        player.hp =
            Number(data.player.hp) ||
            100;

        player.maxHp =
            Number(data.player.maxHp) ||
            100;

        player.level =
            Number(data.player.level) ||
            1;

        player.xp =
            Number(data.player.xp) ||
            0;

        player.xpNext =
            Number(data.player.xpNext) ||
            100;

        player.coins =
            Number(data.player.coins) ||
            0;

        player.mastery =
            Number(data.player.mastery) ||
            0;

        player.technique =
            Number(data.player.technique) ||
            0;

        selectedTechnique =
            Number(data.player.selectedTechnique) || 0;

        currentStage =
            Number(data.stage?.currentStage) ||
            1;

        stageKills =
            Number(data.stage?.stageKills) ||
            0;

        stageTarget =
            getStageTarget();

        stageTransition = 0;
        stageMessage = "";

        player.attackCooldown = 0;
        player.specialCooldown = 0;
        player.invincible = 0;
        player.dashCooldown = 0;
        player.facing = 0;

        gameOver = false;
        paused = false;

        spawnTimer = 0;
        cameraShake = 0;

        updateTechnique();

        // Garante que a técnica selecionada existe
        if (
            selectedTechnique < 0 ||
            selectedTechnique > player.technique
        ) {
            selectedTechnique = player.technique;
        }

        return true;

    } catch (err) {
        console.log("Erro ao carregar:", err);
        return false;
    }
}

function deleteSaveGame() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (err) {
        console.log("Erro ao apagar save:", err);
    }

    updateContinueButton();
}

function updateContinueButton() {
    const btn =
        document.getElementById("continueButton");

    if (!btn)
        return;

    btn.style.display =
        hasSaveGame()
            ? "block"
            : "none";
}

function showGameMenu() {
    const screen =
        document.getElementById("startScreen");

    if (screen)
        screen.classList.remove("hidden");

    updateContinueButton();
}

function hideGameMenu() {
    const screen =
        document.getElementById("startScreen");

    if (screen)
        screen.classList.add("hidden");
}

function resetGame() {
    deleteSaveGame();

    ensurePlayerEnergy();

    player.x = W / 2;
    player.y = H / 2;

    player.hp = 100;
    player.maxHp = 100;

    player.level = 1;
    player.xp = 0;
    player.xpNext = 100;

    player.coins = 0;

    player.attackCooldown = 0;
    player.specialCooldown = 0;
    player.invincible = 0;
    player.dashCooldown = 0;

    player.facing = 0;

    // A maestria também reinicia para uma nova partida.
    player.mastery = 0;
    player.technique = 0;
    selectedTechnique = 0;
    player.masteryMax = 50;

    // Reinicia o sistema de fases.
    currentStage = 1;
    stageKills = 0;
    stageTarget = getStageTarget();
    stageTransition = 0;
    stageMessage = ""; 

    enemies.length = 0;
    projectiles.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;
    slashEffects.length = 0;

    gameOver = false;
    paused = false;

    spawnTimer = 0;
    cameraShake = 0;

    updateTechnique();
}

function dash() {
    if (!started || paused || gameOver) return;
    if (player.dashCooldown > 0) return;

    let dx = joystick.dx;
    let dy = joystick.dy;

    if (!joystick.active) {
        if (keys["a"] || keys["arrowleft"]) dx = -1;
        if (keys["d"] || keys["arrowright"]) dx = 1;
        if (keys["w"] || keys["arrowup"]) dy = -1;
        if (keys["s"] || keys["arrowdown"]) dy = 1;
    }

    if (Math.hypot(dx, dy) < .1) {
        dx = Math.cos(player.facing);
        dy = Math.sin(player.facing);
    }

    const len = Math.hypot(dx, dy);

    dx /= len;
    dy /= len;

    player.x = clamp(player.x + dx * 115, 28, W - 28);
    player.y = clamp(player.y + dy * 115, 125, H - 28);

    // O dash também respeita o cenário.
    resolvePlayerScenarioCollision();

    player.invincible = 18;
    player.dashCooldown = 100;

    addParticle(
        player.x,
        player.y,
        "#38bdf8",
        25,
        4
    );

    cameraShake = 4;
    playTone(260, .08, "triangle", .05);
}

function togglePause() {
    if (!started || gameOver) return;

    paused = !paused;

    if (paused)
        stopMusicLoop();
    else
        startMusic();
}

function toggleMusic() {
    musicEnabled = !musicEnabled;

    if (musicEnabled)
        startMusic();
    else
        stopMusicLoop();
}

function startAudio() {
    if (audioStarted) return;

    try {
        audioContext =
            new (window.AudioContext || window.webkitAudioContext)();

        audioStarted = true;

        if (audioContext.state === "suspended")
            audioContext.resume();

    } catch (e) {
        console.log("Áudio indisponível:", e);
    }
}

function playTone(freq, duration, type = "sine", volume = .04) {
    if (!audioStarted || !audioContext) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(
            volume,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            .001,
            audioContext.currentTime + duration
        );

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + duration);
    } catch {}
}

function startMusic() {
    if (audioStarted) return;

    try {
        audioContext =
            new (window.AudioContext || window.webkitAudioContext)();

        audioStarted = true;

        if (audioContext.state === "suspended")
            audioContext.resume();

        playWaterMusic();
    } catch (err) {
        console.log("Áudio não disponível:", err);
    }
}

function playMusicNote(freq, duration, volume = 0.035) {
    if (!audioContext || !musicEnabled || paused)
        return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(
        0,
        audioContext.currentTime
    );

    gain.gain.linearRampToValueAtTime(
        volume,
        audioContext.currentTime + 0.04
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(
        audioContext.currentTime + duration + 0.05
    );
}

function playWaterMusic() {
    if (!audioContext || !musicEnabled)
        return;

    const melody = [
        261.63,
        329.63,
        392.00,
        329.63,
        293.66,
        349.23,
        440.00,
        349.23,
        261.63,
        329.63,
        392.00,
        523.25,
        440.00,
        392.00,
        329.63,
        293.66
    ];

    let i = 0;

    const playNext = () => {
        if (!audioContext || !musicEnabled)
            return;

        if (paused) {
            musicTimer = setTimeout(playNext, 700);
            return;
        }

        playMusicNote(
            melody[i],
            0.55,
            0.025
        );

        i = (i + 1) % melody.length;

        musicTimer = setTimeout(
            playNext,
            430
        );
    };

    playNext();
}

function stopMusicLoop() {
    if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
}

function touchPosition(touch) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (touch.clientX - rect.left) * (W / rect.width),
        y: (touch.clientY - rect.top) * (H / rect.height)
    };
}

function updateJoystick(x, y) {
    const baseX = 82;
    const baseY = H - 100;

    let dx = x - baseX;
    let dy = y - baseY;

    const len = Math.hypot(dx, dy);

    if (len > joystick.max) {
        dx = dx / len * joystick.max;
        dy = dy / len * joystick.max;
    }

    joystick.dx = dx / joystick.max;
    joystick.dy = dy / joystick.max;

    if (Math.hypot(joystick.dx, joystick.dy) > .1)
        player.facing = Math.atan2(joystick.dy, joystick.dx);
}

function handleTouchStart(e) {
    e.preventDefault();

    startAudio();

    if (!started) {
        started = true;

        const start = document.getElementById("startScreen");

        if (start)
            start.classList.add("hidden");

        startMusic();
        return;
    }

    if (gameOver) {
        resetGame();
        startMusic();
        return;
    }

    for (const touch of e.changedTouches) {
        const p = touchPosition(touch);

        // Menu de pausa
        if (paused) {
            if (selectPauseButtonAt(p.x, p.y))
                continue;

            // Se tocar fora dos botões, não faz nada.
            continue;
        }

        // pausa
        if (
            p.x > W - 70 &&
            p.x < W - 10 &&
            p.y > 80 &&
            p.y < 130
        ) {
            togglePause();
            continue;
        }

        // música
        if (
            p.x > W - 105 &&
            p.x < W - 55 &&
            p.y < 70
        ) {
            toggleMusic();
            continue;
        }

        // tela cheia
        if (
            p.x > W - 70 &&
            p.x < W &&
            p.y > 5 &&
            p.y < 65
        ) {
            toggleFullscreen();
            continue;
        }

        // ESPECIAL
        const specialX = W - 82;
        const specialY = H - 180;

        if (
            Math.hypot(
                p.x - specialX,
                p.y - specialY
            ) < 58
        ) {
            useSpecial();
            continue;
        }

        // dash
        const dashX = W - 165;
        const dashY = H - 72;

        if (
            Math.hypot(p.x - dashX, p.y - dashY) < 40
        ) {
            dash();
            continue;
        }

        // joystick
        if (
            Math.hypot(
                p.x - 82,
                p.y - (H - 100)
            ) < 90
        ) {
            joystick.active = true;
            joystick.pointerId = touch.identifier;

            updateJoystick(p.x, p.y);
            continue;
        }

        // ataque
        if (
            Math.hypot(
                p.x - (W - 82),
                p.y - (H - 72)
            ) < 75
        ) {
            attackPressed = true;
            attackPointerId = touch.identifier;
            attack();
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();

    for (const touch of e.changedTouches) {
        if (
            joystick.active &&
            touch.identifier === joystick.pointerId
        ) {
            const p = touchPosition(touch);
            updateJoystick(p.x, p.y);
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();

    for (const touch of e.changedTouches) {
        if (
            joystick.active &&
            touch.identifier === joystick.pointerId
        ) {
            joystick.active = false;
            joystick.pointerId = null;
            joystick.dx = 0;
            joystick.dy = 0;
        }

        if (
            attackPressed &&
            touch.identifier === attackPointerId
        ) {
            attackPressed = false;
            attackPointerId = null;
        }
    }
}

canvas.addEventListener(
    "touchstart",
    handleTouchStart,
    { passive: false }
);

canvas.addEventListener(
    "touchmove",
    handleTouchMove,
    { passive: false }
);

canvas.addEventListener(
    "touchend",
    handleTouchEnd,
    { passive: false }
);

canvas.addEventListener(
    "touchcancel",
    handleTouchEnd,
    { passive: false }
);

addEventListener("keydown", e => {
    startMusic();

    keys[e.key.toLowerCase()] = true;

    if (e.code === "Space") {
        attackPressed = true;
        attack();

    } else if (
        e.code === "KeyE" ||
        e.code === "ShiftLeft" ||
        e.code === "ShiftRight"
    ) {
        useSpecial();

    } else if (e.code === "KeyF") {
        toggleFullscreen();
    }

    const number = Number(e.key);

    if (
        number >= 1 &&
        number <= 7
    ) {

        const index =
            number - 1;

        const tech =
            waterTechniques[index];

        if (
            player.mastery >=
            tech.required
        ) {

            selectedTechnique =
                index;

            text(
                player.x,
                player.y - 85,
                "🌊 " + tech.name,
                tech.color,
                13
            );

        } else {

            text(
                player.x,
                player.y - 85,
                "🔒 Requer " +
                tech.required +
                " MESTRIA",
                "#f87171",
                12
            );
        }
    }

    if (e.key.toLowerCase() === "q")
        dash();

    if (e.key.toLowerCase() === "p")
        togglePause();
});

addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;

    if (e.code === "Space")
        attackPressed = false;
});

function beginNewGame() {
    startAudio();

    resetGame();

    started = true;

    hideGameMenu();

    startMusic();

    saveGame();
}

function continueGame() {
    startAudio();

    if (!loadGame()) {
        beginNewGame();
        return;
    }

    started = true;

    hideGameMenu();

    startMusic();
}

document
    .getElementById("startButton")
    .addEventListener("click", e => {
        e.stopPropagation();
        beginNewGame();
    });

const continueButton =
    document.getElementById("continueButton");

if (continueButton) {
    continueButton.addEventListener(
        "click",
        e => {
            e.stopPropagation();
            continueGame();
        }
    );
}

const deleteSaveButton =
    document.getElementById("deleteSaveButton");

if (deleteSaveButton) {
    deleteSaveButton.addEventListener(
        "click",
        e => {
            e.stopPropagation();

            deleteSaveGame();

            updateContinueButton();
        }
    );
}

window.addEventListener(
    "beforeunload",
    () => {
        if (started && !gameOver)
            saveGame();
    }
);

window.addEventListener("load", () => {
    const loading =
        document.getElementById("loading");

    setTimeout(() => {
        loading.classList.add("hidden");

        showGameMenu();
    }, 500);
});


// ============================================================
// LOOP PRINCIPAL DO JOGO
// ============================================================

function loop() {

    // Atualiza apenas quando o jogo está em andamento.
    if (started && !paused && !gameOver) {
        update();
    }

    // O desenho continua acontecendo mesmo no menu/pausa.
    draw();

    requestAnimationFrame(loop);
}

loop();



// ============================================================
// CONTROLES DO MENU DE EVOLUÇÃO
// ============================================================

function selectUpgradeFromPosition(x, y) {

    if (!upgradeMenuOpen)
        return false;

    const panelW =
        Math.min(
            520,
            W - 30
        );

    const panelH = 390;

    const panelX =
        (W - panelW) / 2;

    const panelY =
        Math.max(
            85,
            (H - panelH) / 2
        );

    const buttonW =
        (panelW - 45) / 2;

    const buttonH = 105;

    const buttons = [

        {
            x: panelX + 15,
            y: panelY + 90
        },

        {
            x: panelX + 30 + buttonW,
            y: panelY + 90
        },

        {
            x: panelX + 15,
            y: panelY + 205
        },

        {
            x: panelX + 30 + buttonW,
            y: panelY + 205
        }
    ];

    for (let i = 0; i < buttons.length; i++) {

        const b = buttons[i];

        if (
            x >= b.x &&
            x <= b.x + buttonW &&
            y >= b.y &&
            y <= b.y + buttonH
        ) {
            applyUpgrade(i + 1);
            return true;
        }
    }

    return false;
}


// Teclado
addEventListener(
    "keydown",
    function(e) {

        if (!upgradeMenuOpen)
            return;

        if (e.key === "1")
            applyUpgrade(1);

        else if (e.key === "2")
            applyUpgrade(2);

        else if (e.key === "3")
            applyUpgrade(3);

        else if (e.key === "4")
            applyUpgrade(4);
    }
);


// Toque no celular
addEventListener(
    "touchend",
    function(e) {

        if (!upgradeMenuOpen)
            return;

        const touch =
            e.changedTouches[0];

        if (!touch)
            return;

        const rect =
            canvas.getBoundingClientRect();

        const x =
            (touch.clientX - rect.left) *
            (W / rect.width);

        const y =
            (touch.clientY - rect.top) *
            (H / rect.height);

        if (
            selectUpgradeFromPosition(
                x,
                y
            )
        ) {
            e.preventDefault();
            e.stopPropagation();
        }
    },
    {
        passive: false
    }
);

