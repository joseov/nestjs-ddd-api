import { Post } from './post.entity';

export interface IPostRepository {
  save(post: Post): Promise<void>;
  findById(id: string): Promise<Post | null>;
  delete(id: string): Promise<void>;
}
