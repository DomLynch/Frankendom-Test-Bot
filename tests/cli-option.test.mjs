import test from 'node:test';
import assert from 'node:assert/strict';
import { optionValue } from '../scripts/lib/cli-option.mjs';
test('Sparring URLs retain every embedded equals sign', () => {
  const url='/?spar=1&opponent=pitborn&difficulty=6&weapon=longsword&skill=none&special=cleaverset&yourSpecial=setfoot';
  assert.equal(optionValue(['node','runner','--sparring-url='+url],'sparring-url',null),url);
  assert.equal(optionValue(['--seed=0'],'seed',731),'0');
});
