export class AddCircuitInputsSchemaCommand {
  constructor(
    public readonly workstepId: string,
    public readonly schema: string,
  ) {}
}
