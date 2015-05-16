#!/bin/bash
#
# This script encapsulates JavaScript code in a function and an exports
# variable.
#

OUTNAME=build/context.js
VERSION=`cat VERSION`
LICENSE=`cat LICENSE | sed -e 's/^/\/\/ /g'`

echo "// context.js version $VERSION
//
$LICENSE
//
(function() {
  window.contextjs = {};
  var exports = window.contextjs;
" >$OUTNAME

# Read the source file and indent everything.
cat src/*.js | sed -e 's/^/  /g' | sed -e 's/ *$//g' >>$OUTNAME

echo "" >>$OUTNAME
echo "})();" >>$OUTNAME
