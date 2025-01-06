var inputsAll;
const TYPES = 5;
const MINUTE = 60;
const CHIPS_HEIGHT_1 = 300;
const CHIPS_HEIGHT_2 = 100;
const SAVE_TIMER_EVERY_SECONDS = 5;
const srcs = ["chip white.png", "chip green.png", "chip red.png", "chip blue.png", "chip black.png"];
var maxChips = [50, 50, 100, 50, 50];
var playing = false; // cookie
var paused = false; // cookie
var timeLeft = 0; // cookie
var blindsSmall, blindsBig, blindIndexSmall, blindIndexBig; // cookies

function $(id) { return document.getElementById(id); }
function num(index) { return +inputsAll[index].value; }
function set(id, text) { $(id).innerText = text; }
function getBlinds(id) { return $(id).value.split(" ").map(x => +x).filter(x => x); }
function updateBlindsText(idxSB, idxBB) { $("blinds").textContent = "Блайнды: " + blindsSmall[idxSB] + " / " + blindsBig[idxBB]; }
function hasCookie(name) { return Cookies.get(name) !== undefined; }

function setPlaying(play, indexSB = 0, indexBB = 0, pause = false, time = -1) {
	Cookies.set("playing", playing = play);
	$("timerSetup").style.display = (play ? "none" : "block");
	$("timerMain" ).style.display = (play ? "block" : "none");
	if (play) {
		blindsSmall = getBlinds("inputSB");
		blindsBig   = getBlinds("inputBB");
		if (blindsSmall.length == 0) blindsSmall = [0];
		if (blindsBig  .length == 0) blindsBig   = [0];
		Cookies.set("indexSB", blindIndexSmall = indexSB);
		Cookies.set("indexBB", blindIndexBig   = indexBB);
		Cookies.set("paused", paused = pause);
		$("pause").textContent = (paused ? "Пуск" : "Пауза");
		if (time > 0) // for time saved/loaded via cookies
			resetTimer(time);
		else
			resetTimer();
	} else {
		Cookies.remove("timer");
	}
}

function resetTimer(time) {
	if (arguments.length == 0) time = MINUTE * num(5);
	Cookies.set("timer", timeLeft = time);
	if (blindIndexSmall == blindsSmall.length - 1 &&
		blindIndexBig   == blindsBig  .length - 1) {
		$("timerSub").style.display = "none"; // reached the end
		$("resetHolder").style.display = "flex";
	} else {
		$("timerSub").style.display = "inline-block";
		$("resetHolder").style.display = "none";
	}
	updateBlindsText(blindIndexSmall, blindIndexBig);
}

function updateTimerText() {
	var mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
	var str = mins + ":" + (secs < 10 ? "0" : "") + secs;
	$("timer").textContent = str;
}

function runTimer() {
	updateTimerText();
	if (!playing || paused) {
		setTimeout(runTimer, 1000);
		return;
	}
	if (timeLeft) {
		--timeLeft;
		if (timeLeft % SAVE_TIMER_EVERY_SECONDS == 0)
			Cookies.set("timer", timeLeft);
	} else {
		if (blindIndexSmall < blindsSmall.length - 1) Cookies.set("indexSB", ++blindIndexSmall);
		if (blindIndexBig   < blindsBig  .length - 1) Cookies.set("indexBB", ++blindIndexBig  );
		resetTimer();
	}
	setTimeout(runTimer, 1000);
}

function bindCookieToInput(inputId, cookieName) {
	if (hasCookie(cookieName)) $(inputId).value = Cookies.get(cookieName);
	$(inputId).addEventListener("change", () => Cookies.set(cookieName, $(inputId).value) );
}

window.onload = function() {
	var body = document.body;
	inputsAll = Array.from(document.querySelectorAll("input"));
	for (var input in inputsAll) {
		inputsAll[input].addEventListener("change", recalculate);
	}
	recalculate();
	
	var imgs = document.querySelectorAll("img");
	for (var i = 0; i < TYPES; ++i)
		imgs[i].src = "images/" + srcs[i];
	
	var ch = $("startChipsHolder");
	ch.style.width  = (CHIPS_HEIGHT_2 / 2 * (TYPES + 1)) + "px";
	ch.style.height =  CHIPS_HEIGHT_2 + "px";
	for (var i = 0; i < TYPES; ++i) {
		ch.children[i].style.width = CHIPS_HEIGHT_2 + "px";
		ch.children[i].style.backgroundImage = 'url("images/' + srcs[i] + '")';
		ch.children[i].style.left = i * (CHIPS_HEIGHT_2 / 2) + "px";
	}
	
	$("start").addEventListener("click", () => setPlaying(true ) );
	$("stop" ).addEventListener("click", () => setPlaying(false) );
	$("stop2").addEventListener("click", () => setPlaying(false) );
	$("pause").addEventListener("click", () => {
		Cookies.set("paused", paused = !paused);
		$("pause").textContent = (paused ? "Пуск" : "Пауза");
	});
	bindCookieToInput("inputSB", "SBs");
	bindCookieToInput("inputBB", "BBs");
	bindCookieToInput("timerMins", "roundMinutes");
	bindCookieToInput("ppl", "numPlayers");
	bindCookieToInput("rebuys", "numRebuys");
	bindCookieToInput("rebuyPC", "rebuyPercentage");
	if (hasCookie("playing"))
		setPlaying(
			Cookies.get("playing") == "true",
			Cookies.get("indexSB"),
			Cookies.get("indexBB"),
			Cookies.get("paused") == "true",
			Cookies.get("timer")
		);
	else
		setPlaying(false);
	runTimer();
}

function recalculate() {
	var nom = [num(0), num(1), num(2), num(3), num(4)]; // nominals
	var sumNominals = nom[0] + nom[1] + 2*nom[2] + nom[3] + nom[4];
	var totalBank = sumNominals * 50;
	var players = num(8), rebuys = num(9), rebuyPC = num(10);
	
	var playerDesiredStack = totalBank / players;
	var startPercentage = 1 - rebuys * rebuyPC / 100;
	var stackStart = Math.floor(playerDesiredStack * startPercentage), stackRebuy = 0;
	if (rebuys > 0) stackRebuy = Math.floor((playerDesiredStack - stackStart) / rebuys);
	
	set("bank", totalBank);
	set("stackStart", stackStart);
	set("stackRebuy", stackRebuy);
	
	$("rebuy").style.display = (stackRebuy == 0) ? "none" : "inline";
	
	var ecc = Math.floor(stackStart / sumNominals); // equalChipCount
	var startChips = [ecc, ecc, 2*ecc, ecc, ecc];
	var remainder = stackStart % sumNominals;
	/*var index = 4;
	while (remainder > 0 && index >= 0) {
		var times = Math.floor(remainder / nom[index]);
		startChips[index] += times;
		remainder -= times * nom[index];
		--index;
	}*/
	set("startChips1", startChips[0]);
	set("startChips2", startChips[1]);
	set("startChips3", startChips[2]);
	set("startChips4", startChips[3]);
	set("startChips5", startChips[4]);
	if (remainder > 0) {
		$("plus").style.display = "inline-block";
		$("plus").textContent = "+ " + remainder;
	} else {
		$("plus").style.display = "none";
	}
}

function logCookies() {
	var cookies = document.cookie.split('; ').reduce((acc, cookie) => {
		var [key, value] = cookie.split('=');
		acc[key] = value;
		return acc;
	}, {});
	console.log(cookies);
}