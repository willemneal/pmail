var gmail;


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
  user.privatekey = document.getElementById("priv").value;
  user.publickey = document.getElementById("pub").value;
  if((await checkAccount())){
    importAccount();
  }

}
async function genClick(element){
  await generateKeys(false);
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
  passphrase : "",
  publickey : "",
  privatekey : "",
  email : "",
  pmail_active : false,
  valid : false
};

var openpgp = window.openpgp;
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
   
  
  gmail.observe.before('http_event', function(params) {
    
      var query = params['url']['q'];
      if(query && !/\:/.test(query) && !/search/.test(window.location)) {
        query = decodeURIComponent(query).toLowerCase();
        localStorage["prev_query"] = query;
        console.log("Encrypted search for:", query);
        tokenize(query);
      }
      
  });

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
    localStorage.setItem(storPrivkey, user.privatekey); 

    var options = {
        query: (user.email+' pmailtest')
    };

    //const key = await hkp.lookup(options);
    localStorage.setItem(storPubkey, user.publickey); 
    user.publickey = key;
  }
  return checkAccount;   
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
    var publicKey = getPublicKey(email);

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
  var ids = await getIds(query);



  var emails = [];
  var email, source, RFCid, url;
  var msgids = [];
  var search_query;
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
  setTimeout(function(){ 
    window.location.assign(url);
    // Set the search bar to the expect plaintext query
    if (query == undefined) {
    	query = localStorage["prev_query"];  
    }
    cleanSearchBar();
    console.log("resetting the search bar to \""+ query + "\"");
    setSearchBar(query)
  }, 100);
}   

async function getIds(query){
  console.log(query);
  var queryList = query.split(" ");

  queryList.map(tokenize)

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
