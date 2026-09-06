/* Chat AET Memory System
 * Local guest memory + authenticated Supabase long-term learning bridge.
 * Stores only compact, useful summaries instead of full conversations.
 */
const AET_MEMORY_KEY = 'chat_aet_memory_v1';
const AET_MEMORY_LIMIT = 100;
const AET_SUPABASE_URL = 'https://zvcssqtcshljucbbkoac.supabase.co';
const AET_MEMORY_URL = AET_SUPABASE_URL + '/functions/v1/chat-aet-memory';
const AET_EVALUATOR_URL = AET_SUPABASE_URL + '/functions/v1/chat-aet-evaluate';
const AET_ROUTER_URL = AET_SUPABASE_URL + '/functions/v1/chat-aet-router';

function aetLoadMemory() {
  try { return JSON.parse(localStorage.getItem(AET_MEMORY_KEY) || '[]'); }
  catch (_) { return []; }
}
function aetSaveMemory(memory) { localStorage.setItem(AET_MEMORY_KEY, JSON.stringify(memory.slice(-AET_MEMORY_LIMIT))); }
function aetExtract(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  const task = /(作って|作成|追加|実装|変更|修正|開発|作りたい|対応して|お願い)/.test(s);
  const important = task || /(覚えて|記憶|大事|重要|プロジェクト|自作|名前|好み|方針|目標)/.test(s);
  if (!important) return null;
  const projectMatch = s.match(/(stickman\s*Video|Chat\s*AET|チャットAET|自作SNS)/i);
  const project = projectMatch ? projectMatch[1].replace(/\s+/g, ' ').trim() : '';
  const detail = s.replace(/^(じゃあ|では|お願い|まず|次は)\s*/,'').replace(/[。！!]+$/,'').trim();
  const completed = /(完了|完成|できた|出来た|追加済み|実装済み|終了|終わった)/.test(s);
  if (completed) return { level:'completed', major: project ? `${project}で${detail.replace(project,'').trim()}済み` : detail, createdAt:Date.now() };
  const middle = detail.replace(project,'').replace(/(して|ください|ほしい|欲しい|ように|できるように|お願い)/g,' ').replace(/\s+/g,' ').trim();
  const fineMatch = s.match(/(既存[^。！!]*|壊さず[^。！!]*|影響[^。！!]*)/);
  return { level:'task', major: project || detail.slice(0, 40), middle: middle.slice(0, 80), fine: fineMatch ? fineMatch[1].slice(0, 80) : '', createdAt:Date.now() };
}
function aetRemember(text) {
  const item = aetExtract(text);
  if (!item) return null;
  const memory = aetLoadMemory();
  const idx = memory.findIndex(x => x.major === item.major && x.middle === item.middle);
  if (idx >= 0) memory[idx] = {...memory[idx], ...item}; else memory.push(item);
  aetSaveMemory(memory);
  return item;
}
function aetMemoryContext(query) {
  const q = String(query || '').toLowerCase();
  return aetLoadMemory().filter(m => {
    const hay = JSON.stringify(m).toLowerCase();
    return !q || q.split(/\s+/).some(w => w.length > 1 && hay.includes(w)) || /(stickman|aet|コメント|投稿|検索|天気|ai|開発)/i.test(q) && hay.includes('stickman');
  }).slice(-8);
}
function aetFormatMemory(memory) {
  return memory.map(m => m.level === 'completed' ? `大部分：${m.major}` : `大部分：${m.major}\n中部分：${m.middle}${m.fine ? `\n細かい部分：${m.fine}` : ''}`).join('\n---\n');
}
function aetClearMemory() { localStorage.removeItem(AET_MEMORY_KEY); }

function aetSessionToken() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!/^sb-[a-z0-9]+-auth-token$/i.test(key)) continue;
      const raw = JSON.parse(localStorage.getItem(key) || '{}');
      if (raw?.access_token) return raw.access_token;
      if (raw?.currentSession?.access_token) return raw.currentSession.access_token;
    }
  } catch (_) {}
  return '';
}
async function aetFetchDbMemory(query, token) {
  if (!token) return [];
  try {
    const r = await aetNativeFetch(AET_MEMORY_URL, { method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}, body:JSON.stringify({query:String(query||'').slice(0,200)}) });
    if (!r.ok) return [];
    const x = await r.json();
    return Array.isArray(x?.memories) ? x.memories : [];
  } catch (_) { return []; }
}
async function aetLearnFromConversation(requestBody, responseClone, token) {
  if (!token) return;
  try {
    const text = await responseClone.text();
    let answer = '';
    for (const raw of text.split(/\n/)) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try { const obj = JSON.parse(payload); if (obj.delta) answer += String(obj.delta); else if (obj.answer) answer += String(obj.answer); } catch (_) {}
    }
    if (!answer.trim()) return;
    await aetNativeFetch(AET_EVALUATOR_URL, { method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}, body:JSON.stringify({message:String(requestBody?.message||''),answer:answer.trim(),history:Array.isArray(requestBody?.history)?requestBody.history:[]}) });
  } catch (_) {}
}

const aetNativeFetch = window.fetch.bind(window);
/* Transparent bridge for the existing chat page. Guests stay local-only. */
window.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : (input?.url || '');
  const isRouter = String(url).startsWith(AET_ROUTER_URL);
  if (!isRouter || !init || String(init.method || 'GET').toUpperCase() !== 'POST') return aetNativeFetch(input, init);
  let bodyObj = null;
  try { bodyObj = JSON.parse(String(init.body || '{}')); } catch (_) {}
  const token = aetSessionToken();
  if (bodyObj && token) {
    const dbMemory = await aetFetchDbMemory(bodyObj.message, token);
    const localMemory = Array.isArray(bodyObj.memory) ? bodyObj.memory : [];
    bodyObj.memory = [...localMemory, ...dbMemory].slice(0, 16);
    init = {...init, body:JSON.stringify(bodyObj), headers:{...(init.headers||{}),Authorization:'Bearer '+token}};
  }
  const response = await aetNativeFetch(input, init);
  if (token) void aetLearnFromConversation(bodyObj || {}, response.clone(), token);
  return response;
};
window.ChatAETMemory = {load:aetLoadMemory,remember:aetRemember,context:aetMemoryContext,format:aetFormatMemory,clear:aetClearMemory,isAuthenticated:()=>!!aetSessionToken()};
