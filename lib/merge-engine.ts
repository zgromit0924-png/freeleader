import type { OutlineNode } from '@/lib/planning-engine';

export const MERGE_SYSTEM_PROMPT = `你是 FreeLeader 的文稿整合编辑。你的首要任务是保留成员有效内容，而不是压缩篇幅。
1. 按已确认大纲把成员原文段落归位；除完全重复内容外，不删除论据、数据、分析过程、图表说明和引用。
2. 只做必要的标题层级、术语、单位和衔接调整；禁止把长文摘要成几句话。
3. 对同一事实的冲突版本并列保留，标注成员、版本和“待负责人核实”，不得自行选择。
4. 每个章节必须保留来源成员、提交版本和原文字数；所有删除、合并和改写进入修改记录。
5. 综合结论只能使用已经通过验收或被负责人确认的材料。`;

export type MergeSubmission = { id: string; taskTitle: string; outlineSectionIds: string[]; memberName: string; version: number; content: string; reviewStatus: string };

export type IntegratedSection = { outlineId: string; title: string; markdown: string; sources: Array<{ submissionId: string; memberName: string; version: number; characters: number }>; unresolved: string[] };

export async function integrateWithoutCompression(outline: OutlineNode[], submissions: MergeSubmission[]) {
  const exactSeen = new Map<string, string>();
  const removedDuplicates: Array<{ duplicateId: string; originalId: string }> = [];
  const unique = submissions.filter((submission) => {
    const normalized = submission.content.replace(/\s+/g, ' ').trim();
    if (!normalized) return false;
    const existing = exactSeen.get(normalized);
    if (existing) { removedDuplicates.push({ duplicateId: submission.id, originalId: existing }); return false; }
    exactSeen.set(normalized, submission.id); return true;
  });
  const sections: IntegratedSection[] = outline.map((section) => {
    const sources = unique.filter((submission) => submission.outlineSectionIds.includes(section.id));
    return {
      outlineId: section.id, title: section.title,
      markdown: sources.map((source) => `### ${source.taskTitle}\n\n${source.content.trim()}\n\n> 来源：${source.memberName} · V${source.version} · ${source.reviewStatus === 'pass' ? '已通过验收' : '待负责人确认'}`).join('\n\n---\n\n'),
      sources: sources.map((source) => ({ submissionId: source.id, memberName: source.memberName, version: source.version, characters: source.content.length })),
      unresolved: sources.filter((source) => source.reviewStatus !== 'pass').map((source) => `${source.memberName} V${source.version} 尚未通过全部验收标准`),
    };
  });
  const contentMarkdown = sections.map((section) => `## ${section.title}\n\n${section.markdown || '> 本章尚无成员提交内容。'}`).join('\n\n');
  return { sections, contentMarkdown, removedDuplicates, originalCharacters: submissions.reduce((sum, item) => sum + item.content.length, 0), integratedCharacters: contentMarkdown.length };
}
