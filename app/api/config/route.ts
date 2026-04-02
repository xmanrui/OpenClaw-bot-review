import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getConfigCache, setConfigCache } from "@/lib/config-cache";
import { OPENCLAW_CONFIG_PATH, OPENCLAW_HOME } from "@/lib/openclaw-paths";
import { shouldHidePlatformChannel } from "@/lib/platforms";
import { readJsonFileSync } from "@/lib/json";

// 配置文件路径：优先使用 OPENCLAW_HOME 环境变量，否则默认 ~/.openclaw
const CONFIG_PATH = OPENCLAW_CONFIG_PATH;
const OPENCLAW_DIR = OPENCLAW_HOME;

const CACHE_TTL_MS = 30_000;

// 从配置的 allowFrom 读取用户 id，用于构建 session key

// 读取 agent 的 session 状态（最近活跃时间、token 用量）- 从 jsonl 文件解析
interface SessionStatus {
  lastActive: number | null;
  totalTokens: number;
  contextTokens: number;
  sessionCount: number;
  todayAvgResponseMs: number;
  messageCount: number;
  weeklyResponseMs: number[]; // 过去7天每天的平均响应时间
  weeklyTokens: number[]; // 过去7天每天的token用量
}

function getAgentSessionStatus(agentId: string): SessionStatus {
  const result: SessionStatus = { lastActive: null, totalTokens: 0, contextTokens: 0, sessionCount: 0, todayAvgResponseMs: 0, messageCount: 0, weeklyResponseMs: [], weeklyTokens: [] };
  const sessionsDir = path.join(OPENCLAW_DIR, `agents/${agentId}/sessions`);
  
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  
  // 生成过去7天的日期
  const weekDates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    weekDates.push(d.toISOString().slice(0, 10));
  }
  const dailyResponseTimes: Record<string, number[]> = {};
  const dailyTokens: Record<string, number> = {};
  for (const d of weekDates) { dailyResponseTimes[d] = []; dailyTokens[d] = 0; }
  
  let files: string[];
  try {
    const allFiles = fs.readdirSync(sessionsDir).filter(f => f.endsWith(".jsonl") && !f.includes(".deleted."));
    // 只读最近7天修改过的文件
    const cutoff = Date.now() - 7 * 86400000;
    files = allFiles.filter(f => {
      try { return fs.statSync(path.join(sessionsDir, f)).mtimeMs >= cutoff; } catch { return false; }
    });
  } catch { return result; }

  // 使用 Set 来统计唯一的 session
  const sessionKeys = new Set<string>();

  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    let content: string;
    try { content = fs.readFileSync(filePath, "utf-8"); } catch { continue; }

    const lines = content.trim().split("\n");
    const messages: { role: string; ts: string; stopReason?: string }[] = [];
    
    for (const line of lines) {
      let entry: any;
      try { entry = JSON.parse(line); } catch { continue; }
      
      // 统计 session 数量（从 session key 或 message 中的 sessionKey）
      if (entry.sessionKey) {
        sessionKeys.add(entry.sessionKey);
      }
      
      // 解析 token 用量 - 从 assistant 消息的 usage 中获取
      if (entry.type === "message" && entry.message) {
        const msg = entry.message;
        if (msg.role === "assistant" && msg.usage) {
          result.totalTokens += msg.usage.input || 0;
          result.totalTokens += msg.usage.output || 0;
          result.messageCount += 1;
          // 按天统计 token
          if (entry.timestamp) {
            const msgDate = entry.timestamp.slice(0, 10);
            if (dailyTokens[msgDate] !== undefined) {
              dailyTokens[msgDate] += (msg.usage.input || 0) + (msg.usage.output || 0);
            }
          }
        }
        // 更新最近活跃时间
        if (entry.timestamp) {
          const ts = new Date(entry.timestamp).getTime();
          if (!result.lastActive || ts > result.lastActive) {
            result.lastActive = ts;
          }
          messages.push({ role: msg.role, ts: entry.timestamp, stopReason: msg.stopReason });
        }
      }
    }
    
    // O(n) 响应时间计算：跟踪最近的 user 消息，匹配下一个 assistant stop
    let lastUserTs: string | null = null;
    for (const msg of messages) {
      if (msg.role === "user") {
        lastUserTs = msg.ts;
      } else if (msg.role === "assistant" && msg.stopReason === "stop" && lastUserTs) {
        const msgDate = lastUserTs.slice(0, 10);
        if (dailyResponseTimes[msgDate]) {
          const diffMs = new Date(msg.ts).getTime() - new Date(lastUserTs).getTime();
          if (diffMs > 0 && diffMs < 600000) {
            dailyResponseTimes[msgDate].push(diffMs);
          }
        }
        lastUserTs = null;
      }
    }
  }
  
  result.sessionCount = sessionKeys.size || files.length; // 降级为文件数
  const todayTimes = dailyResponseTimes[today] || [];
  if (todayTimes.length > 0) {
    result.todayAvgResponseMs = Math.round(todayTimes.reduce((a, b) => a + b, 0) / todayTimes.length);
  }
  result.weeklyResponseMs = weekDates.map(d => {
    const times = dailyResponseTimes[d];
    if (!times || times.length === 0) return 0;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  });
  result.weeklyTokens = weekDates.map(d => dailyTokens[d] || 0);
  return result;
}

