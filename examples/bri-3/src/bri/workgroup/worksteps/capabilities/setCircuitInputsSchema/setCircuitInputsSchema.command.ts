export class SetCircuitInputsSchemaCommand {
  constructor(
    public readonly workstepId: string,
    public readonly schema: string,
  ) {}
}
