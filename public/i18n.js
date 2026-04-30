/* AikitPros i18n shared widget */
(function(){
  var KEY='aikitpros_lang';
  var saved=localStorage.getItem(KEY);
  var path=location.pathname;
  if(saved==='zh' && /\/landing\.html?$/.test(path)){location.replace('/landing-zh.html');return}
  if(saved==='en' && /\/landing-zh\.html?$/.test(path)){location.replace('/landing.html');return}
  var isZH = saved==='zh' || /landing-zh/.test(path) || document.documentElement.lang==='zh';
  var DICT={
    'Features':'功能','How it works':'如何使用','Launch App':'启动应用',
    'Home':'首页','Pricing':'定价','Demo':'体验','Why Us':'为什么选我们',
    'Try Demo':'体验产品','How billing works':'计费说明','Console':'控制台',
    'Simple, pay-as-you-go pricing':'简洁透明·按需付费',
    'Free Starter':'免费体验','Pay As You Go':'按需付费',
    'to start':'起步','Cancel':'取消',
    'Try Live Demo':'体验在线 Demo','Built on Ace Data Cloud':'基于 Ace Data Cloud',
    'Campaigns / month':'每月广告量','Video length':'视频时长',
    'Competitor stack':'竞品组合','You save / month':'每月节省','Annual savings':'年度节省'
  };
  function translate(){
    if(!isZH)return;
    document.documentElement.lang='zh';
    var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);
    var ns=[],n;while(n=w.nextNode())ns.push(n);
    ns.forEach(function(t){var k=t.nodeValue.trim();if(DICT[k])t.nodeValue=t.nodeValue.replace(k,DICT[k])});
  }
  function inject(){
    if(document.querySelector('.lang-switch'))return;
    var css=document.createElement('style');
    css.textContent='.lang-switch{display:inline-flex;align-items:center;background:#1a1a2e;border-radius:20px;padding:2px;margin-left:16px;vertical-align:middle}.lang-switch a{padding:6px 14px;border-radius:18px;font-size:13px;text-decoration:none;color:#a0a0b5;cursor:pointer}.lang-switch a.active{background:linear-gradient(90deg,#8a7dff,#ff7db6);color:#fff}';
    document.head.appendChild(css);
    var sw=document.createElement('div');sw.className='lang-switch';
    sw.innerHTML='<a data-l="en"'+(!isZH?' class="active"':'')+'>EN</a><a data-l="zh"'+(isZH?' class="active"':'')+'>中文</a>';
    sw.addEventListener('click',function(e){
      var l=e.target.getAttribute('data-l');if(!l)return;
      localStorage.setItem(KEY,l);
      if(l==='zh' && /\/landing\.html?$/.test(location.pathname)){location.href='/landing-zh.html';return}
      if(l==='en' && /\/landing-zh\.html?$/.test(location.pathname)){location.href='/landing.html';return}
      location.reload();
    });
    var nav=document.querySelector('header nav')||document.querySelector('header')||document.body;
    nav.appendChild(sw);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){inject();translate()});
  else{inject();translate()}
})();
