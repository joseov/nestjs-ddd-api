import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeletePostCommand } from './delete-post.command';
import type { IPostRepository } from '../../domain/post.repository.interface';

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand> {
  constructor(
    @Inject('IPostRepository')
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
    await this.postRepository.delete(command.id);
  }
}
