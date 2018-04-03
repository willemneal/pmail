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

var main = async function(){
  // NOTE: Always use the latest version of gmail.js from
  // https://github.com/KartikTalwar/gmail.js


  gmail = new Gmail();
  console.log('Hello,', gmail.get.user_email());
  user.email = gmail.get.user_email();


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
  
  gmail.observe.on("open_email", function(id, url, body, xhr) {
    console.log("id:", id, "url:", url, 'body', body, 'xhr', xhr);
    var thread_email_list = gmail.get.email_data(id).total_threads;
    var ret = thread_email_list.map(elem => {
      window.emailRef = gmail.dom.email(elem);
      var ciphertextList = $(gmail.dom.email(elem).body()).text();
        if(ciphertextList != ""){
          var cListObj = JSON.parse(ciphertextList);
          var ciphertext = decodeURIComponent(cListObj[user.email]);
          console.log(ciphertext);
          decrypt(ciphertext,user.privatekey, user.passphrase).then(function(plaintext){
            setTimeout(() => {
              window.emailRef.body(plaintext);
            }, 100);
          });
      }
    });
    
    decrypt_worker.postMessage("Hello");
    console.log(ret);
    console.log(user);
   
  })
  
  gmail.observe.before('http_event', function(params) {
    
      var query = params['url']['q'];
      console.log(query);
      
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
    user.privatekey = key.privateKeyArmored; 
    user.publickey = key.publicKeyArmored;  

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
async function encryptEmail(plaintext, email){
    var options;
    var m = plaintext;
    var publickey = getPublicKey(email);

    options = {
        data: m,                             // input as String (or Uint8Array)
        publicKeys: openpgp.key.readArmored(publickey).keys,  // for encryption
    };

    const ciphertext = await openpgp.encrypt(options);
    return '"'+email+'": "'+encodeURIComponent(ciphertext.data)+'"'
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

refresh(main);
