/* globals chrome, ByteStream, URL, XMLHttpRequest */
'use strict';
console.log('response listener');

// The extension will create a writable stream and store it in this dict
// until the response body is available.
var outStreams = {};

// Capture all response bodies.
chrome.webRequest.onHeadersReceived.addListener(function(details) {
    var mimeType = extractMimeTypeFromHeaders(details.responseHeaders);
    var newStream = new ByteStream(mimeType);
    // Remember stream for later
    outStreams[details.requestId] = newStream;

    return {
        captureStream: true,
        redirectUrl: URL.createObjectURL(newStream)
    };
}, {
    types: ['main_frame', 'sub_frame', 'xmlhttprequest'],
    urls: ['*://*/*']
}, ['blocking', 'responseHeaders']);

// Handle receipt of the stream data
chrome.webRequest.onResponseStarted.addListener(function(details) {
    
    // Move stream from dict to local variable
    var outStream = outStreams[details.requestId];
    delete outStreams[details.requestId];
    var inStreamUrl = details.streamUrl;

    if (!inStreamUrl || !outStream) {
        // Either of the required parameters are missing, clean up and exit.
        if (inStreamUrl)
            URL.revokeObjectURL(inStreamUrl);
        if (outStream)
            outStream.writeAbort();
        return;
    }

    // Get the stream of the response body
    var stream;
    var x = new XMLHttpRequest();
    x.open('get', inStreamUrl);
    x.responseType = 'stream';
    x.onload = function() {
        // Get stream of response body as text.
        stream = x.response;
        stream.readBytesAs = 'text';
        collectAndWrite();
    };
    x.onerror = handleFailure;
    x.send();

    // Method to drain the input stream (received response body) and write to
    // the output stream (response body passed passed back to the browser)
    function collectAndWrite() {
        outStream.awaitSpaceAvailable().then(function() {
            stream.read().then(function(result) {
                if (result.eof) {
                    outStream.writeClose();
                } else {
                    var data = result.data;
                    // Do something with data... e.g. convert to uppercase.
                    console.log(data);
                    data = data.toUpperCase();
                    outStream.write(data).then(collectAndWrite, handleFailure);
                }
            }, handleFailure);
        }, handleFailure);
    }
    // Catch-all for errors.
    function handleFailure() {
        if (stream) stream.readAbort();
        outStream.writeAbort();
    }
}, {
    types: ['main_frame', 'sub_frame', 'xmlhttprequest'],
    urls: ['*://*/*']
});

// Handle network errors
chrome.webRequest.onErrorOccurred.addListener(function(details) {
    var outStream = outStreams[details.requestId];
    if (outStream) {
        delete outStreams[details.requestId];
        outStream.writeAbort();
    }
});

function extractMimeTypeFromHeaders(headers) {
    for (var i = 0; i < headers.length; ++i) {
        var header = headers[i];
        if (header.name.toLowerCase() === 'content-type') {
            return header.value.split(';')[0];
        }
    }
    return 'text/plain';
}
