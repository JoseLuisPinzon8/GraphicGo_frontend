document.getElementById('version').innerHTML = _.VERSION;
window._ = _;
var editor = ace.edit("code");
editor.getSession().setTabSize(2);
editor.getSession().setMode("ace/mode/python");
document.getElementById('execute').addEventListener('click', function() {
    var codigo = editor.getSession().getValue()
    var blob = new Blob([codigo], { type: 'text/plain' });
    var file = new File([blob], "myfile.txt", {type: "text/plain"});
    var formData = new FormData();
    formData.append("myfile", file);
    console.log(formData);
    axios.post('http://localhost:4567/analize', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }).then(function (res) {
        console.log('SUCCESS!!');
        console.log(res);
    })
    .catch(function () {
        console.log('FAILURE!!');
    });
    //document.getElementById('result').innerHTML = result;
});
