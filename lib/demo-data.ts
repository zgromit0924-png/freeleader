import { financialAnalysisFallback } from '@/lib/planning-engine';

export type TaskStatus = 'not_started' | 'submitted' | 'revision_required' | 'passed';

export const demoProject = {
  id: 'project-iflytek-demo',
  name: '科大讯飞资产质量与资本结构分析',
  course: '财务报表分析',
  status: 'collecting',
  finalDeadline: '2026-09-02T20:00:00+08:00',
  progress: 58,
  summary: '判断科大讯飞的资产能否支撑 AI 战略，并评估其融资结构与成长阶段是否匹配。',
  academicPolicy: {
    aiAllowed: true,
    allowExternalResearch: false,
    needDisclosure: true,
  },
};

export const demoMembers = ['王宁', '陈一', '林遥', '赵可', '周然', '宋言'];

export const demoDetailedPlan = financialAnalysisFallback({
  projectName: demoProject.name,
  course: demoProject.course,
  assignmentDescription: '选择一家上市公司，从资产质量和资本结构两个角度进行财务报表分析；需要行业对比、数据图表和课堂汇报。',
  memberNames: demoMembers,
  deadline: '2026-09-02 20:00',
});

const demoTaskState: Array<{ status: TaskStatus; deadline: string }> = [
  { status: 'passed', deadline: '9 月 1 日 18:00' },
  { status: 'revision_required', deadline: '9 月 1 日 22:00' },
  { status: 'passed', deadline: '9 月 1 日 22:00' },
  { status: 'submitted', deadline: '9 月 1 日 22:00' },
  { status: 'not_started', deadline: '9 月 1 日 22:00' },
  { status: 'submitted', deadline: '9 月 2 日 10:00' },
];

export const demoTasks = demoDetailedPlan.workPackages.map((workPackage, index) => ({
  ...workPackage,
  id: workPackage.id,
  owner: demoMembers[index] ?? '',
  initials: demoMembers[index]?.slice(0, 1) ?? '待',
  status: demoTaskState[index]?.status ?? 'not_started' as TaskStatus,
  deadline: demoTaskState[index]?.deadline ?? '9 月 1 日 22:00',
}));

export const demoMemberTask = {
  token: 'demo-chenyi',
  memberName: '陈一',
  projectName: demoProject.name,
  course: demoProject.course,
  task: demoTasks[1],
  leaderNote: '先把数据口径和来源核对清楚，表达是否漂亮放在第二步。遇到资料缺失可以直接在页面里提问。',
  latestReview: {
    status: 'revision_required',
    score: 72,
    summary: '框架完整，但固定资产金额存在 10 倍口径冲突，部分判断缺少可核验来源。',
  },
};

export const demoReview = {
  submissionId: 'submission-demo-1',
  memberName: '陈一',
  taskTitle: '应收账款深度分析',
  version: 2,
  score: 72,
  status: 'revision_required',
  criteria: [
    { label: '覆盖规模、账龄、周转与减值', status: 'pass', evidence: '正文包含应收账款规模、账龄结构、周转天数及坏账准备四部分。' },
    { label: '金额注明单位、年份和来源', status: 'fail', evidence: '固定资产原值同时出现 698.12 亿元与 69.81 亿元，且未解释单位差异。' },
    { label: '至少 2 家可比公司', status: 'pass', evidence: '使用用友网络、佳发教育、海康威视和百度进行横向比较。' },
    { label: '结论区分事实与推断', status: 'partial', evidence: '“未计提减值”等事实被直接推导为“不存在潜在风险”，需要降级表述。' },
  ],
  flags: [
    {
      severity: 'P0',
      title: '固定资产金额存在 10 倍口径冲突',
      detail: '同一份材料中，固定资产原值和净值分别出现 698.12 / 69.81 亿元、503.74 / 50.37 亿元两组口径。合并前必须回到年报核实单位。',
    },
    {
      severity: 'P1',
      title: '两份附件为完全重复文件',
      detail: '两份 Word 的 SHA-256 指纹一致（2b11633351b5…），不能计为两次独立贡献或两个版本。',
    },
    {
      severity: 'P2',
      title: '部分结论强于证据',
      detail: '“零减值”只能说明管理层未识别出减值，不足以证明资产不存在潜在风险。',
    },
  ],
};

