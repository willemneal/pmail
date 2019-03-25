const GmailFactory = require("gmail-js");
const gmail = new GmailFactory.Gmail() as Gmail;
import * as openpgp from "openpgp";


function refresh(f) {
  if( (/in/.test(document.readyState)) || (typeof Gmail === undefined) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}

var modaljs = `
hello();
console.log(user);

document.getElementById("priv").value = user.privatekey;
document.getElementById("pub").value = user.publickey;


if(document.getElementById("buttonM") != null){
  document.getElementById("buttonM").addEventListener("click", passClick);
}
document.getElementById("buttonK").addEventListener("click", importClick);
document.getElementById("buttonG").addEventListener("click", genClick);


async function passClick(element){
  user.passphrase = document.getElementById("passphrase").value;
  if((await checkAccount()) == true){
    document.getElementById("acc").innerHTML = "Pmail is Active";
    user.pmail_active = true;
  } else {
    document.getElementById("acc").innerHTML = "Account invalid";
  }
}

async function importClick(element){
  user.passphrase = document.getElementById("passphrase").value;
  user.privatekey = document.getElementById("priv").value;
  user.publickey = document.getElementById("pub").value;
  if((await checkAccount())){
    importAccount();
  }

}
async function genClick(element){
  user.passphrase = document.getElementById("passphrase").value;
  await generateKeys(true);
  document.getElementById("priv").value = user.privatekey;
  document.getElementById("pub").value = user.publickey;
}
`;

var modalhtml = `
  <h4>Please Enter your Passphrase: </h4>
  <input type="password" id="passphrase">
  <input class="switch" id="buttonM" type=button value="Activate Pmail">
  <input class="switch" id="buttonK" type=button value="Import Keys">
  <input class="switch" id="buttonG" type=button value="Generate Keys">
  <p id="acc"></p>
  <textarea id="priv"
  rows="10" cols="50"></textarea>

  <textarea id="pub"
  rows="10" cols="50"></textarea>
  `

var user = {
  passphrase : "password",
  publickey : `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v2.6.2
Comment: https://openpgpjs.org

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
=ynS3
-----END PGP PUBLIC KEY BLOCK-----
`,
  privatekey : `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v2.6.2
Comment: https://openpgpjs.org

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
QjsoP9qvEB2T0DN4/ljv
=aH3y
-----END PGP PRIVATE KEY BLOCK-----
`,
  email : "",
  pmail_active : false,
  valid : false
};

var hkp = new openpgp.HKP('https://pgp.mit.edu');

var storPrivkey = "";
var storPubkey = "";
var searchable_list = [];

var main = async function(){
  // NOTE: Always use the latest version of gmail.js from
  // https://github.com/KartikTalwar/gmail.js



  gmail = new Gmail();
  console.log('Hello,', gmail.get.user_email());
  user.email = gmail.get.user_email();

  if(localStorage["pmail.searchable_encrypted"+user.email] == undefined){
    localStorage["pmail.searchable_encrypted"+user.email] = JSON.stringify([]);
  }
  searchable_list = JSON.parse(localStorage["pmail.searchable_encrypted"+user.email])
  storPrivkey = "pmail.privkey-"+user.email;
  storPubkey = "pmail.pubkey-"+user.email;
  if (localStorage.getItem(storPrivkey) != null && localStorage.getItem(storPubkey) != null){
    user.publickey = localStorage.getItem(storPubkey);
    user.privatekey = localStorage.getItem(storPrivkey);

  }

  gmail.tools.add_toolbar_button('Pmail', function() {
    gmail.tools.add_modal_window('Pmail',
    modalhtml+'<script>'+modaljs+'</script>',
      function() {

        gmail.tools.remove_modal_window();
      });
  }, 'ptool');

interface Window {
  ComposeRef: any
}

/*  gmail.observe.before('send_message', function(url, body, data, xhr){
    console.log("url:", url, 'body', body, 'email_data', data, 'xhr', xhr);
    var oldCmml = xhr.xhrParams.url.cmml;

    var body_params = xhr.xhrParams.body_params;


    console.log(oldCmml, xhr.xhrParams.url.cmml, string);
  });*/

  gmail.observe.on("compose", function(compose, type) {
    window.ComposeRef = compose;
    window.ComposeEncrypted = false;
    gmail.tools.add_compose_button(compose, '(En|De)crypt',
    function(temp) {
      if(window.ComposeEncrypted){
        var ciphertextList = window.ComposeRef.body();
        var cListObj = JSON.parse(ciphertextList);
        var ciphertext = decodeURIComponent(cListObj[user.email]);
        console.log(ciphertext);
        decrypt(ciphertext,user.privatekey, user.passphrase).then(function(plaintext){
          setTimeout(() => {
            window.ComposeEncrypted = false;
            window.ComposeRef.body(plaintext);
          }, 100);
        });

      } else {
        var receivers = window.ComposeRef.recipients().to;
        var emails = [];
        var plaintext = window.ComposeRef.body();

        for(i=0;i< receivers.length;i++){
          emails[i] =receivers[i].replace(/^.*?<(.*?)>.*?$/g, "$1");
        }
        emails.push(user.email)
        var encryptedList = Promise.all(emails.map(elem => encryptEmail(plaintext,elem))).then( function(results) {
          setTimeout(() => {
            window.ComposeEncrypted = true;
            window.ComposeRef.body('{'+results.join(",")+'}');
          }, 100);
        });
      }
    }, 'ptool');
  });

  gmail.observe.on('view_thread', function(obj) {
    console.log('view_thread', obj);
  });
  gmail.observe.on("view_email", function(obj) {
    console.log("here");
    window.emailRef = obj;
    var ciphertextList = $(obj.body()).text();
      if(ciphertextList != ""){
        try {

          var cListObj = JSON.parse("{"+ciphertextList.match(/[^}{]+(?=})/s)[0]+"}");
          var ciphertext = decodeURIComponent(cListObj[user.email]);
          console.log(ciphertext);
          decrypt(ciphertext,user.privatekey, user.passphrase).then(function(plaintext){
            if(!searchable_list.includes(window.emailRef.id)){
              createEncryptedIndex(plaintext,window.emailRef.id)
            }
            setTimeout(() => {
              window.emailRef.body(plaintext);
            }, 100);
          });
        } catch (e){
          console.log("Not Pmail email");
        }
    }
  });


  //gmail.observe.before('http_event', function(params) {
    window.onhashchange = function() {
      var query = gmail.get.search_query();      ;
      console.log(query)
      if(query && !query.includes("rfc822msgid")) {
        query = decodeURIComponent(query).toLowerCase();
        localStorage["prev_query"] = query;
        console.log("Encrypted search for:", query);
        loadSearchResults(query)
      } else if (query && query.includes("rfc822msgid")){
        query = localStorage["prev_query"];
        setSearchBar(query);
      }
    }

  //});

  chrome.runtime.sendMessage("eiolmadckdfaiiidmdeboedfpjepgfji", {type:"user", user}, {})
}

