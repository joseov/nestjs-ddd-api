export class CreatePostCommand {
  constructor(
    public readonly content: string,
    public readonly authorId: string,
  ) {}
}