// 读取所有 agent 的群聊信息
interface GroupChat {
  groupId: string;
  agents: { id: string; emoji: string; name: string }[];
  channel: string;
}

function getGroupChats(agentIds: string[], agentMap: Record<string, { emoji: string; name: string }>, feishuAgentIds: string[], sessionsMap: Map<string, any>): GroupChat[] {
  const groupAgents: Record<string, { agents: Set<string>; channel: string }> = {};
  for (const agentId of agentIds) {
    try {
      const sessions = sessionsMap.get(agentId);
      if (!sessions) continue;
      for (const key of Object.keys(sessions)) {
        // 匹配群聊 session: agent:{id}:feishu:group:{groupId} 或 agent:{id}:discord:channel:{channelId}
        const feishuGroup = key.match(/^agent:[^:]+:feishu:group:(.+)$/);
        const discordGroup = key.match(/^agent:[^:]+:discord:channel:(.+)$/);
        const telegramGroup = key.match(/^agent:[^:]+:telegram:group:(.+)$/);
        const whatsappGroup = key.match(/^agent:[^:]+:whatsapp:group:(.+)$/);
        if (feishuGroup) {
          const gid = `feishu:${feishuGroup[1]}`;
          if (!groupAgents[gid]) groupAgents[gid] = { agents: new Set(), channel: "feishu" };
          groupAgents[gid].agents.add(agentId);
        }
        if (discordGroup) {
          const gid = `discord:${discordGroup[1]}`;
          if (!groupAgents[gid]) groupAgents[gid] = { agents: new Set(), channel: "discord" };
          groupAgents[gid].agents.add(agentId);
        }
        if (telegramGroup) {
          const gid = `telegram:${telegramGroup[1]}`;
          if (!groupAgents[gid]) groupAgents[gid] = { agents: new Set(), channel: "telegram" };
          groupAgents[gid].agents.add(agentId);
        }
        if (whatsappGroup) {
          const gid = `whatsapp:${whatsappGroup[1]}`;
          if (!groupAgents[gid]) groupAgents[gid] = { agents: new Set(), channel: "whatsapp" };
          groupAgents[gid].agents.add(agentId);
        }
      }
    } catch {}
  }
  // 返回每个群聊实际有 session 的 agents
  return Object.entries(groupAgents)
    .filter(([, v]) => v.agents.size > 0)
    .map(([groupId, v]) => ({
      groupId,
      channel: v.channel,
      agents: Array.from(v.agents).map(id => ({ id, emoji: agentMap[id]?.emoji || "🤖", name: agentMap[id]?.name || id })),
    }));
}

// 从 OpenClaw sessions 文件获取每个 agent 最近活跃的飞书 DM session 的用户 open_id
function getFeishuUserOpenIds(agentIds: string[], sessionsMap: Map<string, any>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const agentId of agentIds) {
    try {
      const sessions = sessionsMap.get(agentId);
      if (!sessions) continue;
      let best: { openId: string; updatedAt: number } | null = null;
      for (const [key, val] of Object.entries(sessions)) {
        const m = key.match(/^agent:[^:]+:feishu:direct:(ou_[a-f0-9]+)$/);
        if (m) {
          const updatedAt = (val as any).updatedAt || 0;
          if (!best || updatedAt > best.updatedAt) {
            best = { openId: m[1], updatedAt };
          }
        }
      }
      if (best) map[agentId] = best.openId;
    } catch {}
  }
  return map;
}

