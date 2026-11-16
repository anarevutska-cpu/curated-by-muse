const test = require('node:test');
const assert = require('node:assert/strict');
const { _test } = require('../netlify/functions/product.js');

test('Zara UA article and color are extracted from an exact URL', () => {
  const url = new URL('https://www.zarahome.com/ua/example-l41193121?colorId=251');
  assert.deepEqual(_test.zaraVariant(url), { region: 'ua', article: '41193121', color: '251' });
});

test('Zara PL article and color are extracted separately', () => {
  const url = new URL('https://www.zarahome.com/pl/example-l41193121?colorId=251');
  assert.deepEqual(_test.zaraVariant(url), { region: 'pl', article: '41193121', color: '251' });
});

test('Missing color does not qualify for variant-specific catalog data', () => {
  const url = new URL('https://www.zarahome.com/pl/example-l41193121');
  assert.equal(_test.zaraVariant(url), null);
});

test('Catalog parser uses supplied currency and size-level stock', () => {
  const obj = {
    name: 'Test nightgown',
    detail: {
      reference: '41193121251-I2026',
      colors: [{
        id: '251',
        reference: '41193121251-I2026',
        sizes: [{ name: 'M', price: '19900', visibilityValue: 'SHOW' }]
      }],
      xmedia: []
    }
  };
  const result = _test.parseZaraCatalog(obj, { article: '41193121', color: '251' }, 'PLN');
  assert.equal(result.price, 199);
  assert.equal(result.currency, 'PLN');
  assert.equal(result.stock, 'yes');
  assert.equal(result.image, null);
});

test('Catalog parser rejects mismatched variant', () => {
  const obj = {
    detail: {
      reference: '00000000251-I2026',
      colors: [{ id: '251', sizes: [{ price: '19900', visibilityValue: 'SHOW' }] }]
    }
  };
  assert.throws(() => _test.parseZaraCatalog(obj, { article: '41193121', color: '251' }, 'PLN'), /different variant/);
});


test('WooCommerce parser extracts a price on another supported store domain', () => {
  const html = '<html><body class="woocommerce"><div class="summary entry-summary"><p class="price"><span class="woocommerce-Price-amount amount"><bdi>1 250,00 <span>₴</span></bdi></span></p></div></body></html>';
  const result = _test.parseWooCommerce(html, new URL('https://example-shop.com/product/ceramic-plate/'));
  assert.deepEqual(result, { price: 1250, currency: 'UAH' });
});

test('WooCommerce parser prefers the current sale price over crossed-out price', () => {
  const html = '<body class="woocommerce"><div class="summary entry-summary"><p class="price"><del><bdi>2000 ₴</bdi></del><ins><bdi>1500 ₴</bdi></ins></p></div></body>';
  assert.deepEqual(_test.parseWooCommerce(html, new URL('https://example-shop.com/product/plate/')), { price: 1500, currency: 'UAH' });
});

test('WooCommerce parser does not use recommendations without a product summary', () => {
  const html = '<body class="woocommerce"><section class="related"><p class="price"><bdi>900 ₴</bdi></p></section></body>';
  assert.equal(_test.parseWooCommerce(html, new URL('https://example-shop.com/product/plate/')), null);
});

test('WooCommerce parser rejects category pages', () => {
  const html = '<body class="woocommerce"><div class="summary entry-summary"><p class="price"><bdi>900 ₴</bdi></p></div></body>';
  assert.equal(_test.parseWooCommerce(html, new URL('https://example-shop.com/shop/')), null);
});

test('Price and currency are selected together from one source', () => {
  const selected = _test.choosePrice({price:100,currency:null},{price:120,currency:'UAH'},{price:90,currency:'UAH'});
  assert.deepEqual(selected,{price:120,currency:'UAH',source:'meta'});
});

test('Missing currency never inherits a currency from a different source', () => {
  const selected = _test.choosePrice({price:100,currency:null},{},{});
  assert.deepEqual(selected,{price:null,currency:null,source:'none'});
});

test('Structured product price and currency take priority as a pair', () => {
  const selected = _test.choosePrice({price:75,currency:'EUR'},{price:100,currency:'UAH'},{price:120,currency:'UAH'});
  assert.deepEqual(selected,{price:75,currency:'EUR',source:'jsonld'});
});

test('Shopify URL maps only exact product handles to public JSON', () => {
  assert.equal(_test.shopifyCatalogUrl(new URL('https://guniaproject.com.ua/products/velikodnya-maslyanka-vesna')).href,'https://guniaproject.com.ua/products/velikodnya-maslyanka-vesna.js');
  assert.equal(_test.shopifyCatalogUrl(new URL('https://www.manucurist.com/en/products/active-starter-kit-gift-set')).href,'https://www.manucurist.com/en/products/active-starter-kit-gift-set.js');
  assert.equal(_test.shopifyCatalogUrl(new URL('https://guniaproject.com.ua/collections/all')),null);
});
test('Shopify parser preserves unknown price without a verified currency', () => {
  const data={title:'Butter dish',featured_image:'https://cdn.shopify.com/s/files/1/test.jpg',variants:[{id:12,price:380000,available:true}]};
  const result=_test.parseShopifyProduct(data,new URL('https://guniaproject.com.ua/products/velikodnya-maslyanka-vesna'));
  assert.equal(result.price,null);
  assert.equal(result.stock,'yes');
  assert.equal(result.diagnostics.matchedVariant,'12');
});
test('Shopify parser requires exact variant match', () => {
  const data={title:'Kit',currency:'EUR',variants:[{id:12,price:5900,available:true},{id:13,price:6200,available:false}]};
  const result=_test.parseShopifyProduct(data,new URL('https://www.manucurist.com/en/products/active-starter-kit-gift-set?variant=13'));
  assert.equal(result.price,62);
  assert.equal(result.stock,'no');
  assert.equal(_test.parseShopifyProduct(data,new URL('https://www.manucurist.com/en/products/active-starter-kit-gift-set?variant=99')),null);
});

