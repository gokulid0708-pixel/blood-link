const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

console.log('🩸 [BloodLink AI] Launching Emergency Command Center...\n');

function runScript(directory, scriptName) {
  if (isWin) {
    return spawn('cmd.exe', ['/c', `npm run ${scriptName}`], {
      cwd: path.join(rootDir, directory),
      stdio: 'inherit'
    });
  } else {
    return spawn('npm', ['run', scriptName], {
      cwd: path.join(rootDir, directory),
      stdio: 'inherit'
    });
  }
}

// 1. Start Server
console.log('▶ Starting Backend API server on http://localhost:5000...');
const server = runScript('server', 'dev');

// 2. Start Client
console.log('▶ Starting Frontend Client on http://localhost:5173...');
const client = runScript('client', 'dev');

server.on('error', (err) => console.error('[Server Process Error]:', err));
client.on('error', (err) => console.error('[Client Process Error]:', err));

function cleanup() {
  console.log('\n[BloodLink AI] Shutting down services cleanly...');
  if (isWin) {
    if (server.pid) spawn('taskkill', ['/pid', server.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
    if (client.pid) spawn('taskkill', ['/pid', client.pid.toString(), '/f', '/t'], { stdio: 'ignore' });
  } else {
    server.kill();
    client.kill();
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