function hello(){
  console.log("Hello");
}
/* Account Setup */
async function checkAccount(){
  if (user.privatekey != "" && user.publickey != "" && user.passphrase != ""){
    var privKeyObj = openpgp.key.readArmored(user.privatekey).keys[0];
    if (privKeyObj.decrypt(user.passphrase)){
      console.log("Passphrase correct");
    } else {
      console.log("Passphrase incorrect");
      return false;
    }

    var options, encrypted;
    var m = 'Hello, World!';
    options = {
        data: m,                             // input as String (or Uint8Array)
        publicKeys: openpgp.key.readArmored(user.publickey).keys,  // for encryption
        privateKeys: privKeyObj // for signing (optional)
    };

    const ciphertext = await openpgp.encrypt(options);

    options = {
        message: openpgp.message.readArmored(ciphertext.data),     // parse armored message
        publicKeys: openpgp.key.readArmored(user.publickey).keys,    // for verification (optional)
        privateKey: privKeyObj // for decryption
    };

    const plaintext = await openpgp.decrypt(options);

    if(m == plaintext.data){
      console.log("Key Pair Valid");
      user.valid = true;
      return true;
    } else {
      console.log("Key pair invalid");
      user.valid = false;
      return false;
    }
  }
  return false;
}

async function generateKeys(upload){
  if(user.passphrase != ""){
    var options = {
      userIds: [{email: user.email , name: "pmailtest"}], // multiple user IDs
      numBits: 4096,                                 // RSA key size
      passphrase: user.passphrase                     // protects the private key
    };

    const key = await openpgp.generateKey(options);
    if (user.privatekey == ""){
      user.privatekey = key.privateKeyArmored;
      user.publickey = key.publicKeyArmored;
    }
    if(upload){
      //hkp.upload(user.publickey).then(function() {  });
      postPublicKey(user.email,user.publickey);
    }
    localStorage.setItem(storPrivkey, user.privatekey);
    localStorage.setItem(storPubkey, user.publickey);
  }
}

function postPublicKey(email,publickey){
  var request = new XMLHttpRequest();
  var formData = new FormData();
  formData.append("email", email); // number 123456 is immediately converted to a string "123456"
  formData.append("publicKey", publickey); // number 123456 is immediately converted to a string "123456"


  request.open('POST', "http://localhost:8000/publickey", false);  // `false` makes the request synchronous
  request.send(formData);

  if (request.status === 200) {
    var obj = JSON.parse(request.responseText);
    return obj.Publickey;
  }
}

async function importAccount(){
  if (user.privatekey != "" && user.publickey != "" && user.passphrase != ""){
    postPublicKey(user.email,user.publickey);
    localStorage.setItem(storPrivkey, user.privatekey);
    localStorage.setItem(storPubkey, user.publickey);
  }
}

/* Encrypt */
async function encrypt(plaintext, publicKey){
  var options;
  var m = plaintext;

  options = {
      data: m,                             // input as String (or Uint8Array)
      publicKeys: openpgp.key.readArmored(publicKey).keys,  // for encryption
  };
  const ciphertext = await openpgp.encrypt(options);
  return ciphertext.data;
}
async function encryptEmail(plaintext, email){
    var options;
    var m = plaintext;
    var publicKey = user.publickey;  //getPublicKey(email);

    const ciphertext = await encrypt(plaintext, publicKey);
    return '"'+email+'": "'+encodeURIComponent(ciphertext)+'"'
}

