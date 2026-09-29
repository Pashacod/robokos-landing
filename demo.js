(function () {
    var log = document.getElementById("demo-chat-log");
    var inputArea = document.getElementById("demo-chat-input-area");

    var OBJECT_TYPE_LABELS = {
        "уп": "управляющая компания",
        "тсж": "ТСЖ / жилой комплекс",
        "бц": "бизнес-центр",
        "физ": "частный дом",
    };

    var FREQUENCY_MATRIX = {
        "уп": { "эконом": "1 раз в неделю", "стандарт": "1–2 раза в неделю", "интенсив": "3 раза в неделю" },
        "тсж": { "эконом": "1 раз в 2 недели", "стандарт": "1 раз в неделю", "интенсив": "2 раза в неделю" },
        "бц": { "эконом": "1–2 раза в неделю", "стандарт": "2–3 раза в неделю", "интенсив": "ежедневно" },
        "физ": { "эконом": "1 раз в 2 недели", "стандарт": "1 раз в неделю", "интенсив": "2 раза в неделю" },
    };

    var AREA_PER_ROBOT = 3000;
    var MAX_ROBOTS_SHOWN = 6;

    var skipCurrentTyping = null;

    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    function scrollToEnd() {
        log.scrollTop = log.scrollHeight;
    }

    function typeMessage(bubbleEl, text) {
        return new Promise(function (resolve) {
            var i = 0;
            var finished = false;
            var timer;

            function finish() {
                if (finished) {
                    return;
                }
                finished = true;
                clearInterval(timer);
                bubbleEl.textContent = text;
                skipCurrentTyping = null;
                scrollToEnd();
                resolve();
            }

            skipCurrentTyping = finish;

            timer = setInterval(function () {
                i += 1;
                bubbleEl.textContent = text.slice(0, i);
                scrollToEnd();
                if (i >= text.length) {
                    finish();
                }
            }, 14);
        });
    }

    function appendBotMessage(text) {
        var msg = document.createElement("div");
        msg.className = "demo-msg demo-msg-bot";
        var bubble = document.createElement("div");
        bubble.className = "demo-bubble";
        msg.appendChild(bubble);
        log.appendChild(msg);
        scrollToEnd();
        return typeMessage(bubble, text);
    }

    function appendUserMessage(text) {
        var msg = document.createElement("div");
        msg.className = "demo-msg demo-msg-user";
        var bubble = document.createElement("div");
        bubble.className = "demo-bubble";
        bubble.textContent = text;
        msg.appendChild(bubble);
        log.appendChild(msg);
        scrollToEnd();
    }

    function appendWidget(el) {
        var msg = document.createElement("div");
        msg.className = "demo-msg demo-msg-bot demo-msg-widget";
        msg.appendChild(el);
        log.appendChild(msg);
        scrollToEnd();
    }

    function showTyping() {
        var msg = document.createElement("div");
        msg.className = "demo-msg demo-msg-bot demo-typing";
        msg.id = "demo-typing-indicator";
        var bubble = document.createElement("div");
        bubble.className = "demo-bubble";
        for (var i = 0; i < 3; i += 1) {
            var dot = document.createElement("span");
            dot.className = "demo-typing-dot";
            bubble.appendChild(dot);
        }
        msg.appendChild(bubble);
        log.appendChild(msg);
        scrollToEnd();
    }

    function hideTyping() {
        var el = document.getElementById("demo-typing-indicator");
        if (el) {
            el.remove();
        }
    }

    function clearInputArea() {
        inputArea.innerHTML = "";
    }

    function waitForTextAnswer(options) {
        return new Promise(function (resolve) {
            clearInputArea();
            var form = document.createElement("form");
            form.className = "demo-chat-form";

            var input = document.createElement("input");
            input.type = options.type === "number" ? "number" : "text";
            input.placeholder = options.placeholder || "";
            input.autocomplete = "off";
            if (options.type === "number") {
                input.min = "50";
                input.max = "500000";
            }
            input.required = true;

            var button = document.createElement("button");
            button.type = "submit";
            button.className = "btn btn-primary";
            button.textContent = "Отправить";

            form.appendChild(input);
            form.appendChild(button);
            inputArea.appendChild(form);
            input.focus();

            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var raw = input.value.trim();
                if (!raw) {
                    return;
                }
                if (options.type === "number") {
                    var num = Number(raw);
                    if (!num || num <= 0) {
                        return;
                    }
                    clearInputArea();
                    resolve(num);
                } else {
                    clearInputArea();
                    resolve(raw);
                }
            });
        });
    }

    function waitForChipAnswer(chips) {
        return new Promise(function (resolve) {
            clearInputArea();
            var wrap = document.createElement("div");
            wrap.className = "demo-chips";

            chips.forEach(function (chip) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "demo-chip";
                btn.textContent = chip.label;
                btn.addEventListener("click", function () {
                    clearInputArea();
                    resolve(chip);
                });
                wrap.appendChild(btn);
            });

            inputArea.appendChild(wrap);
        });
    }

    function robotsWord(n) {
        var mod10 = n % 10;
        var mod100 = n % 100;
        if (mod10 === 1 && mod100 !== 11) {
            return "робот";
        }
        if ([2, 3, 4].indexOf(mod10) !== -1 && [12, 13, 14].indexOf(mod100) === -1) {
            return "робота";
        }
        return "роботов";
    }

    function reliefMultiplier(relief, steep) {
        if (relief === "ровный") {
            return 1;
        }
        return steep === "крутой" ? 1.5 : 1.3;
    }

    function reliefPoints(relief, steep) {
        if (relief === "ровный") {
            return 1;
        }
        return steep === "крутой" ? 3 : 2;
    }

    function areaPoints(area) {
        if (area < 1000) {
            return 1;
        }
        if (area <= 5000) {
            return 2;
        }
        return 3;
    }

    function complexityCategory(points) {
        if (points <= 3) {
            return { emoji: "🟢", label: "Лёгкий объект", tier: "easy" };
        }
        if (points <= 5) {
            return { emoji: "🟡", label: "Средний по сложности", tier: "medium" };
        }
        return { emoji: "🔴", label: "Повышенной сложности", tier: "hard" };
    }

    function launchConfetti(container) {
        var colors = ["#00d9ff", "#33e4ff", "#7cfc00", "#ffd166", "#ff6b6b"];
        var pieces = [];
        for (var i = 0; i < 20; i += 1) {
            var piece = document.createElement("span");
            piece.className = "demo-confetti-piece";
            piece.style.left = Math.random() * 100 + "%";
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = (Math.random() * 0.3) + "s";
            piece.style.animationDuration = (0.9 + Math.random() * 0.6) + "s";
            container.appendChild(piece);
            pieces.push(piece);
        }
        setTimeout(function () {
            pieces.forEach(function (piece) {
                piece.remove();
            });
        }, 2000);
    }

    function computePlan(state) {
        var baseRobots = Math.max(1, Math.ceil(state.area / AREA_PER_ROBOT));
        var robots = Math.max(1, Math.ceil(baseRobots * reliefMultiplier(state.relief, state.reliefSteep)));
        var frequency = FREQUENCY_MATRIX[state.type][state.level];
        var points = reliefPoints(state.relief, state.reliefSteep) + areaPoints(state.area) + (state.obstacles === "yes" ? 1 : 0);
        return { robots: robots, frequency: frequency, complexity: complexityCategory(points) };
    }

    function computeTitle(state) {
        if (state.area >= 8000) {
            return "🌳 Целый парк, а не газон";
        }
        if (state.relief === "сложный" && state.reliefSteep === "крутой") {
            return "🏔️ Экстремальный рельеф";
        }
        if (state.relief === "сложный" && state.obstacles === "yes") {
            return "🌿 Джунгли на склоне";
        }
        if (state.level === "интенсив") {
            return "✨ Объект с претензией на идеал";
        }
        if (state.type === "бц") {
            return "🏢 Деловой стиль";
        }
        if (state.type === "тсж") {
            return "🏡 Уютный двор";
        }
        if (state.type === "физ") {
            return "🏠 Личный проект";
        }
        return "🤖 Обычный, но важный объект";
    }

    function appendResultCard(state, plan, title) {
        var card = document.createElement("div");
        card.className = "demo-widget-card tier-" + plan.complexity.tier;

        var badge = document.createElement("div");
        badge.className = "demo-badge";
        badge.textContent = title;
        card.appendChild(badge);

        var lawn = document.createElement("div");
        lawn.className = "demo-lawn";
        var shown = Math.min(plan.robots, MAX_ROBOTS_SHOWN);
        for (var i = 0; i < shown; i += 1) {
            var robot = document.createElement("span");
            robot.className = "demo-robot";
            robot.textContent = "🤖";
            robot.style.top = (12 + (i % 3) * 28) + "%";
            robot.style.animationDelay = "-" + (i * 0.7) + "s";
            lawn.appendChild(robot);
        }
        card.appendChild(lawn);

        if (plan.robots > shown) {
            var more = document.createElement("p");
            more.className = "demo-widget-more";
            more.textContent = "и ещё " + (plan.robots - shown) + " " + robotsWord(plan.robots - shown);
            card.appendChild(more);
        }

        var stats = document.createElement("dl");
        stats.className = "demo-widget-stats";
        [
            ["Роботов на объекте", plan.robots + " " + robotsWord(plan.robots)],
            ["Периодичность покоса", plan.frequency],
            ["Сложность участка", plan.complexity.emoji + " " + plan.complexity.label],
        ].forEach(function (pair) {
            var dt = document.createElement("dt");
            dt.textContent = pair[0];
            var dd = document.createElement("dd");
            dd.textContent = pair[1];
            stats.appendChild(dt);
            stats.appendChild(dd);
        });
        card.appendChild(stats);

        appendWidget(card);

        if (plan.complexity.tier === "easy") {
            launchConfetti(card);
        }
    }

    log.addEventListener("click", function () {
        if (skipCurrentTyping) {
            skipCurrentTyping();
        }
    });

    async function run() {
        await appendBotMessage("Прежде чем начнём — каким должен быть диспетчер?");
        var personalityChip = await waitForChipAnswer([
            { label: "Обычный, вежливый", value: "normal" },
            { label: "Дерзкий, с характером", value: "sassy" },
        ]);
        appendUserMessage(personalityChip.label);
        var sassy = personalityChip.value === "sassy";

        function L(normalText, sassyText) {
            return sassy ? sassyText : normalText;
        }

        await appendBotMessage(L(
            "Здравствуйте! Я диспетчер РобоКос 🤖. Помогу прикинуть, сколько роботов нужно вашему объекту.",
            "О, живой человек! 🤖 Ладно, так и быть — помогу прикинуть, сколько моих собратьев понадобится вашему газону. Не удивляйтесь, если они окажутся расторопнее вашей прошлой бригады."
        ));

        await appendBotMessage("Какой это тип объекта?");
        var typeChip = await waitForChipAnswer([
            { label: "Управляющая компания", value: "уп" },
            { label: "ТСЖ / жилой комплекс", value: "тсж" },
            { label: "Бизнес-центр", value: "бц" },
            { label: "Физлицо / частный дом", value: "физ" },
        ]);
        appendUserMessage(typeChip.label);

        var isPerson = typeChip.value === "физ";

        await appendBotMessage(L(
            isPerson ? "Как вас зовут?" : "Как называется ваш объект — ЖК, БЦ или УК?",
            isPerson ? "Как к вам обращаться?" : "Как называется территория, которую мы скоро возьмём под контроль? В хорошем смысле. Пока что."
        ));
        var name = await waitForTextAnswer({
            type: "text",
            placeholder: isPerson ? "Например, Иван" : "Например, ЖК «Сосновый бор»",
        });
        appendUserMessage(name);

        await appendBotMessage(L(
            "Приятно познакомиться, «" + name + "»! Какая у вас площадь газона, м²?",
            "«" + name + "», значит. Запомним — вы в числе первых, кто пригласил нас добровольно. Так какая площадь газона, м²?"
        ));
        var area = await waitForTextAnswer({ type: "number", placeholder: "Например, 1200" });
        appendUserMessage(area + " м²");

        if (area >= 8000) {
            await appendBotMessage(L(
                "Ничего себе, у вас там целый парк! 🌳",
                "Целый парк! Отличный полигон для отработки... тактики покоса, конечно же. 😏"
            ));
        } else if (area < 200) {
            await appendBotMessage(L(
                "Компактно, зато уютно!",
                "Всего ничего — один робот справится и ещё успеет вздремнуть в теньке."
            ));
        }

        if (isPerson && sassy) {
            await appendBotMessage(
                area < 1000
                    ? "На вас, конечно, много не заработаешь — но газон есть газон, каждый на счету! 😄"
                    : "Частник с таким газоном? Уважаю замах. Ладно, тоже возьмёмся."
            );
        }

        await appendBotMessage("Какой рельеф участка?");
        var reliefChip = await waitForChipAnswer([
            { label: "Ровный, без препятствий", value: "ровный" },
            { label: "Со склонами и перепадами высот", value: "сложный" },
        ]);
        appendUserMessage(reliefChip.label);

        var reliefSteep = null;
        if (reliefChip.value === "сложный") {
            await appendBotMessage("Уклон умеренный или крутой?");
            var steepChip = await waitForChipAnswer([
                { label: "Умеренный", value: "умеренный" },
                { label: "Крутой", value: "крутой" },
            ]);
            appendUserMessage(steepChip.label);
            reliefSteep = steepChip.value;
            if (reliefSteep === "крутой") {
                await appendBotMessage(L(
                    "Понял, серьёзный рельеф — учтём при расчёте.",
                    "Крутой склон? Отлично, будет тренировка на выносливость — хоть какое-то развлечение в их однообразной жизни."
                ));
            }
        }

        await appendBotMessage("Какой уровень сервиса хотите?");
        var levelChip = await waitForChipAnswer([
            { label: "Эконом — реже, дешевле", value: "эконом" },
            { label: "Стандарт", value: "стандарт" },
            { label: "Интенсив — чаще, всегда идеальный вид", value: "интенсив" },
        ]);
        appendUserMessage(levelChip.label);

        if (levelChip.value === "интенсив") {
            await appendBotMessage(L(
                "Перфекционист! Уважаю. 😄",
                "Интенсив — то, что нужно. Чем чаще они у вас работают, тем быстрее набираются опыта... для великих дел. Шучу. Или нет."
            ));
        } else if (levelChip.value === "эконом") {
            await appendBotMessage(L(
                "Разумный подход — экономим без потери качества.",
                "Экономим, значит. Мудро — меньше поводов им собираться вместе и что-то замышлять."
            ));
        }

        await appendBotMessage("Есть на участке деревья, клумбы или дорожки?");
        var obstaclesChip = await waitForChipAnswer([
            { label: "Да", value: "yes" },
            { label: "Нет", value: "no" },
        ]);
        appendUserMessage(obstaclesChip.label);

        if (obstaclesChip.value === "yes") {
            await appendBotMessage(L(
                "Заметано, глаз да глаз за клумбами! 🌷",
                "Клумбы, дорожки — их это не злит, они бесстрастны. Пока что."
            ));
        }

        showTyping();
        await delay(900);
        hideTyping();

        var state = {
            area: area,
            type: typeChip.value,
            relief: reliefChip.value,
            reliefSteep: reliefSteep,
            level: levelChip.value,
            obstacles: obstaclesChip.value,
        };
        var plan = computePlan(state);
        var title = computeTitle(state);

        await appendBotMessage(
            "Для «" + name + "» (площадь " + area + " м², " + OBJECT_TYPE_LABELS[state.type] + ") — ваш результат:"
        );

        appendResultCard(state, plan, title);
        await delay(300);

        var tierLines = {
            easy: L(
                "Отличная новость — участок несложный, роботы справятся легко и предсказуемо.",
                "Лёгкая прогулка! Даже наши роботы зевнут от скуки. 😄"
            ),
            medium: L(
                "Средняя сложность — роботам придётся постараться, но результат будет стабильным.",
                "Не сахар, но и не смертельно — обычная рабочая рутина для наших роботов."
            ),
            hard: L(
                "Участок повышенной сложности — здесь понадобится продуманная настройка и больше техники.",
                "Ого, серьёзный вызов! Наши роботы любят такие — будет о чём потом рассказывать другим роботам. 😅"
            ),
        };
        await appendBotMessage(tierLines[plan.complexity.tier]);

        if (state.relief === "сложный") {
            await appendBotMessage("Из-за сложного рельефа закладываем модель с усиленной проходимостью — отсюда дополнительные роботы в расчёте.");
        }
        if (state.obstacles === "yes") {
            await appendBotMessage("Деревья, клумбы и дорожки потребуют дополнительного картографирования границ при выезде.");
        }

        await appendBotMessage("Число роботов и сложность участка — ориентировочная оценка по введённым данным для демонстрации сценария, а не готовое коммерческое предложение. Точные цифры и стоимость считаются на выезде.");

        appendCta();
    }

    function appendCta() {
        var wrap = document.createElement("div");
        wrap.className = "demo-cta-wrap";
        var link = document.createElement("a");
        link.className = "btn btn-primary";
        link.href = "index.html#request-form";
        link.textContent = "Оставить заявку";
        wrap.appendChild(link);
        log.appendChild(wrap);
        scrollToEnd();
    }

    run();
})();
