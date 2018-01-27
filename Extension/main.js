console.log('main.js loaded');

var gmail;
var delimiter = "%%";
// var count_hash = {}; // load existing hash onLoad and save onClose
var SHA256;
//var ws_uri = "ws://pmail.ece.umd.edu:8080/";
var ws_uri = "wss://pmail.ece.umd.edu:8443/";
//var ws_uri = "ws://localhost:8080";
var ws = null
var myKeyManager;

/**
 * Clean up the search bar after an encrypted search
 * @return {String} Value of last query
 */
window.onhashchange = function() {
	if (/rfc822msgid/.test(document.getElementById("gbqfq").value)) {
		document.getElementById("gbqfq").value = localStorage["prev_query"];
	}
}

function refresh(f) {
  
  if( (/in/.test(document.readyState)) || (typeof Gmail == 'undefined') || (typeof Hashes == 'undefined')) {
    setTimeout('refresh(' + f + ')', 10);
    //console.log("Refresh 1");
  } else {
    if (/rfc822msgid/.test(document.getElementById("gbqfq").value)) {
      document.getElementById("gbqfq").value = localStorage["prev_query"];
    }

    //WEI: check this out
    /*
    if (/rfc822msgid/.test(document.getElementById(":3o").innerHTML)) {
      console.log(document.getElementById(":3o").value);
      //console.log("Table item is: " + document.getElementById(":3o").innerHTML);
    }
    */
    //console.log("Refresh 2");
    f();
  }
}

function decrypt(html, node){
  var decryptedMessage = "";
  html = html.replace(/<wbr>/g,"");

  var ring = new kbpgp.keyring.KeyRing;
  var kms = [myKeyManager];
  var pgp_msg = html;
  //var asp = /* as in Encryption ... */;
  for (var i in kms) {
    ring.add_key_manager(kms[i]);
  }
  kbpgp.unbox({keyfetch: ring, armored: pgp_msg}, function(err, literals) {
    if (err != null) {
      return console.log("Problem: " + err);
    } else {
      node.innerHTML = node.innerHTML.replace(/(-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----)/g, literals[0].toString());
      createEncryptedIndex(node.innerHTML, gmail.get.email_id());
      //decryptedMessage = literals[0].toString();
      var ds = null;
      var km = null;
      /*
      ds = literals[0].get_data_signer();
      if (ds) { km = ds.get_key_manager(); }
      if (km) {
        console.log("Signed by PGP fingerprint");
        console.log(km.get_pgp_fingerprint().toString('hex'));
      }
      */
    }
  })
}

function scan_and_decrypt(){
  var composeWindows = document.getElementsByClassName("Am Al editable LW-avf");
  var emailDisplays = $('div[dir=ltr]:not([role=checkbox]');
  //console.log(emailDisplays);
  for (var i = 0; i < composeWindows.length; i++){
      var match = /(-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----)/g.exec(composeWindows[i].innerHTML)
      if (match){
        decrypt(match[0], composeWindows[i])
      }
  }

  for (var i = 0; i < emailDisplays.length; i++){
      var match = /(-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----)/g.exec(emailDisplays[i].innerHTML)
      if (match){
        decrypt(match[0], emailDisplays[i]);
      }
  }
}


//A trial to create snippets for inbox emails
function create_snippets(){
  var inbox_emails = gmail.get.visible_emails();
  for(var i=0; i< Math.min(inbox_emails.length, 20);i++){
      var email = inbox_emails[i];
      var email_id = email.id;
      var excerpt = email.excerpt;
      var body = gmail.get.email_data(email_id).threads[email_id].content_plain;
      //decrypt the email, and then create new snippets, replace 
  }

  //console.log(gmail.get.visible_emails()[0].excerpt);
  //var email_id = gmail.get.visible_emails()[0].id;
  //var body = gmail.get.email_data(email_id).threads[email_id].content_plain;
  //console.log("body is " + body);
}

//returns false for a keyfetch error, 1 for no key, and a string (true) for a found key set
function getPublicKeyBerkeley(email){
  //server must be started, see readme
  var temporary = false;
  $.ajax({ url: "https://pmail.ece.umd.edu/pmail.php?email=".concat(email), success: function(data){
  //$.ajax({ url: "https://ec2-54-205-40-22.compute-1.amazonaws.com/pmail.php?email=".concat(email), success: function(data){
    if (! data.match(/ERROR/)){
      temporary = data;
    } else {
      temporary = 1;
    }
  }, async: false});
  return temporary;
}

