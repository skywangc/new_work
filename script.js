// 枚举：短 key → md 文件路径
const FILE_MAP = {
  intro: "./resumes/Introduction.md",
  sfe:   "./resumes/senior-frontend-engineer.md",
};
const DEFAULT_KEY = "intro";

const fileKey = new URLSearchParams(location.search).get("f") || DEFAULT_KEY;
const markdownPath = FILE_MAP[fileKey] || FILE_MAP[DEFAULT_KEY];

const target = document.getElementById("resume");
const toc = document.getElementById("toc");
const tocList = document.getElementById("tocList");
const tocToggle = document.getElementById("tocToggle");

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function fallbackMarkdown(value) {
  const lines = value.split("\n");
  const html = [];
  let listOpen = false;

  function closeList() {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  }

  lines.forEach((line) => {
    const text = line.trim();

    if (!text) {
      closeList();
      return;
    }

    if (text === "---") {
      closeList();
      html.push("<hr />");
      return;
    }

    const heading = text.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      html.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`);
      return;
    }

    if (text.startsWith("* ")) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(text.slice(2))}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(text)}</p>`);
  });

  closeList();
  return html.join("\n");
}

function renderMarkdown(source) {
  if (window.marked) {
    marked.use({
      gfm: true,
      breaks: true,
      mangle: false,
      headerIds: false
    });
    target.innerHTML = marked.parse(source);
  } else {
    target.innerHTML = fallbackMarkdown(source);
  }

  buildToc();
}

function slugify(value, index) {
  return `section-${index}-${value
    .trim()
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item"}`;
}

function buildToc() {
  const headings = [...target.querySelectorAll("h2, h3")];

  tocList.innerHTML = "";
  toc.hidden = headings.length === 0;

  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = slugify(heading.textContent || "", index + 1);
    }

    const link = document.createElement("a");
    link.className = `toc-link toc-link-level-${heading.tagName.slice(1)}`;
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent || "";
    tocList.appendChild(link);
  });
}

function setTocOpen(open) {
  document.body.classList.toggle("toc-open", open);
  tocToggle.setAttribute("aria-expanded", String(open));
  tocToggle.setAttribute("aria-label", open ? "收起目录" : "展开目录");
}

tocToggle.addEventListener("click", () => {
  setTocOpen(!document.body.classList.contains("toc-open"));
});

tocList.addEventListener("click", (event) => {
  if (event.target.closest(".toc-link") && window.matchMedia("(max-width: 1040px)").matches) {
    setTocOpen(false);
  }
});

async function loadResume() {
  try {
    const response = await fetch(markdownPath, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    renderMarkdown(await response.text());
  } catch (error) {
    target.innerHTML = [
      "<h1>简历加载失败</h1>",
      "<p>请确认已通过本地 HTTP 服务打开本页面，并且对应 md 文件可正常访问。</p>",
      `<p>当前参数：<strong>f=${escapeHtml(fileKey)}</strong> → <strong>${escapeHtml(markdownPath)}</strong></p>`,
      `<p>错误信息：${escapeHtml(error.message)}</p>`
    ].join("");
  }
}

loadResume();
