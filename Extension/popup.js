function popup() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "start"});
   });
  document.getElementById("button1").disabled = true;
}

document.addEventListener("DOMContentLoaded", function() {
    if(document.getElementById("button1") != null){
        document.getElementById("button1").addEventListener("click", popup);
    }
});