const axios = require('axios');

const USER_SERVICE = 'http://localhost:5001';
const ADMIN_SERVICE = 'http://localhost:5002';
const INTERNAL_SECRET = 'internal-secret-token-creator-contest';

let user1Token = '';
let user2Token = '';
let createdUserId = '';
let testPostId = '';
const testUsername1 = `testuser1_${Date.now()}`;
const testUsername2 = `testuser2_${Date.now()}`;

async function runFullTestSuite() {
  console.log('==================================================');
  console.log('🚀 STARTING 100% APPLICATION FUNCTIONALITY AUDIT');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.response?.data || err.message);
      failed++;
    }
  }

  // 1. User 1 Registration & User 2 Registration
  await test('1. User Registration API (POST /api/auth/register)', async () => {
    const res1 = await axios.post(`${USER_SERVICE}/api/auth/register`, {
      name: 'Audit Test Creator 1',
      username: testUsername1,
      email: `${testUsername1}@example.com`,
      password: 'Password123!',
      residency: 'Chhattisgarh'
    });
    if (!res1.data.success || !res1.data.data?.token) throw new Error('Missing token for User 1');
    user1Token = res1.data.data.token;
    createdUserId = res1.data.data.user._id;

    const res2 = await axios.post(`${USER_SERVICE}/api/auth/register`, {
      name: 'Audit Test Fan 2',
      username: testUsername2,
      email: `${testUsername2}@example.com`,
      password: 'Password123!',
      residency: 'Chhattisgarh'
    });
    if (!res2.data.success || !res2.data.data?.token) throw new Error('Missing token for User 2');
    user2Token = res2.data.data.token;
  });

  // 2. User Login
  await test('2. User Login API (POST /api/auth/login)', async () => {
    const res = await axios.post(`${USER_SERVICE}/api/auth/login`, {
      identifier: testUsername1,
      password: 'Password123!'
    });
    if (!res.data.success || !res.data.data?.token) throw new Error('Failed login token generation');
  });

  // 3. User Me / Auth Verification
  await test('3. Auth Verification (GET /api/auth/me)', async () => {
    const res = await axios.get(`${USER_SERVICE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    if (!res.data.success || res.data.data.username !== testUsername1) throw new Error('Username mismatch');
  });

  // 4. KYC Status Submission with file upload (aadharImage field)
  await test('4. Submit KYC Details (PUT /api/auth/kyc)', async () => {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('aadharNumber', '987654321012');
    form.append('aadharMobile', '9998887770');
    form.append('dob', '1995-05-15');
    form.append('aadharImage', Buffer.from('dummy image content'), {
      filename: 'aadhaar.jpg',
      contentType: 'image/jpeg'
    });

    const res = await axios.put(`${USER_SERVICE}/api/auth/kyc`, form, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
        ...form.getHeaders()
      }
    });
    if (!res.data.success || res.data.data.kycDetails?.status !== 'PENDING') {
      throw new Error('KYC submission status failed');
    }
  });

  // 5. Profile Lookup with Stripped @ and normal username
  await test('5. Profile Lookup by Username (GET /api/posts/user/:userId)', async () => {
    const res1 = await axios.get(`${USER_SERVICE}/api/posts/user/${testUsername1}`);
    const res2 = await axios.get(`${USER_SERVICE}/api/posts/user/@${testUsername1}`);
    if (!res1.data.data.user || res1.data.data.user.username !== testUsername1 || res2.data.data.user.username !== testUsername1) {
      throw new Error('Profile lookup with or without @ failed');
    }
  });

  // 6. Create Reel / Post with video file attachment
  await test('6. Post Creation (POST /api/posts)', async () => {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('caption', 'Audit test reel caption #viral');
    form.append('category', 'Entertainment');
    form.append('media', Buffer.from('dummy video content'), {
      filename: 'sample.mp4',
      contentType: 'video/mp4'
    });

    const res = await axios.post(`${USER_SERVICE}/api/posts`, form, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
        ...form.getHeaders()
      }
    });
    if (!res.data.success || !res.data.data?._id) throw new Error('Post creation failed');
    testPostId = res.data.data._id;
  });

  // 7. Get User Posts (Profile Feed)
  await test('7. User Posts Lookup (GET /api/posts/user/:userId)', async () => {
    const res = await axios.get(`${USER_SERVICE}/api/posts/user/@${testUsername1}`);
    if (!res.data.success || !Array.isArray(res.data.data.posts)) {
      throw new Error('User posts array empty or invalid');
    }
  });

  // 8. Like Post Toggle (User 2 likes User 1's post)
  await test('8. Like Post Toggle (POST /api/posts/:id/like)', async () => {
    const res = await axios.post(
      `${USER_SERVICE}/api/posts/${testPostId}/like`,
      {},
      { headers: { Authorization: `Bearer ${user2Token}` } }
    );
    if (!res.data.success || (res.data.data.likeCount ?? res.data.data.likesCount) < 1) throw new Error('Like post failed to increment count');
  });

  // 9. Comment on Post (User 2 comments on User 1's post)
  await test('9. Post Comment Creation (POST /api/posts/:id/comment)', async () => {
    const res = await axios.post(
      `${USER_SERVICE}/api/posts/${testPostId}/comment`,
      { text: 'Awesome video audit test!' },
      { headers: { Authorization: `Bearer ${user2Token}` } }
    );
    if (!res.data.success || res.data.data.commentCount < 1) {
      throw new Error('Comment creation failed');
    }
  });

  // 10. Get Comments for Post
  await test('10. Get Comments (GET /api/posts/:id/comments)', async () => {
    const res = await axios.get(`${USER_SERVICE}/api/posts/${testPostId}/comments`);
    if (!res.data.success || !Array.isArray(res.data.data)) {
      throw new Error('Comments fetching failed');
    }
  });

  // 11. Feed Retrieval
  await test('11. Get Video Feed (GET /api/posts/feed)', async () => {
    const res = await axios.get(`${USER_SERVICE}/api/posts/feed`);
    if (!res.data.success || !Array.isArray(res.data.data.posts)) throw new Error('Feed posts missing');
  });

  // 12. Internal Contest Data API
  await test('12. Internal Contest Data (GET /api/internal/contest-data)', async () => {
    const res = await axios.get(`${USER_SERVICE}/api/internal/contest-data`, {
      headers: { 'x-internal-secret': INTERNAL_SECRET }
    });
    if (!Array.isArray(res.data.users) || !Array.isArray(res.data.posts)) {
      throw new Error('Internal contest data response invalid');
    }
  });

  // 13. Internal Service Paginated Users API
  await test('13. Internal Paginated Users (GET /api/internal/users/paginated)', async () => {
    const res = await axios.get(`${USER_SERVICE}/api/internal/users/paginated?page=1&limit=5`, {
      headers: { 'x-internal-secret': INTERNAL_SECRET }
    });
    if (!res.data.success || !res.data.data.users || typeof res.data.data.pagination.total !== 'number') {
      throw new Error('Internal paginated users query failed');
    }
  });

  // 14. Internal Service Stats API
  await test('14. Internal User Stats (GET /api/internal/users/stats)', async () => {
    const res = await axios.get(`${USER_SERVICE}/api/internal/users/stats`, {
      headers: { 'x-internal-secret': INTERNAL_SECRET }
    });
    if (!res.data.success || typeof res.data.data.totalUsers !== 'number') {
      throw new Error('Internal user stats failed');
    }
  });

  // 15. Admin Rankings API
  await test('15. Admin Rankings (GET /api/admin/rankings)', async () => {
    const res = await axios.get(`${ADMIN_SERVICE}/api/admin/rankings`);
    if (!res.data.success || !res.data.data.rankings) throw new Error('Admin rankings failed');
  });

  // 16. Admin Stats Dashboard
  await test('16. Admin Stats Dashboard (GET /api/admin/stats)', async () => {
    const res = await axios.get(`${ADMIN_SERVICE}/api/admin/stats`);
    if (!res.data.success || typeof res.data.data.totalUsers !== 'number') {
      throw new Error('Admin stats failed');
    }
  });

  // 17. Admin Paginated Participants
  await test('17. Admin Paginated Participants (GET /api/admin/participants/paginated)', async () => {
    const res = await axios.get(`${ADMIN_SERVICE}/api/admin/participants/paginated?page=1&limit=10`);
    if (!res.data.success || !res.data.data.users || !res.data.data.pagination) {
      throw new Error('Admin paginated participants failed');
    }
  });

  // 18. Admin Calculate Winners Engine
  await test('18. Admin Calculate Winners Engine (POST /api/admin/calculate-winners)', async () => {
    const res = await axios.post(`${ADMIN_SERVICE}/api/admin/calculate-winners`);
    if (!res.data.success || !Array.isArray(res.data.data.winners)) {
      throw new Error('Winner calculation failed');
    }
  });

  // 19. Admin Winners List
  await test('19. Admin Get Winners (GET /api/admin/winners)', async () => {
    const res = await axios.get(`${ADMIN_SERVICE}/api/admin/winners`);
    if (!res.data.success || !Array.isArray(res.data.data.winners)) throw new Error('Admin get winners failed');
  });

  // 20. Admin Bulk KYC Approval
  await test('20. Admin Bulk KYC Update (PUT /api/admin/users/bulk-kyc)', async () => {
    const res = await axios.put(`${ADMIN_SERVICE}/api/admin/users/bulk-kyc`, {
      userIds: [createdUserId],
      status: 'PASSED',
      notes: 'Bulk audit approve'
    });
    if (!res.data.success) throw new Error('Bulk KYC update failed');
  });

  // 21. Admin CSV Export
  await test('21. Admin CSV Export (GET /api/admin/users/export)', async () => {
    const res = await axios.get(`${ADMIN_SERVICE}/api/admin/users/export`);
    if (typeof res.data !== 'string' || !res.data.includes('User ID')) {
      throw new Error('CSV Export response invalid');
    }
  });

  console.log('\n==================================================');
  console.log(`🎉 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFullTestSuite();
