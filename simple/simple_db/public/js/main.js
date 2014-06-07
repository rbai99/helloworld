function add_spec(){
    var all = document.getElementById("specialists_all");
    var username = all.options[all.selectedIndex].text;
    var userid = all.options[all.selectedIndex].value;

    var exist = 0;
    var specialists = document.getElementById("specialists");
    for(var i = 0; i < specialists.options.length; i++){
        if (specialists.options[i].text == username){
            exist = 1;
            break;
        }
    }

    if (exist == 0){
        var new_option = document.createElement('option');
        new_option.text = username;
        new_option.value = userid;
        specialists.add(new_option, null);
    }else{
        alert("already in specialists list");
    }
}

function rm_spec(){
    var specialists = document.getElementById("specialists");
    specialists.remove(specialists.selectedIndex);
}

function submit_check(){
    var specialist_value = "";

    var specialists = document.getElementById("specialists");
    for(var i = 0; i < specialists.options.length; i++){
        specialist_value += specialists.options[i].value;
        if (i < specialists.options.length-1){
            specialist_value += ',';
        }
    }

    var specialist_hide = document.getElementById("specialist_hide");
    specialist_hide.value = specialist_value;
}

