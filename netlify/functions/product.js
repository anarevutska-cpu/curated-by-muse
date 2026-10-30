// Best-effort extraction of public product data. No guessed prices, stock or images.
const allowed = new Set(['www.zarahome.com','zarahome.com','cendre.com.au','www.cendre.com.au','www.breda.com','breda.com','kachorovska.com','www.kachorovska.com','poc.com','www.poc.com']);
const decode = s => String(s||'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function meta(html,key){for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const attrs={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g))attrs[m[1].toLowerCase()]=m[3];if(attrs.property===key||attrs.name===key)return decode(attrs.content||'')}return null}
function productNodes(obj,out=[]){if(!obj||typeof obj!=='object')return out;if(Array.isArray(obj)){for(const v of obj)productNodes(v,out);return out}const t=obj['@type'];if((Array.isArray(t)?t:[t]).some(v=>typeof v==='string'&&v.toLowerCase()==='product'))out.push(obj);if(obj['@graph'])productNodes(obj['@graph'],out);return out}
function jsonld(html){const nodes=[];for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{productNodes(JSON.parse(match[1].trim()),nodes)}catch{}}return nodes[0]||null}
function imageUrl(value,base){let v=Array.isArray(value)?value[0]:value;if(v&&typeof v==='object')v=v.url||v.contentUrl;if(typeof v!=='string'||!v.trim()||v.trim().toLowerCase()==='null')return null;try{const u=new URL(v,base);return u.protocol==='https:'&&(u.hostname===base.hostname||(/(^|\.)zarahome\.com$/.test(base.hostname)&&/^(?:static\.zarahome\.net|static\.zarahome\.com|www\.zarahome\.com|zarahome\.com)$/.test(u.hostname)))&&!/\/null(?:[?#]|$)/i.test(u.pathname)?u.href:null}catch{return null}}
function metaPrice(html){const amount=meta(html,'product:price:amount')||meta(html,'og:price:amount');const currency=meta(html,'product:price:currency')||meta(html,'og:price:currency');if(!amount||!currency)return {};const n=Number(String(amount).replace(',','.'));return Number.isFinite(n)&&n>=0&&/^[A-Z]{3}$/.test(currency)?{price:n,currency}:{} }
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
    if(!res.ok)return {statusCode:200,headers,body:JSON.stringify({ok:false,message:`Store returned HTTP ${res.status}`,diagnostics:{httpStatus:res.status,catalogError}})};
    const html=(await res.text()).slice(0,2500000);
    const p=jsonld(html);
    const title=p?.name||meta(html,'og:title')||meta(html,'twitter:title')||null;
    const image=imageUrl(p?.image||meta(html,'og:image')||meta(html,'twitter:image'),url);
    const offer={...metaPrice(html),...Object.fromEntries(Object.entries(parseOffer(p)).filter(([k,v])=>v!==null&&v!==undefined))};
    // Zara HTML metadata may describe a different variant; never substitute its image/price.
    const variantSafe=!variant;
    return {statusCode:200,headers,body:JSON.stringify({ok:true,title:variantSafe?title:null,image:variantSafe?image:null,price:variantSafe?(offer.price??null):null,currency:variantSafe?(offer.currency??null):null,stock:variantSafe?(offer.stock??'unknown'):'unknown',checkedAt:new Date().toISOString(),message:catalogError?'Zara catalog unavailable; original data preserved':variant?'Catalog not configured for this country':'Public metadata only',diagnostics:{source:'html-fallback',catalogError,region:variant?.region||null,structuredProduct:!!p,hasImage:variantSafe&&!!image,hasPrice:variantSafe&&offer.price!=null}})};
  }catch(err){return {statusCode:200,headers,body:JSON.stringify({ok:false,message:'Could not read store page',diagnostics:{error:String(err.message||err)}})}}
};
// Exposed only for local tests; not used by Netlify runtime.
exports._test={zaraVariant,parseZaraCatalog};
