export class UpdatePostCommand {
  constructor(
    public readonly id: string,
    public readonly content: string,
  ) {}
}
