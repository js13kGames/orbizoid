window.addEventListener('load', function() {


    function byId(id) {
        return document[gebi](id);
    }

    var H = 600,
        W = 920,
        W2 = 460,
        H2 = 300,
        gebi = "getElementById",
        container = byId("T"),
        level = byId("level"),
        cvId = byId("C"),
        hud = byId("U"),
        ctxCopy = cvId.cloneNode(0),
        ctx = cvId.getContext("2d"),
        ctxHud = hud.getContext("2d"),
        ctxBuffer = ctxCopy.getContext("2d"),
        game,
        gameMode,
        invalidatedHud,
        spriteSize = 64,
        explosionSin = [],
        explosionCos = [],
        PI = Math.PI,
        isIpad = navigator.platform.indexOf("iPad") >= 0,
        isFF = navigator.userAgent.indexOf("Firefox") >= 0,
        touchEnabled = "createTouch" in document,
        numStars = 150,
        rand = Math.random,
        cos = Math.cos,
        sin = Math.sin,
        pat,
        pc = document.createElement('canvas'), pm = pc.getContext("2d");


    menuStyle = byId("m").style;
    cvId.width = hud.width = ctxCopy.width = W;
    cvId.height = hud.height = ctxCopy.height = H;

    for (s = 0; s < 18; s++) explosionSin.push(sin(PI / 9.0 * s)), explosionCos.push(cos(PI / 9.0 * s));

    byId("E").onclick = function() {
        menuStyle.display = "none";
        hud.style.display = "block";
        gameMode = 1;
        init();
        countdown();
    };
    byId("H").onclick = function() {
        menuStyle.display = "none";
        hud.style.display = "block";
        gameMode = 2;
        init();
        countdown();
    };

    hud.style.cursor = "none";

    if (touchEnabled) {
        container.addEventListener('touchmove', onTouchMove, false);

        function onTouchMove(event) {

            if (!game.player.die) {
                game.player.x = event.touches[0].pageX - container.offsetLeft;
                game.player.y = event.touches[0].pageY - container.offsetTop;
            }

            event.preventDefault();
        }
    }

    hud.onmousemove = function(args) {
        if (!game.player.die) {
            game.player.x = args.clientX - container.offsetLeft;
            game.player.y = args.clientY - container.offsetTop;
        }
    };


    function getPlanets() {
        p = [
            { score: 100, die: false, e: 0.5, w: 15, o: PI * 1.4, d: 100, s: 0.00, x: cvId.width / 2, y: cvId.height / 2, c: 0, rx: 0, ry: 0 },
            { score: 200, die: false, e: 0.4, w: 10, o: PI, d: 70, s: 0.05, x: cvId.width / 2, y: cvId.height / 2, c: 56, rx: 0, ry: 0 },
            { score: 300, die: false, e: 0.3, w: 7, o: PI / 2, d: 80, s: 0.075, x: cvId.width / 2, y: cvId.height / 2, c: 118, rx: 0, ry: 0 },
            { score: 400, die: false, e: 0.2, w: 10, o: PI / 3, d: 40, s: 0.1, x: cvId.width / 2, y: cvId.height / 2, c: 240, rx: 0, ry: 0 },
            { score: 500, die: false, e: 0.05, w: 5, o: PI * 1.5, d: 150, s: 0.2, x: cvId.width / 2, y: cvId.height / 2, c: 290, rx: 0, ry: 0 }];
        for (var i = 0; p[i]; i++) {
            p[i].canvas = renderSphere(p[i], "hsla(" + p[i].c + ",50%, 50%,.75)");
        }
        return p;
    }

    function init() {
        invalidatedHud = 1;
        game = {
            player: {
                lives: 3,
                level: 1,
                score: 0,
                hiscore: localStorage.getItem('hiscore' + gameMode) | 0,
                progress: 0,
                die: false,
                x: cvId.width / 2,
                y: cvId.height / 2,
                w: 25,
                doubleScore: 0,
                c: "rgba(220,220,220,1)",
                c2: "rgba(220,220,220,.8)",
                powerupDuration: 0,
                supernova: { speedStart: 25, speedDecay: .2, w: 25 }
            },
            planets: getPlanets(),
            enemy: [],
            starfield: { stars: [{ x: 0, y: 0, z: 0, s: 1 }] },
            settings: { numPlanets: 1, orbit: gameMode == 2 ? true : false, numEnemy: gameMode == 2 ? 7 : 5 },
            explosions: [],
            levels: [{ m: 10, s: 2 }, { m: 20, s: 4 }, { m: 30, s: 5 }, { m: 40, s: 7 }, { m: 80, s: 10 }],
            bonus: [],
            bonusChange: [],
            powerups: []
        };
        game.player.canvas = renderSphere(game.player, game.player.c);

        for (i = 0; i < numStars; i++) {
            game.starfield.stars.push({
                x: rand() * W * 10 - 5 * W,
                y: rand() * H * 10 - 5 * H,
                z: rand() * 100
            });
        }
        for (i = 0; i < game.settings.numEnemy; i++) {
            newEnemy();
        }

        var c = document.createElement('canvas'), m = c.getContext("2d");
        c.width = c.height = spriteSize * 2;

        // powerup base
        var grd = m.createRadialGradient(spriteSize + 16, spriteSize + 16, 20, spriteSize + 16, spriteSize + 16, 32);
        grd.addColorStop(0, "rgba(255,220,0,.3)");
        grd.addColorStop(1, "rgba(255,220,0,0)");
        m.fillStyle = grd;
        m.fillRect(0, 0, spriteSize * 2, spriteSize * 2);
        m.strokeStyle = "rgba(255,220,0,.2)";
        m.fillStyle = "rgba(255,220,0,.25)";
        m.arc(spriteSize + 16, spriteSize + 16, 20, 0, PI * 2);
        m.fill();
        m.stroke();
        var bonusBase = document.createElement("img");
        bonusBase.src = c.toDataURL("image/png");

        // 2X score
        m.fillStyle = "#FC0";
        m.font = "bold 25px Trebuchet MS";
        m.fillText("2X", spriteSize, spriteSize + 24);
        cnv = document.createElement("img");
        cnv.src = c.toDataURL("image/png");
        game.bonus.push({
            r: 0,
            x: 250,
            y: 250,
            c: cnv,
            p: 10,
            duration: 300,
            busy: 0,
            start: function() { game.player.doubleScore = 1; },
            done: function() { game.player.doubleScore = 0; }
        });

        //level down
        c.width = c.width;
        m.drawImage(bonusBase, 0, 0);
        m.fillStyle = "#FC0";
        m.font = "bold 25px Trebuchet MS";
        m.fillText("-1", spriteSize + 2, spriteSize + 24);
        cnv = document.createElement("img");
        cnv.src = c.toDataURL("image/png");
        game.bonus.push({
            r: 0,
            x: 350,
            y: 250,
            c: cnv,
            p: 3,
            duration: 0,
            busy: 0,
            start: function() {
                if (game.player.level > 1) {
                    game.player.level--;
                    game.settings.numPlanets--;
                }
                game.player.progress = 0;
                invalidatedHud = 1;
                for (e = 0; game.enemy[e]; e++)
                    if (game.enemy[e].t > game.player.level - 1) {
                        game.enemy[e].die = 1;
                    }

            },
            done: function() {
            }
        });

        //1K score
        c.width = c.width;
        m.drawImage(bonusBase, 0, 0);
        m.fillStyle = "#FC0";
        m.font = "bold 25px Trebuchet MS";
        m.fillText("1k", spriteSize + 2, spriteSize + 24);
        cnv = document.createElement("img");
        cnv.src = c.toDataURL("image/png");
        game.bonus.push({
            r: 0,
            x: 450,
            y: 250,
            c: cnv,
            p: 25,
            duration: 0,
            busy: 0,
            start: function() {
                game.player.score += 1000;
                invalidatedHud = 1;
            },
            done: function() {
            }
        });

        //1 Up
        c.width = c.width;
        m.drawImage(bonusBase, 0, 0);
        m.fillStyle = "#FC0";
        m.font = "bold 20px Trebuchet MS";
        m.fillText("1up", spriteSize - 2, spriteSize + 22);
        cnv = document.createElement("img");
        cnv.src = c.toDataURL("image/png");
        game.bonus.push({
            r: 0,
            x: 550,
            y: 250,
            c: cnv,
            p: 2,
            duration: 0,
            busy: 0,
            start: function() {
                game.player.lives++;
                invalidatedHud = 1;
            },
            done: function() {
            }
        });

        //explode all
        c.width = c.width;
        m.drawImage(bonusBase, 0, 0);
        m.beginPath();
        m.strokeStyle = "#FC0";
        d = PI * 2 / 8;
        m.lineWidth = 3;
        for (i = 0; i < 8; i++) {
            m.moveTo(spriteSize + sin(d * i) * 4 + 16, spriteSize + cos(d * i) * 4 + 16);
            m.lineTo(spriteSize + sin(d * i) * 16 + 16, spriteSize + cos(d * i) * 16 + 16);
        }
        m.stroke();
        var cnv = document.createElement("img");
        cnv.src = c.toDataURL("image/png");
        game.bonus.push({
            r: 0,
            x: 650,
            y: 250,
            c: cnv,
            p: 7,
            duration: 0,
            busy: 0,
            start: function() {
                playSound(sfx[0]);
                for (i = 0; game.enemy[i]; i++) game.enemy[i].die = 1;
            },
            done: function() {
            }
        });

        pc.width = pc.height = 6;
        pm.strokeStyle = "rgba(255,220,0,.2)";
        pm.moveTo(0, 6);
        pm.lineTo(6, 0);
        pm.stroke();
        pi = document.createElement("img");
        pi.src = pc.toDataURL("image/png");


    }

    function renderSphere(x) {
        var c = document.createElement('canvas'),
            m = c.getContext("2d");
        c.width = spriteSize * 2;
        c.height = spriteSize * 2;


        var grd = ctx.createRadialGradient(spriteSize, spriteSize, x.w, spriteSize, spriteSize, x.w + 15);
        if (x.c2) {
            grd.addColorStop(0, "rgba(220,220,220,.3)");
            grd.addColorStop(1, "rgba(220,220,220,0)");
        } else {
            grd.addColorStop(0, "hsla(" + x.c + ",85%,75%,.3)");
            grd.addColorStop(1, "hsla(" + x.c + ",85%,75%,0)");

        }
        m.fillStyle = grd; //"hsla(" + x.c + ",85%,75%,.4)";
        m.fillRect(spriteSize - x.w - 15, spriteSize - x.w - 15, spriteSize + x.w + 15, spriteSize + x.w + 15);

        m.beginPath();

        if (x.c2) {
            m.fillStyle = x.c2;
            m.strokeStyle = x.c;
        } else {
            m.strokeStyle = "hsla(" + x.c + ",50%, 50%,.9)";
            m.lineWidth = 2;
            m.fillStyle = "hsla(" + x.c + ",85%,75%,.6)";
        }

        m.arc(spriteSize, spriteSize, x.w, 0, 2 * PI, false);
        m.fill();
        m.stroke();

        var i = document.createElement("img");
        i.src = c.toDataURL("image/png");
        return i;
    }

    function distance2D(x1, y1, x2, y2) {
        return Math.abs(Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)));
    }

    function renderStar(color) {
        var point = 5;
        var c = document.createElement('canvas');
        c.width = spriteSize * 2;
        c.height = spriteSize * 2;
        var m = c.getContext("2d");

        var s = PI / point;

        var grd = ctx.createRadialGradient(spriteSize, spriteSize, 12, spriteSize, spriteSize, 33);
        grd.addColorStop(0, "hsla(" + color + ",85%,75%,.2)");
        grd.addColorStop(1, "hsla(" + color + ",85%,75%,0)");

        m.fillStyle = grd; //"hsla(" + x.c + ",85%,75%,.4)";
        m.fillRect(spriteSize - 33, spriteSize - 33, spriteSize + 33, spriteSize + 33);


        m.beginPath();
        m.strokeStyle = "hsla(" + color + ",50%, 50%,.9)";
        m.fillStyle = "hsla(" + color + ",85%,75%,.6)";
        for (p = 0; p < point * 2; p++) {
            m.lineTo(sin(p * s) * ((p % 2) * 12 + 6) + spriteSize, cos(p * s) * ((p % 2) * 12 + 6) + spriteSize);
        }
        m.closePath();
        m.fill();
        m.stroke();

        var i = document.createElement("img");
        i.src = c.toDataURL("image/png");
        return i;
    }

    function newEnemy() {
        var x = rand() * W,
            y = rand() * H,
            p = game.enemy.push({
                x: x < W2 ? x - W2 : x + W2,
                y: y < H2 ? y - H2 : y + H2,
                o: 0,
                s: rand() * 3 + 1,
                t: rand() * game.settings.numPlanets | 0
            }) - 1;

        game.enemy[p].d = Math.atan2(game.enemy[p].x - W2, game.enemy[p].y - H2);
        game.enemy[p].canvas = renderStar(game.planets[game.enemy[p].t].c);

    }


    function recalculate() {

        // Starfield
        for (i = 0; i < numStars; i++) {
            game.starfield.stars[i].z = game.starfield.stars[i].z - .5;
            if (game.starfield.stars[i].z < 1) game.starfield.stars[i].z = 100;
            game.starfield.stars[i].x2 = (.5 + (game.starfield.stars[i].x - W2) / (2 * game.starfield.stars[i].z) + W2) | 0;
            game.starfield.stars[i].y2 = (.5 + (game.starfield.stars[i].y - H2) / (2 * game.starfield.stars[i].z) + H2) | 0;
            game.starfield.stars[i].s = 20.0 / game.starfield.stars[i].z;

        }
        if (!ready) return;
        // planets
        len = game.planets.length;
        for (var i = 0; i < len; i++) {
            if (game.player.die) {
                game.planets[i].die = 1;
                continue;
            }
            if (game.settings.orbit) game.planets[i].o += game.planets[i].s;
            if (game.planets[i].o > PI * 2) game.planets[i].o = 0;
            game.planets[i].x = game.planets[i].x - (game.planets[i].x - game.player.x) * game.planets[i].e;
            game.planets[i].y = game.planets[i].y - (game.planets[i].y - game.player.y) * game.planets[i].e;
            game.planets[i].rx = ((0.5 + game.planets[i].x + sin(game.planets[i].o) * game.planets[i].d) | 0);
            game.planets[i].ry = ((0.5 + game.planets[i].y + cos(game.planets[i].o) * game.planets[i].d) | 0);

        }
        // enemies
        len = game.enemy.length;
        for (i = 0; i < len; i++) {
            if (game.player.die) {
                game.enemy[i].die = 1;

                continue;
            }
            var newDirection = Math.atan2(game.enemy[i].x - game.player.x, game.enemy[i].y - game.player.y);
            var xDirection;
            len2 = game.enemy.length;
            for (j = 0; j < len2; j++) {
                if (i == j) continue;
                if (distance2D(game.enemy[i].x, game.enemy[i].y, game.enemy[j].x, game.enemy[j].y) < (50)) {
                    xDirection = -Math.atan2(game.enemy[i].x - game.enemy[j].x, game.enemy[i].y - game.enemy[j].y);
                    break;
                }
            }
            if (xDirection) newDirection = (newDirection + xDirection) / 2;

            if (game.enemy[i].d - newDirection > PI) {
                if (newDirection < 0) newDirection += 2 * PI;
                else newDirection -= 2 * PI;
            }
            game.enemy[i].d = (game.enemy[i].d - (game.enemy[i].d - newDirection) * 0.1);
            game.enemy[i].x += -sin(game.enemy[i].d) * game.enemy[i].s;
            game.enemy[i].y += -cos(game.enemy[i].d) * game.enemy[i].s;

            if (!game.enemy[i].die) {
                for (j = 0; j < game.settings.numPlanets; j++) {
                    if (game.enemy[i].t == j) {
                        if (distance2D(game.enemy[i].x, game.enemy[i].y, game.planets[j].rx, game.planets[j].ry) < (20 + game.planets[j].w)) {
                            game.enemy[i].die = 1;
                            playSound(sfx[0]);
                            var rnd = rand() + rand() * 250;
                            last = 0;
                            lenq = game.bonus.length;
                            for (q = 0; q < lenq; q++) {
                                last += game.bonus[q].p;
                                if (rnd < last) {
                                    game.powerups.push({ busy: 0, taken: 0, x: game.enemy[i].x, y: game.enemy[i].y, t: q, r: 0, l: 180, die: 0 });
                                    break;
                                }
                            }
                            game.player.progress++;
                            game.player.score += game.planets[j].score;
                            if (game.player.doubleScore == 1)
                                game.player.score += game.planets[j].score;
                            if (game.player.score > game.player.hiscore) game.player.hiscore = game.player.score;
                            invalidatedHud = 1;
                        }
                    }
                }
                if (game.player.progress == game.levels[game.player.level - 1].m && game.player.level < 5) {
                    game.settings.numPlanets++;
                    game.player.level++;
                    game.player.progress = 0;
                    invalidatedHud = 1;

                }
                if (distance2D(game.enemy[i].x, game.enemy[i].y, game.player.x, game.player.y) < 40) {
                    playSound(sfx[4]);
                    game.player.die = 1;
                    game.powerups = [];
                    game.player.lives--;
                    localStorage.setItem('hiscore' + gameMode, game.player.hiscore);
                    game.player.supernova.w = game.player.w;
                    game.player.supernova.speedStart = 25;
                    game.player.progress = 0;
                    invalidatedHud = 1;
                }
            }
        }
        // explosions
        for (i = game.explosions.length - 1; i >= 0; i--) {
            game.explosions[i].o -= 1;
            if (game.explosions[i].o == 0) {
                game.explosions.splice(i, 1);
                if (!game.player.die) newEnemy();
            }
        }
        // supernova
        if (game.player.die) {
            game.player.supernova.w += game.player.supernova.speedStart;
            game.player.supernova.speedStart -= game.player.supernova.speedDecay;
            if (game.player.supernova.speedStart <= 0) {
                game.player.supernova = { speedStart: 25, speedDecay: .2, w: 25 };
                ready = false;
                game.player.die = 0;
                game.player.progress = 0;
                game.player.powerupDuration = 0;

                invalidatedHud = 1;
                if (game.player.lives > 0) {
                    game.enemy = [];
                    game.planets = getPlanets();
                    for (i = 0; i < game.settings.numEnemy; i++) newEnemy();
                    countdown();
                } else {
                    byId("G").style.display = "block";
                    byId("scoreValue").innerHTML = game.player.score;
                    byId("W").href = "https://twitter.com/intent/tweet?text=I%20just%20scored%20" + game.player.score + "%20points%20on%20%23orbizoid.%20A%20game%20in%20the%20%23js13kgames%20contest%20by%20%40sorskoot.%20Play%20it%20at%20http://js13kgames.com/entries/";
                    menuStyle.display = "block";
                    hud.style.display = "none";
                }
            }
        }

        for (i = 0; game.powerups[i]; i++) {
            game.powerups[i].r += 0.1;
            if (game.powerups[i].r > PI * 2) game.powerups[i].r = 0;
            if (game.powerups[i].taken == 0)
                game.powerups[i].l--;
            if (game.powerups[i].l <= 0) game.powerups[i].die = 1;
        }
        for (i = game.powerups.length - 1; i >= 0; i--) {
            if (game.powerups[i].die) game.powerups.splice(i, 1);
        }
        for (i = game.powerups.length - 1; i >= 0; i--) {

            if (game.powerups[i].taken) {
                if (game.powerups[i].busy > 0) {
                    game.powerups[i].busy--;
                    //  game.player.powerupDuration = game.powerups[i].busy;
                    // invalidatedHud = 1;
                } else {
                    game.bonus[game.powerups[i].t].done();
                    game.powerups.splice(i, 1);
                    invalidatedHud = 1;
                }
            } else {
                if (distance2D(game.player.x, game.player.y, game.powerups[i].x + 16, game.powerups[i].y + 16) < 40) {
                    playSound(sfx[1]);
                    game.bonus[game.powerups[i].t].start();
                    game.powerups[i].taken = 1;
                    game.powerups[i].x = -100;
                    game.powerups[i].y = -100;
                    if (game.bonus[game.powerups[i].t].duration > 0)
                        game.powerups[i].busy = game.bonus[game.powerups[i].t].duration;
                }
            }
        }


        // move deaths to explosions            
        for (i = game.enemy.length - 1; i >= 0; i--) {
            if (game.enemy[i].die) {
                d = game.explosions.push(game.enemy[i]);
                game.explosions[d - 1].o = 10;
                game.enemy.splice(i, 1);
            }
        }

        for (i = game.planets.length - 1; i >= 0; i--) {
            if (game.planets[i].die) {
                d = game.explosions.push({ x: game.planets[i].rx, y: game.planets[i].ry, t: game.planets[i].c / 72 });
                game.explosions[d - 1].o = 10;
                game.planets.splice(i, 1);
            }
        }
    }


    function draw() {
        ctxCopy.width = ctxCopy.width;


        ctxBuffer.fillStyle = "rgba(155,155,255,.5)";

        for (i = 0; i < numStars; i++) {
            ctxBuffer.beginPath();
            ctxBuffer.arc(game.starfield.stars[i].x2, game.starfield.stars[i].y2, game.starfield.stars[i].s, 0, PI * 2);
            ctxBuffer.fill();
        }
        if (ready) {
            ctxBuffer.globalCompositeOperation = "lighter";
            if (!game.player.die) {
                ctxBuffer.drawImage(game.player.canvas, game.player.x - spriteSize, game.player.y - spriteSize);
            } else {
                var alpha = 1 - game.player.supernova.w / 350;
                ctxBuffer.beginPath();
                ctxBuffer.lineWidth = 40;
                ctxBuffer.strokeStyle = "hsla(212, 100%, 72%," + alpha * .25 + ")";
                ctxBuffer.arc(game.player.x, game.player.y, game.player.supernova.w, 0, PI * 2);
                ctxBuffer.stroke();
                ctxBuffer.beginPath();
                ctxBuffer.lineWidth = 15;
                ctxBuffer.strokeStyle = "hsla(212, 100%, 72%," + alpha * .5 + ")";
                ctxBuffer.arc(game.player.x, game.player.y, game.player.supernova.w, 0, PI * 2);
                ctxBuffer.stroke();
                ctxBuffer.lineWidth = 5;
                ctxBuffer.strokeStyle = "hsla(212, 100%, 72%," + alpha * .75 + ")";
                ctxBuffer.arc(game.player.x, game.player.y, game.player.supernova.w, 0, PI * 2);
                ctxBuffer.stroke();
                ctxBuffer.lineWidth = 1;
                ctxBuffer.strokeStyle = "hsla(212, 100%, 72%," + alpha + ")";
                ctxBuffer.arc(game.player.x, game.player.y, game.player.supernova.w, 0, PI * 2);
                ctxBuffer.stroke();
                ctxBuffer.strokeStyle = "hsla(212, 100%, 72%," + alpha + ")";
                ctxBuffer.moveTo(0, game.player.y);
                ctxBuffer.lineTo(W, game.player.y);
                ctxBuffer.moveTo(game.player.x, 0);
                ctxBuffer.lineTo(game.player.x, H);
                ctxBuffer.stroke();
            }
            len = game.powerups.length;
            for (j = 0; j < len; j++) {
                if (game.powerups[j].taken) continue;
                ctxBuffer.drawImage(game.bonus[game.powerups[j].t].c, game.powerups[j].x - spriteSize, game.powerups[j].y - spriteSize);

                ctxBuffer.beginPath();

                ctxBuffer.lineWidth = 3;

                r = cos(game.powerups[j].r) / 8 + PI * .32;
                ctxBuffer.strokeStyle = "rgba(255,220,0,.5)";


                for (var i = 0; i < 2 * PI; i += .1) {
                    x = game.powerups[j].x + 16 - (8 * sin(i)) * sin(r * PI) + (48 * cos(i)) * cos(r * PI);
                    y = game.powerups[j].y + 16 + (48 * cos(i)) * sin(r * PI) + (8 * sin(i)) * cos(r * PI);
                    if (i == 0) {
                        ctxBuffer.moveTo(x, y);
                    } else {
                        ctxBuffer.lineTo(x, y);
                    }

                }
                ctxBuffer.closePath();
                ctxBuffer.stroke();
            }
            len = game.planets.length;
            for (i = 0; i < game.player.level && i < len; i++) {

                ctxBuffer.drawImage(game.planets[i].canvas, game.planets[i].rx - spriteSize, game.planets[i].ry - spriteSize);

            }
            len = game.enemy.length;
            for (i = 0; i < len; i++) {
                if (!game.enemy[i].die)
                    ctxBuffer.drawImage(game.enemy[i].canvas, game.enemy[i].x - spriteSize, game.enemy[i].y - spriteSize);
            }
            len = game.explosions.length;
            for (i = 0; i < len; i++) {
                var o1 = (10 - game.explosions[i].o), o = (game.explosions[i].o);
                for (a = 3; a >= 1; a--) {
                    ctxBuffer.beginPath();
                    ctxBuffer.strokeStyle = "hsla(" + game.explosions[i].t * 72 + ",50%, 50%," + (o / 10 / a) + ")";
                    ctxBuffer.lineWidth = ((a - 1) * 8) + 1;
                    for (j = 0; j < 18; j++) {
                        ctxBuffer.moveTo(sin(PI / 9.0 * j) * (o1 + 3) * 25 + game.explosions[i].x,
                            cos(PI / 9.0 * j) * (o1 + 3) * 25 + game.explosions[i].y);
                        ctxBuffer.lineTo(sin(PI / 9.0 * j) * (o1) * 25 + game.explosions[i].x,
                            cos(PI / 9.0 * j) * (o1) * 25 + game.explosions[i].y);
                    }
                    ctxBuffer.stroke();
                }
            }
        }

        cvId.width = cvId.width;

        ctx.drawImage(ctxCopy, 0, 0);
    }

    function updateHud() {
        pat = pat || ctxHud.createPattern(pi, "repeat");

        hud.width = hud.width;
        ctxHud.strokeStyle = "rgba(255,220,0,.5)";
        ctxHud.beginPath();
        ctxHud.lineWidth = 1;
        var px = 60, py = 60, s = PI / game.levels[game.player.level - 1].m;
        for (var i = 0; i < game.levels[game.player.level - 1].m * 2; i += 2) {
            ctxHud.moveTo(px + sin(s * i) * 50, py + cos(s * i) * 50);
            ctxHud.lineTo(px + sin(s * i) * 50, py + cos(s * i) * 50);
            ctxHud.lineTo(px + sin(s * (i + 1)) * 50, py + cos(s * (i + 1)) * 50);
            ctxHud.lineTo(px + sin(s * (i + 1)) * 30, py + cos(s * (i + 1)) * 30);
            ctxHud.lineTo(px + sin(s * i) * 30, py + cos(s * i) * 30);
            ctxHud.closePath();
        }
        ctxHud.stroke();

        // ctxHud.beginPath();
        ctxHud.strokeStyle = "#FC0";
        ctxHud.fillStyle = pat; //"rgba(255,220,0,.1)";

        ctxHud.shadowOffsetX = 0;
        ctxHud.shadowOffsetY = 0;
        ctxHud.shadowBlur = 3;
        ctxHud.shadowColor = "rgba(255,220,0,.5)";
        ctxHud.lineWidth = 2;
        ctxHud.beginPath();
        ctxHud.moveTo(0, 120);
        ctxHud.lineTo(100, 120);
        ctxHud.lineTo(150, 34);
        ctxHud.lineTo(W, 34);
        ctxHud.lineTo(W, 0);
        ctxHud.lineTo(0, 0);
        ctxHud.closePath();
        ctxHud.fill();
        ctxHud.stroke();
        ctxHud.beginPath();
        ctxHud.moveTo(0, 590);
        ctxHud.lineTo(W - 120, 590);
        ctxHud.lineTo(W - 100, 575);
        ctxHud.lineTo(W, 575);
        ctxHud.lineTo(W, 600);
        ctxHud.lineTo(0, 600);
        ctxHud.closePath();
        ctxHud.fill();
        ctxHud.stroke();
        ctxHud.moveTo(0, 120);
        ctxHud.lineTo(0, 590);
        ctxHud.moveTo(W, 34);
        ctxHud.lineTo(W, 590);
        ctxHud.stroke();
        ctxHud.fillStyle = "rgba(255,220,0,1)";
        ctxHud.font = "normal 40px Trebuchet MS";
        ctxHud.fillText(game.player.level, 50, 75);
        ctxHud.font = "normal 24px Trebuchet MS";
        ctxHud.fillText("lives |" + game.player.lives, 150, 24);
        ctxHud.fillText("score |" + game.player.score, W2 - 70, 24);
        ctxHud.fillText("hi-score |" + game.player.hiscore, 720, 24);
        ctxHud.fillStyle = "rgba(255,220,0,.61)";
        ctxHud.fillText("orbizoid", W - 100, 595);
        ctxHud.beginPath();
        ctxHud.lineWidth = 2;
        for (i = 0; i < game.player.progress * 2; i += 2) {
            ctxHud.moveTo(px + sin(s * i) * 50, py + cos(s * i) * 50);
            ctxHud.lineTo(px + sin(s * i) * 50, py + cos(s * i) * 50);
            ctxHud.lineTo(px + sin(s * (i + 1)) * 50, py + cos(s * (i + 1)) * 50);
            ctxHud.lineTo(px + sin(s * (i + 1)) * 30, py + cos(s * (i + 1)) * 30);
            ctxHud.lineTo(px + sin(s * i) * 30, py + cos(s * i) * 30);
            ctxHud.closePath();
        }
        ctxHud.fill();
        ctxHud.stroke();

        //var d = 0;
        //for (i = 0; game.powerups[i]; i++) {
        //    if (game.powerups[i].busy > d)
        //        d = game.powerups[i].busy;

        //}

        //ctx.beginPath();
        //ctxHud.moveTo(60, 112);
        //ctxHud.arc(60, 60, 52, 0 + PI / 2, d * (PI / 150) + PI / 2);
        //ctxHud.stroke();
        invalidatedHud = 0;
    }


    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();


    var ready = false;

    function countdown() {
        byId("cd").style.display = "block";
        byId("#3").className += " in";
        playSound(sfx[2]);
        setTimeout(function() {
            byId("#3").className += " ot";
            byId("#2").className += " in";
            playSound(sfx[2]);
            setTimeout(function() {
                byId("#2").className += " ot";
                byId("#1").className += " in";
                playSound(sfx[2]);
                setTimeout(function() {
                    byId("#1").className += " ot";                    
                    setTimeout(function() {
                        byId("cd").style.display = "none";
                        byId("#1").className = byId("#2").className = byId("#3").className = "Cn";
                        ready = true;
                    }, 500);
                }, 1000);
            }, 1000);
        }, 1000);
    }


    var url = window.URL || window.webkitURL;
    var synth = new SfxrSynth();

    function playSound(p) {
        if (!isFF) return;
        try {
            var s = synth.getWave(p),
                player = new Audio();
            player.src = s;
            player.play();
            player.addEventListener('ended', function() {
                url.revokeObjectURL(s);
            }, false);
        } catch(e) {
        }
    }

    sfx = ['3,,0.1094,0.6292,0.3374,0.1949,,0.0785,,,,,,,,,,,1,,,,,0.5', // small explosion
        '1,,0.0202,,0.4455,0.4339,,0.2229,,,,,,,,0.5824,,,1,,,,,0.5', // powerup
        '0,,0.1879,,0.0199,0.6026,0.0378,0.0361,-0.0057,,0.0417,0.0015,,0.1483,-0.0062,0.0134,,-0.0019,1,0.0293,0.0298,0.0375,-0.0627,0.5', // countdown1
        '0,,0.28,,,0.6026,0.0378,0.0361,-0.0057,,0.0417,0.0015,,0.1483,-0.0062,0.0134,,-0.0019,1,0.0293,0.0298,0.0375,-0.0627,0.5', // countdown2
        '3,,0.3382,0.3014,0.72,0.23,,-0.2046,,,,,0.15,,0.1,,-0.02,-0.7,1,0.04,,,0.06,0.5'//supernova
    ];


    function go() {

        init();

        animloop();
    }


    ///!! REMOVE BEFORE RELEASE!!!
    //var stats = new Stats();
    //stats.setMode(1); // 0: fps, 1: ms
    //stats.domElement.style.position = 'absolute';
    //stats.domElement.style.left = '0px';
    //stats.domElement.style.top = '0px';
    //document.body.appendChild(stats.domElement);
    /// END
    var last = new Date();

    function animloop() {
        // stats.begin();
        requestAnimFrame(animloop);
        var now = new Date();
        recalculate();
        var foo = new Date();
        while (1000 / (foo - last) > 25) {
            foo = new Date();
        }

        if (invalidatedHud) updateHud();
        last = now;

        draw();
        // stats.end();
    }

    go();
}, false);