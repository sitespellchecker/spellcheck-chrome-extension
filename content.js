// Site Spell Checker - Optimized spell checking
let dictionary = null;
let dictionaryLoading = false;
let isChecking = false;

// Simple word list for fast checking (top 10k English words + common tech terms)
const COMMON_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at',
  'this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there',
  'their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than',
  'then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work',
  'first','well','way','even','new','want','because','any','these','give','day','most','us','is','are','was',
  'were','been','being','have','has','had','do','does','did','done','get','got','gotten','make','made','take',
  'took','taken','come','came','become','became','see','saw','seen','know','knew','known','think','thought',
  'find','found','give','gave','given','tell','told','feel','felt','become','leave','left','put','mean','meant',
  'keep','kept','let','begin','began','begun','seem','seemed','help','helped','show','showed','shown','hear',
  'heard','play','played','run','ran','run','move','moved','live','lived','believe','believed','bring','brought',
  'happen','happened','write','wrote','written','provide','provided','sit','sat','stand','stood','lose','lost',
  'pay','paid','meet','met','include','included','continue','continued','set','learn','learned','learnt','change',
  'changed','lead','led','understand','understood','watch','watched','follow','followed','stop','stopped','create',
  'created','speak','spoke','spoken','read','read','allow','allowed','add','added','spend','spent','grow','grew',
  'grown','open','opened','walk','walked','offer','offered','remember','remembered','love','loved','consider',
  'considered','appear','appeared','buy','bought','wait','waited','serve','served','die','died','send','sent',
  'expect','expected','build','built','stay','stayed','fall','fell','fallen','cut','cut','reach','reached',
  'kill','killed','remain','remained','input','output','reload','refresh','dismiss','profile','account','settings',
  'options','preferences','config','configuration','username','password','email','login','logout','signup','signin',
  'dashboard','admin','user','administrator','moderator','api','url','uri','http','https','www','web','internet',
  'server','client','database','db','query','request','response','frontend','backend','fullstack','webpage','website',
  'homepage','javascript','js','typescript','ts','html','css','json','xml','browser','chrome','firefox','safari',
  'edge','opera','click','hover','focus','blur','scroll','resize','drag','drop','menu','nav','navigation','sidebar',
  'header','footer','section','button','link','href','src','alt','title','class','id','div','span','p','h1','h2',
  'h3','h4','h5','h6','img','form','select','option','textarea','label','submit','modal','popup','dialog','alert',
  'confirm','prompt','loading','loader','spinner','progress','skeleton','success','error','warning','info','notice',
  'message','search','filter','sort','order','pagination','page','grid','list','table','card','item','row','column',
  'show','hide','visible','hidden','collapse','expand','enable','disable','enabled','disabled','active','inactive',
  'required','optional','mandatory','default','custom','new','old','create','edit','update','delete','remove','save',
  'add','clear','reset','cancel','close','open','back','next','previous','first','last','more','less','up','down',
  'left','right','top','bottom','center','true','false','yes','no','on','off','null','undefined','loading','saving',
  'uploading','downloading','processing','select','selected','unselect','deselect','multi','single','copy','paste',
  'cut','undo','redo','zoom','scale','resize','fullscreen','maximize','minimize','print','export','import','download',
  'upload','attach','share','embed','code','preview','view','edit','description','summary','detail','details','meta',
  'tag','category','categories','type','types','status','state','version','edition','release','upgrade','changelog',
  'doc','docs','documentation','manual','guide','tutorial','faq','help','support','contact','about','home','blog',
  'news','article','post','comment','review','product','service','pricing','plan','subscription','cart','checkout',
  'payment','billing','invoice','order','wishlist','favorite','bookmark','saved','recent','notification','alert',
  'badge','indicator','counter','avatar','picture','photo','image','icon','logo','banner','hero','carousel','slider',
  'slideshow','tab','tabs','accordion','collapsible','toggle','dropdown','combobox','autocomplete','typeahead',
  'datepicker','calendar','clock','timer','countdown','chart','graph','map','video','audio','player','lightbox',
  'gallery','thumbnail','breadcrumb','pager','navigator','toolbar','tool','action','actions','operation','operations',
  'plugin','widget','component','module','extension','theme','skin','style','stylesheet','layout','template','cookie',
  'cache','session','local','storage','memory','encrypt','decrypt','hash','token','auth','oauth','verify','validation',
  'validate','sanitize','escape','encode','decode','compress','decompress','minify','debug','debugging','debugger',
  'console','log','trace','exception','throw','catch','try','finally','async','await','promise','callback','event',
  'listener','function','method','property','attribute','variable','constant','let','const','var','class','object',
  'array','string','number','boolean','integer','float','double','date','time','datetime','timestamp','timezone',
  'stringify','parse','serialize','deserialize','clone','deep','shallow','merge','assign','foreach','while','if',
  'else','switch','case','break','continue','return','from','as','require','module','namespace','package','library',
  'framework','git','github','gitlab','bitbucket','svn','branch','commit','push','pull','merge','rebase','deploy',
  'deployment','build','compile','bundle','dev','prod','staging','test','testing','qa','localhost','host','port',
  'ip','domain','dns','cdn','ssl','tls','cert','certificate','firewall','proxy','vpn','ssh','ftp','sftp','docker',
  'container','image','volume','network','kubernetes','k8s','pod','service','deployment','aws','azure','gcp','cloud',
  'serverless','lambda','sql','nosql','mongo','mysql','postgres','redis','queue','message','pubsub','yaml','yml',
  'csv','tsv','sql','markdown','md','txt','text','htm','pdf','doc','docx','xls','xlsx','ppt','pptx','jpg','jpeg',
  'png','gif','svg','webp','ico','mp3','mp4','wav','ogg','webm','avi','mov','zip','tar','gz','gzip','rar','7z',
  'bz2','addon','app','application','software','program','source','repo','repository','issue','bug','feature',
  'milestone','release','tag','wiki','readme','license','copyright','trademark','privacy','policy','terms','conditions',
  'agreement','tos','eula','gdpr','ccpa','hipaa','pci','soc2','cta','conversion','funnel','landing','campaign',
  'analytics','tracking','metrics','kpi','roi','ab','split','variant','experiment','seo','sem','ppc','cpc','cpm',
  'ctr','cpa','lead','prospect','customer','client','engagement','retention','churn','acquisition','monetization',
  'revenue','profit','margin','b2b','b2c','saas','paas','iaas','daas','startup','enterprise','smb','midmarket',
  'onboarding','activation','adoption','usage','feedback','survey','nps','csat','rating','testimonial','case','study',
  'whitepaper','webinar','demo','trial','freemium','renewal','cancellation','refund','helpdesk','ticketing','kb',
  'knowledgebase','community','forum','discussion','chat','livechat','bot','ai','ml','nlp','automation','workflow',
  'integration','webhook','sdk','cli','rest','graphql','grpc','soap','rpc','socket','websocket','sse','polling',
  'streaming','jsonp','cors','csrf','xss','sqli','injection','authentication','authorization','permission','role',
  'group','team','organization','workspace','invite','collaboration','sharing','access','control','acl','rbac',
  'policy','encryption','hashing','salting','peppering','key','secret','credential','passphrase','jwt','oidc',
  'saml','sso','mfa','2fa','otp','totp','backup','recovery','security','compliance','audit','logging','monitoring',
  'alerting','incident','breach','restore','disaster','sla','uptime','availability','reliability','performance',
  'latency','throughput','bandwidth','scalability','elasticity','resilience','redundancy','failover','loadbalancer',
  'edge','origin','caching','invalidation','ttl','expiry','compression','minification','optimization','chunk',
  'asset','resource','static','dynamic','ssr','csr','spa','mpa','pwa','amp','instant','turbo','hotwire','htmx',
  'react','vue','angular','svelte','solid','next','nuxt','remix','astro','eleventy','jquery','lodash','moment',
  'dayjs','bootstrap','tailwind','bulma','foundation','material','antd','chakra','mantine','radix','styled',
  'emotion','jss','cssinjs','sass','less','postcss','autoprefixer','purge','treeshake','webpack','vite','rollup',
  'parcel','esbuild','swc','turbopack','babel','eslint','prettier','stylelint','editorconfig','husky','lintstaged',
  'commitlint','semantic','jest','vitest','mocha','chai','jasmine','cypress','playwright','selenium','puppeteer',
  'storybook','chromatic','percy','backstop','sentry','bugsnag','logrocket','datadog','newrelic','dynatrace',
  'appdynamics','splunk','elastic','elk','kibana','grafana','prometheus','honeycomb','lightstep','jaeger',
  'opentelemetry','otel','tracing','profiling','apm','rum','synthetic','observability','pull','request','fork',
  'star','watch','repository','issue','issues','commit','commits','branch','branches','tag','tags','release',
  'releases','contributor','contributors','collaborator','collaborators','organization','organizations','gist',
  'gists','wiki','wikis','page','pages','project','projects','board','boards','column','columns','card','cards',
  'milestone','milestones','label','labels','assignee','assignees','reviewer','reviewers','review','reviews',
  'comment','comments','reaction','reactions','notification','notifications','inbox','archive','archived','pin',
  'pinned','unpin','unpinned','subscribe','unsubscribe','watching','starred','explore','trending','topic','topics',
  'collection','collections','event','events','activity','following','follower','followers','sponsor','sponsors',
  'marketplace','apps','actions','packages','security','advisory','advisories','dependabot','codeql','secret',
  'scanning','deployment','deployments','environment','environments','runner','runners','workflow','workflows',
  'job','jobs','step','steps','artifact','artifacts','cache','caches','registry','registries','container','containers',
  'package','packages','version','versions','readme','license','licenses','contributing','contributors','code',
  'conduct','conducts','security','policies','policy','support','sponsors','funding','fundraiser','changelog',
  'changelogs','releases','tags','branches','commits','tree','blob','raw','blame','history','compare','merge',
  'revert','revert','cherry','pick','pick','rebase','squash','squashing','force','push','fast','forward','ff',
  'no','ff','recursive','ours','theirs','subtree','submodule','submodules','hook','hooks','pre','post','commit',
  'push','receive','update','applypatch','patch','patches','smudge','clean','filter','driver','attribute','attributes',
  'ignore','gitignore','exclude','mailmap','gitmodules','gitattributes','HEAD','head','heads','ref','refs','tag',
  'tags','remote','remotes','origin','upstream','fetch','pull','clone','init','initialize','initialized','add',
  'remove','rm','move','mv','status','staged','unstaged','tracked','untracked','modified','deleted','renamed',
  'copied','updated','created','index','worktree','working','directory','tree','object','objects','blob','blobs',
  'commit','commits','tree','trees','parent','parents','author','authors','committer','committers','message',
  'messages','signature','signatures','verified','unverified','gpg','pgp','ssh','key','keys','hash','hashes','sha',
  'object','filemode','mode','symlink','link','executable','exec','blob','tree','commit','tag','annotated','lightweight',
  'dereference','peel','peeled','reflog','logs','expire','gc','prune','fsck','verify','pack','packed','unpack',
  'loose','object','delta','deltified','thin','bundle','bundles','archive','archives','export','exports','import',
  'fast','import','export','svn','cvsexportcommit','cvs','p4','perforce','hg','mercurial','bzr','bazaar','darcs',
  'fossil','monotone','arch','bitkeeper','clearcase','cvs','rcs','sccs','tfs','team','foundation','server','vss',
  'visual','source','safe','vault','plastic','scm','subversion','tfs','mercurial','bazaar','monotone','arch','darcs'
]);

