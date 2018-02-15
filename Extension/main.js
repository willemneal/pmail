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
  var hkp = new openpgp.HKP('https://pgp.mit.edu');

  gmail = new Gmail();
  console.log('Hello,', gmail.get.user_email());

  var user = {
    passphrase = "",
    publickey = "",
    privatekey = "",
    email = gmail.get.user_email()
  };


  if (localStorage.getItem("pmail.privkey") == null || localStorage.getItem("pmail.pubkey") == null){

    user.passphrase = prompt("Pmail Account set up (If importing a private key leave response blank)\n Please Enter a passphrase to secure your private key: ");  

    if(user.passphrase == ""){

      user.privatekey = prompt("Importing a private key? \n Please enter your private key: ");  
      localStorage.setItem("pmail.privkey", user.privatekey); 

      user.passphrase = prompt("Please enter the passphrase used to secure your private key: "); 
      
      var options = {
          query: (user.email+' pmail')
      };

      hkp.lookup(options).then(function(key) {
          user.publickey = openpgp.key.readArmored(key);
          localStorage.setItem("pmail.pubkey", user.publickey); 

      });

    } else {
      
      var options = {
        userIds: [{email: user.email , name: "pmailtest"}], // multiple user IDs
        numBits: 4096,                                 // RSA key size
        passphrase: user.passphrase                     // protects the private key
      };
      
      openpgp.generateKey(options).then(function(key) {
        user.privatekey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
        user.publickey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '

        hkp.upload(user.publickey).then(function() {  });


        localStorage.setItem("pmail.privkey", user.privatekey); 
        localStorage.setItem("pmail.pubkey", user.publickey);
      });
  }
    
  } else {
    user.passphrase = prompt("Please Enter your passphrase: ");
    user.privatekey = localStorage.getItem("pmail.privkey");
    user.publickey = localStorage.getItem("pmail.publickey")
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
   
  })
  
  gmail.observe.before('http_event', function(params) {
    
      var query = params['url']['q'];
      console.log(query);
      
  });

}



refresh(main);
