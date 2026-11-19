import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  PRIMARY_OWNER_UID,
  PRIMARY_OWNER_EMAIL,
  resolveUserRole,
  hasRequiredRole
} from '../src/lib/adminConfig.ts';
import {
  PRIMARY_OWNER_UID as FS_OWNER_UID,
  PRIMARY_OWNER_EMAIL as FS_OWNER_EMAIL,
  isUserOwner,
  isUserAdminOrOwner,
  isUserModeratorOrHigher,
  updateUserRole
} from '../src/lib/firestoreService.ts';

const execFileAsync = promisify(execFile);

const TEST_OWNER_UID = 'test-primary-owner-uid-001';
const TEST_OWNER_EMAIL = 'primary.owner@naijareel.example';

async function runWithEnv(envOverrides, scriptSource) {
  const env = { ...process.env };
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) {
      delete env[k];
    } else {
      env[k] = v;
    }
  }
  const { stdout } = await execFileAsync(
    process.execPath,
    ['--input-type=module', '--eval', scriptSource],
    { cwd: process.cwd(), env }
  );
  return stdout;
}

test('1. Missing owner env vars default to empty strings and safely deny owner/admin access', async () => {
  await runWithEnv(
    { VITE_PRIMARY_OWNER_UID: undefined, VITE_PRIMARY_OWNER_EMAIL: undefined },
    `
      import assert from 'node:assert/strict';
      import * as adminConfig from './src/lib/adminConfig.ts';
      import * as firestoreService from './src/lib/firestoreService.ts';

      assert.strictEqual(adminConfig.PRIMARY_OWNER_UID, '');
      assert.strictEqual(adminConfig.PRIMARY_OWNER_EMAIL, '');
      assert.strictEqual(firestoreService.PRIMARY_OWNER_UID, '');
      assert.strictEqual(firestoreService.PRIMARY_OWNER_EMAIL, '');

      assert.strictEqual(adminConfig.isUserOwner(null), false);
      assert.strictEqual(adminConfig.isUserOwner(undefined), false);
      assert.strictEqual(adminConfig.isUserOwner({ uid: '', email: '' }), false);
      assert.strictEqual(adminConfig.isUserOwner({ uid: 'any-uid', email: 'any@example.com' }), false);

      assert.strictEqual(adminConfig.resolveUserRole(null, { uid: '', email: '' }), 'user');
      assert.strictEqual(adminConfig.isUserAdminOrOwner(null, { uid: '', email: '' }), false);
      assert.strictEqual(adminConfig.isUserModeratorOrHigher(null, { uid: 'any-uid', email: 'any@example.com' }), false);
      assert.strictEqual(
        adminConfig.hasRequiredRole(['owner', 'admin'], null, { uid: 'any-uid', email: 'any@example.com' }),
        false
      );
      assert.strictEqual(
        firestoreService.isUserAdminOrOwner({ uid: 'u3', role: 'user', isAdmin: false }, { uid: 'u3' }),
        false
      );
    `
  );
});

