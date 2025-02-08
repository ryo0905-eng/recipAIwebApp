from flask import Flask, render_template, request
import openai
import os

app = Flask(__name__)

# OpenAI APIキーを環境変数から取得
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/recipe', methods=['POST'])
def generate_recipe():
    ingredients = request.form.get('ingredients')
    flavor = request.form.get('flavor')
    servings = request.form.get('servings')
    
    if not ingredients:
        return render_template('index.html', error="食材を入力してください！")
    
    # "普通" の場合はプロンプトに反映しない
    flavor_prompt = f"味付け: {flavor}" if flavor and flavor != "普通" else ""
    
    prompt = f"""
    以下の食材を使ったレシピを作成してください。
    食材: {ingredients}
    {flavor_prompt}
    分量: {servings}人分
    入力された食材の量をそのまま考慮し、適切に分量調整してください。

    出力フォーマット:
    1. レシピ名
    2. 材料リスト（{servings}人分）
    3. 作り方
    """
    
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        recipe_text = response.choices[0].message.content
        
        # 代替品の提案
        substitute_prompt = f"""
        以下のレシピの材料に代替可能な食材があれば提案してください。
        レシピ: {recipe_text}
        出力フォーマット:
        1. 代替可能な材料
        2. 代替品リスト（用途に応じて）
        """
        
        substitute_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": substitute_prompt}]
        )
        substitute_text = substitute_response.choices[0].message.content
        
        return render_template('recipe.html', ingredients=ingredients, recipe=recipe_text, substitutes=substitute_text)
    except Exception as e:
        return render_template('index.html', error=f"エラーが発生しました: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True)
