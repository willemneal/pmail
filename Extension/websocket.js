function createWebSocket(ws_uri) {
  var ws;
  ws = new WebSocket(ws_uri + "?username=" + gmail.get.user_email());
  //console.log("1: " + ws_uri);
  //ws = new WebSocket(ws_uri + "?email=" + gmail.get.user_email());
  ws.onopen = function() {
    console.log("WebSocket connected to", ws_uri);
  };
  ws.onerror = function() {
    console.log("Could not establish contact with", ws.url, 
      " Please click the gray shield on the right of the URL bar and" +
      " then click \"Load unsafe scripts\"." + 
      " Please try again later.")
  }
  ws.onclose = function() {
    console.log("WebSocket closed.");
  };
  // Receiving a message from the Pmail server
  ws.onmessage = function(evt) {
    console.log("Received message from server: ");
    console.log(evt.data);

    // The data is a list of ids
    if (evt.data.match(/\[/) != null) {
      var id_arr = parseSearchResult(evt.data);
      if (id_arr == null) {
      	alert("Pmail could not find the keyword you were looking for.")
        return false;
      }
      var email_id_arr = new Array();
      for (var i in id_arr) {
        // Convert the decimal string (server result) to a hex string
        // (gmail unique email id)
        var id = Long.fromString(id_arr[i], true, 16);
        email_id_arr.push(id.toString(16));
      }
      console.log("loading the following emails: ");
      console.log(email_id_arr);
      // This should put the emails on the Inbox page
      loadSearchResults(email_id_arr);
    } 
  }; 
  return ws;
}   
/**
 * Checks the status of the WebSocket before sending the package. 
 * If the WebSocket is CLOSING or CLOSED it re-estabilshes connection before
 * sending.
 * @param  {String} package string message to send
 * @param  {int} count   used to keep track of recursion
 * @return {nil}         void
 */
function sendWebSocket(package, count) {
  console.log("The WS state now is: ", ws.readyState);
  var count = typeof count !== 'undefined' ?  count : 5;
  if (count <= 0) {
    console.log("WebSocket is not available. Please try again later");
  }
  if (ws && ws.readyState == 1) {
      ws.send(package);        
      console.log("index sent, hurray!");
  } else if (ws.readyState == 2 || ws.readyState == 3) {
    // Re-establish WebSocket
    console.log("The send ws url is: ", ws_uri);
    //ws = createWebSocket(ws_uri);
    ws = createWebSocket(ws_uri + "pmail.php?email=" + gmail.get.user_email());
    //console.log("2: " + ws_uri);
    //Recursive call after 0.5sec
    //setTimeout(sendWebSocket(package, count-1), 500) 
    sendWebSocket(package, count-1);
  } else {
    console.log("WebSocket is not available. Please try again later");
  }
}

/*
function sendWebSocket(package, count) {
  console.log("The WS state now is: ", ws.readyState);
  var count = typeof count !== 'undefined' ?  count : 5;
  if (count <= 0) {
    console.log("WebSocket is not available. Please try again later1");
  }
  if (ws && ws.readyState == 1) {
      ws.send(package);    
      console.log("index sent, hurray!");    
  }else if (ws.readyState == 2 || ws.readyState == 3) {
    // Re-establish WebSocket
    //console.log("what is ws?" + ws_uri);
    //ws = createWebSocket(ws_uri);
    //Recursive call after 0.5sec
    //setTimeout(sendWebSocket(package, count-1), 500); 
    console.log("The send ws url is: ", ws_uri);
    ws = createWebSocket(ws_uri + "pmail.php?email=" + gmail.get.user_email());
    //ws = new WebSocket(ws_uri + "pmail.php?email=" + gmail.get.user_email());
    //Here have to be create Websocket, because we need to get results!

    //ws = new WebSocket(ws_uri + "pmail.php");
    sendWebSocket(package, count-1);
  } else {
    console.log("WebSocket is not available. Please try again later2");
  }
}
*/



/**
 * Parse the search result from the server
 */
function parseSearchResult(result) {
  return result.match(/[\dabcdef]+/g)
}

console.log('websocket.js loaded');