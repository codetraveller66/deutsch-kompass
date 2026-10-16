(function(root){
 'use strict';
 const STATUS=['未开始','进行中','已完成'];
 const blankState=()=>({schema:1,settings:{startDate:'',startTime:'20:00',endTime:'22:30',duration:150},tasks:{},dayNotes:{},actual:{},assessments:{},grammar:{},goals:{},resources:null,lastDay:1});
 const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const dateAt=(start,day)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(start))return '';const d=new Date(start+'T12:00:00Z');if(Number.isNaN(d.getTime()))return '';d.setUTCDate(d.getUTCDate()+day-1);return d.toISOString().slice(0,10);};
 const dayAt=(start,today=localDate())=>{if(!dateAt(start,1))return 1;return Math.max(1,Math.min(90,Math.floor((new Date(today+'T12:00:00Z')-new Date(start+'T12:00:00Z'))/86400000)+1));};
 const safeUrl=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
 const timeLabel=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
 function scheduleSettings(settings={}){
  const startTime=settings.startTime||'20:00';
  const valid=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  if(!valid(startTime))throw new Error('请输入有效的开始时间。');
  const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
  const endTime=settings.endTime||timeLabel(minutes(startTime)+Number(settings.duration??150));
  if(!valid(endTime))throw new Error('请输入有效的结束时间。');
  const duration=(minutes(endTime)-minutes(startTime)+1440)%1440;
  if(duration<60||duration>720)throw new Error('每日时间段请设为1–12小时；结束早于开始表示跨到次日。');
  return{...settings,startTime,endTime,duration};
 }
 function tasksFor(day,settings={}){
  let blocks;
  const item=(key,minutes,title,detail,kind='study',url='')=>({key,minutes,title,detail,kind,url});
  if(day.type==='Meetup日')blocks=[item('prep',15,'准备一个真实话题','只准备5个关键词、3个问题，不写完整对白。'),item('travel-out',15,'前往活动地点','交通不计入学习时长；按实际路程调整。','break'),item('meetup',60,'把德语带进真实对话',day.speaking+' 争取追问、澄清并确认结果。活动时长不等于主动开口时长。'),item('travel-back',15,'返程','如活动改期，可与同周普通日互换，不叠加任务。','break'),item('repair',20,'重说现场的三个卡点','记录三个没说出的意思，查证后重说；仅保存自己的录音。'),item('review',25,'复习旧表达与主课','15分钟复习旧表达＋10分钟回顾DW。', 'study','https://learngerman.dw.com/de/nicos-weg/c-36519718')];
  else if(day.type==='测评日')blocks=[item('listen',35,'陌生听力诊断',day.listening,'study',day.resourceUrl),item('speak',30,'两个未预演口语任务',day.speaking),item('break',10,'休息一下','离开屏幕、喝水。','break'),item('read-write',30,'读通知，写实际回应',day.mainCourse,'study',day.resourceUrl),item('recall',20,'提取旧表达',day.review),item('repair',20,'核对错因','核对答案，必要时复听学习；不要改写首次结果。'),item('adjust',15,'记录结果，调整下一周期','打开测试模块填写原始结果，只保留两个补弱重点。')];
  else if(day.type==='巩固日')blocks=[item('listen',30,'容易听力与新声音',day.listening,'study',day.resourceUrl),item('speak',30,'换条件再完成任务',day.day===7?'复做本周最早的一项任务，改时间、人物或限制。':day.speaking),item('break',10,'休息一下','让注意力恢复。','break'),item('course',35,'只补一个关键卡点',day.mainCourse,'study',day.resourceUrl),item('write',25,'修改两条实用消息','选本周两条消息，检查目的、必要信息与诉求；随后口头说出来。'),item('review',30,'提取表达，准备下周',day.review)];
  else blocks=[item('recall',15,'先提取，再新增',day.review),item('listen',45,'25分钟精听＋20分钟容易听力',day.listening,'study',day.resourceUrl),item('break1',5,'短暂休息','起身活动，给耳朵留一点空白。','break'),item('course',35,'DW主课：文本、词汇与语法',day.mainCourse,'study','https://learngerman.dw.com/de/nicos-weg/c-36519718'),item('break2',5,'短暂休息','休息不计入净学习时间。','break'),item('speak',45,'把今天的表达说出来',day.speaking+' 常规：模仿5分钟→首次任务10分钟→反馈5分钟→重说10分钟→换条件10分钟→确认5分钟。反馈日按当天说明替换。'),item('close',10,'修正两个表达，留下记录','7分钟重说旧错句，3分钟记录下一步。完成标准：'+day.output)];
  const schedule=scheduleSettings(settings),duration=schedule.duration;
  if(day.type==='Meetup日'&&duration>=150)blocks.find(x=>x.key==='meetup').minutes+=duration-150;
  else if(day.type!=='Meetup日'&&duration>=150){
   if(duration<160)blocks.find(x=>x.key==='course'||x.key==='repair').minutes-=160-duration;
   if(duration>160)blocks.push(item('extra',duration-160,'加练：容易输入或真实交流','接触新的容易材料或实际交流；不追加大量新词。'));
  }else{
   const study=blocks.filter(x=>x.kind!=='break'),available=duration-blocks.filter(x=>x.kind==='break').reduce((n,x)=>n+x.minutes,0),sum=study.reduce((n,x)=>n+x.minutes,0);
   const shares=study.map(x=>({x,raw:x.minutes*available/sum}));
   shares.forEach(({x,raw})=>{x.minutes=Math.floor(raw);});
   let left=available-study.reduce((n,x)=>n+x.minutes,0);
   shares.sort((a,b)=>(b.raw%1)-(a.raw%1)).forEach(({x})=>{if(left-->0)x.minutes++;});
  }
  const [hour,minute]=schedule.startTime.split(':').map(Number);let t=hour*60+minute;
  return blocks.map(x=>{
   if(x.key==='course')x.detail=x.detail.replace(/35分钟内/g,`${x.minutes}分钟内`).replace(/末10–15分钟/g,`末${Math.max(2,Math.round(x.minutes*.3))}分钟`);
   if(day.type==='普通日'&&x.key==='listen'){const intensive=Math.round(x.minutes*25/45),easy=x.minutes-intensive;x.title=`${intensive}分钟精听＋${easy}分钟容易听力`;x.detail=x.detail.replace(/精听25分钟/g,`精听${intensive}分钟`).replace(/较容易听力20分钟/g,`较容易听力${easy}分钟`);}
   if(x.key==='speak'&&x.minutes!==45&&day.type==='普通日')x.detail=x.detail.replace(/今天45分钟口语内，前20–30分钟/g,'本时段前半段').replace(/ 常规：.*$/,' 按本时段依次完成：模仿→首次任务→反馈→重说→换条件→确认；时间较短时减少轮次。');
   if(x.key==='read-write')x.detail=x.detail.replace(/用30分钟/g,`用${x.minutes}分钟`);
   if(x.key==='listen'&&day.type==='巩固日')x.detail=x.detail.replace(/容易听力30分钟/g,`容易听力${x.minutes}分钟`);
   if(x.key==='close')x.detail='先重说旧错句，再记录下一步。完成标准：'+day.output;
   if(x.key==='review'&&day.type==='Meetup日')x.detail='先复习旧表达，再回顾本周DW主课，不新增课程。';
   const start=(t>=1440?'次日 ':'')+timeLabel(t);t+=x.minutes;
   return{...x,id:`d${day.day}-${x.key}`,start,end:(t>=1440?'次日 ':'')+timeLabel(t)};
  });
 }
 function dayProgress(day,state){const tasks=tasksFor(day,state.settings).filter(x=>x.kind!=='break');const done=tasks.filter(x=>state.tasks[x.id]?.status==='已完成').length;const started=tasks.some(x=>state.tasks[x.id]?.status==='进行中'||state.tasks[x.id]?.status==='已完成');return{done,total:tasks.length,percent:Math.round(done/tasks.length*100),status:done===tasks.length?'已完成':started?'进行中':'未开始'};}
 const num=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
 function advice(result={},day=14){
  const correct=num(result.correct),total=num(result.total),s1=num(result.oral1),s2=num(result.oral2),recall=num(result.recall);
  const valid=correct!==null&&total!==null&&Number.isInteger(correct)&&Number.isInteger(total)&&total>0&&correct>=0&&correct<=total;
  const rate=valid?correct/total:null;
  let listen='待填写听力题数与主旨判断',oral='待填写两项口语结果',memory='待填写旧表达提取结果';
  if(correct!==null&&total!==null&&!valid)listen='检查题数：总题数须为正整数，答对数不得超过总题数。';
  else if(rate!==null&&['是','否'].includes(result.gist))listen=result.gist==='否'||rate<.6?'降低听力难度或将片段减半；每天最多推进一个B1小课。':rate<.8?'保持难度，集中处理一种主要错因。':'只增加一个变量：长度、说话者或减少文本辅助。';
  if(s1!==null&&s2!==null){if(!Number.isInteger(s1)||!Number.isInteger(s2)||s1<0||s2<0||s1>10||s2>10)oral='口语分数应为0–10的整数。';else if(!result.interaction)oral='先完成真实互动，再确认口语分数；不能仅凭独白推测。';else{const min=Math.min(s1,s2);oral=min<5?'缩短任务，先独立完成说明问题或提出请求。':min<8?'维持难度，换内容重复同一交际功能。':'减少准备，增加一次临时追问或限制。';}}
  if(recall!==null){if(!Number.isInteger(recall)||recall<0||recall>10)memory='表达提取数量应为0–10的整数。';else memory=day===1?'只记录起点，不作7天保留率判断。':recall<8?'连续3天暂停新增表达，优先提取旧表达。':'保持间隔提取，每天新增最多5条。';}
  return{rate,listen,oral,memory};
 }
 function validateState(value){
  if(!value||value.schema!==1||!value.settings||typeof value.tasks!=='object'||Array.isArray(value.tasks))throw new Error('这不是可识别的Kompass备份。');
  if(value.settings.startDate&&!/^\d{4}-\d{2}-\d{2}$/.test(value.settings.startDate))throw new Error('备份开始日期无效。');
  const settings=scheduleSettings(value.settings);
  for(const t of Object.values(value.tasks)){if(!t||!STATUS.includes(t.status)||typeof t.note!=='string')throw new Error('备份任务格式无效。');}
  for(const k of ['dayNotes','actual','assessments','grammar','goals'])if(!value[k]||typeof value[k]!=='object'||Array.isArray(value[k]))throw new Error('备份记录格式无效。');
  if(value.resources!==null&&(!Array.isArray(value.resources)||value.resources.some(r=>!r||typeof r.name!=='string'||!safeUrl(r.url))))throw new Error('备份资源链接无效。');
  return{...blankState(),...value,settings};
 }
 const api={STATUS,blankState,localDate,dateAt,dayAt,safeUrl,scheduleSettings,tasksFor,dayProgress,advice,validateState};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KompassCore=api;
})(typeof window==='undefined'?globalThis:window);
