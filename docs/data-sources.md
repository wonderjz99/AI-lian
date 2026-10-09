# 信息源与后续更新备忘

最后核对：2026-10-09。第一版仍为固定 JSON；记录信息源不代表已接入 API，也不承诺完整新闻覆盖。

## 已实际核对并使用

| 来源 | 适合的内容 | 已查证入口 / 示例 | 注意 |
| --- | --- | --- | --- |
| 公司公告、官网与博客 | 身份、产品、合作、具体事件 | [华为云合作公告](https://www.huaweicloud.com/news/2025/20250430105950892.html)、[硅基流动新闻](https://siliconflow.cn/news)、[腾讯新闻](https://www.tencent.com/tencent-hunyuan-officially-releases-hy3-advancing-agent-capabilities-and-deeper-product-integration/) | 公司自述可证明宣布事项；性能和效果不要改写成独立验证结论 |
| 公司投资者关系与年报 | 控股、投资、持股日期、集团范围 | [阿里年报指定页](https://static.alibabagroup.com/reports/fy2024/ar/ebook/EN/87/index.html)、[阿里 2026 财年业绩](https://www.alibabagroup.com/en-US/document-1991364841188622336) | 历史投资比例不等于当前比例；不要从比例推断控制权 |
| 港交所披露易 | 香港上市主体的公告与报告 | [阿里 2024 财年年报](https://www.hkexnews.hk/listedco/listconews/sehk/2024/0523/2024052301569.pdf) | PDF 页码、实际公告日期及发行主体要对应 |
| 上交所披露 | A 股公司正式报告 | [金山办公 2025 半年报](https://star.sse.com.cn/disclosure/listedinfo/announcement/c/new/2025-08-21/688111_20250821_5E8F.pdf) | 已发现此入口，控股字段仍需逐页核对后才进入关系文件 |
| SEC EDGAR | 在美上市集团的投资与会计口径 | [阿里 2025 年 20-F](https://www.sec.gov/Archives/edgar/data/1577552/000095017025090161/baba-20250331.htm) | 已发现报告；美股 ADS 与港股不能当成不同公司，也不能直接加总各渠道总市值 |

## 访问经验

- 金山软件 IR 中文首页在本次网页读取中返回 401。检索摘要可定位材料，但正式资本关系优先改查年报、交易所报告或其他可读官方页面。
- 硅基流动新闻页部分条目缺少可点击的链接，不能用列表页的发布时间猜测独立文章地址。优先搜索完整标题，打开文章确认日期与内容。
- 模型平台“上架开源模型”可以是共同报道，但不能单独证明其与模型开发公司存在采购或战略合作。
- 搜索结果与页面日期可能不同，事件发生日与报道发表日分别记录。

## 后续 API 候选

以下只记候选方向，尚未核对套餐、许可、接口稳定性或接入成本；正式选型时重新查官方文档，不作为当前可用能力。

| 候选 | 后续用途 | 接入前要确认 |
| --- | --- | --- |
| 富途 OpenAPI / OpenD | 上市公司行情快照、可能的资讯查询 | 市场权限、历史快照可用性、公司总市值的 A/H/ADS 口径；本项目当前未连接 |
| SEC data.sec.gov 公共接口 | EDGAR 提交记录、报告定位 | 官方访问规则、User-Agent、速率与 CORS；适合离线采集，不让浏览器逐次请求 |
| 巨潮资讯及交易所披露入口 | A 股公告与报告 | 公开下载方式、服务条款、是否存在适合授权接入的接口；不依赖未公开接口 |
| 公司官方 RSS / 新闻订阅 | 低频更新候选新闻 | 是否真实提供 feed、转载权限、去重与时间字段 |

## 将来更新流程

### 2026-10-09 搜索接口评估

用户拟使用火山引擎豆包搜索，作为下一阶段优先评估的候选；尚未开通、接入或实测，不改变第一版固定资料范围。

- 官方 [豆包搜索能力说明](https://docs.volcengine.com/docs/ark/agent-plan-personal-search?lang=zh)：介绍结构化标题、来源站点、URL、摘要 / 正文、时间筛选和权威来源过滤，适合新闻候选发现。字段完整性和中文公司召回质量需实际测试。
- 官方 [Global 版接口](https://docs.volcengine.com/docs/Networkedsearch/doubao-search-global-edition?lang=zh) 与 [计费说明](https://docs.volcengine.com/docs/Networkedsearch/Onlinesearchproductbilling?lang=zh)：搜索有 Global / Custom 等版本和不同计费方式；接入前确认控制台所开通版本、对应 Key、调用限额与结果保存 / 展示许可。文档核对日期 2026-10-09，当前未发生费用，不记录为已购买服务。
- 官方 [方舟联网搜索工具](https://docs.volcengine.com/docs/ark/web-search?lang=en)：还可通过模型 Responses / Messages 工具调用搜索。这与独立搜索采集的调用方式不同；本项目优先评估直接获取可追溯结果的搜索接口，暂不新增模型问答功能。
- 建议先选 10 家模型 / 硬件公司，用约 30 条中文公司及双公司查询，核对原文可访问性、原始日期、实质相关性、去重比例及调用成本。搜索摘要和供应商权威分数不能直接作为正式关系证据。
- 通过试采后再实施本地 SQLite 候选库、核对状态和 JSON 导出；由本地采集脚本读取环境变量中的 Key，网页仍展示审核后的静态快照。先手动触发，不新增定时任务。

其他已查证文档候选：[Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search)、[Exa Search](https://exa.ai/docs/reference/search)。均未实测、未接入；现阶段不需要同时开通多个供应商。

发现来源 → 保存候选 → 核对公司身份、日期和原文 → 合并事件 → 仅对明确关系建立连线 → 校验 JSON → 重新构建。采集和编辑在构建前完成，第一版浏览器不需要密钥或外部 API。

新增候选时至少记录名称、官方链接、用途、查证日期、是否实际测试、认证与费用、许可限制、字段口径及失败情况。

## 后续本地数据库计划

2026-10-08 用户提出新闻的本地持久化。当前实际存储仍为 `src/data/*.json`，没有 SQLite 或其他数据库，也没有采集任务。

新闻量增加、开始重复采集时，新增构建前的本地 SQLite 资料库。建议分开保存：

- 来源：稳定 ID、网站 / API、许可与访问经验。
- 报道：规范 URL、来源、原始发布时间、查阅时间、标题、摘要、内容指纹和采集状态。
- 事件及公司关联：同一事件合并多篇报道；保留人工核对状态和共同报道的实质相关性。
- 关系与证据：明确类型、方向、状态、确认日及证据引用；候选关系和已核实关系分开。
- 导出快照：版本、截止日、数据校验结果与生成文件；能追溯网页采用了哪批资料。

流程为「采集候选 → SQLite 去重与整理 → 核对证据 → 导出 JSON → 校验 → 静态构建」。SQLite 不直接暴露到网页，第一版不新增运行时服务器。数据库迁移与现有 JSON 导入在该阶段一起实施；当前暂不增加 ORM、任务队列或在线编辑后台。

## 本次扩充发现与核对结果

- 港股模型 / GPU 身份：智谱 [IR](https://www.zhipuai.cn/investor_relations/) 确认 02513；MiniMax [配售结果](https://www.hkexnews.hk/listedco/listconews/sehk/2026/0108/2026010801343_c.pdf) 确认 00100；壁仞 [公司介绍](https://www.birentech.com/about) 确认 06082。上市日期与查阅日期分开，不按过去的未上市印象分类。
- 市值：采用 [淡马锡 2026 投资组合披露](https://www.temasek.com.sg/en/our-investments/our-portfolio.) 中腾讯 2026-03-31 总市值 727.3 billion SGD，注释 2 说明是公司总市值而非淡马锡持仓价值。使用 [法国央行同日汇率](https://www.banque-france.fr/fr/statistiques/taux-et-cours/taux-de-change-parites-quotidiennes-2026-03-31) 的 EUR/CNY 7.9341 与 EUR/SGD 1.4811 交叉相除。来源已取整，页面显示约值；这不是最新实时市值。其余公司尚无同日已核对值，全部保留 null。
- Yahoo Finance 港股 key-statistics 页面本次读取失败，没有用于填数。港交所年度统计页主要是市场汇总，不能把成交额、港股流通部分或全市场总值填成公司的总市值。
- 零一万物 [公开平台公告](https://platform.lingyiwanwu.com/) 于 2026-08-03 宣布 2026-09-03 停止公开模型体验及 API；不要再将该公开 API 当作可接入候选。这不代表其企业服务停业。
- UCloud 官方客户名单可证明其向各客户提供过训练推理服务，不能推导名单中两个客户互相合作。当前共同事件只标注 UCloud 与智谱；出门问问的历史服务关系另有相同原文证据。
- 金山系资料作为发现记录保留，不进入第一版公司数据；金山系与金蝶是用户明确暂缓的名单。

- [金鼎资本参投公告（2026-06-22）](https://jindingcapital.com.cn/news/id/240)：作为同轮投资方披露硅基流动 B 轮的壁仞、商汤战投参与情况，可建立集团战投至硅基流动的参股线；未披露具体持股实体与比例，不把融资金额写成估值，也不推导壁仞与商汤互相投资。
- 摩尔线程与硅基流动的联合白皮书能证明联合技术工作，未找到明确战略合作协议，正式战略关系线已移除；新闻仍保留。华为与讯飞则额外核对了 [2025-03-04 官方文章](https://e.huawei.com/cn/news/2025/industries/government/global-smart-village-model-site) 中明确的战略伙伴表述。

## 2026-10-09 新闻与资本补充

使用会话自带搜索与原文读取完成，无付费搜索 API 或模型调用。新增 11 篇来源、11 个事件、8 条投资关系；公司数量保持 36 家。截止日推进至 2026-10-09，近期窗口从 2026-04-09 起，较早资料保留为历史依据。未对每家公司完成全量新闻或全部股东核查。

| 已使用来源 | 导入内容 | 口径与限制 |
| --- | --- | --- |
| [智谱融资披露](https://www.zhipuai.cn/zh/news/73) | 阿里、腾讯各自投向智谱的两条边 | 按页面显示的 2024-04-28 记发表日；是累计融资披露，未给各轮完成日、实体或当前持股。两名投资方彼此无资本边 |
| [联想创投算力布局](https://capital.lenovo.com/news/detail/id/1220/s/1.html) | 联想创投对寒武纪、海光、摩尔线程及沐曦的投资经历 | 2026-07-31 是披露日，不是四次投资的交易日；创投业务映射到集团，当前持股与退出情况未知。布局报道关联投资方与四名被投企业，并明确不是被投公司共同业务，彼此无商业连线 |
| [沐曦上市投资方披露](https://capital.lenovo.com/news/detail/id/1164/s/1.html) | 沐曦上市、早期投资及加注经历 | 2025-12-17；只知首次投资为 2021 年，不补造完整日期。上市时点市值不进入统一日期快照 |
| [联想创投负责人访谈](https://capital.lenovo.com/news/detail/id/1107/s/3.html) | 对阶跃星辰的投资 | 官网转载钛媒体创投家，2025-05-23；明确“投资”表述才建边，不从其他泛泛公司名单建边 |
| [MiniMax 阿里系股东 Form 2](https://di.hkex.com.hk/di/NSForm2.aspx?fn=CS20260722E00417) | 阿里旗下 Alisoft China Holding 持股记录及配售稀释新闻 | 2026-07-22 申报，相关事件日 2026-07-14；39,662,627 股为 A 类普通股。17.06% → 14.79% 的分母为该类别，故全公司持股比例字段为 null；状态只对应披露时点 |
| [壁仞适配智谱](https://sgc-prod.birentech.com/news/egy64w6zdtrkwy3pxr7hxpo4/)、[壁仞适配 MiniMax H3](https://sgc-prod.birentech.com/news/ru2ys8b19otru83zfqd7rp5q/) | 两条硬件 × 模型共同报道 | 分别发表于 2026-09-07、2026-08-03；适配与验证是发布方自述，不单独证明采购、战略合作或投资 |
| [摩尔线程 DeepSeek 适配](https://www.mthreads.com/news/347)、[MTT AICUBE](https://www.mthreads.com/news/311)、[官方新闻列表](https://mthreads.com/news) | 适配与产品发布；列表列示的智谱适配 | 独立页标题 / 日期可读，但技术正文未展开；智谱适配详情读取失败，列表确认 2026-08-27。只收录标题支持的事项，不补写参数或性能 |
| [智谱研究列表](https://www.zhipuai.cn/zh/research) | GLM-5.3-Flash 发布信息 | 列表明确 2026-08-26，详情正文读取失败；不录入未读到的评测或规格 |
| [摩尔线程上市公告](https://mthreads.com/news/266) | 补齐证券身份 688795 | 2025-12-05 科创板上市；仍使用同一公司节点，市值保持 null |

后续优先复用的公开入口：联想创投新闻、港交所 [权益披露](https://di.hkex.com.hk/di/NSForm2.aspx?fn=CS20260722E00417)、壁仞新闻、摩尔线程新闻及智谱研究。权益披露适合更新指定股东的持股时点，但不等于完整股东名册或付费行情 API。MiniMax 2025 年报也已定位，当前资本边采用更新的 7 月 Form 2，未另行增加云服务关系或重复报道。
