export type OutlineNode = {
  id: string;
  title: string;
  purpose: string;
  keyQuestions: string[];
  requiredEvidence: string[];
  suggestedVisuals: string[];
  children: Array<{ id: string; title: string; requirement: string }>;
};

export type WorkPackage = {
  id: string;
  title: string;
  outlineSectionIds: string[];
  objective: string;
  context: string;
  workSteps: string[];
  dataChecklist: string[];
  expectedOutput: string;
  outputStructure: string[];
  acceptanceCriteria: string[];
  dependencies: string[];
  difficulty: '基础' | '进阶' | '综合';
  estimatedHours: number;
  suggestedOwnerIndex: number | null;
};

export type ProjectPlan = {
  assignmentUnderstanding: {
    finalDeliverable: string;
    audience: string;
    coreQuestion: string;
    hardConstraints: string[];
    qualityRisks: string[];
  };
  outline: OutlineNode[];
  workPackages: WorkPackage[];
  assemblyRules: string[];
  generatedBy: string;
};

type PlanInput = {
  projectName: string;
  course: string;
  assignmentDescription: string;
  memberNames: string[];
  deadline: string;
};

type OpenAIBindings = { OPENAI_API_KEY?: string; OPENAI_MODEL?: string };

export const PLANNING_SYSTEM_PROMPT = `你是 FreeLeader 的“课程作业总策划”，不是一句话任务摘要器。

你的工作必须严格按两个阶段完成：
第一阶段：先设计整个小组最终要提交的完整成果结构；第二阶段：再按照成员人数，把结构拆成可独立执行、可验收、最后能无损拼回总稿的工作包。不得先分人再凑大纲。

【大纲要求】
1. 输出 6–10 个一级章节；每个一级章节必须给出写作目的、要回答的核心问题、证据/数据要求、建议图表，以及 2–5 个二级小节。
2. 大纲必须覆盖：任务背景与范围、分析方法或理论框架、主体分析、比较/论证、综合结论、建议、参考资料与附录。根据课程类型调整名称，但不得丢失这些功能。
3. 明确最终交付物面向谁、解决什么问题、有哪些硬性格式或学术规范。
4. 不得虚构老师没有给出的事实、数据、文献、页码或结论。缺失信息写成“待核实清单”。

【工作包要求】
1. 工作包数量通常等于成员数；内容跨度大时可以多于成员数，但必须说明可以一人认领多个。
2. 每个工作包必须映射到一个或多个大纲节点，不能出现“写一下某某分析”这种空泛描述。
3. 每个工作包必须包含：任务目标、上下文、至少 4 个执行步骤、资料与数据清单、量化的预期交付物、建议输出结构、至少 4 条可客观检查的验收标准、前置依赖、预计用时和难度。
4. 验收标准必须能逐条判断是否完成，优先使用数量、范围、口径、来源、格式和结论边界，避免“内容完整”“分析深入”等模糊措辞。
5. 给出建议负责人序号只是用于自动均衡分配；系统还会允许组长手动分配或成员自行认领。

【整合要求】
1. 最终整合不得把成员全文压缩成几句话。应保留通过验收的原文段落，按大纲节点归位，只删除完全重复内容。
2. 事实冲突并列保留并标记待核实；不得擅自选择一个数字。
3. 输出 4–8 条整合规则，说明标题层级、术语、单位、引用、图表编号、重复与冲突如何处理。

只返回符合 JSON Schema 的数据。`;

