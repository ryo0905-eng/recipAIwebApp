document.addEventListener("DOMContentLoaded", function () {
    let lastRecipeRequest = ""; // 🔹 直前のリクエスト内容を保存
    let conversationHistory = []; // 会話履歴を保存する配列

    function getElementByIdSafe(id) {
        let element = document.getElementById(id);
        if (!element) {
            console.error(`❌ エラー: #${id} が見つかりません！`);
        }
        return element;
    }

    let searchButton = getElementByIdSafe("search-recipe");
    if (searchButton) {
        searchButton.addEventListener("click", function() {
            let ingredients = document.getElementById("user-input").value.trim(); // ユーザー入力を取得
            fetchRecipe(ingredients); // 正しい引数を渡す
        });
    }

    let userInputField = getElementByIdSafe("user-input");
    if (userInputField) {
        userInputField.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                fetchRecipe();
            }
        });
    }

    // ✅ レシピ検索
    async function fetchRecipe(ingredients) {
        if (!ingredients) {
            ingredients = document.getElementById("user-input").value.trim(); // 引数がない場合はテキストボックスから取得
        }

        let servingsElement = document.getElementById("servings");
        let servings = servingsElement ? servingsElement.textContent : "2";

        if (!ingredients) {
            alert("食材を入力してください！");
            return; // 処理を中断
        }

        addMessage(`👤 ${ingredients} のレシピを探しています…`, "user");
        lastRecipeRequest = JSON.stringify({ ingredients, servings });

        try {
            let response = await fetch("/get_recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: lastRecipeRequest
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let responseText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                responseText += decoder.decode(value, { stream: true });
            }

            // 一文字ずつ表示する
            displayTextOneByOne(responseText, "bot");
        } catch (error) {
            alert("レシピを取得できませんでした: " + error.message);
        }

        document.getElementById("user-input").value = ""; // 入力欄をリセット
    }

    // 一文字ずつ表示する関数
    function displayTextOneByOne(text, sender) {
        let chatBox = document.getElementById("chat-box");
        let messageElement = document.createElement("div");
        messageElement.className = `chat-message ${sender}`;
        chatBox.appendChild(messageElement); // メッセージ要素を先に追加

        let index = 0;

        function displayNextCharacter() {
            if (index < text.length) {
                messageElement.innerHTML += text[index]; // 一文字ずつ追加
                chatBox.scrollTop = chatBox.scrollHeight; // スクロールを下に移動
                index++;
                setTimeout(displayNextCharacter, 5); // 5ミリ秒ごとに次の文字を表示
            }
        }

        displayNextCharacter(); // 最初の呼び出し
    }

    // ✅ 変更リクエスト（例：「もっとスパイシーに！」）
    async function modifyRecipe(change) {
        if (!lastRecipeRequest) {
            alert("まずはレシピを検索してください！");
            return;
        }

        addMessage(`👤 ${change}`, "user");

        let previousRequest = JSON.parse(lastRecipeRequest);
        previousRequest.modification = change;

        // 過去の会話を表示
        let historyText = conversationHistory.map(entry => `${entry.sender}: ${entry.text}`).join("\n");
        addMessage(`過去の会話:\n${historyText}`, "bot");

        try {
            let response = await fetch("/get_recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(previousRequest)
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let responseText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                responseText += decoder.decode(value, { stream: true });
            }

            // 一文字ずつ表示する
            displayTextOneByOne(responseText, "bot");
            lastRecipeRequest = JSON.stringify(previousRequest);
        } catch (error) {
            alert("レシピを変更できませんでした: " + error.message);
        }
    }

    // ✅ モーダルを開く
    function openModifyModal() {
        let modal = getElementByIdSafe("modify-modal");
        if (modal) {
            modal.style.display = "block";
            updateModifyOptions();
        }
    }

    function closeModifyModal() {
        let modal = getElementByIdSafe("modify-modal");
        if (modal) {
            modal.style.display = "none";
        }
    }

    function updateModifyOptions() {
        let category = getElementByIdSafe("modify-category");
        let modifyOptions = getElementByIdSafe("modify-options");
        if (!category || !modifyOptions) return;

        modifyOptions.innerHTML = "";
        let options = {
            "taste": ["スパイシーに", "甘めに", "こってり", "さっぱり"],
            "health": ["低カロリー", "高タンパク", "糖質オフ"],
            "cooking": ["フライパンのみ", "オーブンなし", "電子レンジだけ"],
            "style": ["和風", "洋風", "中華風", "エスニック"]
        };

        options[category.value].forEach(option => {
            let button = document.createElement("button");
            button.innerText = option;
            button.onclick = function () {
                let customModification = getElementByIdSafe("custom-modification");
                if (customModification) {
                    customModification.value = option;
                }
            };
            modifyOptions.appendChild(button);
        });
    }

    function changeServings(amount) {
        let servingsElement = document.getElementById("servings");
        let currentServings = parseInt(servingsElement.textContent, 10);
        currentServings += amount;

        // 最小値と最大値の制限
        if (currentServings < 1) currentServings = 1;
        if (currentServings > 10) currentServings = 10;

        servingsElement.textContent = currentServings; // 更新
    }

    function addMessage(text, sender) {
        let chatBox = document.getElementById("chat-box");
        if (!chatBox) return;

        let messageElement = document.createElement("div");
        messageElement.className = `chat-message ${sender}`;
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);

        // 会話履歴に追加
        conversationHistory.push({ sender, text });

        // スクロールを下に移動
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function applyModification() {
        let customModification = getElementByIdSafe("custom-modification");
        if (!lastRecipeRequest || !customModification) {
            alert("まずはレシピを検索してください！");
            return;
        }

        let change = customModification.value.trim();
        if (!change) {
            alert("変更内容を入力してください！");
            return;
        }

        addMessage(`👤 ${change}`, "user");

        let previousRequest = JSON.parse(lastRecipeRequest);
        previousRequest.modification = change;

        fetch("/get_recipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(previousRequest)
        })
        .then(response => response.text())
        .then(text => {
            addMessage(`🤖 ${text}`, "bot");
            lastRecipeRequest = JSON.stringify(previousRequest);
        })
        .catch(error => alert("レシピを変更できませんでした: " + error.message));
    }

    // グローバルスコープに登録
    window.modifyRecipe = modifyRecipe;
    window.changeServings = changeServings;
    window.addMessage = addMessage; // グローバルスコープに登録
    window.applyModification = applyModification;
    window.updateModifyOptions = updateModifyOptions; // グローバルスコープに登録
});
