  /* Here lays Austin's attempt at hacking the Gmail UI. His effort will never
   * be forgotten.
  console.log("Displaying the following emails: ", emails);
  var x = $('[role="main"]').find('.Cp').find('tr'); //number of emails currently on the screen
  var min;

  if (emails.length <= x.length){
    //there are less search results than currently displayed emails, equall does not extra work
    for (var i = 0; i < emails.length; i++){
      $(x[i]).find('.y6').find('span')[0].innerHTML = emails[i].subject;
      $(x[i]).find('.y6').find('span')[1].innerHTML = emails[i].threads[ids[i]].content_plain;
    }
    for (var i = emails.length; i < x.length; i++){
      $(x[i]).remove();
    }
  } else {
    //there are more search results than currently displayed emails, we will append the extras to the table
    for (var i = 0; i < x.length; i++){
      console.log(emails[i]);
      $(x[i]).find('.y6').find('span')[0].innerHTML = emails[i].subject;
      $(x[i]).find('.y6').find('span')[1].innerHTML = emails[i].threads[ids[i]].content_plain;
    }
    var tableTmp = $('[role="main"]').find('.Cp');
    for (var i = x.length; i < emails.length; i++){
      tableTmp.append('<tr class="zA yO" id=":'.concat(i).concat('g" tabindex="-1" aria-labelledby=":').concat(i).concat('h"><td class="PF xY"></td><td id=":').concat(i).concat('i" class="oZ-x3 xY" style=""><div id=":').concat(i).concat('j" class="oZ-jc T-Jo J-J5-Ji " role="checkbox" aria-labelledby=":').concat(i).concat('h" dir="ltr" aria-checked="false" tabindex="-1"><div class="T-Jo-auh"></div></div></td><td class="apU xY"><span id=":').concat(i).concat('k" class="aXw T-KT" title="Not starred" aria-label="Not starred"><img class="T-KT-JX" src="images/cleardot.gif" alt="Not starred"></span></td><td class="yX xY "><div id=":').concat(i).concat('h" class="afn">\
        <span class="yP" email="austinkarch@gmail.com" name="Austin Murdock">Austin Murdock</span>, (no subject), 4:09 pm, http://stackoverflow.com/questions/171027/add-table-row-in-jquery.</div>\
        <div id=":').concat(i).concat('l" class="yW"><span class="yP" email="austinkarch@gmail.com" name="Austin Murdock">Austin Murdock</span></div></td><td class="xY "></td><td id=":').concat(i).concat('m" tabindex="-1" class="xY a4W"><div class="xS" role="link"><div class="xT"><div class="y6">\
        <span id=":').concat(i).concat('o">').concat(emails[i].subject).concat('</span><span class="y2">&nbsp;-&nbsp;').concat(emails[i].threads[ids[i]].content_plain).concat('</span></div></div></div></td><td class="yf xY ">&nbsp;</td><td class="xW xY ">\
        <span title="Tue, Nov 17, 2015 at 4:09 PM" id=":').concat(i).concat('p" aria-label="Tue, Nov 17, 2015 at 4:09 PM">4:09 pm</span></td></tr>'));
    }
    
  }*/

  function getPublicKeyMIT(email){
  var email = email.split('@');
  var emailName = email[0];
  var domain = email[1];
  var temporary = false;

    $.ajax({ url: "https://pgp.mit.edu/pks/lookup?search=".concat(emailName).concat("%40").concat(domain).concat("&op=index"), success: function(data){
      keyID = data.match(/search=(.*?)\"/)[0];
      keyID = keyID.slice(7,keyID.length - 1);
      $.ajax({ url: "https://pgp.mit.edu/pks/lookup?op=get&search=".concat(keyID), success: function(keyBlockHTML){
        publicKey = keyBlockHTML.match(/-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]*-----END PGP PUBLIC KEY BLOCK-----/g);
        temporary = publicKey[0];
      }, async: false});
    }, async: false});
  return temporary;
}

  //hanewin encryption
