from flask import Flask, render_template, request, Response, jsonify
import openai
import os

app = Flask(__name__)

# OpenAI APIキーを環境変数から取得
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

@app.route('/')
def home():
    return render_template('index.html')

# 🚀 変更: `POST` リクエストで JSON を受け取り、JSON で返す
@app.route('/get_recipe', methods=['POST'])
def generate_recipe():
    data = request.get_json()
    ingredients = data.get("ingredients", "")
    flavor = data.get("flavor", [])
    servings = data.get("servings", "")

    if not ingredients:
        return jsonify({"error": "食材を入力してください！"}), 400
    
    # "普通" を除外
    filtered_flavors = [f for f in flavor if f != "普通"]
    flavor_prompt = f"味付け: {', '.join(filtered_flavors)}" if filtered_flavors else ""

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

        return jsonify({"recipe": recipe_text, "substitutes": substitute_text})
    
    except Exception as e:
        return jsonify({"error": f"エラーが発生しました: {str(e)}"}), 500


@app.route('/privacy')
def privacy():
    return render_template('privacy.html')


from flask import Response

@app.route('/sitemap.xml')
def sitemap():
    xml = """<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://recip-ai.com/</loc><priority>1.0</priority></url>
        <url><loc>https://recip-ai.com/recipe</loc><priority>0.8</priority></url>
        <url><loc>https://recip-ai.com/privacy</loc><priority>0.6</priority></url>
    </urlset>"""
    return Response(xml, mimetype='application/xml')


if __name__ == '__main__':
    app.run(debug=True)
