document.addEventListener("DOMContentLoaded", function () {
    async function fetchRecipe() {
        let ingredients = document.getElementById("ingredients").value.trim();
        let flavor = Array.from(document.querySelectorAll("input[type='checkbox']:checked")).map(el => el.value);
        let servings = document.getElementById("servings").value;
        let cooking_time = document.querySelector("input[name='cooking_time']:checked").value;  // ✅ トグルで選択した調理時間を取得！
       if (!ingredients) {
            alert("食材を入力してください！");
            return;
        }

        document.getElementById("loading").style.display = "block";
        document.getElementById("recipe-result").innerHTML = "<h2>レシピ</h2><p></p>";
        document.getElementById("substitutes-result").innerHTML = "";
        document.getElementById("suggest-substitutes").style.display = "none";

        try {
            let response = await fetch("/get_recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ingredients, flavor, servings, cooking_time })
            });

            if (!response.body) {
                throw new Error("ストリーミングデータがありません");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultContainer = document.querySelector("#recipe-result p");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                resultContainer.innerText += decoder.decode(value, { stream: true });
            }

            document.getElementById("loading").style.display = "none";
            document.getElementById("suggest-substitutes").style.display = "block";

        } catch (error) {
            document.getElementById("loading").style.display = "none";
            alert("レシピを取得できませんでした: " + error.message);
        }
    }

    async function fetchSubstitutes() {
        let recipeText = document.querySelector("#recipe-result p").innerText.trim();

        if (!recipeText) {
            alert("先にレシピを生成してください！");
            return;
        }

        document.getElementById("substitutes-result").innerHTML = "<h2>代替品</h2><p></p>";
        document.getElementById("suggest-substitutes").disabled = true;

        try {
            let response = await fetch("/get_substitutes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipe: recipeText })
            });

            if (!response.body) {
                throw new Error("ストリーミングデータがありません");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultContainer = document.querySelector("#substitutes-result p");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                resultContainer.innerText += decoder.decode(value, { stream: true });
            }

        } catch (error) {
            alert("代替品を取得できませんでした: " + error.message);
        } finally {
            document.getElementById("suggest-substitutes").disabled = false;
        }
    }

    function changeServings(amount) {
        let input = document.getElementById("servings");
        let value = parseInt(input.value, 10);
        value += amount;
        if (value < 1) value = 1;
        if (value > 10) value = 10;
        input.value = value;
    }

    function toggleDropdown() {
        let dropdown = document.getElementById("dropdown");
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    }

    document.querySelectorAll(".dropdown-content input").forEach(input => {
        input.addEventListener("change", function () {
            let selectedValues = [];
            document.querySelectorAll(".dropdown-content input:checked").forEach(checked => {
                selectedValues.push(checked.value);
            });

            document.getElementById("selected-values").textContent = selectedValues.length > 0
                ? selectedValues.join(", ")
                : "選択してください";
            document.getElementById("flavor-input").value = selectedValues.join(",");
        });
    });

    document.addEventListener("click", function (event) {
        let multiselect = document.querySelector(".multiselect");
        let dropdown = document.getElementById("dropdown");

        if (!multiselect.contains(event.target)) {
            dropdown.style.display = "none";
        }
    });

    // グローバル関数として登録
    window.fetchRecipe = fetchRecipe;
    window.fetchSubstitutes = fetchSubstitutes;
    window.changeServings = changeServings;
    window.toggleDropdown = toggleDropdown;
});