function getPublicKey(email){
  var request = new XMLHttpRequest();
  request.open('GET', "http://localhost:8000/publickey?email="+email, false);  // `false` makes the request synchronous
  request.send(null);

  if (request.status === 200) {
    var obj = JSON.parse(request.responseText);
    return obj.Publickey;
  }
}

/* Decrypt */
async function decrypt(ciphertext, privatekey, passphrase){
  var options;
  var privKeyObj = openpgp.key.readArmored(privatekey).keys[0];
  privKeyObj.decrypt(passphrase);

  options = {
    message: openpgp.message.readArmored(ciphertext),     // parse armored message
    privateKey: privKeyObj // for decryption
  };
  const plaintext = await openpgp.decrypt(options);

  return plaintext.data;
}

/* Search */

// -------------------- Create Index for E-mail -------------------- \\
/**
 * Creates and encrypted index and sends it to the Pmail server
 * @param  {String} plaintext_body The decrypted email
 * @param  {String} email_id       The gmail id
 * @return {void}
 */
async function createEncryptedIndex(plaintext_body, email_id) {
  // Clean the html tags from the body. This will delete anything between
  // angled brackets
  var html_free = plaintext_body.replace(/<[^>]+>/g, '');
  console.log("Body to parse: ");
  console.log(html_free);
  var index = parse_body(html_free);
  console.log("Unencrypted index:", index);
  var tok_email_id = encodeURIComponent(await encrypt(email_id, user.publickey));
  var enc_index = await encrypt_index(index);
  console.log("Encrypted index to be sent to the server: ");
  console.log(enc_index);
  console.log("Encypted email id: ");
  console.log(tok_email_id);

  var request = new XMLHttpRequest();
  var formData = new FormData();
  formData.append("email_id", tok_email_id);
  formData.append("encrypted_index", JSON.stringify(enc_index)); // number 123456 is immediately converted to a string "123456"

  console.log(tok_email_id);
  console.log(JSON.stringify(enc_index));

  request.open('POST', "http://localhost:8000/search", true);  // `false` makes the request synchronous
  request.send(formData);

  if (request.status === 200) {
    var obj = JSON.parse(request.responseText);
    console.log(obj);
  }
}
/**
 * Translates the Gmail IDs to RFC IDs and redirects the user to a
 * Gmail search page
 * @param  {String} query 	The plaintext search query given by the user
 * @return {void}       	void
 */
async function loadSearchResults(query){
  var queryList = query.trim().split(/\W+/);
  var msgids = queryList;
  console.log(queryList);
  console.log(msgids);
  var ids = await getIds(queryList);
  var emails = [];
  var email, source, RFCid, url;
  var search_query;
  if(ids.length != 0){
    for (var i = 0; i < ids.length; i++) {
      RFCid = await getRFCid(ids[i])
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
    window.location.replace(url);
  }

}

async function getIds(queryList){
  queryHashList = []
  decList = new Set()

  for (var i = 0; i < queryList.length; i++) {
    key = await tokenize(queryList[i]);
    queryHashList.push(key)
  }
  var request = new XMLHttpRequest();
  var formData = new FormData();
  formData.append("encrypted_index", JSON.stringify(queryHashList)); // number 123456 is immediately converted to a string "123456"


  request.open('PUT', "http://localhost:8000/search", false);  // `false` makes the request synchronous
  request.send(formData);

  if (request.status === 200) {
    var obj = JSON.parse(request.responseText);
    if(obj != null){
      for(var j =0; j < obj.length; j++){
        var deID = await decrypt(decodeURIComponent(obj[j]),user.privatekey, user.passphrase)
        decList.add(deID)
      }
    }
  }
  console.log(decList)
  return Array.from(decList)
}

async function getRFCid(email_id) {

  var emailSource = await gmail.get.email_source_promise(email_id);
  return emailSource.match(/Message-I[dD]:\W<(.*)>/)[1];
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

async function tokenize(keyword) {
  const hash = await sha256(keyword + user.privatekey);
  console.log(hash);
  return hash;
}
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder('utf-8').encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
  return hashHex;
}

/**
 * Create a list of the words in the body
 * @param  {String} body String content of the email
 * @return {List} 	List of all the words in the email
 */
function parse_body(body) {
  var list = [];
  var split = body.split(/[\W]+/);
  for (var s of split) {
    if (s !== "" && !s.match(/[\<\>]/)) {
      list.push(s.toLowerCase());
    }
  }
  return list;
}

/**
 * Encrypt the user's cleartext index
 * TODO add more randomness?
 * @return
 */
async function encrypt_index(index) {
  var len = index.length;
  encList = []
  for (var i = 0; i < len; i++) {
    key = await tokenize(index[i]);
    encList.push(key)
  }
  console.log(JSON.stringify(encList));
  return encList;
}


refresh(main);
