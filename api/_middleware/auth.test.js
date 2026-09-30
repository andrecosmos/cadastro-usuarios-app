import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import process from 'node:process';

import {
  authenticate,
  createAccessToken,
  requireCompanyScope,
  requireAdmin,
  requireCustomer
} from './auth.js';

const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'test-secret-for-auth-middleware-longer';

after(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('rejects requests without a bearer token', () => {
  const response = createResponse();
  let nextCalled = false;

  authenticate({ get: () => undefined }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('accepts a valid token and attaches verified identity', () => {
  const user = {
    _id: 'user-1',
    companyId: 'company-1',
    role: 'admin'
  };
  const token = createAccessToken(user);
  const request = {
    get: () => `Bearer ${token}`
  };
  let nextCalled = false;

  authenticate(request, createResponse(), () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(request.auth, {
    userId: user._id,
    companyId: user.companyId,
    role: user.role
  });
});

test('rejects tokens signed with another secret', () => {
  const token = jwt.sign(
    { companyId: 'company-1', role: 'admin' },
    'different-secret',
    { subject: 'user-1', issuer: 'cadastro-usuarios' }
  );
  const response = createResponse();
  let nextCalled = false;

  authenticate({ get: () => `Bearer ${token}` }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('allows only admins on admin routes', () => {
  const response = createResponse();
  let nextCalled = false;

  requireAdmin({ auth: { role: 'user', companyId: 'company-1' } }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('allows only customer accounts on customer routes', () => {
  const response = createResponse();
  let nextCalled = false;

  requireCustomer({ auth: { role: 'admin' } }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('rejects a company id that does not match the verified token', () => {
  const response = createResponse();
  let nextCalled = false;

  requireCompanyScope({
    auth: { companyId: 'company-1' },
    body: { companyId: 'company-2' },
    query: {}
  }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('requires a sufficiently long signing secret', () => {
  const validSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'short';

  try {
    assert.throws(
      () => createAccessToken({ _id: 'user-1', companyId: 'company-1', role: 'admin' }),
      /JWT_SECRET/
    );
  } finally {
    process.env.JWT_SECRET = validSecret;
  }
});