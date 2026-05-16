import { useState, useEffect, useCallback } from "react";

interface Notification {
  id: number;
  topic_id: number;
  type: string;
  message: string;
  sent: number;
  topic_title: string | null;
  source_url: string | null;
  created_at: string;
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emailConfig, setEmailConfig] = useState({
    email_to: "", email_smtp_host: "smtp.gmail.com",
    email_smtp_port: "587", email_smtp_user: "", email_smtp_pass: "",
  });
  const [saving, setSaving] = useState(false);
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      setNotifications(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(c => setEmailConfig(prev => ({ ...prev, ...c }))).catch(() => {});
  }, []);

  function enableBrowser() {
    if ("Notification" in window) {
      Notification.requestPermission().then(perm => {
        setBrowserEnabled(perm === "granted");
        if (perm === "granted") {
          new Notification("热点监控已就绪", { body: "新热点会自动推送" });
        }
      });
    }
  }

  useEffect(() => {
    if (!browserEnabled || notifications.length === 0) return;
    const latest = notifications[0];
    if (latest.type === "browser" && new Date(latest.created_at).getTime() > Date.now() - 60000) {
      new Notification("热点监控", { body: latest.message });
    }
  }, [notifications, browserEnabled]);

  async function saveEmail() {
    setSaving(true);
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(emailConfig)) cleaned[k] = String(v || "");
    await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cleaned) });
    setSaving(false);
    alert("已保存");
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
        通知
      </h2>

      {/* Browser */}
      <div className="mb-3 p-2.5 rounded-lg border border-slate-800/40 bg-slate-800/20">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">浏览器推送</span>
          {browserEnabled ? (
            <span className="text-[10px] text-emerald-400 font-mono">已启用</span>
          ) : (
            <button onClick={enableBrowser} className="text-[10px] px-2 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan font-mono hover:bg-accent-cyan/20 transition-colors">启用</button>
          )}
        </div>
      </div>

      {/* Email toggle */}
      <button
        onClick={() => setShowEmail(!showEmail)}
        className="w-full mb-3 p-2.5 rounded-lg border border-slate-800/40 bg-slate-800/20 text-xs text-slate-300 text-left hover:border-slate-700/60 transition-colors"
      >
        📧 邮件通知 {emailConfig.email_to ? `(${emailConfig.email_to})` : "(未配置)"}
      </button>

      {showEmail && (
        <div className="mb-3 p-2.5 rounded-lg border border-slate-800/40 bg-slate-800/20 space-y-1.5">
          <input type="email" placeholder="接收邮箱" value={emailConfig.email_to} onChange={e => setEmailConfig(c => ({ ...c, email_to: e.target.value }))} className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-[10px] text-slate-200 outline-none focus:border-accent-cyan/40" />
          <div className="grid grid-cols-2 gap-1">
            <input type="text" placeholder="SMTP服务器" value={emailConfig.email_smtp_host} onChange={e => setEmailConfig(c => ({ ...c, email_smtp_host: e.target.value }))} className="bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-[10px] text-slate-200 outline-none focus:border-accent-cyan/40" />
            <input type="text" placeholder="端口" value={emailConfig.email_smtp_port} onChange={e => setEmailConfig(c => ({ ...c, email_smtp_port: e.target.value }))} className="bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-[10px] text-slate-200" />
          </div>
          <input type="text" placeholder="SMTP用户名" value={emailConfig.email_smtp_user} onChange={e => setEmailConfig(c => ({ ...c, email_smtp_user: e.target.value }))} className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-[10px] text-slate-200 outline-none focus:border-accent-cyan/40" />
          <input type="password" placeholder="SMTP密码" value={emailConfig.email_smtp_pass} onChange={e => setEmailConfig(c => ({ ...c, email_smtp_pass: e.target.value }))} className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1 text-[10px] text-slate-200" />
          <button onClick={saveEmail} disabled={saving} className="px-2 py-1 rounded text-[10px] bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan font-mono hover:bg-accent-cyan/20 transition-colors disabled:opacity-40">{saving ? "保存中" : "保存"}</button>
        </div>
      )}

      {/* History */}
      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {notifications.length === 0 && <p className="text-[10px] text-slate-600 text-center py-4 font-mono">暂无通知</p>}
        {notifications.map(n => (
          <div key={n.id} className="flex items-center gap-2 px-2 py-1 rounded text-[10px] hover:bg-slate-800/30 transition-colors">
            <span className="flex-shrink-0">{n.type === "browser" ? "🔔" : "📧"}</span>
            <span className="text-slate-400 truncate flex-1">{n.message}</span>
            <span className="text-slate-600 flex-shrink-0">{new Date(n.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
