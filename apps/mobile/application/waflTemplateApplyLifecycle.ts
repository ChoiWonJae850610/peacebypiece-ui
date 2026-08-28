export async function runWaflTemplateApplyContentFirst<TContent, TResult>(input: {
  readonly fetchContent: () => Promise<TContent>;
  readonly applyTemplate: () => Promise<TResult>;
  readonly isCurrent: (content: TContent, result: TResult) => boolean;
  readonly publishAppliedContent: (content: TContent) => void;
}): Promise<{ readonly content: TContent; readonly published: boolean; readonly result: TResult }> {
  const content = await input.fetchContent();
  const result = await input.applyTemplate();
  const published = input.isCurrent(content, result);
  if (published) input.publishAppliedContent(content);
  return { content, published, result };
}
