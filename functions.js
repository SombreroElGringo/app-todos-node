


function toggleUserTeamTodos() {
    var x = document.getElementById('userTodos');
    var y = document.getElementById('teamTodos');
    var bx = document.getElementById('buttonUserTodos');
    var by = document.getElementById('buttonTeamTodos');

    if (x.style.display === 'none' && y.style.display === 'block') {
        x.style.display = 'block';
        y.style.display = 'none';
        by.disabled = false;
        bx.disabled = true;
    } else {
        x.style.display = 'none';
        y.style.display = 'block';
        by.disabled = true;
        bx.disabled = false;
    }
}


function changeColor(color) {

  var elt = document.getElementById("body");
	elt.background = "../img/wallpaper"+color+".png";
}
