const http = require('http');
const { spawn } = require('child_process');

// Start the server
const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
  cwd: 'C:\\Users\\jmlus\\athena',
  stdio: 'pipe'
});

serverProcess.stdout.on('data', (data) => {
  console.log('SERVER:', data.toString());
});

serverProcess.stderr.on('data', (data) => {
  console.error('SERVER ERR:', data.toString());
});

// Wait for server to start
setTimeout(() => {
  console.log('Testing connection...');
  http.get('http://localhost:3000/api/health', (res) => {
    console.log('Response status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
      serverProcess.kill();
      process.exit(0);
    });
  }).on('error', (e) => {
    console.error('Connection error:', e.message);
    serverProcess.kill();
    process.exit(1);
  });
}, 5000);

// Timeout
setTimeout(() => {
  console.error('Timeout');
  serverProcess.kill();
  process.exit(1);
}, 30000);