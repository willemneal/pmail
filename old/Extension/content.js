var resources =  ['jquery-1.10.2.min.js',
                  //'jquery-3.0.0.min.js',
                  //'jquery-3.1.1.min.js',
                  // 'search.js',
                  'load.js',
                  'hashes.js',
                  'kbpgp-2.0.8.js',
                  'gmail.js', 
                  'websocket.js',
                  // 'index.js',                 
                  'sjcl.js',
                  'openpgp.js',
                  'long.js',
                  'main.js'
                  ];

function loadResource(resource_name) {
  console.log("loading " + resource_name)
  var script = document.createElement('script');
  script.src = chrome.extension.getURL(resource_name);
  (document.head || document.documentElement).appendChild(script);
}

/*
var choice = confirm("Do you want to use Pmail for this account?");
if(choice == true){
  for (i in resources) {
    loadResource(resources[i]);
  }  
}else{
  alert("Pmail is turned off for this account. Every sent and received email will be in plaintext. Also, you are not able to read encrypted emails.");
}
*/

for (i in resources) {
    loadResource(resources[i]);
  }