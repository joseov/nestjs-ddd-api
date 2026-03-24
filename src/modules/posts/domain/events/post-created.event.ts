export class PostCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly authorId: string,
    public readonly createdAt: Date,
  ) {}
}
