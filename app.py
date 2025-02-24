from flask import Flask, render_template, request, Response, jsonify
import openai
import os

app = Flask(__name__)

# OpenAI APIキー
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

@app.route('/')
def home():
    return render_template('index.html')

# 🚀 レシピ生成（会話履歴を保持）
@app.route('/get_recipe', methods=['POST'])
def generate_recipe():
    data = request.get_json()
    ingredients = data.get("ingredients", "")
    servings = data.get("servings", "2")
    modification = data.get("modification", "")

    if not ingredients:
        return jsonify({"error": "食材を入力してください！"}), 400

    prompt = f"""
    以下の食材を使ったレシピを作成してください。
    食材: {ingredients}
    分量: {servings}人分
    {modification}

    出力フォーマット:
    1. レシピ名
    2. 予想調理時間
    3. 材料リスト（{servings}人分）
    4. 作り方
    """
    print(prompt)
    def generate():
        try:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                stream=True
            )

            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content 

        except Exception as e:
            yield f"エラー: {str(e)}"

    return Response(generate(), content_type='text/plain; charset=utf-8')

if __name__ == '__main__':
    app.run(debug=True)
