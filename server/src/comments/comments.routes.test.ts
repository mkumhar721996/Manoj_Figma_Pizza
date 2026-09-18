import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { encodeToken } from '../middleware/auth.js';

describe('comments routes', () => {
  let app: Express;
  const author = { id: 'u1', name: 'Alice Member', role: 'member' as const, projectIds: ['p1'] };
  const qaLead = { id: 'u2', name: 'Quinn Lead', role: 'qa_lead' as const, projectIds: ['p1'] };
  const otherMember = { id: 'u3', name: 'Sam Other', role: 'member' as const, projectIds: ['p1'] };
  const outsider = { id: 'u4', name: 'Eve Outsider', role: 'member' as const, projectIds: [] };

  const authorToken = encodeToken(author);
  const qaLeadToken = encodeToken(qaLead);
  const otherMemberToken = encodeToken(otherMember);
  const outsiderToken = encodeToken(outsider);

  beforeEach(() => {
    app = createApp();
  });

  async function createComment(token: string, body: string, defectId = 'defect-1') {
    const res = await request(app)
      .post(`/api/defects/${defectId}/comments`)
      .set('Authorization', token)
      .send({ body });
    return res.body;
  }

  it('saves a comment and returns author name and timestamp', async () => {
    const res = await request(app)
      .post('/api/defects/defect-1/comments')
      .set('Authorization', authorToken)
      .send({ body: 'Looks good to me' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ authorName: 'Alice Member', body: 'Looks good to me' });
    expect(res.body.createdAt).toBeTruthy();

    const list = await request(app)
      .get('/api/defects/defect-1/comments')
      .set('Authorization', authorToken);
    expect(list.body).toHaveLength(1);
  });

  it('lets the author edit their own comment', async () => {
    const created = await createComment(authorToken, 'original text');
    const res = await request(app)
      .patch(`/api/comments/${created.id}`)
      .set('Authorization', authorToken)
      .send({ body: 'updated text' });

    expect(res.status).toBe(200);
    expect(res.body.body).toBe('updated text');
  });

  it('lets a QA/Lead edit a comment they did not author', async () => {
    const created = await createComment(authorToken, 'original text');
    const res = await request(app)
      .patch(`/api/comments/${created.id}`)
      .set('Authorization', qaLeadToken)
      .send({ body: 'lead updated text' });

    expect(res.status).toBe(200);
    expect(res.body.body).toBe('lead updated text');
  });

  it('removes a deleted comment from the visible list', async () => {
    const created = await createComment(authorToken, 'to be removed');
    await request(app).delete(`/api/comments/${created.id}`).set('Authorization', authorToken);

    const list = await request(app)
      .get(`/api/defects/${created.defectId}/comments`)
      .set('Authorization', authorToken);
    expect(list.body.map((c: any) => c.id)).not.toContain(created.id);
  });

  it('forbids a non-author, non QA/Lead from editing or deleting', async () => {
    const created = await createComment(authorToken, 'original');
    const editRes = await request(app)
      .patch(`/api/comments/${created.id}`)
      .set('Authorization', otherMemberToken)
      .send({ body: 'hacked' });
    expect(editRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/comments/${created.id}`)
      .set('Authorization', otherMemberToken);
    expect(deleteRes.status).toBe(403);
  });

  it('rejects comment submission from a non-project-member', async () => {
    const res = await request(app)
      .post('/api/defects/defect-1/comments')
      .set('Authorization', outsiderToken)
      .send({ body: 'sneaky' });
    expect(res.status).toBe(403);
  });

  it('rejects comment submission from an unauthenticated request', async () => {
    const res = await request(app).post('/api/defects/defect-1/comments').send({ body: 'sneaky' });
    expect(res.status).toBe(403);
  });

  it('returns comments in chronological order', async () => {
    await createComment(authorToken, 'first');
    await createComment(authorToken, 'second');
    const res = await request(app).get('/api/defects/defect-1/comments').set('Authorization', authorToken);
    expect(res.body.map((c: any) => c.body)).toEqual(['first', 'second']);
  });

  it('allows an unauthenticated viewer to see the comment history', async () => {
    await createComment(authorToken, 'visible to everyone');

    const res = await request(app).get('/api/defects/defect-1/comments');
    expect(res.status).toBe(200);
    expect(res.body.map((c: any) => c.body)).toEqual(['visible to everyone']);
  });

  it('allows an unauthenticated viewer to see the empty-state list for a defect with no comments', async () => {
    const res = await request(app).get('/api/defects/no-comments-defect/comments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('rejects submission with a malformed bearer token instead of crashing', async () => {
    const incompleteToken = `Bearer ${Buffer.from(JSON.stringify({ id: 'u5' })).toString('base64')}`;
    const res = await request(app)
      .post('/api/defects/defect-1/comments')
      .set('Authorization', incompleteToken)
      .send({ body: 'sneaky' });
    expect(res.status).toBe(403);
  });
});
