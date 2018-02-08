var gmail;


function refresh(f) {
  if( (/in/.test(document.readyState)) || (typeof Gmail === undefined) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}


var main = function(){
  // NOTE: Always use the latest version of gmail.js from
  // https://github.com/KartikTalwar/gmail.js
  var openpgp = window.openpgp;
  gmail = new Gmail();
  console.log('Hello,', gmail.get.user_email());

  var userPassphrase = "";
  var userEmail = gmail.get.user_email();
  

  if (localStorage.getItem("pmail.privkey") == null || localStorage.getItem("pmail.pubkey") == null){
    userPassphrase = prompt("Pmail Account set up \n Please Enter a passphrase to secure your private key: ");  
    
    var options = {
      userIds: [{email: userEmail}], // multiple user IDs
      numBits: 4096,                 // RSA key size
      passphrase: userPassphrase     // protects the private key
    };
    
    openpgp.generateKey(options).then(function(key) {
      var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
      var pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '

      localStorage.setItem("pmail.privkey", privkey); 
      localStorage.setItem("pmail.pubkey", pubkey);
    });
    
    

  } else {

    userPassphrase = prompt("Please Enter your passphrase: ");
  }
  

  
  var userPublicKey = "";
  var userPrivateKey = "";

  
  gmail.observe.before('send_message', function(url, body, data, xhr){
    console.log("url:", url, 'body', body, 'email_data', data, 'xhr', xhr);  
  });
  
  gmail.observe.on("open_email", function(id, url, body, xhr) {
    console.log("id:", id, "url:", url, 'body', body, 'xhr', xhr);
    console.log(gmail.get.email_data(id));
   
  })
  
  gmail.observe.before('http_event', function(params) {
    
      var query = params['url']['q'];
      console.log(query);
      
  });

}



refresh(main);
