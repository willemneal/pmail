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
  

  var userEmail = gmail.get.user_email();
  var userPublicKey = "";
  var userPrivateKey = "";
  
  gmail.observe.before('send_message', function(url, body, data, xhr){
    console.log("url:", url, 'body', body, 'email_data', data, 'xhr', xhr);  
  });
  
  gmail.observe.on("open_email", function(id, url, body, xhr) {
    console.log("id:", id, "url:", url, 'body', body, 'xhr', xhr);
    console.log(gmail.get.email_data(id));
    var hkp = new openpgp.HKP('https://pgp.mit.edu');
    
    var options = {
        query: 'alice@example.com'
    };
    
    hkp.lookup(options).then(function(key) {
        var pubkey = openpgp.key.readArmored(key);
        console.log(pubkey);        
    });
  })
  
  gmail.observe.before('http_event', function(params) {
    
      var query = params['url']['q'];
      console.log(query);
      
  });

}



refresh(main);