test('Etoile collection link resolves to exact Shopify product endpoint', () => {
  const url=new URL('https://etoile.com/collections/capsule-case/products/capsule-case?variant=56520117813620');
  assert.equal(_test.shopifyCatalogUrl(url).href,'https://etoile.com/products/capsule-case.js');
  const product={title:'Capsule Case',currency:'USD',variants:[{id:56520117813620,price:6500,available:true},{id:111,price:7000,available:false}]};
  const parsed=_test.parseShopifyProduct(product,url);
  assert.equal(parsed.diagnostics.matchedVariant,'56520117813620');
  assert.equal(parsed.price,65);
  assert.equal(parsed.stock,'yes');
});


test('CENDRÉ Shopify product URL is recognized',()=>{
  assert.equal(_test.shopifyCatalogUrl(new URL('https://cendre.com.au/products/emmeline-watch-silver')).href,'https://cendre.com.au/products/emmeline-watch-silver.js');
});
test('CENDRÉ sale uses selected variant price, compare-at and AUD as a matched set',()=>{
  const product={title:'Emmeline Watch',currency:'AUD',variants:[
    {id:10,price:14500,compare_at_price:null,available:true},
    {id:11,price:10150,compare_at_price:14500,available:true}
  ]};
  const result=_test.parseShopifyProduct(product,new URL('https://cendre.com.au/products/emmeline-watch-silver?variant=11'));
  assert.equal(result.price,101.5);
  assert.equal(result.compareAtPrice,145);
  assert.equal(result.currency,'AUD');
  assert.equal(result.stock,'yes');
});
test('Shopify compare-at is absent when not discounted or currency is unknown',()=>{
  const base={title:'Watch',variants:[{id:1,price:10000,compare_at_price:10000,available:true}]};
  assert.equal(_test.parseShopifyProduct({...base,currency:'AUD'},new URL('https://cendre.com.au/products/watch')).compareAtPrice,null);
  assert.equal(_test.parseShopifyProduct({...base,currency:'AUD',variants:[{id:1,price:10000,compare_at_price:9000}]},new URL('https://cendre.com.au/products/watch')).compareAtPrice,null);
  assert.equal(_test.parseShopifyProduct({...base,variants:[{id:1,price:10000,compare_at_price:12000}]},new URL('https://cendre.com.au/products/watch')).compareAtPrice,null);
});
test('Shopify multi-variant products without a selection cannot invent a sale',()=>{
  const p={title:'Watch',currency:'AUD',variants:[{id:1,price:10000,compare_at_price:12000},{id:2,price:15000,compare_at_price:18000}]};
  const result=_test.parseShopifyProduct(p,new URL('https://cendre.com.au/products/watch'));
  assert.equal(result.price,null);assert.equal(result.compareAtPrice,null);
  assert.equal(result.diagnostics.variantSelectionRequired,true);
});
test('Shopify blocked or incorrect variants are never silently substituted',()=>{
  const p={title:'Watch',currency:'AUD',variants:[{id:1,price:10000,compare_at_price:12000}]};
  assert.equal(_test.parseShopifyProduct(p,new URL('https://cendre.com.au/products/watch?variant=2')),null);
});
test('WooCommerce sale price comes from product summary, not recommendations',()=>{
  const html='<body class="woocommerce"><div class="summary entry-summary"><p class="price"><del>2 000 ₴</del><ins>1 400 ₴</ins></p></div><section class="related"><p class="price">500 ₴</p></section></body>';
  assert.deepEqual(_test.parseWooCommerce(html,new URL('https://shypelyk.com/product/test/')),{price:1400,currency:'UAH'});
});
test('WooCommerce gallery extraction never uses unrelated recommendations',()=>{
  const html='<body class="woocommerce"><div class="woocommerce-product-gallery"><img data-large_image="https://shypelyk.com/wp-content/uploads/product.webp"></div><section class="related"><img src="https://shypelyk.com/wp-content/uploads/other.webp"></section></body>';
  const found=_test.wooGalleryImages(html,new URL('https://shypelyk.com/product/test/'));
  assert.ok(found.includes('https://shypelyk.com/wp-content/uploads/product.webp'));
  assert.ok(!found.includes('https://shypelyk.com/wp-content/uploads/other.webp'));
});
test('Store price source selection never mixes currencies or guesses values',()=>{
  assert.deepEqual(_test.choosePrice({price:null,currency:'EUR'},{price:145,currency:'AUD'},null),{price:145,currency:'AUD',source:'meta'});
  assert.deepEqual(_test.choosePrice({}, {}, null),{price:null,currency:null,source:'none'});
});

test('Etnodim sale is extracted only from its own product price section',()=>{
 const html='<h1>Бавовняна кишеня</h1><div>Ціна: 2 500 ₴ / 2 000 ₴</div><section>related 300 ₴</section>';
 assert.deepEqual(_test.etnodimSale(html,new URL('https://etnodim.ua/accessories/kyshenya-zatayenka')),{price:2000,compareAtPrice:2500,currency:'UAH'});
 assert.equal(_test.etnodimSale(html,new URL('https://etnodim.ua/other')),null);
});
test('Etnodim does not infer sale without a verified pair',()=>{
 assert.equal(_test.etnodimSale('<h1>Product</h1><p>Ціна: 2 000 ₴</p>',new URL('https://etnodim.ua/accessories/kyshenya-zatayenka')),null);
});
