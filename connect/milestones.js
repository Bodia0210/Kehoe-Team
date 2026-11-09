/* Device-local staff milestones. No real employment records or HR permissions are verified. */
Object.assign(dict.en,{
 hireDate:'Employment start date',hireDateHint:'First day at KEL. Work anniversaries are informational and never grant leave.',
 hireDateInvalid:'Enter a valid start date that is not in the future.',
 workAnniversary:'Work anniversary',workAnniversaryInfo:'Informational only. No time off or bonus is awarded.',
 yearsWithTeam:'years with our team',workAnniversaryPreview:'Preview celebration',
 celebrationTitle:'Celebrating our team!',celebrationForYou:'Congratulations! Thank you for being part of our team and for everything you contribute.',
 celebrationForColleague:'Today marks {years} since {name} joined our team as {role}. Join us in celebrating!',
 celebrationDemo:'Preview only — not a real notification',celebrationClose:'Continue to workspace',
 albertaHoliday:'Alberta general holiday',albertaHolidayInfo:'Official Alberta general holiday; actual company schedules and closures are configured separately.',
 holidayCompanyInfo:'Company closure configured by an administrator.',
 holidayCalendarNote:'Alberta general holidays are informational here. Only configured company closures affect leave calculations.',
 holidayNewYear:"New Year’s Day",holidayFamily:'Alberta Family Day',holidayGoodFriday:'Good Friday',
 holidayVictoria:'Victoria Day',holidayCanada:'Canada Day',holidayLabour:'Labour Day',
 holidayThanksgiving:'Thanksgiving Day',holidayRemembrance:'Remembrance Day',holidayChristmas:'Christmas Day'
});
Object.assign(dict.uk,{
 hireDate:'Дата початку роботи',hireDateHint:'Перший день у KEL. Річниця роботи — лише інформаційна, без додаткового вихідного.',
 hireDateInvalid:'Вкажіть коректну дату початку роботи, не пізніше сьогодні.',
 workAnniversary:'Річниця роботи',workAnniversaryInfo:'Лише інформаційна подія. Без нарахування відпустки або бонусу.',
 yearsWithTeam:'років у команді',workAnniversaryPreview:'Переглянути привітання',
 celebrationTitle:'Вітаємо нашу команду!',celebrationForYou:'Вітаємо! Дякуємо за співпрацю, вашу працю та внесок у нашу команду.',
 celebrationForColleague:'Сьогодні {years} років відтоді, як {name} приєднався(-лася) до нашої команди на посаді {role}. Привітаймо колегу!',
 celebrationDemo:'Лише демонстрація — це не справжнє сповіщення',celebrationClose:'Повернутися до роботи',
 albertaHoliday:'Загальне свято Альберти',albertaHolidayInfo:'Офіційне свято Альберти. Графік роботи й закриття KEL визначаються окремо.',
 holidayCompanyInfo:'Закриття компанії, яке встановив адміністратор.',
 holidayCalendarNote:'Свята Альберти позначені для інформації. Лише налаштовані закриття впливають на розрахунки відсутностей.',
 holidayNewYear:'Новий рік',holidayFamily:'День сім’ї в Альберті',holidayGoodFriday:'Страсна п’ятниця',
 holidayVictoria:'День Вікторії',holidayCanada:'День Канади',holidayLabour:'День праці',
 holidayThanksgiving:'День подяки',holidayRemembrance:'День пам’яті',holidayChristmas:'Різдво'
});
svgPaths.medal='<circle cx="12" cy="8" r="5"/><path d="m8 12-2 9 6-3 6 3-2-9"/><path d="m10 8 1.5 1.5L14 7"/>';
const milestoneHolidayCache=new Map();
function nthHolidayWeekday(y,month,weekday,n){const d=new Date(y,month,1,12);d.setDate(1+(weekday-d.getDay()+7)%7+(n-1)*7);return iso(d)}
function easterSunday(y){
 const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,
 f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
 i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7,
 m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),
 day=(h+l-7*m+114)%31+1;
 return iso(new Date(y,month-1,day,12));
}
function holidaysAlberta(y){
 if(milestoneHolidayCache.has(y))return milestoneHolidayCache.get(y);
 const victoria=new Date(y,4,24,12);while(victoria.getDay()!==1)victoria.setDate(victoria.getDate()-1);
 const canada=new Date(y,6,1,12);if(canada.getDay()===0)canada.setDate(2);
 const dates=new Map([[y+'-01-01','holidayNewYear'],[nthHolidayWeekday(y,1,1,3),'holidayFamily'],
 [addDays(easterSunday(y),-2),'holidayGoodFriday'],[iso(victoria),'holidayVictoria'],[iso(canada),'holidayCanada'],
 [nthHolidayWeekday(y,8,1,1),'holidayLabour'],[nthHolidayWeekday(y,9,1,2),'holidayThanksgiving'],
 [y+'-11-11','holidayRemembrance'],[y+'-12-25','holidayChristmas']]);
 milestoneHolidayCache.set(y,dates);return dates;
}
function albertaGeneralHoliday(date){
 if(!validDate(date))return null;
 const key=holidaysAlberta(Number(date.slice(0,4))).get(date);
 return key?{date,key,name:t(key)}:null;
}
function holidayHoverText(date){
 const h=albertaGeneralHoliday(date),close=companyClosure(date),lines=[];
 if(h)lines.push(h.name+' — '+t('albertaHoliday')+'. '+t('albertaHolidayInfo'));
 if(close)lines.push((close.nameKey?t(close.nameKey):close.title)+' — '+t('holidayCompanyInfo'));
 return lines.join('\n');
}
function generalHolidayMarker(date,month=false){
 const h=albertaGeneralHoliday(date);if(!h)return '';
 const label=holidayHoverText(date);
 return '<button type="button" class="'+(month?'calendar-event':'roster-event')+' public-holiday" data-action="general-holiday-info" data-date="'+esc(date)+
 '" aria-label="'+esc(label)+'" title="'+esc(label)+'">'+icon('calendar')+(month?'<span>'+esc(h.name)+'</span>':'')+'</button>';
}
function generalHolidayDetails(date){
 const h=albertaGeneralHoliday(date),close=companyClosure(date);if(!h&&!close)return;
 const body='<div class="info-section"><b>'+esc(t('dates'))+'</b>'+esc(fmt(date))+'</div>'+
 (h?'<div class="info-section"><b>'+esc(h.name)+'</b>'+esc(t('albertaHolidayInfo'))+'</div>':'')+
 (close?'<div class="info-section"><b>'+esc(close.nameKey?t(close.nameKey):close.title)+'</b>'+esc(t('holidayCompanyInfo'))+'</div>':'');
 showModal(t('albertaHoliday'),body,btn(t('close'),'close-modal','primary','','type="button"'));
}
function workAnniversaryYears(p,date){
 if(!p||p.active===false||!validDate(p.hireDate||'')||!validDate(date)||date<p.hireDate)return 0;
 const year=Number(date.slice(0,4)),y0=Number(p.hireDate.slice(0,4));
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const day=p.hireDate.slice(5)==='02-29'&&!leap?'02-28':p.hireDate.slice(5);
 return date.slice(5)===day&&year>y0?year-y0:0;
}
function workAnniversaryLabel(p,date){
 const years=workAnniversaryYears(p,date);if(!years)return '';
 return lang==='uk'?p.name+' · '+years+' '+t('yearsWithTeam')+' · '+p.hireDate:
 p.name+' · '+years+' '+(years===1?'year':'years')+' with our team · Started '+p.hireDate;
}
function serviceMilestoneMarker(p,date,month=false){
 const years=workAnniversaryYears(p,date);if(!years)return '';
 const label=workAnniversaryLabel(p,date);
 return '<button type="button" class="'+(month?'calendar-event':'roster-event')+' work-milestone" data-action="work-anniversary-info" '+
 'data-id="'+esc(p.id)+'" data-date="'+esc(date)+'" title="'+esc(label)+'" aria-label="'+esc(label)+'">'+icon('medal')+
 '<span class="work-years">'+years+(month?' · '+esc(p.name.split(' ')[0]):'')+'</span></button>';
}
function serviceMilestonesForDay(date,month=false){
 return activePeople().filter(p=>(department==='all'||p.dept===department)&&workAnniversaryYears(p,date)>0)
  .map(p=>serviceMilestoneMarker(p,date,month)).join('');
}
function serviceMilestoneDetails(id,date){
 const p=state.people.find(p=>p.id===id);if(!p||!workAnniversaryYears(p,date))return;
 const body='<div class="selected-info">'+av(p,'lg')+'<div><h3>'+esc(p.name)+'</h3><p>'+esc(p.job)+'</p></div></div>'+
 '<div class="info-section"><b>'+esc(t('hireDate'))+'</b>'+esc(fmt(p.hireDate))+'</div>'+
 '<div class="info-section"><b>'+esc(t('workAnniversary'))+'</b>'+esc(workAnniversaryLabel(p,date))+'</div>'+
 '<p class="modal-subtitle">'+esc(t('workAnniversaryInfo'))+'</p>';
 showModal(t('workAnniversary'),body,btn(t('close'),'close-modal','primary','','type="button"'));
}
let celebrationPreviousFocus=null;
const celebrationShownThisLoad=new Set();
function todayWorkMilestones(){return activePeople().filter(p=>workAnniversaryYears(p,TODAY)>0)}
function maybeShowServiceCelebration(){
 const colleagues=todayWorkMilestones(),key='kel-connect-service-greeting-v1-'+TODAY+'-'+actorId();
 if(!colleagues.length||celebrationShownThisLoad.has(key)||document.querySelector('.work-celebration-backdrop'))return;
 try{if(localStorage.getItem(key)==='1')return;localStorage.setItem(key,'1')}catch{}
 celebrationShownThisLoad.add(key);
 showServiceCelebration(colleagues.map(p=>({person:p,years:workAnniversaryYears(p,TODAY)})),false);
}
function serviceAnniversaryPreview(id){
 const p=state.people.find(p=>p.id===id&&p.active!==false);if(!p)return;
 const years=workAnniversaryYears(p,TODAY)||Math.max(1,p.hireDate?Number(TODAY.slice(0,4))-Number(p.hireDate.slice(0,4)):1);
 showServiceCelebration([{person:p,years}],true);
}
function showServiceCelebration(items,preview=false){
 closeServiceCelebration();if(!items.length)return;
 celebrationPreviousFocus=document.activeElement;
 const actor=actorId();
 const cards=items.slice(0,6).map(entry=>{
  const p=entry.person,n=entry.years,years=n+' '+(lang==='en'?(n===1?'year':'years'):'років');
  const own=p.id===actor;
  const copy=own?t('celebrationForYou'):t('celebrationForColleague').replace('{years}',years).replace('{name}',p.name).replace('{role}',p.job||t('employee'));
  return '<div class="celebration-person">'+av(p,'lg')+'<div><strong>'+esc(p.name)+' · '+esc(years)+'</strong><p>'+esc(copy)+'</p></div></div>';
 }).join('');
 const fireworks=Array.from({length:3},(_,i)=>'<div class="party-burst burst-'+i+'">'+
   Array.from({length:12},(_,j)=>'<i style="--angle:'+(30*j)+'deg;--delay:'+(i*.45)+'s"></i>').join('')+'</div>').join('');
 const streamers=Array.from({length:34},(_,i)=>'<i class="party-ribbon" style="--x:'+(i*37%98)+'%;--d:'+(i%7*.12)+'s;--speed:'+(2.7+i%5*.23)+'s;--turn:'+(i%2?300:-330)+'deg;--hue:'+(i*53%360)+'"></i>').join('');
 const dialog=document.createElement('div');dialog.className='work-celebration-backdrop';
 dialog.innerHTML='<section class="work-celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title">'+
 '<div class="party-scene" aria-hidden="true"><img class="party-gif" src="./assets/work-anniversary-fireworks.gif" alt="">'+fireworks+streamers+'</div>'+
 '<button type="button" class="celebration-dismiss-icon" data-action="dismiss-celebration" aria-label="'+esc(t('close'))+'">'+icon('x')+'</button>'+
 '<div class="celebration-copy"><div class="celebration-kicker">'+icon('medal')+' KEL & MIDWEST CONNECT</div>'+
 '<h2 id="celebration-title">'+esc(t('celebrationTitle'))+'</h2>'+cards+
 (preview?'<p class="celebration-preview">'+esc(t('celebrationDemo'))+'</p>':'')+
 '<button type="button" class="celebration-done" data-action="dismiss-celebration">'+esc(t('celebrationClose'))+'</button></div></section>';
 document.body.appendChild(dialog);dialog.querySelector('.celebration-done')?.focus();
}
function closeServiceCelebration(){
 const el=document.querySelector('.work-celebration-backdrop');
 if(!el)return;el.remove();
 if(celebrationPreviousFocus?.isConnected)celebrationPreviousFocus.focus();celebrationPreviousFocus=null;
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 if(b.dataset.action==='general-holiday-info')generalHolidayDetails(b.dataset.date);
 if(b.dataset.action==='work-anniversary-info')serviceMilestoneDetails(b.dataset.id,b.dataset.date);
 if(b.dataset.action==='preview-work-anniversary')serviceAnniversaryPreview(b.dataset.id);
 if(b.dataset.action==='dismiss-celebration')closeServiceCelebration();
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&document.querySelector('.work-celebration-backdrop')){e.stopImmediatePropagation();closeServiceCelebration()}
},true);
document.addEventListener('DOMContentLoaded',maybeShowServiceCelebration);
