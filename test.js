var _ = require('lodash');
var sourceHanSansUtf32MapJp = require('require-main')();
var test = require('tape');

test('sourceHanSansCodePointMapJp()', function(t) {
  'use strict';

  t.plan(1);
  t.ok(
    _.isPlainObject(sourceHanSansUtf32MapJp()),
    'returns a plain object.'
  );
});