//userId should be the email address only: example@example.com
function generateKeys(userId){
  /*
  * Generate a Private and Public keypair
  * @param  {numBits} Integer - Any multiple of 1024. 2048 is recommended.
  * @param  {userid} String - should be like: Alice Mayfield <amayfield@quantum.com>
  * @param  {passphrase} String - password should be a 4-5 word sentence (20+ chars)
  * @return {key} String - Encrypted ASCII armored keypair (contains both Private and Public keys)
  */

  var openpgp = window.openpgp;

  var numBits = 2048;
  var userId = userId;

  //NEED TO VERIFTY THE RECOMMENDED PASS SIZE HERE, currently 100 digits long
  //generating cryptographically random values
  var passphrase = "";
  var array = new Uint32Array(10);
  window.crypto.getRandomValues(array);
  for (var i = 0; i < array.length; i++) {
    passphrase += array[i].toString();
  }

  var key = openpgp.generateKeyPair({ numBits: numBits, userId: userId, passphrase: passphrase });
  //alert("Setting up Pmail, this will take some time. Please do not leave the page until setup is complete (you will be notified via popup).");
  //return [key , password , passphrase];
  return [key , passphrase];
  
}

//if successful returns the encrypted message
//if failure because no public key returns 1
//if failure because there was an error fetching the key (ie SSL error / no internet) returns false

/*function encrypt(recipient, message, myKeyManager){
  var recipientKeys = getPublicKeyBerkeley(recipient);
  if (recipientKeys == 1 || recipientKeys == false){
    return recipientKeys;
  }
  recipientKeys = recipientKeys.split("$");
  var recipientPublicKey = recipientKeys[1].replace(/#/g,"\n").replace(/%/g,"\r").replace(/\^/g,"+");
  return encrypt_message(recipientPublicKey, message, myKeyManager); //returns a promise
}*/

