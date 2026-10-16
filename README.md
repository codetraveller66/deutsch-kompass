# Deutsch Kompass

面向中文使用者的独立德语学习网站。B1以90天生活德语计划为主线，DW Nicos Weg作为唯一系统主课。A2、B2、C1提供语法和目标入口；语法地图与能力目标覆盖A1–C2。

## 使用

- 总览：学习方法、完成进度、继续学习入口。
- 每日学习：90天逐日内容，精确到时间段，任务状态和备注自动保存。
- 测试：D1、14、28、42、56、70、84、90的诊断和调整建议。
- 资源库：自行添加、编辑、删除链接，默认25项资料。
- 语法地图：112个主题，含原创中文解释、德语例句、易错点、微练习和掌握记录。
- 等级目标：A1–C2听说读写描述与生活任务。
- 设置：默认20:00–22:30，自定义开始与结束时间（支持跨午夜），任务自动重排；开始日期、完整备份导出和恢复。

学习记录只在当前浏览器localStorage中保存，不会提交到GitHub。不同设备之间不自动同步，请通过JSON备份转移。定期导出，避免清理浏览器后丢失记录。请勿把自己的备份文件上传到公开仓库。

## 独立运行

没有OpenAI API、ChatGPT登录、付费AI模型、远程脚本或字体依赖。GitHub Pages托管无需ChatGPT会员。外部DW/Goethe课程仍依赖各自网站与网络。首次加载后，Service Worker可缓存本站页面供离线查看。

## GitHub Pages

公开仓库的Settings → Pages → Deploy from a branch → main → /docs → Save。

所有路径都是相对路径，支持项目子目录，例如 `https://你的用户名.github.io/deutsch-kompass/`。`docs/`已经包含可发布文件，不需要安装依赖或构建服务。也可以复制`docs/`到任意静态托管。

## 本地运行与维护

需要Node.js 20或更新版本，无需npm install。

```sh
npm start
npm test
npm run build
```

打开本地服务打印的地址。`content/grammar.mjs`、`content/goals.mjs`、`content/plan-source.json`是内容源；运行build更新`docs/content.js`。修改静态资源后请更新`docs/sw.js`的缓存版本。`docs/core.js`处理日程与评分规则，`docs/app.js`处理界面及本地记录。

## 内容边界与来源

语法等级为建议学习顺序，不是官方唯一语法大纲；语法地图覆盖主要领域，并通过IDS提供更深入的参考。CEFR目标为学习用中文摘要，不是官方译文。自评、完成率与微练习成绩不构成等级认证。90天计划是可调整的训练路线，不保证某一结果。

- [DW Nicos Weg](https://www.dw.com/nico)
- [Goethe A2练习材料](https://www.goethe.de/ins/de/de/prf/gzsd2/ub2.html)
- [Goethe B1练习材料](https://www.goethe.de/ins/de/de/prf/gzb1/ueb.html)
- [Council of Europe自评表](https://www.coe.int/en/web/portfolio/self-assessment-grid)
- [CEFR语言专属等级描述](https://www.coe.int/en/web/common-european-framework-reference-languages/reference-level-descriptions)
- [IDS grammis](https://grammis.ids-mannheim.de/systematische-grammatik)

只链接第三方课程、书籍和试题，不复制完整版权内容。本站代码与原创内容采用MIT许可，第三方材料保留各自权利。
