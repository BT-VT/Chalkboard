const toggleSwitch = document.querySelector('input[type="checkbox"]')
const nav = document.getElementById("toggleColor");

//Dark Mode Style
function darkMode(){
    nav.style.backgroundColor = 'rgb(255 255 255 / 50%)';
}
//Switch theme Dynamically
function switchTheme(event){
    if(event.target.checked){
        document.documentElement.setAttribute('data-theme','dark');
        localStorage.setItem('theme','dark');
        darkMode();
    }else{
        document.documentElement.setAttribute('data-theme','light');
        localStorage.setItem('theme','light');
    }
}

//Event listener
toggleSwitch.addEventListener('change',switchTheme);

const currentTheme = localStorage.getItem('theme');
if (currentTheme){
    document.documentElement.setAttribute('data-theme',currentTheme);
    if(currentTheme==='dark'){
        toggleSwitch.checked = true;
        darkMode();
    }
}
