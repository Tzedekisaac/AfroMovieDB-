import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'crypto';
import { initializeFirebase, runMovieSync } from '../scripts/syncMovies.js';

test('1. Missing Firebase credentials causes initialization to throw an error', () => {
  const originalEnv = { ...process.env };
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  delete process.env.FIREBASE_CONFIG;
  delete process.env.GOOGLE_CREDENTIALS;
  delete process.env.FIREBASE_PRIVATE_KEY;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    assert.throws(() => {
      initializeFirebase();
    }, /Missing Firebase credentials/);
  } finally {
    process.env = originalEnv;
  }
});

test('2. Malformed Firebase service-account JSON causes initialization to throw an actionable error', () => {
  const originalEnv = { ...process.env };
  process.env.FIREBASE_SERVICE_ACCOUNT = '{"invalid_json": true, incomplete...';

  try {
    assert.throws(() => {
      initializeFirebase();
    }, /Failed to parse Firebase service account JSON/);
  } finally {
    process.env = originalEnv;
  }
});

test('3. Missing TMDb credentials causes runMovieSync to throw an error', async () => {
  const originalEnv = { ...process.env };
  delete process.env.TMDB_API_KEY;

  try {
    await assert.rejects(async () => {
      await runMovieSync();
    }, /Missing TMDb credentials/);
  } finally {
    process.env = originalEnv;
  }
});

test('4. Valid service account JSON format with required fields is recognized without syntax error', () => {
  const originalEnv = { ...process.env };
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    project_id: 'test-project-123',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk@test-project-123.iam.gserviceaccount.com'
  });

  try {
    try {
      initializeFirebase();
    } catch (err) {
      assert.doesNotMatch(err.message, /Missing Firebase credentials/);
      assert.doesNotMatch(err.message, /Failed to parse Firebase service account JSON/);
      assert.doesNotMatch(err.message, /Cannot read properties of undefined/);
    }
  } finally {
    process.env = originalEnv;
  }
});

test('5. Valid service account initializes cleanly without "Cannot read properties of undefined (reading cert)"', () => {
  const originalEnv = { ...process.env };
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    project_id: 'valid-test-project',
    client_email: 'sync-runner@valid-test-project.iam.gserviceaccount.com',
    private_key: privateKey
  });

  try {
    const db = initializeFirebase();
    assert.ok(db, 'Firestore instance returned successfully');
    assert.strictEqual(typeof db.collection, 'function');
  } finally {
    process.env = originalEnv;
  }
});
