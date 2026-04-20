import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const pr = searchParams.get("pr");

  if (!repo) {
    return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
  }

  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  try {
    if (pr) {
      const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${pr}`, {
        headers: { ...headers, Accept: "application/vnd.github.v3.diff" },
      });
      const diff = await prRes.text();

      const titleRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${pr}`, { headers });
      const titleData = await titleRes.json();

      const files = [...(diff.match(/^--- a\/(.+)$/gm) || [])].map((f) => f.replace("--- a/", ""));
      const additions = (diff.match(/^\+[^+]/gm) || []).length;
      const deletions = (diff.match(/^\-[^-]/gm) || []).length;

      return NextResponse.json({
        type: "pr",
        title: titleData.title,
        author: titleData.user?.login,
        base: titleData.base?.ref,
        head: titleData.head?.ref,
        files,
        additions,
        deletions,
        content: diff.slice(0, 10000),
        url: titleData.html_url,
      });
    }

    if (path) {
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers });
      if (!res.ok) {
        return NextResponse.json({ error: `File not found: ${path}` }, { status: 404 });
      }
      const data = await res.json();
      const content = Buffer.from(data.content, "base64").toString("utf-8");

      const ext = path.split(".").pop() || "txt";
      const langMap: Record<string, string> = {
        ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
        py: "python", rs: "rust", go: "go", java: "java", sol: "solidity",
        sql: "sql", sh: "bash", yml: "yaml", yaml: "yaml", json: "json",
        css: "css", html: "html", md: "markdown",
      };

      return NextResponse.json({
        type: "file",
        name: data.name,
        path: data.path,
        size: data.size,
        language: langMap[ext] || ext,
        content,
        url: data.html_url,
      });
    }

    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    const data = await res.json();

    const treeRes = await fetch(
      `https://api.github.com/repos/${repo}/git/trees/${data.default_branch}?recursive=1`,
      { headers }
    );
    const treeData = await treeRes.json();

    const files = (treeData.tree || [])
      .filter((item: { type: string }) => item.type === "blob")
      .map((item: { path: string }) => item.path)
      .filter((p: string) => !p.includes("node_modules") && !p.includes(".git/"))
      .slice(0, 100);

    return NextResponse.json({
      type: "repo",
      name: data.full_name,
      description: data.description,
      defaultBranch: data.default_branch,
      stars: data.stargazers_count,
      language: data.language,
      files,
      url: data.html_url,
    });
  } catch (error) {
    console.error("GitHub fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch from GitHub" }, { status: 500 });
  }
}
