const socket = io();
//--------------------------------------------------Elements--------------------------------------------------//
const canvasElem = document.querySelector('#canvas');
const ctx = canvasElem.getContext('2d');
const clientElem = document.querySelector('#clientElem');
const cursorElem = document.querySelector('#cursorELem');

//game
const barks = ["bark1.wav","bark2.wav","bark3.wav","sniff1.wav"];
const imageProperties = {cucumber:{w:995,h:256,src:"cucumber.png",ratio2Screen:0.2},errorShibe:{w:352,h:346,src:"errorShibe.png",ratio2Screen:0.2},
    shiba:{w:321,h:412,src:"shiba.png",ratio2Screen:0.2},shibaWithCucu:{w:321,h:412,src:"shibaWithCucu.png",ratio2Screen:0.2}};
var maxSpeed = 10;
var i = 0;

var keysdown = {}; //stores false and true values of keys pressed
var particles = []; //stores all particles affected by players
var clientPlayer = {posVector:{x:0,y:0},velVector:{x:0,y:0},container:{img:imageProperties["shiba"],hitBoxCircle:{r:5}, mass:5},maxSpeed:30, name:"xXxTremGamerxXx", health:3};

var otherplayers = {}; //stores all players

var cursorPos = {x:0,y:0};
var field = {x:0,y:0};

// window.addEventListener("load", setup);
function setup(){ //setup function is called when HTML was loaded successfully
    adjustCanvasSize();
}

function updatePositions(elem,parentDivID) { //every element must have a key with posVector:x,y and container:img:w,h

    for (let key in elem) {
        let currentElem = elem[key];

        var elementDOM = document.getElementById(key);

        var sizex = 0;
        var sizey = 0;

        //console.log("CurrentElement: ");


        currentElem = convertElementToClientResolution(currentElem);

        if (parentDivID === "cucumbers"){
            console.log(currentElem);
        }

        if (key === socket.id) {
            sizex = currentElem.container.img.w * currentElem.container.img.ratio2Screen;
            sizey = currentElem.container.img.h * currentElem.container.img.ratio2Screen;

            clientPlayer.container = currentElem.container;
            clientPlayer.mass = currentElem.mass;

            clientElem.style.width = `${sizex}px`;
            clientElem.style.height = `${sizey}px`;
            continue;
        }//doesn't execute if key belongs to this client

        //console.log(parentDivID);
        if (elementDOM === null) {

            var parentID = document.getElementById(parentDivID);
            //console.log(parentID);
            let newDiv = document.createElement("div");
            let newImg = document.createElement("img");

            newDiv.appendChild(newImg);
            parentID.appendChild(newDiv);
            var className = "";

            if (parentDivID === "otherPlayers") {
                className = "cursor";
            } else if (parentDivID === "cucumbers") {
                className = "cucu";
            }
            newImg.className = className;
            newImg.alt = className;
            newImg.src = currentElem.container.img.src;
            newImg.id = key;
            elementDOM = document.getElementById(key);
            console.log("CREATED!");
            console.log(elementDOM);
        }
        let x = (currentElem.posVector.x - (currentElem.container.img.w * currentElem.container.img.ratio2Screen / 2)); // * field.maxX;
        let y = (currentElem.posVector.y - (currentElem.container.img.h * currentElem.container.img.ratio2Screen / 2)); // * field.maxY;

        sizex = currentElem.container.img.w * currentElem.container.img.ratio2Screen;
        sizey = currentElem.container.img.h * currentElem.container.img.ratio2Screen;

        elementDOM.style.width = `${sizex}px`;
        elementDOM.style.height = `${sizey}px`;
        elementDOM.style.transform = "translate(" + x + "px, " + y + "px)";

    }
}

socket.on('sendCoordinates',function(elements, parentDivID) {
    updatePositions(elements,parentDivID);
});

document.addEventListener('mousedown',function(e){
    if (keysdown["ControlLeft"]){
        socket.emit('placeCucumber',e);
    }
    socket.emit('arf',e);
});

document.addEventListener('keydown',function(event){

    if (event.code === "ControlLeft"){
        console.log("Henlo!");
        keysdown[event.code] = true;
    }
});


canvasElem.addEventListener('mousemove',setMouseCoordinates);

window.addEventListener('resize',adjustCanvasSize);

function adjustCanvasSize(){ //takes window properties and sets canvas to its size
    field.x = window.innerWidth;
    field.y = window.innerHeight;

    canvasElem.style.width = field.x + "px";
    canvasElem.style.height = field.y + "px";
}