test('2. Configured owner env vars verify primary owner UID, email, role resolution, and AdminRoute access', async () => {
  await runWithEnv(
    { VITE_PRIMARY_OWNER_UID: TEST_OWNER_UID, VITE_PRIMARY_OWNER_EMAIL: TEST_OWNER_EMAIL },
    `
      import assert from 'node:assert/strict';
      import * as adminConfig from './src/lib/adminConfig.ts';
      import * as firestoreService from './src/lib/firestoreService.ts';

      assert.strictEqual(adminConfig.PRIMARY_OWNER_UID, '${TEST_OWNER_UID}');
      assert.strictEqual(adminConfig.PRIMARY_OWNER_EMAIL, '${TEST_OWNER_EMAIL}');
      assert.strictEqual(firestoreService.PRIMARY_OWNER_UID, '${TEST_OWNER_UID}');
      assert.strictEqual(firestoreService.PRIMARY_OWNER_EMAIL, '${TEST_OWNER_EMAIL}');

      // Owner verified by UID and case-insensitive email
      assert.strictEqual(firestoreService.isUserOwner({ uid: '${TEST_OWNER_UID}' }), true);
      assert.strictEqual(firestoreService.isUserOwner({ uid: 'other-user', email: '${TEST_OWNER_EMAIL}' }), true);
      assert.strictEqual(
        firestoreService.isUserOwner({ uid: 'other-user', email: '${TEST_OWNER_EMAIL.toUpperCase()}' }),
        true
      );
      assert.strictEqual(
        firestoreService.isUserOwner({ uid: 'regular-user-123', email: 'user@example.com' }),
        false
      );
      assert.strictEqual(firestoreService.isUserOwner({ uid: '', email: '' }), false);

      // AdminRoute & role resolution checks
      assert.strictEqual(adminConfig.resolveUserRole(null, { uid: '${TEST_OWNER_UID}' }), 'owner');
      assert.strictEqual(
        adminConfig.hasRequiredRole(['owner', 'admin'], null, { uid: '${TEST_OWNER_UID}' }),
        true
      );
      assert.strictEqual(firestoreService.isUserAdminOrOwner(null, { uid: '${TEST_OWNER_UID}' }), true);
      assert.strictEqual(firestoreService.isUserModeratorOrHigher(null, { uid: '${TEST_OWNER_UID}' }), true);

      // updateUserRole rejects attempts to modify/revoke configured Primary Owner
      await assert.rejects(
        async () => {
          await firestoreService.updateUserRole('${TEST_OWNER_UID}', 'user', '${TEST_OWNER_EMAIL}');
        },
        /Cannot modify or revoke the Primary Owner role/i
      );

      await assert.rejects(
        async () => {
          await firestoreService.updateUserRole('any-uid', 'user', '${TEST_OWNER_EMAIL}');
        },
        /Cannot modify or revoke the Primary Owner role/i
      );
    `
  );
});

test('3. firestoreService re-exports stay aligned with adminConfig and respect Firestore RBAC roles', () => {
  assert.strictEqual(FS_OWNER_UID, PRIMARY_OWNER_UID);
  assert.strictEqual(FS_OWNER_EMAIL, PRIMARY_OWNER_EMAIL);

  // Admin role via Firestore profile
  assert.strictEqual(
    isUserAdminOrOwner(
      { uid: 'u1', role: 'admin', isAdmin: true },
      { uid: 'u1', email: 'admin@domain.com' }
    ),
    true
  );

  // Legacy isAdmin: true flag
  assert.strictEqual(
    isUserAdminOrOwner(
      { uid: 'u2', role: 'user', isAdmin: true },
      { uid: 'u2', email: 'user2@domain.com' }
    ),
    true
  );

  // Standard user denied
  assert.strictEqual(
    hasRequiredRole(
      ['owner', 'admin'],
      { uid: 'u3', role: 'user', isAdmin: false },
      { uid: 'u3', email: 'regular@domain.com' }
    ),
    false
  );
  assert.strictEqual(
    resolveUserRole({ uid: 'u3', role: 'user', isAdmin: false }, { uid: 'u3' }),
    'user'
  );

  // Moderator denied full admin access, permitted moderator+
  assert.strictEqual(
    isUserAdminOrOwner({ uid: 'u4', role: 'moderator', isAdmin: false }, { uid: 'u4' }),
    false
  );
  assert.strictEqual(
    isUserModeratorOrHigher({ uid: 'u4', role: 'moderator', isAdmin: false }, { uid: 'u4' }),
    true
  );
});

test('4. Empty strings never match owner or elevate permissions in current runtime', () => {
  assert.strictEqual(isUserOwner({ uid: '', email: '' }), false);
  assert.strictEqual(isUserOwner(null), false);
  assert.strictEqual(isUserOwner(undefined), false);
  assert.strictEqual(hasRequiredRole(['owner', 'admin'], null, { uid: '', email: '' }), false);
  // Keep reference to updateUserRole verified when imported directly
  assert.strictEqual(typeof updateUserRole, 'function');
});