export const demoIntegratedSections = [
  {
    id: 'S1', title: '1. 研究说明与公司战略背景',
    content: ['本报告围绕“资产配置与融资结构是否能够支撑公司人工智能战略”这一主线展开。分析不以单个财务指标的高低直接判断优劣，而是先确认业务与战略阶段，再依次检查资产的真实性、周转性、保值性和盈利支撑，最后评价资金来源、期限结构和偿付安全边界。', '为避免多人协作造成口径混乱，全文统一采用年度报告合并报表口径，金额单位统一为亿元。涉及同行比较时，必须使用同一年度、同一指标公式，并单独说明不可比因素。原始资料尚未给出页码的数字保留“来源待补”标记，不进入最终结论。'],
    contributors: ['王宁'], sourceWords: 1086,
  },
  {
    id: 'S2', title: '2. 资产总体结构与质量画像',
    content: ['资产总体分析的目的，是判断资源配置是否与商业模式和增长阶段相匹配，并识别需要深入检查的重点科目。成员提交将应收账款、开发支出、无形资产、商誉、固定资产和有息负债列为后续重点，原因分别涉及回款周期、研发投入会计处理、并购形成资产的减值风险、长期基础设施投入及资金期限匹配。', '现阶段可以形成的初步判断是：公司资产结构带有明显的技术研发和项目制业务特征，但“与战略方向一致”并不自动等于“资产质量良好”。最终评价仍需由周转效率、减值充分性、投入产出关系和经营现金回收共同支撑。'],
    contributors: ['王宁', '林遥'], sourceWords: 932,
  },
  {
    id: 'S3', title: '3. 应收账款与经营资产质量',
    content: ['成员提交显示，应收账款增速与营业收入增速之间存在需要进一步解释的差异。考虑到项目制业务从合同签订、实施验收到回款存在时间间隔，应收规模上升具有业务背景；但它同时意味着资金占用增加，不能仅凭客户类型或项目属性将其视为低风险。', '周转效率部分采用应收账款周转率和周转天数作为观察指标。现有稿件给出的 2024 年周转率为 1.74 次、周转天数约 210 天，但尚未补齐年报页码、平均余额公式和同行统一口径，因此本版把该数字作为“成员提交值”保留，不将其写成已确认事实。', '减值分析需要同时观察账龄迁移、坏账计提比例、前五名客户集中度及历史核销情况。最终结论应区分三层：报表披露的事实、结合业务模式作出的解释、仍需管理层或后续资料验证的风险判断。管理建议则应落到项目验收、催收节奏和长期账龄控制，而不是笼统提出“加强管理”。'],
    contributors: ['陈一', '宋言'], sourceWords: 1674,
  },
  {
    id: 'S4', title: '4. 研发投入、无形资产与商誉',
    content: ['技术型企业的研发投入既影响当期费用，也可能通过开发支出和无形资产影响未来期间。分析时需要将研发费用、资本化开发支出和形成的无形资产分开呈现，计算研发强度与资本化率，并说明会计处理对当期利润和后续摊销的影响。', '商誉分析不能停留在金额占比。成员稿建议继续追溯商誉形成的并购项目、相关资产组的经营表现、减值测试采用的增长率和折现率等关键参数。若资料不足，应将“尚未发现减值”表述为当前会计结果，而不是证明未来不存在风险。', '综合来看，研发和技术资产可能构成战略支撑，也可能带来资本化判断和减值测试的不确定性。最终稿应以投入产出、会计政策和减值迹象三组证据共同形成结论。'],
    contributors: ['林遥'], sourceWords: 1458,
  },
  {
    id: 'S5', title: '5. 固定资产及其他重点资产',
    content: ['成员提交认为，固定资产主要服务于研发空间、服务器及相关基础设施，配置方向与人工智能研发和产业化具有一定一致性。但资产用途与战略一致只能说明投入方向，是否高质量仍需通过折旧、周转、闲置、在建工程转固及减值迹象进一步验证。', '原始材料中出现两组相差 10 倍的固定资产数据：原值分别为 698.12 亿元和 69.81 亿元，净值分别为 503.74 亿元和 50.37 亿元。由于两组数字无法同时成立，本版完整保留冲突证据，但不使用其中任何一组计算周转率或作出效率判断，待负责人回到年报附注核实单位和小数点。', '“没有计提固定资产减值”只说明报表当前未确认减值损失，不能直接推导资产不存在潜在风险。后续仍需结合设备利用、技术迭代、项目停滞和可回收金额判断是否存在减值迹象。'],
    contributors: ['赵可', '陈一'], sourceWords: 1288,
  },
  {
    id: 'S6', title: '6. 资本结构与偿债安全',
    content: ['资本结构可以初步概括为“股权资本为基础、长期债务为补充”。对于仍处于投入和扩张阶段的科技企业，长期资金能够降低短期集中偿付压力，也有利于支持研发和基础设施投入；但结构是否合理，仍取决于新增投入能否逐步转化为收入、利润和经营现金流。', '偿债分析不能只看资产负债率。成员稿提出将经营负债与金融负债分开，进一步计算有息负债率、长期资本负债率和利息覆盖倍数，并将经营现金流作为交叉验证。若利润能够覆盖利息但现金回收持续偏弱，仍需回到应收账款和项目回款解释偿债安全边界。', '最终评价应联系公司成长阶段：较高的外部资金依赖不必然意味着结构恶化，较低杠杆也不必然意味着资金配置最优。关键在于期限匹配、融资成本和投入产出的组合关系。'],
    contributors: ['周然'], sourceWords: 1512,
  },
  {
    id: 'S7', title: '7. 行业对比与综合判断',
    content: ['行业比较的作用不是简单排名，而是识别差异来自经营模式、客户结构、研发阶段还是风险暴露。成员建议至少选择两家具有可比业务或客户结构的公司，并统一数据年份、金额单位和指标公式；对于业务差异较大的参照公司，应明确其只能用于某一指标而非整体对标。', '综合各章节，现阶段可以保留三类发现：第一，研发和长期资产投入方向与人工智能战略具有一致性；第二，应收账款和经营现金回收是资产质量判断的关键约束；第三，资本结构的合理性取决于长期资金能否覆盖长期投入并由未来现金流提供偿付支持。固定资产金额冲突、数据来源页码缺失等事项在核实前不能进入最终结论。'],
    contributors: ['宋言', '全组'], sourceWords: 1196,
  },
  {
    id: 'S8', title: '8. 结论、建议与附录',
    content: ['本报告当前形成的是可继续核验的整合草稿，而不是用流畅表达掩盖证据缺口的终稿。后续优先级依次为：核实固定资产单位和金额、补齐关键数据的年报页码、统一同行指标公式、完成图表编号与引用检查。', '建议层面，应收账款部分聚焦项目验收、回款节点和长期账龄；研发及技术资产部分聚焦资本化判断和投入产出追踪；资本结构部分聚焦长期资金匹配和现金流覆盖。每项建议都应能够回指前文数据，而不是脱离证据单独出现。', '附录将保留指标计算底稿、数据来源表、图表原文件、成员贡献与版本记录、AI 使用范围说明。完全重复的两个 Word 文件只计为一次有效内容来源，但重复提交行为仍写入审计记录。'],
    contributors: ['全组', '负责人'], sourceWords: 846,
  },
];

export const duplicateFixture = {
  fileA: '其他组员上交的作业.docx',
  fileB: '其他组员上交的作业 (1).docx',
  sha256: '2b11633351b5',
  relation: 'byte_identical',
};
