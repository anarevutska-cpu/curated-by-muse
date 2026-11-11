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