function setMouseCoordinates(e){
    cursorPos = {x:e.offsetX,y:e.offsetY};
    cursorElem.style.transform = "translate(" + cursorPos.x + "px, " + cursorPos.y + "px)";
}

setInterval(moveHandler,1000/200);
function moveHandler(){
    if (equalVector(clientPlayer.posVector,cursorPos)) return; //only executes if vectors are unequal
    let cliPos = clientPlayer.posVector;
    let distance = distanceOfVectors(cursorPos,cliPos);
    if (distance<=clientPlayer.maxSpeed){distance = clientPlayer.maxSpeed} //caps distance at max speed of player
    clientPlayer.velVector = subVectors(cursorPos,cliPos);
    clientPlayer.velVector = factorVector(clientPlayer.velVector,clientPlayer.maxSpeed/distance);

    cliPos = clientPlayer.posVector = addVectors(cliPos,clientPlayer.velVector);
    //let imgx =
    let imgPos = factorVector({x:clientPlayer.container.img.w,y:clientPlayer.container.img.h},clientPlayer.container.img.ratio2Screen);
    clientElem.style.transform = "translate(" + (cliPos.x - imgPos.x/2) + "px, " + (cliPos.y - imgPos.y/2)+ "px)";

    //console.log("maxSpeed: "+clientPlayer.maxSpeed+" vel x: "+clientPlayer.velVector.x+" vel y: "+clientPlayer.velVector.y);

    //console.log(clientElem.getAttribute("src")+" x: "+(cliPos.x - (clientPlayer.container.img.w/2))+" y: "+(cliPos.y - (clientPlayer.container.img.h/2)));
    let relCliPos = makeRelativeVector(cliPos);

    //console.log(relCliPos);
    socket.emit('sent values',relCliPos);
}

socket.on('removePlayer',function(socketID){
    var node = document.getElementById(socketID);
    node.remove(); //UNSURE
    (`${socketID}`).removeItem();
});

socket.on('someArf',function(bark,socketID){
    let audio = new Audio(bark);
    audio.playbackRate
        = 0.6;
    audio.loop = true;
    audio.play();

    /*
    var myVar = setInterval(function (){
        audio.pause();
        console.log("Paused");

        if (audio.ended){
            clearInterval(myVar);
        }
        audio.load();
    }, 10);
    */

});

socket.on('onconnect',setup);

socket.on('test123',function(){
    console.log("test123");
});

function calcDistance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(y2-y1,2)+Math.pow(x2-x1,2));
}

function distanceOfVectors(vector1, vector2){
    return Math.sqrt(Math.pow(vector2.y-vector1.y,2)+Math.pow(vector2.x-vector1.x,2));
}

function addVectors(vector1, vector2){
    let x = vector1.x +vector2.x;
    let y = vector1.y + vector2.y;
    return {x:x,y:y};
}

function subVectors(vector1,vector2){
    let x = vector1.x - vector2.x;
    let y = vector1.y - vector2.y;
    return {x:x,y:y};
}

function factorVector(vector, factor, factorIsVector=false){
    let x;
    let y;
    if (factorIsVector){
        x = vector.x * factor.x;
        y = vector.y * factor.y;
    } else {
        x = vector.x * factor;
        y = vector.y * factor;
    }
    //console.log("vX,vY,factor, respX,respY: ",vector.x,vector.y,factor, x,y);
    return {x:x,y:y};
}

function equalVector(vector1,vector2){
    return vector1.x === vector2.x && vector1.y === vector2.y;
}

Math.clamp = function(value, min, max){
    if(value < min){
        return min;
    }else if(value > max){
        return max;
    }else{
        return value;
    }
}; //definition of a math function named clamp

function makeRelativeVector(vector){
    let x = vector.x/field.x;
    let y = vector.y/field.y;
    return {x:x,y:y}
}

function convertElementToClientResolution(element,reverse=false){
    let fieldX = field.x;
    let fieldY = field.y;
    if (reverse){
        fieldX = 1/field.x;
        fieldY = 1/field.y;
    }

    if (element.hasOwnProperty("posVector")) {
        //console.log(element.posVector);
        element.posVector = factorVector(element.posVector,field,true);
        //return element;
    }
    /*
    if (element.hasOwnProperty("velVector")){
        element.velVector.x *= fieldX;
        element.velVector.y *= fieldY;
    }
    if (element.hasOwnProperty("accVector")) {
        element.accVector.x *= fieldX;
        element.accVector.y *= fieldY;
    }
    */
    //console.log(element);
    return element;
}

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
        end = new Date().getTime();
    }
}