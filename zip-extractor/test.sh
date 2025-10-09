#!/bin/sh

/usr/bin/env node - <<EOF
import * as assert from 'assert';

$(sed -n '/^\(async \)*function /,/^}/p' zip-extractor.html)

assert.equal(human(0), '0 B');
assert.equal(human(900), '900 B');
assert.equal(human(1023), '1023 B');
assert.equal(human(1024), '1.0 K');
assert.equal(human(1536), '1.5 K');
assert.equal(human(2048), '2.0 K');
assert.equal(human(20480), '20 K');
assert.equal(human(4194304), '4.0 M');
assert.equal(human(41943040), '40 M');

process.exit(0);
EOF
