import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PostCreatedEvent } from '../../domain/events/post-created.event';

@EventsHandler(PostCreatedEvent)
export class PostCreatedEventHandler implements IEventHandler<PostCreatedEvent> {
  private readonly logger = new Logger(PostCreatedEventHandler.name);

  handle(event: PostCreatedEvent) {
    this.logger.log(
      `Event Published: Post ${event.id} created by user ${event.authorId}`,
    );

    // TODO: Connect and publish to AWS SNS here.
    // e.g. await snsClient.send(new PublishCommand({ TopicArn: '...', Message: JSON.stringify(event) }))
  }
}