function encrypt_message(pubkeyinput, message) {
  var keytyp = -1;
  var keyid  = '';
  var pubkey = '';

  console.log('encrypting via hanewin');
  console.log(pubkeyinput);

   var pu = new getPublicKey(pubkeyinput);
   if(pu.vers == -1) return; //NEEDS TO BE HANDLED

   console.log(pu);

   var docvers = pu.vers;
   var docuser = pu.user;
   var dockeyid = pu.keyid;

   pubkey = pu.pkey.replace(/\n/g,'');
   var docpkey = pubkey;
   var docpktype = pu.type;

   keyid='0000000000000000';
   if(dockeyid.length) keyid = dockeyid;
   if(keyid.length != 16)
   {
     alert('Invalid Key Id');
     return;
   } 

   keytyp = -1;
   if(docpktype == 'ELGAMAL') keytyp = 1;
   if(docpktype == 'RSA')     keytyp = 0;
   if(keytyp == -1)
   {
     alert('Unsupported Key Type');
     return;
   } 

   var text = message;

   tmp = doEncrypt(keyid, keytyp, pubkey, text);
   console.log(tmp);
   return tmp;

   /*
   Decrypt all emails in a thread 
  gmail.observe.after('open_email', function(url, body, data, xhr) {
    var new_body;
    var emails = gmail.get.displayed_email_data();
    var email, email_data, body;
    for (var email_id in emails.threads) {
      console.log("Decrypting email id: " + email_id)
      email = emails.threads[email_id];
      body = email.content_plain; // TODO: Cut the emails into separate pieces
      // remove the quoted text from later emails
      if (body !== null && body !== undefined && body.match(/\?\=Pmail\=\?/)) {
        // console.log("Sender: ", email.from_email);
        new_body = body.replace(/\?\=.*?\=\?/g, "");
        new_body = new_body.replace(/<wbr>/g, "");
*/ //       new_body = new_body.replace(/<.*/g,""); //remove everything after a tag
/*
        new_body = new_body.replace(/&quot\;/g,"\""); // replace encoding with real quotes
        new_body = new_body.replace(/\;/,"");
        new_body = JSON.parse(new_body);
        new_body = sjcl.decrypt("password", new_body);
        new_body = new_body.replace(/.*?body\=(.*?)&.*$/g, "$1");
        new_body = decodeURIComponent(new_body);
        console.log(new_body);
        email.body(new_body);
      }
    }
  });
*/

/*
  /* Decrypt, parse, send to server
  gmail.observe.after('open_email', function(url, body, data, xhr){
    var new_body;
    // Might need to use gmail.get.email_ids() to get the last email instead
    // of the first
    var email_id = gmail.get.email_id();
    var email_data = gmail.get.email_data();
    var email = new gmail.dom.email(email_id); //HTML
    var body = email.body();
        // Clean the html tags from the body. This will delete anything between
    // angled brackets
    if (typeof email.body() !== 'undefined') {
      var html_free = email.body().replace(/<[^>]+>/g, '');
      
      //var plain_text = email.data().content_plain; //Still has some HTML in it
      console.log("Body to parse: ");
      console.log(html_free);
      var index = parse_body(html_free);
      console.log("Unencrypted index:", index);
      var enc_index = encrypt_index(index, email_id);
      console.log("Encrypted index to be sent to the server: ");
      console.log(enc_index);
      var send_package = gmail.get.user_email()
        .concat(delimiter + 'update' + delimiter, JSON.stringify(enc_index));
      // console.log("Update to server: ");
      // console.log(send_package);
      if (ws && ws.readyState == 1) {
        ws.send(send_package);        
      }
      else {
        console.log("WebSocket is closed. Cannot send update request.");
      }
    }
  }
  */


/*
var bool = false; //for testing purposes to ensure only one search executes at a time
  gmail.observe.on('http_event', function(url, body, data, xhr){

    if(gmail.get.search_query() != "" && bool == false){
      bool = true;
      //SearchResultsTestCode Demo
      //Encrypted Emails:
      //loadSearchResults(["151577344bb28ee7", "151577390e83f52c", "1515773d8904f06d", "15157742520538b9", "15157747f868ac84"]);
      //Unencrypted Emails:
      //loadSearchResults(["15157b6ccb99dedb","15157b79e6ac9e91","15157b7db367bc4e","15157b7d3d6c13f9","15157b80dec4d1e2"]);

      var send_package = gmail.get.user_email().concat(delimiter + 'search' + delimiter, tokenize(gmail.get.search_query()));
      console.log("Search request to server: ");
      console.log(send_package);
      if (ws && ws.readyState == 1) {
        ws.send(send_package);        
      }
      else {
        console.log("WebSocket is closed. Cannot send search request.");
      }
    }
  });
  }
}
*/
}

/* OpenPGP encryption
/**
 * Encrypt a message using the recipient's public key.
 * @param  {pubkey} String - Encrypted ASCII Armored public key.
 * @param  {message} String - Your message to the recipient.
 * @return {pgpMessage} String - Encrypted ASCII Armored message.
 *
function encrypt_message(pubkey, message) {
  var openpgp = window.openpgp;
  var key = openpgp.key.readArmored(pubkey);
  var pgpMessage = openpgp.encryptMessage(key.keys, message);
  return pgpMessage;
}
*/

/**
   * Sign a message using your private key.
   * @param  {pubkey} String - Your recipient's public key.
   * @param  {privkey} String - Your private key.
   * @param  {passphrase} String - Your ultra-strong password.
   * @param  {message} String - Your message from the recipient.
   * @return {signed} String - Signed message.
   */
function sign_message(pubkey, privkey, passphrase, message){
    var openpgp = window.openpgp;
    var priv = openpgp.key.readArmored(privkey);
    var pub = openpgp.key.readArmored(pubkey);
    var privKey = priv.keys[0];
    var success = priv.decrypt(passphrase);
    var signed = openpgp.signClearMessage(priv.keys, message);
    return signed;
}