function encrypt(lrecipients, message, myKeyManager){
  //add self to recipients so can decrypt in sent_mail
  //recipients[recipients.length-1] = gmail.get.user_email();
  var recipients = [];
  var i = 0;
  for(i=0; i<lrecipients.length-1; i++){
    recipients[i] = lrecipients[i];
  }
  var recipientKeys;
  var recipientPublicKeys = [];
  for(i=0;i<recipients.length;i++){
    recipientKeys = getPublicKeyBerkeley(recipients[i]);
    if (recipientKeys == 1 || recipientKeys == false){
      return recipientKeys;
    }
    recipientKeys = recipientKeys.split("$");
    recipientPublicKeys[i] = recipientKeys[1].replace(/#/g,"\n").replace(/%/g,"\r").replace(/\^/g,"+");
  }
    
  return encrypt_message(recipientPublicKeys, message, myKeyManager); //returns a promise
}

//out of date and unsused
function encryptToSelf(myKeyManager, message){
    var params = {
      msg:         message,
      encrypt_for: myKeyManager,
      //sign_with:   myKeyManager
    };
    return params;
}

/*function encrypt_message(recipientPublicKey, message, myKeyManager){
    console.log("encrypt_message");
    //console.log(recipientPublicKey);
    console.log(message);
    console.log(myKeyManager);
    //MAKE KEYBASE KEY MANAGER FOR RECIPIENT FOR ENCRYPTING
    var bob_pgp_key = recipientPublicKey;
    var recipientKey    Manager;

    kbpgp.KeyManager.import_from_armored_pgp({
      armored: bob_pgp_key
    }, function(err, bob) {
      if (!err) {
        recipientKeyManager = bob;
        console.log("bob is loaded");
      }
    });

    var params = {
      msg:         message,
      encrypt_for: recipientKeyManager,
      //sign_with:   myKeyManager
    };
    /****************
    kbpgp.box (params, function(err, result_string, result_buffer) {
      console.log(err, result_string, result_buffer);
    });
    ****************
    
    return params;
    
}*/

function encrypt_message(recipientPublicKeys, message, myKeyManager){
    console.log("encrypt_message");
    //console.log(recipientPublicKey);
    console.log(message);
    console.log(myKeyManager);
    //MAKE KEYBASE KEY MANAGER FOR RECIPIENT FOR ENCRYPTING
    var bob_pgp_key;
    var recipientKeyManagers = [];
    var i = 0;
    for(i=0; i<recipientPublicKeys.length; i++){
        bob_pgp_key = recipientPublicKeys[i];
        kbpgp.KeyManager.import_from_armored_pgp({
          armored: bob_pgp_key
        }, function(err, bob) {
          if (!err) {
            recipientKeyManagers[i] = bob;
            console.log("bob is loaded");
          }
        });
    }
    recipientKeyManagers[recipientKeyManagers.length] = myKeyManager;
    var params = {
      msg:         message,
      encrypt_for: recipientKeyManagers,
      //sign_with:   myKeyManager
    };
    /****************
    kbpgp.box (params, function(err, result_string, result_buffer) {
      console.log(err, result_string, result_buffer);
    });
    ****************/
    
    return params; 
}
/**
 * Changes the background color of the Compose bar
 * @param  {String} color background color to set
 * @return {void}       
 */
function pmailActive(color) {
  $(".Hy .k").css("background-color", color);
  $(".l.m").css("background-color", color);
  $(".l.n").css("background-color", color);
  $(".l.o").css("background-color", color);
  $(".aYF").text("New Message - Pmail Active");
}


var main = function() {

  "use strict";
  console.log('main.js loaded');

  var fn = function(){
    //setTimeout(create_snippets, 100);
    setTimeout(scan_and_decrypt, 50);
    setTimeout(cleanSearchBar, 50);
    setTimeout(pmailActive("rgb(62,164,225)"), 100);
  }
  
  document.body.addEventListener('mousemove', fn, true);
  document.onkeyup = cleanSearchBar;
  document.onhashchange = cleanSearchBar;
  // document.body.addEventListener('onhashchange', function(){console.log('onhashchange')}, true);

  gmail = new Gmail();
  SHA256 = new Hashes.SHA256;

  //----------------------WebSocket Code----------------------//
  try {
    if ('WebSocket' in window) {
      console.log('Starting WebSocket!');
      ws = createWebSocket(ws_uri);
    }
  } catch (err) {
    console.log("Could not create WebSocket: ".concat(err));    
    /*
    alert("Could not create WebSocket. " +
      "Please click the gray shield on the right of the URL bar and " +
      "then click \"Load unsafe scripts\"")
    */
  }

  var publicKey = "";
  var privateKey = "";
  var passphrase = "";

  var userEmail = gmail.get.user_email();

  var generatedKeys = false;

  var fetchTemp;
  if (localStorage[userEmail.concat('PmailPrivate')] && localStorage[userEmail.concat('PmailPrivate')] != "nil") {
    publicKey = localStorage[userEmail.concat('PmailPublic')];
    privateKey = localStorage[userEmail.concat('PmailPrivate')];
    passphrase = localStorage[userEmail.concat('PmailPasspharse')];
    fetchTemp = true;
    console.log("FOUND LOCAL");
  } else {
    console.log("NO LOCAL KEYS FOUND");
    fetchTemp = false;
  }

  var alice_public_key = publicKey;
  var alice_private_key = privateKey;
  var alice_passphrase = passphrase;

  //var fetchTemp = getPublicKeyBerkeley(userEmail); //returns false for a keyfetch error, 1 for no key, and a string (true) for a found key set
  
  if(fetchTemp == false){ //no keys exist
    alert("Welcome to Pmail, setting up your account...");
    generatedKeys = generateKeys(userEmail); //generating keys, will be stored locally and pushed to the server by the function
    //returns an array
    var promise = generatedKeys[0];
    passphrase = generatedKeys[1];

    promise.then(function(result) {
      
      publicKey = result['publicKeyArmored'];
      privateKey = result['privateKeyArmored'];

      localStorage.setItem(userEmail.concat("PmailPublic"), publicKey);
      localStorage.setItem(userEmail.concat("PmailPrivate"), privateKey);
      localStorage.setItem(userEmail.concat("PmailPasspharse"), passphrase);
      
      var divider = "$";
      //NEED TO TEST AND MAKE SURE PUSH WAS SUCCESSFULL
      $.ajax({
      type: "POST",
      url: "https://pmail.ece.umd.edu/pmail.php",
      //url: "https://ec2-54-205-40-22.compute-1.amazonaws.com/pmail.php",
      //data: "data=".concat(userEmail).concat(divider).concat(publicKey.replace(/\n/g,"#").replace(/\r/g,"%").replace(/\+/g,"^")).concat(divider).concat(encryptedPrivateKey.replace(/\+/g,"^")).concat(divider).concat(encryptedPassphrase.replace(/\+/g,"^")),
      data: "data=".concat(userEmail).concat(divider).concat(publicKey.replace(/\n/g,"#").replace(/\r/g,"%").replace(/\+/g,"^")),
      success: function(data){
        if (data.match('SUCCESS')) {
          alert("Pmail has finished setting up. You may now use encrypted mail or leave the page");
        } else {
          alert("Error setting up Pmail, account already exists... ".concat(data));
          localStorage.setItem(userEmail.concat("PmailPrivate"), "nil");
        }
      },
      error: function(){
        alert("Error setting up Pmail, unable to contact server... ");
        localStorage.setItem(userEmail.concat("PmailPrivate"), "nil");
      },
      async: false});

      kbpgp.KeyManager.import_from_armored_pgp({
      armored: alice_public_key
        }, function(err, alice) {
          if (!err) {
            alice.merge_pgp_private({
              armored: alice_private_key
            }, function(err) {
              if (!err) {
                if (alice.is_pgp_locked()) {
                  alice.unlock_pgp({
                    passphrase: alice_passphrase
                  }, function(err) {
                    if (!err) {
                      myKeyManager = alice;
                      console.log("Loaded private key with passphrase");
                    }
                  });
                } else {
                  console.log("Loaded private key w/o passphrase");
                }
              }
            });
          }
        });
      

    }, function(err) {
      alert("Error setting up Pmail");
    });

  }else{

    /*
    Below is creating a Key Base pgp key manager for the user to sign messages.
    */

    kbpgp.KeyManager.import_from_armored_pgp({
      armored: alice_public_key
    }, function(err, alice) {
      if (!err) {
        alice.merge_pgp_private({
          armored: alice_private_key
        }, function(err) {
          if (!err) {
            if (alice.is_pgp_locked()) {
              alice.unlock_pgp({
                passphrase: alice_passphrase
              }, function(err) {
                if (!err) {
                  myKeyManager = alice;
                  console.log("Loaded private key with passphrase");
                }
              });
            } else {
              console.log("Loaded private key w/o passphrase");
            }
          }
        });
      }
    });
  }


 //---------------------- SEND ENCRYPTED email----------------------//
  gmail.observe.before('send_message', function(url, body, data, xhr){
    var body_params = xhr.xhrParams.body_params;
    //var reciever = body_params.to[0];
    var receivers = body_params.to;    

    var i = 0;
    //reciever = reciever.replace(/^.*?<(.*?)>.*?$/g, "$1"); //reciever is now full email addres
    for(i=0;i<receivers.length-1;i++){
        receivers[i] =receivers[i].replace(/^.*?<(.*?)>.*?$/g, "$1");
    }

    //var encryptedMessage = encrypt(reciever, data.body, myKeyManager);
    var encryptedMessage = encrypt(receivers, data.body, myKeyManager);
    var bounce = false;

    if (encryptedMessage == false){
      //TELL THE USER THERE WAS AN ERROR SENDING MESSAGE AND TO TRY AGAIN LATER
      bounce = true;
    } else if (encryptedMessage == 1){
      //ASK USER IF THEY WANT TO SEND THE MESSAGE UNENCRYPTED BECAUSE THE OTHER USER DOES NOT SUPPORT ENCRYPTION
      /*
      var choice = confirm("Not all recipients use Pmail, so the message can't be encrypted. Do you want to send plaintext email?");
      if(choice == true){
        bounce = false;
      }else{
        bounce = true;
      }
      */
      bounce = false;
    } else {
      data.body = encryptedMessage;
    }

    if (bounce == true){ //user does NOT want to send message encrypted so we will bounce it
      console.log("bounce");
      console.log(body_params.to);
      console.log(data.body);
      data.body = "Pmail: UNABLE TO SEND ENCRYPTED MESSAGE TO ".concat(receivers).concat(", MESSAGE RETURNED: ").concat(data.body); //adding error message to email body
      var protectedBounce = encryptToSelf(myKeyManager, data.body); //encrypting the message with our own public key (note use of encryptToSelf)
      //console.log("protectedBounce is:" + protectedBounce.msg);
      body_params.to = [gmail.get.user_email(),""]; //changing recipient to self
      //console.log("to whom?" + receivers);
      data.body = protectedBounce;
      //data.body = "?=Pmail=?".concat(data.body); //appending pmail tagging
    }

    //console.log("data body is:" + data.body);
    //console.log("end of function");
  }); //End Before Save message

    // gmail.observe.after('open_email', decrypt_thread);
//---------------------- DECRYPT SINGLE EMAIL ----------------------//
//gmail.observe.before('http_event', function(url, body, data, xhr){

//********THIS PIECE OF CODE IS NO USE!

gmail.observe.on('open_email', function(url, body, data, xhr){
  //data.body = data.body.replace(/<.*?>/g, "\\$&");
  var new_body;
  // Might need to use gmail.get.email_ids() to get the last email instead
  // of the first
  var email_id = gmail.get.email_id();
  var email_data = gmail.get.email_data();
  var email = new gmail.dom.email(email_id); //HTML
  var body = email.body();
  console.log("New Body is:");
  // console.log("RFC id: ", getRFCid(email_id))
});


// -------------------- ENCRYPTED SEARCH -------------------- \\
gmail.observe.before('http_event', function(params) {

  var query = params['url']['q'];
  if(query && !/\:/.test(query) && !/search/.test(window.location)) {
    // Edit existing request
    // This probably will not work because gmail.js is not giving us the 
    // original request
    // params.url.q = "changed";
    // params.url_raw = params.url_raw.replace(/q=[^&]*/,"q=changed");
    // console.log(params);
    query = decodeURIComponent(query).toLowerCase();
    // Save the plaintext query to be restored after search
    localStorage["prev_query"] = query;
    console.log("Encrypted search for:", query);
    // Prepare message to send to Pmail server
    var token = tokenize(query);
    var send_package = gmail.get.user_email().concat(delimiter + 'search' + delimiter, token);
    console.log("Search request to server:", send_package);
    // Send package to Pmail server
    sendWebSocket(send_package)
  }

  /*POST REQUEST CHANGE
  if(gmail.get.search_query() != "" && bool == false){
    // Gmail search through the Gmail API
    console.log("sending gmail search request")
    var response = $.get("https://www.googleapis.com/gmail/v1/users/me/messages?q=" + gmail.get.search_query())
    console.log(response.message)
    // Modify the user's search request
    console.log("before: post_request", post_request, "xhr", xhr);
    post_request.url.q = "hacked";
    post_request.url_raw = post_request.url_raw.replace(/&q=[^&]*&/, "&q=hacked&");
    xhr.responseURL = xhr.responseURL.replace(/&q=[^&]*&/, "&q=hacked&");
    console.log("after: post_request", post_request, "xhr", xhr);
    bool = true;
    var send_package = gmail.get.user_email().concat(delimiter + 'search' + delimiter, tokenize(gmail.get.search_query()));
    console.log("Search request to server: ");
    console.log(send_package);
    sendWebSocket(send_package)
  }
  */


  //WEI: What's the purpose of this DRAFT thing?
  //一脸懵逼
  /*
  var front_tag = "<div dir=\"ltr\">";
  var back_tag = "<\\div>";
  
  if (params.url.search == "drafts"){
      console.log('Saving a draft');
      if (params.url.autosave == "1"){
          console.log('Autosave to be specific');
      }
      //console.log(params.body_params.body);
      var myBody = params.body_params.body;
      if (typeof myBody == "string"){
          myBody = myBody.replace(/<.*?>/g, "");
          //console.log("new body: ".concat(body));
          console.log(myBody);
          //myBody = encryptToSelf("", myBody);

          myBody = encryptToSelf(myKeyManager, myBody);   //Austin, this will give the keybase params into the variable myBody. Where do you want it for Gmail.js manip? See line below? ~Josh
          //WEI: what's this?
          params.body_params.body = myBody;
          console.log('main before save draft ^');
          console.log(myBody);
          //params.body_params.body = "test";
      }
      //console.log(params.body_params.body);
      console.log("End of draft interrupt");
  }
  */

});
}


/* Decrypt all emails in a thread */
function decrypt_thread(url, body, data, xhr) {
  // $("div.a3s") to find all DOM email bodies
  // $("#\\:sa").html("new first email body")
  var new_body;
  var emails = gmail.get.displayed_email_data();
  var email, email_data, body;
  for (var email_id in emails.threads) {
    console.log("Decrypting email id: " + email_id)
    email = emails.threads[email_id];
    body = email.content_plain; 
    // remove the quoted text from later emails
    if (body !== null && body !== undefined && body.match(/\?\=Pmail\=\?/)) {
      // console.log("Sender: ", email.from_email);
      new_body = body.replace(/\?\=.*?\=\?/g, "");
      new_body = new_body.replace(/<wbr>/g, "");
      new_body = new_body.replace(/<.*/g,""); //remove everything after a tag
      new_body = new_body.replace(/&quot\;/g,"\""); // replace encoding with real quotes
      new_body = new_body.replace(/\;/,"");
      new_body = JSON.parse(new_body);
      new_body = sjcl.decrypt("password", new_body);
      new_body = new_body.replace(/.*?body\=(.*?)&.*$/g, "$1");
      new_body = decodeURIComponent(new_body);
      console.log(new_body);
      // We need to find a way to set the email body to be the new_body
      // The line below works for a thread with only one email, but for a mult-
      // email thread
      // email.body(new_body);
    }
  }

}

// -------------------- Create Index for E-mail -------------------- \\
/**
 * Creates and encrypted index and sends it to the Pmail server
 * @param  {String} plaintext_body The decrypted email
 * @param  {String} email_id       The gmail id
 * @return {void}                
 */
function createEncryptedIndex(plaintext_body, email_id) {
  // Clean the html tags from the body. This will delete anything between
  // angled brackets
  var html_free = plaintext_body.replace(/<[^>]+>/g, '');
  console.log("Body to parse: ");
  console.log(html_free);
  var index = parse_body(html_free);
  console.log("Unencrypted index:", index);
  var enc_index = encrypt_index(index, email_id);
  console.log("Encrypted index to be sent to the server: ");
  console.log(enc_index);
  var send_package = gmail.get.user_email()
    .concat(delimiter + 'update' + delimiter, JSON.stringify(enc_index));
  sendWebSocket(send_package)
}
/**
 * Translates the Gmail IDs to RFC IDs and redirects the user to a 
 * Gmail search page
 * @param  {String[]} ids   Gmail IDs
 * @param  {String} query 	The plaintext search query given by the user
 * @return {void}       	void
 */
function loadSearchResults(ids, query){
  var emails = [];
  var email, source, RFCid, url;
  var msgids = [];
  var search_query;
  for (var i = 0; i < ids.length; i++) {
    RFCid = getRFCid(ids[i])
    // Add the RFC822 message ID to the list
    msgids.push("rfc822msgid:".concat(RFCid)); 
  }
  // Create the search query for the search box
  search_query = msgids.join(" OR "); 
  console.log("search_query:", search_query);
  url = encodeURIComponent(search_query);
  user_index = getUserNumber();
  url = 'https://mail.google.com/mail/u/'.concat(user_index).concat('/#search/').concat(url);
  console.log(url);
  // Redirect user to the search results page
  //window.location.href = url; doesnt work
  setTimeout(function(){ 
    window.location.assign(url);
    // Set the search bar to the expect plaintext query
    if (query == undefined) {
    	query = localStorage["prev_query"];  
    }
    cleanSearchBar();
    console.log("resetting the search bar to \""+ query + "\"");
  }, 100);
}   


//OKAY, check this out. 
//it calls: gmail.js: 2565 -> gmail.js: 618
function getRFCid(email_id) {
  //console.log("Now the email_id is: " + email_id);
  var email = new gmail.dom.email(email_id);
  //console.log(email.source().match(/Message-I[dD]: <(.*?)>/));
  return email.source().match(/Message-I[dD]: &lt;(.*?)&gt;/)[1];
  //return email.source().match(/Message-I[dD]: <(.*?)>/)[1];
}
/**
 * Uses jQuery to set the Gmail search bar to "query". This is used to "pretty-up"
 * the search bar so the user does not see the RFC IDs.
 * @param {String} query 	The plaintext search query given by the user
 */
function setSearchBar(query) {
  $("#gbqfq").val(query)
}
function cleanSearchBar() {
  if (/rfc822msgid/.test(document.getElementById("gbqfq").value)) {
    document.getElementById("gbqfq").value = localStorage["prev_query"];
  }
}

/**
 * Determine the interal Gmail index for the user. This is used to the determine
 * which page to redirect the user during an encrypted search.
 * @return {int} 	The Gmail index of the user
 */
function getUserNumber() {
	// Regex for the number in the URL
  var username = gmail.get.user_email();
  var logged_in_users = gmail.get.loggedin_accounts();
  if (logged_in_users.length == 0) {
  	return window.location.href.match(/mail\/u\/(\d+)/)[1]
  }
  for (var i in logged_in_users) {
    if (logged_in_users[i].email == username) 
      return logged_in_users[i].index; 
  }
}
/**
 * Hash the keywork and the user's private key
 * @param  {String} keyword plaintext of the keyword
 * @return {String}         Cryptographically safe hash of keyword
 */

function tokenize(keyword) {
// TODO: Add the user's private key
// AUSTIN: Please add some unique randomness (PGP private key or other)
	var randomness = ""
	return SHA256.hex(keyword + randomness).substring(0, 16); 
}

/**
 * Create a list of the words in the body
 * @param  {String} body String content of the email
 * @return {List} 	List of all the words in the email
 */
function parse_body(body) {
  var list = [];
  // var split = body.split(/[\s\.\?\!,\|\%]+/);
  var split = body.split(/[\W]+/);
  for (var s of split) {
    //Cannot be empty string and cannot have angle brackets (clean html tags)
    if (s !== "" && !s.match(/[\<\>]/)) {
      list.push(s.toLowerCase());
    }
  }
  return list;
}
function id_to_long(id) {
  return Long.fromString(id, true, 16);
}
function long_to_id(num) {
  return num.toString(16);
}

function encrypt_key(token, count) {
  // return SHA256.hex(token.toString() + count.toString() + "key").substring(0, 16);
  return token;
}

/**
 * VALUE = d ^ SHA256(token || count || “value”)
 * @param  {Long} id    [description]
 * @param  {String} token [description]
 * @param  {int} count [description]
 * @return {String}       [description]
 */
function encrypt_id(long_id, token, count) {
	// var h = SHA256.hex(token + count + "value").substring(0, 16)
	// var long_h = id_to_long(h)
	// return long_id.xor(long_h).toString(16)
	// AUSTIN: Please encrypt the "long_id" This is the Gmail ID in plaintext
	return long_id.toString(16);
}

/**
 * Encrypt the user's cleartext index
 * KEY = SHA256(token || count || "key") 
 * VALUE = d ^ SHA256(token || count || "value")
 * @return
 */
function encrypt_index(index, email_id) {
  var enc = {};
  //var enc2 = {};
  var token = null, past_key = "";
  var id = null, count = 0, key_hashed = 0, id_hashed = "";
  var len = index.length;
  var long_id = id_to_long(email_id);
  for (var i = 0; i < len; i++) {
    key = index[i];
    // count = count_hash[key];
    // if (count == undefined) {
    //   count = 0;
    // }
    // if (key !== past_key) { // reset the count if it is a new key
    //   count = 0;
    // }
    token = tokenize(key);
    key_hashed = encrypt_key(token, count);
    id_hashed = encrypt_id(long_id, token, count);
    enc[key_hashed] = id_hashed;
    // count_hash[key] = count + 1; // increment the count
    //enc2[key] = email_id;
    past_key = key;
  }
  // console.log("Frequency hash:", count_hash);
  //console.log(JSON.stringify(enc2).length);
  return enc;
}

refresh(main);
