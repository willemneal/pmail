// hello();
// console.log(user);
//

//
var user;
const id = "eiolmadckdfaiiidmdeboedfpjepgfji";

var openpgp = window.openpgp;
var hkp = new openpgp.HKP('https://pgp.mit.edu');


var storPrivkey;
var storPubkey;

async function generateKeys(upload = false){
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


setTimeout(() => {
if(document.getElementById("buttonM") != null){
  document.getElementById("buttonM").addEventListener("click", passClick);
}
document.getElementById("buttonK").addEventListener("click", importClick);
document.getElementById("buttonG").addEventListener("click", genClick);
}, 0)


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
  await generateKeys();
  document.getElementById("priv").value = user.privatekey;
  document.getElementById("pub").value = user.publickey;
}

// chrome.runtime.onMessage.addListener(function(port) {
//   console.log(port)
//   console.assert(port.name == id);
//   port.onMessage.addListener(function(msg) {
//     if (msg.joke == "Knock knock")
//       port.postMessage({question: "Who's there?"});
//     else if (msg.answer == "Madame")
//       port.postMessage({question: "Madame who?"});
//     else if (msg.answer == "Madame... Bovary")
//       port.postMessage({question: "I don't get it."});
//   });
// });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});
    parseRequest(request, sender, sendResponse)
  });

async function parseRequest(request, sender, sendResponse){
  switch(request.type){
    case "user":{
      user = request.user;
      document.getElementById("priv").value = user.privatekey;
      document.getElementById("pub").value = user.publickey;
      storPrivkey = "pmail.privkey-"+user.email;
      storPubkey = "pmail.pubkey-"+user.email;
      if (!localStorage.getItem(storPrivkey)){
        await generateKeys();
      }
      break;
      sendResponse({storPrivkey, storPubkey})
    }
    default:
    console.log("no such type");
      break;
  }

}
