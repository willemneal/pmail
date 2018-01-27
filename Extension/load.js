/*
load.js
first script to run, put things here that need to happen first/fast.
Loaded before gmail or encryption objects are created
use onload to run as soon as dom is done being rendered
*/
console.log('load.js loaded');

/*BAD RANDOM.JS/SJCL-PRNG.JS ENTROPY GENERATOR
function entropy(){
   console.log('Entropy level: '.concat(random.getProgress(1024)));
   ready = random.isReady(1024);
   if (!ready && collectingEntropy == false){
   		collectingEntropy = true;
    	random.startCollectors();
    	console.log('Collecting Entropy: ');
   }else if (ready && collectingEntropy == true){
   		collectingEntropy = false;
   		random.stopCollectors();
   		console.log('Stopped Collecting Entropy');
   }
}
*/

/*random alternatives:
var arry = new Uint32Array(10);
window.crypto.getRandomValues(array);
OR
use a new key pair private key
*/



window.onload = function(){
	/*failed random setup
	//GLOBALS MAY BE BAD HERE
	collectingEntropy = false;
	random = new sjcl.prng(1024);
	console.log(random);
	intervalEntropy = setInterval(entropy, 1000); //SHOULD USE A EVENTLISTENER HERE INSTEAD
	*/

	
  /* DECRYPTED SNIPPETS TO BE IMPLEMENTED HERE
  var x = $('[role="main"]').find('.Cp').find('tr')
  for (var i = 0; i < x.length; i++){
    $(x[i]).find('.y6').find('span')[1].innerHTML = //new snippet
  }
  */
}