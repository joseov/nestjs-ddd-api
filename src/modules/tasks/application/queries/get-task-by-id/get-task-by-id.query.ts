import { IQuery } from '@nestjs/cqrs';

export class GetTaskByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
