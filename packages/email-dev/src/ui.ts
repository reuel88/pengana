import { desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { emailLog } from "./schema";

export function createEmailDevApp<TSchema extends Record<string, unknown>>(
	db: NodePgDatabase<TSchema>,
) {
	const app = new Hono();

	app.get("/api/emails", async (c) => {
		const emails = await db
			.select({
				id: emailLog.id,
				to: emailLog.to,
				from: emailLog.from,
				subject: emailLog.subject,
				createdAt: emailLog.createdAt,
			})
			.from(emailLog)
			.orderBy(desc(emailLog.createdAt))
			.limit(100);
		return c.json(emails);
	});

	app.get("/api/emails/:id", async (c) => {
		const id = Number(c.req.param("id"));
		const [email] = await db
			.select()
			.from(emailLog)
			.where(eq(emailLog.id, id))
			.limit(1);
		if (!email) return c.json({ error: "Not found" }, 404);
		return c.json(email);
	});

	app.delete("/api/emails", async (c) => {
		await db.delete(emailLog);
		return c.json({ ok: true });
	});

	app.delete("/api/emails/:id", async (c) => {
		const id = Number(c.req.param("id"));
		await db.delete(emailLog).where(eq(emailLog.id, id));
		return c.json({ ok: true });
	});

	app.get("/preview/:id", async (c) => {
		const id = Number(c.req.param("id"));
		const [email] = await db
			.select({ html: emailLog.html })
			.from(emailLog)
			.where(eq(emailLog.id, id))
			.limit(1);
		if (!email) return c.text("Not found", 404);
		return c.html(`<base target="_blank">${email.html}`);
	});

	app.get("/", (c) => {
		const basePath = c.req.path.replace(/\/$/, "");
		const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dev Email Inbox</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { color-scheme: light; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; height: 100vh; display: flex; flex-direction: column; background: #f3f4f8; color: #111827; }
  header { background: #17172f; color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid #242446; }
  header h1 { font-size: 16px; font-weight: 700; white-space: nowrap; }
  .header-actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; flex-wrap: wrap; }
  button { border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; line-height: 1; padding: 10px 14px; }
  #toggle-inbox-btn, .preview-toggle-btn, .empty-toggle-btn { background: #2d325a; color: #fff; }
  #refresh-btn { background: #3498db; color: #fff; }
  #refresh-btn:hover { background: #2980b9; }
  #clear-btn { background: #e74c3c; color: #fff; }
  #clear-btn:hover { background: #c0392b; }
  .shell { position: relative; display: flex; flex: 1; overflow: hidden; min-height: 0; }
  .backdrop { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.45); opacity: 0; pointer-events: none; transition: opacity 180ms ease; z-index: 20; }
  .email-sidebar { width: 380px; max-width: 100%; overflow: hidden; background: #fff; border-right: 1px solid #d7dbe7; display: flex; flex-direction: column; z-index: 30; }
  .sidebar-header { display: none; align-items: center; justify-content: space-between; gap: 8px; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; }
  .sidebar-header h2 { font-size: 14px; font-weight: 700; }
  .sidebar-close { background: #eef2ff; color: #3730a3; padding: 8px 10px; }
  .email-list { overflow-y: auto; background: #fff; flex: 1; }
  .email-item { position: relative; padding: 14px 48px 14px 16px; border-bottom: 1px solid #eef0f5; cursor: pointer; transition: background 120ms ease; }
  .email-item:hover { background: #f0f4ff; }
  .email-item.active { background: #e3ecff; }
  .email-item .subject { font-weight: 700; font-size: 14px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .email-item .meta { font-size: 12px; color: #6b7280; line-height: 1.45; word-break: break-word; }
  .email-item .delete-btn { position: absolute; top: 14px; right: 14px; background: none; color: #9ca3af; padding: 0; font-size: 18px; line-height: 1; }
  .email-item .delete-btn:hover { color: #e74c3c; }
  .preview { flex: 1; display: flex; flex-direction: column; min-width: 0; background: #fff; }
  .preview-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 20px; background: #fff; border-bottom: 1px solid #ddd; }
  .preview-header-main { min-width: 0; }
  .preview-header h2 { font-size: 16px; margin-bottom: 4px; }
  .preview-header .meta { font-size: 13px; color: #666; line-height: 1.45; word-break: break-word; }
  .preview iframe { flex: 1; border: none; background: #fff; min-height: 0; }
  .empty { display: flex; align-items: center; justify-content: center; flex: 1; color: #999; font-size: 14px; padding: 24px; text-align: center; }
  .empty-content { max-width: 280px; display: flex; flex-direction: column; gap: 12px; align-items: center; }
  .empty-title { font-size: 18px; font-weight: 700; color: #1f2937; }
  .empty-copy { color: #6b7280; line-height: 1.5; }
  .empty-toggle-btn { padding: 10px 14px; }
  .empty-list { align-items: flex-start; text-align: left; padding: 20px 16px; }
  .desktop-only { display: inline-flex; }
  .mobile-only { display: none; }

  @media (max-width: 820px) {
    header { padding: 12px; }
    header h1 { padding-top: 2px; }
    .header-actions { width: 100%; }
    .desktop-only { display: none; }
    .mobile-only { display: inline-flex; }
    .shell { background: #fff; }
    .email-sidebar { position: absolute; inset: 0 auto 0 0; width: min(86vw, 360px); transform: translateX(-100%); transition: transform 180ms ease; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.28); }
    .sidebar-header { display: flex; }
    .preview-header { padding: 14px 16px; }
    .preview-toggle-btn { flex: 0 0 auto; }
    body.sidebar-open .email-sidebar { transform: translateX(0); }
    body.sidebar-open .backdrop { opacity: 1; pointer-events: auto; }
  }

  @media (min-width: 821px) {
    #toggle-inbox-btn, .preview-toggle-btn, .empty-toggle-btn, .backdrop, .sidebar-header { display: none; }
  }
</style>
</head>
<body>
<header>
  <h1>Dev Email Inbox</h1>
  <div class="header-actions">
    <button id="toggle-inbox-btn" onclick="toggleSidebar()" type="button">Inbox</button>
    <button id="refresh-btn" onclick="load()">Refresh</button>
    <button id="clear-btn" onclick="clearAll()">Clear All</button>
  </div>
</header>
<div class="shell">
  <div class="backdrop" onclick="closeSidebar()"></div>
  <aside class="email-sidebar">
    <div class="sidebar-header">
      <h2>Inbox</h2>
      <button class="sidebar-close" onclick="closeSidebar()" type="button">Close</button>
    </div>
    <div class="email-list" id="email-list"></div>
  </aside>
  <div class="preview" id="preview">
    <div class="empty">
      <div class="empty-content">
        <div class="empty-title">Select an email to preview</div>
        <div class="empty-copy">Choose a message from the inbox to inspect the rendered email.</div>
        <button class="empty-toggle-btn mobile-only" onclick="openSidebar()" type="button">Open Inbox</button>
      </div>
    </div>
  </div>
</div>
<script>
const BASE = "${basePath}";
let emails = [];
let activeId = null;
const MOBILE_MEDIA = window.matchMedia("(max-width: 820px)");

async function load() {
  const res = await fetch(BASE + "/api/emails");
  emails = await res.json();
  syncSidebarForViewport();
  renderList();
  renderEmptyPreview();
}

function isMobile() {
  return MOBILE_MEDIA.matches;
}

function openSidebar() {
  if (!isMobile()) return;
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function toggleSidebar() {
  if (!isMobile()) return;
  document.body.classList.toggle("sidebar-open");
}

function syncSidebarForViewport() {
  if (isMobile()) {
    if (activeId == null) openSidebar();
  } else {
    closeSidebar();
  }
}

function emptyPreviewHtml() {
  return '<div class="empty">'
    + '<div class="empty-content">'
    + '<div class="empty-title">Select an email to preview</div>'
    + '<div class="empty-copy">Choose a message from the inbox to inspect the rendered email.</div>'
    + '<button class="empty-toggle-btn mobile-only" onclick="openSidebar()" type="button">Open Inbox</button>'
    + '</div>'
    + '</div>';
}

function renderEmptyPreview() {
  if (activeId !== null) return;
  document.getElementById("preview").innerHTML = emptyPreviewHtml();
}

function renderList() {
  const list = document.getElementById("email-list");
  if (emails.length === 0) {
    list.innerHTML = '<div class="empty empty-list"><div class="empty-content"><div class="empty-title">No emails yet</div><div class="empty-copy">Triggered emails will appear here. Use Refresh if you are waiting for a new one.</div></div></div>';
    return;
  }
  list.innerHTML = emails.map(e => {
    const date = new Date(e.createdAt).toLocaleString();
    return '<div class="email-item' + (e.id === activeId ? ' active' : '') + '" onclick="select(' + e.id + ')">'
      + '<button class="delete-btn" onclick="event.stopPropagation();deleteOne(' + e.id + ')" title="Delete">&times;</button>'
      + '<div class="subject">' + esc(e.subject) + '</div>'
      + '<div class="meta">To: ' + esc(e.to) + ' &middot; ' + date + '</div>'
      + '</div>';
  }).join("");
}

async function select(id) {
  activeId = id;
  renderList();
  const res = await fetch(BASE + "/api/emails/" + id);
  const email = await res.json();
  const preview = document.getElementById("preview");
  preview.innerHTML =
    '<div class="preview-header">'
    + '<div class="preview-header-main">'
    + '<h2>' + esc(email.subject) + '</h2>'
    + '<div class="meta">From: ' + esc(email.from) + ' &middot; To: ' + esc(email.to) + '</div>'
    + '</div>'
    + '<button class="preview-toggle-btn mobile-only" onclick="openSidebar()" type="button">Inbox</button>'
    + '</div>'
    + '<iframe sandbox="allow-same-origin allow-popups" src="' + BASE + '/preview/' + id + '"></iframe>';
  closeSidebar();
}

async function deleteOne(id) {
  await fetch(BASE + "/api/emails/" + id, { method: "DELETE" });
  if (activeId === id) {
    activeId = null;
    renderEmptyPreview();
    syncSidebarForViewport();
  }
  load();
}

async function clearAll() {
  if (!confirm("Delete all emails?")) return;
  await fetch(BASE + "/api/emails", { method: "DELETE" });
  activeId = null;
  renderEmptyPreview();
  syncSidebarForViewport();
  load();
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

MOBILE_MEDIA.addEventListener("change", syncSidebarForViewport);

load();
</script>
</body>
</html>`;
		return c.html(html);
	});

	return app;
}
