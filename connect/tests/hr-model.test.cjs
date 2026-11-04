const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Exercise the leave/accounting model without a browser or UI interactions.
function model(){
 const root=path.resolve(__dirname,'..');
 const context=vm.createContext({Intl,Date,Math,Number,String,Array,Object,Set,Map,RegExp,JSON,TextEncoder,crypto:require('node:crypto').webcrypto,localStorage:{getItem:()=>null,setItem:()=>{}},document:{addEventListener:()=>{}},window:{addEventListener:()=>{}}});
 vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
 const hr=fs.readFileSync(path.join(root,'hr.js'),'utf8').replace(/initializeHR\(\);\s*render\(\);\s*$/,'');
 vm.runInContext(hr,context);
 const run=s=>vm.runInContext(s,context);
 run('initializeHR();state.requests=[];state.holidays=[];state.bonuses=[];state.audit=[];state.settings.hoursPerDay=8;');
 return run;
}
test('a Friday-to-Tuesday vacation excludes the weekend and a company closure',()=>{
 const m=model();
 m("state.holidays.push({id:'h',start:'2030-01-07',end:'2030-01-07',active:true});state.requests.push({id:'v',person:'me',type:'vacation',start:'2030-01-04',end:'2030-01-08',status:'approved'});");
 assert.equal(m("usedAllowance('me','vacation',2030)"),2);
 m("state.holidays[0].active=false");
 assert.equal(m("usedAllowance('me','vacation',2030)"),3);
});
test('personal time charges hours and separate non-overlapping bookings are allowed',()=>{
 const m=model();m("state.requests.push({id:'p',person:'me',type:'personal',unit:'hours',hours:2,start:'2030-01-08',end:'2030-01-08',startTime:'09:00',endTime:'11:00',status:'approved'});");
 assert.equal(m("usedAllowance('me','personal',2030)"),2);
 assert.equal(m("overlaps({person:'me',unit:'hours',start:'2030-01-08',end:'2030-01-08',startTime:'11:00',endTime:'12:00'})"),false);
 assert.equal(m("overlaps({person:'me',unit:'hours',start:'2030-01-08',end:'2030-01-08',startTime:'10:30',endTime:'12:00'})"),true);
});
test('a pending bonus reserves one day; approval consumes it without using vacation',()=>{
 const m=model();m("state.bonuses.push({id:'g',person:'me',days:1,active:true,reason:'birthday',year:2030});state.requests.push({id:'b',person:'me',type:'bonus',grantId:'g',start:'2030-01-08',end:'2030-01-08',status:'pending'});");
 assert.equal(m("grantStatus(state.bonuses[0])"),'bonusReserved');
 assert.equal(m("availableGrants('me').length"),0);
 m("state.requests[0].status='approved'");
 assert.equal(m("grantStatus(state.bonuses[0])"),'bonusUsed');
 assert.equal(m("usedAllowance('me','vacation',2030)"),0);
 m("state.requests[0].status='cancelled'");
 assert.equal(m("availableGrants('me').length"),1);
});
test('closing the company on a booked bonus day returns that day to the bonus bank',()=>{
 const m=model();m("state.bonuses.push({id:'g',person:'me',days:1,active:true,reason:'birthday',year:2030});state.requests.push({id:'b',person:'me',type:'bonus',grantId:'g',start:'2030-01-08',end:'2030-01-08',status:'approved'});state.holidays.push({id:'h',start:'2030-01-08',end:'2030-01-08',active:true});");
 assert.equal(m("grantStatus(state.bonuses[0])"),'bonusAvailable');
 assert.equal(m("leaveDays(state.requests[0])"),0);
});
test('cross-year leave is charged separately to each year',()=>{
 const m=model();m("state.requests.push({id:'v',person:'me',type:'vacation',start:'2029-12-31',end:'2030-01-02',status:'approved'});");
 assert.equal(m("usedAllowance('me','vacation',2029)"),1);
 assert.equal(m("usedAllowance('me','vacation',2030)"),2);
});
test('reopening a company day cannot reactivate a second booking of the same bonus',()=>{
 const m=model();m("render=()=>{};toast=()=>{};state.holidays.push({id:'h',start:'2030-01-08',end:'2030-01-08',active:true});state.bonuses.push({id:'g',person:'me',active:true});state.requests.push({id:'old',person:'me',type:'bonus',grantId:'g',start:'2030-01-08',end:'2030-01-08',status:'approved'},{id:'new',person:'me',type:'bonus',grantId:'g',start:'2030-01-09',end:'2030-01-09',status:'approved'});toggleHoliday('h');");
 assert.equal(m('state.holidays[0].active'),true);
 assert.equal(m('grantBookings(state.bonuses[0]).length'),1);
});
test('revoked and expired bonuses cannot be booked',()=>{
 const m=model();m("state.bonuses.push({id:'revoked',person:'me',active:false},{id:'expired',person:'me',active:true,expiry:'2029-12-31'},{id:'valid',person:'me',active:true,expiry:'2030-12-31'});");
 assert.equal(m("availableGrants('me','2030-01-08').length"),1);
 assert.equal(m("availableGrants('me','2030-01-08')[0].id"),'valid');
});
test('the Outlook export excludes closures/weekends from leave and medical/private notes',()=>{
 const m=model();m("state.holidays.push({id:'h',title:'Company closed',start:'2030-01-07',end:'2030-01-07',active:true});state.requests.push({id:'s',person:'me',type:'sick',start:'2030-01-04',end:'2030-01-08',status:'approved',note:'CONFIDENTIAL MEDICAL NOTE'});");
 const text=m('buildOutlookCalendar(2030).text');
 assert.equal(m('buildOutlookCalendar(2030).count'),3);
 assert.ok(text.includes('DTSTART;VALUE=DATE:20300104'));
 assert.ok(text.includes('DTEND;VALUE=DATE:20300109'));
 assert.ok(!text.includes('CONFIDENTIAL'));
 assert.ok(!text.includes('Sick leave'));
 assert.ok(!text.includes('Лікарняний'));
 assert.ok(text.endsWith('END:VCALENDAR\r\n'));
});
test('hourly personal time exports a two-hour Outlook event instead of an all-day block',()=>{
 const m=model();m("state.requests.push({id:'p',person:'me',type:'personal',unit:'hours',hours:2,start:'2030-01-08',end:'2030-01-08',startTime:'09:00',endTime:'11:00',status:'approved'});");
 const text=m('buildOutlookCalendar(2030).text');
 assert.ok(!text.includes('VALUE=DATE'));
 const a=text.match(/DTSTART:(\d{8}T\d{6}Z)/)[1],b=text.match(/DTEND:(\d{8}T\d{6}Z)/)[1];
 const date=x=>Date.UTC(+x.slice(0,4),+x.slice(4,6)-1,+x.slice(6,8),+x.slice(9,11),+x.slice(11,13));
 assert.equal(date(b)-date(a),2*60*60*1000);
});