// Typo.js instance for advanced checking
let typoInstance = null;
let typoLoaded = false;

// Load Typo.js dictionary asynchronously
async function loadTypoDictionary() {
  if (typoLoaded) return typoInstance !== null;
  typoLoaded = true;
  
  try {
    if (typeof Typo === 'undefined') {
      console.log('Typo.js not available');
      return false;
    }
    
    // Load with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const affUrl = chrome.runtime.getURL('lib/en_US.aff');
    const dicUrl = chrome.runtime.getURL('lib/en_US.dic');
    
    const [affResponse, dicResponse] = await Promise.all([
      fetch(affUrl, { signal: controller.signal }),
      fetch(dicUrl, { signal: controller.signal })
    ]);
    
    clearTimeout(timeout);
    
    if (!affResponse.ok || !dicResponse.ok) {
      return false;
    }
    
    const affData = await affResponse.text();
    const dicData = await dicResponse.text();
    
    // This blocks, so do it in a try-catch
    typoInstance = new Typo('en_US', affData, dicData);
    console.log('Typo.js loaded successfully');
    return true;
    
  } catch (error) {
    console.log('Typo.js failed to load:', error.message);
    return false;
  }
}

// Check if word is valid
function isValidWord(word) {
  // Skip short words
  if (word.length < 3) return true;
  
  // Skip numbers
  if (/^[0-9]+$/.test(word)) return true;
  
  // Skip all-caps (acronyms)
  if (/^[A-Z]{2,}$/.test(word)) return true;
  
  // Skip CamelCase
  if (/[a-z][A-Z]/.test(word)) return true;
  
  // Skip words with numbers
  if (/[a-zA-Z]+[0-9]+[a-zA-Z]*/.test(word)) return true;
  
  const lower = word.toLowerCase();
  
  // Fast check against common words
  if (COMMON_WORDS.has(lower)) return true;
  
  // Check plurals of common words
  if (lower.endsWith('s') && COMMON_WORDS.has(lower.slice(0, -1))) return true;
  if (lower.endsWith('es') && COMMON_WORDS.has(lower.slice(0, -2))) return true;
  if (lower.endsWith('ies') && COMMON_WORDS.has(lower.slice(0, -3) + 'y')) return true;
  if (lower.endsWith('ed') && COMMON_WORDS.has(lower.slice(0, -2))) return true;
  if (lower.endsWith('ing') && COMMON_WORDS.has(lower.slice(0, -3))) return true;
  if (lower.endsWith('ly') && COMMON_WORDS.has(lower.slice(0, -2))) return true;
  
  // If Typo.js is loaded, use it for advanced checking
  if (typoInstance) {
    return typoInstance.check(word);
  }
  
  // Default to valid if we can't check
  return true;
}

