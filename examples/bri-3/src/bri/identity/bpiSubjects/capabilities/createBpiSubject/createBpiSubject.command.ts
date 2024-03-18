export class CreateBpiSubjectCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly publicKeys: { type: string; value: string }[],
  ) {}
}
