document.addEventListener("DOMContentLoaded", function () {
    async function fetchRecipe() {
        let ingredients = document.getElementById("ingredients").value.trim();
        let flavor_option = document.querySelector("input[name='flavor_option']:checked").value;  // ✅ 味付けを取得！
        let servings = document.getElementById("servings").value;
        let cooking_time = document.querySelector("input[name='cooking_time']:checked").value;  // ✅ トグルで選択した調理時間を取得！
        let calorie_option = document.querySelector("input[name='calorie_option']:checked").value;  // ✅ カロリー調整を取得！
        let cooking_tools = Array.from(document.querySelectorAll("input[name='cooking_tools']:checked")).map(el => el.value);
        let allergy_list = Array.from(document.querySelectorAll("input[name='allergy']:checked")).map(el => el.value);

 
        if (!ingredients) {
            alert("食材を入力してください！");
            return;
        }


        document.getElementById("recipe-result").innerHTML = "<h2>レシピ</h2><p></p>";
        document.getElementById("substitutes-result").innerHTML = "";
        document.getElementById("suggest-substitutes").style.display = "none";

        try {
            let response = await fetch("/get_recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ingredients, flavor_option, servings, cooking_time, calorie_option, cooking_tools, allergy_list })
            });

            if (!response.body) {
                throw new Error("ストリーミングデータがありません");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultContainer = document.querySelector("#recipe-result p");
            let fullRecipe = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                resultContainer.innerText += decoder.decode(value, { stream: true });

            }
            document.getElementById("recipe-result").setAttribute("data-full-recipe", resultContainer.innerText); // ✅ レシピを属性に格納
            document.getElementById("suggest-substitutes").style.display = "block";

        } catch (error) {
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

    // ✅ お気に入りレシピの保存・削除機能
    function saveRecipe() {
        let recipeText = document.getElementById("recipe-result").getAttribute("data-full-recipe") || "";
        if (!recipeText.trim()) {
            alert("保存するレシピがありません！");
            return;
        }

        let recipeLines = recipeText.split("\n");
        let recipeName = recipeLines.length > 0 ? recipeLines[1] : "レシピ";

        let savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
        let recipeData = { name: recipeName, text: recipeText };

        if (!savedRecipes.some(r => r.name === recipeName)) {
            savedRecipes.push(recipeData);
            localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
        } else {
            alert("このレシピはすでに保存されています！");
        }

        displaySavedRecipes();
    }

    function displaySavedRecipes() {
        let savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
        let savedList = document.getElementById("saved-recipes");
        savedList.innerHTML = "";

        savedRecipes.forEach((recipe, index) => {
            let li = document.createElement("li");
            li.textContent = recipe.name;
            li.style.cursor = "pointer";
            li.onclick = function () {
                displayRecipeDetail(index);
            };

            let deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑 削除";
            deleteBtn.onclick = function (event) {
                event.stopPropagation();
                removeRecipe(index);
            };

            li.appendChild(deleteBtn);
            savedList.appendChild(li);
        });
    }

    function displayRecipeDetail(index) {
        let savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
        if (savedRecipes[index]) {
            document.getElementById("selected-recipe-text").innerText = savedRecipes[index].text;
            document.getElementById("selected-recipe").style.display = "block"; // ✅ 詳細を表示
        } else {
            document.getElementById("selected-recipe").style.display = "none"; // ✅ レシピがない場合は非表示
        }
    }

    function removeRecipe(index) {
        let savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
        savedRecipes.splice(index, 1);
        localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
        displaySavedRecipes();
    }



    // グローバル関数として登録
    window.fetchRecipe = fetchRecipe;
    window.fetchSubstitutes = fetchSubstitutes;
    window.changeServings = changeServings;
    window.toggleDropdown = toggleDropdown;
    window.saveRecipe = saveRecipe;

    displaySavedRecipes();

});
