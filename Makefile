.PHONY: clean test

build/context.js: build
	sh skeletize.sh

build:
	mkdir build

clean:
	rm -rf build
