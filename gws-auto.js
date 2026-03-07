
const pty = require('node-pty');
const ptyProcess = pty.spawn('gws', ['auth', 'setup'], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: '/Users/jiawenzhu/careervivid',
  env: process.env
});

let outputStr = '';
ptyProcess.onData((data) => {
  process.stdout.write(data);
  outputStr += data;
  
  if (data.includes('Enter GCP project ID')) {
      ptyProcess.write('jastalk-firebase');
  }
  
  if (data.includes('Select APIs to enable')) {
      ptyProcess.write('');
  }
});

