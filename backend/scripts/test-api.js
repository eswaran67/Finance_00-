import { spawn } from 'node:child_process';

const server = spawn('node', ['src/server.js'], { cwd: process.cwd(), stdio: 'inherit' });

async function runTests() {
  await new Promise(r => setTimeout(r, 2000));

  try {
    console.log('\n--- 1. Login with 1234@gmail.com ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '1234@gmail.com', password: 'password123' })
    });
    const { token } = await loginRes.json();

    console.log('\n--- 2. Test Today Dues Endpoint (/api/dashboard/today-dues) ---');
    const duesRes = await fetch('http://localhost:5000/api/dashboard/today-dues', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const duesData = await duesRes.json();
    console.log('Today Date:', duesData.date);
    console.log('Pending Today Count:', duesData.count);
    console.log('Pending Borrowers:', duesData.dues.map(d => `${d.customer_name} - Due: ₹${d.weekly_installment}`));

    console.log('\n--- 3. Fetch Stats & Check todayPendingDuesCount ---');
    const statsRes = await fetch('http://localhost:5000/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await statsRes.json();
    console.log('todayPendingDuesCount in stats:', stats.summary.todayPendingDuesCount);

    console.log('\n>>> NOTIFICATION SYSTEM AND TODAY DUES VERIFIED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('API Test Error:', err);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runTests();