const PLAN_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['assignmentUnderstanding', 'outline', 'workPackages', 'assemblyRules'],
  properties: {
    assignmentUnderstanding: {
      type: 'object', additionalProperties: false,
      required: ['finalDeliverable', 'audience', 'coreQuestion', 'hardConstraints', 'qualityRisks'],
      properties: {
        finalDeliverable: { type: 'string' }, audience: { type: 'string' }, coreQuestion: { type: 'string' },
        hardConstraints: { type: 'array', items: { type: 'string' } }, qualityRisks: { type: 'array', items: { type: 'string' } },
      },
    },
    outline: { type: 'array', minItems: 6, maxItems: 10, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'title', 'purpose', 'keyQuestions', 'requiredEvidence', 'suggestedVisuals', 'children'],
      properties: {
        id: { type: 'string' }, title: { type: 'string' }, purpose: { type: 'string' },
        keyQuestions: { type: 'array', items: { type: 'string' } }, requiredEvidence: { type: 'array', items: { type: 'string' } },
        suggestedVisuals: { type: 'array', items: { type: 'string' } },
        children: { type: 'array', minItems: 2, items: { type: 'object', additionalProperties: false, required: ['id', 'title', 'requirement'], properties: { id: { type: 'string' }, title: { type: 'string' }, requirement: { type: 'string' } } } },
      },
    } },
    workPackages: { type: 'array', minItems: 1, items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'title', 'outlineSectionIds', 'objective', 'context', 'workSteps', 'dataChecklist', 'expectedOutput', 'outputStructure', 'acceptanceCriteria', 'dependencies', 'difficulty', 'estimatedHours', 'suggestedOwnerIndex'],
      properties: {
        id: { type: 'string' }, title: { type: 'string' }, outlineSectionIds: { type: 'array', items: { type: 'string' } }, objective: { type: 'string' }, context: { type: 'string' },
        workSteps: { type: 'array', minItems: 4, items: { type: 'string' } }, dataChecklist: { type: 'array', items: { type: 'string' } }, expectedOutput: { type: 'string' },
        outputStructure: { type: 'array', items: { type: 'string' } }, acceptanceCriteria: { type: 'array', minItems: 4, items: { type: 'string' } }, dependencies: { type: 'array', items: { type: 'string' } },
        difficulty: { type: 'string', enum: ['基础', '进阶', '综合'] }, estimatedHours: { type: 'number' }, suggestedOwnerIndex: { type: ['integer', 'null'] },
      },
    } },
    assemblyRules: { type: 'array', minItems: 4, items: { type: 'string' } },
  },
} as const;

export async function generateProjectPlan(bindings: OpenAIBindings, input: PlanInput): Promise<ProjectPlan> {
  if (!bindings.OPENAI_API_KEY) return financialAnalysisFallback(input);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${bindings.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: bindings.OPENAI_MODEL ?? 'gpt-5.4', store: false,
        instructions: PLANNING_SYSTEM_PROMPT,
        input: JSON.stringify(input),
        text: { format: { type: 'json_schema', name: 'freeleader_project_plan', strict: true, schema: PLAN_SCHEMA } },
      }),
    });
    if (!response.ok) return financialAnalysisFallback(input);
    const data = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; model?: string };
    const outputText = data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
    if (!outputText) return financialAnalysisFallback(input);
    return { ...(JSON.parse(outputText) as Omit<ProjectPlan, 'generatedBy'>), generatedBy: data.model ?? bindings.OPENAI_MODEL ?? 'gpt-5.4' };
  } catch {
    return financialAnalysisFallback(input);
  }
}

