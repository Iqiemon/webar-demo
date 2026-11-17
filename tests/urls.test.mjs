import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageUrl, isLocalUrl } from '../js/urls.js';

test('pageUrl', () => {
  assert.equal(pageUrl('https://demo.example.com/ar/', 'product.html', { p: 'sofa' }), 'https://demo.example.com/ar/product.html?p=sofa');
  assert.equal(pageUrl('https://demo.example.com/ar/index.html', 'showroom.html'), 'https://demo.example.com/ar/showroom.html');
});

test('isLocalUrl', () => {
  for (const u of ['http://localhost:8080/', 'http://127.0.0.1/', 'http://[::1]/', 'http://192.168.1.20/', 'http://10.0.0.5/', 'http://172.20.1.1/', 'http://mypc.local/'])
    assert.equal(isLocalUrl(u), true, u);
  for (const u of ['https://demo.example.com/', 'http://172.32.0.1/', 'https://8.8.8.8/'])
    assert.equal(isLocalUrl(u), false, u);
});
