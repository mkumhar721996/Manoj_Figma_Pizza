import type { Comment } from './comments.types.js';

export class CommentsRepository {
  private readonly comments = new Map<string, Comment>();

  save(comment: Comment): Comment {
    this.comments.set(comment.id, comment);
    return comment;
  }

  findById(id: string): Comment | undefined {
    return this.comments.get(id);
  }

  listByDefectId(defectId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter((comment) => comment.defectId === defectId && !comment.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  clear(): void {
    this.comments.clear();
  }
}