function getChannelDirectPeerIds(
  agentIds: string[],
  sessionsMap: Map<string, any>,
  channel: string
): Record<string, string> {
  const map: Record<string, string> = {};
  const safeChannel = channel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^agent:[^:]+:${safeChannel}:direct:(.+)$`);
  for (const agentId of agentIds) {
    try {
      const sessions = sessionsMap.get(agentId);
      if (!sessions) continue;
      let best: { peerId: string; updatedAt: number } | null = null;
      for (const [key, val] of Object.entries(sessions)) {
        const m = key.match(pattern);
        if (m) {
          const updatedAt = (val as any).updatedAt || 0;
          if (!best || updatedAt > best.updatedAt) {
            best = { peerId: m[1], updatedAt };
          }
        }
      }
      if (best) map[agentId] = best.peerId;
    } catch {}
  }
  return map;
}
// 从 IDENTITY.md 读取机器人名字
function readIdentityName(agentId: string, agentDir?: string, workspace?: string): string | null {
  const candidates = [
    agentDir ? path.join(agentDir, "IDENTITY.md") : null,
    workspace ? path.join(workspace, "IDENTITY.md") : null,
    path.join(OPENCLAW_DIR, `agents/${agentId}/agent/IDENTITY.md`),
    path.join(OPENCLAW_DIR, `workspace-${agentId}/IDENTITY.md`),
    // 只有 main agent 才 fallback 到默认 workspace
    agentId === "main" ? path.join(OPENCLAW_DIR, `workspace/IDENTITY.md`) : null,
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    try {
      const content = fs.readFileSync(p, "utf-8");
      const match = content.match(/\*\*Name:\*\*\s*(.+)/);
      if (match) {
        const name = match[1].trim();
        if (name && !name.startsWith("_") && !name.startsWith("(")) return name;
      }
    } catch {}
  }
  return null;
}

export async function GET() {
  // 命中缓存直接返回
  const configCache = getConfigCache();
  if (configCache && Date.now() - configCache.ts < CACHE_TTL_MS) {
    return NextResponse.json(configCache.data);
  }

  try {
    const config = readJsonFileSync(CONFIG_PATH);

    // 提取 agents 信息
    const defaults = config.agents?.defaults || {};
    const defaultModel = typeof defaults.model === "string"
      ? defaults.model
      : defaults.model?.primary || "unknown";
    const fallbacks = typeof defaults.model === "object"
      ? defaults.model?.fallbacks || []
      : [];
    const normalizeModelRef = (value: any, fallback: string): string => {
      const pick = (v: any): string | null => {
        if (typeof v === "string") {
          const s = v.trim();
          return s.length > 0 ? s : null;
        }
        return null;
      };

      const direct = pick(value);
      if (direct) return direct;

      if (value && typeof value === "object") {
        const primary = pick(value.primary);
        if (primary) return primary;
        const def = pick(value.default);
        if (def) return def;
      }

      const fb = pick(fallback);
      return fb || "unknown";
    };

    let agentList = config.agents?.list || [];
    const bindings = config.bindings || [];
    const channels = config.channels || {};
    const feishuAccounts = channels.feishu?.accounts || {};

    // Auto-discover agents from ~/.openclaw/agents/ when agents.list is empty
    if (agentList.length === 0) {
      try {
        const agentsDir = path.join(OPENCLAW_DIR, "agents");
        const dirs = fs.readdirSync(agentsDir, { withFileTypes: true });
        agentList = dirs
          .filter((d) => d.isDirectory() && !d.name.startsWith("."))
          .map((d) => ({ id: d.name }));
      } catch {}
      // If still empty, at least include "main"
      if (agentList.length === 0) {
        agentList = [{ id: "main" }];
      }
    }

    // 一次性读取所有 agent 的 sessions.json，避免重复读取
    const agentIds = agentList.map((a: any) => a.id);
    const sessionsMap = new Map<string, any>();
    for (const agentId of agentIds) {
      try {
        const sessionsPath = path.join(OPENCLAW_DIR, `agents/${agentId}/sessions/sessions.json`);
        const raw = fs.readFileSync(sessionsPath, "utf-8");
        sessionsMap.set(agentId, JSON.parse(raw));
      } catch {}
    }

    // 从预读的 sessions 数据获取飞书用户 open_id
    const feishuUserOpenIds = getFeishuUserOpenIds(agentIds, sessionsMap);
    const enabledChannelNames: string[] = Object.entries(channels)
      .filter(([channelName, cfg]) => cfg && typeof cfg === "object" && (cfg as any).enabled !== false && !shouldHidePlatformChannel(channelName, channels))
      .map(([channelName]) => channelName);
    const boundChannelNames: string[] = Array.from(new Set(
      bindings
        .map((b: any) => b.match?.channel)
        .filter((v: any): v is string => typeof v === "string" && v.length > 0 && !shouldHidePlatformChannel(v, channels))
    ));
    const discoverChannelNames: string[] = Array.from(new Set([...enabledChannelNames, ...boundChannelNames]));
    const directPeerIdsByChannel: Record<string, Record<string, string>> = {};
    for (const channelName of discoverChannelNames) {
      if (channelName === "feishu") continue;
      directPeerIdsByChannel[channelName] = getChannelDirectPeerIds(agentIds, sessionsMap, channelName);
    }
    const discordDmAllowFrom = channels.discord?.dm?.allowFrom || [];

    // 构建 agent 详情
    const agents = await Promise.all(agentList.map(async (agent: any) => {
      const id = agent.id;
      const identityName = readIdentityName(id, agent.agentDir, agent.workspace);
      const name = identityName || agent.name || id;
      const emoji = agent.identity?.emoji || "🤖";
      const model = normalizeModelRef(agent.model, defaultModel);

      // 查找绑定的平台
      const platforms: { name: string; accountId?: string; appId?: string; botOpenId?: string; botUserId?: string }[] = [];
      const addPlatform = (platform: { name: string; accountId?: string; appId?: string; botOpenId?: string; botUserId?: string }) => {
        if (!platform?.name) return;
        const exists = platforms.some((p) => p.name === platform.name && (p.accountId || "") === (platform.accountId || ""));
        if (!exists) platforms.push(platform);
      };

      // 检查飞书绑定 (explicit binding)
      const feishuBinding = bindings.find(
        (b: any) => b.agentId === id && b.match?.channel === "feishu"
      );
      if (feishuBinding) {
        const accountId = feishuBinding.match?.accountId || id;
        const acc = feishuAccounts[accountId];
        const appId = acc?.appId;
        const userOpenId = feishuUserOpenIds[id] || null;
        addPlatform({ name: "feishu", accountId, appId, ...(userOpenId && { botOpenId: userOpenId }) });
      }

      // If no explicit binding, check if there's a feishu account matching this agent id
      if (!feishuBinding && feishuAccounts[id]) {
        const acc = feishuAccounts[id];
        const appId = acc?.appId;
        const userOpenId = feishuUserOpenIds[id] || null;
        addPlatform({ name: "feishu", accountId: id, appId, ...(userOpenId && { botOpenId: userOpenId }) });
      }

      // main agent 特殊处理：默认绑定所有未显式绑定的 channel
      if (id === "main") {
        const hasFeishu = platforms.some((p) => p.name === "feishu");
        if (!hasFeishu && channels.feishu && channels.feishu.enabled !== false) {
          // main gets feishu if channel is configured and not explicitly disabled
          const acc = feishuAccounts["main"];
          const appId = acc?.appId || channels.feishu?.appId;
          const userOpenId = feishuUserOpenIds["main"] || null;
          addPlatform({ name: "feishu", accountId: "main", appId, ...(userOpenId && { botOpenId: userOpenId }) });
        }

        // main agent 默认展示所有已启用 channel（feishu 已单独处理）
        for (const channelName of enabledChannelNames) {
          if (channelName === "feishu") continue;
          const botUserId = directPeerIdsByChannel[channelName]?.[id]
            || (channelName === "discord" ? (discordDmAllowFrom[0] || null) : null);
          addPlatform({ name: channelName, ...(botUserId && { botUserId }) });
        }
      }

      // 非 main agent：按显式 bindings 展示 channel（自动支持新增 channel）
      if (id !== "main") {
        const seenBindingChannels = new Set<string>();
        for (const binding of bindings) {
          if (binding?.agentId !== id) continue;
          const channelName = binding?.match?.channel;
          if (!channelName || channelName === "feishu" || shouldHidePlatformChannel(channelName, channels)) continue;
          if (seenBindingChannels.has(channelName)) continue;
          seenBindingChannels.add(channelName);
          const botUserId = directPeerIdsByChannel[channelName]?.[id] || null;
          const accountId = typeof binding?.match?.accountId === "string" ? binding.match.accountId : undefined;
          addPlatform({ name: channelName, ...(accountId && { accountId }), ...(botUserId && { botUserId }) });
        }
      }

      return { id, name, emoji, model, platforms };
    }));

    // 为每个 agent 添加 session 状态
    const agentsWithStatus = agents.map((agent: any) => ({
      ...agent,
      session: getAgentSessionStatus(agent.id),
    }));

    // 构建 agent 映射（用于群聊）
    const agentMap: Record<string, { emoji: string; name: string }> = {};
    for (const a of agentsWithStatus) agentMap[a.id] = { emoji: a.emoji, name: a.name };

    // 获取群聊信息（传入所有绑定了飞书的 agent id）
    const feishuAgentIds = agentsWithStatus.filter((a: any) => a.platforms.some((p: any) => p.name === "feishu")).map((a: any) => a.id);
    const groupChats = getGroupChats(agentIds, agentMap, feishuAgentIds, sessionsMap);

    const authProviderIds = new Set<string>();
    if (config.auth?.profiles) {
      for (const profileKey of Object.keys(config.auth.profiles)) {
        const profile = config.auth.profiles[profileKey];
        const providerId = profile?.provider || profileKey.split(":")[0];
        if (providerId) authProviderIds.add(providerId);
      }
    }

    // 提取模型 providers
    let providers = Object.entries(config.models?.providers || {}).map(
      ([providerId, provider]: [string, any]) => {
        const models = (provider.models || []).map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
          contextWindow: m.contextWindow,
          maxTokens: m.maxTokens,
          reasoning: m.reasoning,
          input: m.input,
        }));

        // 找出使用该 provider 的 agents
        const usedBy = agentsWithStatus
          .filter((a: any) => typeof a.model === "string" && a.model.startsWith(providerId + "/"))
          .map((a: any) => ({ id: a.id, emoji: a.emoji, name: a.name }));

        return {
          id: providerId,
          api: provider.api,
          accessMode: authProviderIds.has(providerId) ? "auth" : "api_key",
          models,
          usedBy,
        };
      }
    );

    // 始终合并 auth.profiles + agents/defaults 推断的 provider/model，
    // 兼容 models.providers 与 auth.profiles 同时存在的配置。
    const providerModels: Record<string, { id: string; name?: string }[]> = {};

    const ensureProvider = (providerId: string) => {
      if (providerId && !providerModels[providerId]) providerModels[providerId] = [];
    };
    const addModelRef = (modelKey?: string, alias?: string) => {
      if (!modelKey || typeof modelKey !== "string") return;
      const slashIdx = modelKey.indexOf("/");
      if (slashIdx <= 0 || slashIdx >= modelKey.length - 1) return;
      const providerId = modelKey.slice(0, slashIdx);
      const modelId = modelKey.slice(slashIdx + 1);
      ensureProvider(providerId);
      if (!providerModels[providerId].some((m) => m.id === modelId)) {
        providerModels[providerId].push({ id: modelId, ...(alias && { name: alias }) });
      }
    };

    // 从 auth.profiles 提取 provider 名称
    for (const providerId of authProviderIds) ensureProvider(providerId);

    // 从 agents.defaults.models 提取模型列表
    const defaultsModels = config.agents?.defaults?.models || {};
    for (const modelKey of Object.keys(defaultsModels)) {
      const alias = defaultsModels[modelKey]?.alias;
      addModelRef(modelKey, alias);
    }

    // 从主模型和 fallback 模型补充
    addModelRef(defaultModel);
    for (const fallback of fallbacks) addModelRef(fallback);

    // 从每个 agent 的当前模型补充
    for (const agent of agentsWithStatus) addModelRef(agent.model);

    for (const [providerId, inferredModels] of Object.entries(providerModels)) {
      let target = providers.find((p: any) => p.id === providerId);
      if (!target) {
        const usedBy = agentsWithStatus
          .filter((a: any) => typeof a.model === "string" && a.model.startsWith(providerId + "/"))
          .map((a: any) => ({ id: a.id, emoji: a.emoji, name: a.name }));
        target = { id: providerId, api: undefined, accessMode: authProviderIds.has(providerId) ? "auth" : "api_key", models: [], usedBy };
        providers.push(target);
      }

      // auth profile should take precedence in UI access-mode labeling.
      target.accessMode = authProviderIds.has(providerId)
        ? "auth"
        : (target.accessMode || "api_key");

      for (const m of inferredModels) {
        const exists = target.models.find((x: any) => x.id === m.id);
        if (!exists) {
          target.models.push({
            id: m.id,
            name: m.name || m.id,
            contextWindow: undefined,
            maxTokens: undefined,
            reasoning: undefined,
            input: undefined,
          });
        } else if (!exists.name) {
          exists.name = m.name || exists.id;
        }
      }
    }

    const data = {
      agents: agentsWithStatus,
      providers,
      defaults: { model: defaultModel, fallbacks },
      gateway: {
        port: config.gateway?.port || 18789,
        token: config.gateway?.auth?.token || "",
        host: config.gateway?.host || config.gateway?.hostname || "",
      },
      groupChats,
    };
    setConfigCache({ data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
