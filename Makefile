




.PHONY: test


install:
	npm install


lint:
	eslint index.js lib test

test:
	lab -c -v
