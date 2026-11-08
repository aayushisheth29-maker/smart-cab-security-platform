/** One-shot launcher test with fake SDK/servers; no phone, Python install or real model. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
test("USB launcher starts local services and removes only its managed debug settings", { timeout: 20000, skip: process.platform === 'win32' }, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'smartcab-usb-lifecycle-'));
  let proc;
  const write = (relative, text, executable = false) => {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), {recursive:true});
    fs.writeFileSync(target, text, { mode: executable ? 0o755 : 0o644 });
  };
  try {
    for (const name of ['usb-preview.mjs', 'usb-preview-utils.mjs']) write('frontend/scripts/'+name, fs.readFileSync(path.join(scripts,name),'utf8'));
    const baseConfig = '{"appId":"com.smartcab.routelab.preview","server":{"androidScheme":"https"}}';
    const mainManifest = '<manifest><application/></manifest>';
    write('frontend/capacitor.config.json',baseConfig);
    write('frontend/android/app/build.gradle','// test fixture');
    write('frontend/android/app/src/main/AndroidManifest.xml',mainManifest);
    const server = `#!/usr/bin/env node
const http=require('node:http');
const port=Number(process.argv[process.argv.indexOf('--port')+1]);
const host=process.argv[process.argv.indexOf('--host')+1];
if(host!=='127.0.0.1')process.exit(7);
http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({environment:'synthetic-preview',acceptsLiveGps:false,automaticActions:false,modelAvailable:true}));}).listen(port,host);
`;
    write('backend-python-ai/.venv/bin/python', server, true);
    write('frontend/node_modules/vite/bin/vite.js',server,true);
    write('sdk/platform-tools/adb', `#!/usr/bin/env node
const fs=require('node:fs');const args=process.argv.slice(2);
if(args.shift()!=='-d')process.exit(7);
fs.appendFileSync(process.env.TEST_ADB_LOG,JSON.stringify(args)+'\\n');
if(args[0]==='get-state')console.log('device');
`,true);
    proc=spawn(process.execPath,[path.join(root,'frontend/scripts/usb-preview.mjs')],{
      env:{...process.env,ANDROID_SDK_ROOT:path.join(root,'sdk'),TEST_ADB_LOG:path.join(root,'adb.log')},
      stdio:['ignore','pipe','pipe'],
    });
    let log='';
    const exited = new Promise(resolve => proc.once('exit',(code,signal)=>resolve({code,signal})));
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Launcher readiness timed out: '+log)),12000);
      const collect=chunk=>{log+=chunk.toString(); if(log.includes('USB PREVIEW READY')){clearTimeout(timer);resolve();}};
      proc.stdout.on('data',collect);proc.stderr.on('data',collect);
      proc.once('exit',code=>{clearTimeout(timer);reject(new Error('Exited before readiness '+code+': '+log));});
    });
    assert.ok(fs.existsSync(path.join(root,'frontend/android/app/src/debug/assets/capacitor.config.json')));
    assert.equal(fs.readFileSync(path.join(root,'frontend/capacitor.config.json'),'utf8'),baseConfig);
    assert.equal(fs.readFileSync(path.join(root,'frontend/android/app/src/main/AndroidManifest.xml'),'utf8'),mainManifest);
    proc.kill('SIGINT');
    assert.equal((await exited).code,0);
    assert.equal(fs.existsSync(path.join(root,'frontend/android/app/src/debug/assets/capacitor.config.json')),false);
    const calls=fs.readFileSync(path.join(root,'adb.log'),'utf8');
    assert.ok(calls.includes('["reverse","tcp:5173","tcp:5173"]'));
    assert.ok(calls.includes('["reverse","--remove","tcp:5173"]'));
  } finally {
    if(proc && proc.exitCode===null && !proc.killed) proc.kill('SIGTERM');
    fs.rmSync(root,{recursive:true,force:true});
  }
});
