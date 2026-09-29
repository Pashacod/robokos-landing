(function () {
    var log = document.getElementById("demo-chat-log");
    var inputArea = document.getElementById("demo-chat-input-area");

    var OBJECT_TYPE_LABELS = {
        "уп": "управляющая компания",
        "тсж": "ТСЖ / жилой комплекс",
        "бц": "бизнес-центр",
    };

    var FREQUENCY_MATRIX = {
        "уп": { "эконом": "1 раз в неделю", "стандарт": "1–2 раза в неделю", "интенсив": "3 раза в неделю" },
        "тсж": { "эконом": "1 раз в 2 недели", "стандарт": "1 раз в неделю", "интенсив": "2 раза в неделю" },
        "бц": { "эконом": "1–2 раза в неделю", "стандарт": "2–3 раза в неделю", "интенсив": "ежедневно" },
    };

    var RELIEF_MULTIPLIER = { "ровный": 1, "сложный": 1.3 };
    var AREA_PER_ROBOT = 3000;

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

    function computePlan(state) {
        var baseRobots = Math.max(1, Math.ceil(state.area / AREA_PER_ROBOT));
        var robots = Math.max(1, Math.ceil(baseRobots * RELIEF_MULTIPLIER[state.relief]));
        var frequency = FREQUENCY_MATRIX[state.type][state.level];
        return { robots: robots, frequency: frequency };
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

    log.addEventListener("click", function () {
        if (skipCurrentTyping) {
            skipCurrentTyping();
        }
    });

    async function run() {
        await appendBotMessage("Здравствуйте! Я диспетчер РобоКос 🤖. Помогу прикинуть, сколько роботов нужно вашему объекту.");
        await appendBotMessage("Как называется ваш объект — ЖК, БЦ или УК?");
        var name = await waitForTextAnswer({ type: "text", placeholder: "Например, ЖК «Сосновый бор»" });
        appendUserMessage(name);

        await appendBotMessage("Приятно познакомиться, «" + name + "»! Какая у вас площадь газона, м²?");
        var area = await waitForTextAnswer({ type: "number", placeholder: "Например, 1200" });
        appendUserMessage(area + " м²");

        await appendBotMessage("Какой это тип объекта?");
        var typeChip = await waitForChipAnswer([
            { label: "Управляющая компания", value: "уп" },
            { label: "ТСЖ / жилой комплекс", value: "тсж" },
            { label: "Бизнес-центр", value: "бц" },
        ]);
        appendUserMessage(typeChip.label);

        await appendBotMessage("Какой рельеф участка?");
        var reliefChip = await waitForChipAnswer([
            { label: "Ровный, без препятствий", value: "ровный" },
            { label: "Со склонами и перепадами высот", value: "сложный" },
        ]);
        appendUserMessage(reliefChip.label);

        await appendBotMessage("Какой уровень сервиса хотите?");
        var levelChip = await waitForChipAnswer([
            { label: "Эконом — реже, дешевле", value: "эконом" },
            { label: "Стандарт", value: "стандарт" },
            { label: "Интенсив — чаще, всегда идеальный вид", value: "интенсив" },
        ]);
        appendUserMessage(levelChip.label);

        await appendBotMessage("Есть на участке деревья, клумбы или дорожки?");
        var obstaclesChip = await waitForChipAnswer([
            { label: "Да", value: "yes" },
            { label: "Нет", value: "no" },
        ]);
        appendUserMessage(obstaclesChip.label);

        showTyping();
        await delay(900);
        hideTyping();

        var state = {
            area: area,
            type: typeChip.value,
            relief: reliefChip.value,
            level: levelChip.value,
        };
        var plan = computePlan(state);

        await appendBotMessage(
            "Для «" + name + "» (площадь " + area + " м², " + OBJECT_TYPE_LABELS[state.type] + ") — ориентировочно:"
        );
        await appendBotMessage(
            "Роботов на объекте: " + plan.robots + " " + robotsWord(plan.robots) +
            "\nПериодичность покоса: " + plan.frequency
        );

        if (state.relief === "сложный") {
            await appendBotMessage("Из-за сложного рельефа закладываем модель с усиленной проходимостью — отсюда дополнительный робот в расчёте.");
        }
        if (obstaclesChip.value === "yes") {
            await appendBotMessage("Деревья, клумбы и дорожки потребуют дополнительного картографирования границ при выезде.");
        }

        await appendBotMessage("Это ориентировочная оценка по введённым данным для демонстрации сценария, а не готовое коммерческое предложение — точные цифры считаются на выезде.");

        appendCta();
    }

    run();
})();
