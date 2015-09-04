TESTS = ./test/unit/*/*-test.js
REPORTER = mocha-istanbul
MOCHA = ./node_modules/.bin/_mocha
ISTANBUL = ./node_modules/.bin/istanbul
FCN_APP_PATH = /tmp

test:
	@NODE_ENV=test $(MOCHA) \
		--reporter $(REPORTER) \
		--timeout 5000 \
		--growl \
		$(TESTS)

coverage:
	@test -d reports || mkdir reports
	@NODE_ENV=test $(ISTANBUL) cover --report lcov --report cobertura \
		--dir ./reports $(MOCHA) -- -R spec $(TESTS)

clean:
	@rm -rf reports

.PHONY: test clean
