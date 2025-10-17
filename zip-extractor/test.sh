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

+assert.equal(indexOf([], []), 0);
+assert.equal(indexOf([0x01], []), 0);
+assert.equal(indexOf([], [0x01]), -1);
+assert.equal(indexOf([0x01], [0x01]), 0);
+assert.equal(indexOf([0x01, 0x02], [0x01]), 0);
+assert.equal(indexOf([0x01, 0x02], [0x02]), 1);
+assert.equal(indexOf([0x01], [0x01, 0x02]), -1);
+assert.equal(indexOf([0x01, 0x02], [0x01, 0x02]), 0);
+assert.equal(indexOf([0x01, 0x02, 0x02], [0x02]), 1);
+assert.equal(indexOf([0x01, 0x01, 0x02], [0x01, 0x02]), 1);

assert.equal(lastIndexOf([], []), 0);
assert.equal(lastIndexOf([0x01], []), 0);
assert.equal(lastIndexOf([], [0x01]), -1);
assert.equal(lastIndexOf([0x01], [0x01]), 0);
assert.equal(lastIndexOf([0x01, 0x02], [0x01]), 0);
assert.equal(lastIndexOf([0x01, 0x02], [0x02]), 1);
assert.equal(lastIndexOf([0x01], [0x01, 0x02]), -1);
assert.equal(lastIndexOf([0x01, 0x02], [0x01, 0x02]), 0);
assert.equal(lastIndexOf([0x01, 0x02, 0x02], [0x02]), 2);
assert.equal(lastIndexOf([0x01, 0x01, 0x02], [0x01, 0x02]), 1);

process.exit(0);
EOF