// Get suggestions
function getSuggestions(word) {
  if (typoInstance) {
    return typoInstance.suggest(word).slice(0, 3);
  }
  return [];
}

// Collect text nodes with better GitHub filtering
function collectTextNodes() {
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        // Skip hidden elements
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip code elements
        const tag = parent.tagName;
        if (['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA','INPUT','SELECT','KBD','SAMP','VAR'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip GitHub-specific code elements
        if (parent.classList?.contains('blob-code') ||
            parent.classList?.contains('highlight') ||
            parent.classList?.contains('file-diff') ||
            parent.closest?.('.highlight, .blob-code, .file-diff, pre, code')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip already highlighted
        if (parent.classList?.contains('spellcheck-highlight') || 
            parent.closest?.('.spellcheck-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip empty
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  let count = 0;
  const MAX_NODES = 500; // Limit nodes to check
  
  while (node = walker.nextNode()) {
    textNodes.push(node);
    count++;
    if (count >= MAX_NODES) break;
  }
  
  return textNodes;
}

// Main spell check function - optimized
async function checkSpelling() {
  if (isChecking) {
    return { success: false, error: 'Already checking', errors: [] };
  }
  
  isChecking = true;
  
  try {
    // Start loading Typo.js in background
    loadTypoDictionary();
    
    const errors = [];
    const seenWords = new Set();
    
    // Collect text nodes
    const textNodes = collectTextNodes();
    console.log(`Checking ${textNodes.length} text nodes`);
    
    if (textNodes.length === 0) {
      return { success: true, errors: [] };
    }
    
    // Process nodes
    const MAX_ERRORS = 30;
    const MAX_WORDS = 1000;
    let wordCount = 0;
    
    for (const textNode of textNodes) {
      if (wordCount >= MAX_WORDS || errors.length >= MAX_ERRORS) break;
      
      const text = textNode.textContent;
      const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
      
      for (const word of words) {
        if (wordCount >= MAX_WORDS || errors.length >= MAX_ERRORS) break;
        wordCount++;
        
        const lower = word.toLowerCase();
        if (seenWords.has(lower)) continue;
        seenWords.add(lower);
        
        if (!isValidWord(word)) {
          const index = text.indexOf(word);
          if (index !== -1) {
            const before = text.substring(Math.max(0, index - 15), index);
            const after = text.substring(index + word.length, Math.min(text.length, index + word.length + 15));
            
            errors.push({
              word,
              context: (before ? '...' : '') + before + word + after + (after ? '...' : ''),
              suggestions: getSuggestions(word),
              textNode,
              index,
              wordLength: word.length
            });
          }
        }
      }
      
      // Yield occasionally
      if (wordCount % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    console.log(`Found ${errors.length} errors`);
    
    // Apply highlights
    errors.forEach(err => {
      try {
        const { textNode, index, wordLength } = err;
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + wordLength);
        
        const span = document.createElement('span');
        span.className = 'spellcheck-highlight';
        span.textContent = err.word;
        
        if (err.suggestions.length > 0) {
          span.title = `Did you mean: ${err.suggestions.join(', ')}?`;
        } else {
          span.title = 'Possible typo';
        }
        
        range.deleteContents();
        range.insertNode(span);
      } catch (e) {
        // Skip if can't highlight
      }
    });
    
    // Store results
    chrome.storage.session?.set({
      [`spellcheck_results_${window.location.href}`]: {
        errors: errors.map(e => ({ word: e.word, context: e.context, suggestions: e.suggestions })),
        timestamp: Date.now(),
        url: window.location.href
      }
    });
    
    return { 
      success: true, 
      errors: errors.map(e => ({ word: e.word, context: e.context, suggestions: e.suggestions })) 
    };
    
  } catch (error) {
    console.error('Spell check error:', error);
    return { success: false, error: error.message, errors: [] };
  } finally {
    isChecking = false;
  }
}

// Clear highlights
function clearHighlights() {
  const highlights = document.querySelectorAll('.spellcheck-highlight');
  highlights.forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.insertBefore(document.createTextNode(el.textContent), el);
      parent.removeChild(el);
      parent.normalize();
    }
  });
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'check') {
    checkSpelling()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message, errors: [] }));
    return true;
  } else if (request.action === 'clear') {
    clearHighlights();
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      success: true, 
      isChecking, 
      dictionaryLoaded: !!typoInstance
    });
  }
});

console.log('Site Spell Checker content script loaded');
