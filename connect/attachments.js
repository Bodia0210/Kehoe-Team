/* KEL Connect: device-only attachment demonstration; no network upload or sharing. */
const ATTACHMENT_DB='kel-connect-local-files-v1';
const ATTACHMENT_STORE='files';
const ATTACHMENT_LIMIT=5;
const ATTACHMENT_MAX_BYTES=10*1024*1024;
const ATTACHMENT_BATCH_MAX=25*1024*1024;
const ATTACHMENT_EXTENSIONS=new Set(['jpg','jpeg','png','gif','webp','heic','heif','pdf','doc','docx','xls','xlsx','txt']);
let attachmentQueue=[];
let attachmentBusy=false;
let attachmentObjectUrls=[];
let attachmentRenderToken=0;
Object.assign(dict.en,{
 attachFile:'Attach photos or files',attachDrop:'Drop photos or documents here',
 attachSelected:'Selected attachments',attachRemove:'Remove attachment',
 attachLimit:'Up to 5 attachments, 10 MB each, 25 MB total per message.',
 attachInvalid:'Unsupported type. Use JPG, PNG, GIF, WEBP, HEIC, PDF, Word, Excel or TXT.',
 attachTooMany:'You can attach up to 5 files to a message.',
 attachTooLarge:'Each attachment must be 10 MB or smaller; 25 MB total.',
 attachStorage:'The browser could not save this file. Check private mode or available storage.',
 attachLoading:'Saving attachments locally…',attachOpen:'Open attachment',
 attachMissing:'File not found in this browser',attachSent:'Saved in this browser only — not delivered to anyone.',
 attachEmpty:'Add a message or attachment first.',attachLocal:'Attachments stay in this browser. Do not use confidential files.'
});
Object.assign(dict.uk,{
 attachFile:'Прикріпити фото або файл',attachDrop:'Перетягніть сюди фото або документ',
 attachSelected:'Вибрані вкладення',attachRemove:'Видалити вкладення',
 attachLimit:'До 5 вкладень, по 10 МБ кожне, загалом до 25 МБ на повідомлення.',
 attachInvalid:'Непідтримуваний формат. Дозволено JPG, PNG, GIF, WEBP, HEIC, PDF, Word, Excel або TXT.',
 attachTooMany:'До одного повідомлення можна додати не більше 5 файлів.',
 attachTooLarge:'Кожен файл має бути до 10 МБ, разом — до 25 МБ.',
 attachStorage:'Не вдалося зберегти файл у браузері. Перевірте приватний режим або вільне місце.',
 attachLoading:'Локально зберігаю вкладення…',attachOpen:'Відкрити вкладення',
 attachMissing:'Файл не знайдено в цьому браузері',attachSent:'Збережено лише в цьому браузері — нікому не надіслано.',
 attachEmpty:'Спочатку введіть текст або прикріпіть файл.',attachLocal:'Вкладення залишаються в цьому браузері. Не додавайте конфіденційні файли.'
});
svgPaths.attach='<path d="m21.4 11.6-8.1 8.1a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 0 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.7-7.7"/>';
svgPaths.file='<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>';
svgPaths.image='<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>';
const fileSizeText=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.ceil(n/1024))+' KB';
function attachmentKind(f){
 const extension=String(f.name||'').toLowerCase().split('.').pop();
 if(!ATTACHMENT_EXTENSIONS.has(extension))return null;
 if(['jpg','jpeg','png','gif','webp','heic','heif'].includes(extension))return 'image';
 if(extension==='pdf')return 'pdf';
 return 'document';
}
function attachmentDB(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(Error('IndexedDB not available'));return}
  const req=indexedDB.open(ATTACHMENT_DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(ATTACHMENT_STORE))req.result.createObjectStore(ATTACHMENT_STORE,{keyPath:'id'})};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Cannot access attachment storage'));
 });
}
async function storeAttachments(entries){
 const db=await attachmentDB();
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(ATTACHMENT_STORE,'readwrite');
   const store=tx.objectStore(ATTACHMENT_STORE);
   entries.forEach(e=>store.put({id:e.meta.id,file:e.file}));
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Storage write failed'));
   tx.onabort=()=>reject(tx.error||Error('Storage aborted'));
  });
 }finally{db.close()}
}
async function readAttachment(id){
 const db=await attachmentDB();
 try{
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction(ATTACHMENT_STORE,'readonly');
   const req=tx.objectStore(ATTACHMENT_STORE).get(id);
   req.onsuccess=()=>resolve(req.result?.file||null);
   req.onerror=()=>reject(req.error||Error('Storage read failed'));
  });
 }finally{db.close()}
}
async function clearDemoAttachments(){
 attachmentQueue=[];
 attachmentObjectUrls.forEach(url=>URL.revokeObjectURL(url));attachmentObjectUrls=[];
 const db=await attachmentDB().catch(()=>null);
 if(!db)return;
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction(ATTACHMENT_STORE,'readwrite');
  tx.objectStore(ATTACHMENT_STORE).clear();
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Unable to clear attachments'));
 })}catch(e){console.warn('Attachment cleanup failed',e)}finally{db.close()}
}
function clearAttachmentQueue(){attachmentQueue=[];renderPendingAttachments()}
function addSelectedAttachments(fileList){
 const chosen=Array.from(fileList||[]);
 if(!chosen.length)return;
 const accepted=[];
 for(const file of chosen){
  if(!attachmentKind(file)){toast(t('attachInvalid'));continue}
  if(file.size>ATTACHMENT_MAX_BYTES){toast(t('attachTooLarge'));continue}
  if(attachmentQueue.length+accepted.length>=ATTACHMENT_LIMIT){toast(t('attachTooMany'));break}
  const total=attachmentQueue.reduce((sum,f)=>sum+f.size,0)+accepted.reduce((sum,f)=>sum+f.size,0)+file.size;
  if(total>ATTACHMENT_BATCH_MAX){toast(t('attachTooLarge'));continue}
  accepted.push(file);
 }
 attachmentQueue.push(...accepted);
 renderPendingAttachments();
}
function renderPendingAttachments(){
 const box=$('#attachment-preview');
 if(!box)return;
 box.innerHTML=attachmentQueue.length?'<div class="attachment-preview-title">'+esc(t('attachSelected'))+'</div>'+
 attachmentQueue.map((f,i)=>'<div class="attachment-chip">'+icon(attachmentKind(f)==='image'?'image':'file')+'<span class="attachment-chip-name" title="'+esc(f.name)+'">'+esc(f.name)+'</span><small>'+fileSizeText(f.size)+'</small><button type="button" data-action="remove-attachment" data-index="'+i+'" aria-label="'+esc(t('attachRemove'))+'">'+icon('x')+'</button></div>').join(''):'';
}
function renderAttachmentCards(files){
 if(!Array.isArray(files)||!files.length)return '';
 return '<div class="message-attachments">'+files.map(f=>{
  const name=esc(f.name||'Attachment'),id=esc(f.id||''),kind=esc(f.kind||'document');
  return '<a class="message-attachment" data-attachment-id="'+id+'" href="#" aria-label="'+esc(t('attachOpen'))+': '+name+'" title="'+esc(t('attachOpen'))+': '+name+'">'+
    '<span class="attachment-thumbnail">'+icon(f.kind==='image'?'image':'file')+(f.kind==='image'?'<img data-thumb alt="" loading="lazy">':'')+'</span>'+
    '<span class="attachment-info"><strong>'+name+'</strong><small>'+fileSizeText(Number(f.size)||0)+' · '+(kind==='image'?'Photo':kind==='pdf'?'PDF':'File')+'</small></span>'+
    icon('arrow')+'</a>';
 }).join('')+'</div>';
}
async function hydrateAttachmentLinks(){
 const links=Array.from(document.querySelectorAll('[data-attachment-id]'));
 attachmentRenderToken++;
 const token=attachmentRenderToken;
 attachmentObjectUrls.forEach(url=>URL.revokeObjectURL(url));attachmentObjectUrls=[];
 for(const link of links){
  if(!link.isConnected||token!==attachmentRenderToken)break;
  const id=link.dataset.attachmentId;
  const record=(state.messages||[]).flatMap(m=>m.attachments||[]).find(x=>x.id===id);
  try{
   const file=await readAttachment(id);
   if(token!==attachmentRenderToken)return;
   if(!file){link.removeAttribute('href');link.removeAttribute('target');link.classList.add('file-unavailable');link.title=t('attachMissing');continue}
   const url=URL.createObjectURL(file);attachmentObjectUrls.push(url);
   link.href=url;
   if(record?.kind==='image'||record?.kind==='pdf'){link.target='_blank';link.rel='noopener noreferrer'}
   else{link.download=record?.name||'document'}
   const thumb=link.querySelector('[data-thumb]');
   if(thumb&&record?.kind==='image'){thumb.src=url;thumb.onerror=()=>{thumb.style.display='none'}}
  }catch(e){link.removeAttribute('href');link.classList.add('file-unavailable');link.title=t('attachMissing')}
 }
}
async function sendMessageWithAttachments(){
 const input=$('#message-input');
 if(!input||attachmentBusy)return;
 const message=input.value.trim();
 if(!message&&!attachmentQueue.length){toast(t('attachEmpty'));return}
 if(message.length>4000){toast(t('tooLong'));return}
 const files=attachmentQueue.slice(),channel=activeChat,author=actorId();
 attachmentBusy=true;
 const send=$('#message-form .send-btn');
 if(send)send.disabled=true;
 try{
  const entries=files.map(file=>({file,meta:{id:uid(),name:file.name.slice(0,180),size:file.size,kind:attachmentKind(file)}}));
  if(entries.length)await storeAttachments(entries);
  state.messages.push({id:uid(),channel,author,text:message,attachments:entries.map(x=>x.meta),at:new Date().toISOString()});
  persist();
  attachmentQueue=[];
  messageSearch='';
  render();
  $('#message-input')?.focus();
  if(entries.length)toast(t('attachSent'));
 }catch(e){
  console.warn('Cannot save local demo attachments',e);
  toast(t('attachStorage'));
 }finally{attachmentBusy=false;if(send?.isConnected)send.disabled=false}
}
document.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]');
 if(!action)return;
 if(action.dataset.action==='attach-file'){
  event.preventDefault();
  $('#message-file-input')?.click();
 }else if(action.dataset.action==='remove-attachment'){
  attachmentQueue.splice(Number(action.dataset.index),1);
  renderPendingAttachments();
 }
});
document.addEventListener('change',event=>{
 if(event.target.id==='message-file-input'){
  addSelectedAttachments(event.target.files);
  event.target.value='';
 }
});
document.addEventListener('paste',event=>{
 const target=event.target;
 if(target?.id!=='message-input'||!event.clipboardData?.files?.length)return;
 const images=Array.from(event.clipboardData.files).filter(f=>attachmentKind(f)==='image');
 if(images.length){event.preventDefault();addSelectedAttachments(images)}
});
document.addEventListener('dragover',event=>{
 const composer=event.target.closest?.('#message-form');
 if(!composer||!event.dataTransfer?.types?.includes('Files'))return;
 event.preventDefault();composer.classList.add('drag-files-over');
});
document.addEventListener('dragleave',event=>{
 const composer=event.target.closest?.('#message-form');
 if(composer&&!composer.contains(event.relatedTarget))composer.classList.remove('drag-files-over');
});
document.addEventListener('drop',event=>{
 const composer=event.target.closest?.('#message-form');
 if(!composer)return;
 event.preventDefault();composer.classList.remove('drag-files-over');
 addSelectedAttachments(event.dataTransfer.files);
});
