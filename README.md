# 项目结构

```text
new_work/
├── README.md                         # 项目说明与目录导航
├── index.html                        # 简历网页预览入口，默认加载 resumes/Introduction.md
├── resumes/                          # 成品 Markdown 简历
│   ├── Introduction.md               # 当前主简历版本
│   └── senior-frontend-engineer.md   # 高级前端工程师定制版本
├── demo/                             # 面试项目 Demo
│   └── flighthub-lite/               # 无人机三维态势可视化原型
├── wiki/                             # 面试准备与知识沉淀
│   └── dj.md
├── profile/                          # 简历素材与经历草稿
│   ├── base.md                       # 早期工作经历与技能素材
│   ├── project_experience.md         # 项目经历素材
│   ├── aishu.md                      # 爱数相关经历素材
│   └── zhaoxia.md                    # 朝霞相关经历素材
├── .claude/
│   └── settings.local.json           # 本地 Claude 配置
├── .gitignore
└── skills-lock.json
```

## 当前简历版本

- 主简历：`resumes/Introduction.md`
- 高级前端工程师定制版：`resumes/senior-frontend-engineer.md`
- 网页预览入口：`index.html`

## Wiki

- 大疆高级前端开发面试备考笔记：`wiki/dj.md`

## Demo

- 司空 Lite 三维态势可视化 Demo：`demo/flighthub-lite/`

## 使用说明

`index.html` 会通过 `fetch` 加载 `resumes/Introduction.md` 并渲染为网页简历。由于浏览器对本地文件读取有限制，建议通过本地 HTTP 服务预览：

```bash
python3 -m http.server 8000
```

启动后访问：

```text
http://localhost:8000/
```
