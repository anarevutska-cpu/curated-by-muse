// Best-effort extraction of public product data. No guessed prices, stock or images.
const allowed = new Set(['www.zarahome.com','zarahome.com','cendre.com.au','www.cendre.com.au','www.breda.com','breda.com','kachorovska.com','www.kachorovska.com','poc.com','www.poc.com','damnjewelry.com','www.damnjewelry.com','www.manucurist.com','manucurist.com','www.art-hall.store','art-hall.store','etnodim.ua','www.etnodim.ua','shypelyk.com','www.shypelyk.com','guniaproject.com.ua','www.guniaproject.com.ua']);
const decode = s => String(s||'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function meta(html,key){for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const attrs={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g))attrs[m[1].toLowerCase()]=m[3];if(attrs.property===key||attrs.name===key)return decode(attrs.content||'')}return null}
function productNodes(obj,out=[]){if(!obj||typeof obj!=='object')return out;if(Array.isArray(obj)){for(const v of obj)productNodes(v,out);return out}const t=obj['@type'];if((Array.isArray(t)?t:[t]).some(v=>typeof v==='string'&&v.toLowerCase()==='product'))out.push(obj);if(obj['@graph'])productNodes(obj['@graph'],out);return out}
function jsonld(html){const nodes=[];for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{productNodes(JSON.parse(match[1].trim()),nodes)}catch{}}return nodes[0]||null}
function imageUrl(value,base){let v=Array.isArray(value)?value[0]:value;if(v&&typeof v==='object')v=v.url||v.contentUrl;if(typeof v!=='string'||!v.trim()||v.trim().toLowerCase()==='null')return null;try{const u=new URL(v,base);return u.protocol==='https:'&&u.href!==base.href&&u.pathname!==base.pathname&&(u.hostname===base.hostname||(['guniaproject.com.ua','www.guniaproject.com.ua','manucurist.com','www.manucurist.com'].includes(base.hostname)&&u.hostname==='cdn.shopify.com'&&u.pathname.startsWith('/s/files/'))||(['damnjewelry.com','www.damnjewelry.com'].includes(base.hostname)&&/^(?:images-cdn\.ecwid\.com|d2j6dbq0eux0bg\.cloudfront\.net)$/.test(u.hostname))||(/(^|\.)zarahome\.com$/.test(base.hostname)&&/^(?:static\.zarahome\.net|static\.zarahome\.com|www\.zarahome\.com|zarahome\.com)$/.test(u.hostname)))&&!/\/null(?:[?#]|$)/i.test(u.pathname)?u.href:null}catch{return null}}
// Ecwid pages can expose the exact product photo in embedded HTML rather than JSON-LD.
function ecwidImage(html,pageUrl){
  if(!['damnjewelry.com','www.damnjewelry.com'].includes(pageUrl.hostname))return null;
  const id=pageUrl.pathname.match(/-p(\d+)\/?$/i)?.[1];
  if(!id)return null;
  const normalized=html.replace(/\\\//g,'/').replace(/\\u002F/gi,'/');
  const urls=normalized.match(/https:\/\/(?:d2j6dbq0eux0bg\.cloudfront\.net|images-cdn\.ecwid\.com)\/[^\s"'<>\\]+/gi)||[];
  for(const candidate of urls){
    try{
      const u=new URL(candidate.replace(/&amp;/g,'&'));
      if(u.pathname.includes('/products/'+id+'/')&&/\.(?:png|jpe?g|webp)$/i.test(u.pathname))return u.href;
    }catch{}
  }
  return null;
}
function metaPrice(html){const amount=meta(html,'product:price:amount')||meta(html,'og:price:amount');const currency=meta(html,'product:price:currency')||meta(html,'og:price:currency');if(!amount||!currency)return {};const n=Number(String(amount).replace(',','.'));return Number.isFinite(n)&&n>=0&&/^[A-Z]{3}$/.test(currency)?{price:n,currency}:{} }
// WooCommerce: use price from the single product's own summary, never from recommendations.
function parseWooCommerce(html,pageUrl){
  if(!/^\/product\/[^/]+\/?$/i.test(pageUrl.pathname))return null;
  if(!/woocommerce|wc-single-product|product-type-simple/i.test(html))return null;
  // Restrict extraction to the first product summary; never take prices from recommendations.
  const start=html.search(/<div\b[^>]*class=["'][^"']*\b(?:entry-summary|summary)\b[^"']*["'][^>]*>/i);
  if(start<0)return null;
  const segment=html.slice(start,start+60000).split(/<section\b[^>]*class=["'][^"']*\brelated\b|<div\b[^>]*class=["'][^"']*\bwoocommerce-tabs\b|<\/main>/i)[0];
  const area=segment.match(/<(?:p|div|span)\b[^>]*class=["'][^"']*\bprice\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div|span)>/i)?.[1]||'';
  const active=area.match(/<ins\b[^>]*>([\s\S]*?)<\/ins>/i)?.[1]||area.replace(/<del\b[^>]*>[\s\S]*?<\/del>/gi,'');
  const text=decode(active.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;|&#xA0;/gi,' '));
  const match=text.match(/(?:₴\s*([\d\s\u00a0.,]+)|([\d\s\u00a0.,]+)\s*(?:₴|грн|UAH))/i);
  if(!match)return null;
  const raw=(match[1]||match[2]).replace(/[\s\u00a0]/g,'');
  const normalized=raw.includes(',')&&raw.includes('.')?raw.replace(/\./g,'').replace(',','.'):raw.replace(',','.');
  const price=Number(normalized);
  return Number.isFinite(price)&&price>0?{price,currency:'UAH'}:null;
}
function artHallPrice(html,pageUrl){
  if(!['art-hall.store','www.art-hall.store'].includes(pageUrl.hostname))return null;
  return parseWooCommerce(html,pageUrl);
}
function artHallPriceDiagnostics(html,pageUrl){
  if(!['art-hall.store','www.art-hall.store'].includes(pageUrl.hostname))return null;
  const summary=html.search(/<div\b[^>]*class=["'][^"']*\b(?:entry-summary|summary)\b[^"']*["'][^>]*>/i);
  const segment=summary<0?'':html.slice(summary,summary+60000);
  const area=segment.match(/<(?:p|div|span)\b[^>]*class=["'][^"']*\bprice\b[^"']*["'][^>]*>/i);
  return {summaryFound:summary>=0,priceElementFound:!!area,hasHryvniaMarker:/₴|грн|UAH/i.test(segment),hasWooPriceClass:/woocommerce-Price-amount|amount\b/i.test(segment),hasJsonLdPrice:/"(?:price|lowPrice)"\s*:\s*["']?\d/i.test(html),hasPriceMeta:!!(meta(html,'product:price:amount')||meta(html,'og:price:amount'))};
}

// Keep amount and currency together: mixing sources can silently misprice a product.
function choosePrice(structured,metadata,platform){
  for(const [source,data] of [['jsonld',structured],['meta',metadata],['woocommerce',platform]]){
    if(data&&Number.isFinite(data.price)&&data.price>=0&&/^[A-Z]{3}$/.test(data.currency||''))
      return {price:data.price,currency:data.currency,source};
  }
  return {price:null,currency:null,source:'none'};
}
function parseOffer(p){let offers=p?.offers;if(Array.isArray(offers))offers=offers[0];if(offers?.offers&&Array.isArray(offers.offers))offers=offers.offers[0];if(!offers||typeof offers!=='object')return {};const raw=offers.price??offers.priceSpecification?.price??offers.lowPrice;const price=raw==null?null:Number(String(raw).replace(',','.'));const currency=offers.priceCurrency||offers.priceSpecification?.priceCurrency||null;const availability=String(offers.availability||'').toLowerCase();const stock=availability.includes('instock')?'yes':availability.includes('outofstock')||availability.includes('soldout')?'no':'unknown';return {price:Number.isFinite(price)&&price>=0?price:null,currency:/^[A-Z]{3}$/.test(currency||'')?currency:null,stock}}
// Zara Home public catalog endpoint. UA and PL identifiers captured from store Network requests.
const ZARA_MARKETS = {
  ua:{store:'85009963',catalog:'80290099',language:'-47',currency:'UAH'},
  pl:{store:'85009924',catalog:'80290000',language:'-47',currency:'PLN'}
};
function zaraVariant(pageUrl){
  if(!['www.zarahome.com','zarahome.com'].includes(pageUrl.hostname))return null;
  const region=pageUrl.pathname.split('/').filter(Boolean)[0];
  const article=pageUrl.pathname.match(/-l(\d{8})(?:[/?]|$)/i)?.[1];
  const color=pageUrl.searchParams.get('colorId');
  if(!article||!/^\d{3}$/.test(color||''))return null;
  return {region,article,color};
}
function parseZaraCatalog(obj,variant,currency='UAH'){
  const colors=obj?.detail?.colors;
  if(!Array.isArray(colors))throw Error('Catalog has no colors');
  const selected=colors.find(c=>String(c.id)===variant.color);
  if(!selected)throw Error('Selected color not in catalog');
  const ref=String(selected.reference||obj.detail?.reference||'');
  if(!ref.includes(variant.article+variant.color))throw Error('Catalog returned a different variant');
  const media=(obj.detail?.xmedia||[]).filter(g=>String(g.colorCode||String(g.path||'').replace('/',''))===variant.color)
    .flatMap(g=>(g.xmediaItems||[]).flatMap(set=>set.medias||[]));
  const primary=media.find(m=>m.extraInfo?.originalName==='p1') || media.find(m=>m.extraInfo?.originalName==='f1');
  const image=primary?.extraInfo?.deliveryUrl||primary?.url||null;
  const verifiedImage=typeof image==='string'&&image.startsWith('https://static.zarahome.net/assets/public/')&&image.includes(variant.article+variant.color+'-')?image:null;
  const sizes=Array.isArray(selected.sizes)?selected.sizes:[];
  const priceValues=sizes.map(s=>Number(s.price)).filter(v=>Number.isSafeInteger(v)&&v>=0);
  const uniquePrices=[...new Set(priceValues)];
  // Inditex prices are integer minor units (e.g. 339900 -> 3399.00 UAH).
  const price=uniquePrices.length===1?uniquePrices[0]/100:null;
  const available=sizes.some(s=>String(s.visibilityValue).toUpperCase()==='SHOW');
  const soldOut=sizes.length>0&&sizes.every(s=>String(s.visibilityValue).toUpperCase()==='SOLD_OUT');
  return {title:obj.name||selected.shortDescription||null,image:verifiedImage,price,currency:price===null?null:currency,stock:available?'yes':soldOut?'no':'unknown',sizes:sizes.map(s=>({name:String(s.name||''),stock:String(s.visibilityValue||'')})),diagnostics:{source:'zara-catalog',matchedVariant:variant.article+variant.color,hasImage:!!verifiedImage,hasPrice:price!==null,hasStock:available||soldOut}};
}
async function fetchZaraCatalog(variant){
  const market=ZARA_MARKETS[variant.region];
  if(!market?.store||!market?.catalog||!market?.language)throw Error('Market catalog identifiers not configured');
  const endpoint=`https://www.zarahome.com/itxrest/2/catalog/store/${market.store}/${market.catalog}/product/${variant.article}${variant.color}?languageId=${market.language}&appId=2`;
  const response=await fetch(endpoint,{headers:{'User-Agent':'Mozilla/5.0 (compatible; CuratedByMuse/1.0)','Accept':'application/json, text/plain, */*','Referer':`https://www.zarahome.com/${variant.region}/`},signal:AbortSignal.timeout(8500),redirect:'manual'});
  if(!response.ok)throw Error(`Zara catalog HTTP ${response.status}`);
  const type=response.headers.get('content-type')||'';
  if(!type.includes('json'))throw Error('Zara catalog returned non-JSON');
  const data=await response.json();
  return parseZaraCatalog(data,variant,market.currency);
}
exports.handler=async event=>{
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
  try{
    const url=new URL(event.queryStringParameters?.url||'');
    if(url.protocol!=='https:'||!allowed.has(url.hostname)||url.username||url.password)
      return {statusCode:400,headers,body:JSON.stringify({ok:false,message:'Unsupported URL'})};
    const variant=zaraVariant(url);
    let catalogError=null;
    if(variant && ZARA_MARKETS[variant.region]?.store && ZARA_MARKETS[variant.region]?.catalog && ZARA_MARKETS[variant.region]?.language){
      try{
        const result=await fetchZaraCatalog(variant);
        return {statusCode:200,headers,body:JSON.stringify({ok:true,...result,checkedAt:new Date().toISOString(),message:'Zara Home catalog API'})};
      }catch(err){catalogError=String(err.message||err)}
    }
    // Do not use the Ukrainian catalog for Polish, Spanish or other country prices.
    const res=await fetch(url.toString(),{headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html'},signal:AbortSignal.timeout(10000),redirect:'manual'});
    if(!res.ok)return {statusCode:200,headers,body:JSON.stringify({ok:false,message:`Store returned HTTP ${res.status}`,diagnostics:{httpStatus:res.status,catalogError,retryAfter:res.status===429?(res.headers.get('retry-after')||null):null}})};
    const html=(await res.text()).slice(0,2500000);
    const p=jsonld(html);
    const title=p?.name||meta(html,'og:title')||meta(html,'twitter:title')||null;
    const image=ecwidImage(html,url)||[p?.image,meta(html,'og:image'),meta(html,'twitter:image')].map(candidate=>imageUrl(candidate,url)).find(Boolean)||null;
    const structured=parseOffer(p);const metadata=metaPrice(html);const wooPrice=parseWooCommerce(html,url);const verifiedPrice=choosePrice(structured,metadata,wooPrice);const offer={...verifiedPrice,stock:structured.stock||'unknown'};
    // Zara HTML metadata may describe a different variant; never substitute its image/price.
    const variantSafe=!variant;
    return {statusCode:200,headers,body:JSON.stringify({ok:true,title:variantSafe?title:null,image:variantSafe?image:null,price:variantSafe?(offer.price??null):null,currency:variantSafe?(offer.currency??null):null,stock:variantSafe?(offer.stock??'unknown'):'unknown',checkedAt:new Date().toISOString(),message:catalogError?'Zara catalog unavailable; original data preserved':variant?'Catalog not configured for this country':'Public metadata only',diagnostics:{source:'html-fallback',catalogError,region:variant?.region||null,structuredProduct:!!p,hasImage:variantSafe&&!!image,hasPrice:variantSafe&&offer.price!=null,priceSource:verifiedPrice.source,artHall:artHallPriceDiagnostics(html,url)}})};
  }catch(err){return {statusCode:200,headers,body:JSON.stringify({ok:false,message:'Could not read store page',diagnostics:{error:String(err.message||err)}})}}
};
// Exposed only for local tests; not used by Netlify runtime.
exports._test={zaraVariant,parseZaraCatalog,ecwidImage,artHallPrice,artHallPriceDiagnostics,parseWooCommerce,choosePrice};
