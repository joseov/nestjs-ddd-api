import { AggregateRoot } from '@nestjs/cqrs';
import { PostCreatedEvent } from './events/post-created.event';

export class Post extends AggregateRoot {
  private _id: string;
  private _content: string;
  private _authorId: string;
  private _createdAt: Date;
  private _updatedAt?: Date;

  private constructor(
    id: string,
    content: string,
    authorId: string,
    createdAt: Date,
    updatedAt?: Date,
  ) {
    super();
    this._id = id;
    this._content = content;
    this._authorId = authorId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Domain Factory Method
  static create(content: string, authorId: string): Post {
    if (content.length > 280) {
      throw new Error('Post content cannot exceed 280 characters');
    }
    const id = crypto.randomUUID();
    const post = new Post(id, content, authorId, new Date());

    // Publish Domain Event
    post.apply(
      new PostCreatedEvent(
        post.id,
        post.content,
        post.authorId,
        post.createdAt,
      ),
    );

    return post;
  }

  // Re-hydrate from Persistence
  static reconstitute(
    id: string,
    content: string,
    authorId: string,
    createdAt: Date,
    updatedAt?: Date,
  ): Post {
    return new Post(id, content, authorId, createdAt, updatedAt);
  }

  updateContent(newContent: string): void {
    if (newContent.length > 280) {
      throw new Error('Post content cannot exceed 280 characters');
    }
    this._content = newContent;
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id;
  }

  get content(): string {
    return this._content;
  }

  get authorId(): string {
    return this._authorId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }
}
