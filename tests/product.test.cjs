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
