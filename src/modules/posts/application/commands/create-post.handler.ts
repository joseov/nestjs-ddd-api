import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreatePostCommand } from './create-post.command';
import { Post } from '../../domain/post.entity';
import type { IPostRepository } from '../../domain/post.repository.interface';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
  constructor(
    @Inject('IPostRepository')
    private readonly postRepository: IPostRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreatePostCommand): Promise<void> {
    const { content, authorId } = command;

    // Instantiate Domain Entity using factory method to ensure invariants
    let post = Post.create(content, authorId);

    // Merge context for event dispatching
    post = this.publisher.mergeObjectContext(post);

    // Save state via Database Port
    await this.postRepository.save(post);

    // Commit the events (dispatch to EventBus)
    post.commit();
  }
}
