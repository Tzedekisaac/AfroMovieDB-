import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  PRIMARY_OWNER_UID,
  PRIMARY_OWNER_EMAIL,
  isUserOwner,
  isUserAdminOrOwner,
  isUserModeratorOrHigher,
  updateUserRole
} from '../src/lib/firestoreService.ts';

test('1. isUserOwner accurately verifies primary owner UID and email', () => {
  assert.strictEqual(isUserOwner({ uid: PRIMARY_OWNER_UID }), true);
  assert.strictEqual(isUserOwner({ uid: 'other-user', email: PRIMARY_OWNER_EMAIL }), true);
  assert.strictEqual(isUserOwner({ uid: 'other-user', email: 'JUSTICEISAAC06@GMAIL.COM' }), true);
  
  // Non-owner accounts
  assert.strictEqual(isUserOwner({ uid: 'regular-user-123', email: 'user@example.com' }), false);
  assert.strictEqual(isUserOwner(null), false);
  assert.strictEqual(isUserOwner(undefined), false);
});

test('2. isUserAdminOrOwner permits owners, role: admin, and isAdmin: true', () => {
  // Owner is automatically authorized
  assert.strictEqual(isUserAdminOrOwner(null, { uid: PRIMARY_OWNER_UID }), true);
  
  // Profile with role: admin
  assert.strictEqual(
    isUserAdminOrOwner({ uid: 'u1', role: 'admin', isAdmin: true }, { uid: 'u1', email: 'admin@domain.com' }), 
    true
  );

  // Profile with isAdmin: true
  assert.strictEqual(
    isUserAdminOrOwner({ uid: 'u2', role: 'user', isAdmin: true }, { uid: 'u2', email: 'user2@domain.com' }), 
    true
  );

  // Standard user is denied
  assert.strictEqual(
    isUserAdminOrOwner({ uid: 'u3', role: 'user', isAdmin: false }, { uid: 'u3', email: 'regular@domain.com' }), 
    false
  );

  // Moderator is denied for full admin actions
  assert.strictEqual(
    isUserAdminOrOwner({ uid: 'u4', role: 'moderator', isAdmin: false }, { uid: 'u4', email: 'mod@domain.com' }), 
    false
  );
});

test('3. isUserModeratorOrHigher permits moderators, admins, and owners', () => {
  // Owner
  assert.strictEqual(isUserModeratorOrHigher(null, { uid: PRIMARY_OWNER_UID }), true);

  // Admin
  assert.strictEqual(
    isUserModeratorOrHigher({ uid: 'u1', role: 'admin', isAdmin: true }, { uid: 'u1' }), 
    true
  );

  // Moderator
  assert.strictEqual(
    isUserModeratorOrHigher({ uid: 'u2', role: 'moderator', isAdmin: false }, { uid: 'u2' }), 
    true
  );

  // Standard user rejected
  assert.strictEqual(
    isUserModeratorOrHigher({ uid: 'u3', role: 'user', isAdmin: false }, { uid: 'u3' }), 
    false
  );
});

test('4. updateUserRole rejects any attempt to modify or revoke the Primary Owner', async () => {
  await assert.rejects(
    async () => {
      await updateUserRole(PRIMARY_OWNER_UID, 'user', PRIMARY_OWNER_EMAIL);
    },
    /Cannot modify or revoke the Primary Owner role/i
  );

  await assert.rejects(
    async () => {
      await updateUserRole('any-uid', 'user', PRIMARY_OWNER_EMAIL);
    },
    /Cannot modify or revoke the Primary Owner role/i
  );
});
