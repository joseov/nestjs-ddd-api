import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdatePostCommand } from './update-post.command';
import type { IPostRepository } from '../../domain/post.repository.interface';

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand> {
  constructor(
    @Inject('IPostRepository')
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const { id, content } = command;

    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Update using Domain method which checks invariants (e.g. 280 chars)
    post.updateContent(content);

    await this.postRepository.save(post);
  }
}
