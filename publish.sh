#!/bin/bash

loc=/tmp/.rsc-test-helper
yarn build 
mkdir -p $loc
rm $loc/*
cp package.json README.md LICENSE $loc/
cp -r dist/* $loc
cd $loc && npm publish