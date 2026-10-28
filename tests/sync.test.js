import test from 'node:test';
import assert from 'node:assert/strict';
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
  // A syntactically valid mock service account structure
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    project_id: 'test-project-123',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk@test-project-123.iam.gserviceaccount.com'
  });

  try {
    // Should attempt initialization with the cert rather than throwing "missing credentials" or "JSON parse" error
    try {
      initializeFirebase();
    } catch (err) {
      // If it throws, it must be an OpenSSL crypto key validation error on the mock key, NOT a missing credential or JSON error!
      assert.doesNotMatch(err.message, /Missing Firebase credentials/);
      assert.doesNotMatch(err.message, /Failed to parse Firebase service account JSON/);
    }
  } finally {
    process.env = originalEnv;
  }
});
