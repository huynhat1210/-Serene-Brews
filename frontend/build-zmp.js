const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'out');
const destDir = path.join(__dirname, 'www');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getFiles(dir, ext, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath, ext, fileList);
    } else if (path.extname(file) === ext) {
      const relPath = path.relative(srcDir, filePath).replace(/\\/g, '/');
      fileList.push(relPath);
    }
  }
  return fileList;
}

if (!fs.existsSync(srcDir)) {
  console.error("Next.js build directory 'out' does not exist. Run 'next build' first.");
  process.exit(1);
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir);

copyDir(srcDir, destDir);

const jsFiles = getFiles(srcDir, '.js');
const cssFiles = getFiles(srcDir, '.css');

// Extract __NEXT_DATA__ from out/index.html to inject it dynamically inside Zalo's container
const indexHtml = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
const nextDataMatch = indexHtml.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
let nextDataJson = '{"props":{"pageProps":{}},"page":"/","query":{},"buildId":"","assetPrefix":".","nextExport":true}';
if (nextDataMatch) {
  nextDataJson = nextDataMatch[1];
}

const headCountMatch = indexHtml.match(/<meta name="next-head-count" content="(\d+)"\s*\/?>/);
let headCount = '5';
if (headCountMatch) {
  headCount = headCountMatch[1];
}

const zmpInitContent = `
if (typeof window !== 'undefined') {
  var baseHref = window.location.href.split('?')[0].split('#')[0];
  if (baseHref.endsWith('.html')) {
    var lastSlash = baseHref.lastIndexOf('/');
    baseHref = baseHref.substring(0, lastSlash + 1);
  } else if (!baseHref.endsWith('/')) {
    baseHref = baseHref + '/';
  }
  window.__ZMP_BASE_URL__ = baseHref;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Inject next-head-count meta tag
  if (!document.querySelector('meta[name="next-head-count"]')) {
    var meta = document.createElement('meta');
    meta.name = 'next-head-count';
    meta.content = '${headCount}';
    var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
    if (head) {
      head.appendChild(meta);
    }
  }

  var appDiv = document.getElementById('app');
  var nextDiv = document.getElementById('__next');
  
  if (appDiv) {
    appDiv.id = '__next';
    nextDiv = appDiv;
  } else if (!nextDiv) {
    nextDiv = document.createElement('div');
    nextDiv.id = '__next';
    var parent = document.body || document.documentElement;
    if (parent) {
      parent.appendChild(nextDiv);
    }
  }
  
  if (nextDiv && !document.getElementById('__NEXT_DATA__')) {
    var nextDataScript = document.createElement('script');
    nextDataScript.id = '__NEXT_DATA__';
    nextDataScript.type = 'application/json';
    var nextDataJson = ${JSON.stringify(nextDataJson.trim())};
    nextDataScript.text = nextDataJson;
    nextDataScript.textContent = nextDataJson;
    nextDataScript.innerHTML = nextDataJson;
    nextDiv.appendChild(nextDataScript);
  }
}
`;

fs.writeFileSync(path.join(destDir, 'zmp-init.js'), zmpInitContent);

// Find the webpack-....js file in destDir and replace the hardcoded public path i.p
const webpackFile = jsFiles.find(f => f.includes('webpack'));
if (webpackFile) {
  const webpackFilePath = path.join(destDir, webpackFile);
  if (fs.existsSync(webpackFilePath)) {
    let webpackContent = fs.readFileSync(webpackFilePath, 'utf8');
    // Replace i.p="/_next/" or i.p="./_next/" with a dynamic base URL expression
    webpackContent = webpackContent.replace(/i\.p\s*=\s*["']\.?\/_next\/["']/g, 'i.p=(typeof window !== "undefined" && window.__ZMP_BASE_URL__ ? window.__ZMP_BASE_URL__ + "_next/" : "/_next/")');
    fs.writeFileSync(webpackFilePath, webpackContent);
    console.log("Patched webpack public path to support dynamic base url.");
  }
}

const sortedJs = ['zmp-init.js'];
const frameworkFile = jsFiles.find(f => f.includes('framework'));
const mainFile = jsFiles.find(f => f.includes('main'));
const appFile = jsFiles.find(f => f.includes('_app'));

if (webpackFile) sortedJs.push(webpackFile);
if (frameworkFile) sortedJs.push(frameworkFile);
if (mainFile) sortedJs.push(mainFile);
if (appFile) sortedJs.push(appFile);

jsFiles.forEach(file => {
  if (!sortedJs.includes(file)) {
    sortedJs.push(file);
  }
});

const configPath = path.join(__dirname, 'app-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

config.listCSS = cssFiles;
config.listSyncJS = sortedJs;

// Clean up unsupported files to avoid ZMP CLI warnings
function cleanUnsupportedFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanUnsupportedFiles(entryPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if ((ext === '.html' && entryPath !== path.join(destDir, 'index.html')) || ext === '.ico') {
        fs.unlinkSync(entryPath);
      }
    }
  }
  // Remove directory if empty (except root www)
  if (dir !== destDir && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

cleanUnsupportedFiles(destDir);

fs.writeFileSync(path.join(destDir, 'app-config.json'), JSON.stringify(config, null, 2));
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log("Zalo Mini App built successfully in 'www/' directory!");
