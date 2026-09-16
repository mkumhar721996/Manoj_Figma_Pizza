import type { Comment, CurrentUser } from '../types.js';

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const commentsApi = {
  list(defectId: string, user: CurrentUser | null): Promise<Comment[]> {
    return request<Comment[]>(`/defects/${defectId}/comments`, user?.token ?? null);
  },

  add(defectId: string, user: CurrentUser, body: string): Promise<Comment> {
    return request<Comment>(`/defects/${defectId}/comments`, user.token, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },

  edit(commentId: string, user: CurrentUser, body: string): Promise<Comment> {
    return request<Comment>(`/comments/${commentId}`, user.token, {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    });
  },

  remove(commentId: string, user: CurrentUser): Promise<Comment> {
    return request<Comment>(`/comments/${commentId}`, user.token, {
      method: 'DELETE',
    });
  },
};