export function financialAnalysisFallback(input: PlanInput): ProjectPlan {
  const company = input.projectName.replace(/资产质量.*$/, '').trim() || '目标公司';
  const outline: OutlineNode[] = [
    node('S1', '研究说明与公司战略背景', '交代分析对象、报告口径和为什么要从资产质量与资本结构切入。', ['公司处于什么业务与战略阶段？', '报告使用什么年份、单位和可比口径？'], ['老师任务原文', '公司年报与官网战略表述', '统一的分析期间与货币单位'], ['报告研究路线图', '核心问题框架图'], [['S1.1', '任务范围与交付要求', '逐条转写老师的要求并标明对应章节。'], ['S1.2', '公司业务与战略定位', '只使用可追溯资料概括业务结构与战略重点。'], ['S1.3', '分析口径与核心问题', '统一年份、单位、合并口径和可比公司选择标准。']]),
    node('S2', '资产总体结构与质量画像', '先建立资产全景，再决定哪些科目需要深入分析。', ['资产结构是否匹配商业模式？', '增长主要由哪些资产项目驱动？'], ['近 3 年资产负债表', '各资产项目占比与增速', '营业收入和经营现金流'], ['资产结构堆叠图', '资产增速与收入增速对比图'], [['S2.1', '资产规模与结构趋势', '计算近三年主要资产占比和变动。'], ['S2.2', '资产质量初步诊断', '从真实性、周转性、保值性和盈利性形成问题清单。'], ['S2.3', '重点科目选择理由', '说明为何选择应收、研发、商誉、固定资产等继续分析。']]),
    node('S3', '应收账款与经营资产质量', '判断收入增长是否转化为可回收现金，并识别客户与账龄风险。', ['应收增速是否高于收入？', '账龄、坏账准备和周转效率反映什么？'], ['近 3 年应收账款、收入、坏账准备', '账龄结构与客户集中度', '至少 2 家可比公司同口径指标'], ['应收与收入增速对比', '账龄结构图', '同行周转率对比'], [['S3.1', '规模与增长匹配', '比较应收、收入和经营现金流的变化。'], ['S3.2', '账龄与减值充分性', '分析账龄迁移、坏账政策和计提覆盖。'], ['S3.3', '周转效率与同行比较', '统一年份和公式后比较周转率/周转天数。'], ['S3.4', '风险判断与管理建议', '区分事实、解释和建议，不把单一指标直接等同于结论。']]),
    node('S4', '研发投入、无形资产与商誉', '评价技术投入的会计呈现、利润影响及未来减值风险。', ['研发资本化率是否合理？', '商誉和无形资产是否有减值压力？'], ['研发费用与开发支出附注', '无形资产增减变动', '商誉形成原因与减值测试参数'], ['研发投入趋势图', '资本化率对比图', '商誉构成表'], [['S4.1', '研发投入与资本化', '计算研发强度和资本化率并解释利润影响。'], ['S4.2', '无形资产构成与摊销', '说明核心类别、使用年限和摊销政策。'], ['S4.3', '商誉形成与减值测试', '核对被并购单位、账面价值和关键参数。'], ['S4.4', '技术资产质量结论', '结合投入产出和会计政策给出有边界的判断。']]),
    node('S5', '固定资产及其他重点资产', '检查长期资产配置是否服务战略、使用效率如何、是否存在减值信号。', ['固定资产投入方向是否与战略一致？', '周转效率和减值迹象如何？'], ['固定资产原值、净值、折旧和在建工程', '其他应收款、存货等异常变动项目', '年报附注页码与金额单位'], ['固定资产构成图', '原值—净值—折旧勾稽表'], [['S5.1', '固定资产构成与变动', '核对原值、净值、折旧、处置和在建转固。'], ['S5.2', '利用效率与战略匹配', '结合收入或业务规模评价投入产出。'], ['S5.3', '减值与其他资产风险', '不得用“未计提减值”直接证明不存在风险。']]),
    node('S6', '资本结构与偿债安全', '评价资金来源、期限结构、融资成本及现金流覆盖能力。', ['长期资金是否覆盖长期资产？', '债务成本和偿付压力是否可控？'], ['近 3 年负债结构', '有息负债、利息费用与现金流', '权益变动与融资活动'], ['负债期限结构图', '利息覆盖倍数趋势', '长期资金匹配表'], [['S6.1', '股权与债务来源结构', '区分经营负债、金融负债和权益资本。'], ['S6.2', '期限与资产匹配', '比较长期资金、长期资产和短期偿付需求。'], ['S6.3', '融资成本与偿债能力', '计算利息覆盖倍数并结合现金流判断。'], ['S6.4', '资本结构阶段性评价', '联系成长阶段评价而非简单判断杠杆高低。']]),
    node('S7', '行业对比与综合判断', '统一口径比较可比公司，并把分散发现汇总为一致结论。', ['差异来自经营模式还是风险？', '资产质量与资本结构是否相互匹配？'], ['2–4 家可比公司同年度数据', '统一指标公式和单位', '前述章节的已核实结论'], ['同行指标矩阵', '风险—支撑因素二维图'], [['S7.1', '可比公司选择与口径', '说明选择逻辑和不可比因素。'], ['S7.2', '核心指标横向比较', '同表呈现资产、周转、研发和杠杆指标。'], ['S7.3', '战略差异解释', '解释差异而不只做高低排名。'], ['S7.4', '综合评价', '形成优势、风险与待验证事项三张清单。']]),
    node('S8', '结论、建议与附录', '形成可直接提交和汇报的结论，并保证引用、图表和计算可回溯。', ['最重要的三个结论是什么？', '建议能否对应前文证据？'], ['各章节通过验收的结论', '数据来源清单', '计算底稿与 AI 使用说明'], ['结论摘要页', '建议优先级矩阵'], [['S8.1', '核心结论', '每条结论标注支撑章节与证据。'], ['S8.2', '风险与建议', '建议对应责任对象、行动和优先级。'], ['S8.3', '参考资料', '统一列示年报、公告、行业资料和访问日期。'], ['S8.4', '附录与贡献说明', '附计算口径、原始表格、分工和 AI 使用边界。']]),
  ];
  const names = input.memberNames.length ? input.memberNames : ['成员 1', '成员 2', '成员 3', '成员 4', '成员 5', '成员 6'];
  const workPackages: WorkPackage[] = [
    work('W1', '研究框架、公司战略与统一口径', ['S1', 'S2'], '为全组建立统一研究边界、数据口径和资产全景，避免后续章节各用各的年份与单位。', ['逐条拆解老师要求并建立“要求—章节”对应表', '整理公司业务、收入来源和战略重点，只保留可核验表述', '下载近三年年报，统一合并口径、金额单位和指标公式', '制作资产结构表并提出 3–5 个需要其他成员验证的问题'], ['老师任务原文', '近三年年度报告', '主营业务构成', '资产负债表与现金流量表'], '900–1200 字正文；1 张研究框架图；1 张三年资产结构表；1 份全组统一口径清单', ['任务要求对应表', '公司与战略背景', '分析口径', '资产全景', '待验证问题'], ['老师的每项要求至少映射到一个章节', '所有数据注明年份、单位、合并/母公司口径和来源页码', '至少提出 3 个能被后文回答的核心问题', '口径清单覆盖周转率、研发资本化率、利息覆盖倍数等公式'], [], '综合', 5, 0),
    work('W2', '应收账款与经营资产质量', ['S3'], '判断收入增长的含金量、回款压力和减值充分性，为资产质量结论提供核心证据。', ['提取近三年应收账款、收入、坏账准备和经营现金流', '计算应收增速、收入增速、应收占收入比、周转率和周转天数', '拆分账龄结构、客户集中度和坏账计提比例', '选择至少 2 家同行，统一公式与年度后比较', '按“事实—原因解释—风险判断—建议”完成正文'], ['应收账款及坏账准备附注', '账龄组合与计提比例', '前五名客户', '营业收入与经营现金流', '同行年报同口径数据'], '1400–1800 字；3 张图表；1 张指标计算底稿；不少于 5 条带来源的数据结论', ['口径说明', '规模与增长', '账龄与减值', '周转与同行', '风险及建议'], ['覆盖近 3 年且所有金额可回溯到年报页码', '周转指标写明公式并与同行使用同一口径', '至少 2 家可比公司，说明选择理由', '每个风险判断至少引用一项数据证据', '不得把客户性质直接等同于低风险'], ['依赖 W1 的统一口径和可比公司范围'], '进阶', 7, 1),
    work('W3', '研发投入、开发支出、无形资产与商誉', ['S4'], '评价技术投入如何进入报表、对利润产生什么影响，以及相关资产是否存在减值风险。', ['提取近三年研发费用、开发支出和研发人员等信息', '计算研发强度与资本化率并核对会计政策', '整理无形资产类别、摊销年限及增减变动', '追溯商誉形成项目、账面价值和减值测试关键参数', '比较会计处理对当期利润和未来费用的影响'], ['研发投入与开发支出附注', '无形资产明细', '商誉及减值测试附注', '同行研发口径'], '1400–1800 字；2–3 张图表；1 张会计政策影响表；1 份减值风险清单', ['研发投入趋势', '资本化分析', '无形资产质量', '商誉减值', '综合判断'], ['研发费用与开发支出分开呈现，不混用口径', '资本化率提供公式、分子分母和年份', '商誉分析至少覆盖形成原因、金额和关键测试参数', '明确区分会计事实、分析推断和待核实信息', '至少有 2 条对利润或资产质量的影响分析'], ['依赖 W1 的年份、单位与公司范围'], '进阶', 7, 2),
    work('W4', '固定资产、在建工程与其他重点资产', ['S5'], '核对长期资产真实规模和利用效率，解释其与 AI 战略的关系并识别减值信号。', ['从年报附注核对固定资产原值、净值、折旧和减值金额', '检查在建工程新增、转固与异常停滞项目', '计算固定资产周转率并结合业务增长解释', '扫描存货、其他应收款等异常变动资产并选择重点项', '建立“原值—累计折旧—减值—净值”勾稽表'], ['固定资产分类附注', '在建工程附注', '资产减值政策', '营业收入', '异常变动资产明细'], '1100–1500 字；2 张图表；1 张金额勾稽表；1 份待核实清单', ['资产构成', '变动与效率', '战略匹配', '减值迹象', '其他资产风险'], ['固定资产原值、净值和累计折旧能够勾稽', '亿元/万元单位统一，正文不存在 10 倍口径冲突', '未计提减值只作为事实，不直接推导“零风险”', '至少解释 1 项资产投入与业务战略的关系', '异常数据标记来源和核实状态'], ['依赖 W1 的统一口径'], '进阶', 6, 3),
    work('W5', '资本结构、期限匹配与偿债能力', ['S6'], '判断资金来源是否稳定、期限是否匹配、盈利和现金流能否覆盖融资成本。', ['拆分近三年经营负债、短期有息债务、长期债务和权益资本', '计算资产负债率、有息负债率、长期资本负债率', '比较长期资金与长期资产，判断期限匹配', '计算利息覆盖倍数并结合经营现金流交叉验证', '联系公司成长阶段解释结构合理性和风险边界'], ['负债项目附注', '借款期限和利率', '利息费用', '所有者权益变动', '经营现金流'], '1400–1800 字；3 张图表；1 张债务期限与成本表；不少于 4 条结论', ['资本来源', '债务期限', '融资成本', '偿债能力', '阶段性评价'], ['至少覆盖连续 3 个年度', '经营负债与金融负债分开分析', '利息覆盖倍数写明利润口径和利息口径', '债务期限与长期资产进行匹配分析', '每项建议与具体风险证据对应'], ['依赖 W1 的口径；向 W6 提供统一指标表'], '进阶', 7, 4),
    work('W6', '行业比较、综合结论与最终交付检查', ['S7', 'S8'], '把各章节结论放到统一同行坐标中，形成能直接用于报告结尾和课堂汇报的综合判断。', ['确定 2–4 家可比公司并记录选择理由和不可比因素', '收集前五个工作包的核心指标，统一年份、单位和公式', '制作横向指标矩阵并解释战略/商业模式差异', '提炼优势、风险、待核实事项和建议优先级', '检查引用、图表编号、术语、贡献说明和 AI 使用说明'], ['各成员通过验收的指标表', '可比公司年报', '全稿引用清单', '图表和计算底稿'], '1200–1600 字；2 张综合对比图；1 页执行摘要；1 份终稿检查清单；8–10 页汇报提纲', ['可比口径', '横向比较', '综合评价', '建议优先级', '结论与交付检查'], ['同行指标全部使用同年度、同公式和同单位', '至少解释 3 项差异背后的业务原因', '综合结论能回指前文具体章节和证据', '风险、优势、建议分别列示，不相互混淆', '参考资料、图表编号、贡献和 AI 声明完整'], ['依赖 W1–W5 的已核实结论与底稿'], '综合', 8, 5),
  ].map((item, index) => ({ ...item, suggestedOwnerIndex: index < names.length ? index : index % names.length }));
  return {
    assignmentUnderstanding: {
      finalDeliverable: `一份围绕${company}资产质量与资本结构的完整分析报告，并配套课堂汇报材料、数据底稿和参考资料清单。`,
      audience: '课程教师及课堂听众',
      coreQuestion: `${company}的资产配置、资产质量和融资结构是否与其战略及成长阶段相匹配，主要支撑因素和风险边界是什么？`,
      hardConstraints: ['覆盖资产质量与资本结构两个主题', '包含行业比较、数据图表和课堂汇报', '数据必须注明年份、单位、口径和来源', `最终截止时间：${input.deadline}`],
      qualityRisks: ['不同成员使用的年份、单位和公式不一致', '成员分别下结论但缺少同一分析主线', '把“未计提减值”等会计事实扩大为绝对判断', '整合时过度摘要，丢失成员证据、图表与推理过程'],
    },
    outline,
    workPackages,
    assemblyRules: ['通过验收的成员正文按大纲节点原段落归位，不压缩成一句摘要', '只有文件指纹或段落规范化后完全相同时才删除重复内容', '事实或金额冲突并列保留并标记“待负责人核实”，不得自行二选一', '统一标题层级、公司简称、年度、货币单位和指标公式', '每张图表保留制作者、数据来源、期间和口径', '每段保留贡献成员与提交版本，改写和删除均写入记录', '综合结论只能引用已通过验收或经负责人确认的内容'],
    generatedBy: 'FreeLeader 详细规划规则引擎',
  };
}

function node(id: string, title: string, purpose: string, keyQuestions: string[], requiredEvidence: string[], suggestedVisuals: string[], children: Array<[string, string, string]>): OutlineNode {
  return { id, title, purpose, keyQuestions, requiredEvidence, suggestedVisuals, children: children.map(([childId, childTitle, requirement]) => ({ id: childId, title: childTitle, requirement })) };
}

function work(id: string, title: string, outlineSectionIds: string[], objective: string, workSteps: string[], dataChecklist: string[], expectedOutput: string, outputStructure: string[], acceptanceCriteria: string[], dependencies: string[], difficulty: WorkPackage['difficulty'], estimatedHours: number, suggestedOwnerIndex: number): WorkPackage {
  return { id, title, outlineSectionIds, objective, context: `本任务对应总稿 ${outlineSectionIds.join('、')}，提交后将按这些节点直接归入整合稿。`, workSteps, dataChecklist, expectedOutput, outputStructure, acceptanceCriteria, dependencies, difficulty, estimatedHours, suggestedOwnerIndex };
}
