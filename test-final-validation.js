#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://fitgenius-ai-production.up.railway.app';
const LOCAL_URL = 'http://localhost:3001';

// Utility to make HTTP requests
function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test functions
async function testHealth(baseUrl) {
  console.log('\n📋 TEST 1: Health Check');
  try {
    const result = await makeRequest(`${baseUrl}/api/health`, 'GET');
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Response:`, result.data);
    return true;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return false;
  }
}

async function testRegistration(baseUrl) {
  console.log('\n📋 TEST 2: User Registration');
  try {
    const email = `testuser-${Date.now()}@example.com`;
    const result = await makeRequest(`${baseUrl}/api/register`, 'POST', {
      email,
      password: 'TestPassword123!'
    });
    console.log(`✅ Status: ${result.status}`);
    if (result.data.id) {
      console.log(`   User ID: ${result.data.id}`);
      console.log(`   Email: ${result.data.email}`);
      return result.data.id;
    }
    return null;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

async function testProfileSave(baseUrl, userId) {
  console.log('\n📋 TEST 3: Save User Profile');
  try {
    const result = await makeRequest(`${baseUrl}/api/profile`, 'POST', {
      userId,
      age: 28,
      weight: 75,
      height: 180,
      goal: 'muscle_gain',
      fitnessLevel: 'intermediate',
      availableDays: 4,
      preferences: ['strength', 'compound'],
      medicalHistory: ''
    });
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Response:`, result.data);
    return true;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

async function testGenerateWorkout(baseUrl, userId) {
  console.log('\n📋 TEST 4: Generate Workout');
  try {
    const result = await makeRequest(`${baseUrl}/api/generate-workout`, 'POST', {
      userId,
      goal: 'muscle_gain',
      daysAvailable: 4,
      equipmentAvailable: ['dumbbells', 'barbell', 'bench']
    });
    console.log(`✅ Status: ${result.status}`);
    if (result.data.error) {
      console.log(`⚠️  API Response: ${result.data.error}`);
    } else {
      console.log(`   Workout title: ${result.data.title}`);
      if (result.data.schedule) {
        console.log(`   Days: ${result.data.schedule.length}`);
      }
    }
    return result.data;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

async function testSaveWorkout(baseUrl, userId, workoutData) {
  console.log('\n📋 TEST 5: Save Workout to Database');
  try {
    const result = await makeRequest(`${baseUrl}/api/save-workout`, 'POST', {
      userId,
      title: workoutData.title || 'Generated Workout',
      planData: workoutData
    });
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Response:`, result.data);
    return true;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

async function testGenerateDiet(baseUrl, userId) {
  console.log('\n📋 TEST 6: Generate Diet Plan');
  try {
    const result = await makeRequest(`${baseUrl}/api/generate-diet`, 'POST', {
      userId,
      goal: 'muscle_gain',
      calories: 2500,
      restrictions: []
    });
    console.log(`✅ Status: ${result.status}`);
    if (result.data.error) {
      console.log(`⚠️  API Response: ${result.data.error}`);
    } else {
      console.log(`   Diet title: ${result.data.title}`);
      if (result.data.days) {
        console.log(`   Days: ${result.data.days.length}`);
      }
    }
    return result.data;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

async function testSaveDiet(baseUrl, userId, dietData) {
  console.log('\n📋 TEST 7: Save Diet to Database');
  try {
    const result = await makeRequest(`${baseUrl}/api/save-diet`, 'POST', {
      userId,
      title: dietData.title || 'Generated Diet',
      planData: dietData
    });
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Response:`, result.data);
    return true;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

async function testGetWorkout(baseUrl, userId) {
  console.log('\n📋 TEST 8: Get Saved Workout');
  try {
    const result = await makeRequest(`${baseUrl}/api/workout/${userId}`, 'GET');
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Response:`, result.data);
    return true;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

async function testGetDiet(baseUrl, userId) {
  console.log('\n📋 TEST 9: Get Saved Diet');
  try {
    const result = await makeRequest(`${baseUrl}/api/diet/${userId}`, 'GET');
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Response:`, result.data);
    return true;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

async function testSessions(baseUrl, userId) {
  console.log('\n📋 TEST 10: Get User Sessions');
  try {
    const result = await makeRequest(`${baseUrl}/api/sessions/${userId}`, 'GET');
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Response:`, result.data);
    return true;
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
    return null;
  }
}

// Main test suite
async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   FITGENIUS AI - FULL VALIDATION TEST  ║');
  console.log('╚════════════════════════════════════════╝');
  
  console.log('\n🌐 Testing Backend: ' + BACKEND_URL);
  
  // Test health
  const isHealthy = await testHealth(BACKEND_URL);
  if (!isHealthy) {
    console.log('\n⚠️  Backend health check failed. Trying local...');
    await testHealth(LOCAL_URL);
  }

  // Test registration
  const userId = await testRegistration(BACKEND_URL);
  if (!userId) {
    console.log('\n❌ Registration failed. Cannot continue tests.');
    return;
  }

  // Test profile
  await testProfileSave(BACKEND_URL, userId);

  // Test workout generation
  const workoutData = await testGenerateWorkout(BACKEND_URL, userId);
  if (workoutData && !workoutData.error) {
    await testSaveWorkout(BACKEND_URL, userId, workoutData);
    await testGetWorkout(BACKEND_URL, userId);
  }

  // Test diet generation
  const dietData = await testGenerateDiet(BACKEND_URL, userId);
  if (dietData && !dietData.error) {
    await testSaveDiet(BACKEND_URL, userId, dietData);
    await testGetDiet(BACKEND_URL, userId);
  }

  // Test sessions
  await testSessions(BACKEND_URL, userId);

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║        TESTS COMPLETED                 ║');
  console.log('╚════════════════════════════════════════╝');
}

// Run tests
runTests().catch(console.error);
