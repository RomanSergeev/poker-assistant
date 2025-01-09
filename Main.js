const TYPES = 5;
const MINUTE = 60;
const CHIPS_HEIGHT_1 = 15;
const CHIPS_HEIGHT_2 = 2;
const SAVE_TIMER_EVERY_SECONDS = 5;
const IMGPATH = "./Images/";
const srcs = ["Chip white.png", "Chip green.png", "Chip red.png", "Chip blue.png", "Chip black.png"];
var maxChips = [50, 50, 100, 50, 50];
var playing = false; // cookie
var paused = false; // cookie
var timeLeft = 0; // cookie
var blindsSmall, blindsBig, blindIndexSmall, blindIndexBig; // cookies
var inputsAll;

function $(id) { return document.getElementById(id); }
function num(index) { return +inputsAll[index].value; }
function set(id, text) { $(id).textContent = text; }
function getBlinds(id) { return $(id).value.split(" ").map(x => +x).filter(x => x); }
function updateBlindsText(idxSB, idxBB) { set("blinds", "Блайнды: " + blindsSmall[idxSB] + " / " + blindsBig[idxBB]); }
function hasCookie(name) { return Cookies.get(name) !== undefined; }
function tcn(name, turnOn) { if (turnOn) document.body.classList.add(name); else document.body.classList.remove(name); } // toggle class name
function setPaused(p) { Cookies.set("paused", paused = p); set("pause", p ? "Пуск" : "Пауза"); }
function applyToAllInputs(f) {
	for (var input in inputsAll)
		f(inputsAll[input]);
}

function setPlaying(play, indexSB = 0, indexBB = 0, pause = false, time = -1) {
	Cookies.set("playing", playing = play);
	tcn("playing", play);
	if (play) {
		blindsSmall = getBlinds("inputSB");
		blindsBig   = getBlinds("inputBB");
		if (blindsSmall.length == 0) blindsSmall = [0];
		if (blindsBig  .length == 0) blindsBig   = [0];
		Cookies.set("indexSB", blindIndexSmall = indexSB);
		Cookies.set("indexBB", blindIndexBig   = indexBB);
		setPaused(pause);
		if (time > 0) // for time saved/loaded via cookies
			resetTimer(time);
		else
			resetTimer();
		$("chip1").setAttribute("disabled", "");
		applyToAllInputs(input => input.disabled = " ");
	} else {
		Cookies.remove("timer");
		tcn("done", false); // just for a clean classname
		applyToAllInputs(input => input.removeAttribute("disabled"));
	}
}

function resetTimer(time) {
	if (arguments.length == 0) time = MINUTE * num(5);
	Cookies.set("timer", timeLeft = time);
	tcn("done",
		blindIndexSmall == blindsSmall.length - 1 &&
		blindIndexBig   == blindsBig  .length - 1);
	updateBlindsText(blindIndexSmall, blindIndexBig);
}

function updateTimerText() {
	var mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
	var str = mins + ":" + (secs < 10 ? "0" : "") + secs;
	set("timer", str);
}

function runTimer() {
	if (!playing || paused) {
		setTimeout(runTimer, 1000);
		return;
	}
	updateTimerText();
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
	else Cookies.set(cookieName, $(inputId).value);
	$(inputId).addEventListener("change", () => Cookies.set(cookieName, $(inputId).value) );
}

document.addEventListener("DOMContentLoaded", function() {
	var body = document.body;
	inputsAll = Array.from(document.querySelectorAll("input"));
	applyToAllInputs(input => input.addEventListener("change", recalculate));
	recalculate();
	
	var imgs = document.querySelectorAll("img");
	for (var i = 0; i < TYPES; ++i)
		imgs[i].src = IMGPATH + srcs[i];
	
	// can be done with styles only
	var ch = $("startChipsHolder");
	for (var i = 0; i < TYPES; ++i) {
		ch.children[i].style.backgroundImage = 'url("' + IMGPATH + srcs[i] + '")';
		ch.children[i].style.left = i * (CHIPS_HEIGHT_2 / 2) + "rem";
	}
	
	$("start").addEventListener("click", () => setPlaying(true ) );
	$("stop" ).addEventListener("click", () => setPlaying(false) );
	$("stop2").addEventListener("click", () => setPlaying(false) );
	$("pause").addEventListener("click", () => setPaused(!paused));
	bindCookieToInput("chip1"    , "chipValueWhite" );
	bindCookieToInput("chip2"    , "chipValueGreen" );
	bindCookieToInput("chip3"    , "chipValueRed"   );
	bindCookieToInput("chip4"    , "chipValueBlue"  );
	bindCookieToInput("chip5"    , "chipValueBlack" );
	bindCookieToInput("inputSB"  , "SBs"            );
	bindCookieToInput("inputBB"  , "BBs"            );
	bindCookieToInput("timerMins", "roundMinutes"   );
	bindCookieToInput("ppl"      , "numPlayers"     );
	bindCookieToInput("rebuys"   , "numRebuys"      );
	bindCookieToInput("rebuyPC"  , "rebuyPercentage");
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
});

// update span texts based on input values
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
	tcn("withRebuys", stackRebuy);
	
	var ecc = Math.floor(stackStart / sumNominals); // equalChipCount
	var startChips = [ecc, ecc, 2*ecc, ecc, ecc];
	var remainder = stackStart % sumNominals;
	set("startChips1", startChips[0]);
	set("startChips2", startChips[1]);
	set("startChips3", startChips[2]);
	set("startChips4", startChips[3]);
	set("startChips5", startChips[4]);
	set("plus", "+ " + remainder);
	tcn("evenChips", !remainder);
}

// debug purposes: log existing cookies as an object
function logCookies() {
	var cookies = document.cookie.split('; ').reduce((acc, cookie) => {
		var [key, value] = cookie.split('=');
		acc[key] = value;
		return acc;
	}, {});
	console.log(cookies);
}

// wakeLock: keep the screen on (by ChatGPT)
let wakeLock = null;

async function enableWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Screen wake lock enabled.");
    } catch (err) {
        console.error("Failed to enable wake lock:", err);
    }
}

function disableWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
        console.log("Screen wake lock disabled.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    enableWakeLock();
});