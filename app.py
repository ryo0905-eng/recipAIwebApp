from flask import Flask, render_template, request, Response, jsonify
import openai
import os

app = Flask(__name__)

# OpenAI APIキーを環境変数から取得
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

@app.route('/')
def home():
    return render_template('index.html')

# 🚀 レシピ生成をストリーミング対応
@app.route('/get_recipe', methods=['POST'])
def generate_recipe():
    data = request.get_json()
    ingredients = data.get("ingredients", "")
    flavor = data.get("flavor", [])
    servings = data.get("servings", "")
    cooking_time = data.get("cooking_time", "")
    time_prompt = "一般的な調理時間で作るレシピです。"  # デフォルト値を設定
    if cooking_time == "時短":
        time_prompt = "15分以内で作れる簡単なレシピにしてください。"
    elif cooking_time == "じっくり":
        time_prompt = "60分以上かけて作る、じっくり煮込むレシピにしてください。"
    cooking_tools = data.get("cooking_tools", [])
    tools_prompt = ""
    if cooking_tools:
        tools_prompt = f"以下の調理器具のみを使用してください: {', '.join(cooking_tools)}"
    allergy_list = data.get("allergy_list", [])
    allergy_prompt = ""
    if allergy_list:
        allergy_prompt = f"以下の食材を使用しないでください: {', '.join(allergy_list)}"
  
    if not ingredients:
        return jsonify({"error": "食材を入力してください！"}), 400
    calorie_option = data.get("calorie_option", "標準")  # ✅ カロリー調整オプション
    # カロリー調整のプロンプト
    calorie_prompt = ""
    if calorie_option == "ヘルシー":
        calorie_prompt = "低カロリーなレシピにしてください。油を控えめにし、野菜を多めにしてください。"
    elif calorie_option == "高タンパク":
        calorie_prompt = "高タンパクなレシピにしてください。鶏胸肉、豆腐、卵、魚などを多く含めてください。"
    elif calorie_option == "糖質オフ":
        calorie_prompt = "低糖質なレシピにしてください。白米や砂糖を使わず、代替食材を活用してください。"

    filtered_flavors = [f for f in flavor]
    flavor_prompt = f"味付け: {', '.join(filtered_flavors)}" if filtered_flavors else ""

    prompt = f"""
    以下の食材を使ったレシピを作成してください。
    アレルギー: {allergy_prompt}
    食材: {ingredients}
    味付け: {flavor_prompt}
    調理器具: {tools_prompt}
    分量: {servings}人分
    調理時間： {time_prompt}
    カロリー調整: {calorie_prompt}
    
    出力フォーマット:
    1. レシピ名
    2. 予想調理時間
    3. 材料リスト（{servings}人分）
    4. 作り方
    5. 栄養情報（カロリー、タンパク質、脂質、炭水化物の値を示す）
    """
    print(prompt)
    def generate():
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                stream=True  # ストリーミング対応
            )

            # ストリーミングされたレスポンスを1文字ずつ送信
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content  # 一文字ずつ送る
            
        except Exception as e:
            yield f"エラーが発生しました: {str(e)}"

    return Response(generate(), content_type='text/plain; charset=utf-8')


@app.route('/get_substitutes', methods=['POST'])
def generate_substitutes():
    data = request.get_json()
    recipe_text = data.get("recipe", "")

    if not recipe_text:
        return jsonify({"error": "レシピがありません！"}), 400

    substitute_prompt = f"""
    以下のレシピの材料に代替可能な食材があれば提案してください。
    レシピ: {recipe_text}
    出力フォーマット:
    1. 代替可能な材料
    2. 代替品リスト（用途に応じて）
    """

    def generate():
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": substitute_prompt}],
                stream=True  # ストリーミング対応
            )

            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content  # 一文字ずつ送る

        except Exception as e:
            yield f"エラーが発生しました: {str(e)}"

    return Response(generate(), content_type='text/plain; charset=utf-8')


@app.route('/privacy')
def privacy():
    return render_template('privacy.html')


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
