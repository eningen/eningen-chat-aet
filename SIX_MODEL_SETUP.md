# Chat AET 6モデル構成

Chat AETはSupabase Edge Function `chat-aet-router`を入口に、5つの無料OpenRouterモデルを専門担当として並列実行し、Gemini 3.6 Flashがそれらの下書きを統合して最終回答を作る構成です。

## 6つのAI

- Qwen3 30B A3B: 多言語・会話・文章
- GPT-OSS 20B: コード・実装・開発
- DeepSeek R1: 数学・論理・深い推論
- Llama 3.3 70B: 一般会話・自然な文章
- Mistral 7B: 要約・整理・高速回答
- Gemini 3.6 Flash: 5モデルの回答を統合し、最終回答を生成

## 現在のAPI構成

- `OPENROUTER_API_KEY`: 5つの無料モデルへの共通入口
- `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini 3.6 Flash

無料モデルのエンドポイントはレート制限や提供状況が変わる場合があります。Gemini 3.6 FlashにはGoogle AIの無料枠がありますが、利用上限はサービス側の条件に従います。

## 処理の流れ

1. ユーザーがChat AETへ質問を送信
2. Qwen / GPT-OSS / DeepSeek / Llama / Mistralが並列で専門的な下書きを生成
3. Geminiが5つの下書きと会話履歴、必要なら画像を受け取る
4. Geminiが矛盾を整理して、1つの「チャットAET」として最終回答を生成
5. フロントエンドへストリーミング形式で返す

## 人格

内部モデルが何であっても、ユーザー向けの名前は常に「チャットAET」。内部モデル名を勝手に名乗らず、6モデルの結果を1つのAIとして自然な日本語で回答します。
