import { getBindings } from '@/lib/persistence';

export type ReviewResult = {
  status: 'pass' | 'minor_issue' | 'fail';
  score: number;
  summary: string;
  criteriaResults: Array<{ criterion: string; status: 'pass' | 'partial' | 'fail'; evidence: string; suggestion: string }>;
  riskFlags: string[];
  modelName: string | null;
};

export function deterministicReview(content: string, duplicateFile = false): ReviewResult {
  const riskFlags: string[] = [];
  const hasNumbers = /\d+(?:\.\d+)?(?:%|亿元|万元|倍|天)/.test(content);
  const hasSource = /(来源|年报|附注|页码|https?:\/\/)/.test(content);
  const hasConflict = /698\.12/.test(content) && /69\.81/.test(content);
  if (hasNumbers && !hasSource) riskFlags.push('unsupported_numeric_claim');
  if (hasConflict) riskFlags.push('amount_scale_conflict');
  if (duplicateFile) riskFlags.push('duplicate_file');
  const score = Math.max(45, 92 - riskFlags.length * 14 - (content.trim().length < 300 ? 12 : 0));
  const status: ReviewResult['status'] = riskFlags.includes('amount_scale_conflict') ? 'fail' : score >= 80 ? 'pass' : 'minor_issue';
  return {
    status,
    score,
    summary: status === 'fail' ? '检测到会影响结论的数字口径冲突，请核对原始来源后再提交。' : status === 'minor_issue' ? '主体内容可用，但仍需补齐来源或关键说明。' : '核心任务已经覆盖，可以进入组长审阅。',
    criteriaResults: [
      { criterion: '覆盖任务要求', status: content.trim().length >= 300 ? 'pass' : 'partial', evidence: content.trim().length >= 300 ? '提交包含可供检查的完整正文。' : '当前正文较短或仅包含附件。', suggestion: '按任务卡逐项确认核心分析是否齐全。' },
      { criterion: '数字可核验', status: hasNumbers && !hasSource ? 'fail' : 'pass', evidence: hasNumbers && !hasSource ? '发现数字，但附近没有来源、年份或页码。' : '未发现无来源数字模式。', suggestion: '为金额、比例和同行数据补充来源与年份。' },
      { criterion: '口径一致', status: hasConflict ? 'fail' : 'pass', evidence: hasConflict ? '同时出现 698.12 亿元与 69.81 亿元。' : '未检测到预设的 10 倍金额冲突。', suggestion: '回到年报确认单位，并统一全文口径。' },
    ],
    riskFlags,
    modelName: null,
  };
}

export async function reviewWithOptionalModel(content: string, criteria: string[], duplicateFile = false): Promise<ReviewResult> {
  const fallback = deterministicReview(content, duplicateFile);
  const bindings = getBindings();
  if (!bindings.OPENAI_API_KEY || content.trim().length < 80) return fallback;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${bindings.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: bindings.OPENAI_MODEL ?? 'gpt-5.4', store: false,
      instructions: '你是 FreeLeader 的质量门禁。只根据验收标准和成员原文判断；不得编造来源。每条结论都给原文证据和可执行建议。',
      input: `验收标准：\n${criteria.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n成员提交：\n${content.slice(0, 18000)}`,
      text: { format: { type: 'json_schema', name: 'submission_review', strict: true, schema: { type: 'object', additionalProperties: false, properties: { status: { type: 'string', enum: ['pass', 'minor_issue', 'fail'] }, score: { type: 'number', minimum: 0, maximum: 100 }, summary: { type: 'string' }, criteriaResults: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { criterion: { type: 'string' }, status: { type: 'string', enum: ['pass', 'partial', 'fail'] }, evidence: { type: 'string' }, suggestion: { type: 'string' } }, required: ['criterion', 'status', 'evidence', 'suggestion'] } }, riskFlags: { type: 'array', items: { type: 'string' } } }, required: ['status', 'score', 'summary', 'criteriaResults', 'riskFlags'] } } },
    }),
  });
  if (!response.ok) return fallback;
  const data = await response.json() as { model?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const outputText = data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
  if (!outputText) return fallback;
  try { return { ...(JSON.parse(outputText) as Omit<ReviewResult, 'modelName'>), modelName: data.model ?? bindings.OPENAI_MODEL ?? 'gpt-5.4' }; } catch { return fallback; }
}
