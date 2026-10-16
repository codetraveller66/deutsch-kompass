// Uses credentials only in process memory. Never writes a token to disk or command arguments.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const owner='codetraveller66',repo='deutsch-kompass';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
if(!token){const auth=spawnSync('git',['-c','credential.interactive=never','credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'},windowsHide:true});token=auth.stdout?.split('\n').find(x=>x.startsWith('password='))?.slice(9).trim();}
if(!token){console.log(JSON.stringify({ready:false,reason:'No local GitHub publishing credential. Connector supports file edits but not repository creation or Pages settings.'}));process.exit(2);}
async function api(route,method='GET',body){const response=await fetch('https://api.github.com'+route,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'Deutsch-Kompass-Publisher'},body:body?JSON.stringify(body):undefined});const result=await response.json().catch(()=>({}));return{status:response.status,data:result};}
const user=await api('/user');if(user.status!==200||user.data.login!==owner){console.log(JSON.stringify({ready:false,reason:'GitHub account or authorization mismatch',status:user.status}));process.exit(3);}
if(process.argv.includes('--check')){console.log(JSON.stringify({ready:true,login:user.data.login}));process.exit(0);}
let current=await api(`/repos/${owner}/${repo}`);
if(current.status===404){current=await api('/user/repos','POST',{name:repo,description:'独立运行的德语学习工作台 · B1 90天计划 / A1–C2语法地图',private:false,auto_init:true});if(current.status!==201)throw new Error(`Create repository failed: ${current.status} ${current.data.message}`);}
else if(current.status!==200)throw new Error(`Repository lookup failed: ${current.status}`);
if(current.data.private)throw new Error('Existing repository is private; refusing to change unrelated visibility.');
const branch=current.data.default_branch||'main';
const ref=await api(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
if(ref.status!==200)throw new Error('Repository initial commit not yet available; retry publication.');
const base=ref.data.object.sha;
const commit=await api(`/repos/${owner}/${repo}/git/commits/${base}`);
const entries=[];
async function walk(dir){for(const item of await fs.readdir(path.join(root,dir),{withFileTypes:true})){if(['.git','node_modules','test-results','.auth'].includes(item.name))continue;const rel=path.posix.join(dir,item.name);if(item.isDirectory())await walk(rel);else if(!rel.endsWith('.log')&&!rel.endsWith('.backup.json'))entries.push({path:rel,mode:'100644',type:'blob',content:await fs.readFile(path.join(root,rel),'utf8')});}}
await walk('');
const tree=await api(`/repos/${owner}/${repo}/git/trees`,'POST',{base_tree:commit.data.tree.sha,tree:entries});if(tree.status!==201)throw new Error(`Tree failed: ${tree.status}`);
const saved=await api(`/repos/${owner}/${repo}/git/commits`,'POST',{message:'Build independent German learning workspace',tree:tree.data.sha,parents:[base]});if(saved.status!==201)throw new Error(`Commit failed: ${saved.status}`);
const pushed=await api(`/repos/${owner}/${repo}/git/refs/heads/${branch}`,'PATCH',{sha:saved.data.sha});if(pushed.status!==200)throw new Error(`Push failed: ${pushed.status}`);
let pages=await api(`/repos/${owner}/${repo}/pages`);
if(pages.status===404)pages=await api(`/repos/${owner}/${repo}/pages`,'POST',{build_type:'legacy',source:{branch,path:'/docs'}});
else if(pages.status===200)pages=await api(`/repos/${owner}/${repo}/pages`,'PUT',{build_type:'legacy',source:{branch,path:'/docs'}});
if(![200,201,204].includes(pages.status))throw new Error(`Source published; Pages setup failed: ${pages.status} ${pages.data.message}`);
console.log(JSON.stringify({repository:`https://github.com/${owner}/${repo}`,url:pages.data.html_url||`https://${owner}.github.io/${repo}/`,commit:saved.data.sha,pagesStatus:pages.status}));
