# Gmail.js Chrome Extension

Hello world chrome extension using gmail.js

This is a sample chome extension that uses gmail.js to build apps on top of Gmail.

The manifest in this repo bypasses the new Content Security Policy (CSP) enforced by Gmail.

### Please use the latest `gmail.js` file from the original repo linked below

**http://github.com/kartiktalwar/gmail.js**

##Possible Refactoring

main.js
 - Holds the gmail.observe bindings and WebSockets calls
pmail.js
 - Holds the encrypt and decrypt high-level functions
index.js
 - Holds the parsing and encrypting for the index

