var gmail;


function refresh(f) {
  if( (/in/.test(document.readyState)) || (typeof Gmail === undefined) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}


var main = async function(){
  // NOTE: Always use the latest version of gmail.js from
  // https://github.com/KartikTalwar/gmail.js
  var openpgp = window.openpgp;
  var hkp = new openpgp.HKP('https://pgp.mit.edu');

  gmail = new Gmail();
  console.log('Hello,', gmail.get.user_email());

  const storPrivkey = "pmail.privkey-"+gmail.get.user_email();
  const storPubkey = "pmail.pubkey-"+gmail.get.user_email();


  var user = {
    passphrase : "",
    publickey : "",
    privatekey : "",
    email : gmail.get.user_email()
  };


  if (localStorage.getItem(storPrivkey) == null || localStorage.getItem(storPubkey) == null){

    user.passphrase = prompt("Pmail Account set up (If importing a private key leave response blank)\n Please Enter a passphrase to secure your private key: ");  

    if(user.passphrase == ""){

      user.privatekey = prompt("Importing a private key? \n Please enter your private key: ");  
      localStorage.setItem(storPrivkey, user.privatekey); 

      user.passphrase = prompt("Please enter the passphrase used to secure your private key: "); 
      
      var options = {
          query: (user.email+' pmailtest')
      };

      const key = await hkp.lookup(options);
      localStorage.setItem(storPubkey, key); 
      user.publickey = key;


    } else {
      
      var options = {
        userIds: [{email: user.email , name: "pmailtest"}], // multiple user IDs
        numBits: 4096,                                 // RSA key size
        passphrase: user.passphrase                     // protects the private key
      };
      
      const key = await openpgp.generateKey(options);
      user.privatekey = key.privateKeyArmored; 
      user.publickey = key.publicKeyArmored;  

      hkp.upload(user.publickey).then(function() {  });

      localStorage.setItem(storPrivkey, user.privatekey); 
      localStorage.setItem(storPubkey, user.publickey);
  }
    
  } else {

    user.passphrase = prompt("Please Enter your passphrase: ");
    user.privatekey = localStorage.getItem(storPrivkey);
    user.publickey = localStorage.getItem(storPubkey);

    
    var privKeyObj = openpgp.key.readArmored(user.privatekey).keys[0];
    if (privKeyObj.decrypt(user.passphrase)){
      console.log("Passphrase correct");
    } else {
      alert("Passphrase incorrect");
    }

    var options, encrypted;
    options = {
        data: 'Hello, World!',                             // input as String (or Uint8Array)
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

    if(ciphertext.data == plaintext.data){
      console.log("Key Pair Valid");
    } else {
      alert("Key pair invalid");
    }

  }
  
  console.log(user);



  
  gmail.observe.before('send_message', function(url, body, data, xhr){
    console.log("url:", url, 'body', body, 'email_data', data, 'xhr', xhr);  
    var oldCmml = xhr.xhrParams.url.cmml;

    var body_params = xhr.xhrParams.body_params;
    var string = '<div dir="ltr"><div>hello</div></div>';

    if (string.length > oldCmml) {
        xhr.xhrParams.url.cmml = string.length;
    } else {
        string += '<div>';
        while(string.length<oldCmml){
            string += ' ';
        }
        string += '</div>';
        xhr.xhrParams.url.cmml = string.length;
    }

    body_params.body = string;

    console.log(oldCmml, xhr.xhrParams.url.cmml, string);
  });
  
  gmail.observe.on("open_email", function(id, url, body, xhr) {
    console.log("id:", id, "url:", url, 'body', body, 'xhr', xhr);
    console.log(gmail.get.email_data(id));
    console.log(user);
   
  })
  
  gmail.observe.before('http_event', function(params) {
    
      var query = params['url']['q'];
      console.log(query);
      
  });

}



refresh(main);
