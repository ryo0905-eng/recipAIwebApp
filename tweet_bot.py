import tweepy
import os
import random
import openai
import datetime
from dotenv import load_dotenv

# 環境変数をロード
load_dotenv()

# OpenAI APIキーを環境変数から取得
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# X APIキーを環境変数から取得
X_API_KEY = os.getenv("X_API_KEY")
X_API_SECRET = os.getenv("X_API_SECRET")
X_ACCESS_TOKEN = os.getenv("X_ACCESS_TOKEN")
X_ACCESS_TOKEN_SECRET = os.getenv("X_ACCESS_TOKEN_SECRET")
X_BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")

# Tweepy v2 Client のセットアップ
x_client = tweepy.Client(
    bearer_token=X_BEARER_TOKEN,
    consumer_key=X_API_KEY,
    consumer_secret=X_API_SECRET,
    access_token=X_ACCESS_TOKEN,
    access_token_secret=X_ACCESS_TOKEN_SECRET
)

# 季節判定
def get_season():
    month = datetime.datetime.now().month
    if month in [12, 1, 2]:
        return "冬"
    elif month in [3, 4, 5]:
        return "春"
    elif month in [6, 7, 8]:
        return "夏"
    else:
        return "秋"

season = get_season()

# 食材リスト
ingredients = [
    "鶏肉", "キャベツ", "じゃがいも", "豚肉", "玉ねぎ", "にんじん",
    "豆腐", "もやし", "きのこ", "ほうれん草", "卵", "ツナ", "チーズ"
]

# ツイートのテンプレート
tweet_templates = [
    "🍳 {ingredient} で何作る？\nコメントでアイデアを教えて！👀✨\nRecipAIならすぐレシピが見つかる🔽 {url}",
    "🔍 クイズ！\n{ingredient} を使った意外な料理は？🤔\n答えはRecipAIでチェック！🔽 {url}",
    "🌟 料理の悩みを解決！\n{ingredient} を使った「時短レシピ」といえば？⏳\nRecipAIなら一発検索！🔽 {url}",
    "🍲 {season}にぴったり！\n{ingredient} を使ったおすすめレシピはこちら🔽 {url}",
    "🔥 話題のレシピ！\n{ingredient} を使ったアレンジレシピを発見！🤩\nRecipAIで検索🔽 {url}",
]

# RecipAIのURL
recipai_url = "https://recip-ai.com/"

# ChatGPTを使ってツイートを生成
def generate_tweet():
    ingredient = random.choice(ingredients)  # ランダムな食材を選択
    template = random.choice(tweet_templates)  # ランダムなテンプレートを選択

    # ChatGPTを使ってツイート内容を微調整
    prompt = f"「{ingredient}」を使った料理について、以下のツイートテンプレートを元に面白くて役立つツイートを140文字以内で考えてください。\n\nテンプレート: {template}\n\nサービス「RecipAI」でレシピ検索できるURL {recipai_url} も含めてください。"
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    tweet = response.choices[0].message.content
    print(tweet)
    return tweet

# ツイートを投稿
def tweet_recipe():
    tweet = generate_tweet()
    x_client.create_tweet(text=tweet)
    print("✅ ツイート完了:")

# 実行
if __name__ == "__main__":
    tweet_recipe()
