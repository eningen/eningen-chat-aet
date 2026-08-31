# Chat AET 4モデル構成

## 現在の状態

Chat AETはSupabase Edge Function `chat-aet-router`を入口にして、質問を次の4モデルへ振り分ける構成です。

- Qwen: 日本語・会話・文章
- GPT-OSS: コード・開発
- DeepSeek: 数学・推論
- Llama: 汎用・予備

## 重要

オープンウェイトモデルは「モデルの利用料が無料」という意味であって、公開Webサービスを無制限無料でホストできるという意味ではありません。gpt-ossも自分のインフラやホスティング先で実行するモデルで、計算資源の費用は別途必要です。

## 推奨する本番構成

1. 4モデルをOllama/vLLM/llama.cpp等のOpenAI互換サーバーで実行
2. 各モデルのURLをSupabase Edge FunctionのSecretとして登録
3. Edge Functionが質問を分類して適切なモデルへ転送
4. モデル障害時は別モデル、最後にGeminiへフォールバック

## 必要なSecrets

- `AET_QWEN_URL`, `AET_QWEN_MODEL`, `AET_QWEN_API_KEY`
- `AET_GPT_OSS_URL`, `AET_GPT_OSS_MODEL`, `AET_GPT_OSS_API_KEY`
- `AET_DEEPSEEK_URL`, `AET_DEEPSEEK_MODEL`, `AET_DEEPSEEK_API_KEY`
- `AET_LLAMA_URL`, `AET_LLAMA_MODEL`, `AET_LLAMA_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`（最終フォールバック）

## 無料枠について

QwenCloudの新規ユーザー無料クォータは90日間で、無制限ではありません。DeepSeek APIも従量課金です。したがって、Chat AETの「完全無制限」を実現するには、4モデルを自分でホストする方式が必要です。

## 参考

- OpenAI gpt-oss: https://help.openai.com/en/articles/11870455
- QwenCloud free quota: https://docs.qwencloud.com/resources/free-quota
- DeepSeek API: https://www.deepseek.com/platform/
