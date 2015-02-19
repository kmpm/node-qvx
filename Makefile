




.PHONY: test


install:
	npm install


lint:
	eslint index.js lib test bin/qvxcat

test: 
	lab -c -v
