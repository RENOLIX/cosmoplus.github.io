const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
let count=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(['.git','node_modules'].includes(entry.name))continue;
  const full=path.join(dir,entry.name);if(entry.isDirectory()){walk(full);continue;}
  if(!['index.html','404.html'].includes(entry.name))continue;
  let html=fs.readFileSync(full,'utf8');
  const prefix=entry.name==='404.html'?'/':'../'.repeat(path.relative(root,dir).split(path.sep).filter(Boolean).length);
  if(dir===path.join(root,'admin')){
    html=html.replace(/<link[^>]+href="[^"]*cosmetis-admin\.css[^"]*"[^>]*>/g,'').replace('</head>',`<link rel="stylesheet" href="${prefix}admin/cosmetis-admin.css?v=1"></head>`);
    fs.writeFileSync(full,html);continue;
  }
  if(!html.includes('cosmoplus.js?v='))continue;
  html=html.replace(/<link[^>]+href="[^"]*(?:home-cosmetis|cosmetis-pages)\.css[^"]*"[^>]*>/g,'').replace(/<script[^>]+src="[^"]*(?:home-cosmetis|cosmetis-pages)\.js[^"]*"[^>]*><\/script>/g,'');
  html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}home-cosmetis.css?v=2"><link rel="stylesheet" href="${prefix}cosmetis-pages.css?v=1"></head>`);
  html=html.replace(/(<script src="[^"]*firebase-client\.js[^>]*>)/,`<script src="${prefix}home-cosmetis.js?v=2" defer></script><script src="${prefix}cosmetis-pages.js?v=1" defer></script>$1`);
  fs.writeFileSync(full,html);count++;
}}
walk(root);console.log(`Shared theme installed on ${count} public pages and the admin.`);
