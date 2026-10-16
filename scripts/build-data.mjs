import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {grammar} from '../content/grammar.mjs';
import {goals} from '../content/goals.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(await fs.readFile(path.join(root,'content/plan-source.json'),'utf8'));
const DW='https://learngerman.dw.com/de/nicos-weg/c-36519718';
const A2='https://learngerman.dw.com/de/nicos-weg/c-36519709';
const fixUrl=url=>typeof url==='string'?url.replaceAll('/prf/prf/','/prf/'):url;
const days=source.days.map(d=>{
 const day={...d};delete day.status;
 if(/vhs/i.test(day.listening)){
  const locator=day.mainCourse.match(/DW (B1[^。；]+)/)?.[1];
  day.listening=`精听25分钟：${locator?'DW '+locator:'DW A2第12章 Arbeitswelten 第4小课，或最近已学B1视频'}，选30–90秒起步；较容易听力20分钟：复听本周DW A2材料，再听一段未练过的短片。`;
  day.resourceUrl=locator?DW:A2;
 }
 day.resourceIds=day.resourceIds.split('、').filter(x=>!['R05','R06','R07','R08'].includes(x));
 if(!day.resourceIds.includes('R01'))day.resourceIds.push('R01');
 if(/vhs/i.test(day.resourceUrl))day.resourceUrl=DW;
 day.resourceUrl=fixUrl(day.resourceUrl);
 day.mainCourse=day.mainCourse.replace(/平台反馈/g,'已收到的真人反馈');
 return day;
});
const resources=source.resources.filter(r=>!['R18','R19','R20'].includes(r.id)).map(r=>({id:r.id,name:r.name,category:r.id.startsWith('E')?'方法研究':r.id==='R01'?'主课程':r.id==='R02'?'A2补弱':r.id==='R11'||r.id==='R12'?'测评':/纸书|语法参考/.test(r.role)?'可选书籍':/vhs/i.test(r.name)?'可选补充':'工具与参考',level:/A2.*B1|A1.*B1/.test(r.name)?'A2–B1':/B1/.test(r.name)?'B1':/A2/.test(r.name)?'A2':'通用',cost:r.free,url:fixUrl(r.url),description:r.usage,note:r.note.replace('本次浏览工具','资料核验').replace('本文只交付导入包',''),pinned:['R01','R02','R09','R11','R12'].includes(r.id)}));
resources.push({id:'K01',name:'Deutsch intensiv Hören und Sprechen A2',category:'可选书籍',level:'A2',cost:'付费；有免费试读',url:'https://www.klett-sprachen.de/deutsch-intensiv-hoeren-und-sprechen-a2/t-1/9783126750493',description:'ISBN 9783126750493。可替代Hueber听说练习册；在已有时段内使用，二选一即可。',note:'纸书与完整配套以出版社说明为准。'},
{id:'CEFR',name:'CEFR 能力自评表',category:'等级参考',level:'A1–C2',cost:'免费',url:'https://www.coe.int/en/web/portfolio/self-assessment-grid',description:'欧洲委员会能力描述，用于理解听说读写的目标。',note:'本站中文目标为学习用摘要，非官方中文原文。'},
{id:'IDS',name:'IDS grammis 系统语法',category:'工具与参考',level:'B2–C2',cost:'免费',url:'https://grammis.ids-mannheim.de/systematische-grammatik',description:'查证词类、句法、语义与语法变体；适合进阶查阅。',note:'不是CEFR分级教材。'},
{id:'RLD',name:'语法分级与 CEFR 的关系',category:'等级参考',level:'通用',cost:'免费',url:'https://www.coe.int/en/web/common-european-framework-reference-languages/reference-level-descriptions',description:'CEFR以交际能力为核心，不规定唯一的德语语法教学顺序。',note:'本站语法标签为建议学习等级，允许跨级复现。'});
const assessments=source.assessments.map(a=>Object.fromEntries(Object.entries(a).map(([k,v])=>[k,fixUrl(v)])));
const data={version:'1.0.1',updated:'2026-10-16',days,assessments,resources,grammar,goals,weekNotes:source.weekNotes};
await fs.writeFile(path.join(root,'docs/content.js'),'window.KOMPASS_CONTENT = '+JSON.stringify(data)+';\n');
console.log(JSON.stringify({days:days.length,assessments:data.assessments.length,grammar:grammar.length,resources:resources.length}));
